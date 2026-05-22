# Layout 匯出替換指南

目標檔案：`index.html`

## 為什麼會跳出版本差異警告

這個警告通常不是 Layout Admin 匯出的內容壞掉，而是編輯器發現你正在覆蓋一份已經被其他工具更新過的 `index.html`。也就是說，你手上開著的是舊版本，磁碟上的檔案已經更新，所以編輯器阻止你直接儲存。

常見原因：

- 依照舊指南的行號替換，但 `index.html` 已經被 AI 或其他工具改過，行號不再準。
- 你開著 `index.html` 的舊分頁時，Codex 或其他 AI 又改了同一個檔案。
- 瀏覽器裡的遊戲還是舊版，匯出的 layout 缺少新欄位，例如這次新增的 `rat-city-pager`。
- 替換範圍太大，不小心覆蓋到 `UI_LAYOUT_DEFAULTS` 後面的程式碼。

## 正確替換規則

不要用行號。請用搜尋錨點。

只替換這一整段：

```js
const UI_LAYOUT_DEFAULTS={
  ...
};
```

開始位置請搜尋：

```js
const UI_LAYOUT_DEFAULTS={
```

結束位置是同一個物件的配對 `};`。不要刪到後面的區段，例如：

```js
// RESTORED constants & functions
```

或：

```js
const UI_LAYOUT_TARGET_DEFS=[
```

## 安全流程

1. 在編輯器中先重新載入 `index.html`，確定它是磁碟上的最新版本。
2. 在瀏覽器重新整理遊戲，進入 Layout Admin 後再調整畫面。
3. 按 `Export`。
4. 回到 `index.html`，搜尋 `const UI_LAYOUT_DEFAULTS={`。
5. 只選取這個物件，從 `const UI_LAYOUT_DEFAULTS={` 到它自己的配對 `};`。
6. 貼上匯出的內容並儲存。
7. 如果又出現版本差異警告，選擇取消儲存，重新載入檔案後再貼一次。

## 這版需要注意

- 匯出內容必須包含 `desktop` 和 `mobile`。
- 匯出內容應該包含 `rat-city-pager`。如果沒有，代表瀏覽器還在跑舊版，請重新整理遊戲後再匯出。
- 不要替換 `UI_LAYOUT_TARGET_DEFS`、Cloudflare Worker、排行榜 API、或 `UI_LAYOUT_DEFAULTS` 以外的程式碼。
- 如果你只想修手機版，仍然要保留匯出內容裡的 `desktop`，不要只貼 `mobile` 片段。
- 若版面整個跑掉，先在 Layout Admin 對目前 bucket 做 `Reset`，再重新調整與匯出。
