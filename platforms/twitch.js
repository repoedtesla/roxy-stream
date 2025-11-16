const tmi = require('tmi.js');

module.exports = function initTwitch(config, handleMessage) {
    const client = new tmi.Client({ channels: [config.username] });
    client.connect();
    client.on('message', (channel, tags, message, self) => {
        if (self) return;
        console.log(`[Twitch] ${tags['display-name']}: ${message}`);
        handleMessage("twitch", tags['display-name'], message);
    });

    client.sendMessageSafe = async (msg) => { client.say(config.username, msg); };
    return client;
};
