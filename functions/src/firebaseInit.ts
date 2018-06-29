const admin = require('firebase-admin');
import * as firebase from 'firebase-admin';



export namespace firebaseInit {
    const svc = require("../lib/Inventory-5949b6de0981.json");
    const fireAdmin = firebase.initializeApp({
        credential: admin.credential.cert(svc),
        databaseURL: "https://inventory-6c189.firebaseio.com",
        storageBucket: "inventory-6c189.appspot.com"
    });
    export const getServiceAccount = function() {
        return svc;
    };
    export const initApp = function (name: string) {
       return fireAdmin;
    };
};






