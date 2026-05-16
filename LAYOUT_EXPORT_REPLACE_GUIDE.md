# Layout Export Replace Guide

檔案：`index.html`

## 目前這一版要取代的精確行號

把 `index.html` 的：

- 第 `4742` 行
- 到第 `4775` 行

整段全部取代掉。

不要改到第 `4776` 行，因為第 `4776` 行是下一段：

```js
const UI_LAYOUT_TARGET_DEFS=[
```

## 要被取代的起始符號

從這一行開始取代：

```js
const UI_LAYOUT_DEFAULTS={
```

## 要被取代的結束符號

取代到這一行為止：

```js
};
```

注意：

- 這個 `};` 是 `const UI_LAYOUT_DEFAULTS=` 這一整個物件的結尾。
- 這個 `};` 的下一行必須立刻是：

```js
const UI_LAYOUT_TARGET_DEFS=[
```

## 最穩定的取代方式

如果之後 `index.html` 行號變了，不要靠行號判斷，直接用下面這個規則：

1. 找到第一個：

```js
const UI_LAYOUT_DEFAULTS={
```

2. 往下找到它結束後、下一行剛好接著這個地方：

```js
const UI_LAYOUT_TARGET_DEFS=[
```

3. 把這兩者之間的整段 `UI_LAYOUT_DEFAULTS` 完整替換成 `Export` 複製出來的新 block。

## Export 後貼回去時的正確樣子

`Export` 產生的內容會長得像這樣：

```js
const UI_LAYOUT_DEFAULTS={
  desktop:{...},
  mobile:{...}
};
```

你要做的是：

- 保留 `const UI_LAYOUT_TARGET_DEFS=[` 這行以下的內容不動
- 只替換 `const UI_LAYOUT_DEFAULTS=` 這整段

## 一句話版

把 `index.html` 內：

```js
const UI_LAYOUT_DEFAULTS={
```

到下一個：

```js
const UI_LAYOUT_TARGET_DEFS=[
```

前一行為止的所有內容，全部換成 `Export` 產生的新 `const UI_LAYOUT_DEFAULTS=...;`
