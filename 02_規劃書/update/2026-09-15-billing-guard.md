# 2026-09-15 帳務支出上限

## 需求

將 `tiancinge` 專案的 Cloud Run 每月費用限制為 NT$100，並將 AI 相關 API 的每月費用限制為 NT$1，達標後自動停止新用量。

## 實作

使用 Google Cloud Billing Console 的 Preview「強制執行支出上限」建立三個每月上限，範圍均限定專案 `tiancinge`、帳號 `ouyangtaisen@gmail.com`、帳單帳戶 `016915-3B65AD-1A05CA`：

| 服務 | 每月上限 | 狀態 | Budget ID |
| --- | ---: | --- | --- |
| Cloud Run (`run.googleapis.com`) | NT$100 | 已設定 | `cd08a90c-6b04-400e-9043-564795cb41ce` |
| Gemini API (`generativelanguage.googleapis.com`) | NT$1 | 已設定 | `f6ec97c1-7586-469b-bccb-f3e00d962da8` |
| Vertex AI (`aiplatform.googleapis.com`) | NT$1 | 已設定 | `0dc2721c-6fe2-403d-8a3f-dffc9ce62edb` |

Vertex AI 的支出上限同時涵蓋其頁面列出的 Agent Platform、Gemini Enterprise 等隨需用量。其他 AI API 若日後出現在 Console 的可選服務清單，必須另建一個 NT$1 上限；支出上限一次只套用一個服務。

## 驗收

- Console 預算清單顯示三筆 `tiancinge` 預算，服務欄分別為 Cloud Run、Gemini API、Vertex AI。
- 三筆預算的「支出上限狀態」均顯示「已設定」。
- 金額欄分別顯示 `$0.01/$100.00`、`$0.00/$1.00`、`$0.00/$1.00`（目前實際費用可能隨帳務回報更新）。
- 公開網站與後台部署未變更；僅新增帳務控制設定。

## 操作限制

支出上限依預估或延遲回報費用執行，可能在達標後仍產生少量超額費用。達標後服務會暫停新的使用量，不會刪除 Cloud Run、Firestore、Storage 或網站資料；恢復服務需帳單管理員在上方 Console 入口解除或調高上限。

## 交接

- 管理入口：<https://console.cloud.google.com/billing/016915-3B65AD-1A05CA/budgets?project=tiancinge>
- 完整部署紀錄：[`../project/firebase-deployment.md`](../project/firebase-deployment.md)
- 本次不建立 Cloud Function／Scheduler，避免用延遲的 Pub/Sub 通知取代原生的支出上限。
