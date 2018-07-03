import { getFieldDataInTable, updateFieldInTable, getNextID, compareJSON} from "./tableObj";
import { initApp } from "./firebaseInit";
const fireAdmin = initApp();
const updateCompanyInfoInUser = function (u, companyID, res) {
    const updateData = {};
    updateData['company_id'] = companyID;
    return updateFieldInTable('Users', 'email', u.email, updateData);
};

export const getCompanyID = function (id) {
   
    return new Promise(function (resolve, reject) {
        fireAdmin.auth().getUser(id).then(function (u) {
            console.info("done getUser email " + u.email);
            resolve(getFieldDataInTable('Users', 'email', 'company_id', false, u.email));
        }).catch(function (error) {
            reject("");
        });
    });
};

const getCompanyFromReferalCode = function (req, res) {

    const idToken = req.header("idToken");
    fireAdmin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            const uid = decodedToken.uid;
            const rCode = req.header("rCode");
            if (rCode !== "" && rCode !== undefined) {
                fireAdmin.auth().getUser(uid).then(u => {
                    getFieldDataInTable('Companies', 'referalCode', 'id', false, rCode).then(function (companyID) {
                        if (companyID['id'] !== undefined && companyID['id'] !== "") {
                            console.log("Setting company info in user: " + u.email + "companyID" + companyID);
                            updateCompanyInfoInUser(u, companyID['id'], res).then(function (error) {
                                getFieldDataInTable('Companies', 'id', '*', false, companyID['id']).then(function (data) {
                                    const companyInfo = JSON.stringify(data);
                                    console.info("got company info from rcode" + companyInfo);
                                    return res.send(companyInfo);
                                }).catch(function (error2) {
                                    console.error("error getting company info after finding the company id");
                                    return res.status(400).send(error2.toString());
                                });
                            }).catch(function (error) {
                                console.error("error updating the company info in user");
                                return res.status(401).send(error.toString());
                            });
                        } else {
                            return res.status(401).send("company id not defined");
                        }
                    }).catch(function (error) {
                        console.error("error in getting field data" + error.toString());
                        res.status(401).send(error.toString());
                    });

                }).catch(function (error) {
                    console.error("error in authentication user" + error.toString());
                    res.status(401).send(error.toString());
                });
            } else {
                res.status(401).send();
            }
        }).catch(error => {
            res.status(401).send(error.toString());
        });
};

export const getCompany = function (req, res) {
    if (req.method === 'GET') {
        //console.log("req.header " + req.header);
        const idToken = req.header("idToken");
        console.info("idToken: " + idToken);
        const rCode = req.header("rCode");
        if (rCode !== undefined && rCode !== "") {
            console.info("from rCode: " + rCode);
            getCompanyFromReferalCode(req, res);
        }
        else {
            console.info(" rCode empty ");
            fireAdmin.auth().verifyIdToken(idToken).then(function (decodedToken) {
                console.info("done /" + decodedToken);
                const id = decodedToken.uid;
                console.info("done docodedToken.uid" + id);
                getCompanyID(id).then(function (compID) {
                    const company_id = compID["company_id"];
                    console.info("done getCompany_ID" + JSON.stringify(compID));
                    if (company_id === -1 || !company_id) {
                        res.status(400).send("company id not defined or -1");
                    }
                    else {
                        getFieldDataInTable('Companies', 'id', '*', false, company_id).then(function (data) {
                            const companyInfo = JSON.stringify(data);
                            console.info("got company info from rcode" + companyInfo);
                            return res.send(companyInfo);
                        }).catch(function (error) {
                            return res.status(400).send(error.toString());
                        });
                    }
                }).catch(function (error) {
                    console.error("error get companyID" + idToken);
                    return res.status(401).send(error.toString());
                });
            }).catch(function (error) {
                console.error("failed to authenticate");
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
};

const createnewCompanyInfo = function (data, u, res) {
    console.info("can not find such company, start from scratch");
    const companyID: string = getNextCompanyID()
    console.info("next company id is " + companyID + 'admin email set to:' + u.email);
    data['id'] = companyID;
    data['admin_email'] = u.email;
    updateFieldInTable('Companies', 'id', companyID, data).then(function (updatedRecords) {
            updateCompanyInfoInUser(u, companyID, res).then(function (error) {
                console.log("add company in user successfully!");
                return res.sendStatis(200);
            }).catch(function (error) {
                console.error("error updating company info in user");
                return res.sendStatus(401);
            })

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
    getFieldDataInTable('Companies', 'id', '*', false, company_id).then(function(doc){
        const fieldToCompoare = ['name', 'address', 'zip', 'country', 'city', 'state'];
        const reqData = formDataFromReq(req);
        const bSameInfo = compareJSON(doc, reqData, fieldToCompoare);
        if (doc['admin_email'] !== u.email) {
            console.error("email is not admin_email" + u.email);
            return req.sendStatus(403);
        }else {
            if (bSameInfo) //nothing need to be done if information did not change
                req.sendStatus(200);
            reqData['id'] = company_id;
            reqData['admin_email'] = u.email;
            bAlreadySetup = true;
            console.info("The same company already setup, changing..." + reqData.name);
            console.info("setup companies with data" + JSON.stringify(reqData));
            updateFieldInTable('Companies', 'id', company_id, reqData).then( p=> {
                return res.sendStatus(201);
            }).catch(function (error) {
                console.error("can't insert data");
                return res.sendStatus(400);
            });

        }
    }).catch(function(error){
        res.sendStatus(401);
    });
};
export const setCompany = function (req, res) {
    if (req.method !== 'POST') {
        return res.sendStatus(201);
    }
    const idToken = req.header("idToken");
    fireAdmin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            const uid = decodedToken.uid;
            const data = formDataFromReq(req);
            fireAdmin.auth().getUser(uid).then(u => {
                console.log("getUser successfully in setCompany" + JSON.stringify(req.body));
                getCompanyID(uid).then(function (company_id) {
                    if (!company_id) {
                        createnewCompanyInfo(data, u, res);
                    } else {
                        updateCompanyInfo(u, req, res, company_id);
                    }
                }).catch(function (error) {
                    //No such company ID
                    createnewCompanyInfo(data, u, res);
                });
            }).catch(function (error) {
                return res.sendStatus(201);
            });
        }).catch(function (errorU) {
            return res.sendStatus(201);
        });
}

