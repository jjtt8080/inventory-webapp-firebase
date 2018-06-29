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
const fs = require("fs");

const formidable = require('formidable');
app.use(bodyParser);


// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');


import * as firebase from 'firebase-admin';

const serviceAccount = require("../lib/Inventory-5949b6de0981.json");
const initApp = function (serviceAcct: any, name: string) {
    return firebase.initializeApp({
        credential: admin.credential.cert(serviceAcct),
        databaseURL: "https://inventory-6c189.firebaseio.com",
        storageBucket: "inventory-6c189.appspot.com"
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
                return res.status(200).send();
            }).catch(function (error) {
            return res.status(400).send(error.toString());
        });
    }
});

const updateFieldInTable = function (tableName, key, keyValue, updateObj) {
    const db = fireAdmin.firestore();
    console.info('update Field ' + JSON.stringify(updateObj));
    db.collection(tableName).where(key, '==', keyValue).get().then(function (uSnapshot) {
        uSnapshot.forEach(function (u) {
            u.ref.update(updateObj).then(updateS => {
                console.info("update " + tableName + ', primary key: ' + key + ',fieldID:' + JSON.stringify(updateObj));
                return true;
            }).catch(function (error) {
                console.error("error updating field in " + tableName + "for " + key + " : " + keyValue);
                return false;
            });

        });
    }).catch(function (error) {
        console.error("error updating field in " + tableName + ', error :' + error);
        return false;
    });
};
const updateCompanyInfoInUser = function (db, u, companyID, res) {
    return new Promise(function (resolve, reject) {
        db.collection('Users').where('email', '==', u.email).get().then(function (userSnap) {
            userSnap.forEach(function (iu) {
                console.log("add company to user" + u.email);
                const updatedData = iu.data();
                updatedData['company_id'] = companyID;
                console.log(JSON.stringify((updatedData)));
                iu.ref.set(updatedData);
            });
            resolve(true);
        }).catch(function (getUserError) {
            console.error("error setting company_id in Users" + getUserError.toString());
            reject(false);
        });
    });
};
const getFieldDataInTable = function (tableName, key, fieldIDToReturn, isPrimaryKey, keyValueConstraint) {
    const db = fireAdmin.firestore();
    return new Promise(function (resolve, reject) {
        if (isPrimaryKey === true) {
            db.collection(tableName).doc(key).get().then(uSnapshot => {
                const doc = uSnapshot.data();
                const fieldValue = doc[fieldIDToReturn];
                const returnValue = {};

                returnValue[fieldIDToReturn] = fieldValue;
                resolve(returnValue);
            }).catch(function (error) {
                reject("");
            });
        } else {
            db.collection(tableName).where(key, '==', keyValueConstraint).get().then(function (uSnapshot) {
                console.log("getting field record using constraint" + keyValueConstraint);
                const accuValue = {};
                if (uSnapshot.size === 1) {
                    console.log("found 1 record where key" + key + ' == ' + keyValueConstraint);
                    uSnapshot.forEach(e => {
                        const fieldValue = e.data()[fieldIDToReturn];
                        accuValue[fieldIDToReturn] = fieldValue;
                    });
                    resolve(accuValue);
                } else {

                    accuValue[fieldIDToReturn] = [];
                    uSnapshot.forEach(e => {
                        const fieldValue = e.data()[fieldIDToReturn];
                        accuValue[fieldIDToReturn].push(fieldValue);
                    });
                    console.info(JSON.stringify(accuValue));
                    resolve(accuValue);
                }
            }).catch(function (error) {
                reject("");
            });
        }
    });
}
const getCompanyID = function (id) {
    const db = fireAdmin.firestore();
    let company_id = -1;
    return new Promise(function (resolve, reject) {
        fireAdmin.auth().getUser(id).then(function (u) {
            console.info("done getUser email " + u.email);
            db.collection('Users').where("email", '==', u.email).get()
                .then(function (userSnapshot) {
                    console.info("done User collection, number of user found:" + userSnapshot.size);

                    userSnapshot.forEach(function (s) {
                        console.info("begin User foreach" + JSON.stringify(s.data()));
                        company_id = s.data().company_id;
                        console.info("company_id" + company_id);
                        console.info("returned company_id" + company_id);
                        resolve(company_id);
                    });
                    resolve(company_id);
                }).catch(function (error) {
                console.error("Can't find user from admin email" + u.email);
                reject(error);
            });
        }).catch(function (error) {
            console.error("Can't find user id 1 " + id + error.toString());
            reject(error);
        });
    });
};
const getCompanyFromReferalCode = function (req, res) {

    const idToken = req.header("idToken");
    fireAdmin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            const db = fireAdmin.firestore();
            const uid = decodedToken.uid;

            const rCode = req.header("rCode");
            if (rCode !== "" && rCode !== undefined) {
                fireAdmin.auth().getUser(uid).then(u => {
                    getFieldDataInTable('Companies', 'referalCode', 'id', false, rCode).then(function (companyID) {
                        if (companyID['id'] !== undefined && companyID['id'] !== "") {
                            console.log("Setting company info in user: " + u.email + "companyID" + companyID);
                            updateCompanyInfoInUser(db, u, companyID['id'], res).then(function (error) {
                                db.collection('Companies').where('id', '==', companyID['id']).get()
                                    .then(cSnapShot => {
                                        console.info("done cSnapshot" + cSnapShot);
                                        cSnapShot.forEach(doc => {
                                            console.info("begin cSnapshot for each " +
                                                doc.data().name);
                                            const companyInfo = JSON.stringify(doc.data());
                                            console.info("done cSnapshot for each" + companyInfo);
                                            console.info("before res.send 1");
                                            return res.send(companyInfo);
                                        });
                                        if (cSnapShot.size === 0) {
                                            return res.status(200).send();
                                        }
                                    }).catch(function (error2) {
                                    return res.status(400).send(error2.toString());
                                });
                            }).catch(function (error) {
                                console.error("error updating the company info in user");
                                return res.status(401).send(error.toString());
                            });
                        } else {
                            return res.status(401).send("company id not defined");
                        }
                    }).catch(function (error) {
                        console.error("error in getting field data" + error.toString());
                        res.status(401).send(error.toString());
                    });

                }).catch(function (error) {
                    console.error("error in authentication user" + error.toString());
                    res.status(401).send(error.toString());
                });
            } else {
                res.status(401).send();
            }
        }).catch(error => {
        res.status(401).send(error.toString());
    });
};

