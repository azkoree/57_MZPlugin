// 后端安全函数最小单测（node:test，node 18+）
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import {
    safeBaseName,
    backupIfExists,
    writeFileAtomic
} from "../server/utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 测试用根目录（取项目 tools 目录，避免动到真实游戏文件）
const ROOT = path.resolve(__dirname, "..");

test("safeBaseName 文件名白名单", () => {
    assert.equal(safeBaseName("ch01"), "ch01");
    assert.equal(safeBaseName("测试库.json"), "测试库");
    assert.equal(safeBaseName("a_b-c1"), "a_b-c1");
    assert.equal(safeBaseName("a b"), null);          // 空格
    assert.equal(safeBaseName("a/b"), null);          // 斜杠
    assert.equal(safeBaseName("../x"), null);         // 穿越
    assert.equal(safeBaseName(""), null);             // 空
    assert.equal(safeBaseName("x!@#"), null);         // 特殊字符
});

test("backupIfExists 覆盖式备份旧内容", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gftest-"));
    try {
        const p = path.join(dir, "a.json");
        fs.writeFileSync(p, "old", "utf8");
        backupIfExists(p);
        assert.equal(fs.readFileSync(p + ".bak", "utf8"), "old");
        // 再次备份应覆盖为最新旧内容
        fs.writeFileSync(p, "old2", "utf8");
        backupIfExists(p);
        assert.equal(fs.readFileSync(p + ".bak", "utf8"), "old2");
        // 目标不存在时不应报错
        backupIfExists(path.join(dir, "missing.json"));
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

test("writeFileAtomic 原子替换（无 .tmp 残留）", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gftest-"));
    try {
        const p = path.join(dir, "a.json");
        fs.writeFileSync(p, "old", "utf8");
        writeFileAtomic(p, "new");
        assert.equal(fs.readFileSync(p, "utf8"), "new");
        assert.equal(fs.existsSync(p + ".tmp"), false);
        // 新文件同样可用
        const p2 = path.join(dir, "b.json");
        writeFileAtomic(p2, "hello");
        assert.equal(fs.readFileSync(p2, "utf8"), "hello");
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
