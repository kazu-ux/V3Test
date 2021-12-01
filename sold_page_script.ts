type ProductInfo = {
  images: string[];
  category: string[];
  size: string;
  brand: string;
  itemCondition: string;
  name: string;
  description: string;
  shippingPayer: string;
  shippingMethod: string;
  shippingFromArea: string;
  shippingDuration: string;
  price: string;
};

function getImageUrl(): string[] {
  let imageUrls: string[] = [];
  const imageElements = document.querySelectorAll('.slick-list [sticker]');
  for (const element of imageElements) {
    const imageUrl = element.getAttribute('src');
    if (!imageUrl) {
      alert('画像のURL取得に失敗しました');
      return [''];
    }
    imageUrls.push(imageUrl);
  }
  return imageUrls;
}

async function getBase64(imageUrls: string[]) {
  const imageBase64s: string[] = [];
  for (const imageUrl of imageUrls) {
    const base64 = await fetch(imageUrl)
      .then((e) => e.blob())
      .then(async (blob) => {
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = resolve;
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        return reader.result;
      });
    if (!base64) {
      alert('画像のbase64取得にエラーが発生しました');
      return [''];
    }
    imageBase64s.push(base64.toString());
  }
  return imageBase64s;
}

function getCategories() {
  const categoryIds: string[] = [];
  //pop() メソッドは、配列から最後の要素を取り除き、その要素を返します。
  //このメソッドは配列の長さを変化させます。
  const targetElements: NodeListOf<HTMLLinkElement> = document.querySelectorAll(
    'mer-breadcrumb-list [data-location="item:item_detail_table:link:go_search"]'
  );
  const categoryIdElement = Array.from(targetElements).pop();

  if (!categoryIdElement) {
    alert('カテゴリー要素の取得に失敗しました');
    return [];
  }
  const tCategoryIds = categoryIdElement.href.match(/t._category_id=[0-9]*/g);
  if (!tCategoryIds) {
    alert('カテゴリーID取得の正規表現にエラーが発生しました');
    return [''];
  }
  for (const tCategoryId of tCategoryIds) {
    const formattedCategoryId = tCategoryId.match(/[0-9]+$/);
    if (!formattedCategoryId) {
      alert('カテゴリーIDの整形にエラーが発生しました');
      return [''];
    }
    categoryIds.push(formattedCategoryId[0]);
  }
  console.log(categoryIds);
  return categoryIds;
}

async function setProduct() {
  const product: ProductInfo = {
    images: await getBase64(getImageUrl()),
    category: getCategories(),
    size:
      document.querySelector('[data-testid="商品のサイズ"]')?.textContent ?? '',
    brand:
      document.querySelector('[data-testid="ブランド"]')?.textContent ?? '',
    itemCondition:
      document.querySelector('[data-testid="商品の状態"]')?.textContent ?? '',
    name:
      document
        .querySelector('[data-testid="name"]')
        ?.getAttribute('title-label') ?? '',
    description:
      document.querySelector('[data-testid="description"]')?.textContent ?? '',
    shippingPayer:
      document.querySelector('[data-testid="配送料の負担"]')?.textContent ?? '',
    shippingMethod:
      document.querySelector('[data-testid="配送の方法"]')?.textContent ?? '',
    shippingFromArea:
      document.querySelector('[data-testid="発送元の地域"]')?.textContent ?? '',
    shippingDuration:
      document.querySelector('[data-testid="発送までの日数"]')?.textContent ??
      '',
    price:
      document.querySelector('[data-testid="price"]')?.getAttribute('value') ??
      '',
  };
  return product;
}

(function () {
  let count = 0;
  const interval = setInterval(async () => {
    count += 1;
    //一秒ごとにログを表示する
    if (count % 10 === 0) {
      console.log('sold繰り返し');
    }

    /*     const element = document.querySelector(
      '[data-testid="checkout-button-container"]'
    ); */
    const element = document.querySelector(
      '[data-testid="view-transaction-button"]'
    );
    if (element) {
      count = 0;
      clearInterval(interval);
      const productInfo = await setProduct();
      window.location.href = 'https://jp.mercari.com/sell/create';
      console.log(productInfo);
      chrome.runtime.sendMessage('gejelkpidobampgonfcdkkfgckaphban', {
        sender: 'soldPage',
        productInfo,
      });
    } else if (count === 50) {
      count = 0;
      clearInterval(interval);
    }
  }, 100);
})();
