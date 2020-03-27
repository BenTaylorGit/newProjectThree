const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello World!");
});

exports.getToots = functions.https.onRequest((req, res) => {
    admin.firestore().collection('toots').get()
    .then(data => {
        data.forEach(doc => {
            let toots = [];
            data.forEach(doc => {
                toots.push(doc.data());
            });
            return res.json(toots);
        })
        .catch(err => console.error(err));
    })
});

exports.createToot = functions.https.onRequest((req, res) => {
    const newToot = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())

    };
    admin.firestore()
    .collection('toots')
    .add(newToot)
    .then((doc) => {
        res.json({message: `document ${doc.id} created successfully`});
    })
    .catch((err) => {
        res.status(500).json({error: `something went wrong`});
        console.error(err);
    });
    });