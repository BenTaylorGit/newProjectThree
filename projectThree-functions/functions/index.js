const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require('./util/fbAuth');

const { db } = require('./util/admin');

const {getAllToots, postOneToot, getToot, commentOnToot, likeToot, unlikeToot, deleteToot} = require('./handlers/toots');
const {signUp, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead} = require('./handlers/users');

//toot routes
app.get('/toots', getAllToots);
app.post('/toot', FBAuth, postOneToot);
app.get('/toot/:tootId', getToot);
app.post('/toot/:tootId/comment', FBAuth, commentOnToot);
app.get('/toot/:tootId/like', FBAuth, likeToot);
app.get('/toot/:tootId/unlike', FBAuth, unlikeToot);
app.delete('/toot/:tootId', FBAuth, deleteToot);


//Users Route
app.post("/signup", signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions
  
  .firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/toots/${snapshot.data().tootId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            tootId: doc.id
          });
        }
      })
      .catch((err) => console.error(err));
  });


exports.deleteNotificationOnUnLike = functions
  
  .firestore.document('likes/{id}').onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`).delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });


exports.createNotificationOnComment = functions
  
  .firestore.document('comments/{id}').onCreate((snapshot) => {
    return db.doc(`/toots/${snapshot.data().tootId}`).get()
      .then((doc) => {
        if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            tootId: doc.id
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });