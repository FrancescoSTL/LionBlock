// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// once the dom content has finished loading, lets start interacting with it
document.addEventListener('DOMContentLoaded', function () {
	var blocking;

	// get the isBlocking flag from storage to determine our app state
	chrome.storage.local.get('isBlocking', function (result) {
		// get the blocking flag from our returned memory object
		blocking = result.isBlocking;

		// if we're not blocking or blocking has not yet been set
		if (typeof blocking == 'undefined' || blocking == false) {
			// set our local blocking flag to false
			blocking = false;
			// set the storage blocking flag to false
			chrome.storage.local.set({
				"isBlocking": false
			});
			// turn off the slider
			$("#blockingCheckbox").bootstrapToggle('off');
			// remove the spinner next to our total ads blocked stat, if neccessary
			$("#blockedLabel").html("Total Ads Blocked: <span id=\"totalBlocked\"></span>");
		} else {
			// set the blocking flag to true
			blocking = true;
			// turn off the slider
			$("#blockingCheckbox").bootstrapToggle('on');
			// add the spinner next to our total ads blocked stat
			$("#blockedLabel").html("<i class=\"fa fa-spinner fa-pulse fa-fw\"></i>Total Ads Blocked: <span id=\"totalBlocked\"></span>");
		}

		// if the on/off slider is changed via click
		$("#blockingCheckbox").change(function (event) {
			// and we're currently supposed to be blocking
			if (blocking) {
				// let the backend know we want to stop blocking
				chrome.runtime.sendMessage({
					"blocking": false
				});
				// store that flag in memory
				chrome.storage.local.set({
					"isBlocking": false
				});
				// set that flag locally
				blocking = false;
				// remove the spinner from total ads blocked stat
				$("#blockedLabel").html("Total Ads Blocked: <span id=\"totalBlocked\"></span>");
			} else {
				// let the backend know we want to start blocking
				chrome.runtime.sendMessage({
					"blocking": true
				});
				// store that flag in memory
				chrome.storage.local.set({
					"isBlocking": true
				});
				// set that flag locally
				blocking = true;

				// if we're not currently supposed to be allowing for domain or page, we're blocking ads
				if (!$("#allowDomain").hasClass("btn-success") && !$("#allowPage").hasClass("btn-success"))
					// so add the spinner
					$("#blockedLabel").html("<i class=\"fa fa-spinner fa-pulse fa-fw\"></i>Total Ads Blocked: <span id=\"totalBlocked\"></span>");
			}
		});
	});

	/**
	 * @function getOverview
	 * 
	 * @description updates the UI with the total number of ads blocked, as noted in storage
	 * 
	 */
	function getOverview() {
		// get the adcount from storage
		chrome.storage.local.get('adCount', function (event) {
			// if we have an ad count, update it
			if (typeof event.adCount !== 'undefined')
				$("#totalBlocked").text(event.adCount);
			else
				// if not, set it to 0
				$("#totalBlocked").text("0");
		});
	}

	// check the total ad blocked 
	setInterval(getOverview, 1000);

	// every time there is a change in the storage recheck the ad count
	chrome.storage.onChanged.addListener(function (changes, namespace) {
		getOverview();
	});

	// check the allow URL list each time the popup opens to ensure we've enabled the button if need be (based upon current URL)
	chrome.storage.local.get('allowUrlList', function (result) {
		// if we've got a list of pages we want to allow
		if (result.allowUrlList) {
			// store it locally
			var allowList = result.allowUrlList;

			// get our active tab to check against
			chrome.tabs.query({
				"active": true
			}, function (tab) {
				// run through every page in our allow page list			
				for (url in allowList) {
					// if any element is the same page as the page we're active on
					if (allowList[url] == tab[0].url) {
						// then make the button green
						$("#allowPage").addClass("btn-success");
						// add the checkmark to it
						$("#allowPage").html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i> Allow Ads on Page");
						// and remove the spinner
						$("#blockedLabel").html("Total Ads Blocked: <span id=\"totalBlocked\"></span>");
					}
				}
			});
		}
	});

	// check the allow URL list each time the popup opens to ensure we've enabled the button if need be (based upon current URL)
	chrome.storage.local.get('allowDomainList', function (result) {
		// if we've got a list of domains we want to allow
		if (result.allowDomainList) {
			var allowList = result.allowDomainList;

			// get our active tab to check against
			chrome.tabs.query({
				"active": true
			}, function (tab) {
				// so long as we're not on a privliged page
				if (tab[0].url.substring(0, 8) !== "chrome://")
					// run through every page in our allow domain list
					for (url in allowList) {
						// if we've got a domain we're currently on and the element in our list isnt null
						if (allowList[url] !== null && tab[0].url)
							// and if any element is the same domain as the domain we're active on
							if (parseURI(allowList[url]).hostname == parseURI(tab[0].url).hostname) {
								// make the allow domain button green
								$("#allowDomain").addClass("btn-success");
								// add a checkmark to it
								$("#allowDomain").html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i> Allow Ads on Domain");
								// remove the spinner
								$("#blockedLabel").html("Total Ads Blocked: <span id=\"totalBlocked\"></span>");
								// disable the allowpage button
								$("#allowPage").addClass("disabled");
							}
					}
			});
		}
	});

	// if someone clicks on the allow ads on page button
	$("#allowPage").on('click', function (event) {
		// if the button is supposed to be disabled, don't process the click
		if ($("#allowPage").hasClass("disabled")) {
			return;
		}

		// get the url list
		chrome.storage.local.get('allowUrlList', function (result) {
			var allowUrlList;
			// initalize it locally depending upon whether it is null
			if (typeof result.allowUrlList != 'undefined') {
				allowUrlList = result.allowUrlList;
			} else {
				allowUrlList = [];
			}

			// get our active tab
			chrome.tabs.query({
				"active": true
			}, function (tab) {
				// if the active url is not privliged
				if (tab[0].url.substring(0, 9) !== "chrome://") {
					// set our index and flag for whether the url is currently allowed
					var isCurrAllowed = false;
					var allowedIndex = -1;

					// determine if the url is allowed and if so, what its index is
					for (url in allowUrlList) {
						if (allowUrlList[url] == tab[0].url) {
							isCurrAllowed = true;
							allowedIndex = url;
							break;
						}
					}

					// if it is allowed
					if (isCurrAllowed) {
						// nullify it
						allowUrlList[allowedIndex] = null;
						// update the list in storage
						chrome.storage.local.set({
							"allowUrlList": allowUrlList
						});
						// push that list to the backend for an update
						chrome.runtime.sendMessage({
							"allowUrlList": allowUrlList
						});
						// make the button white again
						$("#allowPage").removeClass("btn-success");
						// remove the checkmark
						$("#allowPage").text("Allow Ads on Page");
						// if we're blocking
						if (blocking) {
							// add the spinner
							$("#blockedLabel").html("<i class=\"fa fa-spinner fa-pulse fa-fw\"></i>Total Ads Blocked: <span id=\"totalBlocked\"></span>");
						}
						// and reload the page
						chrome.tabs.reload();
					} else {
						// if it isn't allowed, add it to our allow list
						allowUrlList.push(tab[0].url);
						// update in local storage and let the backend know with our update list
						chrome.storage.local.set({
							"allowUrlList": allowUrlList
						});
						chrome.runtime.sendMessage({
							"allowUrlList": allowUrlList
						});
						// make the button green
						$("#allowPage").addClass("btn-success");
						// add a checkmark
						$("#allowPage").html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i> Allow Ads on Page");
						// remove the spinner
						$("#blockedLabel").html("Total Ads Blocked: <span id=\"totalBlocked\"></span>");
						// and reload the page
						chrome.tabs.reload();

					}
				}
			});
		});

	});

	// if someone clicks on the allow ads on page button
	$("#allowDomain").on('click', function (event) {
		// get the url list
		chrome.storage.local.get('allowDomainList', function (result) {
			var is_null = true;

			// determine whether our list is full of null values or not
			for (value in result.allowDomainList) {
				if (result.allowDomainList[value] !== null) {
					is_null = false;
					break;
				}
			}

			var allowDomainList;

			// if we have a list that is defined and it isn't full of null values
			if (typeof result.allowDomainList != 'undefined' && !is_null) {
				// get it from storage
				allowDomainList = result.allowDomainList;

			} else {
				// if not, initialize it as a new array
				allowDomainList = [];
			}

			// get the domain list
			chrome.tabs.query({
				"active": true
			}, function (tab) {
				// if the active url is not privliged
				if (tab[0].url.substring(0, 9) !== "chrome://") {
					// set our index and flag for whether the url is currently allowed
					var isCurrAllowed = false;
					var allowedIndex = -1;

					// determine if the url is allowed and if so, what its index is
					for (url in allowDomainList) {
						if (allowDomainList[url] !== null && tab[0].url !== null)
							if (parseURI(allowDomainList[url]).hostname == parseURI(tab[0].url).hostname) {
								isCurrAllowed = true;
								allowedIndex = url;
								break;
							}
					}

					// if it is allowed
					if (isCurrAllowed) {
						// nullify it
						allowDomainList[allowedIndex] = null;
						// update the list in storage and push to the backend the updated list
						chrome.storage.local.set({
							"allowDomainList": allowDomainList
						});
						chrome.runtime.sendMessage({
							"allowDomainList": allowDomainList
						});
						// make the button white again
						$("#allowDomain").removeClass("btn-success");
						// remove the checkmark
						$("#allowDomain").text("Allow Ads on Domain");
						// if we're blocking and the allowpage button isn't clicked
						if (blocking && !$("#allowPage").hasClass("btn-success")) {
							// add the spinner because we know we're really blocking
							$("#blockedLabel").html("<i class=\"fa fa-spinner fa-pulse fa-fw\"></i>Total Ads Blocked: <span id=\"totalBlocked\"></span>");
						}
						// if the allowpage is currently disabled
						if ($("#allowPage").hasClass("disabled")) {
							// enable it
							$("#allowPage").removeClass("disabled");
						}
						// reload the tab
						chrome.tabs.reload();
					} else { // if the domain isn't allowed
						// now add it so that it is
						allowDomainList.push(tab[0].url);
						// update the domain list in storage and send it to the backend
						chrome.storage.local.set({
							"allowDomainList": allowDomainList
						});
						chrome.runtime.sendMessage({
							"allowDomainList": allowDomainList
						});
						// make the domain button green
						$("#allowDomain").addClass("btn-success");
						// add a checkmark
						$("#allowDomain").html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i> Allow Ads on Domain");
						// remove the spinner
						$("#blockedLabel").html("Total Ads Blocked: <span id=\"totalBlocked\"></span>");
						// make the allowpage button disabled
						$("#allowPage").addClass("disabled");

						// reload the page
						chrome.tabs.reload();
					}
				}
			});
		});
	});

	// closes the options dropdown and moves to the info section of the extension
	$(".left").on('click', function (event, handleCarousel) {
		if ($('.option-container').hasClass('open')) {
			$('.option-container').toggleClass('open');
			$("#click-tag").toggleClass('down');
		}
		$("#sceneSlider").carousel("prev");
	});

	// closes the team info dropdown and moves back to the main window of the extension
	$(".right").on('click', function (event, handleCarousel) {
		if ($('.teaminfo-container').hasClass('open')) {
			$('.teaminfo-container').toggleClass('open');
			$("#click-tag2").toggleClass('down');
		}
		$("#sceneSlider").carousel("next");
	});

	// opens/closes the options dropdown
	$(".dropdown-container").on('click', function (event) {
		$('.option-container').toggleClass('open');
		$("#click-tag").toggleClass('down');
	});

	// opens/closes the team info dropdown
	$(".infodropdown-container").on('click', function (event) {
		$('.teaminfo-container').toggleClass('open');
		$("#click-tag2").toggleClass('down');
	});

	// stops the carousel from moving
	$('.carousel').carousel('pause')

	/**
	 * @function parseURI
	 * 
	 * @param {String} url is the url to parse
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
	}
});