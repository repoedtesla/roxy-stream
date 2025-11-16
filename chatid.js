const axios = require('axios');

// Replace with your YouTube API key
const API_KEY = 'AIzaSyB5BTDFcgAWZ3CFGgsOmRhPnaxpZaW0XDk';
// Replace with your video ID
const VIDEO_ID = 'jSDKeVxV8Co';

async function getLiveChatId() {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'liveStreamingDetails',
                id: VIDEO_ID,
                key: API_KEY
            }
        });

        const video = response.data.items[0];
        if (video && video.liveStreamingDetails && video.liveStreamingDetails.activeLiveChatId) {
            console.log('Live Chat ID:', video.liveStreamingDetails.activeLiveChatId);
        } else {
            console.log('No active live chat found for this video.');
        }
    } catch (error) {
        console.error('Error fetching live chat ID:', error.response ? error.response.data : error.message);
    }
}

getLiveChatId();
