var showElements = function(elements) {
    elements.forEach(e=>{
        var elem = document.getElementById(e);
        elem.removeAttribute('hidden');
    });

};
var hideElements = function(elements){
    elements.forEach(e=>{
        var elem = document.getElementById(e);
        elem.setAttribute('hidden', 'true');
    });
};

function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
};
var buildDataTable = function(parent_element, data, headers) {

    let tBody = document.getElementById(parent_element);
    headers.forEach(h => {
        let td = document.createElement("td");
        let t = document.createTextNode(data[h]);
        td.appendChild(t);
        tBody.appendChild(td);
    });
};

var getCookie = function(cookieName){
    return Cookies.get(cookieName);
};
var setCookie = function(cookieName, v){
    Cookies.set(cookieName, v, {expires:7, path: ''})
}


var updateStatusInfo = function(e, info) {
    var element =  document.getElementById(e);
    element.innerHTML = info;
}