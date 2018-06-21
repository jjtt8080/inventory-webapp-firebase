// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
//import {qualifiedTypeIdentifier} from "babel-types";

const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');


import * as firebase from 'firebase-admin';

const serviceAccount = require("../lib/Inventory-5949b6de0981.json");
const initApp = function (serviceAcct: any, name: string) {
    return firebase.initializeApp({
        credential: admin.credential.cert(serviceAcct),
        databaseURL: "https://inventory-6c189.firebaseio.com"
    });
};

const fireAdmin = initApp(serviceAccount, "inventory");

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original

exports.verifyToken = functions.https.onRequest((req, res) => {
    if (req.method === 'POST') {
        const idToken = req.header.idToken;
        fireAdmin.auth().verifyIdToken(idToken)
            .then(function (decodedToken) {
                return res.sendStatus(200);
            }).catch(function (error) {
            return res.sendStatus(400);
        });
    }
});
const getCompanyID = function (id) {
    const db = fireAdmin.firestore();
    let company_id = -1;
    return new Promise(function (resolve, reject) {
        fireAdmin.auth().getUser(id).then(function (u) {
            console.info("done getUser email " + u.email);
            db.collection('Users').where('email', '==', u.email).get()
                .then(function(userSnapshot) {
                    console.info("done User collection, number of user found:" + userSnapshot.size);
                    userSnapshot.forEach(function(s){
                        console.info("begin User foreach" + JSON.stringify(s.data()));
                        company_id = s.data()["company_id"];
                        console.info("company_id" + company_id);
                    });
                    console.info("returned company_id" + company_id);
                    resolve(company_id);
                }).catch(function (error) {
                console.error("Can't find user from admin email" + u.email);
                 reject(error);
            })
        }).catch(function (error) {
            console.error("Can't find user id 1 " + id + error.errorMessage);
            reject(error);
        });
    });
};
exports.getCompany = functions.https.onRequest((req, res) => {
    if (req.method === 'GET') {
        const idToken = req.header("idToken");
        console.info("idToken: " + idToken);
        fireAdmin.auth().verifyIdToken(idToken).then(function (decodedToken) {
            console.info("done verifyToken" + decodedToken);
            const db = fireAdmin.firestore();
            const id = decodedToken.uid;
            console.info("done docodedToken.uid" + id);
            getCompanyID(id).then(function (company_id) {
                console.info("done getCompany_ID" + company_id);
                if (company_id === -1 || !company_id) {
                    res.sendStatus(400);
                }
                else {
                    db.collection('Companies').where('id', '==', company_id).get()
                        .then(cSnapShot => {
                            console.info("done cSnapshot" + cSnapShot);
                            cSnapShot.forEach(doc => {
                                console.info("begin cSnapshot for each " +
                                    doc.data().name);
                                const companyInfo = JSON.stringify(doc.data());
                                console.info("done cSnapshot for each" + companyInfo);
                                console.info("before res.send 1");
                                res.send(companyInfo);
                            });
                            if (cSnapShot.size === 0) {
                                res.sendStatus(200);
                            }
                        }).catch(function (error) {
                        res.sendStatus(400);
                    });
                }
            }).catch(function (error) {
                console.log("error get companyID" + idToken);
                res.sendStatus(400);
            });
        }).catch(function(error) {
            console.log("failed to authenticate");
            res.sendStatus(401);
        });
    }
    else {
        res.sendStatus(400);
    }
});
const getNextCompanyID = function (db) {
    console.info("in getNextCompany");
    return new Promise(function (resolve, reject) {
        db.collection('Companies').get().then(function(q)  {
            console.log("# of companies" + q.size);
            resolve(q.size + 1);
        }).catch(function (error) {
            console.log("Companies collection not found");
            reject(error.errorMessage);
        });
    });
};
exports.getUser = functions.https.onRequest((req, res) => {
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
                db.collection('Users').where('email', '==', e).get().then( function(userFromDB ) {
                    userFromDB.forEach(doc => {
                        const userData = {
                            emp_id: doc.data().emp_id,
                            email: e,
                            first_name: doc.data().first_name,
                            last_name: doc.data().last_name
                        };
                        const jsonText = JSON.stringify(userData);
                        console.info("jsonText" + jsonText);
                        res.send(jsonText);
                        return;
                       });
                }, function (error) {
                    res.sendStatus(401);
                });
            }, function (error) {
                res.sendStatus(401);
            })
        }, function (error) {
            res.sendStatus(401);
        });
});
exports.createUser = functions.https.onRequest((req, res) => {
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
            fireAdmin.auth().getUser(uid).then(function(u) {
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
                    }else {
                        const docref = db.collection('Users').doc();
                        console.log("get the new id:" + docref.id);
                        console.log("data:" + JSON.stringify(data));
                        docref.set(data).then(function(updateStatus){
                            res.sendStatus(201);
                        }).catch(function (errorUS) {
                            console.error("error uinsert new document" +errorUS.errorMessage);
                            res.sendStatus(400);
                        })
                    }
                }).catch(function (errorU) {
                        console.log(errorU.errorMessage);
                        return res.sendStatus(400);
                });
            }, function (errorS) {
                res.sendStatus(401);
            });
        }, function (error) {
            console.log(error.errorMessage);
        });
});

