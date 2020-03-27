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

exports.getToot = (req, res) => {
  let tootData = {};
  db.doc(`/toots/${req.params.tootId}`).get()
  .then((doc) =>{
    if(!doc.exists){
      return res.status(404).json({error: 'Toot not found'});
    }
    tootData = doc.data();
    tootData.tootId = doc.id;
    return db.collection('comments').where('screamId', '==', req.params.tootId).get();
  })
  .then((data) =>{
    tootData.comments = [];
    data.forEach((doc) =>{
      tootData.comments.push(doc.data())
    });
    return res.json(tootData);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ error: err.code });
    
  });
};

exports.commentOnToot = (req, res) => {
  if(req.body.body.trim() === '') return res.status(400).json({error: 'Must not be empty'});

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    tootId: req.params.tootId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl
  };

  db.doc(`/toots/${req.params.tootId}`).get()
  .then((doc) =>{
    if(!doc.exists){
      return res.status(404).json({error: 'Toot not found'});
    }
    return db.collection('comments').add(newComment);
  })
  .then(() =>{
    res.json(newComment);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });
}