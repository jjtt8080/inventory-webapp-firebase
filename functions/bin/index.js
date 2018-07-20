"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser);
const functions = require('firebase-functions');
const company_1 = require("./company");
const product_1 = require("./product");
const team_1 = require("./team");
const user_1 = require("./user");
exports.getCompany = functions.https.onRequest((req, res) => {
    return company_1.getCompany(req, res);
});
exports.setCompany = functions.https.onRequest((req, res) => {
    return company_1.setCompany(req, res);
});
exports.getProducts = functions.https.onRequest((req, res) => {
    return product_1.getProducts(req, res);
});
exports.uploadProducts = functions.https.onRequest((req, res) => {
    product_1.uploadProducts(req, res);
});
exports.sendEmail = functions.https.onRequest((req, res) => {
    team_1.sendEmail(req, res);
});
exports.getTeam = functions.https.onRequest((req, res) => {
    team_1.getTeam(req, res);
});
exports.getUser = functions.https.onRequest((req, res) => {
    user_1.getUser(req, res);
});
exports.createUser = functions.https.onRequest((req, res) => {
    user_1.createUser(req, res);
});
//# sourceMappingURL=index.js.map