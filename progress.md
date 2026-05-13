Original prompt: 我們將繼續開發這款名為「人頭老鼠」的 3D 手機網頁遊戲原型。為了在手機瀏覽器上達到極致的載入速度與極低的運算負擔，我決定全盤採用「復古 PS1 風格」（Retro PS1 style）與低多邊形像素藝術的視覺表現。請你作為資深圖形程式設計師，使用 Three.js 為我撰寫一段基礎的場景與視覺渲染程式碼（Proof of Concept），並嚴格遵守以下四項效能優化與視覺規範：一、停用紋理平滑過濾。二、採用無光照材質。三、實作 2D 廣告牌技術。四、提供完整單頁 HTML。並使用 asset/photos 的牆壁塗鴉圖片貼在建築表面上，修正老鼠控制邏輯、bite 功能與清潔人員清潔行為，同時規劃技術堆疊與模組，並提供自拍動態臉部貼圖與寄生控制轉移的 POC。

- 2026-05-13: 確認專案為單檔 `index.html`，既有 PS1 低解析渲染、自拍 modal、寄生切換、Sprite 場景骨架已存在。
- 2026-05-13: 發現塗鴉載入清單錯誤，程式硬編碼 `5.jpg/6.jpg/7.jpg`，實際素材為 `asset/photos/*.png`。
- 2026-05-13: 發現 cleaner 目前只有不同移動速度，沒有 tidy 狀態機；需要補上 seek/tidy 行為與 chaos 回收。
- 2026-05-13: 下一步將修正貼圖名單、bite 提示/距離、cleaner 行為與測試 hook。
- 2026-05-13: 已把 `asset/photos` 的實際 `.png` 檔名接回塗鴉載入流程，建築牆面會使用使用者提供的塗鴉素材。
- 2026-05-13: 已加入 cleaner 的 `seek -> tidy -> restore` 流程、prop 回正與 chaos 降低邏輯，並保證每個 chunk 至少出現清潔工。
- 2026-05-13: 已加入 `window.render_game_to_text()` 與 `window.advanceTime(ms)` 測試 hook，並用 Node 對抽出的 module script 做過語法檢查。
- 2026-05-13: 馬路地板已改用貼近使用者附圖的灰色柏油顆粒紋理生成器 `makeRoadReferenceTexture()`；若之後提供實體檔案可再切為真貼圖。
- 2026-05-13: 已把人類角色載入方向切到 `player_main.glb` + 其餘 `player_*.glb` clips，並額外接上 `tripo_model_basecolor.JPEG` 當貼皮。
- 2026-05-13: 老鼠已改成 2D billboard 動畫結構與腿部擺動；若使用者將提供的參考圖另存為 `asset/photos/rat_reference.png`，程式會自動優先載入。
- 2026-05-13: 場景塗鴉覆蓋率已提高，並新增變電箱 / utility cabinet 類型物件承接塗鴉。
- 2026-05-14: 場景可見 chunk 視窗由 `1` 擴到 `3`，並移除 `ensureChunksAroundX()` 的早退，初始化與行進中都會穩定預生成前後段，減少兩端封閉感。
- 2026-05-14: 建築外皮改為白灰小方磚牆基底，ground-floor 也共用同類材質，再把塗鴉平面壓在其上。
- 2026-05-14: 攤販加入髒污帆布、木紋、金屬檯面與桶子等細節，避免純色方塊感。
- 2026-05-14: 人類 GLB 載入流程補齊 `tripo_model_normal/roughness/metallic`，並沿用 `flipY=false` + feet-to-ground 校正，讓皮膚結構更接近 `urban-legend-framework` 的作法。
- 2026-05-14: 場景延伸窗口再擴到 `4` 個 chunk，霧距同步拉遠，讓建築、地板、攤販前後持續銜接生成，降低可見終點感。
- 2026-05-14: 牆面塗鴉改成小中大型混貼；最小寬度提升到原本的 `1.5x`，最大 mural 提升到原本的 `5x`，並提高整體牆面覆蓋率。
