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
const {WebSocketServer} = require('ws');

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

let games = [];

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

app.post('/game', async (req, res) => {
    console.log('Creating game');
    let questions = await getQuestions();
    let roomCode = generateRoomCode();
    let game = {roomCode: roomCode, questions: questions, players: []};
    games.push(game);
    res.json(JSON.stringify(game));
});

app.get('/game/:roomCode', async (req, res) => {
    let game = games.find(game => game.roomCode === req.params.roomCode);
    if (game === undefined) {
        res.json(JSON.stringify({success: false}));
    } else {
        res.json(JSON.stringify({success: true}));
    }
});

wss.on('connection', (ws) => {
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
