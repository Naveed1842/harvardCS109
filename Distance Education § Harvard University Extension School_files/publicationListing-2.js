/**
 * Javascript for Production List Page Distance Ed site Built for Harvard
 * Javascript for Production List Page Distance Ed site Built for Harvard
 * University Extension School Script relies on JQuery 1.4.2
 * Orig: 07 Feb 2011
 * Modify 2012-12-01, enclose all functions
 * Modify 2013-01-20, default to row look, change position of layout toggle
 */
var PREFPOST = "preferences.html";
var TITLE = "Publication";
// name displayed in submit button
var DEBUGGING = 0;
// 1 is yes, 0 is no
var HLCOLOR = "#D1E4EB";
// offering highlight color
var BOXSHADOW = "10px 10px 10px 10px #FAFAD2";
// box-shadow:
var CURRCOL = 0;
var TITLEWIDTH = 0;
var ISNAVBELOW = true;
// toggles the nav menu above & below course title,
// starts below
// global var for single col look
var CSSFILESINGLECOL = null;
// Start with single column (week row) look
var isSINGLECOL = true;
// start with block look
var pubListSingleColCookieName = "HarvardDCEPref-PubList-Rows";
// TEMPORARY for publicationListing style change
var STYLEDIR = "/styles/";
var PUBLISTSTYLEOLD = "screen-pubList1.css";
var PUBLISTSTYLENEW = "screen-pubList2.css";
// loads a style sheet into the DOM
var loadCSS = function(dir, filename) {
	// ensure old multi col CSS is loaded so it can be toggled on and off
	if (CSSFILESINGLECOL == null) {
		CSSFILESINGLECOL = document.createElement("link");
		CSSFILESINGLECOL.setAttribute("rel", "stylesheet");
		CSSFILESINGLECOL.setAttribute("type", "text/css");
		CSSFILESINGLECOL.setAttribute("href", dir + filename);
		document.getElementsByTagName("head")[0].appendChild(CSSFILESINGLECOL);
	}
};
// load and disable the new pub list look CSS to be ready to toggle
// This loads the old style sheet, it assumes the new one is loaded
// loadCSS(STYLEDIR, PUBLISTSTYLEOLD);
if (CSSFILESINGLECOL == null) {
	loadCSS(STYLEDIR, PUBLISTSTYLEOLD);
	$("link[href*=" + PUBLISTSTYLEOLD + "]").attr("disabled", true);
}
/*
 * Javascript: Error Handling From template version $Id: index.jsp,v 1.13
 * 2007-11-01 13:15:32 rsantos Exp $
 */
function FreakOut(message, url, line) {
	alert("There was an Error. Please report the following message to "
			+ "http://cm.dce.harvard.edu/forms/report.shtml: "
			+ "\n\n Error :" + message + ". \n URL: " + url + "\n Line " + line);
	return true;
}
window.onerror = FreakOut;
/* code to set when html finishes loading */
$(document).ready(
		function() {
			// enable the Production order toggle since javascript's enabled
			$('#content-sort').css({
				display : 'block'
			});
			$('#content-layout').css({
				display : 'block'
			});
			/*
			 * add "bell" class (bell icon from css) to course msg if contents
			 * exist
			 */
			if ($.trim($('#course-msg').html()).length > 0) {
				$("#course-msg").addClass("bell");
			}
			var prefSingleColLook = $.cookie(pubListSingleColCookieName);
			if (prefSingleColLook == null || prefSingleColLook == "true"
					|| prefSingleColLook == true) {
				// toggle single column from true to false
				isSINGLECOL = false;
				toggleLayout();
				//Sort pubs with week, to have all in newest first order
				// Because the weeks blocks start as newest first
				// But pubs within week div start in oldest first
				// For row view, pubs within week should also be newest first
				reversePubsInWeek(); 
			} else {
				// toggle single column to false to true
				isSINGLECOL = true;
				toggleLayout();
				// pubs in week block to match row view behavior
				reversePubsInWeek();
			}
			/*
			 * Code to connect the production offering items
			 */
			$(".list-publication").mouseover(function() {
				$(this).css("cursor", "pointer");
				$(this).css("background-color", HLCOLOR);
			});
			$(".list-publication").mouseout(function() {
				$(this).css("cursor", "default");
				$(this).css("background-color", "");
			});
			// To group section for mouse click
			$(".list-publication").click(function() {
				var prodId = $(this).children(".list-type").attr("id");
				if (typeof prefLaunch == 'function') {
					prefLaunch(prodId, "", "");
				}
			});
			/*
			 * LEGACY - backward compatability Code to connect the production
			 * offering items
			 */
			$("dd, dt").mouseover(function() {
				var $curr = $(this);
				// go to leading dt element
				if (!($curr.is("dt"))) {
					$curr = $curr.prevAll("dt:first");
				}
				// make sure the first dd block contains a production before
				// highlighting
				// if (($curr.next('dd').children('a')).length > 0){
				if (($curr.next('dd[id]')).length > 0) {
					$(this).css("cursor", "pointer");
					while ($curr.next().is("dd")) {
						$curr = $curr.next();
						$curr.css("background-color", HLCOLOR);
					}
				}
			});
			$("dd, dt").mouseout(
					function() {
						var $curr = $(this);
						$curr.css("cursor", "default");
						if (!($curr.is("dt"))) {
							// $curr = $curr.prev("dt");
							$curr = $curr.prevAll("dt:first");
						}
						// make sure the first dd block contains a production
						// before highlighting
						if (($curr.next('dd[id]')).length > 0) {
							$curr.css("background-color", "").children().css(
									"background-color", "");
							while ($curr.next().is("dd")) {
								$curr = $curr.next();
								$curr.css("background-color", "").children()
										.css("background-color", "");
							}
						}
					});
			// To group section for mouse click
			$("dd, dt").click(function() {
				var date;
				var title;
				var $curr = $(this);
				if (!($curr.is("dt"))) {
					$curr = $curr.prevAll("dt:first");
				}
				// set title
				date = $curr.text();
				// if the dd after the first dt has an id, it's an offering!
				// launch it
				if (($curr.next('dd[id]')).length > 0) {
					var prodID = $curr.next('dd').attr('id');
					title = TITLE; // used default title
					date = date.replace(/\s+/g, " ");
					// replace whitespace with space
					if (typeof prefLaunch == 'function') {
						prefLaunch(prodID, date, title);
					}
				}
			});
		});
