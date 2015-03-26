/**
 * preferences-2.js,
 * Modify Feb 15, 2012 to stop & start flashviewer
 * when colorbox loads & unloads to fix PDF
 * showing over colorbox.
 * Modify Dec 03, 2012  enclose all functions 
 *
 * Used by both production & live pages to set and retrieve viewing
 * preference cookies.
 *
 * Dependencies
 * -----
 * 	jquery<v>.js
 * 	jquery.cookie<v>.js
 * 	jquery.colorbox<v>.js
 * 	P[year-term-course].js (example: P2011-01-12070.js)
 */

var DEBUGGING = 0;
// 0 for false, 1 for true
var DEFAULT_MEDIA = 1;
// index to default media in PREFMAP
var DEFAULT_OPTS_KEY = "default";
//prodmedia[] index, maps to a subset choice from PREFMAP
var PRODID;
// global access
var COOKIE;
// global access
var LIVE = 0;
// 0 default for production, 1 for redirect launch, 2 for live page pref launch
var LINK;
// global used in live launch
// LAUNCHBUTTONTEXT replaces "title" parameter
var LAUNCHBUTTONTEXT = "Launch";
var LIVE_NOPREF = "Prefless";

/**
 * Javascript: Error Handling
 * @param {Object} message
 * @param {Object} url
 * @param {Object} line
 * @return {TypeName}
 */
function FreakOut(message, url, line) {
    alert("There was an Error.  Please report the" + " following message to http://cm.dce.harvard.edu/forms/report.shtml: " + "\n\n Error :" + message + ". \n URL: " + url + "\n Line " + line);
    return true;
}

window.onerror = FreakOut;


/**
 * colorBoxLaunch
 *
 * For uniform launching of the color box
 * preference options popup "window"
 *
 * @param {Object} prodId
 * @param {Object} date
 * @param {Object} title
 * @param {Object} live
 * @memberOf {TypeName}
 */

var colorBoxLaunch = function (prodId, date, title, live) {
    $('.colorbox').colorbox({
        href: "preferences.html",
        open: true,
        scrolling: false,
        
        // on open
        onOpen: function () {
            if (typeof disableResizeListener == 'function') {
                disableResizeListener();
            }
            // to fix PDF showing over colorbox problem
            if (typeof popupPauseVideo == 'function') {
                popupPauseVideo();
            }
        },
        // on Complete
        onComplete: function () {
            if ((live != null) && !(isNaN(live))) {
                LIVE = live;
            }
            PRODID = prodId;
            displayProdOptions(prodId, date, title);
            prefFormPrep();
            $(this).colorbox.resize();
        },
        
        // on Close re-enable resize listener
        onClosed: function () {
            if (typeof enableResizeListener == 'function') {
                enableResizeListener();
            }
            // to fix PDF showing over colorbox problem
            if (typeof popupPlayVideo == 'function') {
                popupPlayVideo();
            }
        }
    });
};

/**
 * prefFormPrep
 *
 * Get current cookie on load, set pref checked to current cookie
 * Test if Product is set, cross reference on available products
 *
 * @return {TypeName}
 */
var prefFormPrep = function () {
    jQuery(function () {
        var cookie;
        cookie = getCookie();
        
        if (DEBUGGING) {
            alert("In prefFormPrep, the cookie value = " + cookie);
        }
        // If there is an existing preference, set the radio button
        if (cookie == null) {
            $("#no-cookie").hide();
            $("#cookie").show();
        } else {
            $("#no-cookie").show();
            $("#cookie").hide();
        }
    });
    
    /* Set the preference cookie if save checked
     * Includes an IE submit fix from jQuery
     * http://api.jquery.com/submit/  *///prefsForm
    $('#prefsForm').submit(function (event) {
        
        // stop default behavior
        event.preventDefault();
        // get relevant settings
        var pref = $("input[name*='video-type']:checked").val();
        var save = $("#remember-me").attr("checked");
        
        // call the class that saves the prefs
        submitting(pref, save, PRODID);
        
        // close the color box
        $.fn.colorbox.close();
        
        // if have a production id
        // Launch Offering
        if (PRODID && pref) {
            var index = cookieToIndex(pref);
            var size = prodSize[PRODID]; // get the switch indicating ~16x9 or ~13x5
            var fileName = prodFileName[size][index]; // table to return the html name
            
            if (LIVE == 1)
            GoToUrl(LINK, pref); else
            productLaunch(PRODID, fileName);
        }
        return false;
    });
};

