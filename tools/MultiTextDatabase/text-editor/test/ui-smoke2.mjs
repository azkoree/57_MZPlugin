// UI 冒烟 2：点击有内容的文件（db / en），验证分组树与卡片列表是否正常
import { chromium } from "playwright-core";

const BASE = process.env.UI_BASE || "http://localhost:3001/";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push("[console] " + m.text()); });
page.on("pageerror", (e) => errors.push("[pageerror] " + e.message));

try {
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForSelector(".file-item", { timeout: 8000 });
    const files = await page.locator(".file-item .file-name").allTextContents();
    console.log("文件列表:", files.join(", "));

    // 点击 db.json
    await page.locator(".file-item", { hasText: "db" }).click();
    await page.waitForTimeout(800);
    const groupNames = await page.locator(".tnode-row.object .tnode-name").allTextContents();
    console.log("db 分组:", groupNames.join(", "));
    const cardTitles = await page.locator(".card-title").allTextContents();
    console.log("db 卡片:", cardTitles.length + " 张, 前2张: " + cardTitles.slice(0, 2).join(" / "));

    // 点击分组行
    await page.locator(".tnode-row.object").first().click();
    await page.waitForTimeout(500);
    const cardsAfter = await page.locator(".key-card").count();
    console.log("点击分组后卡片数:", cardsAfter);

    // 输入测试：在卡片 textarea 输入文字
    const ta = page.locator(".card-input").first();
    await ta.click();
    await ta.fill("测试输入内容");
    const dirtyDot = await page.locator(".dirty-dot").count();
    console.log("输入后 dirty 标记:", dirtyDot > 0 ? "出现" : "无");

    // dirty 状态下点击另一个文件 → 应弹 confirm
    page.once("dialog", async (d) => { console.log("confirm 弹窗文案:", d.message()); await d.accept(); });
    await page.locator(".file-item", { hasText: "en" }).click();
    await page.waitForTimeout(800);
    const enGroups = await page.locator(".tnode-row.object .tnode-name").allTextContents();
    console.log("切到 en 后分组:", enGroups.join(", "));

    console.log("--- 控制台错误 ---");
    console.log(errors.length ? errors.join("\n") : "（无）");
} catch (e) {
    console.log("FAIL:", e.message);
    console.log("--- 控制台错误 ---");
    console.log(errors.join("\n"));
} finally {
    await browser.close();
}
