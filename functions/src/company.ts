import {getFieldDataInTable} from "./tableObj";
import {firebaseInit} from "./firebaseInit";
const fireAdmin = firebaseInit.initApp('inventory');
const functions = require('firebase-functions');

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
export const getCompanyID = function (id) {
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

export const getCompany = function(req, res) {
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
};
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
export const setCompany = function (req, res) {
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
}

