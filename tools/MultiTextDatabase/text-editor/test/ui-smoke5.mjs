// UI 冒烟（拖拽排序）：以临时工作根 + 独立端口启动生产服务（dist），
// 用系统 Edge（headless）模拟 HTML5 拖拽，验证：
//   A. 键拖入其它分组（树内 inside）
//   B. 右侧卡片拖拽排序（before）
//   C. 组与组同级排序（after）
//   D. 保存后文件键序正确
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(__dirname, "../server/index.js");
const PORT = 3223;
const BASE = "http://127.0.0.1:" + PORT;

const tmpData = fs.mkdtempSync(path.join(os.tmpdir(), "gftest-dnd-"));
const FILE = "t1";
fs.writeFileSync(
    path.join(tmpData, FILE + ".json"),
    JSON.stringify({ 甲组: { 键一: "1", 键二: "2" }, 乙组: { 键三: "3" } }, null, "\t") + "\n",
    "utf8"
);

let child = null;
const errors = [];

async function waitReady(timeout = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try { if ((await fetch(BASE + "/api/status")).ok) return; } catch (e) { /* 重试 */ }
        await new Promise((r) => setTimeout(r, 150));
    }
    throw new Error("服务未在限定时间内启动");
}

// 在页面内模拟一次拖拽：from 行拖到 to 行的 ratio 高度处
// 注意分步执行：dragstart 后需等 Vue 响应式更新 dragInfo props，再触发 dragover/drop
async function dnd(page, fromText, toText, ratio) {
    const r1 = await page.evaluate((fromText) => {
        const byText = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
        const from = Array.from(document.querySelectorAll(".tnode-row"))
            .concat(Array.from(document.querySelectorAll(".card-head")))
            .find((r) => byText(r).includes(fromText));
        if (!from) return "not-found";
        const dt = new DataTransfer();
        window.__dndDt = dt;
        window.__dndFrom = from;
        from.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt }));
        return "ok";
    }, fromText);
    if (r1 !== "ok") throw new Error("dnd 找不到源: " + fromText);
    await page.waitForTimeout(60);
    const r2 = await page.evaluate(([toText, ratio]) => {
        const byText = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
        const to = Array.from(document.querySelectorAll(".tnode-row"))
            .concat(Array.from(document.querySelectorAll(".key-card")))
            .find((r) => byText(r).includes(toText));
        if (!to) return "not-found";
        const dt = window.__dndDt;
        const rect = to.getBoundingClientRect();
        const clientY = rect.top + rect.height * ratio;
        to.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt, clientY }));
        to.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt, clientY }));
        return "ok";
    }, [toText, ratio]);
    if (r2 !== "ok") throw new Error("dnd 找不到目标: " + toText);
    await page.evaluate(() => {
        const dt = window.__dndDt;
        window.__dndFrom.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: dt }));
    });
}

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
page.on("console", (m) => { if (m.type() === "error") errors.push("[console] " + m.text()); });
page.on("pageerror", (e) => errors.push("[pageerror] " + e.message));

