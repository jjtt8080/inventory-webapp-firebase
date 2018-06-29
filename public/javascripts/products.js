$('.upload-btn').on('click', function () {
    $('#upload-input').click();
    $('.progress-bar').text('0%');
    $('.progress-bar').width('0%');
});
$('#upload-input').on('change', function () {
    setCookie('products_form', "");
    var files = $(this).get(0).files;

    if (files.length > 0) {
        // create a FormData object which will be sent as the data payload in the
        // AJAX request
        var formData = new FormData();
        // loop through all the selected files and add them to the formData object
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var storageRef = firebase.storage().ref();
            var fileRef = storageRef.child('uploads/' + file.name);
            formData.append('uploads', file.name);
            fileRef.put(file).then(function(snapshot){
               console.log("uploaded file" + flie.name);
                updateStatusInfo('upload_response', 'upload successfully!');
            }).catch(function(error){
                updateStatusInfo('upload_response', 'failed to upload data' + error.toString());
            });

        }
        for (var pair of formData.entries()){
            console.log(pair[0] + ":" + pair[1]);
        }
        var user=firebase.auth().currentUser;
        var token = user.getIdToken(true).then(function(accessToken) {
            $.ajax({
                url: '/uploadProducts',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                beforeSend: function (request) {
                    request.setRequestHeader("idToken", accessToken);
                },
                success: function (data) {
                    console.log('upload successful!\n' + data);
                },
                xhr: function () {
                    // create an XMLHttpRequest
                    var xhr = new XMLHttpRequest();

                    // listen to the 'progress' event
                    xhr.upload.addEventListener('progress', function (evt) {

                        if (evt.lengthComputable) {
                            // calculate the percentage of upload completed
                            var percentComplete = evt.loaded / evt.total;
                            percentComplete = parseInt(percentComplete * 100);

                            // update the Bootstrap progress bar with the new percentage
                            $('.progress-bar').text(percentComplete + '%');
                            $('.progress-bar').width(percentComplete + '%');

                            // once the upload reaches 100%, set the progress bar text to done
                            if (percentComplete === 100) {
                                $('.progress-bar').html('Done');
                            }

                        }

                    }, false);

                    return xhr;
                }
            });
        }).catch(function(error){
            console.error("error happen in retrieve user's token" + error);
            return;
        })

    }
});


var getProducts = function() {
    var previousResponse = getCookie('products_form');
    if ( previousResponse != undefined && previousResponse != "") {
        var product_info = JSON.parse(previousResponse);
        console.log("build the products from cookie");
        buildDataTable('products_body_form',product_info, ["product_desc", "quantity", "vendor_id"]);
        return;
    }
    var user = firebase.auth().currentUser;
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            hideElements(['loading_products']);
            try {

                const product_info = JSON.parse(req.responseText);
                console.log("req.responseText for getProducts" + req.responseText);
                const product_header =  ['product_desc', 'quantity', 'vendor_id'];
                buildDataTable('products_body_form',product_info, product_header);
                setCookie('products_form', req.responseText);

            } catch(error) {
                console.error("Error parsing reponse text" + error.message);
                updateStatusInfo('company_info_status', error.message);
            }
        }
        else if (req.readyState == 4 && req.status == 401) { //
            hideElements(['loading_products']);
            return updateStatusInfo( 'product_info_status', "permission denied");
        } else if (req.readyState == 4 && req.status == 400) {
            hideElements(['loading_products']);
            return updateStatusInfo('product_info_status', "Setting up new company info..");
        }
    };
    req.open("GET", "getProducts");
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var user=firebase.auth().currentUser;
    showElements(['loading_products']);
    var token = user.getIdToken(true).then(function(accessToken) {
        req.setRequestHeader("idToken", accessToken);
        //var stringToken = JSON.stringify(token);
        req.send();
    });
};
window.onload = function(){

};