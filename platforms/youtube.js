const { google } = require('googleapis');

module.exports = function initYouTube(config, handleMessage) {
    const youtube = google.youtube({ version: 'v3', auth: config.apiKey });

    async function pollChat(liveChatId) {
        const res = await youtube.liveChatMessages.list({
            liveChatId,
            part: 'snippet,authorDetails'
        });
        if (!res.data.items) return;
        for (const item of res.data.items) {
            const user = item.authorDetails.displayName;
            const msg = item.snippet.displayMessage;
            console.log(`[YouTube] ${user}: ${msg}`);
            handleMessage("youtube", user, msg);
        }
        setTimeout(() => pollChat(liveChatId), 5000);
    }

    return { pollChat };
};
