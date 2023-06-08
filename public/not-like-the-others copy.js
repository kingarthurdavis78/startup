const ws = new WebSocket('ws://localhost:4000');

async function createGame() {
    let game = await fetch('/game', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: ws}).then(response => response.json());
    return JSON.parse(game);
}

function displayRoomCode(roomCode) {
    document.getElementById('room-code').innerText = 'ROOM CODE: ' + roomCode;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function notLikeTheOthers() {
    let game = await createGame();
    console.log(game.roomCode);
    displayRoomCode(game.roomCode);
}



notLikeTheOthers();