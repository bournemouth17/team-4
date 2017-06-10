var apiUrl = "http://localhost:3000";
var score = 0;
var questions = {};
var menuItems = [];

/**
 * POSTs the user input to persist it in the database
 */
var rnliForms = function() {
    var issue = $("#Issue").val();
    var location = $("#Location").val();
    var comment = $("#comments").val();
    var responseTime = $("#ResponseTime").val();
    var date = $("#Date").val();
    var path = "/rnli/" + date + "/" + responseTime + "/" + location + "/" + issue + "/" + comment;

    doRequest(apiUrl + path, "POST");

};

/**
 * Renders the UI for the given question
 * @param {Object} question - The question object returned from the cloudant db
 */
var renderQuestion = function(question) {
    $.Mustache.load('./templates.mustache')
        .done(function() {
            $('#content').html($.Mustache.render('question', question));
            $('#responses').html($.Mustache.render('responses', question));
            $('#audioDiv').html($.Mustache.render('audio', question));
            $('#responses div').each(function() {
                if ($(this).attr("score") != "0") {
                    //If the response has a non-zero score, highlight it as red for colour coding of fields
                    //This should make it easier to identify
                    $(this).find("a").addClass("btn-danger");
                } else {
                    $(this).find("a").addClass("btn-success");
                }
                $(this).click(function() { //attach click events to the rendered buttons
                    score += $(this).attr("score");
                    var nextID = $(this).attr("nextid");
                    if (nextID == "EVAL") { //If we have reached the end of the evaluation, render the result
                        doEvaluation();
                    } else if (nextID == "PATIENT_FORM") {
                        renderTemplate('patientData','patientDataSubmit');
                    } else {
                        renderQuestion(questions[nextID]);
                    }
                });
            });
        });
};


/**
 * Renders the UI for the for the patient data input form
 */
var renderTemplate = function(contentId, footerId) {
  $.Mustache.load('./templates.mustache')
    .done(function() {
      if (contentId) {
        $('#content').html($.Mustache.render(contentId));
      } else {
        $('#content').html("");
      }
      if (footerId) {
        $('#responses').html($.Mustache.render(footerId));
      } else {
        $('#responses').html("");
      }
    });
};


/**
 * Renders the menu to access category specific cards
 * @param {string} categoryID - The id of the category to render, if it has been selected. If null, categories will be rendered.
 */
var renderMenu = function(categoryID) {
    $.Mustache.load('./templates.mustache')
        .done(function() {
            var options = {};
            if (categoryID) { //If a category has been specified, get the sub-options to render
                for (var i in menuItems) {
                    var item = menuItems[i];
                    if (item.id == categoryID) {
                        options["menuItems"] = item.options;
                    }
                }
            } else { //otherwise menu
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

/**
 * Renders the result of the bick sick/little sick evaluation
 */
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
        });
};

/**
 * Renders the menu to access category specific cards
 * @param {string} targetUrl - target url for the http request
 * @param {string} method - method for the http request, EG POST, GET, PATCH
 * @param {function} callback - callback function to be called when the async request has completed
 */
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

/**
 * Processes the questions response from the database
 * @param {string} response - JSON string of the questions queried from the DB
 */
var processQuestions = function(response) {
    response = JSON.parse(response);
    for (var r in response) {
        var row = response[r];
        questions[row.id] = row;
    }
    showEval();
};

var showEval = function() {
  renderQuestion(questions["1"]);
};

/**
 * Processes the menu item response from the database
 * @param {string} response - JSON string of the menu items queried from the DB
 */
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
