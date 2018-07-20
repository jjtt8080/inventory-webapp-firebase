"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firebaseInit_1 = require("./firebaseInit");
const fireAdmin = firebaseInit_1.initApp();
const nodemailer = require('nodemailer');
const credential = require('../bin/nodemailer_pass.json').web;
const handlebars = require('handlebars');
const path = require('path');
const tableObj_1 = require("./tableObj");
const company_1 = require("./company");
const fs = require('fs');
const readHTMLFile = function (path, callback) {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
        if (err) {
            throw err;
        }
        else {
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
const sendEmail_Private = function (u, uid, req, res) {
    const smtpTransport = require('nodemailer-smtp-transport');
    const e = u.email;
    const jsonText = JSON.stringify(req.body);
    console.info("json text" + JSON.stringify(req.body));
    const data = JSON.parse(jsonText);
    const maillist = data.email;
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
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
    const promise1 = company_1.getCompanyID(uid);
    let company_id = null;
    promise1.then(function (v) {
        company_id = v;
        console.log("Update companies " + company_id + " with referalCode " + rCode);
        const promise2 = tableObj_1.updateFieldInTable('Companies', "id", company_id, updateObj);
        smtpTransport.close();
        return res.send("send successfully!");
    }).catch(function (error) {
        console.error("error" + error.toString());
        return res.status(401).send(error.toString());
    });
    const referalLink = 'https://inventory-6c189.firebaseapp.com/signup.html?referal=true&rCode=' + rCode;
    maillist.forEach(function (to, i, array) {
        mailOptions.to = " Sender <" + to + ">";
        readHTMLFile(path.join(__dirname, '/../public/nodemailer-templ.html'), function (err, html) {
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
                }
                else {
                    console.log('Sent to ' + to + error.toString());
                    return res.sendStatus(400);
                }
            });
        });
    });
    return res.sendStatus(201);
};
exports.sendEmail = function (req, res) {
    const idToken = req.header("idToken");
    console.log("access token" + idToken);
    const promise1 = firebaseInit_1.getUIDFromToken(idToken);
    const promise2 = firebaseInit_1.getUserFromToken(idToken);
    Promise.all([promise1, promise2]).then(function (values) {
        const uid = values[0];
        const u = values[1];
        sendEmail_Private(u, uid, req, res);
        return res.sendStatus(200);
    }).catch(function (error) {
        console.error(error);
        return res.status(401).send(error.toString());
    });
};
const getTeamInfo = function (companyID) {
    return new Promise((resolve, reject) => {
        tableObj_1.getFieldDataInTable('Users', 'company_id', 'email', false, companyID["company_id"]).then(function (team_info) {
            console.log("email_list" + JSON.stringify(team_info));
            const ret = "{\"email\":" + JSON.stringify(team_info) + "}";
            return resolve(ret);
        }).catch(function (error) {
            console.error("error while get the team member emails 1" + error.toString());
            return reject(error);
        });
    });
};
exports.getTeam = function (req, res) {
    const idToken = req.header("idToken");
    console.log("access token" + idToken);
    let uid = null;
    let companyID = null;
    firebaseInit_1.getUIDFromToken(idToken).then((u) => {
        uid = u;
        return company_1.getCompanyID(uid);
    }).then((compID) => {
        companyID = compID;
        return getTeamInfo(companyID);
    }).then((teamInfo) => {
        return res.send(teamInfo);
    }).catch(function (error) {
        return res.sendStatus(401);
    });
};
//# sourceMappingURL=team.js.map