let activeTabIndex: number;
let newTabId: number;
let openerTabId: number;
let isOpenerTab: boolean;
let closedTabId: [number?];

//取引ページに再出品ボタンを設置する
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url?.includes('https://jp.mercari.com/transaction/')
  ) {
    closedTabId = [];
    isOpenerTab = true;
    console.log(tab);

    activeTabIndex = tab.index;
    openerTabId = tabId;

    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['trading_page.js'],
    });
    chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ['css/style.css'],
    });
  }
});

//出品ページタブを閉じた際に、開いたタブをアクティブにする
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  closedTabId.push(tabId);
  console.log({ closedTabId, tabId });

  if (tabId === openerTabId) {
    isOpenerTab = false;
  }

  if (tabId === newTabId && isOpenerTab) {
    chrome.tabs.update(openerTabId, { active: true });
    console.log({ tabId, removeInfo });
  }
});

chrome.runtime.onMessage.addListener(
  (obj: { sender: string; url?: string; productInfo?: ProductInfo }) => {
    switch (obj.sender) {
      case 'tradingPage':
        //メルカリ商品ページを開く
        chrome.tabs.create(
          {
            active: true,
            index: activeTabIndex + 1,
            url: obj.url,
          },
          (tab) => {
            const tabId = tab.id;
            if (!tabId) {
              console.log('tabIdが取得できませんでした');
              return;
            }
            newTabId = tabId;

            //メルカリ商品ページタブの情報を定期的に取得する
            const interval = setInterval(() => {
              if (closedTabId.includes(newTabId)) {
                clearInterval(interval);
                return;
              }
              //現在開いているタブの読み込み状態を取得する
              chrome.tabs.get(tabId, (tab) => {
                //読み込みが完了したら…
                if (tab.status === 'complete') {
                  clearInterval(interval);
                  //スクリプトファイルとCSSを注入する
                  chrome.scripting.insertCSS({
                    target: { tabId: tabId },
                    files: ['css/all_hidden.css'],
                  });
                  chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['sold_page_script.js'],
                  });
                }
              });
              console.log('sold繰り返し');
            }, 1000);
          }
        );
        break;

      case 'soldPage':
        console.log(newTabId);

        //メルカリ出品ページタブの情報を定期的に取得する
        const interval = setInterval(() => {
          if (closedTabId.includes(newTabId)) {
            clearInterval(interval);
            return;
          }
          //現在開いているタブの読み込み状態を取得する
          chrome.tabs.get(newTabId, (tab) => {
            const tabId = tab.id;
            if (!tabId) {
              console.log('tabIdが取得できませんでした');
              return;
            }
            //読み込みが完了したら…
            if (tab.status === 'complete') {
              clearInterval(interval);
              //スクリプトファイルを注入する
              chrome.scripting.executeScript(
                {
                  target: { tabId: tabId },
                  files: ['create_page_script.js'],
                },
                () => {
                  //メルカリ出品ページにproductInfoを送る
                  chrome.tabs.sendMessage(tabId, obj.productInfo);
                }
              );
            }
          });
          console.log('create繰り返し');
        }, 1000);

        break;

      default:
        break;
    }
  }
);
