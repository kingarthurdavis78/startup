const ws = new WebSocket('wss://'+window.location.host+'/ws');
let roomCode;

waitingRoom();

ws.addEventListener('message', async event => {
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
    } else if (message.messageType === 'All players responded') {
        getReadyToVote();
    } else if (message.messageType === 'voting') {
        let votingData = message.votingData;
        toHostVote(votingData, 3);
    } else if (message.messageType === 'All players voted') {
        getReadyToVote();
    } else if (message.messageType === 'results') {
        let playerData = message.playerData;
        toHostResults(playerData); 
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
    getReadyToVote();
}

async function toHostVote(votingData, numQuestions) {
    let mainElements = document.querySelector("main");

    for (let i=1; i<=numQuestions; i++) {
        ws.send(JSON.stringify({ messageType: "next-vote", roomCode: roomCode }));

        mainElements.innerHTML = '<aside id="clock">Time Left: 15</aside><h3>Which one is not like the others?</h3><div class="grid">';

        let grid = document.querySelector(".grid");
        for (let player of votingData) {
            if (player.responses.length > 0) {
                let response = player.responses.pop(0);
                grid.innerHTML += '<p class="response">' + player.name + ': ' + response + '</p>';
            } else {
                grid.innerHTML += '<p class="response">' + player.name + ': ' + 'NO RESPONSE :(' + '</p>';
            }
        }

        mainElements.innerHTML += '</div><p>Vote on your device now!</p>';

        for (let i = 4; i >= 1; i--) {
            let clock = document.getElementById("clock");
            if (clock === null) {
                return;
            }
            clock.innerText = 'Time Left: ' + i;
            await sleep(1000);
        }
        if (i === numQuestions) {
            mainElements.innerHTML = '<h1 style="font-size: 10vw;">Results</h1>';
            await sleep(3000);
            ws.send(JSON.stringify({ messageType: "results", roomCode: roomCode }));
            break;
        }
        mainElements.innerHTML = '<h1 style="font-size: 10vw;">Next Question</h1>';
        await sleep(3000);
    }
}
async function toThanks() {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1>Thanks for Playing!</h1><a class="play" href="game-select.html"> HOME</a><br>';
    ws.send(JSON.stringify({ messageType: "end-game", roomCode: roomCode }));
    await sleep(10000);
    window.location.href = "game-select.html";
}

async function toHostResults(playerData) {
    let imposter = null;
    for (let player of playerData) {
        if (player.imposter) {
            imposter = player;
            break;
        }
    }
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1 style="font-size: 10vw;">Who was chosen to be Not Like the Others?</h1>';
    await sleep(3000);
    mainElements.innerHTML = '<h1 style="font-size: 10vw;">Drum Roll Please..</h1>';
    await sleep(3000);
    mainElements.innerHTML = '<h1 style="font-size: 10vw;">' + imposter.name + '!</h1>';

    await sleep(3000);

    mainElements.innerHTML = '<h3>Scores:</h3><div class="grid">';
    let grid = document.querySelector(".grid");
    
    for (let player of playerData) {
        grid.innerHTML += '<p class="player">' + player.name + ': ' + player.score + '</p>';
    }

    await sleep(5000);
    if (playerData[0].round === 3) {
        toThanks();
    } else {
        toRound(playerData[0].round + 1);
    }
}


// Inbetween Animation

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

async function getReadyToVote() {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1 style="font-size: 10vw;">Get Ready to Vote!</h1><h1 id="roundAnimation">3</h1>'
    await sleep(1000);
    let roundAnimation = document.getElementById("roundAnimation");
    roundAnimation.innerText = '2';
    await sleep(1000);
    roundAnimation.innerText = '1';
    await sleep(1000);
    ws.send(JSON.stringify({ messageType: "voting", roomCode: roomCode }));
}