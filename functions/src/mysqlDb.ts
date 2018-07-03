const mysql = require('mysql');

const connection = mysql.createConnection({
    socketPath: '/cloudsql/' + 'inventory-6c189:us-west1:inv-db1',
    user     : 'inv',
    password : 'inv',
    database: 'mysql'
  });

  export const mySQL_getFieldDataInTable= function(tableName: string, key: string,
     fieldIDToReturn: string, isPrimaryKey: boolean,
      keyValueConstraint: any) {
        const sql : string = "select " + fieldIDToReturn + " from " + tableName +
         " where " + key + " == " + keyValueConstraint ;
        connection.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            connection.query(sql, function (err1, result) {
              if (err1) throw err1;
              console.log("Result: " + result);
            });
            connection.close();
        });
        
    }

  export const mySQL_updateFieldInTable = function (tableName:string, key: string, keyValue: any, updateField: any, updatedValue,
     keyValueConstraint: any) {
       const sql : string = "update " + tableName + " set " + updateField + " = " + updatedValue + 
        " where " + key + " == " + keyValueConstraint ;
        connection.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            connection.query(sql, function (err1, result) {
              if (err1) throw err1;
              console.log("Result: " + result);
            });
            connection.close();
        });
       
 }

 export const mySQL_createProducts = function() {
    const sql : string = "create table Products \
         (company_id varchar(40), \
          employee_email varchar(25), \
          price double precision, \
          product_desc varchar(50), \
          product_id varchar(40), \
          quantity integer)";
    connection.connect(function(err){
        if (err) throw err;
        console.log("Connected to mysql DB");
        connection.query(sql, function(err1, result){
            if (err1) throw err1;
            console.log("result:" + result);
            connection.close();
        });
    });

 }

