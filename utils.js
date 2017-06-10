var apiUrl = "http://localhost:3000";
var score = 0;
var questions = {};
var menuItems = [];
var rnliForms = function() {
    var issue = $("#Issue").val();
    var location = $("#Location").val();
    var comment = $("#comments").val();
    var responseTime = $("#ResponseTime").val();
    var date = $("#Date").val();
    var path = "/rnli/" + date + "/" + responseTime + "/" + location + "/" + issue + "/" + comment;
    doRequest(apiUrl + path, "POST");
};
var renderQuestion = function(options) {
    $.Mustache.load('./templates.mustache')
        .done(function() {
            $('#content').html($.Mustache.render('question', options));
            $('#responses').html($.Mustache.render('responses', options));
            $('#responses div').each(function() {
                if ($(this).attr("score") != "0") {
                    $(this).find("a").addClass("btn-danger");
                } else {
                    $(this).find("a").addClass("btn-success");
                }
                $(this).click(function() {
                    score += $(this).attr("score");
                    var nextID = $(this).attr("nextid");
                    if (nextID == "EVAL") {
                        doEvaluation();
                    } else if (nextID == "PATIENT_FORM") {
                        renderPatientForm();
                    } else {
                        renderQuestion(questions[nextID]);
                    }
                });
            });
        });
};

var renderPatientForm = function() {

    $.Mustache.load('./templates.mustache')
        .done(function() {
              $('#content').html($.Mustache.render('patientData'));
              $('#responses').html($.Mustache.render('patientDataSubmit'));
        });
};

var renderMenu = function(categoryID) {
    $.Mustache.load('./templates.mustache')
        .done(function() {
            var options = {};
            if (categoryID) {
                for (var i in menuItems) {
                    var item = menuItems[i];
                    if (item.id == categoryID) {
                        options["menuItems"] = item.options;
                    }
                }
            } else {
                options["menuItems"] = menuItems;
            }

            $('#content').html($.Mustache.render('contents', options));
            $('#responses').html("");
            if (categoryID) {
                $('#content li').each(function() {
                    $(this).click(function() {
                        var nextID = $(this).attr("nextid");
                        renderQuestion(questions[nextID]);
                    });
                });
            } else {
                $('#content li').each(function() {
                    $(this).click(function() {
                        var ID = $(this).attr("id");
                        renderMenu(ID);
                    });
                });
            }
        });
};

var doEvaluation = function() {
    $.Mustache.load('./templates.mustache')
        .done(function() {
            var status = "LITTLE SICK";
            if (score > 2) {
                status = "BIG SICK";
            }

            var options = {
                "status": status
            };

            $('#content').html($.Mustache.render('evaluation', options));
            $('#test').html($.Mustache.render('rnliForm', options));

            $('#responses').html($.Mustache.render('next', options));
            $('#responses div').each(function() {
                $(this).click(function() {
                    renderMenu();
                });
            });
            //$('.container').mustache('responses', options);
        });
};


var doRequest = function(targetUrl, method, callback) {
    var xmlReq = new XMLHttpRequest();
    xmlReq.onreadystatechange = function() {
        if (xmlReq.readyState == 4 && xmlReq.status == 200) {
            callback(xmlReq.responseText);
        }
    }
    xmlReq.open(method, targetUrl, true);
    xmlReq.send(null);
};

var processQuestions = function(response) {
    response = JSON.parse(response);
    for (var r in response) {
        var row = response[r];
        questions[row.id] = row;
    }
    renderQuestion(questions["1"]);
};

var processMenu = function(response) {
    response = JSON.parse(response);
    for (var r in response[0].contents) {
        menuItems.push(response[0].contents[r]);
    }
};

doRequest(apiUrl + "/questions", "GET", function(result) {
    processQuestions(result);
    doRequest(apiUrl + "/contents", "GET", function(result) {
        processMenu(result);
    });
});
