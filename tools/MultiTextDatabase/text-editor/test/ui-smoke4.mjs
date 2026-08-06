// UI 冒烟 4：换行保存格式——输入多行 → 另存为 → 读回文件验证 <br> / \n 两种模式
import { chromium } from "playwright-core";

const BASE = process.env.UI_BASE || "http://localhost:3001/";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push("[console] " + m.text()); });
page.on("pageerror", (e) => errors.push("[pageerror] " + e.message));

async function readFile(name) {
    const r = await page.request.get(BASE + "api/file?name=" + name);
    return r.ok() ? (await r.json()).data : null;
}
async function delFile(name) {
    await page.request.delete(BASE + "api/file?name=" + name);
}

try {
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForSelector(".file-item", { timeout: 8000 });

    // 打开 db.json
    await page.locator(".file-item", { hasText: "db" }).click();
    await page.waitForTimeout(800);
    const ta = page.locator(".card-input").first();
    await ta.fill("第一行\n第二行\n第三行");

    // 默认 br 模式 → 另存为 ui_lb_test
    await page.locator(".tool-btn", { hasText: "另存为" }).click();
    await page.waitForTimeout(400);
    await page.locator(".modal input").fill("ui_lb_test");
    await page.locator(".modal .primary").click();
    await page.waitForTimeout(800);

    const data1 = await readFile("ui_lb_test");
    const v1 = data1 && Object.values(Object.values(data1)[0])[0];
    console.log("br 模式保存结果:", JSON.stringify(v1), "→ 期望含 <br>:", typeof v1 === "string" && v1.includes("<br>"));

    // 切 \n 模式 → 另存为 ui_lb_test2
    await page.locator(".lb-switch button", { hasText: "\\n" }).click();
    await page.locator(".tool-btn", { hasText: "另存为" }).click();
    await page.waitForTimeout(400);
    await page.locator(".modal input").fill("ui_lb_test2");
    await page.locator(".modal .primary").click();
    await page.waitForTimeout(800);

    const data2 = await readFile("ui_lb_test2");
    const v2 = data2 && Object.values(Object.values(data2)[0])[0];
    console.log("n 模式保存结果:", JSON.stringify(v2), "→ 期望含字面\\n:", typeof v2 === "string" && v2.includes("\\n"));

    // 打开含 <br> 的文件 → 编辑器应显示为多行
    await page.locator(".file-item", { hasText: "ui_lb_test.json" }).click();
    await page.waitForTimeout(600);
    const taValue = await page.locator(".card-input").first().inputValue();
    console.log("打开 br 文件后编辑器显示行数:", taValue.split("\n").length, "（期望 3）");

    // 清理
    await delFile("ui_lb_test");
    await delFile("ui_lb_test2");
    console.log("测试文件已清理");

    console.log("--- 控制台错误 ---");
    console.log(errors.length ? errors.join("\n") : "（无）");
} catch (e) {
    console.log("FAIL:", e.message);
    console.log("--- 控制台错误 ---");
    console.log(errors.join("\n"));
} finally {
    await browser.close();
}