// end on document load safety block
// Toggle order the Production weeks
// Uses JQuery 1.4.2
var toggleSort = function() {
	// reverse week divs
	$.fn.reverse = [].reverse;
	$('#content-listing .list-block').reverse().appendTo('#content-listing');
	if ($("#sortby").html() == "Put Oldest First") {
		$("#sortby").html("Put Newest First");
	} else {
		$("#sortby").html("Put Oldest First");
	}
	// match pubs in week block behavior with row view
	reversePubsInWeek();
	if (!isSINGLECOL) {
		// rearranged the div Row Buffers
		if (!oneOfThreeLooks()) {
			weeksInaRow(CURRCOL);
		}
	}
};
// Toggle between row and block layout
var toggleLayout = function() {
	// toggle layout
	if (isSINGLECOL) {
		isSINGLECOL = false;
		multiColLook();
		$("#altLayoutOption").html("week row");
	} else {
		isSINGLECOL = true;
		singleColLook();
		$("#altLayoutOption").html("week block");
	}
};
// Swap CSS files and disable listeners
// TEMPORARY for toggling pubListing look
var singleColLook = function() {
	// disable block look listener
	$(window).unbind("resize", oneOfThreeLooks);
	putNavExtraBelow();
	$("#content").css("width", "auto");
	// ensure old multi col CSS is loaded so it can be toggled on and off
	if (CSSFILESINGLECOL == null) {
		loadCSS(STYLEDIR, PUBLISTSTYLEOLD);
	}
	// disable block css, enable singleColCSS
	if ($("link[href*=" + PUBLISTSTYLENEW + "]").length > 0) {
		$("link[href*=" + PUBLISTSTYLENEW + "]").attr("disabled", false);
		$("link[href*=" + PUBLISTSTYLEOLD + "]").attr("disabled", true);
	} else {
		$("link[href*=" + PUBLISTSTYLEOLD + "]").attr("disabled", false);
	}
	// reverse day inside week divs, only if previously was in block look
	if (($("#sortby").html() == "Put Oldest First") && (!isSINGLECOL)) {
		reversePubsInWeek();
	}
	setCookiePubListLook(true, pubListSingleColCookieName, true);
	isSINGLECOL = true;
};

var reversePubsInWeek = function(){
	// reverse the week divs
	$.fn.reverse = [].reverse;
	$(".list-asset").each(function(index) {
		$(this).children("li").reverse().appendTo($(this));
	});
};

