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