var sendInviteEmail = function(user) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
           console.log("sent successfully");
            return updateStatusInfo( 'email_send_status', "email sent successfully");
        }
        else if (req.readyState == 4 && req.status == 401) { //
            return updateStatusInfo( 'email_send_status', "permission denied");
        } else if (req.readyState == 4 && req.status == 400) {
            return updateStatusInfo('email_send_status', "Setting up new user info..");
        }
    };
    req.open("GET", "sendEmail");
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var token = user.getIdToken(true).then(function(accessToken) {
        req.setRequestHeader("idToken", accessToken);
        var emailList = document.getElementById('invite_list').innerText;
        emailList = "[" + emailList + "]";
        req.send(emailList);
    });

};
var getTeamMembers = function(user) {
    // var user = document.getElementById('username').className;

    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {

            try {
                var team_info = JSON.parse(req.responseText);
                buildDataTable('team_list', team_info, 'email')
                updateStatusInfo('team_info_status', 'done');

            } catch(error) {
                console.error("Error parsing reponse text" + error.message);
                updateStatusInfo('team_info_status', error.message);
            }

        }
        else if (req.readyState == 4 && req.status == 401) { //
            return updateStatusInfo( 'team_info_status', "permission denied");
        } else if (req.readyState == 4 && req.status == 400) {
            return updateStatusInfo('team_info_status', "Setting up new user info..");
        }
    };
    req.open("GET", "getTeam");
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var token = user.getIdToken(true).then(function(accessToken) {
        req.setRequestHeader("idToken", accessToken);
        //var stringToken = JSON.stringify(token);
        req.send();
    });

};

var getTeam = function() {
    var user = firebase.auth().currentUser;
    return getTeamMembers(user);
};