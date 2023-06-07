// Express server for Not Like The Others
let express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
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

async function getUser(email) {
    let users = db.collection('users');
    return await users.findOne({ email: email });
}

async function getQuestions() {
    let quesitons = db.collection('questions');

    let gameQuestions = await quesitons.aggregate([{ $sample: { size: 7 } }]).toArray();

    return gameQuestions;
}

async function createAccount(userData) {
    try {
        let users = db.collection('users');
        let potentialUser = await users.findOne({ email: userData.email });
        if (potentialUser) {
            throw new Error('Email already in use');
        }
        const passwordHash = await bcrypt.hash(userData.password, 10);
        const user = {
            name: userData.name,
            email: userData.email,
            password: passwordHash,
            token: uuid.v4()
        }
        users.insertOne(user);
        return {user: user, message: "Account Created", success: true};
    } catch (e) {
        console.log(e);
        return {message: e.message, success: false};
    }
}

async function login(email, password) {
    let users = db.collection('users');
    let user = await users.findOne({ email: email});
    if (await bcrypt.compare(password, user.password)) {
        return user;
    }
    return false;
}

// Cookie Stuff

const authCookieName = 'token';

// setAuthCookie in the HTTP response
function setAuthCookie(res, authToken) {
    res.cookie(authCookieName, authToken, {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
    });
  }

app.use(express.json());

app.use(cookieParser());

app.use(express.static('public'));

app.set('trust proxy', true);

app.post('/cookie/:name/:value', (req, res, next) => {
    res.cookie(req.params.name, req.params.value);
    res.send({ cookie: `${req.params.name}:${req.params.value}` });
});

app.get('/cookie', (req, res, next) => {
    res.send({ cookie: req.cookies });
});

let games = [];


app.get('/', (req, res) => {
    res.sendFile('/public/index.html');
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

    let user = await login(req.params.email, req.params.password);
    if (user) {
        setAuthCookie(res, user.token);
        res.json({ message: 'User ' + req.params.email + ' logged in', success: true });
    } else {
        res.json({ message: 'User ' + req.params.email + ' not logged in', success: false });
    }
});

app.post('/user/:name', async (req, res) => {
    console.log('Creating ' + req.params.name);
    let result = await createAccount(req.body);
    if (result.success) {
        setAuthCookie(res, result.user.token);

        res.status(200);
    } else {
        res.status(400);
    }

    res.json(result);

});

app.delete('/user/:email', (req, res) => {
    console.log('Loggin out ' + req.params.email);
    res.clearCookie(authCookieName);
    res.json({ message: 'User ' + req.params.email + ' deleted', success: true });
});

app.get('/auth/:email', async (req, res) => {
    if (!req.cookies.token) {
        res.json({ message: 'Please log in to host a game', success: false });
        return;
    }
    let user = await getUser(req.params.email);
    if (user) {
        const token = req?.cookies.token;
        res.json({ message: 'User ' + req.params.email + ' found', success: token === user.token });
    } else {
        res.json({ message: 'Please log in to host a game', success: false });
    }
});


// Initialize server

let server = app.listen(4000, () => console.log('listening at %s%s', server.address().address, server.address().port));