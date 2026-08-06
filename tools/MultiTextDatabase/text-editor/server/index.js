//=============================================================================
// 文本 json 库编辑器 - 后端（Express）
// 工作目录由用户在界面上通过系统文件夹选择器指定（/api/pick-dir），
// 所有读写与另存为都直接落在该目录中。仅供本机使用：仅绑定 127.0.0.1。
//=============================================================================

import express from "express";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import {
    safeBaseName,
    backupIfExists,
    writeFileAtomic,
    listJsonFiles
} from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 工具安装位置的上级目录；发布版（WORK_ROOT 环境变量）与集成测试可覆盖
const PROJECT_ROOT = process.env.PROJECT_ROOT
    ? path.resolve(process.env.PROJECT_ROOT)
    : path.resolve(__dirname, "../../..");
const API_PORT = Number(process.env.API_PORT || 3001);
const HOST = "127.0.0.1";

// 初始工作根：环境变量指定 > 工具位于游戏项目内时默认 dataEx/Scenario > 未选择（null）
let workRoot = null;
if (process.env.WORK_ROOT) {
    workRoot = path.resolve(process.env.WORK_ROOT);
} else {
    const def = path.join(PROJECT_ROOT, "dataEx", "Scenario");
    try {
        if (fs.statSync(def).isDirectory()) workRoot = def;
    } catch (e) { /* 未安装于游戏项目内，稍后由用户选择 */ }
}

const app = express();
app.use(express.json({ limit: "10mb" }));

function send(res, ok, payload, status = 200) {
    res.status(status).json(Object.assign({ ok }, payload));
}

// 未选择目录时统一返回 400
function requireRoot(res) {
    if (!workRoot) {
        send(res, false, { error: "请先选择文本库目录" }, 400);
        return false;
    }
    return true;
}

// 当前工作根下的文件路径（文件名已通过白名单校验）
function rootFilePath(name) {
    return path.join(workRoot, name + ".json");
}

// 校验目录存在且是目录；成功返回规范化绝对路径，否则返回 null
function validDir(abs) {
    try {
        return fs.statSync(abs).isDirectory() ? path.resolve(abs) : null;
    } catch (e) {
        return null;
    }
}

// 系统文件夹选择器（异步：Windows 系统文件夹对话框，FolderBrowserDialog 实测可弹）
// 返回 Promise<绝对路径 | null>；null = 用户取消；异常 reject。
// 注意：必须异步（不能用 spawnSync），否则弹窗等待期间会阻塞整个服务的所有请求。
function pickDirViaSystemDialog(timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
        const script = [
            "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
            "Add-Type -AssemblyName System.Windows.Forms",
            "$d = New-Object System.Windows.Forms.FolderBrowserDialog",
            "$d.Description = '选择文本库目录（存放 json 的文件夹）'",
            "$d.ShowNewFolderButton = $true",
            "$r = $d.ShowDialog()",
            "if ($r -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.SelectedPath }"
        ].join("; ");
        // WinForms 对话框需要 STA 线程
        const child = spawn("powershell", ["-NoProfile", "-STA", "-Command", script], {
            windowsHide: true
        });
        let stdout = "";
        let stderr = "";
        let settled = false;
        const timer = setTimeout(() => {
            child.kill();
            reject(new Error("目录选择器超时（请检查是否弹出了系统窗口）"));
        }, timeoutMs);
        child.stdout.on("data", (d) => { stdout += String(d); });
        child.stderr.on("data", (d) => { stderr += String(d); });
        child.on("error", (err) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            reject(err);
        });
        child.on("close", (code) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (code !== 0) {
                const detail = stderr.trim() || ("进程退出码 " + code);
                reject(new Error("目录选择器执行失败：" + detail.slice(0, 200)));
                return;
            }
            const out = stdout
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean)
                .pop();
            resolve(out || null); // 正常退出但无输出 = 用户取消
        });
    });
}

// ---------------------------------------------------------------------------
// 路由
// ---------------------------------------------------------------------------

// 基本信息：当前工作根（绝对路径，可能为 null）与文件列表
app.get("/api/status", (req, res) => {
    send(res, true, {
        workRoot: workRoot,
        files: workRoot ? listJsonFiles(workRoot) : []
    });
});

// 系统文件夹选择器：弹出系统对话框，选定后作为工作根；取消返回 cancelled
app.post("/api/pick-dir", async (req, res) => {
    let picked = null;
    try {
        picked = await pickDirViaSystemDialog();
    } catch (e) {
        return send(res, false, { error: "无法打开目录选择器：" + e.message }, 500);
    }
    if (!picked) return send(res, true, { cancelled: true });
    const abs = validDir(picked);
    if (!abs) return send(res, false, { error: "所选目录不可用：" + picked }, 400);
    workRoot = abs;
    send(res, true, { workRoot, files: listJsonFiles(workRoot) });
});

// 获取当前工作根
app.get("/api/workdir", (req, res) => {
    send(res, true, { workRoot });
});

// 直接设置工作根（绝对路径，须为已存在目录；供恢复上次目录与测试使用）
app.post("/api/workdir", (req, res) => {
    const raw = String((req.body && req.body.dir) || "").trim();
    if (!raw) return send(res, false, { error: "目录不能为空" }, 400);
    const abs = validDir(raw);
    if (!abs) return send(res, false, { error: "目录不存在或不可用：" + raw }, 400);
    workRoot = abs;
    send(res, true, { workRoot, files: listJsonFiles(workRoot) });
});

