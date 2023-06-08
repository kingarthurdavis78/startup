const ws = new WebSocket('ws://localhost:4000');
let roomCode;

waitingRoom();

ws.addEventListener('message', async event => {
    console.log('Message from server ', event);
    let message = JSON.parse(event.data);
    if (message.messageType === 'player-joined') {
        let playerName = message.playerName;
        console.log('Player' + playerName + 'joined');
        let grid = document.querySelector(".grid");
        grid.innerHTML += '<p class="player">' + playerName + '</p>';
    } else if (message.messageType === 'responding') {
        let playerNames = message.playerNames;
        toHostResponse(playerNames);
    } else if (message.messageType === 'player-response') {
        let playerName = message.player;
        console.log('Player ' + playerName + ' responded');
        let playersFinished = document.getElementById("playersFinished");
        playersFinished.innerHTML += '<li>' + playerName + '</li>';
        // Remove Player from playersWorking
        let playesrWorking = document.getElementById("playersWorking");
        let players = playesrWorking.getElementsByTagName("li");
        for (let player of players) {
            if (player.innerText === playerName) {
                player.remove();
                break;
            }
        }
    }
});

async function createGame() {
    let game = await fetch('/game', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).then(response => response.json());
    return JSON.parse(game);
}

function displayRoomCode(roomCode) {
    document.getElementById('room-code').innerText = 'ROOM CODE: ' + roomCode;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitingRoom() {
    let game = await createGame();
    roomCode = game.roomCode;
    displayRoomCode(game.roomCode);
    ws.send(JSON.stringify({ messageType: "create-host", roomCode: game.roomCode }));
}

function toHostInstuction() {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h3>How to Play:</h3><iframe width="560" height="315" src="https://www.youtube.com/embed/slRDw9MVxFg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><br><p class="play" onclick="toRound(1);">NEXT</p><br>';
}

async function toHostResponse(playerNames) {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<aside id="clock">Time Left: 60</aside><div><h3>Finshed: </h3><ul id="playersFinished"></ul></div><br><div><h3>Still Working: </h3><ul id="playersWorking"></ul></div>';

    let playersWorking = document.getElementById("playersWorking");
    for (let playerName of playerNames) {
        playersWorking.innerHTML += '<li>' + playerName + '</li>';
    }

    for (let i = 60; i >= 1; i--) {
        // Update clock
        let clock = document.getElementById("clock");
        if (clock === null) {
            return;
        }
        clock.innerText = 'Time Left: ' + i;
        await sleep(1000);
    }
    ws.send(JSON.stringify({ messageType: "voting", roomCode: roomCode }));
}

async function toRound(roundNumber) {
    console.log('Round ' + roundNumber + ' started');
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1 style="font-size: 10vw;">Round ' + roundNumber + '</h1><h1 id="roundAnimation">3</h1>'
    await sleep(1000);
    let roundAnimation = document.getElementById("roundAnimation");
    roundAnimation.innerText = '2';
    await sleep(1000);
    roundAnimation.innerText = '1';
    await sleep(1000);
    ws.send(JSON.stringify({ messageType: "responding", roomCode: roomCode }));
}