/**
 * submitting
 * Save or un-save current cookie
 *
 * @param {Object} pref
 * @param {Object} save
 * @param {Object} prod
 */
var submitting = function (pref, save, prod) {
    //DEBUG
    if (DEBUGGING) {
        alert('In submit Pref: ' + pref + ', save?:' + $('#remember-me').attr('checked'));
    }
    
    // if no product id and save not checked, remove cookie
    if (! save && ! prod) {
        // remove cookie
        var docdom = ((!(document.domain)) ? "localhost": document.domain);
        // only  if have a COOKIENAME
        if (typeof COOKIENAME != 'undefined') {
            $.cookie(COOKIENAME, null, {
                expires: -1,
                path: '/',
                domain: docdom,
                secure: false
            });
        }
    }
    
    // Save Preference
    if (save) {
        //DEBUG
        if (DEBUGGING) {
            alert('In saving pref: ' + pref);
        }
        // set the cookie
        var docdom = ((!(document.domain)) ? "localhost": document.domain);
        var date = new Date();
        date.setTime(date.getTime() + (100 * 3 * 24 * 60 * 60 * 1000));
        
        // only if have COOKIENAME
        if (typeof COOKIENAME != 'undefined') {
            // works for server, not on localhost
            $.cookie(COOKIENAME, pref, {
                expires: date,
                path: '/',
                domain: docdom,
                secure: false
            });
        }
    }
};

/**
 * prefLiveLaunch
 * This switch is used by classroom.dce to set the path
 * and bypass the prefs popup (intercepted by offering classrom page)
 *
 * @param {Object} link
 * @param {Object} prodId
 * @param {Object} date
 * @param {Object} title
 * @param {Object} pref
 */
var prefLiveLaunch = function (link, prodId, date, title, pref) {
    LIVE = 1;
    LINK = link;
    //set the course specific path to it's own classroom.shtml
    PRODID = prodId;
    // prefLaunch(PRODID, date, title, pref); //causes pref intercept
    GoToUrl(link, LIVE_NOPREF);
    // launches liveClassroom.shtml withough pref intercept
};

/**
 * prefLiveCourseLaunch
 * This switch is used by liveClassroom in the course folder
 * to set the flow with LIVE = 2
 *
 * Param example ("L01", "seg-1", "L01^seg-1", "05:00 US EST", "Lecture")
 *
 * @param {Object} link
 * @param {Object} prodId
 * @param {Object} date
 * @param {Object} title
 * @param {Object} pref
 */
var prefLiveCourseLaunch = function prefLiveCourseLaunch(link, prodId, date, title, pref) {
    LIVE = 2;
    LINK = link;
    //set the course specific path to it's own classroom.shtml
    if (pref == LIVE_NOPREF)
    pref = null;
    PRODID = prodId;
    prefLaunch(PRODID, date, title, pref);
};

/**
 * prefLaunch
 *
 * Used to branch between launching the media choice
 * or openning the preference popup
 *
 * Called from DD class="list-type" of list.html
 * Called by the live launch
 * Requires input value of id from dd class="list-type"
 * 1. If only one option, launch it regardless of pref/cookie
 * 2. If no pref, just launch default index.html for the product offering
 * 3. otherwise,
 * - confirm cookie is a current pref enum match
 * - test the pref against media available for the prodId
 *
 * @param {Object} prodId
 * @param {Object} date
 * @param {Object} title
 * @param {Object} pref
 * @memberOf {TypeName}
 * @return {TypeName}
 */
var prefLaunch = function (prodId, date, title, pref) {
    if (pref == null)
    pref = getCookie();
    PRODID = prodId;
    
    // confirm offering is in the prodMedia table
    // If not, this is an error
    if (!(prodMedia[prodId])) {
        alert("Error: media offerings for " + prodId + " can not be found.");
        return false;
    }
    
    // 1. Test if just one media, launch it
    if (prodMedia[prodId].length == 1) {
        var mediaNum = prodMedia[prodId][0];
        // get the single media type index
        var size = prodSize[prodId];
        // get the switch indicating ~16x9 or ~13x5
        var fileName = prodFileName[size][mediaNum];
        // table to return the html name
        
        //Get unique URL prefix for the different media (different testing URLS)
        productLaunch(prodId, fileName);
        return false;
    }
    
    // 2. test if cookie is set,if not go to index page
    if (! pref) {
        if (DEBUGGING) {
            alert('No cookie found, launching preference page for this poduct: ' + prodId);
        }
        // pass the product num
        colorBoxLaunch(prodId, date, title);
        return false;
    }
    
    // 3. ELSE Test Cookie for exact, equivalent, or near match
    var target = findClosestTarget(pref, prodId);
    
    if (target) {
        prepAndProductLaunch(target, prodId);
        return false;
    }
    // ELSE DEFAULT! load the available preferences
    // the catch all is to go to default media page
    colorBoxLaunch(prodId, date, title);
    return false;
};

