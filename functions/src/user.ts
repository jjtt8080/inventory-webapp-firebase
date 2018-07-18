import { initApp } from "./firebaseInit";
const fireAdmin = initApp();
import { getFieldDataInTable, updateFieldInTable, getNextID } from "./tableObj";
import { getUIDFromToken, getUserFromToken } from "./firebaseInit";

export const getUser = function (req, res) {
    if (req.method !== 'GET') {
        return res.sendStatus(400);
    }
    const idToken = req.header("idToken");
    const u = getUserFromToken(idToken);
    if (u === null) {
        return res.sendStatus(401);
    }
    const e = u.email;
    console.info("email from uid: " + e);

    let jsonText = "";
    getFieldDataInTable('Users', 'email', '*', false, e).then(function (doc) {
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
        } else {
            return res.sendStatus(401);
        }

    }).catch(function (error) {
        console.error("error verify token" + error.toString());
        return res.sendStatus(401);
    });
};
export const createUser = function (req, res) {
    if (req.method !== 'POST') res.sendStatus(400);
    const idToken = req.header("idToken");
    console.log("idToken" + idToken);
    const jsonText = JSON.stringify(req.body);
    console.info("json text" + JSON.stringify(req.body));
    const data = JSON.parse(jsonText);
    const u = getUserFromToken(idToken);
    if (u !== null) {
        const e = u.email;
        console.log("getUser finished authen" + e);
        updateFieldInTable('Users', 'email', e, data).then(function (updatedCount) {
            return res.sendStatus(201);
        }).catch(function (errorS) {
            console.log(errorS);
            return res.sendStatus(401);
        });
    } else {
        const newUID = getNextID('Users');
        console.log("data:" + JSON.stringify(data));
        data["email"] = u.email;
        updateFieldInTable('Users', 'id', newUID, data).then(function (updatedCount1) {
            return res.sendStatus(201);
        }).catch(function (errorS) {
            console.log(errorS);
            return res.sendStatus(401);
        });
    }

}