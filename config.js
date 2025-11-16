module.exports = {
  REQUEST_PREFIX: "!",
  REQUEST_FILE: "./requests.json",
  OVERLAY_PORT: 8080,
  COOLDOWN_SECONDS: 30,
  MAX_REQUESTS_PER_USER: 3,
  VOTE_THRESHOLD: 3,

  STREAMING_PLATFORMS: ["twitch", "youtube", "tiktok"],

  // Twitch
  TWITCH_CHANNEL: "yourTwitchChannel",
  ADMINS: {
    twitch: ["yourTwitchUsername"],
    youtube: ["yourYouTubeUsername"],
    tiktok: ["yourTikTokUsername"]
  },
  BANNED_USERS: {
    twitch: [],
    youtube: [],
    tiktok: []
  },

  // Spotify
  SPOTIFY: {
    CLIENT_ID: "yourSpotifyClientId",
    CLIENT_SECRET: "yourSpotifyClientSecret",
    REDIRECT_URI: "http://localhost:8888/callback"
  },

  // YouTube
  YOUTUBE_API_KEY: "yourYouTubeApiKey",
  YOUTUBE_LIVECHAT_ID: "yourLiveChatId",

  // TikTok
  TIKTOK: {
    USERNAME: "yourTikTokUsername"
  }
};
