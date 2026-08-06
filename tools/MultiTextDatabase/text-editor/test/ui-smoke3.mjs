// UI 冒烟 3：目录设置流程——点目录条 → 弹窗出现 → 输入路径 → 确定 → 文件列表更新
import { chromium } from "playwright-core";

const BASE = process.env.UI_BASE || "http://localhost:3001/";
const TEST_DIR = process.env.TEST_DIR || "E:\\02-个人创作\\游戏\\GF插件公测版v1.19(密码g)\\dataEx\\Scenario";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push("[console] " + m.text()); });
page.on("pageerror", (e) => errors.push("[pageerror] " + e.message));

try {
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForSelector(".file-item", { timeout: 8000 });
    console.log("PASS 界面就绪，文件数:", await page.locator(".file-item").count());

    // 1. 点击目录条
    await page.locator(".workdir-bar").click();
    await page.waitForTimeout(500);
    const dialogVisible = await page.locator(".workdir-dialog").isVisible().catch(() => false);
    console.log("点击目录条后弹窗出现:", dialogVisible ? "是" : "否");

    // 2. 输入路径并确定
    await page.locator(".workdir-dialog input").fill(TEST_DIR);
    await page.locator(".workdir-dialog .modal-actions .primary").click();
    await page.waitForTimeout(1000);

    // 3. 验证：弹窗关闭 + 文件列表更新 + 目录条显示末段
    const dialogGone = !(await page.locator(".workdir-dialog").isVisible().catch(() => false));
    const fileCount = await page.locator(".file-item").count();
    const barText = await page.locator(".workdir-path").textContent();
    console.log("弹窗已关闭:", dialogGone ? "是" : "否");
    console.log("文件列表数:", fileCount);
    console.log("目录条显示:", barText.trim());

    // 4. 输入非法路径 → 应报错
    await page.locator(".workdir-bar").click();
    await page.locator(".workdir-dialog input").fill("Z:\\不存在的目录\\xxx");
    await page.locator(".workdir-dialog .modal-actions .primary").click();
    await page.waitForTimeout(800);
    const errText = await page.locator(".status-msg").textContent();
    console.log("非法路径提示:", errText.trim());
    const dialogStill = await page.locator(".workdir-dialog").isVisible().catch(() => false);
    console.log("错误后弹窗保持:", dialogStill ? "是" : "否（应保持）");

    console.log("--- 控制台错误 ---");
    console.log(errors.length ? errors.join("\n") : "（无）");
} catch (e) {
    console.log("FAIL:", e.message);
    console.log("--- 控制台错误 ---");
    console.log(errors.join("\n"));
} finally {
    await browser.close();
}
