const fs = require('fs');
const readline = require('readline');
const SpotifyWebApi = require('spotify-web-api-node');
const config = require('./config');

// Create Spotify API instance
const spotifyApi = new SpotifyWebApi({
  clientId: config.SPOTIFY.CLIENT_ID,
  clientSecret: config.SPOTIFY.CLIENT_SECRET,
  redirectUri: config.SPOTIFY.REDIRECT_URI
});

// Generate auth URL
const scopes = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative'
];

const authUrl = spotifyApi.createAuthorizeURL(scopes, 'state123');

console.log("🔗 Go to this URL and authorize the app:\n");
console.log(authUrl, "\n");

// Wait for code
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Enter the code from the URL: ", async (code) => {
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    fs.writeFileSync('token.json', JSON.stringify({ access_token, refresh_token, expires_in }, null, 2));
    console.log("✅ Token saved to token.json!");
    console.log(`Refresh token: ${refresh_token}`);
  } catch (err) {
    console.error("❌ Error getting token:", err);
  } finally {
    rl.close();
  }
});
