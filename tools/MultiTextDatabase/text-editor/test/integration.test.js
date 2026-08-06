// 后端 HTTP 集成测试：以独立端口 + 临时工作根启动服务，覆盖目录选择与文件读写
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(__dirname, "../server/index.js");
const PORT = 3011;
const BASE = "http://127.0.0.1:" + PORT;

let tmpProject = null;   // 模拟工具安装位置（无 dataEx/Scenario，workRoot 初始应为 null）
let tmpData = null;      // 模拟用户选定的文本库目录
let child = null;

async function call(urlPath, method = "GET", body) {
    const res = await fetch(BASE + urlPath, {
        method,
        headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* 非 JSON 响应 */ }
    return { status: res.status, data };
}

async function waitReady(timeout = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            const r = await fetch(BASE + "/api/status");
            if (r.ok) return;
        } catch (e) { /* 未就绪，重试 */ }
        await new Promise((r) => setTimeout(r, 150));
    }
    throw new Error("服务未在限定时间内启动");
}

before(async () => {
    tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), "gftest-proj-"));
    tmpData = fs.mkdtempSync(path.join(os.tmpdir(), "gftest-data-"));
    fs.writeFileSync(path.join(tmpData, "en.json"), '{"a":{"b":"c"}}\n', "utf8");
    fs.writeFileSync(path.join(tmpData, "db.json"), '{"x":"y"}\n', "utf8");

    child = spawn(process.execPath, [SERVER], {
        env: { ...process.env, API_PORT: String(PORT), PROJECT_ROOT: tmpProject },
        stdio: "ignore"
    });
    await waitReady();
});

after(() => {
    if (child) child.kill();
    if (tmpProject) fs.rmSync(tmpProject, { recursive: true, force: true });
    if (tmpData) fs.rmSync(tmpData, { recursive: true, force: true });
});

test("初始工作根为 null（未安装于游戏项目内时），文件操作返回提示", async () => {
    const { status, data } = await call("/api/status");
    assert.equal(status, 200);
    assert.equal(data.workRoot, null);
    assert.deepEqual(data.files, []);
    const { status: s2 } = await call("/api/files");
    assert.equal(s2, 400);
});

test("通过 /api/workdir 直接设置工作根（绝对路径）", async () => {
    const { status, data } = await call("/api/workdir", "POST", { dir: tmpData });
    assert.equal(status, 200);
    assert.equal(data.workRoot, path.resolve(tmpData));
    assert.deepEqual(data.files, ["db", "en"]);
});

test("工作根下读写/新建/重命名/删除/另存为全部落位", async () => {
    // 读
    const { status, data } = await call("/api/file?name=en");
    assert.equal(status, 200);
    assert.deepEqual(data.data, { a: { b: "c" } });
    // 保存 + .bak
    const { status: s1 } = await call("/api/file", "POST", { name: "en", data: { a: { b: "c2" } } });
    assert.equal(s1, 200);
    assert.ok(fs.existsSync(path.join(tmpData, "en.json.bak")));
    assert.equal(JSON.parse(fs.readFileSync(path.join(tmpData, "en.json.bak"), "utf8")).a.b, "c");
    // 新建
    const { status: s2 } = await call("/api/file/new", "POST", { name: "wdt" });
    assert.equal(s2, 200);
    // 重命名
    const { status: s3 } = await call("/api/file/rename", "POST", { oldName: "wdt", newName: "wdt2" });
    assert.equal(s3, 200);
    assert.ok(fs.existsSync(path.join(tmpData, "wdt2.json")));
    // 另存为（直接存工作根）
    const { status: s4 } = await call("/api/save-as", "POST", { name: "copy", data: { k: "v" } });
    assert.equal(s4, 200);
    assert.ok(fs.existsSync(path.join(tmpData, "copy.json")));
    // 删除
    const res = await fetch(BASE + "/api/file?name=wdt2", { method: "DELETE" });
    assert.equal(res.status, 200);
    assert.ok(!fs.existsSync(path.join(tmpData, "wdt2.json")));
});

test("非法工作根一律 400", async () => {
    for (const bad of ["", " ", path.join(tmpData, "en.json"), path.join(tmpData, "不存在")]) {
        const { status } = await call("/api/workdir", "POST", { dir: bad });
        assert.equal(status, 400, "应拒绝: " + JSON.stringify(bad));
    }
});

test("未选择目录时文件接口返回 400", async () => {
    // 先把工作根设回 null 的场景无法直接做到（没有重置接口），改为验证文件名校验优先于目录校验
    const { status } = await call("/api/file", "POST", { name: "../x", data: {} });
    assert.equal(status, 400);
});
