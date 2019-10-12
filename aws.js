var AWSRegion = 'us-east-1';
var AWSIdentityPoolId = 'us-east-1:b41e13b1-9d7b-4b3f-9168-d431112b0167';

/* Initialize aws sdk */
AWS.config.region = AWSRegion;
//AWS.config.credentials = new AWS.CognitoIdentityCredentials({
//    IdentityPoolId: AWSIdentityPoolId
//});
AWS.config.update({
  region: "us-east-1",
  // accessKeyId default can be used while using the downloadable version of DynamoDB.
  // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
  accessKeyId: "AKIA3OS7AXFJ2EAPYUO4",
  // secretAccessKey default can be used while using the downloadable version of DynamoDB.
  // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
  secretAccessKey: "pEJb4nZkpNqiccXsSBADq6ZGUzqftv34LbYp2e8E"
});
var dynamoClient = new AWS.DynamoDB.DocumentClient();

$(function () {

});

var ScanDynamoTable = function (tableName) {
    return function (success, failure) {

        var params = {
            TableName: tableName
        };

        dynamoClient.scan(params, onScan);

        function onScan(err, data) {
            if (err) {
                console.log("err", JSON.stringify(err, undefined, 2));
                failure(err);
                return;
            }
            success(data);
        }
    }
};

var poolData = {
    UserPoolId: 'us-east-1_wRzZGArfk', // Your user pool id here
    ClientId: '5bkb3vq7u9p267436fmrt7gegc'
};

var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);

// TODO: we are not relying on accesscode to access tables
var loginCognitoUser = function (username, password, success, failure) {
    // Authenticate user to get Tokens and retrieve userdata on successfull Login
    var authenticationData = {
        Username: username,
        Password: password
    };
    var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);

    var userData = {
        Username: username,
        Pool: userPool
    };

    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

    function newPasswordRequired(userAttributes, requiredAttributes) {
        delete userAttributes.email_verified;
        cognitoUser.completeNewPasswordChallenge(password, userAttributes, this);
    }

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: success,
        onFailure: failure,
        newPasswordRequired: newPasswordRequired
    });
};

var loginAdminDynamoDB = function(username, password, success, failure) {
    var params = {
        TableName : "user_admin",
        KeyConditionExpression: "#username = :username",
        ExpressionAttributeNames:{
            "#username": "username"
        },
        ExpressionAttributeValues: {
            ":username": username
        }
    };
    dynamoClient.query(params, function(err, data) {
        if (err) {
            console.log("err", JSON.stringify(err, undefined, 2));
            return;
        } else {
            if (data.Count == 0) {
                failure("Invalid username/password.");
                return;
            }
            var item = data.Items[0];
            if (item.password === password) {
                success({"username": item.username});
            } else {
                failure("Invalid username/password.");
            }
        }
     });
}

function createOrUpdateCustomerTable(email, accessCode, status, emailMustContain, startDate,
                             endDate, lesson1, lesson14, customerPlan, customerType, customerName,
                             customerLocation, howFoundOut, moreInfo1, moreInfo2, moreInfo3) {

    debugger;

    var cust = customerExists(email,
            function update() {
                // Update
                console.log("Updating user..");
                debugger;
                var params = {
                    TableName: "customer",
                    Key:{
                        "email": email
                    },
                    UpdateExpression: "set access_code = :access_code, " +
                                      "customer_status = :customer_status, email_must_contain = :email_must_contain, " +
                                      "start_date = :start_date, end_date = :end_date, " +
                                      "lesson1 = :lesson1, lesson14 = :lesson14, " +
                                      "customer_plan = :customer_plan, customer_type = :customer_type, customer_name = :customer_name," +
                                      "customer_location = :customer_location, how_found_out = :how_found_out," +
                                      "more_info_1 = :more_info_1, more_info_2 = :more_info_2," +
                                      "more_info_3 = :more_info_3",
                    ExpressionAttributeValues:{
                        ":access_code": accessCode,
                        ":customer_status": status,
                        ":email_must_contain": emailMustContain,
                        ":start_date": startDate,
                        ":end_date": endDate,
                        ":lesson1": lesson1,
                        ":lesson14": lesson14,
                        ":customer_plan": customerPlan,
                        ":customer_type": customerType,
                        ":customer_name": customerName,
                        ":customer_location": customerLocation,
                        ":how_found_out": howFoundOut,
                        ":more_info_1": moreInfo1,
                        ":more_info_2": moreInfo2,
                        ":more_info_3": moreInfo3
                    },
                    ReturnValues:"UPDATED_NEW"
                };
//                alert("out");
//                debugger;
                dynamoClient.update(params, function(err, data) {
                    if (err) {
                        alert(err);
                        console.log(err);
                        return;
                    }
                    changePage("/");
                });

            }, function create() {
                email = email.toLowerCase();
                if (startDate == "NA") {
                    var date = new Date();
                    var currentDate = ('0' + date.getDate()).slice(-2) + '-'+
                                      ('0' + (date.getMonth()+1)).slice(-2) + '-' +
                                      date.getFullYear();
                    startDate = currentDate;
                }
                var params = {
                    TableName: "customer",
                    Item:{
                        "email": email,
                        "access_code": accessCode,
                        "customer_status": status,
                        "email_must_contain": emailMustContain,
                        "start_date": startDate,
                        "end_date": endDate,
                        "lesson1": lesson1,
                        "lesson14": lesson14,
                        "customer_plan": customerPlan,
                        "customer_type": customerType,
                        "customer_name": customerName,
                        "customer_location": customerLocation,
                        "how_found_out": howFoundOut,
                        "more_info_1": moreInfo1,
                        "more_info_2": moreInfo2,
                        "more_info_3": moreInfo3
                    }
                };
                dynamoClient.put(params, function(err, data) {
                    if (err) {
                        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                        alert("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("Added item:", JSON.stringify(data, null, 2));
                        changePage("/");
                    }
                });

            });
};
function customerExists(email, update, create) {

    var params = {
        TableName : "customer",
        KeyConditionExpression: "#email = :email",
        ExpressionAttributeNames:{
            "#email": "email"
        },
        ExpressionAttributeValues: {
            ":email": email
        }
    };
    dynamoClient.query(params, function(err, data) {
        if (err) {
            console.log("err", JSON.stringify(err, undefined, 2));
            return;
        } else {
            console.log("Query succeeded.");
            debugger;
            if (data.Count == 0) {
                create();
            }
            update();
        }
     });
}

function deleteCustomerItem(email, onDelete) {
    var params = {
        TableName: "customer",
        Key:{
            "email": email
        }
    };
    dynamoClient.delete(params, function(err, data) {
        if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
            alert("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2))
        } else {
            onDelete();
        }
    });
}


function updateUserInfoTable(userId, accessCode, dateRegistered, email, enabledDisabled, FName, LName, highestLesson) {

    var params = {
        TableName: "user_info",
        Key:{
            "user_id": userId,
        },
        UpdateExpression: "set email = :email, access_code=:access_code," +
                          "enabled_disabled=:enabled_disabled, highest_lesson=:highest_lesson," +
                          "first_name=:first_name, last_name=:last_name," +
                          "date_registered=:date_registered",
        ExpressionAttributeValues:{
            ":email": email,
            ":access_code": accessCode,
            ":enabled_disabled": enabledDisabled,
            ":highest_lesson": highestLesson,
            ":first_name": FName,
            ":last_name": LName,
            ":date_registered": dateRegistered
        },
        ReturnValues:"UPDATED_NEW"
    };

    dynamoClient.update(params, function(err, data) {
        if (err) {
            console.log(err);
            alert(err);
            return;
        }
    });
};
