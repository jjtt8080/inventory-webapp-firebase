

var getProducts = function() {
    var user = firebase.auth().currentUser;
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            try {
                var product_info = JSON.parse(req.responseText);
                let tBody = document.getElementById("products_form");
                let td = document.createElement("td");
                let t = document.createTextNode(product_info.product_desc);
                td.appendChild(t);
                tBody.appendChild(td);
                td = document.createElement("td");
                t = document.createTextNode(product_info.quantity);
                td.appendChild(t);
                tBody.appendChild(td);
                td = document.createElement("td");
                t = document.createTextNode(product_info.vendor);
                td.appendChild(t);
                tBody.appendChild(td);
            } catch(error) {
                console.error("Error parsing reponse text" + error.message);
                updateStatusInfo('company_info_status', error.message);
            }
        }
        else if (req.readyState == 4 && req.status == 401) { //
            return updateStatusInfo( 'product_info_status', "permission denied");
        } else if (req.readyState == 4 && req.status == 400) {
            return updateStatusInfo('product_info_status', "Setting up new company info..");
        }
    };
    req.open("GET", "getProducts");
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var user=firebase.auth().currentUser;
    var token = user.getIdToken(true).then(function(accessToken) {
        req.setRequestHeader("idToken", accessToken);
        //var stringToken = JSON.stringify(token);
        req.send();
    });
};
window.onload = function(){
};