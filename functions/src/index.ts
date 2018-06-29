// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
//import {qualifiedTypeIdentifier} from "babel-types";
//const functions = require('firebase-functions');

const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const fs = require("fs");


app.use(bodyParser);
const functions = require('firebase-functions');
import {getCompany, setCompany} from "./company";
import {uploadProducts, getProducts} from "./product";
import {sendEmail, getTeam} from "./team";
import {getUser, createUser} from "./user";

exports.getCompany = functions.https.onRequest((req, res) => {
    return getCompany(req, res);
});
exports.getProducts = functions.https.onRequest((req, res) => {
   return getProducts(req, res);
});
exports.uploadProducts = functions.https.onRequest((req, res)=>{
   return uploadProducts(req, res);
});
exports.sendEmail = functions.https.onRequest((req, res) => {
   return sendEmail(req, res);
});
exports.getTeam = functions.https.onRequest((req, res) =>  {
    return getTeam(req, res);
});


exports.getUser = functions.https.onRequest((req, res) => {
    return getUser(req, res);
});

exports.createUser = functions.https.onRequest((req, res) => {
    return createUser(req, res);
});


