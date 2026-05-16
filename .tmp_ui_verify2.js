const { chromium } = require('C:/Users/ACER/AppData/Roaming/npm/node_modules/playwright');
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:960}});
  await page.goto('http://127.0.0.1:8000/index.html');
  await page.waitForTimeout(2500);
  await page.keyboard.press('Shift+C');
  await page.waitForTimeout(700);
  const ids=['jump-btn','bite-btn','rats-box','chaos-box','rat-city-btn','joystick-zone'];
  const overlayResults=[];
  for(const id of ids){
    const box=page.locator(`.ui-layout-box[data-target-id="${id}"]`);
    const count=await box.count();
    if(!count){ overlayResults.push({id,exists:false}); continue; }
    const rect=await box.boundingBox();
    const before=await page.evaluate(id=>JSON.parse(JSON.stringify(window.__uiLayoutConfig.desktop[id]||null)),id);
    await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
    await page.mouse.down();
    await page.mouse.move(rect.x+rect.width/2+24,rect.y+rect.height/2+12,{steps:6});
    await page.mouse.up();
    await page.waitForTimeout(60);
    const after=await page.evaluate(id=>JSON.parse(JSON.stringify(window.__uiLayoutConfig.desktop[id]||null)),id);
    overlayResults.push({id,moved:!!before&&!!after&&(before.x!==after.x||before.y!==after.y)});
  }
  await page.reload();
  await page.waitForTimeout(2500);
  await page.keyboard.press('Shift+C');
  await page.waitForTimeout(700);
  const directTargets=[
    {id:'jump-btn',sel:'#jump-btn'},
    {id:'bite-btn',sel:'#bite-btn'},
    {id:'rats-box',sel:'#rats-box'},
    {id:'chaos-box',sel:'#chaos-box'},
    {id:'joystick-zone',sel:'#joystick-zone'}
  ];
  const directResults=[];
  for(const item of directTargets){
    const loc=page.locator(item.sel);
    const rect=await loc.boundingBox();
    const before=await page.evaluate(id=>JSON.parse(JSON.stringify(window.__uiLayoutConfig.desktop[id]||null)),item.id);
    await page.mouse.move(rect.x+Math.max(10,rect.width/2),rect.y+Math.max(10,rect.height/2));
    await page.mouse.down();
    await page.mouse.move(rect.x+Math.max(10,rect.width/2)+24,rect.y+Math.max(10,rect.height/2)+12,{steps:6});
    await page.mouse.up();
    await page.waitForTimeout(60);
    const after=await page.evaluate(id=>JSON.parse(JSON.stringify(window.__uiLayoutConfig.desktop[id]||null)),item.id);
    directResults.push({id:item.id,moved:!!before&&!!after&&(before.x!==after.x||before.y!==after.y)});
  }
  const panel=await page.evaluate(async()=>{
    const p=document.querySelector('.ui-layout-object-panel');
    p.scrollTop=420;
    const before=p.scrollTop;
    document.querySelector('.ui-layout-object-row[data-target-id="bite-btn"]')?.click();
    const immediate=p.scrollTop;
    await new Promise(resolve=>requestAnimationFrame(resolve));
    return {before,immediate,raf:p.scrollTop};
  });
  console.log(JSON.stringify({overlayResults,directResults,panel},null,2));
  await browser.close();
})();
