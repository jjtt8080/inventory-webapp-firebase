"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require('firebase-admin');
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule)
        return mod;
    var result = {};
    if (mod !== null)
        for (var k in mod)
            if (Object.hasOwnProperty.call(mod, k))
                result[k] = mod[k];
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
    getServiceAccount() {
        return svc;
    }
    initApp() {
        return fireAdmin_static;
    }
}
exports.getServiceAccount = firebaseInit.prototype.getServiceAccount;
exports.initApp = firebaseInit.prototype.initApp;
exports.getUIDFromToken = function (idToken) {
    return new Promise(function getID(resolve, reject) {
        fireAdmin_static.auth().verifyIdToken(idToken).then(function decodedF(decodedToken) {
            return resolve(decodedToken.uid);
        }).catch(function getError(error) {
            return reject(error.toString());
        });
    });
};
exports.getUserFromToken = function (idToken) {
    var promise = fireAdmin_static.auth().verifyIdToken(idToken);
    return new Promise(function getUser(resolve, reject) {
        promise.then(function decodedF(decodedToken) {
            console.info("decoded Token:" + JSON.stringify(decodedToken));
            return resolve(fireAdmin_static.auth().getUser(decodedToken.uid));
        }).catch(function getError(error) {
            return reject(error);
        });
    });
};
//# sourceMappingURL=firebaseInit.js.map