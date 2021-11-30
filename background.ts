chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url?.includes('https://jp.mercari.com/transaction/')
  ) {
    console.log(tab);

    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['dist/trading_page.js'],
    });
    chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ['css/style.css'],
    });
  }
});
let newTabId = 0;
//productInfoを取得したら商品ページを閉じる
chrome.runtime.onMessage.addListener(
  (obj: { sender: string; url?: string; productInfo?: ProductInfo }) => {
    switch (obj.sender) {
      case 'tradingPage':
        //メルカリ商品ページを開く
        chrome.tabs.create(
          {
            active: true,
            url: obj.url,
          },
          (tab) => {
            newTabId = tab.id!;
            //メルカリ商品ページタブの情報を定期的に取得する
            const interval = setInterval(() => {
              //現在開いているタブの読み込み状態を取得する
              chrome.tabs.get(tab.id!, (tab) => {
                //読み込みが完了したら…
                if (tab.status === 'complete') {
                  clearInterval(interval);
                  //スクリプトファイルを注入する
                  chrome.scripting.insertCSS({
                    target: { tabId: tab.id! },
                    files: ['css/all_hidden.css'],
                  });
                  chrome.scripting.executeScript({
                    target: { tabId: tab.id! },
                    files: ['dist/sold_page_script.js'],
                  });
                }
              });
              console.log('新しいタブ繰り返し');
            }, 500);
          }
        );
        break;

      case 'soldPage':
        console.log('test');
        console.log(newTabId);
        if (newTabId !== 0) {
          chrome.tabs.remove(newTabId, () => {
            chrome.tabs.create(
              {
                active: true,
                url: 'https://jp.mercari.com/sell/create',
              },
              (tab) => {
                //メルカリ出品ページタブの情報を定期的に取得する
                const interval = setInterval(() => {
                  //現在開いているタブの読み込み状態を取得する
                  chrome.tabs.get(tab.id!, (tab) => {
                    newTabId = 0;
                    //読み込みが完了したら…
                    if (tab.status === 'complete') {
                      clearInterval(interval);
                      //スクリプトファイルを注入する
                      chrome.scripting.executeScript(
                        {
                          target: { tabId: tab.id! },
                          files: ['dist/create_page_script.js'],
                        },
                        () => {
                          //メルカリ出品ページにproductInfoを送る
                          chrome.tabs.sendMessage(tab.id!, obj.productInfo);
                        }
                      );
                    }
                  });
                  console.log('新しいタブ繰り返し');
                }, 500);
              }
            );
          });
        }

        break;

      default:
        break;
    }
  }
);
