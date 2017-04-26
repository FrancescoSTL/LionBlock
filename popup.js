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
				$("#totalBlocked").text(event.adCount);
			else
				$("#totalBlocked").text("0");
			//console.log(event.adCount);
		});
	}
	

	// every time there is a change in the storage recheck the ad count
	chrome.storage.onChanged.addListener(function(changes, namespace) {

		chrome.storage.local.get('adCount', function(event){
		if (typeof event.adCount !== 'undefined')
			$("#totalBlocked").text(event.adCount);
		else
			$("#totalBlocked").text(0);
		//console.log(event.adCount);
		});
	});


	// check the allow URL list each time the popup opens to ensure we've enabled the button if need be (based upon current URL)
	chrome.storage.local.get('allowUrlList', function (result) {
		if (result.allowUrlList) {
			var allowList = result.allowUrlList;

			//console.log("allowUrlList: " + allowList);

			chrome.tabs.query({"active": true}, function (tab) {				
				for (url in allowList) {
					//console.log("checking " + tab[0].url + " and " + allowList[url]);
					if (allowList[url] == tab[0].url) {
						//console.log("page match " + allowList[url] + " " + tab[0].url);
						$("#allowPage").addClass("btn-success");
						$("#allowPage").html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i> Allow Ads on Page");
					} /*else {
						console.log("no page match " + allowList[url] + " " + tab[0].url);
					}*/
				}
			});
		}
	});

	// check the allow URL list each time the popup opens to ensure we've enabled the button if need be (based upon current URL)
	chrome.storage.local.get('allowDomainList', function (result) {
		if (result.allowDomainList) {
			var allowList = result.allowDomainList;

			//console.log("allowDomainList is: " + allowList);

			chrome.tabs.query({"active": true}, function (tab) {				
				for (url in allowList) {
					console.log("checking " + parseURI(tab[0].url).host + " and " + allowList[url]);
					if (allowList[url] !== null && tab[0].url)
						if (parseURI(allowList[url]).hostname == parseURI(tab[0].url).hostname) {
							//console.log("domain match " + parseURI(allowList[url]).hostname + " " + parseURI(tab[0].url).hostname);
							$("#allowDomain").addClass("btn-success");
							$("#allowDomain").html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i> Allow Ads on Domain");
							$("#allowPage").addClass("disabled");
							if($("#allowPage").hasClass("btn-success")) {
								$("#allowPage").removeClass("btn-success");
								$("#allowPage").text("Allow Ads on Page");
							}
						}/* else {
							console.log("no domain match " + parseURI(allowList[url]).hostname + " " + parseURI(tab[0].url).hostname);
						}*/
				}
			});
		}
	});

	$("#allowPage").on('click', function(event) {
		if ($("#allowPage").hasClass("disabled")) {
			return;
		}

		//console.log("clicked");
		chrome.storage.local.get('allowUrlList', function (result) {
			if (typeof result.allowUrlList != 'undefined') {
				var allowUrlList = result.allowUrlList;

				chrome.tabs.query({"active": true}, function (tab) {
					var isCurrAllowed = false;
					var allowedIndex = -1;
					console.log("LIST: ")
					for (url in allowUrlList) {
						console.log(allowUrlList[url]);
						if (allowUrlList[url] == tab[0].url) {
							isCurrAllowed = true;
							allowedIndex = url;
							break;
						}
					}
					console.log("--------");

					if (isCurrAllowed) {
						allowUrlList[allowedIndex] = null;
						chrome.storage.local.set({"allowUrlList": allowUrlList });
						chrome.runtime.sendMessage({"allowUrlList": allowUrlList });
						$("#allowPage").removeClass("btn-success");
						$("#allowPage").text("Allow Ads on Page");
						chrome.tabs.reload();
					} else {
						console.log("adding " + tab[0].url + " to list");
						allowUrlList.push(tab[0].url);
						chrome.storage.local.set({"allowUrlList": allowUrlList });
						chrome.runtime.sendMessage({"allowUrlList": allowUrlList });
						$("#allowPage").addClass("btn-success");
						$("#allowPage").html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i> Allow Ads on Page");
						chrome.tabs.reload();

					}
				});
			} else {
				var allowUrlList = [];

				chrome.tabs.query({"active": true}, function (tab) {
					var isCurrAllowed = false;
					var allowedIndex = -1;
					console.log("LIST: ")
					for (url in allowUrlList) {
						console.log(allowUrlList[url]);
						if (allowUrlList[url] == tab[0].url) {
							isCurrAllowed = true;
							allowedIndex = url;
							break;
						}
					}
					console.log("--------");

					if (isCurrAllowed) {
						allowUrlList[allowedIndex] = null;
						chrome.storage.local.set({"allowUrlList": allowUrlList });
						chrome.runtime.sendMessage({"allowUrlList": allowUrlList });
						$("#allowPage").removeClass("btn-success");
						$("#allowPage").text("Allow Ads on Page");
						chrome.tabs.reload();
					} else {
						console.log("adding " + tab[0].url + " to list");
						allowUrlList.push(tab[0].url);
						chrome.storage.local.set({"allowUrlList": allowUrlList });
						chrome.runtime.sendMessage({"allowUrlList": allowUrlList });
						$("#allowPage").addClass("btn-success");
						$("#allowPage").html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i> Allow Ads on Page");
						chrome.tabs.reload();

					}
				});
			}
		});

	});

	$("#allowDomain").on('click', function(event) {
		chrome.storage.local.get('allowDomainList', function (result) {
			var is_null = true;

			for(value in result.allowDomainList) {
				if (result.allowDomainList[value] !== null) {
					is_null = false;
					break;
				}
			}

			if (typeof result.allowDomainList != 'undefined' && !is_null) {
				var allowDomainList = result.allowDomainList;

				chrome.tabs.query({"active": true}, function (tab) {
					var isCurrAllowed = false;
					var allowedIndex = -1;
					for (url in allowDomainList) {
						if (allowDomainList[url] !== null && tab[0].url !== null)
							if (parseURI(allowDomainList[url]).hostname == parseURI(tab[0].url).hostname) {
								isCurrAllowed = true;
								allowedIndex = url;
								break;
							}
					}

					if (isCurrAllowed) {
						allowDomainList[allowedIndex] = null;
						chrome.storage.local.set({"allowDomainList": allowDomainList });
						chrome.runtime.sendMessage({"allowDomainList": allowDomainList });
						$("#allowDomain").removeClass("btn-success");
						$("#allowDomain").text("Allow Ads on Domain");
						if($("#allowPage").hasClass("disabled")) {
							$("#allowPage").removeClass("disabled");
						}
						chrome.tabs.reload();
					} else {
						console.log("adding " + tab[0].url + " to list");
						allowDomainList.push(tab[0].url);
						chrome.storage.local.set({"allowDomainList": allowDomainList });
						chrome.runtime.sendMessage({"allowDomainList": allowDomainList });
						$("#allowDomain").addClass("btn-success");
						$("#allowDomain").html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i> Allow Ads on Domain");
						$("#allowPage").addClass("disabled");

						chrome.tabs.reload();

					}
					console.log(allowDomainList);
				});
			} else {
				var allowDomainList = [];

				chrome.tabs.query({"active": true}, function (tab) {
					var isCurrAllowed = false;
					var allowedIndex = -1;
					for (url in allowDomainList) {
						console.log(allowDomainList[url] + " " + tab[0].url);
						if (parseURI(allowDomainList[url]).hostname == parseURI(tab[0].url).hostname) {
							isCurrAllowed = true;
							allowedIndex = url;
							break;
						}
					}

					if (isCurrAllowed) {
						allowDomainList[allowedIndex] = null;
						chrome.storage.local.set({"allowDomainList": allowDomainList });
						chrome.runtime.sendMessage({"allowDomainList": allowDomainList });
						$("#allowDomain").removeClass("btn-success");
						$("#allowDomain").text("Allow Ads on Domain");
						if($("#allowPage").hasClass("disabled")) {
							$("#allowPage").removeClass("disabled");
						}
						chrome.tabs.reload();
					} else {
						console.log("adding " + tab[0].url + " to list");
						allowDomainList.push(tab[0].url);
						chrome.storage.local.set({"allowDomainList": allowDomainList });
						chrome.runtime.sendMessage({"allowDomainList": allowDomainList });
						$("#allowDomain").addClass("btn-success");
						$("#allowDomain").html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i> Allow Ads on Domain");
						$("#allowPage").addClass("disabled");

						chrome.tabs.reload();

					}
					console.log(allowDomainList);
				});
			}
		});
	});

	// closes the options dropdown and moves to the info section of the extension
	$(".left").on('click', function(event, handleCarousel) {
		if ($('.option-container').hasClass('open')) {
			$('.option-container').toggleClass('open');
			$("#click-tag").toggleClass('down');
		}
		$("#sceneSlider").carousel("prev");
	});

	// closes the team info dropdown and moves back to the main window of the extension
	$(".right").on('click', function(event, handleCarousel) {
		if ($('.teaminfo-container').hasClass('open')) {
			$('.teaminfo-container').toggleClass('open');
			$("#click-tag2").toggleClass('down');
		}
		$("#sceneSlider").carousel("next");
	});

	// opens/closes the options dropdown
	$(".dropdown-container").on('click', function(event){
	    $('.option-container').toggleClass('open');
	    $("#click-tag").toggleClass('down');
	});

	// opens/closes the team info dropdown
	$(".infodropdown-container").on('click', function(event){
	    $('.teaminfo-container').toggleClass('open');
	    $("#click-tag2").toggleClass('down');
	});

	// stops the carousel from moving
	$('.carousel').carousel('pause')

	/**
	 * @function parseURI
	 * 
	 * @description Parses a URL into an object that describes said URL
	 * 
	 * @return {object} protocol | host | hostname | port | pathname | search | hash
	 */
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
