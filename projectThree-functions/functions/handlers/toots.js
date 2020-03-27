const { db } = require('../util/admin');

exports.getAllToots = (req, res) => {
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
  }

  exports.postOneToot = (req, res) => {
    if(req.body.body.trim()===''){
        return res.status(400).json({body: 'Body must not be empty'});
    }



  const newToot = {
    body: req.body.body,
    userHandle: req.user.handle,
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
};