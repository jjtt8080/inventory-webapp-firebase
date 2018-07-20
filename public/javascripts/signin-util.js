function getRecaptchaMode() {
    // Quick way of checking query params in the fragment. If we add more config
    // we might want to actually parse the fragment as a query string.
    return location.hash.indexOf('recaptcha=invisible') !== -1 ?
        'invisible' : 'normal';
};
function getUiConfig() {
    return {
        'callbacks': {
            // Called when the user has been successfully signed in.
            'signInSuccessWithAuthResult': function(authResult, redirectUrl) {
                if (authResult.user) {
                    handleSignedInUser(authResult.user);
                }

                // Do not redirect.
                return false;
            }
        },
        // Opens IDP Providers sign-in flow in a popup.
        //'signInFlow': 'popup',
        'signInOptions': [
            {
                provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                // Required to enable this provider in One-Tap Sign-up.
                authMethod: 'https://accounts.google.com',
                // Required to enable ID token credentials for this provider.
                clientId: MY_CLIENT_ID,
                customParameters: {
                    // Forces account selection even when one account
                    // is available.
                    prompt: 'select_account'
                }
            } /*,
            {
                provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
                recaptchaParameters: {
                    size: getRecaptchaMode()
                }
            }*/
        ],
        // Terms of service url.
        'tosUrl': 'https://www.google.com',
        'credentialHelper': MY_CLIENT_ID && MY_CLIENT_ID != 'YOUR_OAUTH_CLIENT_ID' ?
            firebaseui.auth.CredentialHelper.GOOGLE_YOLO :
            firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM
    };
}


/**
 * Deletes the user's account.
 */
function deleteAccount () {
    firebase.auth().currentUser.delete().catch(function(error) {
        if (error.code == 'auth/requires-recent-login') {
            // The user's credential is too old. She needs to sign in again.
            firebase.auth().signOut().then(function() {
                // The timeout allows the message to be displayed after the UI has
                // changed to the signed out state.
                setTimeout(function() {
                    alert('Please sign in again to delete your account.');
                }, 1);
            });
        }
    });
};




function updateStatusInfo(parentDiv, text) {
    document.getElementById(parentDiv).innerHTML = text;
};

/**
 *   Send email link for verification
 */
function emailLogin () {
    var email =  $('#email_auth').val();
    var password =  $('#password_auth').val();
    firebase.auth().createUserWithEmailAndPassword(email, password).then(function(p){
        var u = firebase.auth().currentUser;
        console.info('email verified or not? ' + u.emailVerified);
        if (!u.emailVerified) {
            uppdateStatusInfo('email_auth_status', 'Check your email for the verification link.')
            u.sendEmailVerification().catch(function (error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.error(errorMessage);
                errorMessage = "<h6>" + errorMessage + "</h6>";
                updateStatusInfo('email_auth_status', errorMessage);
            });

        }
        if (u.emailVerified) {
            uppdateStatusInfo('email_auth_status',
                "Your email is verified, click on Company Profile and Personal Profile to finish setup");
        }

    }).catch(function(error){
        var errorCode = error.code;
        var errorMessage = error.message;
        console.error(errorMessage);
        errorMessage = "<h6>" + errorMessage + "</h6>";
        updateStatusInfo('email_auth_status', errorMessage);
    });
};

function handleRecaptchaConfigChange() {
    var newRecaptchaValue = document.querySelector(
        'input[name="recaptcha"]:checked').value;
    location.replace(location.pathname + '#recaptcha=' + newRecaptchaValue);

    // Reset the inline widget so the config changes are reflected.
    ui.reset();
    ui.start('#firebaseui-container', getUiConfig());
};
/**
 * Initializes the app.
 */
function initApp() {

    //document.getElementById('sign-out').addEventListener('click', function() {
    //    firebase.auth().signOut();
    //});
    document.getElementById('delete-account').addEventListener(
        'click', function() {
            deleteAccount();
        });

    document.getElementById('recaptcha-normal').addEventListener(
        'change', handleRecaptchaConfigChange);
    document.getElementById('recaptcha-invisible').addEventListener(
        'change', handleRecaptchaConfigChange);
    // Check the selected reCAPTCHA mode.
    document.querySelector(
        'input[name="recaptcha"][value="' + getRecaptchaMode() + '"]')
        .checked = true;


};

//export {initApp, emailLogin, updateStatusInfo, deleteAccount, getUiConfig, getRecaptchaMode};