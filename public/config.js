
var config = {
    apiKey: "AIzaSyAsguMDgAuRwokpC6hjyZWInCOMhZlhU2k",
    authDomain: "inventory-6c189.firebaseapp.com",
    databaseURL: "https://inventory-6c189.firebaseio.com",
    storageBucket: "inventory-6c189.appspot.com",
};
if (!firebase.apps.length) {
    firebase.initializeApp(config);
}


// Google OAuth Client ID, needed to support One-tap sign-up.
// Set to null if One-tap sign-up is not supported.
var CLIENT_ID = '504078278103-tiqf5b1i8un0u836v4pqj06816s036to.apps.googleusercontent.com';