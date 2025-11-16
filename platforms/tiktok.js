const { WebcastPushConnection } = require('tiktok-live-connector');

module.exports = function initTikTok(config, handleMessage) {
    const tiktok = new WebcastPushConnection(config.username);

    tiktok.connect().then(() => console.log("📡 TikTok connected"));

    tiktok.on("chat", async data => {
        console.log(`[TikTok] ${data.uniqueId}: ${data.comment}`);
        handleMessage("tiktok", data.uniqueId, data.comment);
    });

    tiktok.sendMessageSafe = async (msg) => {
        try { await tiktok.sendMessage(msg); } catch {}
    };

    return tiktok;
};
