var $dateRange;
var userDataTable, sessionDataTable, customerDataTable;
var $userTable = '#user-table';
var $sessionTable = '#session-table';
var $customerTable = '#customer-table';
var $userForm = $('#userForm');
var $customerForm = $('#customerForm');
var createFlag;

var dynamoClient = new AWS.DynamoDB.DocumentClient();

$(function () {
    $("#tabs").tabs();
    initializeDateRange();
    populateCustomerTable();
    initializeLogoutHandler();

    // Update
    $('#customer-table').on('click', "td:not(:first-child)", function(){
        createFlag = false;
        $("#customerModal").modal("show");
        $("#emailInput").val($(this).closest('tr').children()[1].textContent);
        $("#emailInput").prop('disabled', true);
        $("#accessCodeInput").val($(this).closest('tr').children()[2].textContent);
        $("#statusInput").val($(this).closest('tr').children()[3].textContent);
        $("#emailMustContainInput").val($(this).closest('tr').children()[4].textContent);
        $("#startDateInput").val(convertFormattedDate($(this).closest('tr').children()[5].textContent));
        $("#endDateInput").val(convertFormattedDate($(this).closest('tr').children()[6].textContent));
        $("#lesson1Input").val($(this).closest('tr').children()[7].textContent);
        $("#lesson14Input").val(convertFormattedDate($(this).closest('tr').children()[8].textContent));
        $("#planInput").val($(this).closest('tr').children()[9].textContent);
        $("#typeInput").val($(this).closest('tr').children()[10].textContent);
        $("#customerNameInput").val($(this).closest('tr').children()[11].textContent);
        $("#locationInput").val($(this).closest('tr').children()[12].textContent);
        $("#howFoundOutInput").val($(this).closest('tr').children()[13].textContent);
        $("#moreInfo1Input").val($(this).closest('tr').children()[14].textContent);
        $("#moreInfo2Input").val($(this).closest('tr').children()[15].textContent);
        $("#moreInfo3Input").val($(this).closest('tr').children()[16].textContent);

    });

    // Add
    $("#add-btn").on('click', function() {
        createFlag = true;
        $("#customerModal").modal("show");
        $("#emailInput").prop('disabled', false);
        $("#emailInput").val("");
        $("#accessCodeInput").val("");
        $("#statusInput").val("true");
        $("#emailMustContainInput").val("");
        $("#startDateInput").val("");
        $("#endDateInput").val("");
        $("#lesson1Input").val("");
        $("#lesson14Input").val("");
        $("#planInput").val("");
        $("#typeInput").val("");
        $("#customerNameInput").val("");
        $("#locationInput").val("");
        $("#howFoundOutInput").val("");
        $("#moreInfo1Input").val("");
        $("#moreInfo2Input").val("");
        $("#moreInfo3Input").val("");
    });

    // Delete
    $("#delete-btn").on('click', function() {
        if ($(".checkbox:checked").length > 0)
        {
            if (confirm("Are you sure you want to delete selected item(s)?")) {
                $('.checkbox:checked').each(function () {
                    var email = $(this).closest('tr').children()[1].textContent;
                    deleteCustomerItem(email, function(){
                        changePage("/");
                    });
                });
            }
        } else {
            alert("Please select item(s) to delete.")
        }

    });

    $('#customerForm').validate({
            rules: {
                emailInput: {
                    required: true
                },
                accessCodeInput: {
                    required: true
                }
            },
            errorPlacement: function (error, element) {
                error.appendTo(element.parent());
            },
            submitHandler: function (loginForm) {
                console.log("In submit handler");
                var emailInput = transformEmptyString($("#emailInput").val().trim());
                var accessCodeInput = transformEmptyString($("#accessCodeInput").val().trim());
                var statusInput = transformEmptyString($("#statusInput").val().trim());
                var emailMustContainInput = transformEmptyString($("#emailMustContainInput").val().trim());
                var startDateInput = transformEmptyString($("#startDateInput").val().trim());
                var endDateInput = transformEmptyString($("#endDateInput").val().trim());
                var lesson1Input = transformEmptyString($("#lesson1Input").val().trim());
                var lesson14Input = transformEmptyString($("#lesson14Input").val().trim());
                var planInput = transformEmptyString($("#planInput").val().trim());
                var typeInput = transformEmptyString($("#typeInput").val().trim());
                var customerNameInput = transformEmptyString($("#customerNameInput").val().trim());
                var locationInput = transformEmptyString($("#locationInput").val().trim());
                var howFoundOutInput = transformEmptyString($("#howFoundOutInput").val().trim());
                var moreInfo1Input = transformEmptyString($("#moreInfo1Input").val().trim());
                var moreInfo2Input = transformEmptyString($("#moreInfo2Input").val().trim());
                var moreInfo3Input = transformEmptyString($("#moreInfo3Input").val().trim());
                debugger;
                createOrUpdateCustomerTable(emailInput, accessCodeInput, statusInput, emailMustContainInput,
                                    startDateInput, endDateInput, lesson1Input, lesson14Input,
                                    planInput, typeInput, customerNameInput, locationInput,
                                    howFoundOutInput, moreInfo1Input, moreInfo2Input, moreInfo3Input)

            }
        });
    /*$('#userForm').validate({
            rules: {
                accessCode: {
                    required: true
                },
                date: {
                    required: true
                },
                email: {
                    required: true
                },
                enabled: {
                    required: true
                },
                firstName: {
                    required: true
                },
                lastName: {
                    required: true
                },
                highestLesson: {
                    required: true
                }
            },
            errorPlacement: function (error, element) {
                error.appendTo(element.parent());
            },
            submitHandler: function (loginForm) {

                console.log("In submit handler");
                var userId = $("#userId").val();
                var accessCode = $("#accessCode").val();
                var date = $("#date").val();
                var email = $("#email").val();
                var enabled = $("#enabled").val();
                var firstName = $("#firstName").val();
                var lastName = $("#lastName").val();
                var highestLesson = $("#highestLesson").val();
                updateUserInfoTable(userId, accessCode, date, email,
                                        enabled, firstName, lastName, highestLesson);

                changePage("/");
            }
    });*/

});
function initializeLogoutHandler() {
    $("#logout").click(function () {
        localStorage.removeItem('user');
        window.location.href = "/pages/signin.html"
    })
}

