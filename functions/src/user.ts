import {firebaseInit} from "./firebaseInit";
const fireAdmin = firebaseInit.initApp('inventory');
const functions = require('firebase-functions');
const formidable = require('formidable');
import {getFieldDataInTable, updateFieldInTable} from "./tableObj";

export const getUser =  function(req, res){
    if (req.method !== 'GET') res.sendStatus(400);
    const idToken = req.header("idToken");
    fireAdmin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            const uid = decodedToken.uid;
            console.info("getUser:" + uid);
            fireAdmin.auth().getUser(uid).then(u => {
                const e = u.email;
                console.info("email from uid: " + e);
                const db = fireAdmin.firestore();
                db.collection('Users').where('email', '==', e).get().then(function (userFromDB) {
                    userFromDB.forEach(doc => {
                        const userData = {
                            emp_id: doc.data().emp_id,
                            email: e,
                            first_name: doc.data().first_name,
                            last_name: doc.data().last_name
                        };
                        const jsonText = JSON.stringify(userData);
                        console.info("jsonText" + jsonText);
                        return res.send(jsonText);
                    });

                }).catch(function (error) {
                    console.error("error getting user authenticated" + error.toString());
                    return res.sendStatus(400);
                });
            }).catch(function (error) {
                console.error("error decode token" + error.toString());
                return res.sendStatus(401);
            })
        }).catch(function (error) {
        console.error("error verify token" + error.toString());
        return res.sendStatus(401);
    });
};
export const createUser = function(req, res) {
    if (req.method !== 'POST') res.sendStatus(400);
    const idToken = req.header("idToken");
    console.log("idToken" + idToken);
    fireAdmin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            console.log("createUser: verified token");
            const uid = decodedToken.uid;
            console.log("createUser: uid" + uid);
            const db = fireAdmin.firestore();
            const jsonText = JSON.stringify(req.body);
            console.info("json text" + JSON.stringify(req.body));
            const data = JSON.parse(jsonText);
            fireAdmin.auth().getUser(uid).then(function (u) {
                const e = u.email;
                console.log("getUser finished authen" + e);
                db.collection('Users').where('email', '==', e).get().then(uSnapshot => {
                    console.info("in uSnapshot");
                    if (uSnapshot.size > 0) {
                        uSnapshot.forEach(function (doc) {
                            console.info("usnapshot.forEach");
                            doc.ref.set(data).then(uSn => {
                                return res.sendStatus(201);
                            }).catch(function (errorS) {
                                console.log(errorS);
                            });
                        });
                    } else {
                        const docref = db.collection('Users').doc();
                        console.log("get the new id:" + docref.id);
                        console.log("data:" + JSON.stringify(data));
                        docref.set(data).then(function (updateStatus) {
                            return res.sendStatus(201);
                        }).catch(function (errorUS) {
                            console.error("error uinsert new document" + errorUS.toString());
                            return res.sendStatus(400);
                        })
                    }
                }).catch(function (errorU) {
                    console.error(errorU.toString());
                    return res.sendStatus(400);
                });
            }, function (errorS) {
                return res.sendStatus(401);
            });
        }).catch(function (error) {
        console.error(error.toString());
        return res.sendStatus(401);
    });
}