exports.getCompany = functions.https.onRequest((req, res) => {
    if (req.method === 'GET') {
        const idToken = req.header("idToken");
        console.info("idToken: " + idToken);
        const rCode = req.header("rCode");
        if (rCode !== undefined && rCode !== "") {
            console.info("from rCode: " + rCode);
            getCompanyFromReferalCode(req, res);
        }
        else {
            console.info(" rCode empty ");
            fireAdmin.auth().verifyIdToken(idToken).then(function (decodedToken) {
                console.info("done /" + decodedToken);
                const db = fireAdmin.firestore();
                const id = decodedToken.uid;
                console.info("done docodedToken.uid" + id);
                getCompanyID(id).then(function (company_id) {
                    console.info("done getCompany_ID" + company_id);
                    if (company_id === -1 || !company_id) {
                        res.status(400).send("company id not defined or -1");
                    }
                    else {
                        db.collection('Companies').where("id", '==', company_id).get()
                            .then(cSnapShot => {
                                console.info("done cSnapshot" + cSnapShot);
                                cSnapShot.forEach(doc => {
                                    console.info("begin cSnapshot for each " +
                                        doc.data().name);
                                    const companyInfo = JSON.stringify(doc.data());
                                    console.info("done cSnapshot for each" + companyInfo);
                                    console.info("before res.send 1");

                                    return res.send(companyInfo);
                                });
                                if (cSnapShot.size === 0) {
                                    return res.status(200).send("successfully get 0 company.");
                                }
                            }).catch(function (error) {
                            return res.status(400).send(error.toString());
                        });
                    }
                }).catch(function (error) {
                    console.error("error get companyID" + idToken);
                    return res.status(401).send(error.toString());
                });
            }).catch(function (error) {
                console.error("failed to authenticate");
                return res.status(401).send(error.toString());
            });
        }
    }
    else {
        return res.sendStatus(400);
    }
});
const getNextCompanyID = function (db) {
    console.info("in getNextCompany");
    return new Promise(function (resolve, reject) {
        const docref = db.collection('Users').doc().then(u => {
            console.log("get the new id:" + docref.id);
            resolve(docref.id);
        }).catch(function (error) {
            console.error("Companies collection not found");
            reject(error.toString());
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
});


const gcs = require('@google-cloud/storage');

const storage = new gcs({
    projectId: serviceAccount.projectId,
    keyFilename: 'lib/Inventory-5949b6de0981.json'
});


const handlecsvInput = function (fileName, companyID, uploader) {
    return new Promise(function (resolve, reject) {
        console.info("handlcsvInput");
        const bucket = storage.bucket('inventory-6c189.appspot.com');
        console.info("storage bucket" + '/uploads' + fileName);
        const inputFile = bucket.file('/uploads/' + fileName);


        const csv = require("csvtojson/v2");
        console.info("csv");
        const converter = csv({
            noheader: false,
            trim: true,
            objectMode: true
        });
        const db = fireAdmin.firestore();
        let totalNumRecords = 0;
        let totalError = 0;
        console.log("starting opening file");

        const readStream = inputFile.createReadStream();

        converter.fromStream(readStream).subscribe((jsonObj) => {
            jsonObj["company_id"] = companyID;
            jsonObj["employee_email"] = uploader;
            console.log(JSON.stringify(jsonObj));
            db.collection('Products').doc().set(jsonObj).then(p => {
                totalNumRecords += 1;
                console.log("inserted 1 record");
            }).catch(function (error) {
                console.error("can't insert data");
                totalError += 1;
            });
        }).on('done', function (error) {
            if (!error) {
                console.log("total # of records inserted" + totalNumRecords + " total errors:" + totalError);
                const returnObj = {success: totalNumRecords, failed: totalError};
                resolve(returnObj);
            } else {
                reject(error);
            }
        });
        readStream.resume();


    });
};

exports.uploadProducts = functions.https.onRequest((req, res) => {
    const idToken = req.header("idToken");
    console.info("idToken: " + idToken);
    fireAdmin.auth().verifyIdToken(idToken).then(function (decodedToken) {
        console.info("done verifyToken" + decodedToken);
        const id = decodedToken.uid;
        console.info("done docodedToken.uid" + id);
        fireAdmin.auth().getUser(id).then(function (u) {
            getCompanyID(id).then(function (company_id) {
                const form = new formidable.IncomingForm();
                form.multiples = true;
                form.parse(req, function (err, fields, files) {
                    if (err) console.log(err);
                });
                form.on('field', function (name, value) {
                    console.log(name + ":" + value);
                    if (value.endsWith(".csv") || value.endsWith(".txt")) {
                        handlecsvInput(value, company_id, u.email).then(function (returnObj) {
                            return res.send(JSON.stringify(returnObj));
                        }).catch(error => {
                            return res.status(401).send(JSON.stringify(error));
                        })
                    } else if (value.endsWith(".json")) {
                        return res.status(401);
                    }
                    else {
                        res.status(401);
                    }

                });
            }).catch(function (error) {
                console.error(error.toString());
                return res.sendStatus(400);
            });
        }).catch(function (error) {
            console.error(error.toString());
            return res.sendStatus(400);
        });
    }).catch(function (error) {
        console.error(error.toString());
        return res.sendStatus(400);
    });
});
exports.getProducts = functions.https.onRequest((req, res) => {
    if (req.method === 'GET') {
        const db = fireAdmin.firestore();

        const idToken = req.header("idToken");
        console.info("idToken: " + idToken);
        fireAdmin.auth().verifyIdToken(idToken).then(function (decodedToken) {
            console.info("done verifyToken" + decodedToken);

            const id = decodedToken.uid;
            console.info("done docodedToken.uid" + id);
            getCompanyID(id).then(function (company_id) {
                console.info("company_id = " + company_id);
                /*
                getFieldDataInTable('Products',  'company_id', 'product_id', false, company_id).then(function(prod_id){
                    console.info("prod_id" + prod_id);
                }).catch(function(error){
                    console.error(error.toString());
                });
                */

                db.collection('Products').where('company_id', '==', company_id).get()
                    .then(function (snapShot) {
                        console.info("snapshot size: " + snapShot.size);
                        let accData = "[";
                        let i = 0;
                        snapShot.forEach(function (doc) {
                            const p = doc.data();
                            const t = JSON.stringify(p);
                            console.log("snapShot for each" + t);
                            accData += t;
                            if (i < snapShot.size - 1)
                                accData += ",";
                            i += 1;
                        });
                        accData += "]";
                        console.info("accData:" + accData);
                        return res.send(accData);
                        //res.status(200);
                    }).catch(function (error) {
                    console.error(error.toString());
                    return res.status(401);
                });
            }).catch(function (error) {
                console.error(error.toString());
                return res.status(400);
            });
        }).catch(function (error) {
            return res.sendStatus(400);
        });
    } else {
        return res.sendStatus(400);
    }
});

const formDataFromReq = function (req) {
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
        state: s
    };
    return data;
};


const updateCompanyInfo = function (cSnapShot, u, db, req, res, company_id) {
    let bAlreadySetup = false;
    console.info("update Compoany Info" + cSnapShot.size);
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
                return res.sendStatus(400);
            });

        }
    });
};
const createnewCompanyInfo = function (db, data, u, res) {
    console.info("can not find such company, start from scratch");
    getNextCompanyID(db).then(function (companyID) {
        console.info("next company id is " + companyID + 'admin email set to:' + u.email);
        data['id'] = companyID;
        data['admin_email'] = u.email;
        db.collection('Companies').doc(companyID).set(data).then(function (f) {
            console.log("add company successfully!");
            updateCompanyInfoInUser(db, u, companyID, res).then(function (error) {
                console.log("add company in user successfully!");
                return res.sendStatis(200);
            }).catch(function (error) {
                console.error("error updating company info in user");
                return res.sendStatus(401);
            })

        }).catch(function (error1) {
            return res.sendStatus(400);
        });


    }).catch(function (error2) {
        console.error("can't finish insert data" + error2.toString());
        return res.sendStatus(400);
    });
};
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
                                    return res.esndStatus(401);
                                }
                            }).catch(function (error) {
                            console.error("set company where condition failed" + error.toString());
                            return res.sendStatus(400);
                        });
                    }
                }).catch(function (error) {
                    //No such company ID
                    createnewCompanyInfo(db, data, u, res);
                });
            }).catch(function (error) {
                return res.sendStatus(201);
            });
        }).catch(function (errorU) {
        return res.sendStatus(201);
    });
});
const credential = require('../lib/nodemailer_pass.json').web;
const handlebars = require('handlebars');

