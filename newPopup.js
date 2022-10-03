let [activeTab] = [];

document.getElementById("findArticle")
    .addEventListener("click", async() => findOpenArticles());


async function findOpenArticles() {

    let allArticleList = await getArticleListInPage2();

    console.log(allArticleList);
    let illegalList = [];
    for await (const article of allArticleList) {
        const response = await isIllegalArticle(article);
        if (response.status === 200) {
            const resJson = await response.json();
            if (isIllegal(resJson.result.article)) {
                illegalList.push(article);
            }
        }
    }

    await chrome.storage.local.set({ illegalList: illegalList }, function() {
        console.log('Value is set to ' + illegalList);
    });

    await showInBackgroundTab();
}

async function showInBackgroundTab() {
    await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
            chrome.storage.local.get(['illegalList'], function(result) {
                let illegalList = result.illegalList;
                document.querySelectorAll('iframe').forEach((item) => {
                    let newDoc = item.contentWindow.document.body;
                    for (let index = 0; index < newDoc.querySelectorAll(".article").length; index++) {
                        let domElement = newDoc.querySelectorAll(".article")[index];
                        let hrefUrl = domElement.attributes.href.value;
                        let articleidTemp = hrefUrl.split("&articleid=")[1];
                        let articleId = articleidTemp.split("&")[0];
                        if (illegalList.includes(articleId)) {
                            domElement.setAttribute("style", "background-color:#00FF00");
                        }
                    }
                });
            });
        }
    });
}

async function getArticleListInPage2() {
    //페이지에 있는 article 번호로 가져오기
    [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
            let articleList = [];
            document.querySelectorAll('iframe').forEach((item) => {
                let newDoc = item.contentWindow.document.body;
                console.log(newDoc);

                for (let index = 0; index < newDoc.querySelectorAll(".article").length; index++) {
                    let domElement = newDoc.querySelectorAll(".article")[index];
                    let hrefUrl = domElement.attributes.href.value;
                    let articleidTemp = hrefUrl.split("&articleid=")[1];
                    let articleId = articleidTemp.split("&")[0];
                    console.log(articleId);
                    articleList.push(articleId);
                }
            });

            chrome.storage.local.set({ allArticleList: articleList }, function() {
                console.log('Value is set to ' + articleList);
            });
        }
    });

    let localStorage = await chrome.storage.local.get(['allArticleList']);
    return localStorage.allArticleList;

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


async function getArticleListInPage() {
    const searchUrl = "https://cafe.naver.com/ArticleList.nhn?search.clubid=28144209&amp;search.boardtype=L";
    console.log("searchUrl : " + searchUrl);

    const response = await fetch(searchUrl, {
        credentials: 'include',
        contenttype: 'text/html; charset=UTF-8'
    });

    let articleList = [];

    if (response.status === 200) {
        const pageText = await response.text();
        const pageHtml = new window.DOMParser().parseFromString(pageText, "text/html");
        console.log("pageHtml");
        console.log(pageHtml);

        for (let index = 0; index < pageHtml.querySelectorAll(".article").length; index++) {
            let hrefUrl = pageHtml.querySelectorAll(".article")[index].attributes.href.value;
            let articleidTemp = hrefUrl.split("&articleid=")[1];
            let articleId = articleidTemp.split("&")[0];
            console.log(articleId);
            articleList.push(articleId);
        }
    }

    return articleList;
}