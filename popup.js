// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

document.addEventListener('DOMContentLoaded', function() {
	var blocking;

	/*chrome.runtime.sendMessage({"blockingCheck": true }, function (response) {
		console.log("recieved response");
		blocking = response.isBlocking;
		console.log("response: " + response.blocking + " " + blocking);

		if (blocking) {
	        $("#blockingCheckbox").bootstrapToggle('on');
		} else {
			$("#blockingCheckbox").bootstrapToggle('off');
		}
	});*/

	chrome.storage.local.get('isBlocking', function (result) {
		blocking = result.isBlocking;

		if (typeof blocking == 'undefined' || blocking == false) {
			blocking = false;
			chrome.storage.local.set({"isBlocking": false });
			$("#blockingCheckbox").bootstrapToggle('off');
		} else {
			blocking = true;
			$("#blockingCheckbox").bootstrapToggle('on');
		}

		$("#blockingCheckbox").change(function(event) {
		    if (blocking) {
		        chrome.runtime.sendMessage({"blocking": false});
		        chrome.storage.local.set({"isBlocking": false });
		        blocking = false;
		    } else {
		        chrome.runtime.sendMessage({"blocking": true});
		        chrome.storage.local.set({"isBlocking": true });
		        blocking = true;
		    }
		});
	});

	// check the allow URL list each time the popup opens to ensure we've enabled the button if need be (based upon current URL)
	chrome.storage.local.get('allowUrlList', function (result) {
		allowList = result.allowUrlList;

		chrome.tabs.query({"active": true}, function (tab) {
			for (url in allowList) {
				if (url === tab[0].url) {
					$("#allowPage").addClass("btn-danger");
				}
			}
		});
	});

	// check the allow URL list each time the popup opens to ensure we've enabled the button if need be (based upon current URL)
	chrome.storage.local.get('allowDomainList', function (result) {
		allowList = result.allowDomainList;

		chrome.tabs.query({"active": true}, function (tab) {
			for (url in allowList) {
				if (url === parseURI(tab[0].url).host) {
					$("#allowDomain").addClass("btn-danger");
				}
			}
		});
	});

	$("#allowPage").on('click', function(event) {
		chrome.storage.local.get('allowUrlList', function (result) {
			allowList = result.list;
			
			
		});
	});

	$("#allowDomain").on('click', function(event) {

	});

	function showOptions() {
	  document.getElementById('options').style.visibility='hidden';
	}

	$(".dropdown-container").on('click', function(event){
	    //document.getElementById('options').style.visibility='visible';
	    $('.option-container').toggleClass('open');
	    $("#click-tag").toggleClass('down');
	});

	$('.carousel').carousel('pause')

});

function parseURI(url) {
  var match = url.match(/^((https|http)?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
  return match && {
    protocol: match[1],
    host: match[2],
    hostname: match[3],
    port: match[4],
    pathname: match[5],
    search: match[6],
    hash: match[7]
  }
} // end parse url