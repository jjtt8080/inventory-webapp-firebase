

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
    var signOutForm = document.getElementById("google-signout-form");
    var signinForm = document.getElementById("google-signin-form");
    var deleteForm = document.getElementById("delete-account");
    var messageForm = document.getElementById("inner-message");
    var profileForm = document.getElementById('inner-message-profile');

    signOutForm.setAttribute('hidden', 'true');
    deleteForm.setAttribute('hidden', 'true');
    signinForm.removeAttribute('hidden');
    messageForm.removeAttribute('hidden');
    profileForm.setAttribute('hidden', 'true');
};
var sendInviteEmail = function() {

}

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
    var signOutForm = document.getElementById("google-signout-form");
    var signinForm = document.getElementById("google-signin-form");
    var deleteForm = document.getElementById('delete-account-form');
    var aboutForm = document.getElementById('about-form');

    signOutForm.removeAttribute('hidden');
    deleteForm.removeAttribute('hidden');
    aboutForm.removeAttribute('hidden');
    signinForm.setAttribute('hidden', 'true');
    var innerMessage = document.getElementById('inner-message');
    innerMessage.setAttribute('hidden', 'true');
    var profileForm = document.getElementById('inner-message-profile');
    profileForm.innerHTML =  user.email +  "<img height=40 width=40 src=\"" + user.photoURL + "\"/>";

    profileForm.removeAttribute('hidden');
    var origStr = window.location.search;
    var q = origStr.substr(1, origStr.length-1);
    var queryParam = parseQueryString(q);
    if (queryParam['getProducts'] === 'true'){
        getProducts();
        document.getElementById('about-form').setAttribute('hidden', 'true');
        document.getElementById("message").removeAttribute('hidden');
        document.getElementById('company_form').setAttribute('hidden', 'true');
        document.getElementById('user_form').setAttribute('hidden', 'true');
        document.getElementById('product_form').removeAttribute('hidden');


    }
    else if (queryParam['getCompany'] == 'true') {
        getCompany();
        document.getElementById('about-form').setAttribute('hidden', 'true');
        document.getElementById("message").removeAttribute('hidden');
        document.getElementById('user_form').setAttribute('hidden', 'true');
        document.getElementById('product_form').setAttribute('hidden', 'true');
        document.getElementById('company_form').removeAttribute('hidden');
    }
    else if (queryParam['getUser'] == 'true'){
        getUser();
        document.getElementById('about-form').setAttribute('hidden', 'true');
        document.getElementById("message").removeAttribute('hidden');
        document.getElementById('product_form').setAttribute('hidden', 'true');
        document.getElementById('company_form').setAttribute('hidden', 'true');
        document.getElementById('user_form').removeAttribute('hidden');
    }else {
        document.getElementById("message").setAttribute('hidden', 'true');
        document.getElementById('about-form').removeAttribute('hidden');
    }
}

/**
 * Displays the UI for a signed out user.
 */
var handleSignedOutUser = function() {
    document.getElementById('message').removeAttribute('hidden');
    document.getElementById('google-signin-form').removeAttribute('hidden');
    document.getElementById('google-signout-form').setAttribute('hidden', "true");
    document.getElementById('delete-account-form').setAttribute('hidden', 'true');
    document.getElementById('about-form').setAttribute('hidden', "true");
    //document.getElementById('company_info').setAttribute('hidden', "true");
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
/*
import {getRecaptchaMode} from './signin-util';
import {getUiConfig} from './signin-util';
import {deleteAccount} from './signin-util';
import {updateStatusInfo} from './signin-util';
import {emailLogin} from './signin-util';
import {initApp} from './signin-util;'
*/
logon.prototype.initFirebase = function() {
    if (!this.auth) {
        this.auth = firebase.auth();
        initApp();
    }
    //this.storage = firebase.storage();


};
window.onload = function() {
    window.logon = new logon();
};