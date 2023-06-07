let myPlayer;

window.addEventListener('beforeunload', (event) => {
    event.preventDefault();
});

async function runGame() {
    let game = await getGame();
    while (true) {
        game = await getGame();
        console.log(game.state);
        if (game.state == 'waiting' || game.state == 'instruction') {
            toWaitingScreen();
        }
        if (game.state == 'responding') {
            toResponseScreen();
            await sleep(10000);
        }
        if (game.state == 'voting') {
            toVotingScreen();
            await sleep(5000);
        }
        if (game.state == 'scores') {
            myPlayer.response = '';
            myPlayer.vote = '';
            updatePlayer(myPlayer);
        }
        if (game.state == 'thanks') {
            window.location.href = "index.html";
        }
        await sleep(1000);
    }
}

async function joinGame() {
    let name = document.getElementById("name").value;
    let roomCode = document.getElementById("room").value;

    myPlayer = {
        name: name.toUpperCase(),
        roomCode: roomCode.toUpperCase(),
        response: '',
        vote: '',
        score: 0
    }
    console.log("joining game");
    let res = await fetch('/player/' + myPlayer.name + '/' + myPlayer.roomCode, { method: 'POST', body: JSON.stringify(myPlayer), headers: { 'Content-Type': 'application/json' } }).then(response => response.json());
    console.log(res);
    if (res.success) {
        runGame();
    } else {
        alert('Invalid room code');
    }
}

async function getGame() {
    return await fetch('/game/' + myPlayer.roomCode).then(response => response.json());
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function toWaitingScreen() {
    let mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1>' + myPlayer.name + '</h1><h2> Waiting...</h2>';
}

async function toResponseScreen() {
    await sleep(5000);
    let game = await getGame();
    myPlayer = game.players.find(player => player.name == myPlayer.name);


    let mainElements = document.querySelector("main");
    if (game.round != 3 && myPlayer.responses.length < 3) {
        let index = myPlayer.responses.length;
        mainElements.innerHTML = '<h1>' + myPlayer.name + '</h1><h2>' + myPlayer.questions[index] + '</h2><input type="text" id="response" name="response" placeholder="RESPOND HERE"><br><p onclick="nextQuestion()"> NEXT</p>';
    } else {
        mainElements.innerHTML = '<h1>' + myPlayer.name + '</h1><h2> Waiting...</h2>';
    }
}

async function toVotingScreen() {
    var mainElements = document.querySelector("main");
    mainElements.innerHTML = '<h1>' + myPlayer.name + '</h1><br>';

    if (myPlayer.vote == '') {
        let game = await getGame();
        let players = game.players;
        for (let player of players) {
            mainElements.innerHTML += '<p id="post-vote" onclick="postVote()">' + player.name + '</p><br>';
        }
    } else {
        mainElements.innerHTML += '<h2> Waiting...</h2>';
    }
}

async function nextQuestion() {
    let response = document.getElementById("response").value;
    console.log(myPlayer);
    myPlayer.responses.push(response);
    updatePlayer(myPlayer);
}

async function postVote() {
    let playerName = document.getElementById("post-vote").innerText;
    myPlayer.vote = playerName;

    let game = await getGame();
    for (let player of game.players) {
        if (player.name == myPlayer.vote && player.imposter) {
            myPlayer.score += 500;
        }
    }
    updatePlayer(myPlayer);
}

function updatePlayer(player) {
    fetch('/player/' + player.name + '/' + player.roomCode, { method: 'PUT', body: JSON.stringify(player), headers: { 'Content-Type': 'application/json' } });
}