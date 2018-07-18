import { initApp, getUserFromToken, getUIDFromToken} from "./firebaseInit";
const fireAdmin = initApp();
const nodemailer = require('nodemailer');
const credential = require('../bin/nodemailer_pass.json').web;
const handlebars = require('handlebars');
const path = require('path');
import {getFieldDataInTable, updateFieldInTable} from "./tableObj";
import {getCompanyID, getCompanyInfoFromUID} from "./company";

const fs = require('fs');

const readHTMLFile = function (path:string , callback:any) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
        } else {
            return callback(null, html);
        }
    });
};


const randomString = function (len, charSet) {
    const charSetAssigned = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let r = '';
    for (let i = 0; i < len; i++) {
        const randomPoz = Math.floor(Math.random() * charSetAssigned.length);
        r += charSet.substring(randomPoz, randomPoz + 1);
    }
    return r;
};
const sendEmail_Private = function (u, uid, req, res){
    const smtpTransport = require('nodemailer-smtp-transport');
    const e = u.email;
    const jsonText = JSON.stringify(req.body);
    console.info("json text" + JSON.stringify(req.body));

    const data = JSON.parse(jsonText);
    const maillist = data.email;

    const transporter = nodemailer.createTransport({
        host:
         'smtp.gmail.com',
        port: 465,
        secure: true,
        service: 'gmail',
        auth: {
            type: 'plain',
            user: credential.user,
            pass: credential.pass
        },
        logger: true,
        debug: true
    });


    const mailOptions = {
        from: e,
        to: "",
        subject: 'Invitatoin to sign up the scanfairy account',
        html: {},
        auth: {
            type: 'plain',
            user: credential.user,
            pass: credential.pass
        }
    };
    const rCode = randomString(10, 'abcdefghijklmnopqrstuvwxyz');
    const updateObj = { referalCode: rCode };
    const promise1 = getCompanyID(uid);
    let company_id = null;
    promise1.then(function(v){
        company_id = v;
        console.log("Update companies " + company_id + " with referalCode " + rCode);
        const promise2 = updateFieldInTable('Companies', "id", company_id, updateObj);
        smtpTransport.close();
        return res.send("send successfully!");
    }).catch(function(error){
        console.error("error" + error.toString());
        return res.status(401).send(error.toString());
    });
    const referalLink = 'https://inventory-6c189.firebaseapp.com/signup.html?referal=true&rCode=' + rCode;
    maillist.forEach(function (to, i, array) {
        mailOptions.to = " Sender <" + to + ">";
        readHTMLFile(path.join(__dirname , '/../public/nodemailer-templ.html'), function (err, html) {
            const template = handlebars.compile(html);
            const replacements = {
                username: to,
                fromuser: e,
                hostname: referalLink
            };
            const htmlToSend = template(replacements);
            mailOptions.html = htmlToSend;
            transporter.sendMail(mailOptions).catch(function (error) {
                if (err) {
                    console.error('Sending to ' + to + ' failed: ' + error);
                    res.body = "failed to send email to" + to + error.errorCode;
                    return res.sendStatus(400);
                   
                } else {
                    console.log('Sent to ' + to);
                }

            });

        });
        
    });
    return res.sendStatus(201);
}
export const sendEmail = function(req, res) {
    
    const idToken = req.header("idToken");
    console.log("access token" + idToken);
    const promise1 = getUIDFromToken(idToken);
    const promise2 = getUserFromToken(idToken);
    Promise.all([promise1, promise2]).then(function(values){
        const uid = values[0];
        const u = values[1];
        sendEmail_Private(u, uid, req, res);
        return res.sendStatus(200);
    }).catch(function (error) {
        console.error(error);
        return res.status(401).send(error.toString());
    });
};

const updateCompanyInfo = function(companyID) {
    if (companyID !== null) {
        getFieldDataInTable('Users', 'company_id', 'email', false, companyID["company_id"]).then(function (team_info) {
            console.log("email_list" + JSON.stringify(team_info));
            const ret = "{\"email\":" + JSON.stringify(team_info) + "}";
            return ret;
        }).catch(function (error) { 
            console.error("error while get the team member emails 1" + error.toString());
            return null;
        });
    }else {
        console.error("error getting company ID");
        return null;
    } 
}
export const getTeam = function(req, res) {

    const idToken = req.header("idToken");
    console.log("access token" + idToken);
    const promise1 = getUIDFromToken(idToken);
    const promise2 = promise1.then((uid) => getCompanyID(uid));
    Promise.all([promise1, promise2]).then(function(values){
        const uid = values[0];
        const companyID = values[1];
        const updatedStatus = updateCompanyInfo(companyID);
        if (updatedStatus !==null) {
            return res.status(201).send(updatedStatus);
        }else {
            return res.status(401);
        }
    }).catch(function(error){
        return res.sendStatus(401);
    }) 
        
}