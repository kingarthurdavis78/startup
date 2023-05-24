let players = [];


async function NotLikeTheOthers(numPlayers, numRounds) {
    generatePlayers(numPlayers);
    await toHostWaiting(); // await players to join
    for (let i=1; i<=numRounds; i++) {
        await toRound(i);
        await toHostResponse();
        await toHostVoting();
        await toHostScores();
    }
    await toThanks();
    window.location.replace("game-select.html");
}

async function toRound(roundNum) {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1 style="font-size: 200px;">Round ' + roundNum + '</h1><h1 id="roundAnimation">3</h1>'
    await sleep(1000);
    let roundAnimation = document.getElementById("roundAnimation");
    roundAnimation.innerText = '2';
    await sleep(1000);
    roundAnimation.innerText = '1';
    await sleep(1000);
    roundAnimation.innerText = 'GO!';
    await sleep(1000);
}

function openFullscreen() {
    let body = document.documentElement;
    if (body.requestFullscreen) {
      body.requestFullscreen();
    } else if (body.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    } else if (body.msRequestFullscreen) { /* IE11 */
      body.msRequestFullscreen();
    }
  }


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
    console.log(players);
}

async function toHostWaiting() {
    let grid = document.querySelector(".grid");
    for (let player of players) {
        grid.innerHTML += '<p class="player">' + player.name + '</p>';
    }

    await sleep(5000);
}

async function toHostInstruction() {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h3>How to Play:</h3><video width="320" height="240" controls><source src="https://youtu.be/dQw4w9WgXcQ" type="video/mp4">Your browser does not support videos.</video><br><p class="play" onclick="toHostResponse()">SKIP</p><br>';

    await sleep(5000);
}

async function toHostResponse() {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<aside id="clock">Time Left: 60</aside><div><h3>Finshed: </h3><ul id="playersFinished"></ul></div><br><div><h3>Still Working: </h3><ul id="playersWorking"></ul></div>';

    let playersFinished = document.getElementById("playersFinished");
    let playersWorking = document.getElementById("playersWorking");
    for (let player of players) {
        if (player.response != '') {
            playersFinished.innerHTML += '<li>' + player.name + '</li>';
        } else {
            playersWorking.innerHTML += '<li>' + player.name + '</li>';
        }
    }

    let clock = document.getElementById("clock");
    for (let i=60; i>=1; i--) {
        clock.innerText = 'Time Left: ' + i;
        await sleep(1000);
    }
}

async function toHostVoting() {
    let mainElements = document.querySelector("main");

    mainElements.innerHTML = '<aside id="clock">Time Left: 15</aside><h3>Which one is not like the others?</h3><div class="grid">';

    let grid = document.querySelector(".grid");

    for (let player of players) {
        if (player.response != '') {
            grid.innerHTML += '<p class="response">' + player.name + ': ' + player.response + '</p>';
        } else { 
            grid.innerHTML += '<p class="response">' + player.name + ': ' + 'NO RESPONSE :(' + '</p>';
        }
    }
        
    mainElements.innerHTML += '</div><p>Vote on your device now!</p><a class="play" href="host-scores.html"> NEXT</a><br>';

    let clock = document.getElementById("clock");
    for (let i=20; i>=1; i--) {
        clock.innerText = 'Time Left: ' + i;
        await sleep(1000);
    }
}

function sortPlayers() {
    players.sort(function(a, b){return b.score - a.score});
}

async function toHostScores() {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h3>Scores:</h3><div class="grid">';
    let grid = document.querySelector(".grid");

    sortPlayers();
    
    for (let player of players) {
        grid.innerHTML += '<p class="player">' + player.name + ': ' + player.score + '</p>';
    }

    await sleep(10000);
}

async function toThanks() {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1>Thanks for Playing!</h1><a class="play" href="game-select.html"> BACK</a><br>';
    await sleep(10000);
}


NotLikeTheOthers(9, 3);