const firebase = require('firebase-admin');
const nconf = require('nconf');

const { databaseURL, credential } = nconf.get('firebase');

firebase.initializeApp({
  credential: firebase.credential.cert(JSON.parse(credential)),
  databaseURL,
});

const db = firebase.database();
const ref = db.ref('petitions');

ref.once('value', (snapshot) => {
  console.log('firebase_______value==============');
  console.log(snapshot.val());
});

module.exports = () => {
  return ref;
};
