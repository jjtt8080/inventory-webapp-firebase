import { initApp} from "./firebaseInit";
const fireAdmin = initApp();
const nodemailer = require('nodemailer');
const credential = require('../lib/nodemailer_pass.json').web;
const handlebars = require('handlebars');
import {getFieldDataInTable, updateFieldInTable} from "./tableObj";
import {getCompanyID} from "./company";

const fs = require('fs');

const readHTMLFile = function (path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
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
    getCompanyID(uid).then(function (company_id) {
        console.log("Update companies " + company_id + " with referalCode " + rCode);
        const updateObj = { referalCode: rCode };
        updateFieldInTable('Companies', "id", company_id, updateObj).then(function (updatedCount) {

            const referalLink = 'https://inventory-6c189.firebaseapp.com/signup.html?referal=true&rCode=' + rCode;
            maillist.forEach(function (to, i, array) {
                mailOptions.to = " Sender <" + to + ">";
                readHTMLFile(__dirname + '/../public/nodemailer-templ.html', function (err, html) {
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
                            res.sendStatus(400);
                            return;
                        } else {
                            console.log('Sent to ' + to);
                        }

                        if (i === maillist.length - 1) {
                            res.send("send successfully!");
                            smtpTransport.close();
                        }
                    });

                });
            });
        }).catch(function(error){
            console.error("error" + error.toString());
            res.status(401).send(error.toString());
        });;
    }).catch(function(error){
        console.error("error" + error.toString());
            res.status(401).send(error.toString());
    });
}
export const sendEmail = function(req, res) {
    
    const idToken = req.header("idToken");
    console.log("access token" + idToken);
    fireAdmin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            const uid = decodedToken.uid;
            console.info("getUser:" + uid);
            fireAdmin.auth().getUser(uid).then(u => {
                    sendEmail_Private(u, uid, req, res);
                    return res.sendStatus(200);
            }).catch(function (error) {
                    console.error("error getting company ID" + error.toString());
                    return res.status(401).send(error.toString());
            })
        }).catch(function (error) {
        console.error(error);
        return res.status(401).send(error.toString());
    });
};

export const getTeam = function( req, res) {

    const idToken = req.header("idToken");
    console.log("access token" + idToken);
    fireAdmin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            const uid = decodedToken.uid;
            console.info("getUser:" + uid);
            fireAdmin.auth().getUser(uid).then(function (u) {
                getCompanyID(uid).then(function (companyID) {
                    console.info("get team using " + companyID["company_id"]);
                    getFieldDataInTable('Users', 'company_id', 'email', false, companyID["company_id"]).then(function (team_info) {
                        console.log("email_list" + JSON.stringify(team_info));
                        const ret = "{\"email\":" + JSON.stringify(team_info) + "}";
                        return res.send(ret);
                    }).catch(function (error) { 
                        console.error("error while get the team member emails 1" + error.toString());
                        return res.sendStatus(401);
                    });
                }).catch(function (error) {
                    console.error("can't get companyID for user" + error.toString());
                    return res.sendStatus(401);
                });

            }).catch(function (error1) {
                return res.sendStatus(401);
            });
        }).catch(function (error2) {
        return res.sendStatus(401);
    });
}