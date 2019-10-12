$(function () {
    var $loginForm = $('#login');

    $loginForm.validate({
        rules: {
            email: {
                required: false
            },
            password: {
                required: false
            }
        },
        messages: {
            email: {
                required: "Please enter valid email."
            },
            password: {
                required: "Please enter valid password."
            }
        },
        errorPlacement: function (error, element) {
            error.appendTo("#error-field");
        },
        submitHandler: function () {
            var email = $("#username").val();
            var password = $("#password").val();
            loginAdminDynamoDB(email, password,
                function success(res) {
                    console.log(res);
                    localStorage.setItem('user', JSON.stringify(res));
                    window.location.href = "/"
                }, function error(err) {
                    $loginForm.validate().showErrors({password: err});
                });
        }
    });

});
