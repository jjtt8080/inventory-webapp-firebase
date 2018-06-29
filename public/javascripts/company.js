

var updatePrompt = function(text) {
    var comp = document.getElementById('company_info_prompt');
    comp.innerText = text;
};
var createCompanyDoc = function(user) {
    var companyName =  $('#company_name').val();
    var companyAddr = $('#company_addr').val();
    var companyCity = $('#company_city').val();
    var companyZip = $('#company_zip').val();
    var companyState = $('#company_state').val();
    var companyCountry = $('#company_country').val();
    var req = new XMLHttpRequest();
    var jsonText = JSON.stringify({company_name: companyName,
        company_address: companyAddr,
        zip : companyZip,
        country : companyCountry,
        city: companyCity,
        state: companyState});

    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            updatestatusInfo('company_info_status', req.responseText);


        }
        else if (req.readyState == 4 && req.status == 201) { //

            updateStatusInfo('company_info_status', "Updated Successfully!");

        } else if (req.readyState == 4 && req.status == 200) {
            //We are ready to update the info. should be default
            updateStatusInfo('company_info_status', "Added Successfully!");

        } else if (req.readyState == 4 && req.status == 400) {
            updateStatusInfo('company_info_status', "Permission denied!");
        } else if (req.readyState == 4 && req.status == 404) {
            updateStatusInfo('company_info_status', "Can't find page to set company!");
        }
    };
    req.open("POST", "setCompany");
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var token = user.getIdToken(true).then(function(accessToken) {
        req.setRequestHeader("idToken", accessToken);
        //var stringToken = JSON.stringify(token);
        req.send(jsonText);
    });
};

var handleCompanyInfo = function(user) {
    // var user = document.getElementById('username').className;

    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            document.getElementById("loading_company").setAttribute('hidden', 'true');
            try {
                var company_info = JSON.parse(req.responseText);

                $('#company_name')[0].parentElement.MaterialTextfield.change(company_info.name);
                $('#company_addr')[0].parentElement.MaterialTextfield.change(company_info.address);
                $('#company_city')[0].parentElement.MaterialTextfield.change(company_info.city);
                $('#company_zip')[0].parentElement.MaterialTextfield.change(company_info.zip);
                $('#company_state')[0].parentElement.MaterialTextfield.change(company_info.state);
                $('#company_country')[0].parentElement.MaterialTextfield.change(company_info.country);
                var info_text =  "If you want to change your company info, click the add after change."
                return updatePrompt(info_text);

            } catch(error) {
                console.error("Error parsing reponse text" + error.message);
                updateStatusInfo('company_info_status', error.message);
            }

        }
        else if (req.readyState == 4 && req.status == 401) { //
            document.getElementById("loading_company").setAttribute('hidden', 'true');
            return updateStatusInfo( 'company_info_status', "permission denied");
        } else if (req.readyState == 4 && req.status == 400) {
            document.getElementById("loading_company").setAttribute('hidden', 'true');
            return updateStatusInfo('company_info_status', "Setting up new company info..");
        }
    };
    document.getElementById("loading_company").removeAttribute('hidden');
    req.open("GET", "getCompany");
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var token = user.getIdToken(true).then(function(accessToken) {
        req.setRequestHeader("idToken", accessToken);
        var rCode = getCookie('rCode');
        if (rCode != "") {
            req.setRequestHeader('rCode', rCode);
        }
        //var stringToken = JSON.stringify(token);
        req.send();
    });

};
var getCompany = function() {
    document.getElementById('setup_company_button').addEventListener(
        'click', function() {
            createCompanyDoc(user)
        });
    var user = firebase.auth().currentUser;
    var responseText = handleCompanyInfo(user);
}