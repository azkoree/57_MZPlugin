// 后端工具函数（独立模块，便于单元测试）
import path from "path";
import fs from "fs";

// 文件名安全：仅允许字母/数字/下划线/中文/连字符，返回基名（不含 .json）
export function safeBaseName(name) {
    const s = String(name || "").trim().replace(/\.json$/i, "");
    return /^[A-Za-z0-9_\u4e00-\u9fa5\-]+$/.test(s) ? s : null;
}

// 保存前备份：目标已存在则复制为 同名.json.bak（覆盖式单份）
export function backupIfExists(p) {
    if (fs.existsSync(p)) {
        fs.copyFileSync(p, p + ".bak");
    }
}

// 原子写入：先写 .tmp 再 rename 替换，避免中途崩溃损坏原文件
export function writeFileAtomic(p, content) {
    const tmp = p + ".tmp";
    try {
        fs.writeFileSync(tmp, content, "utf8");
        fs.renameSync(tmp, p);
    } catch (e) {
        try { fs.unlinkSync(tmp); } catch (e2) { /* 忽略清理失败 */ }
        throw e;
    }
}

// 列出目录下所有 .json 文件的基名（按中文排序）
export function listJsonFiles(dir) {
    try {
        return fs.readdirSync(dir)
            .filter((n) => /\.json$/i.test(n) && fs.statSync(path.join(dir, n)).isFile())
            .map((n) => n.replace(/\.json$/i, ""))
            .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
    } catch (e) {
        return [];
    }
}
