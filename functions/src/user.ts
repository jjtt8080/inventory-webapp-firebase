import { initApp} from "./firebaseInit";
const fireAdmin = initApp();
import {getFieldDataInTable, updateFieldInTable, getNextID} from "./tableObj";

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
              
                let jsonText = "";
                getFieldDataInTable('Users', 'email', '*', false, e).then(function(doc){
                    if (doc !== {}) {
                        const userData = {
                            emp_id: doc["emp_id"],
                            email: e,
                            first_name: doc["first_name"],
                            last_name: doc["last_name"]
                        };
                        jsonText = JSON.stringify(userData);
                        console.info("jsonText" + jsonText);
                        return res.send(jsonText);
                    }else {
                        res.sendStatus
                    }
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
            const jsonText = JSON.stringify(req.body);
            console.info("json text" + JSON.stringify(req.body));
            const data = JSON.parse(jsonText);
            fireAdmin.auth().getUser(uid).then(function (u) {
                const e = u.email;
                console.log("getUser finished authen" + e);
                updateFieldInTable('Users', 'email', e, data).then(function(updatedCount){
                    if (updatedCount > 0) {
                        return res.sendStatus(201);
                    } else {
                        const newUID = getNextID('Users');
                        console.log("data:" + JSON.stringify(data));
                        data["email"] = u.email;
                        updateFieldInTable('Users', 'id', newUID, data).then(function(updatedCount1){
                            return res.sendStatus(201);
                        }).catch(function (errorS) {
                            console.log(errorS);
                            return res.sendStatus(401);
                        });
                    }
                }).catch(function (errorS) {
                        console.log(errorS);
                        return res.sendStatus(401);
                });
            }, function (errorS) {
                return res.sendStatus(401);
            });
        }).catch(function (error) {
        console.error(error.toString());
        return res.sendStatus(401);
    });
}