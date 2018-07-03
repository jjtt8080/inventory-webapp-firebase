import { initApp} from "./firebaseInit";
const fireAdmin = initApp();
const db = fireAdmin.firestore();
export const getFieldDataInTable= function(tableName: string, key: string, fieldIDToReturn: string, isPrimaryKey: boolean, keyValueConstraint: any) {
   
    return new Promise(function (resolve, reject) {
        if (isPrimaryKey === true) {
                db.collection(tableName).doc(key).get().then(uSnapshot => {
                    const doc = uSnapshot.data();
                    if (fieldIDToReturn === ('*')) {
                        resolve(doc);
                    } else {
                        const fieldValue = doc[fieldIDToReturn];
                        const returnValue = {};
                        returnValue[fieldIDToReturn] = fieldValue;
                        resolve(returnValue);
                    }
                }).catch(function (error) {
                    reject("");
                });

        } else {
            db.collection(tableName).where(key, '==', keyValueConstraint).get().then(function (uSnapshot) {
                console.log("getting field record using constraint: " + keyValueConstraint);
                if (uSnapshot.size === 1) {
                    let accuValue = {};
                    console.log("found 1 record where key" + key + ' == ' + keyValueConstraint);
                    uSnapshot.forEach(e => {
                        if (fieldIDToReturn === '*') {
                            accuValue = e.data();
                        }else {
                            const fieldValue = e.data()[fieldIDToReturn];
                            accuValue[fieldIDToReturn] = fieldValue;
                        }
                    });
                    resolve(accuValue);
                } else {
                    const accuValue = [];

                    if (fieldIDToReturn === '*') {
                        uSnapshot.forEach(e => {
                            accuValue.push(e.data());
                        })
                        console.info("resolved 1: "+ JSON.stringify(accuValue));
                        resolve(accuValue);
                    }
                    else {
                        console.info("found " +uSnapshot.size + " 2 records");
                        uSnapshot.forEach(e => {
                            const elem = e.data()[fieldIDToReturn];
                            accuValue.push(elem);
                        });
                        console.info("resolved 2 :"+ JSON.stringify(accuValue));
                        resolve(accuValue);
                    }
                }
            }).catch(function (error) {
                reject("");
            });
        }
    });
};

export const compareJSON = function(target, rhs, fieldsToCompare) {
    for (const key in fieldsToCompare) {
       if (target[key] !== rhs[key]){
        return false; 
       }
    }
    return true;
}
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
            } else {
                target[key] = add[key];
            }
        }
    }   
    return target;
};
export const updateFieldInTable = function (tableName:string, key: string, keyValue: any, updateObj: any) {
   
    console.info('update Field ' + JSON.stringify(updateObj));
    return new Promise(function (resolve, reject) { 
        db.collection(tableName).where(key, '==', keyValue).get().then(function (uSnapshot) {
            let numberOfUpdates = 0;
            uSnapshot.forEach(function (u) {
                u.ref.get().then( function(docSnapshot){
                    const origData = docSnapshot.data();
                    const mergedData = mergeJSON(origData, updateObj);
                    u.ref.update(mergedData).then(updateS => {
                        console.info("update " + tableName + ', primary key: ' + key + ',fieldID:' + JSON.stringify(updateObj));
                        numberOfUpdates++;
                    }).catch(function (error) {
                        console.error("error updating field in " + tableName + "for " + key + " : " + keyValue);
                
                    });

                }).catch(function(error){
                    reject(0);
                });
            });    
            resolve(numberOfUpdates);
        }).catch(function (error) {
            console.error("error updating field in " + tableName + ', error :' + error);
            reject(0);
        });
    });
}


export const getNextID = function(tableName:string) {
    const c = db.collection(tableName).doc();
    return c.id;
}