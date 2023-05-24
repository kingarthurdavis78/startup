let players = [];
let player;

class Player {
    constructor(name, roomCode) {
    this.name = name;
    this.roomCode = roomCode;
    this.response = '';
    this.vote = '';
    this.score = 0;
    }
}

function validRoomCode(roomCode) {
    return true;
}

function joinGame() {
    let name = document.getElementById("name").value;
    let roomCode = document.getElementById("room").value;
    if (!validRoomCode(roomCode)) {
        alert("Invalid room code");
        return;
    }
    player = new Player(name.toUpperCase(), roomCode);
    toWaitingScreen();
}

function toWaitingScreen() {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1>' + player.name + '</h1><h2> Waiting...</h2>';
}

function toResponseScreen() {
    var mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1>' + player.name + '</h1><h2>QUESTION</h2><input type="text" id="response" name="response" placeholder="RESPOND HERE"><br><p onclick="submitResponse()"> SUBMIT</p><br><p onclick="generateResponse()"> GENERATE RESPONSE</p>';
}

function toVotingScreen() {
    var mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1>' + player.name + '</h1>';
    for (let i=1; i<=numPlayers; i++) {
        mainElements.innerHTML += '<p onclick="postVote('+i+')" id="'+i+'">player name '+i+'</p><br>';
    }
}

function generateResponse() {
    // TODO: generate response
    toWaitingScreen();
}

function submitResponse() {
    let response = document.getElementById("response").value;
    console.log(response);
    toWaitingScreen();
}

function postVote(playerNumber) {
    let vote = document.getElementById(playerNumber).innerText;
    console.log(vote);
    toWaitingScreen();
}