// UI 冒烟：用系统 Edge（headless）打开页面，模拟点击文件/分组，抓取控制台错误
import { chromium } from "playwright-core";

const BASE = process.env.UI_BASE || "http://localhost:3001/";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push("[console] " + m.text()); });
page.on("pageerror", (e) => errors.push("[pageerror] " + e.message));

try {
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 15000 });
    // 等待界面就绪（文件列表出现）
    await page.waitForSelector(".file-item", { timeout: 8000 });
    console.log("PASS 界面已渲染，文件列表出现");

    const fileCount = await page.locator(".file-item").count();
    console.log("    文件数:", fileCount);

    // 1. 点击第一个文件
    await page.locator(".file-item").first().click();
    await page.waitForTimeout(800);
    const treeVisible = await page.locator(".key-tree").isVisible().catch(() => false);
    const cardsVisible = await page.locator(".key-card").count();
    console.log("点击文件后: 分组树可见=" + treeVisible + ", 卡片数=" + cardsVisible);

    // 2. 点击分组行（对象行）
    const groupRows = await page.locator(".tnode-row.object").count();
    console.log("分组行数:", groupRows);
    if (groupRows > 0) {
        await page.locator(".tnode-row.object").first().click();
        await page.waitForTimeout(500);
        const cardsAfter = await page.locator(".key-card").count();
        console.log("点击分组后卡片数:", cardsAfter);
    }

    // 3. 点击键（叶子行）
    const leafRows = await page.locator(".tnode-row.leaf").count();
    console.log("键行数:", leafRows);
    if (leafRows > 0) {
        await page.locator(".tnode-row.leaf").first().click();
        await page.waitForTimeout(500);
    }

    // 4. 点击卡片标题（复制按钮）
    const titles = await page.locator(".card-title").count();
    console.log("卡片标题数:", titles);
    if (titles > 0) {
        await page.locator(".card-title").first().click();
        await page.waitForTimeout(300);
        const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ""));
        console.log("点击卡片标题后剪贴板:", JSON.stringify(clip));
    }

    console.log("--- 控制台错误 ---");
    console.log(errors.length ? errors.join("\n") : "（无）");
} catch (e) {
    console.log("FAIL:", e.message);
    console.log("--- 控制台错误 ---");
    console.log(errors.join("\n"));
} finally {
    await browser.close();
}