/* Find closest format to launch */
var findClosestTarget = function (pref, prodId) {
    var num = cookieToIndex(pref);
    var target;
    
    // 3.1 Test if exact format to cookie match
    jQuery.each(prodMedia[prodId], function () {
        if (this == num)
        target = this;
    });
    if (target)
    return target;
    
    // 3.2 ELSE Test if equivalent format to cookie match
    jQuery.each(prodMedia[prodId], function () {
        if (indexToEquiv(this) == indexToEquiv(num))
        target = this;
    });
    if (target)
    return target;
    
    // 3.3 ELSE Test if near match to cookie
    jQuery.each(prodMedia[prodId], function () {
        if (this > num)
        target = this;
    });
    
    return target;
};

/**
 * prepAndProductLaunch
 *
 * Assembles file name to launch
 *
 * @param {Object} num
 * @param {Object} prodId
 * @return {TypeName}
 */
var prepAndProductLaunch = function (num, prodId) {
    if (LIVE == 1) {
        GoToUrl(LINK);
        return false;
    }
    
    var size = prodSize[prodId];
    // get the switch indicating ~16x9 or ~13x5
    var fileName = prodFileName[size][num];
    // table to return the html name
    
    // append the single options and launch
    productLaunch(prodId, fileName);
    return false;
};

/**
 * displayProdOptions
 *
 * To set the options to those available
 * On the preferences radio buttons
 *
 * @param {Object} prodId
 * @param {Object} date
 * @param {Object} title
 * @memberOf {TypeName}
 * @return {TypeName}
 */
var displayProdOptions = function (prodId, date, title) {
    
    // get the default view
    var defaultOptionDL;
    defaultOptionDL = defaultModes();
    if (defaultOptionDL == "") {
        // if default mode missing from PREFMAP[]
        defaultOption = "<dt>No options found (missing preference option table).</dt>";
    }
    $("div#preferences-types").prepend("<dl>" + defaultOptionDL + "</dl>");
    
    if (! prodId) {
        if (DEBUGGING) {
            alert('No Product Id passed: ' + prodId);
        }
        // customize to subset default options if "default" exists in prod table
        displayDefaultOptions();
        prefTextDisplay(0);
        return true;
    }
    
    // save production id in global var
    PRODID = prodId;
    
    // make sure offing has an available media table entry
    if (!(prodMedia[prodId])) {
        alert("Error: offerings for " + prodId + " can not be found.");
        return false;
    }
    if (DEBUGGING) {
        alert("Debug - Loading preferences for offering: " + prodId);
    }
    
    // change button text
    // $("#pref-submit").val("Launch " + date + " " + title + " ");
    $("#pref-submit").val(LAUNCHBUTTONTEXT);
    $("#preferences-desc h5").text("Available Formats");
    
    // iterate through matches to product offerings to put options back into html
    var len = prodMedia[prodId].length;
    
    // get the array of avaiable options names
    var holder =[];
    // for IE try putting directly in the empty dl
    $("div#preferences-types").prepend('<dl></dl>');
    
    var inputSet = $("div#preferences-types dl").eq(1).find(
    "input[name=video-type]");
    var dtSet = $("div#preferences-types dl").eq(1).find("dt");
    var ddSet = $("div#preferences-types dl").eq(1).find("dd");
    // alert($("div#preferences-types").html());
    
    inputSet.each(function () {
        for (var i = 0; i < len; i++) {
            var medName = indexToCookie(prodMedia[prodId][i]);
            //DEBUG
            if ($(this).val() == medName) {
                var index = inputSet.index($(this));
                //'input[value=' + medName + ']').index();
                $("div#preferences-types dl").eq(0).append(dtSet.eq(index));
                $("div#preferences-types dl").eq(0).append(ddSet.eq(index));
            }
        }
    });
    if (DEBUGGING) {
        alert("Before DL remove: " + $("div#preferences-types").html());
    }
    // remove original dl
    $("div#preferences-types dl").eq(1).remove();
    // diplay context text, 1 == production launch
    prefTextDisplay(1);
    // slide down the option display
    $("div#preferences-types dl").slideDown();
};

