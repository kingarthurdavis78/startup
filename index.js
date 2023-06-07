// Express server for Not Like The Others
let express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

// Database
const { MongoClient } = require('mongodb');
const cfg = require('./dbConfig.json');
const e = require('express');
const url = `mongodb+srv://${cfg.userName}:${cfg.password}@${cfg.hostName}`;
const client = new MongoClient(url);
const db = client.db('NotLikeTheOthers');

// Connect to database
client.connect();


async function getQuestions() {
    let quesitons = db.collection('questions');

    let gameQuestions = await quesitons.aggregate([{ $sample: { size: 7 } }]).toArray();

    return gameQuestions;
}

async function createAccount(user) {
    try {
        let users = db.collection('users');
        users.insertOne({ name: user.name, email: user.email, password: user.password });
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

async function login(email, password) {
    let users = db.collection('users');
    let result = await users.findOne({ email: email, password: password });
    if (result) {
        return true;
    }
    return false;
}

app.use(cookieParser());

app.post('/cookie/:name/:value', (req, res, next) => {
    res.cookie(req.params.name, req.params.value);
    res.send({ cookie: `${req.params.name}:${req.params.value}` });
});

app.get('/cookie', (req, res, next) => {
    res.send({ cookie: req.cookies });
});

let games = [];

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile('/public/index.html');
});


app.use(express.json());

// Disable Cors

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});


// Game routes

app.get('/game/:roomcode', (req, res) => {
    for (let game of games) {
        if (req.params.roomcode == game.roomCode) {
            res.json({
                gameType: game.gameType,
                questions: game.questions,
                roomCode: game.roomCode,
                players: game.players,
                state: game.state,
                round: game.round
            });
            return;
        }
    }
    console.log('Game ' + req.params.roomcode + ' not found');
    res.json({ message: 'Game ' + req.params.roomcode + ' not found' });
});

app.post('/game/:roomcode', async (req, res) => {
    console.log('Creating game ' + req.params.roomcode);
    let questions = await getQuestions();
    let game = { gameType: "NotLikeTheOthers", questions: questions, roomCode: req.params.roomcode, players: [], state: 'waiting', round: 0 };
    games.push(game);
    res.send('Game ' + req.params.roomcode + ' added');
});

app.put('/game/:roomcode', (req, res) => {
    for (let game of games) {
        if (game.roomCode == req.params.roomcode) {
            game.state = req.body.state;
            game.questions = req.body.questions;
            game.players = req.body.players;
            game.round = req.body.round;
            res.json(game);
            return;
        }
    }
    res.json({ message: 'Game ' + req.params.roomcode + ' not updated' });
});

app.delete('/game/:roomcode', (req, res) => {
    console.log('Deleting game ' + req.params.roomcode);
    for (let game of games) {
        if (game.roomCode == req.params.roomcode) {
            games.pop(game);
            delete game;
            res.send('Game ' + req.params.roomcode + ' deleted');
            return;
        }
    }
    res.send('Game ' + req.params.roomcode + ' not found');
});


// Player routes

app.get('/player/:name/:roomcode', (req, res) => {
    console.log('Sending ' + req.params.name);
    for (let game of games) {
        if (req.params.roomcode == game.roomCode && req.params.name == player.name) {
            res.json(player);
            return;
        }
    }
    res.send('Player ' + req.params.name + ' not found');
});

app.post('/player/:name/:roomcode', (req, res) => {
    console.log('Adding ' + req.params.name);
    for (let game of games) {
        if (req.params.roomcode.toUpperCase() == game.roomCode) {
            let player = { name: req.params.name.toUpperCase(), roomCode: req.params.roomcode.toUpperCase(), questions: [], responses: [], vote: "", score: 0 }
            game.players.push(player);
            res.json({ message: 'Player ' + req.params.name + ' added', success: true });
            return;
        }
    }
    res.json({ message: 'Game ' + req.params.roomcode + ' not found', success: false });
});

app.put('/player/:name/:roomcode', (req, res) => {
    console.log('Updating ' + req.params.name);
    for (let game of games) {
        if (req.params.roomcode == game.roomCode) {
            for (let player of game.players) {
                if (req.params.name == player.name) {
                    player.quesitons = req.body.questions;
                    player.responses = req.body.responses;
                    player.vote = req.body.vote;
                    player.score = req.body.score;
                    res.json({ message: 'Player ' + req.params.name + ' updated' });
                    return;
                }
            }
        }
    }
    res.json({ message: 'Player ' + req.params.name + ' not found' });
});

app.delete('/player/:name/:roomcode', (req, res) => {
    console.log('Deleting ' + req.params.name);
    for (let game of games) {
        if (req.params.roomcode == game.roomCode) {
            game.players.pop(player);
            res.send('Player ' + req.params.name + ' deleted');
            return;
        }
    }
    res.send('Player ' + req.params.name + ' not found');
});

// User routes

app.get('/user/:email/:password', async (req, res) => {
    console.log('Logging In ' + req.params.email);

    let success = await login(req.params.email, req.params.password);
    if (success) {
        res.json({ message: 'User ' + req.params.email + ' logged in', success: true });
    } else {
        res.json({ message: 'User ' + req.params.email + ' not logged in', success: false });
    }
});

app.post('/user/:name', async (req, res) => {
    console.log('Creating ' + req.params.name);
    let success = await createAccount(req.body);
    if (success) {
        res.json({ message: 'User ' + req.params.name + ' created', success: true });
    }
    else {
        res.json({ message: 'User ' + req.params.name + ' not created', success: false });
    }

});


// Initialize server

let server = app.listen(4000, () => console.log('listening at %s%s', server.address().address, server.address().port));