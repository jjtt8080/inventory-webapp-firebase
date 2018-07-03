const admin = require('firebase-admin');
import * as firebase from 'firebase-admin';


const svc = require("./inventory-5949b6de0981.json");
const fireAdmin_static = firebase.initializeApp({
    credential: admin.credential.cert(svc),
    databaseURL: "https://inventory-6c189.firebaseio.com",
    storageBucket: "inventory-6c189.appspot.com"
});
class firebaseInit {

    public getServiceAccount(){
        return svc;
    };
   public initApp() {
        return fireAdmin_static;
    };
};
export const getServiceAccount = firebaseInit.prototype.getServiceAccount;
export const initApp = firebaseInit.prototype.initApp;


