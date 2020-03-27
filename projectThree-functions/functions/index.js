const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const express = require('express');
const app = express();


app.get('/toots', (req, res)=> {
    admin
    .firestore()
    .collection("toots")
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      data
        .forEach(doc => {
          let toots = [];
          data.forEach(doc => {
            toots.push({
                tootId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
          });
          return res.json(toots);
        })
        .catch(err => console.error(err));
    });
});

app.post('/toot', (req, res) => {
    
  const newToot = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };
  admin
    .firestore()
    .collection("toots")
    .add(newToot)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: `something went wrong` });
      console.error(err);
    });
});


exports.api = functions.https.onRequest(app);