/**
 * displayDefaultOptions
 *
 * To set the options to those available
 * On the preferences radio buttons
 *
 */
var displayDefaultOptions = function () {
    
    // make sure offing has an available media table entry
    if (!(prodMedia[DEFAULT_OPTS_KEY])) {
        // just show all from prod table
        return false;
    }
    
    // else customize default options
    // iterate through matches to product offerings to put options back into html
    var len = prodMedia[DEFAULT_OPTS_KEY].length;
    
    // get the array of avaiable options names
    var holder =[];
    // for IE try putting directly in the empty dl
    $("div#preferences-types").prepend('<dl></dl>');
    
    var inputSet = $("div#preferences-types dl").eq(1).find(
    "input[name=video-type]");
    var dtSet = $("div#preferences-types dl").eq(1).find("dt");
    var ddSet = $("div#preferences-types dl").eq(1).find("dd");
    
    inputSet.each(function () {
        for (var i = 0; i < len; i++) {
            var medName = indexToCookie(prodMedia[DEFAULT_OPTS_KEY][i]);
            //DEBUG
            if ($(this).val() == medName) {
                var index = inputSet.index($(this));
                $("div#preferences-types dl").eq(0).append(dtSet.eq(index));
                $("div#preferences-types dl").eq(0).append(ddSet.eq(index));
            }
        }
    });
    // remove original dl
    $("div#preferences-types dl").eq(1).remove();
    
    // slide down the option display
    $("div#preferences-types dl").slideDown();
};

/**
 * prefTextDisplay
 *
 * This sets the proper <p> text narration to
 * display to the user for the context
 * 		preference select: context = 0
 * 		production launch: context = 1
 * <p id="ptext-pref-no-cookie">
 * <p id="ptext-pref-cookie">
 * <p id="ptext-launch-no-cookie">
 * <p id="ptext-launch-cookie">
 * <span class="cookiePref" />
 *
 * @param {Object} context
 * @memberOf {TypeName}
 * @return {TypeName}
 */
var prefTextDisplay = function (context) {
    // hide all text
    $('p[id^="ptext"]').hide();
    var cook = getCookie();
    if (context == 0) {
        // show checked check box
        $("div#preferences-checkbox").show();
        $("#remember-me").attr('checked', true);
        // If there is an existing preference, set the radio button
        //alert("cookie: " + cook);
        if (cook != null) {
            $("#ptext-pref-cookie").show();
            $(".cookiePref").html(cookToName(cook));
            $("input[value*=" + cook + "]").attr('checked', 'checked');
            $("input[value*=" + cook + "]").attr('defaultChecked',
            'defaultChecked');
        } else {
            $("#ptext-pref-no-cookie").show();
        }
        // Its a launch production context
    } else {
        if (cook != null) {
            //show cookie
            $(".cookiePref").html(cookToName(cook));
            $("input[value*=" + cook + "]").attr('checked', 'checked');
            // if in production page, show change media message
            if (PRODID != null) {
                //alert("PRODID: " + PRODID);
                //test if matching mode
                var matchMode = false;
                var num = cookieToIndex(cook);
                jQuery.each(prodMedia[PRODID], function () {
                    if (indexToEquiv(this) == indexToEquiv(num)) {
                        matchMode = true;
                    }
                });
                if (matchMode) {
                    if ($("#ptext-pref-cookie-presentation").length == 1) {
                        $("#ptext-pref-cookie-presentation").show();
                    } else {
                        $("#ptext-pref-cookie").show();
                    }
                    $(".cookiePref").html(cookToName(cook));
                    $("input[value*=" + cook + "]").attr('checked', 'checked');
                    $("input[value*=" + cook + "]").attr('defaultChecked',
                    'defaultChecked');
                    $("div#preferences-checkbox").show();
                    $("#remember-me").removeAttr('checked');
                } else {
                    // no match for the cookie
                    $("#ptext-launch-cookie").show();
                    // hide checked box
                    $("div#preferences-checkbox").hide();
                    $("#remember-me").removeAttr('checked');
                }
            } else {
                // no match for the cookie
                $("#ptext-launch-cookie").show();
                // hide checked box
                $("div#preferences-checkbox").hide();
                $("#remember-me").removeAttr('checked');
            }
        } else {
            // show no cookie text
            $("#ptext-pref-no-cookie").show();
        }
    }
    // if no view option is selected, check default
    if ($("#preferences-types input[@name=video-type]:checked").length == 0) {
        // class name of default is default dt -> input see offeringPrefs.js
        $(".pref-default input").attr("checked", "checked");
    }
    return false;
};

