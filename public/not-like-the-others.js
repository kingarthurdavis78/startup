const roomCode = createGame();

function createGame() {
    let code = uuid().toUpperCase();
    fetch('/game/' + code, { method: 'POST' });
    return code;
}

// main function
async function NotLikeTheOthers(numRounds) {
    await toHostWaiting();
    await toHostInstruction();
    for (let i = 1; i <= numRounds; i++) {
        await toRound(i);
        await toHostResponse();
        await toHostVoting();
        await toHostScores();
    }
    await toThanks();
    deleteGame();
    window.location.replace("game-select.html");
}

// Activities
async function toRound(roundNum) {
    updateGameRound(roundNum);

    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1 style="font-size: 10vw;">Round ' + roundNum + '</h1><h1 id="roundAnimation">3</h1>'
    await sleep(1000);
    let roundAnimation = document.getElementById("roundAnimation");
    roundAnimation.innerText = '2';
    await sleep(1000);
    roundAnimation.innerText = '1';
    await sleep(1000);
}

async function toHostWaiting() {
    let roomElement = document.getElementsByClassName("room");
    roomElement[0].innerText = 'Room Code: ' + roomCode;

    let grid = document.querySelector(".grid");
    await sleep(1000)
    let game = await getGame();
    console.log(game);
    while (game.state == "waiting") {
        game = await getGame();
        let players = game.players;
        grid.innerHTML = '';
        for (let player of players) {
            grid.innerHTML += '<p class="player">' + player.name + '</p>';
        }
        await sleep(1000);
    }
}

async function toHostInstruction() {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h3>How to Play:</h3><iframe width="560" height="315" src="https://www.youtube.com/embed/slRDw9MVxFg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><br><p class="play" onclick="updateGameState(\'responding\');">SKIP</p><br>';
    let game = await getGame();
    while (game.state == "instruction") {
        game = await getGame();
        await sleep(1000);
    }
}

async function toHostResponse() {

    updateGameState("responding");

    sendQuestions();

    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<aside id="clock">Time Left: 60</aside><div><h3>Finshed: </h3><ul id="playersFinished"></ul></div><br><div><h3>Still Working: </h3><ul id="playersWorking"></ul></div>';

    let playersFinished = document.getElementById("playersFinished");
    let playersWorking = document.getElementById("playersWorking");

    let clock = document.getElementById("clock");
    for (let i = 60; i >= 1; i--) {

        // Check if game state has changed
        let game = await getGame();
        let players = game.players;

        // Check if all players have responded
        if (await everyoneResponded()) {
            console.log("All players have responded");
            return;
        }

        // Update players finished and working
        playersFinished.innerHTML = '';
        playersWorking.innerHTML = '';
        for (let player of players) {
            if (player.response != '') {
                playersFinished.innerHTML += '<li>' + player.name + '</li>';
            } else {
                playersWorking.innerHTML += '<li>' + player.name + '</li>';
            }
        }

        // Update clock
        clock.innerText = 'Time Left: ' + i;
        await sleep(1000);
    }
}

async function toHostVoting() {

    updateGameState("voting");

    let mainElements = document.querySelector("main");

    mainElements.innerHTML = '<aside id="clock">Time Left: 15</aside><h3>Which one is not like the others?</h3><div class="grid">';

    let grid = document.querySelector(".grid");


    let game = await getGame();
    let players = game.players;

    for (let player of players) {
        if (player.response != '') {
            grid.innerHTML += '<p class="response">' + player.name + ': ' + player.response + '</p>';
        } else {
            grid.innerHTML += '<p class="response">' + player.name + ': ' + 'NO RESPONSE :(' + '</p>';
        }
    }

    mainElements.innerHTML += '</div><p>Vote on your device now!</p>';

    let clock = document.getElementById("clock");
    for (let i = 20; i >= 1; i--) {
        clock.innerText = 'Time Left: ' + i;
        if (await everyoneVoted()) {
            console.log("All players have voted");
            return;
        }
        await sleep(1000);
    }
}

async function toHostScores() {

    updateGameState("scores");

    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h3>Scores:</h3><div class="grid">';
    let grid = document.querySelector(".grid");

    let game = await getGame();
    let players = game.players;
    for (let player of players) {
        grid.innerHTML += '<p class="player">' + player.name + ': ' + player.score + '</p>';
    }

    await sleep(5000);
}

async function toThanks() {

    updateGameState("thanks");

    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1>Thanks for Playing!</h1><a class="play" href="game-select.html"> BACK</a><br>';
    await sleep(10000);
}

// Helper Functions


async function everyoneResponded() {
    let game = await getGame();
    let players = game.players;
    for (let player of players) {
        if (game.round != 3 && player.responses[2] == undefined) {
            return false;
        }
        if (game.round == 3 && player.responses[0] == undefined) {
            return false;
        }
    }
    return true;
}

async function everyoneVoted() {
    let game = await getGame();
    let players = game.players;
    for (let player of players) {
        if (player.vote) {
            return false;
        }
    }
    return true;
}

function uuid() {
    return (Math.random() + 1).toString(36).substring(2, 6);
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

async function getGame() {
    return fetch('/game/' + roomCode).then(response => response.json());
}

async function updateGame(game) {
    console.log("adding questions");
    console.log(game);
    fetch('/game/' + roomCode, { method: 'PUT', body: JSON.stringify(game), cors: 'no-cors', headers: { 'Content-Type': 'application/json' } });
}

async function deleteGame() {
    fetch('/game/' + roomCode, { method: 'DELETE', cors: 'no-cors' });
}

async function sendQuestions() {
    let game = await getGame();
    let questions = [];
    let fakeQuestions = [];
    for (let i = 0; i < 3; i++) {
        questionPair = game.questions.pop(i);
        questions.push(questionPair.question);
        fakeQuestions.push(questionPair.fakeQuestion);
    }

    console.log(questions);
    console.log(fakeQuestions);

    let players = game.players;
    let index = Math.floor(Math.random() * players.length); // Randomly choose imposter
    players[index].imposter = true;

    for (let player of players) {
        if (player.imposter) {
            player.questions = fakeQuestions;
        } else {
            player.questions = questions;
        }
    }
    updateGame(game);
}

async function updateGameState(state) {
    let game = await getGame();
    game.state = state;
    fetch('/game/' + roomCode, { method: 'PUT', body: JSON.stringify(game), cors: 'no-cors', headers: { 'Content-Type': 'application/json' } });
}

async function updateGameRound(round) {
    let game = await getGame();
    game.round = round;
    fetch('/game/' + roomCode, { method: 'PUT', body: JSON.stringify(game), cors: 'no-cors', headers: { 'Content-Type': 'application/json' } });
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


NotLikeTheOthers(3);