// To set or unset the pubListLook cookie
var setCookiePubListLook = function(isSave, cookieName, cookieValue) {
	if (!isSave) {
		// remove cookie
		var docdom = ((!(document.domain)) ? "localhost" : document.domain);
		$.cookie(cookieName, null, {
			expires : -1,
			path : '/',
			domain : docdom,
			secure : false
		});
	}
	if (isSave) {
		// set the cookie
		var docdom = ((!(document.domain)) ? "localhost" : document.domain);
		var date = new Date();
		date.setTime(date.getTime() + (100 * 3 * 24 * 60 * 60 * 1000));
		// works for server, not on localhost
		$.cookie(cookieName, cookieValue, {
			expires : date,
			path : '/',
			domain : docdom,
			secure : false
		});
	}
};
// Restore mulitColLook
var multiColLook = function() {
	// ensure old multi col CSS is loaded so it can be toggled on and off
	if (CSSFILESINGLECOL == null) {
		loadCSS(STYLEDIR, PUBLISTSTYLEOLD);
	}
	$("link[href*=" + PUBLISTSTYLEOLD + "]").attr("disabled", false);
	$("link[href*=" + PUBLISTSTYLENEW + "]").attr("disabled", true);
	// function for block look 1 - 2 - 3 columns
	$(window).resize(oneOfThreeLooks);
	oneOfThreeLooks;
	// reverse day inside week divs
	if ($("#sortby").html() == "Oldest First") {
		reversePubsInWeek();
	}
	setCookiePubListLook(true, pubListSingleColCookieName, false);
	isSINGLECOL = false;
};
// toggle for nav-extra div
var putNavExtraBelow = function() {
	if ($('#nav-extras').length == 1) {
		if ($('#course-title').length == 1) {
			$('#nav-extras').insertAfter('#course-title');
		}
		$('#nav-extras').css('float', 'none');
		$('#nav-extras').css('width', '100%');
		$('#nav-extras').css('left', '0px');
		ISNAVBELOW = true;
	}
};
var putNavExtraAbove = function() {
	if ($('#nav-extras').length == 1) {
		if ($('#course-title').length == 1) {
			$('#nav-extras').insertBefore('#course-title');
		}
		$('#nav-extras').css('float', 'right');
		$('#nav-extras').css('width', 'auto');
		$('#nav-extras').css('left', 'auto');
		ISNAVBELOW = false;
	}
};
// Gives the three looks based on window size
var oneOfThreeLooks = function() {
	var widthBuffer = 65;
	var defaultListBlock = 320;
	var navDiv = $("#nav-extras");
	var containerDiv = $("#content");
	var winWidth = $(window).width();
	var weekBlockWidth = $('.list-block').width() + widthBuffer;
	if (weekBlockWidth == widthBuffer) {
		// in case no items pub listing
		weekBlockWidth = defaultListBlock;
	}
	if (winWidth > 3 * (weekBlockWidth)) {
		if (CURRCOL == 3) {
			return false;
			// don't re-adjust
		}
		CURRCOL = 3;
		if ($('#content-sort').length == 1) {
			$("#content-sort").css('width', 'auto');
		}
		if (containerDiv.length > 0) {
			containerDiv.css('width', 3 * (weekBlockWidth) - 20);
		}
		if ((navDiv.length > 0) && (ISNAVBELOW)) {
			putNavExtraAbove();
		}
		weeksInaRow(3);
		return true;
		// Two column look
	} else if (winWidth > 2 * (weekBlockWidth)) {
		if (CURRCOL == 2) {
			return false;
			// don't re-adjust
		}
		CURRCOL = 2;
		if (containerDiv.length > 0) {
			containerDiv.css('width', 2 * (weekBlockWidth) - 20);
			// remove buffer width
		}
		if ((navDiv.length > 0) && (ISNAVBELOW)) {
			putNavExtraAbove();
		}
		if ($('#content-sort').length == 1) {
			$("#content-sort").css('width', 'auto');
		}
		weeksInaRow(2);
		return true;
		// One column look
	} else {
		if (CURRCOL == 1) {
			return false;
			// don't re-adjust
		}
		CURRCOL = 1;
		if (containerDiv.length > 0) {
			containerDiv.css('width', '520');
			// min size
		}
		if ((navDiv.length > 0) && (!(ISNAVBELOW))) {
			putNavExtraBelow();
		}
		if ($('#content-sort').length == 1) {
			$("#content-sort").css('width', '100%');
		}
		weeksInaRow(1);
		return true;
	}
};
// Lines up weeks in each row
// by setting the proper left margin
var weeksInaRow = function(colSize) {
	// collect all the week DIVs
	var weekArray = $('div[class^="list-block"]');
	// for IE7 and earlier, remove previous row buffer div
	$(".rowBuffer").remove();
	var width = window.innerWidth;
	// keep track of the current column
	var currCol = colSize - 1;
	// iterate through week divs and update left margin
	$.each(weekArray, function() {
		(currCol < colSize) ? currCol++ : currCol = 1;
		if (currCol == colSize) {
			// IE7 and earlier hack
			$(
					'<div class="rowBuffer" style="height:2px; width:' + width
							+ '; clear:both"></div>').insertBefore(this);
			// push nth element to new line
			$(this).css({
				'clear' : 'both',
				'margin-left' : '0em'
			});
		} else {
			// float next week on row
			$(this).css({
				'clear' : '',
				'float' : 'left'
			});
		}
	});
};