function initializeDateRange() {
    $dateRange = $("#cust-daterange");
    $('input[name="daterange"]').daterangepicker({
        locale: {
            format: 'DD/MM/YYYY',
            cancelLabel: 'Clear'
        }
    });
}

function populateUserTable() {
    if (userDataTable){
        userDataTable.destroy();
        userDataTable = null;
    }
    if (sessionDataTable){
        sessionDataTable.destroy();
        sessionDataTable = null;
    }
    $('#searchInputUsers').off();
    var userTable = "user_info";
    var userTableData = ScanDynamoTable(userTable);
    var userDataMapper = function (user) {
        return [user.user_id, user.access_code, user.date_registered, user.email, user.enabled_disabled, user.first_name, user.last_name, user.highest_lesson]
    };
    var columnClasses = [null, null, null, null, null, null, null, null];
    populateTable($userTable, userTableData, userDataMapper, columnClasses);
}

function split(value, sep) {
    if (value) {
        return value.split(sep)[0]
    }
    return value;
}

function populateSessionTable() {
    if (userDataTable){
        userDataTable.destroy();
        userDataTable = null;
    }
    if (sessionDataTable){
        sessionDataTable.destroy();
        sessionDataTable = null;
    }
    $('#searchInputSession').off();
    var sessionTable = "user_session";
    var sessionTableData = ScanDynamoTable(sessionTable);
    var sessionDataMapper = function (session) {
        return [session.user_id, split(session.playlist_completed, "::"), split(session.duration, " "), session.start_date_time, session.end_date_time]
    };
    var columnClasses = [
        null,
        null,
        null,
        {className: "startDate"},
        {className: "endDate"}
    ];
    var sumColumn = 2;
    populateTable($sessionTable, sessionTableData, sessionDataMapper, columnClasses, sumColumn);
    $dateRange.change(function () {
        filterTableByDateRange($sessionTable);
    });
}

function populateCustomerTable() {
    if (customerDataTable){
        customerDataTable.destroy();
        customerDataTable = null;
    }
    $('#searchInputCustomer').off();
    var customerTableName = "customer";
    var customerDataTable = ScanDynamoTable(customerTableName);

    var customerDataMapper = function (customer) {
        return ["<input type='checkbox' class='checkbox'>",
            validateField(customer.email), validateField(customer.access_code),
            validateField(customer.customer_status), validateField(customer.email_must_contain),
            formatDate(parseDate(customer.start_date)), formatDate(parseDate(customer.end_date)),
            validateField(customer.lesson1), formatDate(parseDate(customer.lesson14)),
            validateField(customer.customer_plan), validateField(customer.customer_type),
            validateField(customer.customer_name), validateField(customer.customer_location),
            validateField(customer.how_found_out), validateField(customer.more_info_1),
            validateField(customer.more_info_2), validateField(customer.more_info_3)]
    };
    // 17 columns
    var columnClasses = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
    var sumColumn = 2;
    populateTable($customerTable, customerDataTable, customerDataMapper, columnClasses);
    $dateRange.change(function () {
        filterTableByDateRange($customerTable);
    });
}

