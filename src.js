(function () {

const hash = parseHash(document.location.hash);
const location = 'https://luminoray.github.io/kk-denpa-receiver/';
const clientId = '1ga8qsv5fm5hxz0b2ntkwykdre5euz';

const elSender = document.getElementsByClassName('sender')[0];
const elProgressFill = document.getElementsByClassName('progress-filling')[0];

let progress = 0;
const difficulty = 5;

const users = [];

let websocket;

if (hash.access_token === undefined) {
    window.location.replace('https://id.twitch.tv/oauth2/authorize?' + new URLSearchParams(
        {
            client_id: clientId,
            response_type: 'token',
            redirect_uri: location,
            scope: 'channel:read:redemptions'
        }
    ).toString());

    return;
}

// Get the user id from the channel
fetch('https://api.twitch.tv/helix/users?login=KKCYBER', {
    "method": "GET",
    "headers": {
        "Authorization": "Bearer " + hash.access_token,
        "Client-Id": clientId
    }
}).then((response) => {
    return response.json();
}).then((data) => {
    // Then open the websocket and process the messages
    const userId = data.data[0].id;
    websocket = new WebSocket('wss://eventsub.wss.twitch.tv/ws');

    websocket.onmessage = (e) => {
        const message = JSON.parse(e.data);

        if (! userId) {
            return;
        }
    
        if (message.metadata.message_type === 'session_welcome') {
            subscribeToChannelRedemptions(userId, message.payload.session.id);
            return;
        }
    
        if (message.metadata.message_type === 'notification') {
            if (message.payload.event.reward.title === "The 1 point test") {
                users.push(message.payload.event.user_name);
            }
        }
    }
});

function parseHash(hash) {
    const hashValues = {};
    const segments = hash.substring(1).split('&');
    for (segment of segments) {
        let key, value;
        [key, value] = segment.split('=');
        hashValues[key] = value;
    }
    return hashValues;
}

function subscribeToChannelRedemptions(userId, sessionId) {
    const subscription = {
        "type":"channel.channel_points_custom_reward_redemption.add",
        "version":"1",
        "condition":{"broadcaster_user_id": userId, "user_id": userId},
        "transport": {
            "method": "websocket",
            "session_id": sessionId
        }
    }

    fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        "method": "POST",
        "body": JSON.stringify(subscription),
        "headers": {
            "Authorization": "Bearer " + hash.access_token,
            "Client-Id": clientId,
            "Content-Type": "application/json"
        }
    });
}

const interval = setInterval(updateProgress, 250);

function updateProgress() {
    if (progress > 0) {
        progress += 0.1;
    }
    if (progress > difficulty) {
        clearInterval(interval);
        progress = difficulty;
        websocket.close();
    }
    const currentUser = users.shift();
    if (currentUser !== undefined) {
        elSender.innerHTML = 'K:\\' + currentUser + '.sdr';
        progress += 1;
    }
    elProgressFill.style.width = Math.floor((progress*100)/difficulty).toString() + '%';
}

})();