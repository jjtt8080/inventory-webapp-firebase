"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firebaseInit_1 = require("./firebaseInit");
const fireAdmin = firebaseInit_1.initApp();
const db = fireAdmin.firestore();
exports.getFieldDataInTable = function (tableName, key, fieldIDToReturn, isPrimaryKey, keyValueConstraint) {
    return new Promise(function (resolve, reject) {
        if (isPrimaryKey === true) {
            db.collection(tableName).doc(key).get().then(uSnapshot => {
                const doc = uSnapshot.data();
                if (fieldIDToReturn === ('*')) {
                    return resolve(doc);
                }
                else {
                    const fieldValue = doc[fieldIDToReturn];
                    const returnValue = {};
                    returnValue[fieldIDToReturn] = fieldValue;
                    return resolve(returnValue);
                }
            }).catch(function (error) {
                return reject(error.toString());
            });
        }
        else {
            db.collection(tableName).where(key, '==', keyValueConstraint).get().then(function (uSnapshot) {
                console.log("getting field record using constraint: " + keyValueConstraint);
                if (uSnapshot.size === 1) {
                    let accuValue = {};
                    console.log("found 1 record where key" + key + ' == ' + keyValueConstraint);
                    uSnapshot.forEach(e => {
                        if (fieldIDToReturn === '*') {
                            accuValue = e.data();
                        }
                        else {
                            const fieldValue = e.data()[fieldIDToReturn];
                            console.info("field value" + fieldValue);
                            accuValue[fieldIDToReturn] = fieldValue;
                        }
                    });
                    return resolve(accuValue);
                }
                else {
                    const accuValue = [];
                    if (fieldIDToReturn === '*') {
                        uSnapshot.forEach(e => {
                            accuValue.push(e.data());
                        });
                        console.info("resolved 1: " + JSON.stringify(accuValue));
                        return resolve(accuValue);
                    }
                    else {
                        console.info("found " + uSnapshot.size + " 2 records");
                        uSnapshot.forEach(e => {
                            const elem = e.data()[fieldIDToReturn];
                            accuValue.push(elem);
                        });
                        console.info("resolved 2 :" + JSON.stringify(accuValue));
                        return resolve(accuValue);
                    }
                }
            }).catch(function (error) {
                return reject(error.toString());
            });
        }
    });
};
exports.compareJSON = function (target, rhs, fieldsToCompare) {
    for (const key in fieldsToCompare) {
        if (target[key] !== rhs[key]) {
            return false;
        }
    }
    return true;
};
const mergeJSON = function (target, add) {
    function isObject(obj) {
        if (typeof obj === "object") {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    return true; // search for first object prop
                }
            }
        }
        return false;
    }
    for (const key in add) {
        if (add.hasOwnProperty(key)) {
            if (target[key] && isObject(target[key]) && isObject(add[key])) {
                mergeJSON(target[key], add[key]);
            }
            else {
                target[key] = add[key];
            }
        }
    }
    return target;
};
const updateDocumentSnapshot = function (u, tableName, key, updateObj) {
    const promise1 = u.ref.get();
    promise1.then(function (docSnapshot) {
        const origData = docSnapshot.data();
        const mergedData = mergeJSON(origData, updateObj);
        u.ref.update(mergedData);
        return 1;
    }).catch(function (error) {
        return (0);
    });
    return 0;
};
exports.updateFieldInTable = function (tableName, key, keyValue, updateObj) {
    console.info('update Field ' + JSON.stringify(updateObj));
    return new Promise(function (resolve, reject) {
        db.collection(tableName).where(key, '==', keyValue).get().then(function (uSnapshot) {
            let numberOfUpdates = 0;
            uSnapshot.forEach(function (u) {
                numberOfUpdates += updateDocumentSnapshot(u, tableName, key, updateObj);
            });
            return resolve(numberOfUpdates);
        }).catch(function (error) {
            console.error("error updating field in " + tableName + ', error :' + error);
            return resolve(0);
        });
    });
};
exports.getNextID = function (tableName) {
    const c = db.collection(tableName).doc();
    return c.id;
};
//# sourceMappingURL=tableObj.js.map