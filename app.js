const fs = require('fs');
const path = require('path');
const readline = require('readline');
const WebSocket = require('ws');
const SpotifyWebApi = require('spotify-web-api-node');
const tmi = require('tmi.js');
const { google } = require('googleapis');
const express = require('express'); // <-- Added Express
const config = require('./config.js');

let requestQueue = [];
let currentSong = { value: null };
let voteSkipUsers = new Set();
let activeDeviceId = null;
let userRequestCount = {};
let userCooldowns = {};
let seenMessages = { twitch: new Set(), youtube: new Set(), tiktok: new Set() };

// Load persisted queue
try {
  const data = JSON.parse(fs.readFileSync(config.REQUEST_FILE));
  requestQueue = Array.isArray(data) ? data : [];
} catch {
  requestQueue = [];
}

// Load commands
const commands = {};
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmdModule = require(`./commands/${file}`);
  if (cmdModule.name && cmdModule.commands) {
    commands[cmdModule.name] = cmdModule.commands;
  } else {
    console.log(`⚠️ Invalid command file: ${file}`);
  }
}

// ------------------ Express overlay ------------------
const app = express();
const OVERLAY_PORT = config.OVERLAY_PORT || 8080;

// Serve overlay folder
app.use('/', express.static(path.join(__dirname, 'overlay')));

app.listen(OVERLAY_PORT, () => {
  console.log(`🎧 Overlay server running on http://localhost:${OVERLAY_PORT}`);
});

// ------------------ WebSocket server ------------------
const wss = new WebSocket.Server({ port: OVERLAY_PORT + 1 });
let clients = [];
wss.on('connection', ws => {
  clients.push(ws);
  ws.on('close', () => clients = clients.filter(c => c !== ws));
});

function updateOverlay() {
  const data = JSON.stringify({ currentSong: currentSong.value, queue: requestQueue, votes: voteSkipUsers.size });
  clients.forEach(ws => { if (ws.readyState === 1) ws.send(data); });
}

// ------------------ Spotify setup ------------------
let token;
try { token = JSON.parse(fs.readFileSync('token.json')); }
catch { console.error("Run auth.js first"); process.exit(); }

const spotify = new SpotifyWebApi({
  clientId: config.SPOTIFY.CLIENT_ID,
  clientSecret: config.SPOTIFY.CLIENT_SECRET,
  redirectUri: config.SPOTIFY.REDIRECT_URI,
  refreshToken: token.refresh_token
});

async function refreshSpotify() {
  const data = await spotify.refreshAccessToken();
  spotify.setAccessToken(data.body.access_token);
}

async function getActiveDevice() {
  await refreshSpotify();
  const devices = await spotify.getMyDevices();
  if (!devices.body.devices.length) return null;
  const active = devices.body.devices.find(d => d.is_active) || devices.body.devices[0];
  return active.id;
}

async function searchTrack(query) {
  await refreshSpotify();
  const res = await spotify.searchTracks(query, { limit: 1 });
  return res.body.tracks.items[0] || null;
}

// ------------------ Music playback ------------------
async function playNext(auto = false) {
  if (!requestQueue.length) {
    currentSong.value = null;
    updateOverlay();
    if (!auto) console.log("Queue empty");
    return;
  }
  const next = requestQueue.shift();
  currentSong.value = next;
  voteSkipUsers.clear();
  if (!activeDeviceId) activeDeviceId = await getActiveDevice();
  if (!activeDeviceId) return console.log("No active device");
  await refreshSpotify();
  try { await spotify.play({ device_id: activeDeviceId, uris: [next.track.uri] }); }
  catch (e) { console.log("Spotify play error:", e.message); }
  updateOverlay();
  saveQueue();
  console.log(`🎶 Now playing: ${next.track.name} (requested by ${next.requestedBy})`);
}

// ------------------ Queue handling ------------------
function saveQueue() {
  fs.writeFileSync(config.REQUEST_FILE, JSON.stringify(requestQueue, null, 2));
}

