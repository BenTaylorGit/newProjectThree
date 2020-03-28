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

exports.createNotificationOnLike = functions.firestore.document('likes/{id}').onCreate((snapshot) => {
    return db.doc(`/toots/${snapshot.data().tootId}`)
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


exports.deleteNotificationOnUnLike = functions.firestore.document('likes/{id}').onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`).delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });


exports.createNotificationOnComment = functions.firestore.document('comments/{id}').onCreate((snapshot) => {
    return db.doc(`/toots/${snapshot.data().tootId}`).get()
      .then((doc) => {
        if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
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

  exports.onUserImageChange = functions.firestore.document('/users/{userId}').onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log('image has changed');
      const batch = db.batch();
      return db.collection('toots').where('userHandle', '==', change.before.data().handle).get()
        .then((data) => {
          data.forEach((doc) => {
            const toot = db.doc(`/toots/${doc.id}`);
            batch.update(toot, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onTootDelete = functions.firestore.document('/toots/{tootId}').onDelete((snapshot, context) => {
    const tootId = context.params.tootId;
    const batch = db.batch();
    return db.collection('comments').where('tootId', '==', tootId).get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection('likes').where('tootId', '==', tootId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db.collection('notifications').where('tootId', '==', tootId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });