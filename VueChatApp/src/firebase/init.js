import firebase from 'firebase'
import firestore from 'firebase/firestore'

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBlen_3C8QGKSMnFLyDsWU053HGSCEWdpw",
    authDomain: "chat-8e883.firebaseapp.com",
    databaseURL: "https://chat-8e883.firebaseio.com",
    projectId: "chat-8e883",
    storageBucket: "chat-8e883.appspot.com",
    messagingSenderId: "349336337237",
    appId: "1:349336337237:web:40a567e1060db61d7bcddc",
    measurementId: "G-8J5H676KRJ"
  };
  // Initialize Firebase
  const firebaseApp = firebase.initializeApp(firebaseConfig);


  export default firebaseApp.firestore()