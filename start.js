// Updated startup script with interactive prompts for platform selection and YouTube LiveChat ID.
// This file will run BEFORE your main bot and update config.js dynamically.

const fs = require('fs');
const readline = require('readline');
const configPath = './config.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(q) {
  return new Promise(res => rl.question(q, ans => res(ans.trim())));
}

(async () => {
  console.log("\n=== Streaming Platform Setup ===\n");

  let platforms = await ask("What platforms are you streaming on? (twitch, youtube, tiktok, multiple separated by comma): ");
  platforms = platforms.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);

  let youtubeId = '';
  if (platforms.includes('youtube')) {
    youtubeId = await ask("Enter your YouTube LiveChat ID: ");
  }

  // Load existing config
  let configText = fs.readFileSync(configPath, 'utf8');

  // Replace platform list
  configText = configText.replace(/STREAMING_PLATFORMS: \[[^\]]*\]/, `STREAMING_PLATFORMS: [${platforms.map(p => `'${p}'`).join(', ')}]`);

  // Replace YT chat ID
  configText = configText.replace(/YOUTUBE_LIVECHAT_ID: ['\"][^'\"]*['\"]/, `YOUTUBE_LIVECHAT_ID: '${youtubeId}'`);

  fs.writeFileSync(configPath, configText);

  console.log("\nConfiguration updated! Starting main bot...\n");
  rl.close();

  // Start main bot automatically
  require('./app.js');
})();
