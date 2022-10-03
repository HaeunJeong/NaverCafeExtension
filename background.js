// background.js
chrome.runtime.onInstalled.addListener(function(message, callback) {
    if (message == "runContentScript") {
        chrome.tabs.executeScript({
            file: 'contentScript.js'
        });
    }
});