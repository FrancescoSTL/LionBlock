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

	// check ad count 
	/*chrome.storage.local.get('adCount', function (result) {

		if (result.adCount)
			console.log(result.adCount);
	})*/

	// check the total ad blocked 
	setInterval(getOverview, 1000);

	function getOverview() {
		chrome.storage.local.get('adCount', function(event){
			if (typeof event.adCount !== 'undefined')
				$("#totalBlocked").text("Total Blocked: " + event.adCount );
			else
				$("#totalBlocked").text("Total Blocked: " + 0 );
			console.log(event.adCount);
		});
	}
	

	// every time there is a change in the storage recheck the ad count
	chrome.storage.onChanged.addListener(function(changes, namespace) {

		chrome.storage.local.get('adCount', function(event){
		if (typeof event.adCount !== 'undefined')
			$("#totalBlocked").text("Total Blocked: " + event.adCount );
		else
			$("#totalBlocked").text("Total Blocked: " + 0 );
		console.log(event.adCount);
		});
	});


	// check the allow URL list each time the popup opens to ensure we've enabled the button if need be (based upon current URL)
	chrome.storage.local.get('allowUrlList', function (result) {
		if (result.allowUrlList) {
			var allowList = result.allowUrlList;

			console.log("allowUrlList: " + allowList);

			chrome.tabs.query({"active": true}, function (tab) {				
				for (url in allowList) {
					//console.log("checking " + tab[0].url + " and " + allowList[url]);
					if (allowList[url] == tab[0].url) {
						console.log("page match " + allowList[url] + " " + tab[0].url);
						$("#allowPage").addClass("btn-danger");
					} else {
						console.log("no page match " + allowList[url] + " " + tab[0].url);
					}
				}
			});
		}
	});

	// check the allow URL list each time the popup opens to ensure we've enabled the button if need be (based upon current URL)
	chrome.storage.local.get('allowDomainList', function (result) {
		if (result.allowDomainList) {
			var allowList = result.allowDomainList;

			console.log("allowDomainList is: " + allowList);

			chrome.tabs.query({"active": true}, function (tab) {				
				for (url in allowList) {
					//console.log("checking " + parseURI(tab[0].url).host + " and " + allowList[url]);
					if (parseURI(allowList[url]).hostname == parseURI(tab[0].url).hostname) {
						console.log("domain match " + parseURI(allowList[url]).hostname + " " + parseURI(tab[0].url).hostname);
						$("#allowDomain").addClass("btn-danger");
					} else {
						console.log("no domain match " + parseURI(allowList[url]).hostname + " " + parseURI(tab[0].url).hostname);
					}
				}
			});
		}
	});

	$("#allowPage").on('click', function(event) {
		console.log("clicked");
		chrome.storage.local.get('allowUrlList', function (result) {
			if (typeof result.allowUrlList != 'undefined') {
				var allowUrlList = result.allowUrlList;

				chrome.tabs.query({"active": true}, function (tab) {
					var isCurrAllowed = false;
					var allowedIndex = -1;
					for (url in allowUrlList) {
						if (allowUrlList[url] == tab[0].url) {
							isCurrAllowed = true;
							allowedIndex = url;
							break;
						}
					}

					if (isCurrAllowed) {
						allowUrlList[allowedIndex] = null;
						chrome.storage.local.set({"allowUrlList": allowUrlList });
						chrome.runtime.sendMessage({"allowUrlList": allowUrlList });
						$("#allowPage").removeClass("btn-danger");
						chrome.tabs.reload();
					} else {
						console.log("adding " + tab[0].url + " to list");
						allowUrlList.push(tab[0].url);
						chrome.storage.local.set({"allowUrlList": allowUrlList });
						chrome.runtime.sendMessage({"allowUrlList": allowUrlList });
						$("#allowPage").addClass("btn-danger");
						chrome.tabs.reload();

					}
				});
			} else {
				var allowUrlList = [];

				chrome.tabs.query({"active": true}, function (tab) {
					var isCurrAllowed = false;
					var allowedIndex = -1;
					for (url in allowUrlList) {
						if (allowUrlList[url] == tab[0].url) {
							isCurrAllowed = true;
							allowedIndex = url;
							break;
						}
					}

					if (isCurrAllowed) {
						allowUrlList[allowedIndex] = null;
						chrome.storage.local.set({"allowUrlList": allowUrlList });
						chrome.runtime.sendMessage({"allowUrlList": allowUrlList });
						$("#allowPage").removeClass("btn-danger");
						chrome.tabs.reload();
					} else {
						console.log("adding " + tab[0].url + " to list");
						allowUrlList.push(tab[0].url);
						chrome.storage.local.set({"allowUrlList": allowUrlList });
						chrome.runtime.sendMessage({"allowUrlList": allowUrlList });
						$("#allowPage").addClass("btn-danger");
						chrome.tabs.reload();

					}
				});
			}
		});

	});

	$("#allowDomain").on('click', function(event) {
		chrome.storage.local.get('allowDomainList', function (result) {
			if (typeof result.allowDomainList != 'undefined') {
				var allowDomainList = result.allowDomainList;

				chrome.tabs.query({"active": true}, function (tab) {
					var isCurrAllowed = false;
					var allowedIndex = -1;
					for (url in allowDomainList) {
						if (allowDomainList[url] == tab[0].url) {
							isCurrAllowed = true;
							allowedIndex = url;
							break;
						}
					}

					if (isCurrAllowed) {
						allowDomainList[allowedIndex] = null;
						chrome.storage.local.set({"allowDomainList": allowDomainList });
						chrome.runtime.sendMessage({"allowDomainList": allowDomainList });
						$("#allowDomain").removeClass("btn-danger");
						chrome.tabs.reload();
					} else {
						console.log("adding " + tab[0].url + " to list");
						allowDomainList.push(tab[0].url);
						chrome.storage.local.set({"allowDomainList": allowDomainList });
						chrome.runtime.sendMessage({"allowDomainList": allowDomainList });
						$("#allowDomain").addClass("btn-danger");
						chrome.tabs.reload();

					}
				});
			} else {
				var allowDomainList = [];

				chrome.tabs.query({"active": true}, function (tab) {
					var isCurrAllowed = false;
					var allowedIndex = -1;
					for (url in allowDomainList) {
						if (allowDomainList[url] == tab[0].url) {
							isCurrAllowed = true;
							allowedIndex = url;
							break;
						}
					}

					if (isCurrAllowed) {
						allowDomainList[allowedIndex] = null;
						chrome.storage.local.set({"allowDomainList": allowDomainList });
						chrome.runtime.sendMessage({"allowDomainList": allowDomainList });
						$("#allowDomain").removeClass("btn-danger");
						chrome.tabs.reload();
					} else {
						console.log("adding " + tab[0].url + " to list");
						allowDomainList.push(tab[0].url);
						chrome.storage.local.set({"allowDomainList": allowDomainList });
						chrome.runtime.sendMessage({"allowDomainList": allowDomainList });
						$("#allowDomain").addClass("btn-danger");
						chrome.tabs.reload();

					}
				});
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

});
