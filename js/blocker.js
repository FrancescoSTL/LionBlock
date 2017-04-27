// Set of the hostnames that are going to be blocked
var adsBlocked = 0; // ads blocked counter
var blocklistSet = new Set(); // set that holds our block list
var currentTabURLs = {}; // url on tabs currently opened
const disconnectJSON = require('../data/disconnect.json');  // require disconnect.json
const disconnectEntitylist = require('../data/disconnectEntitylist.json');  // require entity list
var {
  allHosts,
  canonicalizeHost
} = require('../js/canonicalize.js');  // require aditional modules
var blocking = false;  // set default blocker behavior
var allowUrlList = [];  // initialize array of allowed urls
var allowDomainList = []; // initialize array of allowed domains

// parse our disconnect.json object
parseJSON();
// conection with the front end of the extension
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    // if we've got a blocking command
    if (typeof request.blocking !== 'undefined') {
      // note that we'd like to toggle blocking
      if (blocking) {
        blocking = false;
      } else {
        blocking = true;
      }
    } else if (typeof request.blockingCheck !== 'undefined') {
      // send blocking status back to the front end
      sendResponse({
        "isBlocking": blocking
      });
    } else if (typeof request.allowDomainList !== 'undefined') {
      // get the allowDomainList from the front end
      allowDomainList = request.allowDomainList;
    } else if (typeof request.allowUrlList !== 'undefined') {
      // get the allowUrlList from the front end
      allowUrlList = request.allowUrlList;
    }
  }
);

// intercept requests from all  urls
chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
  if (blocking) {
    var areWeCancelling = false; // boolean checking blocking status

    if (isAd(details)) {
      areWeCancelling = true;
      adsBlocked += 1; // update total ads blocked
      chrome.storage.local.set({
        "adCount": adsBlocked
      });
    }

    // return state of the blocking
    return {
      cancel: areWeCancelling
    };
  }
  // we do not block at all
  return;
}, {
  urls: ["<all_urls>"]
}, ["blocking", "requestHeaders"]);

// if the url of a tab has changed, update the tab's information in our tabs set
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  currentTabURLs[tabId] = tab.url;
});
// if a tab has been replaced, add that id to our tabs set
chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
  chrome.tabs.get(addedTabId, function (tab) {
    currentTabURLs[addedTabId] = tab.url;
  });
});
// if a tab has been removed, nullify it on our tabs set
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  currentTabURLs[tabId] = null;
});

/**
 * @function isAd
 * 
 * @param {object} details from the header that has been intercepted
 * 
 * @description describes if the intercepted request is an ad or not
 * 
 * @return {boolean} true if its an ad, false otherwise
 */
function isAd(details) {
  // url from the ad
  var url = details.url;
  // url from the current tab
  var currentTabUrl;

  // if the tabid is -1, it isn't from a tab (from a browser) so we know it isn't an ad
  if (details.tabId == -1 || details.type == "main_frame") {
    return false;
  }
  // http://www.easybib.com
  currentTabUrl = currentTabURLs[details.tabId];

  // the site who is making the request
  var requestHost = canonicalizeHost(parseURI(url).hostname);

  // this is the page we are on 
  var pageHost = canonicalizeHost(parseURI(currentTabUrl).hostname);

  // if the url is in our url excemption list, then we do not block it
  for (urlD in allowUrlList) {
    if (allowUrlList[urlD] == currentTabUrl) {
      return false;
    }
  }
  // if the host of the current url is in our domain excemption list, then we do not block it
  for (urlD in allowDomainList) {
    if (allowDomainList[urlD] !== null)
      if (canonicalizeHost(parseURI(allowDomainList[urlD]).hostname) == pageHost) {
        return false;
      }
  }

  // facebook.com can request facebook.com... We want 3rd party requests
  if (requestHost !== pageHost) {
    // loop through the disconnectEntityList 
    for (var entityName in disconnectEntitylist) {
      // get this entity name from the disconnectEntitylist
      // Facebook, Google, Twitter
      var entity = disconnectEntitylist[entityName];
      // control variable: page is a resource for the entity
      var pageIsEntityResource;
      // control variable: request is a property of the entity 
      var requestIsEntityProperty;

      // loop through all the entity resources and check if request host is an accepted resource for the entity
      for (var host of allHosts(requestHost)) {
        requestIsEntityResource = entity.resources.indexOf(host) > -1;
        // if found, just stop looping
        if (requestIsEntityResource) {
          break;
        }
      }

      // loop through all the properties and check if it is a property of the entity
      for (var origin of allHosts(pageHost)) {
        pageIsEntityProperty = entity.properties.indexOf(origin) > -1;
        // if found, just stop looping
        if (pageIsEntityProperty) {
          break;
        }
      }

      // if our origin is a property and host is a resource of the entity, it is not an ad
      if (pageIsEntityProperty && requestIsEntityResource) {
        return false;
      }
    }

    // if url is something like ads.click.com then you would get all the hosts.. click.com
    var getHostAd = allHosts(parseURI(url).hostname);

    // if this host is part of our blocklist set we block it
    for (var host in getHostAd) {
      if (blocklistSet.has(getHostAd[host])) {
        return true;
      }
    }
  }
  // if it is not a third party request, we do not block it
  return false;
}

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

/**
 * @function parseJSON
 * 
 * @description parses disconnect.json and eliminates unnecessary categories
 */
function parseJSON() {
  for (var category in disconnectJSON.categories) {
    //  Advertising, Content ,Analytics, Social, Disconnect
    if (category != "Content") {
      for (var network in disconnectJSON.categories[category]) {
        for (var hostname in disconnectJSON.categories[category][network]) {
          // 2leep.com , 33Across , 4INFO ,4mads ...... and so on
          blocklistSet.add(hostname); // add to the set
          for (var subDomain in disconnectJSON.categories[category][network][hostname]) {
            // gets the subdomain as http://2leep.com/ , http://33across.com/ , http://www.4info.com/
            for (var entitySubDomain in disconnectJSON.categories[category][network][hostname][subDomain]) {
              blocklistSet.add(disconnectJSON.categories[category][network][hostname][subDomain][entitySubDomain]);
            }
          }
        }
      }
    }
  }
}