const readHTMLFile = function (path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};


const randomString = function (len, charSet) {
    const charSetAssigned = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let r = '';
    for (let i = 0; i < len; i++) {
        const randomPoz = Math.floor(Math.random() * charSetAssigned.length);
        r += charSet.substring(randomPoz, randomPoz + 1);
    }
    return r;
};
exports.sendEmail = functions.https.onRequest((req, res) => {
    const smtpTransport = require('nodemailer-smtp-transport');
    const idToken = req.header("idToken");
    console.log("access token" + idToken);
    fireAdmin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            const uid = decodedToken.uid;
            console.info("getUser:" + uid);
            fireAdmin.auth().getUser(uid).then(u => {
                const e = u.email;
                const jsonText = JSON.stringify(req.body);
                console.info("json text" + JSON.stringify(req.body));

                const data = JSON.parse(jsonText);
                const maillist = data.email;

                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true,
                    service: 'gmail',
                    auth: {
                        type: 'plain',
                        user: credential.user,
                        pass: credential.password
                    },
                    logger: true,
                    debug: true
                });


                const mailOptions = {
                    from: e,
                    to: "",
                    subject: 'Invitatoin to sign up the scanfairy account',
                    html: {},
                    auth: {
                        type: 'plain',
                        user: credential.user,
                        pass: credential.pass
                    }
                };
                const rCode = randomString(10, 'abcdefghijklmnopqrstuvwxyz');
                getCompanyID(uid).then(function (company_id) {
                    console.log("Update companies " + company_id + " with referalCode " + rCode);
                    const updateObj = {referalCode: rCode};
                    updateFieldInTable('Companies', "id", company_id, updateObj);
                    const referalLink = 'https://inventory-6c189.firebaseapp.com/signup.html?referal=true&rCode=' + rCode;
                    maillist.forEach(function (to, i, array) {
                        mailOptions.to = " Sender <" + to + ">";
                        readHTMLFile(__dirname + '/../public/nodemailer-templ.html', function (err, html) {
                            const template = handlebars.compile(html);
                            const replacements = {
                                username: to,
                                fromuser: e,
                                hostname: referalLink
                            };

                            const htmlToSend = template(replacements);
                            mailOptions.html = htmlToSend;
                            transporter.sendMail(mailOptions).catch(function (error) {
                                if (err) {
                                    console.error('Sending to ' + to + ' failed: ' + error);
                                    res.body = "failed to send email to" + to + error.errorCode;
                                    res.sendStatus(400);
                                    return;
                                } else {
                                    console.log('Sent to ' + to);
                                }

                                if (i === maillist.length - 1) {
                                    res.send("send successfully!");
                                    smtpTransport.close();
                                }
                            });
                        });
                    });
                    return res.sendStatus(200);
                }).catch(function (error) {
                    console.error("error getting company ID" + error.toString());
                    return res.status(401).send(error.toString());
                });
            }).catch(function (error) {
                console.error(error);
                return res.status(401).send(error.toString());
            });
        }).catch(function (error) {
        console.error(error);
        return res.status(401).send(error.toString());
    });

});

exports.getTeam = functions.https.onRequest((req, res) => {

    const idToken = req.header("idToken");
    console.log("access token" + idToken);
    fireAdmin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            const uid = decodedToken.uid;
            console.info("getUser:" + uid);
            fireAdmin.auth().getUser(uid).then(function (u) {
                getCompanyID(uid).then(function (companyID) {
                    getFieldDataInTable('Users', 'company_id', 'email', false, companyID).then(function (team_info) {
                        console.log("email_list" + team_info);
                        return res.send(team_info);
                    }).catch(function (error) {
                        console.error("error while get the team member emails 1" + error.toString());
                        return res.sendStatus(401);
                    });
                }).catch(function (error) {
                    console.error("can't get companyID for user" + error.toString());
                    return res.sendStatus(401);
                });

            }).catch(function (error1) {
                return res.sendStatus(401);
            });
        }).catch(function (error2) {
        return res.sendStatus(401);
    });
});