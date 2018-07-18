import { initApp, getServiceAccount, getUIDFromToken, getUserFromToken } from "./firebaseInit";
const fireAdmin = initApp();
const formidable = require('formidable');
import { getFieldDataInTable } from "./tableObj";

const gcs = require('@google-cloud/storage');
const serviceAccount = getServiceAccount();
const storage = new gcs({
    projectId: serviceAccount.projectId,
    keyFilename: 'lib/Inventory-5949b6de0981.json'
});
import { getCompanyID } from "./company";

const insertRecord = function (jsonObj, totalNumRecords, totalError) {
    const db = fireAdmin.firestore();
    db.collection('Products').doc().set(jsonObj).then(p => {
        totalNumRecords += 1;
        console.log("inserted 1 record");
        return 1;
    }).catch(function (error) {
        console.error("can't insert data");
        totalError += 1;
        return 0;
    });
}
const handlecsvInput = function (fileName: string, companyID, uploader: string) {
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

        let totalNumRecords = 0;
        let totalError = 0;
        console.log("starting opening file");

        const readStream = inputFile.createReadStream();

        converter.fromStream(readStream).subscribe((jsonObj) => {
            jsonObj["company_id"] = companyID;
            jsonObj["employee_email"] = uploader;
            console.log(JSON.stringify(jsonObj));
            insertRecord(jsonObj, totalNumRecords, totalError);
        }).on('done', function (error) {
            if (!error) {
                console.log("total # of records inserted" + totalNumRecords + " total errors:" + totalError);
                const returnObj = { success: totalNumRecords, failed: totalError };
                return resolve(returnObj);
            } else {
                return reject(error);
            }
        });
        readStream.resume();
    });
};
const getCompanyIDFromToken = function(idToken){
    console.info("idToken: " + idToken);
    const promise1 = getUIDFromToken(idToken);
    let u = null;
    const promise2 = promise1.then((uid) => {
        return getCompanyID(uid);
    }).catch(error => {
        return null;
    })
}

export const uploadProducts = function (req, res) {
    const idToken = req.header("idToken");
    const company_id = getCompanyIDFromToken(idToken);
    const promise3 = getUserFromToken(idToken);
    promise3.then(function (u) {
        if (company_id === null || u === null) {
            return res.sendStatus(401);
        }
        const form = new formidable.IncomingForm();
        form.multiples = true;
        
        form.parse(req, function (err, fields, files) {
            if (err) console.log(err);
            return res.status(401).sendStatus(err);
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
        return res.status(401);
        
    }).catch(function (error) {
        console.error(error.toString());
        return res.sendStatus(400);
    });
};
export const getProducts = function (req, res) {
    if (req.method === 'GET') {
        const idToken = req.header("idToken");
        console.info("idToken: " + idToken);
        const company_id = getCompanyIDFromToken(idToken);
        if (company_id !== null) {
            getFieldDataInTable('Products', 'company_id', '*', false, company_id).then(function (allProducts) {
                const retVal = JSON.stringify(allProducts);
                console.info("all_products" + retVal);
                return res.send(retVal);
            }).catch(function (error) {
                    console.error(error.toString());
                    return res.sendStatus(400);
            });
        }else {
            return res.sendStatus(401);
        }
    } else {
        return res.sendStatus(400);
    }
};

