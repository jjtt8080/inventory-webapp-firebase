

function logon () {
    var origHtml = document.getElementById("message");

    this.signOutForm = document.getElementById("google-signout-form");
    this.signinForm = document.getElementById("google-signin-form");

    this.signOutForm.addEventListener('click', this.googleSignout.bind(this));
    this.checkSetup();
    this.initFirebase();

};

// Checks that the Firebase SDK has been correctly setup and configured.
logon.prototype.checkSetup = function() {

    if (!window.firebase || !(firebase.app instanceof Function)) {
        window.alert('Firebase setup failed! ')
    }else if (!firebase.app().options) {
        window.alert('Firebase setup failed 2! ')
    }
};




 logon.prototype.googleSignout = function() {

    firebase.auth().signOut().then(function() {
        console.log('Firebase User signed out.');
    });

    hideElements(['google-signout-form', 'delete-account', 'inner-message-profile'])
    showElements(['google-signin-form', 'inner-message'])

};


var basicLogon = function() {
    // var user = document.getElementById('username').className;
    var userName =  $('#username').val();
    var pass = $('#password').val();
    firebase.auth().signInWithEmailAndPassword(userName, pass)
        .then(function(u){
           console.log("login successfully!");
        }).catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorMessage);
            if (errorCode === 'auth/wrong-password') {
                var profileForm = document.getElementById('inner-message-profile');
                profileForm.innerHTML = "<br>" + "Signed in failed!" + "<br>";
            } else {
                var profileForm = document.getElementById('inner-message-profile');
                profileForm.innerHTML = error.message;
            }
        });

};



/**
 * Displays the UI for a signed in user.
 * @param {!firebase.User} user
 */
var handleSignedInUser = function(user) {

    showElements(['google-signout-form', 'delete-account-form', 'about-form']);
    hideElements(['google-signin-form', 'inner-message']);

    var profileForm = document.getElementById('inner-message-profile');
    console.log("user protoURL " + user.photoURL);
    profileForm.setAttribute('data-badage', user.email);
    showElements(['inner-message-profile']);

    var origStr = window.location.search;
    var q = origStr.substr(1, origStr.length-1);
    var queryParam = parseQueryString(q);

    var rCode = queryParam['rCode'];
    if (rCode == undefined || rCode == "")
        rCode = getCookie('rCode');
    if (rCode != "") {
        setCookie("rCode", rCode, 7);
        console.log("set rcode " + rCode);
    }

    if (queryParam['getProducts'] === 'true'){
        getProducts();
        hideElements(['about-form', 'company_form', 'user_form', 'team_form']);
        showElements(['product_form', 'message']);

    }
    else if (queryParam['getCompany'] == 'true') {
        getCompany();
        hideElements(['about-form', 'product_form', 'user_form', 'team_form']);
        showElements(['company_form', 'message']);

    }
    else if (queryParam['getUser'] == 'true') {
        getUser();
        hideElements(['about-form', 'product_form', 'company_form', 'team_form']);
        showElements(['user_form', 'message']);

    }else if (queryParam['getTeam'] == 'true') {
        getTeam();
        hideElements(['about-form', 'product_form', 'company_form', 'user_form']);
        showElements(['team_form', 'message']);

    }else {
        hideElements(['message']);
        showElements(['about-form']);
    }
}

/**
 * Displays the UI for a signed out user.
 */
var handleSignedOutUser = function() {
    hideElements(['google-signout-form', 'delete-account-form', 'about-form']);
    showElements(['message', 'google-signin-form'])
    //document.getElementById('company_info').setAttribute('hidden', "true");
    var origStr = window.location.search;
    var q = origStr.substr(1, origStr.length-1);
    var queryParam = parseQueryString(q);
    if (queryParam['rCode']==true) {
        var invitor = queryParam['rCode'];
        setCookie('rCode', invitor, 7);

    }
    ui.start('#firebaseui-container', getUiConfig());
};

// Listen to change in auth state so it displays the correct UI for when
// the user is signed in or not.
firebase.auth().onAuthStateChanged(function(user) {
    //document.getElementById('loading').removeAttribute('hidden');
    //document.getElementById('loaded').setAttribute('hidden', "true");
    user ? handleSignedInUser(user) : handleSignedOutUser();
});

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

// Disable auto-sign in.
ui.disableAutoSignIn();

logon.prototype.initFirebase = function() {
    if (!this.auth) {
        this.auth = firebase.auth();
        initApp();
    }
    //this.storage = firebase.storage();


};
window.onload = function() {
    window.logon = new logon();
    //window.company_info = new Compoany();
};