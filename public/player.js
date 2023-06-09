let myPlayer;
let ws;

async function joinGame() {
    let name = document.getElementById("name").value;
    let roomCode = document.getElementById("room").value;

    if (name === "" || roomCode.length !== 4) {
        alert("Please enter a name and room code");
        return;
    }

    myPlayer = {
        name: name.toUpperCase(),
        roomCode: roomCode.toUpperCase(),
        responses: [],
        votes: [],
        score: 0,
        imposter: false,
        ws: null
    }
    let response = await fetch('/game/' + roomCode).then(response => response.json());
    response = JSON.parse(response);
    if (!response.success) {
        alert("Invalid room code");
        return;
    }
    playGame();
}

function blankScreen() {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1>' + myPlayer.name + '</h1>';
}

function nextQuestion() {
    let response = document.getElementById("response");
    if (response !== null) {
        myPlayer.responses.push(response.value);
    }
    if (myPlayer.questions.length === 0) {
        ws.send(JSON.stringify({ messageType: "player-response", roomCode: myPlayer.roomCode, player: myPlayer }));
        blankScreen();
        return;
    }
    let question = myPlayer.questions.pop();
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1>' + myPlayer.name + '</h1><h2>' + question + '</h2><input type="text" id="response" name="response" placeholder="RESPOND HERE"><br><p onclick="nextQuestion()"> NEXT</p>';
}

function vote(playerNames) {
    var mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1>' + myPlayer.name + '</h1><br>';
    for (let name of playerNames) {
        mainElements.innerHTML += '<p id="'+name+'" onclick="postVote()">' + name + '</p><br>';
    }
}

function postVote() {
    let playerName = event.target.id;
    ws.send(JSON.stringify({ messageType: "player-vote", roomCode: myPlayer.roomCode, player: myPlayer, vote: playerName}));
    blankScreen();
}

async function playGame() {
    ws = new WebSocket('wss://'+window.location.host+'/ws');
    await sleep(1000);
    ws.send(JSON.stringify({ messageType: "join-game", roomCode: myPlayer.roomCode, player: myPlayer }));
    ws.addEventListener('message', event => {
        let message = JSON.parse(event.data);
        if (message.messageType === 'game-joined') {
            blankScreen();
        } else if (message.messageType === 'responding') {
            console.log('Responding');
            myPlayer.questions = message.questions;
            nextQuestion();
        } else if (message.messageType === 'next-vote') {
            playerNames = message.playerNames;
            vote(playerNames);
        } else if (message.messageType === 'end-game') {
            window.location.href = "game-select.html";
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}