# 🏹 射箭知識庫 — LLM Wiki

以繁體中文整理射箭器材、技術、賽事與相關概念的持續累積型知識庫。`wiki/` 保存 Markdown 條目，根目錄的 `index.html` 提供可在 GitHub Pages 瀏覽的網站介面。

## 線上瀏覽

部署完成後，網站網址為：

`https://<GitHub 使用者名稱>.github.io/<儲存庫名稱>/`

若儲存庫名稱為 `<GitHub 使用者名稱>.github.io`，網址則是：

`https://<GitHub 使用者名稱>.github.io/`

## GitHub Pages 部署

1. 將儲存庫推送至 GitHub。
2. 開啟儲存庫的 **Settings → Pages**。
3. 在 **Build and deployment** 的 **Source** 選擇 **Deploy from a branch**。
4. 選擇包含網站檔案的分支（通常是 `main`）及 **/(root)**，然後按 **Save**。
5. 等待部署完成，從 Pages 設定頁提供的網址開啟網站。

網站是純靜態頁面，不需要建置步驟或後端。部署來源應選儲存庫根目錄，因為 `index.html`、`app.js`、`styles.css` 及 `wiki/` 都位於根目錄下。

## 網站功能

- 依 `wiki/index.md` 顯示分類導覽與條目索引。
- 讀取並呈現 `wiki/` 中的 Markdown，支援表格、清單、程式碼區塊及 YAML Frontmatter 標籤。
- 將 `[[wiki/路徑/頁面]]` 交叉引用轉成站內連結；尚未建立的引用會以待補頁面標示。
- 可搜尋索引收錄頁面的內容；按 `/` 可快速聚焦搜尋，按 `Esc` 可關閉搜尋結果或手機目錄。
- 支援桌面與手機版面。Markdown 解析與 HTML 清理程式由 jsDelivr CDN 載入，瀏覽時需連線至網際網路。

## 本機預覽

請在儲存庫根目錄啟動靜態網頁伺服器（直接以 `file://` 開啟無法讀取 Markdown 檔案）：

```powershell
python -m http.server 8000
```

接著瀏覽 <http://localhost:8000/>。完成後在終端機按 `Ctrl+C` 停止伺服器。

## 維護知識庫

- 新增或更新條目：編輯 `wiki/` 中對應分類的 Markdown 檔案，依 [AGENTS.md](./AGENTS.md) 維持 Frontmatter、來源、雙語術語及交叉引用格式。
- 更新導覽：新增頁面後，將 `[[wiki/分類/頁面]]` 條目加入 [wiki/index.md](./wiki/index.md)；網站會從此索引更新側邊導覽與搜尋清單。
- 原始素材存放於 `raw/`；網站目前以 `wiki/index.md` 收錄的條目為瀏覽及搜尋範圍。

