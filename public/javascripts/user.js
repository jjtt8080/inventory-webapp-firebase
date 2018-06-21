

var updateUserPrompt = function(text) {
    var comp = document.getElementById('user_info_prompt');
    comp.innerText = text;
};
var createuserDoc = function(user) {
    var firstName =  $('#first_name').val();
    var lastName = $('#last_name').val();
    var employee_id = $('#emp_id').val();
    var e = user.email;
    var req = new XMLHttpRequest();
    var jsonText = JSON.stringify({first_name: firstName,
        last_name: lastName,
        emp_id : employee_id,
        email : e});

    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            updatestatusInfo('user_info_status', req.responseText);


        }
        else if (req.readyState == 4 && req.status == 201) { //

            updateStatusInfo('user_info_status', "Updated Successfully!");

        } else if (req.readyState == 4 && req.status == 200) {
            //We are ready to update the info. should be default
            updateStatusInfo('user_info_status', "Added Successfully!");

        } else if (req.readyState == 4 && req.status == 400) {
            updateStatusInfo('user_info_status', "Permission denifed!");
        } else if (req.readyState == 4 && req.status == 404) {
            updateStatusInfo('user_info_status', "Can't find page to set user!");
        }
    };
    req.open("POST", "createUser");
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var token = user.getIdToken(true).then(function(accessToken) {
        req.setRequestHeader("idToken", accessToken);
        //var stringToken = JSON.stringify(token);
        req.send(jsonText);
    }).catch(error=> {
        console.error("error at calling createUser" + jsonText);
    });
};

var handleuserInfo = function(user) {
    // var user = document.getElementById('username').className;

    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {

            try {
                var user_info = JSON.parse(req.responseText);

                $('#first_name')[0].parentElement.MaterialTextfield.change(user_info.first_name);
                $('#last_name')[0].parentElement.MaterialTextfield.change(user_info.last_name);
                $('#emp_id')[0].parentElement.MaterialTextfield.change(user_info.emp_id);
                var info_text =  "If you want to change your user info, click the button after change."
                return updateUserPrompt(info_text);

            } catch(error) {
                console.error("Error parsing reponse text" + error.message);
                updateStatusInfo('user_info_status', error.message);
            }

        }
        else if (req.readyState == 4 && req.status == 401) { //
            return updateStatusInfo( 'user_info_status', "permission denied");
        } else if (req.readyState == 4 && req.status == 400) {
            return updateStatusInfo('user_info_status', "Setting up new user info..");
        }
    };
    req.open("GET", "getUser");
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var token = user.getIdToken(true).then(function(accessToken) {
        req.setRequestHeader("idToken", accessToken);
        //var stringToken = JSON.stringify(token);
        req.send();
    });

};
var getUser = function() {
    document.getElementById('setup_user_button').addEventListener(
        'click', function() {
            createuserDoc(user)
        });
    var user = firebase.auth().currentUser;
    var responseText = handleuserInfo(user);
}