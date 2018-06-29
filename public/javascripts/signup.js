
/**
 * @return {!Object} The FirebaseUI config.
 */
// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

// Disable auto-sign in.
ui.disableAutoSignIn();
/**
 * Handles when the user changes the reCAPTCHA config.
 */
function handleRecaptchaConfigChange() {
    var newRecaptchaValue = document.querySelector(
        'input[name="recaptcha"]:checked').value;
    location.replace(location.pathname + '#recaptcha=' + newRecaptchaValue);

    // Reset the inline widget so the config changes are reflected.
    ui.reset();
    ui.start('#firebaseui-container', getUiConfig());
};

/**
 * Displays the UI for a signed in user.
 * @param {!firebase.User} user
 */
var handleSignedInUser = function(user) {

    var origStr = window.location.search;
    var q = origStr.substr(1, origStr.length-1);
    var queryParam = parseQueryString(q);
    if (queryParam["referal"] == 'true' && queryParam['rCode'] != "")
        setCookie('rCode', queryParam['rCode']);
    document.getElementById('user-signed-out').setAttribute('hidden', 'true');
    document.getElementById('user-signed-in').removeAttribute('hidden');
    document.getElementById('firebaseui-spa').setAttribute('hidden', 'true');
    document.getElementById('google-signout-form').removeAttribute('hidden');
    document.getElementById('delete-account-form').removeAttribute('hidden');
    document.getElementById('user-signed-in-form').innerHTML = "Click <a href=\"logon.html?getCompany=true&rCode=" + " +
            getCookie('rCode') + "\">here</a> to setup your company info.";
};



/**
 * Displays the UI for a signed out user.
 */
var handleSignedOutUser = function() {
    document.getElementById('user-signed-out').removeAttribute('hidden');
    document.getElementById('user-signed-in').setAttribute('hidden', "true");
    document.getElementById('firebaseui-spa').removeAttribute('hidden');
    document.getElementById('google-signout-form').setAttribute('hidden', 'true');
    document.getElementById('delete-account-form').setAttribute('hidden', 'true');
    //document.getElementById('company_info').setAttribute('hidden', "true");
    if (queryParam["referal"] == 'true' && queryParam['rCode'] != "")
        setCookie('rCode', queryParam['rCode']);
    ui.start('#firebaseui-container', getUiConfig());
};

// Listen to change in auth state so it displays the correct UI for when
// the user is signed in or not.
firebase.auth().onAuthStateChanged(function(user) {
    //document.getElementById('loading').removeAttribute('hidden');
    //document.getElementById('loaded').setAttribute('hidden', "true");
    user ? handleSignedInUser(user) : handleSignedOutUser();
});






window.addEventListener('load', initApp);
