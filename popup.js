let findArticle = document.getElementById("findArticle");

let searchUrl = "https://apis.naver.com/cafe-web/cafe-articleapi/v2/cafes/28144209/articles/" + 482551 + "/comments/pages/1?requestFrom=A&orderBy=asc";

let allArticle = "https://cafe.naver.com/ArticleList.nhn?search.clubid=28144209&amp;search.boardtype=L";

let [tab] = [];
(async() => {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
})();
findArticle.addEventListener("click", async() => {

    fetch(allArticle, {
            credentials: 'include',
            contenttype: 'text/html; charset=UTF-8'
        })
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/html"))
        .then(function(data) {
            backgroundHtml = data;
            return getArticleList(data);
        })
        .then(async function(articles) {
            console.log(articles);
            let illegalList = [];
            for await (const article of articles) {
                await isIllegalArticle(article)
                    .then(function(res) {
                        //console.log(res);
                        if (res.status == '200') {
                            return res.json();
                        }
                    })
                    .then(function(json) {
                        console.log(json);
                        if (isIllegal(json.result.article)) {
                            illegalList.push(article);
                        }
                        //console.log(illegalList.length);
                    }).catch(error => {
                        //console.log(error); 
                        return false;
                    });
            }
            return illegalList;

        })
        .then(async function(illegalList) {
            chrome.storage.local.set({ key: illegalList }, function() {
                console.log('Value is set to ' + illegalList);
            });

            //let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    chrome.storage.local.get(['key'], function(result) {
                        document.querySelectorAll('iframe').forEach((item) => {
                            let newDoc = item.contentWindow.document.body;

                            console.log(newDoc);
                            console.log(result.key);
                            for (let index = 0; index < newDoc.querySelectorAll(".article").length; index++) {
                                let domElement = newDoc.querySelectorAll(".article")[index];
                                let hrefUrl = domElement.attributes.href.value;
                                let articleidTemp = hrefUrl.split("&articleid=")[1];
                                let articleId = articleidTemp.split("&")[0];
                                if (result.key.includes(articleId)) {
                                    domElement.setAttribute("style", "background-color:#00FF00");
                                }
                            }
                        });
                    });

                }
            });
        });

});



async function getArticleList(data) {
    console.log(data);
    let articleList = [];
    for (let index = 0; index < data.querySelectorAll(".article").length; index++) {
        let hrefUrl = data.querySelectorAll(".article")[index].attributes.href.value;
        let articleidTemp = hrefUrl.split("&articleid=")[1];
        let articleId = articleidTemp.split("&")[0];
        console.log(articleId);
        articleList.push(articleId);
    }
    return articleList;
}

async function isIllegalArticle(articleId) {
    let searchUrl = "https://apis.naver.com/cafe-web/cafe-articleapi/v2/cafes/28144209/articles/" + articleId + "/comments/pages/1?requestFrom=A&orderBy=asc";
    return fetch(searchUrl, {
        credentials: 'include',
    })
}

function isIllegal(article) {
    return article.isEnableExternal || article.isOpen;
}