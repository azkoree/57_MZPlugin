// 换行格式转换单测
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    convertStrings,
    displayFromFile,
    toFileForm,
    LINE_BREAK_BR,
    LINE_BREAK_N
} from "../src/format.js";

test("displayFromFile：<br> 与字面 \\n 还原为换行", () => {
    assert.equal(displayFromFile("第一行<br>第二行"), "第一行\n第二行");
    assert.equal(displayFromFile("第一行<br/>第二行"), "第一行\n第二行");
    assert.equal(displayFromFile("第一行\\n第二行"), "第一行\n第二行");
    assert.equal(displayFromFile("a\\nb<br>c"), "a\nb\nc");
    // 真实换行原样保留
    assert.equal(displayFromFile("a\nb"), "a\nb");
});

test("toFileForm：br 模式", () => {
    assert.equal(toFileForm("第一行\n第二行", LINE_BREAK_BR), "第一行<br>第二行");
    assert.equal(toFileForm("a\nb\nc", LINE_BREAK_BR), "a<br>b<br>c");
    // 已有 <br> 字面内容保留（不重复转义）
    assert.equal(toFileForm("a<br>\nb", LINE_BREAK_BR), "a<br><br>b");
});

test("toFileForm：n 模式", () => {
    assert.equal(toFileForm("第一行\n第二行", LINE_BREAK_N), "第一行\\n第二行");
    assert.equal(toFileForm("a\nb", LINE_BREAK_N), "a\\nb");
});

test("convertStrings 递归处理嵌套结构，非字符串不动", () => {
    const data = { g: { t1: "a\nb", t2: 3 }, arr: ["x\ny"], n: null, b: true };
    const out = toFileForm(data, LINE_BREAK_BR);
    assert.equal(out.g.t1, "a<br>b");
    assert.equal(out.g.t2, 3);
    assert.deepEqual(out.arr, ["x<br>y"]);
    assert.equal(out.n, null);
    assert.equal(out.b, true);
});

test("往返一致（br 模式）", () => {
    const file = { g: { t: "你好<br>世界" } };
    const round = toFileForm(displayFromFile(file), LINE_BREAK_BR);
    // JSON.stringify 只比较自有可枚举属性，兼容 Object.create(null) 重建对象
    assert.equal(JSON.stringify(round), JSON.stringify(file));
});

test("往返一致（n 模式）", () => {
    const file = { g: { t: "你好\\n世界" } };
    const round = toFileForm(displayFromFile(file), LINE_BREAK_N);
    assert.equal(JSON.stringify(round), JSON.stringify(file));
});

test("convertStrings：__proto__ 键往返不丢失（Object.create(null) 重建）", () => {
    const file = JSON.parse('{"A":{"__proto__":"x","t":"y"}}');
    const round = toFileForm(displayFromFile(file), LINE_BREAK_BR);
    assert.equal(round.A.__proto__, "x");
    assert.equal(round.A.t, "y");
    // 不污染全局原型
    assert.equal({}.polluted, undefined);
});