exports.getProducts = functions.https.onRequest((req, res) => {
    if (req.method === 'GET') {
        const db = fireAdmin.firestore();
        let accData = "";
        const idToken = req.header("idToken");
        console.info("idToken: " + idToken);
        fireAdmin.auth().verifyIdToken(idToken).then(function (decodedToken) {
            console.info("done verifyToken" + decodedToken);

            const id = decodedToken.uid;
            console.info("done docodedToken.uid" + id);
            getCompanyID(id).then(function (company_id) {
                console.info("company_id = " + company_id);
                db.collection('Products').where('company_id', '==', company_id).get()
                    .then(snapShot => {
                        //console.info("snapshot : " + JSON.stringify(snapShot));
                        snapShot.forEach(doc => {
                            const p = doc.data();
                            accData += JSON.stringify(p);
                        });
                        console.log("accData" + accData);
                        res.send(accData);
                        //res.status(200);
                    }).catch(function (error) {
                    console.error(error.toString());
                });
            }).catch(function (error) {
                console.error(error.toString());
                res.sendStatus(400);
            });
        }).catch(function (error) {
            res.sendStatus(400);
        });
    }
});

const formDataFromReq = function(req) {
    const cname = req.body.company_name;
    const caddress = req.body.company_address;
    const z = req.body.zip;
    const co = req.body.country;
    const ci = req.body.city;
    const s = req.body.state;
    const data = {
        name: cname,
        address: caddress,
        zip: z,
        country: co,
        city: ci,
        state:s
    };
    return data;
};
const updateCompanyInfoInUser = function(db, u, companyID, res) {
    db.collection('Users').where('email', '==', u.email).get().then(function (userSnap) {
        userSnap.forEach(function (iu) {
            console.log("add company to user" + u.email);
            const  updatedData = iu.data();
            updatedData['company_id'] = companyID;
            console.log(JSON.stringify((updatedData)));
            iu.ref.set(updatedData);
        });
        res.sendStatus(201);
    }).catch(function (getUserError) {
        console.error("error setting company_id in Users" + getUserError.errorMessage);
    });

};
const updateCompanyInfo = function(cSnapShot, u, db, req, res, company_id) {
    let bAlreadySetup = false;
    console.info("update Compoany Info" +cSnapShot.size);
    cSnapShot.forEach(doc => {
        const stored_name = doc.data()['name'];
        const stored_addr = doc.data()['address'];
        const stored_zip = doc.data()['zip'];
        const stored_co = doc.data()['country'];
        const stored_city = doc.data()['city'];
        const stored_state = doc.data()['state'];
        //const stored_id = doc.data()['id'];
        console.info("stored addr" + stored_addr);
        const reqData = formDataFromReq(req);
        reqData['id'] = company_id;
        if (doc.data()['admin_email'] !== u.email) {
            if (stored_name !== reqData.name ||
                stored_addr !== reqData.address ||
                stored_zip !== reqData.zip ||
                stored_co !== reqData.country ||
                stored_city !== reqData.city ||
                stored_state !== reqData.state) {
                console.error("email is not admin_email" + u.email + doc.data()['admin_email']);
                return req.sendStatus(403);
            }

        }
        else {
            bAlreadySetup = true;
            console.info("The same company already setup, changing..." + reqData.name);
            console.info("setup companies with data" + JSON.stringify(reqData));
            const id = doc.id;
            reqData['admin_email'] = u.email;
            db.collection('Companies').doc(id).set(reqData).then(p => {
                return res.sendStatus(201);
            }).catch(function (error) {
                console.error("can't insert data");
                res.sendStatus(400);
            });

        }
    });
};
const createnewCompanyInfo = function(db, data, u, res) {
    console.info("can not find such company, start from scratch");
    getNextCompanyID(db).then(function (companyID) {
        console.info("next company id is " + companyID + 'admin email set to:' + u.email);
        data['id'] = companyID;
        data['admin_email'] = u.email;
        db.collection('Companies').doc().set(data).then(function (f) {
            console.log("add company successfully!");
        }).catch(function (error1) {
            res.sendStatus(400);
        });
        updateCompanyInfoInUser(db, u, companyID, res);

    }).catch(function (error2) {
        console.error("can't finish insert data" + error2.errorMessage);
        res.sendStatus(400);
    });
}
exports.setCompany = functions.https.onRequest((req, res) => {
    if (req.method !== 'POST') {
        return res.sendStatus(201);
    }
    const idToken = req.header("idToken");
    fireAdmin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            const db = fireAdmin.firestore();
            const uid = decodedToken.uid;

            const data = formDataFromReq(req);
            fireAdmin.auth().getUser(uid).then(u => {
                console.log("getUser successfully in setCompany" + JSON.stringify(req.body));

                getCompanyID(uid).then(function (company_id) {
                    if (!company_id) {
                        createnewCompanyInfo(db, data, u, res);
                    } else {

                        db.collection('Companies').where('id', '==', company_id).get()
                            .then(function (cSnapShot) {
                                if (cSnapShot.size > 0) {
                                    updateCompanyInfo(cSnapShot, u, db, req, res, company_id);
                                } else {
                                    res.esndStatus(401);
                                }
                            }).catch(function (error) {
                            console.error("set company where condition failed" + error.errorMessage);
                            res.sendStatus(400);
                        });
                    }
                }).catch(function (error) {
                    //No such company ID
                    createnewCompanyInfo(db, data, u, res);

                });
            }).catch(function (errorA) {
                res.sendStatus(201);
            });
        }).catch(function (errorU) {
        res.sendStatus(201);
    });
});


exports.sendEmail = functions.https.onRequest((req, res) => {
    const jsonText = JSON.stringify(req.body);
    console.info("json text" + JSON.stringify(req.body));

    const data = JSON.parse(jsonText);
    const maillist = data.email;
    const smtpTransport = nodemailer.createTransport(
        "SMTP",{
            host: '',
            //  secureConnection: true,         // use SSL
            port: 25
        });

    const mailOptions = {
        from: 'scanfairy.supp@gmail.com',
        to: "",
        subject: 'Invitatoin to sign up the scanfairy account',
        text: 'Hi, this is the ScanFairy invitation email. click the <a href=\"https://inventory-6c189.firebaseapp.com\">link</a> to sign up.'
    };

    maillist.forEach(function (to, i , array) {
        mailOptions.to = to;

        smtpTransport.sendMail(mailOptions, function (err) {
            if (err) {
                console.log('Sending to ' + to + ' failed: ' + err);
                return;
            } else {
                console.log('Sent to ' + to);
            }

            if (i === maillist.length - 1) { smtpTransport.close(); }
        });
    });
});