try {
    child = spawn(process.execPath, [SERVER], {
        env: { ...process.env, API_PORT: String(PORT), WORK_ROOT: tmpData },
        stdio: "ignore"
    });
    await waitReady();

    await page.goto(BASE, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForSelector(".file-item", { timeout: 8000 });
    await page.locator(".file-item", { hasText: FILE }).click();
    await page.waitForSelector(".tnode-row.object", { timeout: 8000 });
    await page.waitForTimeout(400);

    const groupOrder = () =>
        page.evaluate(() =>
            Array.from(document.querySelectorAll(".tnode-row.object"))
                .map((r) => (r.textContent || "").replace(/\s+/g, " ").trim())
        );

    // A. 键拖入其它分组：甲组.键一 → 乙组 行中间（inside）
    await dnd(page, "键一", "乙组", 0.5);
    await page.waitForTimeout(300);
    // 点乙组，右侧卡片应显示 键三、键一（键一被追加到末尾）
    await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll(".tnode-row"));
        const target = rows.find((r) => (r.textContent || "").includes("乙组"));
        target.click();
    });
    await page.waitForTimeout(400);
    const cardsA = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".card-title"))
            .map((t) => (t.textContent || "").trim())
    );
    console.log("A 键拖入其它分组后卡片顺序:", JSON.stringify(cardsA));
    if (!cardsA[0].includes("乙组.键三") || !cardsA[1].includes("乙组.键一")) {
        throw new Error("A 失败：预期 [乙组.键三, 乙组.键一]，实际 " + JSON.stringify(cardsA));
    }

    // B. 卡片拖拽排序：键一 卡片拖到 键三 卡片上方（before）
    const debugBefore = await page.evaluate(() => ({
        treeRows: Array.from(document.querySelectorAll(".tnode-row")).map((r) => (r.textContent || "").replace(/\s+/g, " ").trim()),
        cards: Array.from(document.querySelectorAll(".key-card")).map((c) => (c.textContent || "").replace(/\s+/g, " ").trim().slice(0, 20))
    }));
    console.log("B 之前 树行:", JSON.stringify(debugBefore.treeRows), "卡片:", JSON.stringify(debugBefore.cards));
    await dnd(page, "键一", "键三", 0.2);
    await page.waitForTimeout(300);
    const cardsB = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".card-title"))
            .map((t) => (t.textContent || "").trim())
    );
    console.log("B 卡片排序后顺序:", JSON.stringify(cardsB));
    if (!cardsB[0].includes("乙组.键一") || !cardsB[1].includes("乙组.键三")) {
        throw new Error("B 失败：预期 [乙组.键一, 乙组.键三]，实际 " + JSON.stringify(cardsB));
    }

    // C. 组与组同级排序：甲组 → 乙组 之后（after）
    await dnd(page, "甲组", "乙组", 0.8);
    await page.waitForTimeout(300);
    const orderC = await groupOrder();
    console.log("C 组排序后分组顺序:", JSON.stringify(orderC));
    if (!orderC[0].includes("乙组") || !orderC[1].includes("甲组")) {
        throw new Error("C 失败：预期 [乙组, 甲组]，实际 " + JSON.stringify(orderC));
    }

    // E. 拖拽重建后的分组（Object.create(null)）上新增键不崩溃
    page.once("dialog", (d) => d.accept("新增键E"));
    const clicked = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll(".tnode-row"));
        const row = rows.find((r) => (r.textContent || "").includes("甲组"));
        if (!row) return false;
        const addBtn = row.querySelector(".tnode-actions button");
        if (!addBtn) return false;
        addBtn.click();
        return true;
    });
    await page.waitForTimeout(300);
    const hasNewKey = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".tnode-row.leaf"))
            .some((r) => (r.textContent || "").includes("新增键E"))
    );
    console.log("E 拖拽后分组上新增键:", hasNewKey, "(按钮点击=" + clicked + ")");
    if (!clicked || !hasNewKey) throw new Error("E 失败：拖拽后的分组上新增键失败或崩溃");

    // F. 双击键名内联重命名（树内，无弹窗）
    await page.locator(".tnode-row.leaf .tnode-name", { hasText: "键二" }).first().dblclick();
    await page.waitForSelector(".tnode-edit", { timeout: 3000 });
    await page.keyboard.type("键二改");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    const renamed = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".tnode-row.leaf"))
            .some((r) => (r.textContent || "").includes("键二改"))
    );
    console.log("F 双击重命名后出现「键二改」:", renamed);
    if (!renamed) throw new Error("F 失败：双击重命名未生效");

    // G. 卡片标题双击内联重命名（右侧列表，无弹窗）
    await page.locator(".key-card .card-title", { hasText: "键二改" }).first().dblclick();
    await page.waitForSelector(".card-edit", { timeout: 3000 });
    await page.keyboard.type("键二最终");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    const renamedCard = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".card-title"))
            .some((t) => (t.textContent || "").includes("键二最终"))
    );
    console.log("G 卡片双击重命名后出现「键二最终」:", renamedCard);
    if (!renamedCard) throw new Error("G 失败：卡片双击重命名未生效");

    // D. 保存后文件键序正确
    await page.locator(".tool-btn.primary").click();
    await page.waitForTimeout(500);
    const saved = JSON.parse(fs.readFileSync(path.join(tmpData, FILE + ".json"), "utf8"));
    console.log("D 保存后文件顶层键序:", JSON.stringify(Object.keys(saved)), "乙组键序:", JSON.stringify(Object.keys(saved.乙组)));
    if (JSON.stringify(Object.keys(saved)) !== '["乙组","甲组"]') throw new Error("D 失败：顶层键序不正确");
    if (JSON.stringify(Object.keys(saved.乙组)) !== '["键一","键三"]') throw new Error("D 失败：乙组键序不正确");
    if (saved.甲组.键一 !== undefined) throw new Error("D 失败：键一仍残留在甲组");
    if (saved.甲组["键二最终"] !== "2") throw new Error("D 失败：重命名后的「键二最终」值不正确");
    if (saved.甲组.键二改 !== undefined) throw new Error("D 失败：旧键名「键二改」仍存在");

    console.log("--- 控制台错误 ---");
    console.log(errors.length ? errors.join("\n") : "（无）");
    if (errors.length) throw new Error("存在控制台错误");
    console.log("PASS 拖拽排序冒烟测试全部通过");
} catch (e) {
    console.log("FAIL:", e.message);
    console.log("--- 控制台错误 ---");
    console.log(errors.join("\n"));
    process.exitCode = 1;
} finally {
    if (child) child.kill();
    try { fs.rmSync(tmpData, { recursive: true, force: true }); } catch (e) { /* 忽略 */ }
    await browser.close();
}
