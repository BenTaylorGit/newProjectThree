const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require('./util/fbAuth')

const {getAllToots, postOneToot} = require('./handlers/toots');
const {signUp, login, uploadImage} = require('./handlers/users');

//toot routes
app.get("/toots", getAllToots);
app.post("/toot", FBAuth, postOneToot);

//Users Route
app.post("/signup", signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);

exports.api = functions.https.onRequest(app);
