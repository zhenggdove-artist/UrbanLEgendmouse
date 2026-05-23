# Layout 匯出手動套用指南

目標檔案：

- `index.html`

這次要套用的匯出檔範例：

- `index.layout-applied (1).html`

## 先理解這個匯出檔是什麼

`Export` 下載出的 `index.layout-applied (...).html` 是一份「已經把目前 Layout Admin 設定套進去」的完整 HTML。

也就是說，它不是只有一小段 JSON，而是一份完整的 `index.html` 副本。

所以手動套用有兩種做法：

1. 直接用整份匯出檔覆蓋 `index.html`
2. 只把裡面的 `UI_LAYOUT_DEFAULTS` 區塊貼回 `index.html`

## 建議優先順序

建議優先用這個判斷：

1. 如果你剛匯出完，而且確定匯出後沒有再改過遊戲程式碼，直接整份覆蓋最快。
2. 如果你不確定匯出後 AI、自己、或其他工具有沒有改過 `index.html` 其他地方，改用「只替換 `UI_LAYOUT_DEFAULTS`」最安全。

## 做法 A：直接整份覆蓋 `index.html`

適用情況：

- 你剛剛才從最新版本的遊戲按下 `Export`
- 匯出後沒有再改 `index.html` 其他程式碼
- 你要的就是把目前版面完整套回去

步驟：

1. 關掉編輯器中舊的 `index.html` 分頁，或先重新載入磁碟版本。
2. 開啟 `index.layout-applied (1).html`。
3. 全選內容。
4. 開啟 `index.html`。
5. 全選 `index.html` 內容後貼上。
6. 儲存 `index.html`。

完成後建議至少檢查：

- 遊戲能正常開啟
- Layout Admin 調整過的位置有反映
- `RAT CITY` ending 畫面沒有跑版

## 做法 B：只替換 `UI_LAYOUT_DEFAULTS`

這是比較安全的做法。

適用情況：

- 你懷疑 `index.html` 的其他程式碼已經又被改過
- 你只想套用 UI 版面，不想碰其他邏輯
- 你不想冒險把舊的完整 HTML 蓋回去

步驟：

1. 開啟 `index.layout-applied (1).html`。
2. 搜尋：

```js
const UI_LAYOUT_DEFAULTS={
```

3. 從這一行開始，選到這個物件自己的結尾 `};`。
4. 複製這整段。
5. 開啟目前工作中的 `index.html`。
6. 在 `index.html` 內搜尋同一個錨點：

```js
const UI_LAYOUT_DEFAULTS={
```

7. 只替換這一整段，從 `const UI_LAYOUT_DEFAULTS={` 到它自己的配對 `};`。
8. 儲存 `index.html`。

不要刪到後面的區段，例如：

```js
// RESTORED constants & functions
```

或：

```js
const UI_LAYOUT_TARGET_DEFS=[
```

## 什麼時候不要直接整份覆蓋

遇到下面情況，不要用做法 A，改用做法 B：

- `index.html` 這段時間還有其他功能修改
- 你不確定匯出檔是不是從最新版本頁面產生的
- 你同時在讓 AI 修改 `index.html`
- 編輯器已經跳出「檔案已在磁碟上變更」或「版本不同」警告

## 如果編輯器跳出版本衝突警告

處理方式：

1. 不要直接選覆蓋。
2. 取消這次儲存。
3. 重新載入磁碟上的 `index.html`。
4. 再重新貼一次。

這是為了避免把舊 buffer 的內容整份寫回去。

## 套用前的快速檢查

在 `index.layout-applied (1).html` 內至少確認這些欄位還在：

- `desktop`
- `mobile`
- `rat-city-pager`
- `__ratCityEndingCardV12`

如果缺少這些欄位，通常代表你匯出時頁面不是最新版本。

## 最穩的實務建議

如果只是調 UI：

- 平常優先用做法 B，只替換 `UI_LAYOUT_DEFAULTS`

如果是你剛匯出、很確定沒有其他程式碼變動：

- 才用做法 A，直接整份覆蓋 `index.html`
