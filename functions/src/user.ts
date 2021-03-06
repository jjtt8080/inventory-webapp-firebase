import { initApp } from "./firebaseInit";
const fireAdmin = initApp();
import { getFieldDataInTable, updateFieldInTable, getNextID } from "./tableObj";
import { getUIDFromToken, getUserFromToken } from "./firebaseInit";

export const getUser = function (req, res) {
    if (req.method !== 'GET') {
        return res.sendStatus(400);
    }
    const idToken = req.header("idToken");
    console.info("idToken:" + idToken);
    let u = null;
    let e = null;
    let jsonText = "";
    getUserFromToken(idToken).then(function getUser(user){
        u = user;
        const e = u.email;
        console.info("email from uid: " + e);
        return getFieldDataInTable('Users', 'email', '*', false, e);
    }).then((doc)=>{
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
    }).catch(function(error){
        res.sendStatus(401);
    })

};
export const createUser = function (req, res) {
    if (req.method !== 'POST') res.sendStatus(400);
    const idToken = req.header("idToken");
    console.log("idToken" + idToken);
    const jsonText = JSON.stringify(req.body);
    console.info("json text" + JSON.stringify(req.body));
    const data = JSON.parse(jsonText);
    let u = null; 
    getUserFromToken(idToken).then(function getUser(user){
        u = user;
        const e = u.email;
        console.log("getUser finished authen" + e);
        return updateFieldInTable('Users', 'email', e, data);
    }).then((updatedCount)=>{
        if (updatedCount > 0) {
            return res.sendStatus(201);
        }
        else {
            const newUID = getNextID('Users');
            console.log("data:" + JSON.stringify(data));
            data["email"] = u.email;
            return updateFieldInTable('Users', 'id', newUID, data);
        }
    }).then((updatedCount) =>{
        return res.sendStatus(201);
    }).catch(function(errr){
        return res.sendStatus(401);
    });

}