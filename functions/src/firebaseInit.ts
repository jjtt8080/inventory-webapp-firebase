const admin = require('firebase-admin');
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod !== null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
const firebase = __importStar(require("firebase-admin"));
const svc = require("../bin/Inventory-6808771d5855.json");
const fireAdmin_static = firebase.initializeApp({
    credential: admin.credential.cert(svc),
    databaseURL: "https://inventory-6c189.firebaseio.com",
    storageBucket: "inventory-6c189.appspot.com"
});
class firebaseInit {

    public getServiceAccount(){
        return svc;
    }
   public initApp() {
        return fireAdmin_static;
    }
}
export const getServiceAccount = firebaseInit.prototype.getServiceAccount;
export const initApp = firebaseInit.prototype.initApp;
export const getUIDFromToken = function (idToken:string) {
    return new Promise(function getID(resolve, reject) {
        fireAdmin_static.auth().verifyIdToken(idToken).then(function decodedF(decodedToken) {
            return resolve(decodedToken.uid);
        }).catch(function getError(error) {
            return reject(error.toString());
        })
    })
}
export const getUserFromToken = function (idToken:string) {
    var promise = fireAdmin_static.auth().verifyIdToken(idToken);
    return promise.then(function decodedF(decodedToken) {
        return fireAdmin_static.auth().getUser(decodedToken.uid);
    }).catch(function getError(error) {
        return null;
    });
}

