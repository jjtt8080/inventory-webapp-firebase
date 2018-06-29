import {firebaseInit} from "./firebaseInit";
const fireAdmin = firebaseInit.initApp('inventory');

export const getFieldDataInTable = function(tableName: string, key: string, fieldIDToReturn: string, isPrimaryKey: boolean, keyValueConstraint: any) {
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
};
export const updateFieldInTable = function (tableName:string, key: string, keyValue: any, updateObj: any) {
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
        if (uSnapshot.size == 0)
            return false;
        else
            return true;
    }).catch(function (error) {
        console.error("error updating field in " + tableName + ', error :' + error);
        return false;
    });
};