/**
 *  productLaunch
 *
 * Builds the correct URL with page name
 *
 * @param {Object} prodId
 * @param {Object} page
 * @return {TypeName}
 */
var productLaunch = function (prodId, page) {
    
    var newURL;
    // = page;
    var i = 0;
    var done = 0;
    
    while (! done) {
        if (DEBUGGING) {
            alert("ProdId = " + prodId + ", Page=" + page);
        }
        
        if (page) {
            // var LINK & SET are defined on course specific JavaScript
            // newURL = prefixLink + prodId + SEG + page;
            if ((prodId == "live") || (LIVE > 0)) {
                newURL = LINK + page;
            } else {
                newURL = LINK + prodId + SEG + page;
            }
            
            if (DEBUGGING) {
                alert("newURL=" + newURL);
            }
            done = 1;
        }
        i++;
        //This should never evalute to true because one radio button should
        //always be selected.  But to be safe, prevent infinite while loop
        if (! done) { //} && i > document.SelectLectureAndSpeedForm.ConnectionSpeedRadioButtons.length){
            alert("You must select a connection speed");
            done = 1;
            return;
        }
    }
    
    GoToUrl(newURL);
    // close the color box if there (not there if called from index.shtml)
    if ($.fn.colorbox) {
        $.fn.colorbox.close();
    }
    return false;
};

/**
 *  GoToUrl
 *
 * Assembles any required URL params (live pages)
 * Launches url
 *
 * @param {Object} Url
 * @param {Object} pref
 */
var GoToUrl = function (Url, pref) {
    // live classroom path
    if ((LIVE == 1) && (pref != "course")) {
        //var escUrl = escape(Url);
        //Url = "liveRedirect.html?path=" + escUrl;
        if (pref != null)
        Url = Url + ";mode=" + pref; else if (COOKIE != null)
        Url = Url + ";mode=" + COOKIE; else {
            Url = Url + ";mode=" + indexToCookie(DEFAULT_MEDIA);
            //sends request for default mode
        }
    };
    var args = 'top=1,left=1,resizable=1,scrollbars=1,status=1,' + ',toolbar=1,menubar=1,location=1' + ',width=530,height=600';
    
    var videoWindowName = (typeof courseCrn == 'undefined') ? "HarvardVideo": "HarvardVideo" + courseCrn;
    // open it!
    var videoWindow = window.open(Url, videoWindowName, args);
    // give it focus ( in case videoWindowName != the launching window name)
    if (videoWindow != null) {
        videoWindow.focus();
    }
};

/**
 * getCookie
 * verifies if COOKIENAME var set in
 * parent HTML
 * sets the global VAR for this environment
 * @return {TypeName}
 */
var getCookie = function () {
    if (typeof COOKIENAME != 'undefined') {
        COOKIE = $.cookie(COOKIENAME);
    } else {
        COOKIE = null;
    }
    return COOKIE;
};

/*
//If need to encose entire area for Jquery scope,
// can use the following to build a Preference object
// it requires changing all references to these.

return {

colorBoxLaunch: colorBoxLaunch,
prefFormPrep: prefFormPrep,
submitting: submitting,
prefLiveLaunch: prefLiveLaunch,
prefLiveCourseLaunch: prefLiveCourseLaunch,
prefLaunch: prefLaunch,
findClosestTarget: findClosestTarget,
prepAndProductLaunch: prepAndProductLaunch,
displayProdOptions: displayProdOptions,
displayDefaultOptions: displayDefaultOptions,
prefTextDisplay: prefTextDisplay,
productLaunch: productLaunch,
GoToUrl: GoToUrl,
getCookie: getCookie
};
 */
