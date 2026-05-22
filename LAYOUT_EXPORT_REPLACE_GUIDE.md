# Layout 匯出與套用指南

目標檔案：`index.html`

## 先用新的 Export 流程

這版開始，Layout Admin 的 `Export` 不只會複製 `UI_LAYOUT_DEFAULTS`，也會自動下載一份已套用目前 layout 的完整 HTML：

```text
index.layout-applied.html
```

這是為了避開編輯器「版本不一樣 / 檔案已在磁碟上變更」的警告。不要在舊分頁或舊 buffer 內直接覆蓋儲存，因為那會把舊版 `index.html` 寫回去。

建議流程：

1. 重新整理瀏覽器中的遊戲，確定跑的是最新版本。
2. 進入 Layout Admin 調整 UI。
3. 按 `Export`。
4. 優先使用下載出的 `index.layout-applied.html` 作為已套用 layout 的完整檔案。
5. 若瀏覽器擋住完整 HTML 下載，才使用剪貼簿裡的 `const UI_LAYOUT_DEFAULTS={...};` 手動替換。

## 如果必須手動替換

不要用行號。請搜尋錨點：

```js
const UI_LAYOUT_DEFAULTS={
```

只替換這一整段物件，從 `const UI_LAYOUT_DEFAULTS={` 到它自己的配對 `};`。不要刪到後面的區段，例如：

```js
// RESTORED constants & functions
```

或：

```js
const UI_LAYOUT_TARGET_DEFS=[
```

如果儲存時出現「版本不同」警告，請取消儲存，重新載入磁碟上的 `index.html` 後再貼一次。不要選覆蓋。

## 版本檢查

這版匯出的 layout 應該包含：

- `desktop`
- `mobile`
- `rat-city-pager`
- `__ratCityEndingCardV12`

如果缺少這些欄位，代表瀏覽器還在跑舊版，請重新整理或清快取後再匯出。
