const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require('./util/fbAuth');

const {getAllToots, postOneToot, getToot, commentOnToot} = require('./handlers/toots');
const {signUp, login, uploadImage, addUserDetails, getAuthenticatedUser} = require('./handlers/users');

//toot routes
app.get("/toots", getAllToots);
app.post("/toot", FBAuth, postOneToot);
app.get("/toot/:tootId", getToot);
app.post('/toot/:tootId/comment', FBAuth, commentOnToot)


//Users Route
app.post("/signup", signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