// ------------------ Command handler ------------------
async function handleCommand(platform, user, message) {
  if (!message.startsWith(config.REQUEST_PREFIX)) return;
  const args = message.slice(config.REQUEST_PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === "request") {
    const query = args.join(" ");
    if (!query) return;
    return requestSong(platform, user, query);
  }

  for (const mod in commands) {
    if (commands[mod][cmd]) {
      try {
        const result = await commands[mod][cmd](user, platform, args, { currentSong, playNext, requestQueue, commands });
        if (result) console.log(result);
        return;
      } catch (err) {
        console.error(`Error executing command [${cmd}] from module [${mod}]:`, err);
      }
    }
  }

  console.log(`[${platform}] Unknown command: ${cmd}`);
}

async function requestSong(platform, user, query) {
  const id = platform + ':' + query + ':' + user;
  if (seenMessages[platform].has(id)) return;
  seenMessages[platform].add(id);

  const isAdmin = config.ADMINS[platform]?.includes(user);
  if (!isAdmin) {
    if (config.BANNED_USERS[platform]?.includes(user)) return;
    if (!userRequestCount[user]) userRequestCount[user] = 0;
    if (userRequestCount[user] >= config.MAX_REQUESTS_PER_USER) return console.log(`${user} reached max requests`);
    const now = Date.now();
    if (userCooldowns[user] && now - userCooldowns[user] < config.COOLDOWN_SECONDS * 1000) return console.log(`${user} on cooldown`);
  }

  const track = await searchTrack(query);
  if (!track) return console.log(`[Queue] Song not found for ${user}: ${query}`);
  requestQueue.push({ track, requestedBy: user });
  if (!isAdmin) userRequestCount[user]++;
  userCooldowns[user] = Date.now();
  saveQueue();
  console.log(`[Queue] ${user} requested: ${track.name}`);
  if (!currentSong.value) playNext();
}

// ------------------ Console commands ------------------
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', async line => handleCommand("console", "console", line));

// ------------------ Auto play check ------------------
setInterval(() => { if (!currentSong.value && requestQueue.length) playNext(true); }, 4000);

// ------------------ Twitch ------------------
if (config.STREAMING_PLATFORMS.includes('twitch')) {
  const twitchClient = new tmi.Client({ channels: [config.TWITCH_CHANNEL] });
  twitchClient.connect();
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self || !message) return;
    handleCommand("twitch", tags['display-name'], message);
  });
  console.log("📡 Twitch connected");
}

// ------------------ TikTok ------------------
if (config.STREAMING_PLATFORMS.includes('tiktok')) {
  try {
    const TikTokConnector = require('./platforms/tiktok');
    if (!global._tiktokInitialized) {
      TikTokConnector({ username: config.TIKTOK.USERNAME }, (user, msg) => {
        if (!msg) return;
        handleCommand("tiktok", user, msg);
      });
      console.log("📡 TikTok connected");
      global._tiktokInitialized = true;
    }
  } catch (e) {
    console.log("TikTok error:", e.message);
  }
}

// ------------------ YouTube ------------------
if (config.STREAMING_PLATFORMS.includes('youtube')) {
  const youtube = google.youtube({ version: 'v3', auth: config.YOUTUBE_API_KEY });
  let lastYouTubeMessageId = null;

  async function pollYouTube(liveChatId) {
    try {
      const res = await youtube.liveChatMessages.list({ liveChatId, part: 'snippet,authorDetails', maxResults: 50 });
      if (res.data.items && res.data.items.length) {
        for (let i = res.data.items.length - 1; i >= 0; i--) {
          const item = res.data.items[i];
          if (item.id === lastYouTubeMessageId) break;
          const user = item.authorDetails.displayName;
          const msg = item.snippet.displayMessage;
          if (!msg) continue;
          handleCommand("youtube", user, msg);
        }
        lastYouTubeMessageId = res.data.items[0].id;
      }
    } catch (err) {
      console.error("YouTube poll error:", err.message);
    }
    setTimeout(() => pollYouTube(liveChatId), 5000);
  }

  pollYouTube(config.YOUTUBE_LIVECHAT_ID);
  console.log("📡 YouTube LiveChat polling active");
}

console.log(`🎧 Multi-platform bot started! Overlay: http://localhost:${OVERLAY_PORT}`);
