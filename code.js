const firebase = require('firebase-admin');

var serviceAccountSource = require("./source.json"); // source DB key
var serviceAccountDestination = require("./destination.json"); // destiny DB key

const sourceAdmin = firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccountSource)
});

const destinationAdmin = firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccountDestination)
}, "destination");

/* this schema is how your DB is organized in a tree structure. You don't have to care about the Documents
  but you do need to inform the name of your collections and any subcollections, in this
  case we have two collections called users and groups, the all have their documents, but 
  the collection users has its own subcollections, friends and groups, which again have their
  own subcollection, messages.
*/
// const schema = {
//   "fr-marital-status": {}
// };

const schema = require('./progress.json');

var SourceDB = sourceAdmin.firestore();
var DestinationDB = destinationAdmin.firestore();

const copy = (SourceDB, DestinationDB, aux) => {
  return Promise.all(Object.keys(aux).map((collection) => {
    return SourceDB.collection(collection).get()
      .then((data) => {
        let promises = [];
        data.forEach((doc) => {
          const data = doc.data();
          promises.push(
            DestinationDB.collection(collection).doc(doc.id).set(data).then((data) => {
              return copy(SourceDB.collection(collection).doc(doc.id),
              DestinationDB.collection(collection).doc(doc.id),
              aux[collection])
            })
          ); 
        })
      return Promise.all(promises);
    })
  }));
};

copy(SourceDB, DestinationDB, schema).then(() => {
  console.log('SUCCESS');
});

