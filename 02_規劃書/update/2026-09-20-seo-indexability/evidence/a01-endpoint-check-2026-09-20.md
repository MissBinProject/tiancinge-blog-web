# A01 公開端點取證

取證時間：2026-09-20（台北時間；HTTP response 的 Date 為 2026-09-19 UTC）。

## Sitemap

執行：

```sh
curl -I https://tiancinge-web.web.app/sitemap.xml
curl -L -i https://tiancinge-web.web.app/sitemap.xml
curl -A "Googlebot" -L -i https://tiancinge-web.web.app/sitemap.xml
python3 scripts/verify-sitemap.py
```

結果：

- 一般 UA：HTTP 200、`Content-Type: application/xml; charset=utf-8`。
- `Googlebot` UA：HTTP 200、同一 Content-Type、相同 1925 bytes body。
- 沒有 redirect；body 以 UTF-8 XML declaration 與 sitemap `urlset` 開頭。
- `verify-sitemap.py` 驗證 17 個現行 live URL：HTTP 200、canonical 對應、沒有 noindex。
- 最新發布後 sitemap body 為 1,802 bytes；`privacy` 與 `terms` 保持可讀但不列入 sitemap。

## Robots

初始取證內容（19:xx）：

```txt
User-agent: *
Allow: /
Allow: /search
Disallow: /api/
Disallow: /admin

Sitemap: https://tiancinge-web.web.app/sitemap.xml
```

`robots.txt` 一般請求與 Googlebot UA 均為 HTTP 200、`text/plain; charset=utf-8`。

> 後續發布修正（19:52）：因搜尋頁為 `noindex` 工具頁，正式 robots 已將原本的 `Allow: /search` 改為 `Disallow: /search`；本文件前段保留 19:xx 初始取證，最新規則與驗證結果見 final-release evidence。

## 診斷結論

本次在網站端沒有重現報告中的「無法擷取」；不能把 XML declaration、Firebase rewrite 或 robots 視為已證實 root cause。Google Search Console 的實際最後讀取時間與錯誤仍是外部狀態，需由具 property 權限的操作在 A02 留存畫面或報表證據。現有網站端風險改以靜態 Hosting、同 UA body 與發布後回歸測試控制。

## 20:57 正式 release 端點重驗

- `https://tiancinge-web.web.app/sitemap.xml`：一般 UA 與 `Googlebot/2.1` 均 HTTP 200、`application/xml; charset=utf-8`，17 個 `<loc>`；兩份 body SHA-256 均為 `bdb47a5b0b0696a6eb2beef1173599f02fe691b34676c30a3ebda11e813f31e2`。
- `https://tiancinge-web.web.app/robots.txt`：一般 UA 與 `Googlebot/2.1` 均 HTTP 200、`text/plain; charset=utf-8`；兩份 body SHA-256 均為 `d35060c75b56c2dbc5c0838c86efd8bf07ea3da602b4810716b84e7392a29983`。
- robots 現行內容為 `Allow: /`、`Disallow: /search`、`Disallow: /api/`、`Disallow: /admin`，並指向正式 sitemap；沒有 SPA HTML fallback 或 UA 差異。
- 這次重驗再次排除網站端 HTTP、MIME、XML、robots 與 Googlebot parity 缺陷；GSC「無法擷取」仍沒有可操作的網站端 root cause 證據。
