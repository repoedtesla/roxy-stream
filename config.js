module.exports = {
    REQUEST_PREFIX: "!",
    COOLDOWN_SECONDS: 30,
    MAX_REQUESTS_PER_USER: 3,
    VOTE_THRESHOLD: 3,

    ADMINS: {
        tiktok: ["dih.doh"],
        twitch: ["stolenbmws"],
        youtube: ["ytAdmin"]
    },

    BANNED_USERS: {
        tiktok: [],
        twitch: [],
        youtube: []
    },

    SPOTIFY: {
        CLIENT_ID: "bc134fe3c11c481795a4432a130f00dd",
        CLIENT_SECRET: "3cd56d4d101c42128905f6c690382f7b",
        REDIRECT_URI: "http://127.0.0.1:8888/callback"
    },

    YOUTUBE_API_KEY: "AIzaSyB5BTDFcgAWZ3CFGgsOmRhPnaxpZaW0XDk",
    YOUTUBE_LIVECHAT_ID: '', 

    TWITCH_CHANNEL: "stolenbmws", 

    STREAMING_PLATFORMS: ['twitch'],   // <–– which platforms to boot
    PLATFORMS: ["tiktok", "twitch", "youtube"],  

    TIKTOK: {
        USERNAME: "dih.doh"   // <–– used for uniqueId
    },

    OVERLAY_PORT: 8080,
    REQUEST_FILE: "./requestQueue.json"
};
