// Set of the hostnames that are going to be blocked
var adsBlocked = 0; // ads blocked counter
var blocklistSet = new Set();
var whitelistSet = new Set();
var currentTabURLs = {};
const disconnectJSON = require('../data/disconnect.json');
const disconnectEntitylist = require('../data/disconnectEntitylist.json');
var {
  allHosts,
  canonicalizeHost
} = require('../js/canonicalize.js');
var blocking = false;
var allowUrlList = [];
var allowDomainList = [];


parseJSON();

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    // if we've got a blocking command
    if (typeof request.blocking !== 'undefined') {
      // note that we'd like to toggle blocking
      if (blocking) {
        blocking = false;
        console.log("Ad blocking disabled");
      } else {
        blocking = true;
        console.log("Ad blocking enabled");
      }
    } else if (typeof request.blockingCheck !== 'undefined') {
      sendResponse({
        "isBlocking": blocking
      });
      console.log("sending response" + blocking);
    } else if (typeof request.allowDomainList !== 'undefined') {
      
      allowDomainList = request.allowDomainList;
    } else if (typeof request.allowUrlList !== 'undefined') {
      allowUrlList = request.allowUrlList;
    } 
  }
);

chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
  // do the blocking

  if (blocking) {
    var areWeCancelling = false; // boolean checking blocking status
    var assetAdHost = canonicalizeHost(parseURI(details.url).hostname);

    if (isAd(details)) {
      areWeCancelling = true;
      adsBlocked += 1; // update total ads blocked
      chrome.storage.local.set({"adCount": adsBlocked });
    }

    return {
      cancel: areWeCancelling
    };
  }

  return;
}, {
  urls: ["<all_urls>"]
}, ["blocking", "requestHeaders"]);


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  currentTabURLs[tabId] = tab.url;
});

chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
  chrome.tabs.get(addedTabId, function (tab) {
    currentTabURLs[addedTabId] = tab.url;
  });
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  currentTabURLs[tabId] = null;
});

/*
 * By Francesco
 *
 * Edited by Boris Pallres
 * 
 * Edited by Andres Rodriguez 04/05/2017
 * 
 * @returns true if it is an ad.
 */
function isAd(details) {
  var url = details.url;
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
      
      for (urlD in allowUrlList) {
        if (allowUrlList[urlD] == currentTabUrl) {
          return false;
        }
      }

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
          var entity = disconnectEntitylist[entityName];
          var pageIsEntityResource;
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

          // if our origin is a property and host is a resource of the entity, return false
          if (pageIsEntityProperty && requestIsEntityResource) {
            return false;
          }
        }

        // if url is something like ads.click.com then you would get all the hosts.. click.com
        var getHostAd = allHosts(parseURI(url).hostname);

        for (var host in getHostAd) {
          if (blocklistSet.has(getHostAd[host])) {
            return true;
          }
        }
      }

      return false; 
}

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


/*
 * By Andres
 * 
 * parses the disconnect list and eliminates unnecessary categories
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
              // gets wierd random numbers
              blocklistSet.add(disconnectJSON.categories[category][network][hostname][subDomain][entitySubDomain]);
            }
          }
        }
      }
    }
  }
} 
