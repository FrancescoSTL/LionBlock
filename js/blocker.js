// Set of the hostnames that are going to be blocked
var blocklistSet = new Set();
var whitelistSet =new Set();
const disconnectJSON = require('../data/disconnect.json');
const disconnectEntitylist = require('../data/disconnectEntitylist.json');
var {allHosts, canonicalizeHost} = require('../js/canonicalize.js');
var blocking = false;

// NOTE: in isAd in SiteSonar HOST is the url in which all the ads are being loaded into and ORIGIN is the url from where the ad is being triggered. Example, the javascript file that generates the request.

parseJSON();
//parseDisconnectEntity();

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
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
      sendResponse({"isBlocking": blocking});
      console.log("sending response" + blocking);
    }
  }
);


chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    // do the blocking

    if (blocking) {
      var areWeCancelling; // boolean checking blocking status
      var assetAdHost = canonicalizeHost(parseURI(details.url).hostname);

      if(isAd(details.url)) {
        areWeCancelling = true;
        console.log("Yo we be blockin " + assetAdHost);
        console.log(details);
      }


      return {cancel: areWeCancelling};
    }

    return;
},{urls:["*://*/*"]}, ["blocking", "requestHeaders"]);

/*
* By Francesco
*
* Edited by Boris Pallres
* @returns true if it is an ad.
*/
function isAd(url) {
  // if url is something like ads.click.com then you would get all the hosts.. click.com
  var getHostAd = allHosts(parseURI(url).hostname);
  //console.log("Before "+parseURI(url).hostname);
  //console.log("After "+ getHostAd );

  if(whitelistSet.has(getHostAd)){
    //return false;
  }

for (var host in getHostAd){
  if(blocklistSet.has(getHostAd[host])) {
    return true;
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
}// end parse url


function parseJSON(){

//delete disconnectJSON.categories['Content']
//delete disconnectJSON.categories['Legacy Disconnect']
//delete disconnectJSON.categories['Legacy Content']
  // parse our disconnect JSON into a set where we only include the hostname and subdomain urls
    for(var category in disconnectJSON.categories) {
      //  Advertising, Content ,Analytics, Social, Disconnect
      if (category != "Content" && category != "Disconnect") { console.log(category);
      for(var network in disconnectJSON.categories[category]) {
          for(var hostname in disconnectJSON.categories[category][network]) {
             // 2leep.com , 33Across , 4INFO ,4mads ...... and so on
              blocklistSet.add(hostname); // add to the set
              for(var subDomain in disconnectJSON.categories[category][network][hostname]) {
                // gets the subdomain as http://2leep.com/ , http://33across.com/ , http://www.4info.com/
                  for(var entitySubDomain in disconnectJSON.categories[category][network][hostname][subDomain]) {
                    // gets wierd random numbers
                       blocklistSet.add(disconnectJSON.categories[category][network][hostname][subDomain][entitySubDomain]);
                  }
              }
          }
        }  
      }
    }

}// end parse JSON

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