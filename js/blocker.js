var blocklistSet = new Set();
const disconnectJSON = require('../data/disconnect.json');

	// parse our disconnect JSON into a set where we only include the hostname and subdomain urls
    for(var category in disconnectJSON.categories) {
	    for(var network in disconnectJSON.categories[category]) {
	        for(var hostname in disconnectJSON.categories[category][network]) {
	            blocklistSet.add(hostname);
	            for(var subDomain in disconnectJSON.categories[category][network][hostname]) {
	                for(var entitySubDomain in disconnectJSON.categories[category][network][hostname][subDomain]) {
	                     blocklistSet.add(disconnectJSON.categories[category][network][hostname][subDomain][entitySubDomain]);
	                }
	            }
	        }
	    }
    }

chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    
    var areWeCancelling;
    if(isAd(details.url)) {
    	areWeCancelling = true;
    	console.log("bitch we be blockin " + parseURI(details.url).hostname);
    }
   

    return {cancel: areWeCancelling};
},{urls:["*://*/*"]}, ["blocking", "requestHeaders"]);

function isAd(url) {
	if(blocklistSet.has(parseURI(url).hostname)) {
		return true;
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