import { initApp, getServiceAccount } from "./firebaseInit";
const fireAdmin = initApp();
const formidable = require('formidable');
import {getFieldDataInTable} from "./tableObj";

const gcs = require('@google-cloud/storage');
const serviceAccount = getServiceAccount();
const storage = new gcs({
    projectId: serviceAccount.projectId,
    keyFilename: 'lib/Inventory-5949b6de0981.json'
});
import {getCompanyID} from "./company";

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

export const uploadProducts = function(req, res){
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
                        return res.status(401);
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
};
export const getProducts = function(req, res) {
    if (req.method === 'GET') {
        const idToken = req.header("idToken");
        console.info("idToken: " + idToken);
        fireAdmin.auth().verifyIdToken(idToken).then(function (decodedToken) {
            console.info("done verifyToken" + decodedToken);
            const id = decodedToken.uid;
            console.info("done docodedToken.uid" + id);
            getCompanyID(id).then(function (company_id) {
                console.info("company_id = " + company_id);
                getFieldDataInTable('Products',  'company_id', '*', false, company_id).then(function(allProducts){
                    const retVal = JSON.stringify(allProducts);
                    console.info("all_products" + retVal);
                    return res.send(retVal);
                }).catch(function(error){
                    console.error(error.toString());
                    return res.status(401).send(error.toString());
                });

            }).catch(function (error) {
                console.error(error.toString());
                return res.sendStatus(400);
            });
        }).catch(function (error) {
            return res.sendStatus(400);
        });
    } else {
        return res.sendStatus(400);
    }
};

