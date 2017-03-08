chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    
    var areWeCancelling;
    if(isAd(details.url)) {
    	areWeCancelling = true;
    	console.log("bitch we be blockin " + details.url);
    } else {
    	console.log(details.url);
    }
   

    return {cancel: areWeCancelling};
},{urls:["*://*/*"]}, ["blocking", "requestHeaders"]);

function isAd(url) {

	

	return false;
}