function populateTable(tableId, dataLoaderCallback, dataMapper, columnsClasses, sumColumn) {
    dataLoaderCallback(function (data) {
        var items = data.Items.map(dataMapper);
        var options = {
            "data": items,
            responsive: true,
            fixedHeader: false,
            colReorder: true,
            dom: 'Bflrtip',
            select: false,
            'iDisplayLength': 100,
            "scrollXInner": true,
            buttons: [
                'colvis',
//                {
//                    extend: 'print',
//                    exportOptions: {
//                        columns: ':visible'
//                    }
//                },
//                {
//                    extend: 'copy',
//                    exportOptions: {
//                        columns: ':visible'
//                    }
//                },
                {
                    extend: 'excel',
                    exportOptions: {
                        columns: ':visible'
                    }
                },
                {
                    extend: 'csv',
                    exportOptions: {
                        columns: ':visible'
                    }
                }
            ],
            "columns": columnsClasses,
            "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]]
        };
        if (sumColumn) {
            options.drawCallback = function () {
                var api = this.api();
                var millis = api.column(2, {page: 'current'}).data().map(function(time) {
                    time = time.split(' ')[0];
                    var minutes = time.split(":")[0];
                    var seconds = time.split(":")[1];
                    return minutes * 60000 + seconds * 1000;
                }).sum();
                var formatted = moment.duration(millis).format("hh:mm:ss");
                $("#duration-sum").html(formatted);
            }
        }

        $.fn.dataTable.moment('D/M/YYYY');
        $.fn.dataTable.moment('D/M/YYYY H:m');
        $.fn.dataTable.moment('D/M/YYYY H:m:s');
        $.fn.dataTable.moment('m:ss');

        $.fn.dataTable.ext.search.push(
            function( settings, data, dataIndex ) {
                if (customerDataTable) {
//                    var dangeRangeSearchIndex = $("#dateRangeSearchColumn").prop('selectedIndex');
                    var dangeRangeSearchIndex = $("#dateRangeSearchColumn").val();
                    console.log("In datatable search");
                    debugger;
                    var dateRange = $dateRange.val().split("-").map(function (value) {
                        return value.trim()
                    });

                    var minDate = toDate(dateRange[0]) || new Date(0);
                    var maxDate = toDate(dateRange[1]) || new Date();
                    debugger;
                    var searchDateStr;
                    if (data[dangeRangeSearchIndex] == "NA") { return; } else { searchDateStr = convertFormattedDate(data[dangeRangeSearchIndex]); }
//                    if (data[6] == "NA") { endDateStr = "01-01-2099"; } else { endDateStr = convertFormattedDate(data[6]); }
                    var searchDate = moment(searchDateStr, "DD-MM-YYYY").toDate();
//                    var endDate = moment(endDateStr, "DD-MM-YYYY").toDate();
                    return searchDate >= minDate && searchDate <= maxDate;
                }
                return true;
            }
        );

        if (tableId === $userTable) {
            userDataTable = $(tableId).DataTable(options);
            var table = userDataTable
        } else if(tableId === $sessionTable) {
            sessionDataTable = $(tableId).DataTable(options);
            table = sessionDataTable
        } else if(tableId === $customerTable) {
              customerDataTable = $(tableId).DataTable(options);
              table = customerDataTable
        }

        $('#searchInputUsers').on('keyup', function () {
            var index = $("#searchSelectUsers").prop('selectedIndex');
            table
                .columns(index)
                .search(this.value)
                .draw();
        });

        $('#searchInputSession').on('keyup', function () {
            var index = $("#searchSelectSession").prop('selectedIndex');
            table
                .columns(index)
                .search(this.value)
                .draw();
        });
        $('#searchInputCustomer').on('keyup', function () {
            var index = $("#searchSelectCustomer").prop('selectedIndex');
            table
                .columns(index)
                .search(this.value)
                .draw();
        });
    });
}


function validateField(field) {
    if (field == null) {
        return "";
    }
    return field;
}

function transformEmptyString(value) {
    if (value == "") {
        return "NA";
    }
    return value;
}

function filterTableByDateRange(tableId) {
    if (userDataTable) {
        userDataTable.draw();
    }
    if (sessionDataTable) {
        sessionDataTable.draw();
    }

    if (customerDataTable) {
        customerDataTable.draw();
    }
}

function formatDate(date) {
    if (date == "NA") { return date; }
    var month = date.toLocaleString("en-us", { month: "short" });
    var day = date.getDate();
    var year = date.getFullYear();
    var newDate = month + ' ' + day + ' ' + year;
    return newDate;
}

function parseDate(date){
   if (date == "NA") { return date; }
   var parts = date.split("-");
   return new Date(parts[2], parts[1] - 1, parts[0]);
}

function convertFormattedDate(formattedDate) {
    if (formattedDate == "NA") { return formattedDate; }
    var months = {jan:1,feb:1,mar:3,apr:4,may:5,jun:6,
                jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
    var p = formattedDate.split(' ');
    return p[1] + '-' + months[p[0].toLowerCase()] + '-' + p[2];
}

function toDate(dateStr) {
    var parts = dateStr.split("/");
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function changePage(page) {
    window.location.replace(page);
}
