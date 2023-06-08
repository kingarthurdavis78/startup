let myPlayer;
let ws;

async function joinGame() {
    let name = document.getElementById("name").value;
    let roomCode = document.getElementById("room").value;

    if (name === "" || roomCode === "") {
        alert("Please enter a name and room code");
        return;
    }

    myPlayer = {
        name: name.toUpperCase(),
        roomCode: roomCode.toUpperCase(),
        responses: [],
        votes: [],
        score: 0,
        ws: null
    }
    console.log("joining game");
    let response =  await fetch('/game/' + roomCode).then(response => response.json());
    response = JSON.parse(response);
    console.log(response);  
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

function toResponse() {

}

async function playGame() {
    ws = new WebSocket('ws://localhost:4000');
    blankScreen();

    ws.addEventListener('toResponse', (game) => {
        myPlayer = game.players.find(player => player.name === myPlayer.name);
        toResponse();
    });
    
}