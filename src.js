(function () {
const elSender = document.getElementsByClassName('sender')[0];
const elProgressFill = document.getElementsByClassName('progress-filling')[0];

let progress = 0;
const difficulty = 100;

const users = [];

const websocket = new WebSocket('wss://pubsub-edge.twitch.tv/v1');

websocket.onopen = function() {
    websocket.send('{"type":"PING"}');
    websocket.send('{"data":{"topics":["community-points-channel-v1.110505559"]},"type":"LISTEN"}');

    websocket.onmessage = (e) => {
        const message = JSON.parse(e.data);
    
        if(message.type === 'MESSAGE') {
            const content = JSON.parse(message.data.message);
            const username = content.data.redemption.user.display_name;
            const rewardTitle = content.data.redemption.reward.title;

            if (rewardTitle === "SEND DENPA WAVES") {
                users.push(username);
            }
        }
    }
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