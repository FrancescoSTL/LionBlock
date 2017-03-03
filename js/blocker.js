chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    
    var areWeCancelling;
    /*if(details.url.indexOf("://www.google.com") != -1) {
    	areWeCancelling = true;
    	console.log("bitch we be blockin " + details.url);
    } else {*/
    	console.log(details.url);
    //}
   

    return {cancel: areWeCancelling};
},{urls:["*://*/*"]}, ["blocking", "requestHeaders"]);