let players = [];


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Player {
    constructor(name, roomCode) {
    this.name = name;
    this.roomCode = roomCode;
    this.response = '';
    this.vote = '';
    this.score = 0;
    }
}

function generatePlayers(numPlayers) {
    for (let i=1; i<=numPlayers; i++) {
        players.push(new Player('player'+i, 'roomCode'));
    }
}



async function toHostResponse() {
    let clock = document.getElementById("clock");
    for (let i=60; i>=0; i--) {
        clock.innerText = 'Time Left: ' + i;
        await sleep(1000);
    }

}

async function toHostVoting() {
    let mainElements = document.querySelector("main");

    mainElements.innerHTML = '<aside id="clock">Time Left: 15</aside><h3>Which one is not like the others?</h3><div class="grid">';

    for (let i=1; i<=numPlayers; i++) {
        mainElements.innerHTML += <p class="response">PLAYER NAME: RESPONSE</p>
    }
        
    mainElements.innerHTML += '</div><p>Vote on your device now!</p><a class="play" href="host-scores.html"> NEXT</a><br>';

    let clock = document.getElementById("clock");
    for (let i=15; i>=0; i--) {
        clock.innerText = 'Time Left: ' + i;
        await sleep(1000);
    }
}