// 文件列表（当前工作根下 *.json 基名）
app.get("/api/files", (req, res) => {
    if (!requireRoot(res)) return;
    send(res, true, { files: listJsonFiles(workRoot) });
});

// 读取文件（返回解析后的对象；解析失败返回 422 与错误信息）
app.get("/api/file", (req, res) => {
    if (!requireRoot(res)) return;
    const name = safeBaseName(req.query.name);
    if (!name) return send(res, false, { error: "文件名不合法" }, 400);
    const p = rootFilePath(name);
    if (!fs.existsSync(p)) return send(res, false, { error: "文件不存在：" + name + ".json" }, 404);
    try {
        const raw = fs.readFileSync(p, "utf8");
        const data = JSON.parse(raw);
        send(res, true, { name, data });
    } catch (e) {
        send(res, false, { error: "JSON 解析失败：" + e.message, name }, 422);
    }
});

// 保存文件（写前备份 + 结构校验 + 原子写入）
app.post("/api/file", (req, res) => {
    if (!requireRoot(res)) return;
    const name = safeBaseName(req.body && req.body.name);
    if (!name) return send(res, false, { error: "文件名不合法" }, 400);
    const data = req.body && req.body.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return send(res, false, { error: "数据必须为对象" }, 400);
    }
    const p = rootFilePath(name);
    try {
        backupIfExists(p);
        writeFileAtomic(p, JSON.stringify(data, null, "\t") + "\n");
        send(res, true, { name, savedAt: new Date().toISOString() });
    } catch (e) {
        send(res, false, { error: "保存失败：" + e.message }, 500);
    }
});

// 新建文件（空对象 {}）
app.post("/api/file/new", (req, res) => {
    if (!requireRoot(res)) return;
    const name = safeBaseName(req.body && req.body.name);
    if (!name) return send(res, false, { error: "文件名不合法" }, 400);
    const p = rootFilePath(name);
    if (fs.existsSync(p)) return send(res, false, { error: "文件已存在：" + name + ".json" }, 409);
    try {
        writeFileAtomic(p, "{}\n");
        send(res, true, { name });
    } catch (e) {
        send(res, false, { error: "新建失败：" + e.message }, 500);
    }
});

// 重命名文件（连同 .bak 一并迁移）
app.post("/api/file/rename", (req, res) => {
    if (!requireRoot(res)) return;
    const oldName = safeBaseName(req.body && req.body.oldName);
    const newName = safeBaseName(req.body && req.body.newName);
    if (!oldName || !newName) return send(res, false, { error: "文件名不合法" }, 400);
    if (oldName === newName) return send(res, false, { error: "新旧文件名相同" }, 400);
    const from = rootFilePath(oldName);
    const to = rootFilePath(newName);
    if (!fs.existsSync(from)) return send(res, false, { error: "文件不存在：" + oldName + ".json" }, 404);
    if (fs.existsSync(to)) return send(res, false, { error: "目标文件已存在：" + newName + ".json" }, 409);
    try {
        fs.renameSync(from, to);
        if (fs.existsSync(from + ".bak")) fs.renameSync(from + ".bak", to + ".bak");
        send(res, true, { name: newName });
    } catch (e) {
        send(res, false, { error: "重命名失败：" + e.message }, 500);
    }
});

// 删除文件（连同 .bak 一并清理）
app.delete("/api/file", (req, res) => {
    if (!requireRoot(res)) return;
    const name = safeBaseName(req.query.name);
    if (!name) return send(res, false, { error: "文件名不合法" }, 400);
    const p = rootFilePath(name);
    if (!fs.existsSync(p)) return send(res, false, { error: "文件不存在：" + name + ".json" }, 404);
    try {
        fs.unlinkSync(p);
        if (fs.existsSync(p + ".bak")) fs.unlinkSync(p + ".bak");
        send(res, true, { name });
    } catch (e) {
        send(res, false, { error: "删除失败：" + e.message }, 500);
    }
});

// 另存为：直接保存到当前工作根（仅输入新文件名），带备份与校验
app.post("/api/save-as", (req, res) => {
    if (!requireRoot(res)) return;
    const name = safeBaseName(req.body && req.body.name);
    const data = req.body && req.body.data;
    if (!name) return send(res, false, { error: "文件名不合法" }, 400);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return send(res, false, { error: "数据必须为对象" }, 400);
    }
    const p = rootFilePath(name);
    try {
        backupIfExists(p);
        writeFileAtomic(p, JSON.stringify(data, null, "\t") + "\n");
        send(res, true, { name, workRoot, savedAt: new Date().toISOString() });
    } catch (e) {
        send(res, false, { error: "保存失败：" + e.message }, 500);
    }
});

// ---------------------------------------------------------------------------
// 生产模式：托管前端构建产物（dist 存在时）
// ---------------------------------------------------------------------------
const distDir = path.join(__dirname, "../dist");
if (fs.existsSync(distDir)) {
    // no-store：防止浏览器缓存旧的页面/JS 导致前后端版本不匹配
    app.use(express.static(distDir, {
        etag: false,
        setHeaders: (res) => {
            res.setHeader("Cache-Control", "no-store");
        }
    }));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.listen(API_PORT, HOST, () => {
    console.log("[文本json编辑器] 后端已启动（仅本机 127.0.0.1:" + API_PORT + "）");
    console.log("  当前工作根: " + (workRoot || "未选择（请在界面选择文本库目录）"));
    console.log("  界面:       npm run build 后访问 http://localhost:" + API_PORT);
    console.log("  开发模式:   npm run dev 后访问 http://localhost:5173");
});
