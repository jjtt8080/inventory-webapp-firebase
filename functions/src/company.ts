import { getFieldDataInTable, updateFieldInTable, getNextID, compareJSON } from "./tableObj";
import { initApp } from "./firebaseInit";
import { getUser } from "./user";
import { getUIDFromToken, getUserFromToken} from "./firebaseInit";
import { resolve } from "path";
const fireAdmin = initApp();
const updateCompanyInfoInUser = function (u, companyID) {
    const updateData: object = {};
    updateData['company_id'] = companyID;
    return updateFieldInTable('Users', 'email', u.email, updateData);
};

export const getCompanyID = function (id) {

    return new Promise(function getID(resolve, reject) {
        fireAdmin.auth().getUser(id).then(function getE(u) {
            console.info("done getUser email " + u.email);
            return resolve(getFieldDataInTable('Users', 'email', 'company_id', false, u.email));
        }).catch(function errorF(error) {
            return resolve(null);
        });
    });
};

export const getCompanyInfoFromUID = function (u, companyID) {
    return new Promise(function getInfo(resolve, reject) {
        const promise = getFieldDataInTable('Companies', 'id', '*', false, companyID['company_id']);
        promise.then(function retData(data) {
            const companyInfo = JSON.stringify(data);
            console.info("get company info" + companyInfo);
            return resolve(data);
        }).catch(function getErr2(error2) {
            return reject(error2);
        });
    });
};
const getCompanyFromReferalCode = function (req, res) {

    const idToken = req.header("idToken");
    const rCode = req.header("rCode");
    if (rCode !== "" && rCode !== undefined) {
        const promise1 = getUserFromToken(idToken);
        const promise2 = getFieldDataInTable('Companies', 'referalCode', 'id', false, rCode);
        let u : any  = null;
        let companyID : any = null;
        promise1.then((uid) => {
            u = uid;  
            return promise2;
        }).then((compID) => {
            companyID = compID;
            console.log("getting company info in user: " + u.email + "companyID" + companyID);
            return getCompanyInfoFromUID(u, companyID);
        }).catch(function getErr4(error) {
            console.error("error in getting field data" + error.toString());
            return null;
        });

    } else {
        return null;
    }
}
export const getCompany = function (req, res) {
    if (req.method === 'GET') {
        //console.log("req.header " + req.header);
        const idToken = req.header("idToken");
        console.info("idToken: " + idToken);
        const rCode = req.header("rCode");
        if (rCode !== undefined && rCode !== "") {
            console.info("from rCode: " + rCode);
            const promiseCompany = getCompanyFromReferalCode(req, res);
            promiseCompany.then(companyData=>{
                const companyInfoStr: string = JSON.stringify(companyData);
                return res.status(200).send(companyInfoStr);
            }).catch(error=>{
                return res.status(401).send(error.toString());
            });
        }
        else {
            console.info(" rCode empty ");
            let uid : any = null;
            let companyID : any = null;
            getUIDFromToken(idToken).then((u)=>{
                uid = u;
                return getCompanyID(uid);
            }).then((compID)=>{
                companyID = compID;
                console.info("uid is" + JSON.stringify(uid) + "companyID is" + JSON.stringify(companyID));
                return getCompanyInfoFromUID(uid, companyID); 
            }).then((compInfo)=>{
                return res.send(compInfo);
            }).catch(function getErr(error) {
                console.error("error in getting field data" + error.toString());
                return res.status(401).send(error.toString());
            });
        }
    }
    else {
        return res.sendStatus(400);
    }
};
function getNextCompanyID(): string {
    console.info("in getNextCompany");
    return getNextID('Companies');
}

const createnewCompanyInfo = function (data, u, res) {
    console.info("can not find such company, start from scratch");
    const companyID: string = getNextCompanyID()
    console.info("next company id is " + companyID + 'admin email set to:' + u.email);
    data['id'] = companyID;
    data['admin_email'] = u.email;

    const promise2 = updateFieldInTable('Companies', 'id', companyID, data);
    const promise3 = updateCompanyInfoInUser(u, companyID);
    Promise.all([promise2, promise3]).then(function(values){
        console.log("updated company Info succesfully");
        return res.sendStatus(201);
    }).catch(function (error1) {
        return res.sendStatus(400);
    });
}
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


const updateCompanyInfo = function (u, req, res, company_id) {
    let bAlreadySetup = false;
    console.info("update Compoany Info" + company_id);
    const reqData = formDataFromReq(req);
    let doc = null;
    const cPromise = getCompanyInfoFromUID(u, company_id);  
    cPromise.then(function(companyInfo) {
        console.info("companyINFO" + companyInfo);
        doc = companyInfo;  
        const fieldToCompoare = ['name', 'address', 'zip', 'country', 'city', 'state'];
        const bSameInfo = compareJSON(doc, reqData, fieldToCompoare);
        if (doc['admin_email'] !== u.email) {
            console.error("email is not admin_email" + u.email);
            return 403;
        } else {
            if (bSameInfo) //nothing need to be done if information did not change
                return 200;
            reqData['id'] = company_id;
            reqData['admin_email'] = u.email;
            bAlreadySetup = true;
            console.info("The same company already setup, changing..." + reqData.name);
            console.info("setup companies with data" + JSON.stringify(reqData));
            return 201;
        }
    }).catch(function getError2(error2){
       return 401;
    });
   
    
};
export const setCompany = function (req, res) {
    if (req.method !== 'POST') {
        return res.sendStatus(201);
    }
    const idToken = req.header("idToken");
    const data = formDataFromReq(req);
    const uidPromise = getUserFromToken(idToken);
    const companyIDPromise = uidPromise.then((userID)=>getCompanyID(userID));
    Promise.all([uidPromise, companyIDPromise]).then(function(values){
        const uid = values[0];
        const company_id = values[1];
        if (company_id !== null) {
            const status = updateCompanyInfo(uid, req, res, company_id);
            return res.sendStatus(status);
        }else {
            return createnewCompanyInfo(data, uid, res);
        }
    }).catch(function getErrorSetCompany(error){
       return res.status(401).send(error.toString());
    });
}

