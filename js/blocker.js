chrome.webRequest.onSendHeaders.addListener(function(details) {
    console.log(details.url);
}, {urls:["*://*/*"]}, ["requestHeaders"]);