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

// NOTE: in isAd in SiteSonar HOST is the url in which all the ads are being loaded into and ORIGIN is the url from where the ad is being triggered. Example, the javascript file that generates the request.

parseJSON();
//parseDisconnectEntity();

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
    var areWeCancelling; // boolean checking blocking status
    var assetAdHost = canonicalizeHost(parseURI(details.url).hostname);

    if (isAd(details)) {
      areWeCancelling = true;
      adsBlocked += 1; // update total ads blocked
      //console.log("Yo we be blockin " + assetAdHost);
      //console.log(details);
    }

    return {
      cancel: areWeCancelling
    };
  }

  return;
}, {
  urls: ["*://*/*"]
}, ["blocking", "requestHeaders"]);


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  currentTabURLs[tabId] = tab.url;
  /*console.log("------------------");
  for(var tabnum in currentTabURLs) {
    console.log(currentTabURLs[tabnum]);
  }*/
});

chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
  chrome.tabs.get(addedTabId, function (tab) {
    currentTabURLs[addedTabId] = tab.url;
    /*console.log("------------------");
    for(var tabnum in currentTabURLs) {
      console.log(currentTabURLs[tabnum]);
    }*/
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
  if (details.tabId === -1) {
    return false;
  }

  
      // http://www.easybib.com
      //console.log(currentTabURLs[details.tabId]);
      currentTabUrl = currentTabURLs[details.tabId];

      /* 
      TODO: We need to first check the actual website we are on (which we get from chrome.tabs). Then, check if this host is a resource of an entity. If it is, we check if the origin of the request is part of this entity's resources. If it is, we should not block them. On the contrary, blocking heeaders should happen.
      */

      // the site who is making the request
      var requestHost = canonicalizeHost(parseURI(url).hostname);

      // this is the page we are on 
      //var pageHost = canonicalizeHost(parseURI(currentTabUrl).hostname);
      var pageHost = canonicalizeHost(parseURI(currentTabUrl).hostname);

      
      //Fixed - Boris
      
      for (urlD in allowUrlList) {
        if (allowUrlList[urlD] == currentTabUrl) {
          console.log("STOPPING BLOCKING FOR PAGE " + currentTabUrl);
          return false;
        }
      }

      for (urlD in allowDomainList) {
        if (allowDomainList[urlD] !== null)
          if (canonicalizeHost(parseURI(allowDomainList[urlD]).hostname) == pageHost) {
            console.log("STOPPING BLOCKING FOR DOMAIN " + pageHost);
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
              //console.log("our request host is a resource for the entity " + entityName + " for " + requestHost + " with page host " + pageHost);
              break;
            }
          }

          // loop through all the properties and check if it is a property of the entity
          for (var origin of allHosts(pageHost)) {
            pageIsEntityProperty = entity.properties.indexOf(origin) > -1;
            // if found, just stop looping
            if (pageIsEntityProperty) {
              //console.log("our page host is a property for the entity " + entityName + " for " + pageHost + " with request host " + requestHost);
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
        //console.log("Before "+parseURI(url).hostname);
        //console.log("After "+ getHostAd );

        /*if (whitelistSet.has(getHostAd)) {
          //return false;
        }*/

        for (var host in getHostAd) {
          if (blocklistSet.has(getHostAd[host])) {
            //console.log(getHostAd[host] + " is an ad");
            return true;
          }
        }
      }

      //console.log(parseURI(url).hostname + " is not an ad");
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
} // end parse url


/*
 * By Andres
 * 
 * parses the disconnect list and eliminates unnecessary categories
 */
function parseJSON() {

  //delete disconnectJSON.categories['Content'];
  //delete disconnectJSON.categories['Disconnect'];
  //delete disconnectJSON.categories['Analytics'];
  //delete disconnectJSON.categories['Social'];
  //delete disconnectJSON.categories['Legacy Disconnect']
  //delete disconnectJSON.categories['Legacy Content']
  // parse our disconnect JSON into a set where we only include the hostname and subdomain urls
  for (var category in disconnectJSON.categories) {
    //  Advertising, Content ,Analytics, Social, Disconnect
    //if (category != "Content" && category != "Disconnect") { console.log(category);
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
  //}
} // end parse JSON

/*
function parseDisconnectEntity(){
  for(var network in disconnectEntitylist) {
     for(var type in disconnectEntitylist[network]) {
        for(var resources in disconnectEntitylist[network][type]) {
          whitelistSet.add(disconnectEntitylist[network][type][resources]);
        }
    }
  }
}
*/