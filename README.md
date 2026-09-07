# Riku AI Native - 個人專案排程小工具（原型 / MVP）

解決「預估時程、安排任務全靠人腦」的問題：輸入一句話描述的目標，AI 幫你拆解成具體任務清單並給出時間估計；
你可以手動調整，標記完成後系統會記下實際花費時數，並計算你自己的估時準確度。

這是本機原型階段，不部署雲端服務，資料庫使用本機 SQLite（Node.js 內建的 `node:sqlite`，不需要額外安裝資料庫或 Docker）。

## 需求

- Node.js 22 以上（因為用到 Node 內建的 `node:sqlite`）
- 一組 Anthropic API key（唯一會產生費用的地方）

## 本機啟動步驟

1. 安裝套件：

   ```bash
   npm install
   ```

2. 設定環境變數：

   ```bash
   cp .env.local.example .env.local
   ```

   打開 `.env.local`，把 `ANTHROPIC_API_KEY` 換成你自己的 key。

3. 啟動開發伺服器：

   ```bash
   npm run dev
   ```

4. 打開瀏覽器造訪 http://localhost:3000

## 功能

1. 輸入一段「我想做什麼」的描述，送出後由 Claude（`claude-sonnet-5`，透過 tool use 取得結構化 JSON）拆解成具體任務清單，包含任務名稱、預估工時、建議執行順序。
2. 任務會存進本機 SQLite 資料庫（`data/app.db`，第一次啟動時自動建立），並顯示在頁面上。每個任務可以手動編輯（任務名稱、預估時數、順序），也可以新增或刪除任務。
3. 按下「標記完成」後，系統會記錄目前時間，計算從建立到完成經過的時數寫入 `actual_hours`，並把狀態改成「完成」。
4. 頁面上方會顯示所有已完成任務的「預估時數」與「實際時數」平均落差百分比，用來檢視自己估時準不準。

## 資料表結構 (`tasks`)

| 欄位 | 說明 |
| --- | --- |
| id | 主鍵 |
| project | 所屬專案名稱（目前以輸入的描述前 30 字自動帶入） |
| task_name | 任務名稱 |
| estimated_hours | 預估時數 |
| actual_hours | 實際花費時數（完成前為空值） |
| status | `進行中` 或 `完成` |
| order_index | 建議執行順序 |
| created_at | 建立時間（UTC） |

## 之後可以做的事（目前原型階段先不做）

- 部署到 Vercel / 雲端 Supabase
- 排程提醒功能
- 串接行事曆
- 使用者登入與多人協作

## 注意事項

- `.env.local` 已加入 `.gitignore`，不會被 commit / push 到 GitHub。
- `data/` 資料夾（本機 SQLite 檔案）也已加入 `.gitignore`，每台機器會有自己的本機資料。
