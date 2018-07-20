"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firebaseInit_1 = require("./firebaseInit");
const fireAdmin = firebaseInit_1.initApp();
const tableObj_1 = require("./tableObj");
const firebaseInit_2 = require("./firebaseInit");
exports.getUser = function (req, res) {
    if (req.method !== 'GET') {
        return res.sendStatus(400);
    }
    const idToken = req.header("idToken");
    console.info("idToken:" + idToken);
    let u = null;
    let e = null;
    let jsonText = "";
    firebaseInit_2.getUserFromToken(idToken).then(function getUser(user) {
        u = user;
        const e = u.email;
        console.info("email from uid: " + e);
        return tableObj_1.getFieldDataInTable('Users', 'email', '*', false, e);
    }).then((doc) => {
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
        }
        else {
            return res.sendStatus(401);
        }
    }).catch(function (error) {
        res.sendStatus(401);
    });
};
exports.createUser = function (req, res) {
    if (req.method !== 'POST')
        res.sendStatus(400);
    const idToken = req.header("idToken");
    console.log("idToken" + idToken);
    const jsonText = JSON.stringify(req.body);
    console.info("json text" + JSON.stringify(req.body));
    const data = JSON.parse(jsonText);
    let u = null;
    firebaseInit_2.getUserFromToken(idToken).then(function getUser(user) {
        u = user;
        const e = u.email;
        console.log("getUser finished authen" + e);
        return tableObj_1.updateFieldInTable('Users', 'email', e, data);
    }).then((updatedCount) => {
        if (updatedCount > 0) {
            return res.sendStatus(201);
        }
        else {
            const newUID = tableObj_1.getNextID('Users');
            console.log("data:" + JSON.stringify(data));
            data["email"] = u.email;
            return tableObj_1.updateFieldInTable('Users', 'id', newUID, data);
        }
    }).then((updatedCount) => {
        return res.sendStatus(201);
    }).catch(function (errr) {
        return res.sendStatus(401);
    });
};
//# sourceMappingURL=user.js.map