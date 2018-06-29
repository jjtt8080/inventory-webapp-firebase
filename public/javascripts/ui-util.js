var showElements = function(elements) {
    for (var i =0; i < elements.length; ++i){
        var elem = document.getElementById(elements[i]);
        elem.removeAttribute('hidden');
    }

};
var hideElements = function(elements){
    for (var i =0; i < elements.length; ++i){
        var elem = document.getElementById(elements[i]);
        elem.setAttribute('hidden', 'true');
    }
};

function parseQueryString(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
};
var buildDataTable = function(parent_element, data, headers) {
    const tBody = document.getElementById(parent_element);
    for (var r = 0; r < data.length; r++) {
        var row = data[r];
        var tr = document.createElement("tr");
        for (var i = 0; i < headers.length; i++) {
            h = headers[i];
            var td = document.createElement("td");
            var t = document.createTextNode(row[h]);
            td.appendChild(t);
            tr.appendChild(td);
        }
        tBody.appendChild(tr);
    }
}

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