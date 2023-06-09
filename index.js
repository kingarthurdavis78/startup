// Express server for Not Like The Others
let express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const app = express();

// Database
const { MongoClient } = require('mongodb');
const cfg = require('./dbConfig.json');
const url = `mongodb+srv://${cfg.userName}:${cfg.password}@${cfg.hostName}`;
const client = new MongoClient(url);
const db = client.db('NotLikeTheOthers');
client.connect();

// Websocket
const { WebSocketServer } = require('ws');
const e = require('express');

async function getUser(email) {
    let users = db.collection('users');
    return await users.findOne({ email: email });
}

async function getQuestions() {
    let quesitons = db.collection('questions');
    let gameQuestions = await quesitons.aggregate([{ $sample: { size: 9 } }]).toArray();
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
        return { user: user, message: "Account Created", success: true };
    } catch (e) {
        console.log(e);
        return { message: e.message, success: false };
    }
}

async function login(email, password) {
    let users = db.collection('users');
    let user = await users.findOne({ email: email });
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

app.get('/', (req, res) => {
    res.sendFile('/public/index.html');
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

let server = app.listen(4000, () => console.log('listening at %s', server.address().port));

// Game routes

const wss = new WebSocketServer({ noServer: true });

function generateRoomCode() {
    let roomCode = '';
    for (let i = 0; i < 4; i++) {
        num = Math.floor(Math.random() * 26);
        roomCode += String.fromCharCode(65 + num);
    }
    return roomCode.toUpperCase();
}

// Handle the protocol upgrade from HTTP to WebSocket
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, request);
    });
});

let games = [];


app.post('/game', async (req, res) => {
    console.log('Creating game');
    let questions = await getQuestions();
    let roomCode = generateRoomCode();
    let game = { roomCode: roomCode, questions: questions, players: [], connections: [], hostConnection: null, playersFinished: 0, round: 1};
    games.push(game);
    res.json(JSON.stringify(game));
});

app.get('/game/:roomCode', async (req, res) => {
    let game = games.find(game => game.roomCode === req.params.roomCode);
    if (game === undefined) {
        res.json(JSON.stringify({ success: false }));
    } else {
        res.json(JSON.stringify({ success: true }));
    }
});


wss.on('connection', (ws) => {

    ws.on('message', (message) => {
        message = JSON.parse(message);
        let game = games.find(game => game.roomCode === message.roomCode);
        if (message.messageType === 'create-host') {

            game.hostConnection = ws;
        } else if (message.messageType === 'join-game') {
            console.log(message.player.name + ' joined the game');
            message.player.connection = ws;
            game.players.push(message.player);
            ws.send(JSON.stringify({ messageType: 'game-joined' }));
            game.hostConnection.send(JSON.stringify({ messageType: 'player-joined', playerName: message.player.name }));
        } else if (message.messageType === 'responding') {

            // Select imposter
            let imposterIndex = Math.floor(Math.random() * game.players.length);
            game.players[imposterIndex].imposter = true;
            let questions = [];
            let fakeQuestions = [];
            for (let i = 0; i < 3; i++) {
                let questionPair = game.questions.pop(i);
                questions.push(questionPair.question);
                fakeQuestions.push(questionPair.fakeQuestion);
            }
            let playerNames = [];
            game.players.forEach(player => {
                playerNames.push(player.name);
            });
            game.hostConnection.send(JSON.stringify({ messageType: 'responding', playerNames: playerNames }));
            game.players.forEach(player => {
                if (player.imposter) {
                    player.connection.send(JSON.stringify({ messageType: 'responding', questions: fakeQuestions }));
                } else {
                    player.connection.send(JSON.stringify({ messageType: 'responding', questions: questions }));
                }
            });
        } else if (message.messageType === 'player-response') {

            let player = game.players.find(player => player.name === message.player.name);
            player.responses = message.player.responses;
            game.hostConnection.send(JSON.stringify({ messageType: 'player-response', player: message.player.name }));
            game.playersFinished++;
            if (game.playersFinished === game.players.length) {
                game.playersFinished = 0;

                game.hostConnection.send(JSON.stringify({ messageType: 'All players responded'}));
            }
        } else if (message.messageType === 'voting') {

            let votingData = [];
            game.players.forEach(player => {
                let playerData = { name: player.name, responses: player.responses };
                votingData.push(playerData);
            });
            game.hostConnection.send(JSON.stringify({ messageType: 'voting', votingData: votingData }));
        } else if (message.messageType === 'next-vote') {
            let playerNames = [];
            game.players.forEach(player => {
                playerNames.push(player.name);
            });
            game.players.forEach(player => {
                player.connection.send(JSON.stringify({ messageType: 'next-vote', playerNames: playerNames}));
            });
        } else if (message.messageType === 'player-vote') {
            let imposter = game.players.filter(player => player.imposter)[0].name;
            let gameIndex = games.indexOf(game);
            let playerIndex = game.players.indexOf(game.players.find(player => player.name === message.player.name));
            if (message.vote == imposter) {
                games[gameIndex].players[playerIndex].score += 500 * game.round;
            }

        } else if (message.messageType === 'results') {
            let playerData = [];
            game.players.forEach(player => {
                playerData.push({ name: player.name, score: player.score, imposter: player.imposter, responses: player.responses, round: game.round });
                player.imposter = false;
                player.responses = [];
            });
            game.hostConnection.send(JSON.stringify({ messageType: 'results', playerData: playerData }));
            game.players.forEach(player => {
                player.connection.send(JSON.stringify({ messageType: 'results', playerData: playerData }));
            });
            game.round++;
        } else if (message.messageType === 'end-game') {
            game.players.forEach(player => {
                player.connection.send(JSON.stringify({ messageType: 'end-game' }));
            });
            let gameIndex = games.indexOf(game);
            games.splice(gameIndex, 1);
        }
    });

    ws.on('close', () => {
        // Remove player from game
        games.forEach(game => {
            let playerIndex = game.players.indexOf(game.players.find(player => player.connection === ws));
            if (playerIndex !== -1) {
                game.players.splice(playerIndex, 1);
            }
        });
    });
});
