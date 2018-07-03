const express = require("express");
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser);
const functions = require('firebase-functions');
import { getCompany, setCompany } from "./company";
import { uploadProducts, getProducts } from "./product";
import { sendEmail, getTeam } from "./team";
import { getUser, createUser } from "./user";


exports.getCompany = functions.https.onRequest((req, res) => {
    return getCompany(req, res);
});

exports.setCompany = functions.https.onRequest((req, res) => {
    return setCompany(req, res);
});

exports.getProducts = functions.https.onRequest((req, res) => {
    return getProducts(req, res);   
});

exports.uploadProducts = functions.https.onRequest((req, res) => {
    uploadProducts(req, res);
});

exports.sendEmail = functions.https.onRequest((req, res) => {
    sendEmail(req, res);
});

exports.getTeam = functions.https.onRequest((req, res) => {
    getTeam(req, res);
});

exports.getUser = functions.https.onRequest((req, res) => {
    getUser(req, res);
});
exports.createUser = functions.https.onRequest((req, res) => {
    createUser(req, res);
});