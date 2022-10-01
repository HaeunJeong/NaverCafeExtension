// background.js

let color = '#3aa757';

chrome.runtime.onInstalled.addListener(function(message, callback) {
    if (message == "runContentScript") {
        chrome.tabs.executeScript({
            file: 'contentScript.js'
        });
    }

    let [tab] = [];
    let allArticle = "";
    (async() => {
        [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        allArticle = await getSearchUrl();
    })();
    console.log(allArticle);
});

async function getSearchUrl() {

    let allArticleUrl = "https://cafe.naver.com/ArticleList.nhn?search.clubid=28144209&amp;search.boardtype=L";
    let boardNum = 20; // 가입인사 
    let pageNum = 1;

    let resultUrl = allArticleUrl +
        "&search.page=" + pageNum +
        boardNum != null ? "&search.menuid=" + boardNum : "";

    console.log("resultUtl = " + resultUrl);

    /*
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {

            //console.log(new window.DOMParser().parseFromString(document, "text/xml"));
            console.log(document.querySelector('iframe'));
        }
    });
    */

    return resultUrl;
}