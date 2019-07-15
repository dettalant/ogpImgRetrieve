// ogpImgRetrieve.run()時に求められる引数
interface InitArgs {
  imgEl: HTMLImageElement | null;
  url: string;
  // lazysizes対応処理を用いるか否か
  isUseLazysizes?: boolean;
}

/**
 * ユーザーが使用しているブラウザが
 * fetch apiに対応しているかどうかのboolを返す
 * @return fetch apiに対応しているならtrue
 */
const isFetchAPISupported = (): boolean => {
  return "fetch" in window;
}

/**
 * 別ページから取得した`text/html` stringを入力して、
 * og:image部分に記載されているurlを返す
 * @param  htmlString `text/html`なstring
 * @return            og:image content
 */
const parseOGPImage = (htmlString: string) => {
  const parser = new DOMParser();
  const html = parser.parseFromString(htmlString, "text/html");
  const headTags = html.head.children;
  const headTagsLen = headTags.length;
  let linkImgUrl = "";

  for (let i = 0; i < headTagsLen; i++) {
    const tag = headTags[i];
    const prop = tag.getAttribute("property");
    if (prop !== null && prop.indexOf("og:image") !== -1) {
      const content = tag.getAttribute("content");
      if (content !== null) {
        linkImgUrl = content;
        break;
      }
    }
  }

  return linkImgUrl;
}

/**
 * img elementのsrc属性を書き換える
 * @param  url           書き換え後の画像src url
 * @param  el            書き換えを行うimg element
 * @param isUseLazysizes lazysizes対応処理を用いるかのbool
 */
const imgSrcOverwrite = (url: string, el: HTMLImageElement | null, isUseLazysizes?: boolean) => {
  if (!(el instanceof HTMLImageElement)) {
    console.error("imgSrcOverwrite: 入力ElementがHTMLImageElementではない");
    return;
  }

  if (isUseLazysizes) {
    // lazysizes対応処理
    el.dataset.src = url;
    el.classList.add("lazyload");
  } else {
    // 通常のimg要素処理
    el.src = url;
  }
}

/**
 * 入力したページに接続して次なる処理へとつなげる
 * ブラウザがfetch apiに対応してるならfetchを用いて、対応していなければXMLHTTPRequestを用いる
 * @param  args ogpImgRetrieve.run()にて入力されたオブジェクト
 */
const fetchUrl = (args: InitArgs) => {
  if (isFetchAPISupported()) {
    // fecth api
    fetch(args.url)
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        return parseOGPImage(text);
      })
      .then((url) => {
        imgSrcOverwrite(url, args.imgEl, args.isUseLazysizes);
      })
  } else {
    // xml http request
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        // 接続成功時
        const linkImgUrl = parseOGPImage(xhr.responseText);
        imgSrcOverwrite(linkImgUrl, args.imgEl, args.isUseLazysizes);
      }
    }
    xhr.open("GET", args.url, true);

    // 接続開始
    xhr.send();
  }
}

export const run = (args: InitArgs) => {
  // 初期化時例外処理
  if (typeof args === "undefined") {
    console.error("ogpImgRetrieveError: run()関数には引数となるオブジェクトが必要です");
  } else if (typeof args.imgEl === "undefined") {
    console.error("ogpImgRetrieveError: run()関数の引数オブジェクトにimgElが存在しない")
  } else if (typeof args.url === "undefined") {
    console.error("ogpImgRetrieveError: run()関数の引数オブジェクトにurlが存在しない");
  }

  // 小さなスクリプトなので手続き型で処理
  fetchUrl(args)
}
