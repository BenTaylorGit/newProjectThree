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
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  db.collection("toots")
    .add(newToot)
    .then((doc) => {
      const resToot = newToot;
      resToot.tootId = doc.id;
      res.json(resToot);
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
    return db.collection('comments').orderBy('createdAt', 'desc').where('tootId', '==', req.params.tootId).get();
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
    return doc.ref.update({commentCount: doc.data().commentCount +1});
    
  })
  .then(() =>{
    return db.collection('comments').add(newComment);
  })
  .then(() =>{
    res.json(newComment);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });
};

exports.likeToot = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('tootId', '==', req.params.tootId)
    .limit(1);

  const tootDocument = db.doc(`/toots/${req.params.tootId}`);

  let tootData;

  tootDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        tootData = doc.data();
        tootData.tootId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'toot not found' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection('likes')
          .add({
            tootId: req.params.tootId,
            userHandle: req.user.handle
          })
          .then(() => {
            tootData.likeCount++;
            return tootDocument.update({ likeCount: tootData.likeCount });
          })
          .then(() => {
            return res.json(tootData);
          });
      } else {
        return res.status(400).json({ error: 'toot already liked' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.unlikeToot = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('tootId', '==', req.params.tootId)
    .limit(1);

  const tootDocument = db.doc(`/toots/${req.params.tootId}`);

  let tootData;

  tootDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        tootData = doc.data();
        tootData.tootId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'toot not found' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: 'toot not liked' });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            tootData.likeCount--;
            return tootDocument.update({ likeCount: tootData.likeCount });
          })
          .then(() => {
            res.json(tootData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.deleteToot = (req, res) => {
  const document = db.doc(`/toots/${req.params.tootId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'toot not found' });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: 'Unauthorized' });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: 'toot deleted successfully' });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};