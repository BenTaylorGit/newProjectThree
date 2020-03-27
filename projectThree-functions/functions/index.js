const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("express")();

admin.initializeApp();

const config = {
  apiKey: "AIzaSyCNhX9foX6L8rJWEjypwb7iYMdwhwi-WPk",
  authDomain: "projectthree-f733d.firebaseapp.com",
  databaseURL: "https://projectthree-f733d.firebaseio.com",
  projectId: "projectthree-f733d",
  storageBucket: "projectthree-f733d.appspot.com",
  messagingSenderId: "524349011091",
  appId: "1:524349011091:web:eaed39c484660102b30966"
};

const firebase = require("firebase");
firebase.initializeApp(config);

const db = admin.firestore();

app.get("/toots", (req, res) => {
  db.collection("toots")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      data
        .forEach((doc) => {
          let toots = [];
          data.forEach((doc) => {
            toots.push({
              tootId: doc.id,
              body: doc.data().body,
              userHandle: doc.data().userHandle,
              createdAt: doc.data().createdAt
            });
          });
          return res.json(toots);
        })
        .catch((err) => {
            console.error(err);
        });
    });
});

app.post("/toot", (req, res) => {
  const newToot = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };
  db.collection("toots")
    .add(newToot)
    .then((doc) => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch((err) => {
      res.status(500).json({ error: `something went wrong` });
      console.error(err);
    });
});

const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPass: req.body.confirmPass,
    handle: req.body.handle
  };

  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = 'Must not be empty';
  } else if (!isEmail(newUser.email)) {
    errors.email = 'Must be a valid email address';
  }

  if (isEmpty(newUser.password)) errors.password = "Must not be empty";
  if (newUser.password != newUser.confirmPass)
    errors.confirmPass = "Passwords must match";
  if (isEmpty(newUser.handle)) errors.handle = "Must not be empty";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "email is already in use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

exports.api = functions.https.onRequest(app);
