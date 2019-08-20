/*!
 *   ogpImgRetrieve.js
 * See {@link https://github.com/dettalant/ogpImgRetrieve}
 *
 * @author dettalant
 * @version v0.2.1
 * @license MIT License
 */
var ogpImgRetrieve = (function (exports) {
  'use strict';

  /**
   * ユーザーが使用しているブラウザが
   * fetch apiに対応しているかどうかのboolを返す
   * @return fetch apiに対応しているならtrue
   */
  var isFetchAPISupported = function () {
      return "fetch" in window;
  };
  /**
   * 別ページから取得した`text/html` stringを入力して、
   * og:image部分に記載されているurlを返す
   * @param  htmlString `text/html`なstring
   * @return            og:image content
   */
  var parseOGPImage = function (htmlString) {
      var parser = new DOMParser();
      var html = parser.parseFromString(htmlString, "text/html");
      var headTags = html.head.children;
      var headTagsLen = headTags.length;
      var linkImgUrl = "";
      for (var i = 0; i < headTagsLen; i++) {
          var tag = headTags[i];
          var prop = tag.getAttribute("property");
          if (prop !== null && prop.indexOf("og:image") !== -1) {
              var content = tag.getAttribute("content");
              if (content !== null) {
                  linkImgUrl = content;
                  break;
              }
          }
      }
      return linkImgUrl;
  };
  /**
   * img elementのsrc属性を書き換える
   * @param  url           書き換え後の画像src url
   * @param  el            書き換えを行うimg element
   * @param isUseLazysizes lazysizes対応処理を用いるかのbool
   */
  var imgSrcOverwrite = function (url, el, isUseLazysizes) {
      if (!(el instanceof HTMLImageElement)) {
          console.error("imgSrcOverwrite: 入力ElementがHTMLImageElementではない");
          return;
      }
      if (isUseLazysizes) {
          // lazysizes対応処理
          el.dataset.src = url;
          el.classList.add("lazyload");
      }
      else {
          // 通常のimg要素処理
          el.src = url;
      }
  };
  /**
   * 入力したページに接続して、取得できたraw html stringをコールバック関数へとつなげる
   * ブラウザがfetch apiに対応してるならfetchを用いて、対応していなければXMLHTTPRequestを用いる
   *
   * fetchフォールバック部分だけ別利用できるようにこれもexportしておく
   *
   * @param  url      接続するurl
   * @param  callback 接続成功後に呼び出すコールバック関数。第一引数に取得したhtmlを入れる。
   */
  var fetchHTML = function (url, callback) {
      if (isFetchAPISupported()) {
          // fecth api
          fetch(url)
              .then(function (res) {
              return res.text();
          })
              .then(function (text) {
              callback(text);
          });
      }
      else {
          // xml http request
          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function () {
              if (xhr.readyState === 4 && xhr.status === 200) {
                  // 接続成功時
                  callback(xhr.responseText);
              }
          };
          xhr.open("GET", url, true);
          // 接続開始
          xhr.send();
      }
  };
  var run = function (args) {
      // 初期化時例外処理
      if (args === void 0) {
          console.error("ogpImgRetrieveError: run()関数には引数となるオブジェクトが必要です");
      }
      else if (args.imgEl === void 0 || args.imgEl === null) {
          console.error("ogpImgRetrieveError: run()関数の引数オブジェクトにimgElが存在しない");
      }
      else if (args.url === void 0) {
          console.error("ogpImgRetrieveError: run()関数の引数オブジェクトにurlが存在しない");
      }
      /**
       * ogp imageをparseして、それでimgSrcを上書きする関数
       * @param  str  fetchで取得したhtmlのraw text
       */
      var parseAndOverwrite = function (str) {
          var linkImgUrl = parseOGPImage(str);
          imgSrcOverwrite(linkImgUrl, args.imgEl, args.isUseLazysizes);
      };
      // 小さなスクリプトなので手続き型で処理
      fetchHTML(args.url, parseAndOverwrite);
  };

  exports.fetchHTML = fetchHTML;
  exports.run = run;

  return exports;

}({}));
