
const path = require('path');
const testSetup = require('firebase-functions-test')({
    databaseURL: "https://inventory-6c189.firebaseio.com",
    storageBucket: 'inventory-6c189.appspot.com',
    projectId: 'inventory-6c189'
},   './inventory-5949b6de0981.json');  

import {mySQL_getFieldDataInTable, mySQL_updateFieldInTable, mySQL_createProducts} from '../src/mysqlDb';

const myFunctions = require('../src/index');
const req = { query: { text: 'input' } };
const res = {
    redirect: (code, url) => {
        testSetup.assert.equal(code, 303);
        testSetup.assert.equal(url, 'new_ref');
        testSetup.done();
    }
};

const testSelect = function() {
    mySQL_createProducts();
}
