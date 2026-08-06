// reorder.js 单测：拖拽放置规则 + 节点移动
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDropInfo, moveNode, pathId, isAncestor, computeAppendInfo } from "../src/reorder.js";

// ---------- computeDropInfo ----------

test("computeDropInfo：拖到自身行无效", () => {
    const drag = { path: ["A"], kind: "group" };
    assert.equal(computeDropInfo(drag, ["A"], "group", 0.5), null);
});

test("computeDropInfo：拖到自己的后代无效", () => {
    const drag = { path: ["A"], kind: "group" };
    assert.equal(computeDropInfo(drag, ["A", "K"], "row", 0.5), null);
    assert.equal(computeDropInfo(drag, ["A", "B", "K"], "row", 0.3), null);
});

test("computeDropInfo：分组只能同级排序（拖到异级行无效）", () => {
    const drag = { path: ["A"], kind: "group" };
    // 同级分组行：上/下 = before/after（合法）
    assert.deepEqual(computeDropInfo(drag, ["B"], "group", 0.2), { path: ["B"], kind: "group", placement: "before" });
    assert.deepEqual(computeDropInfo(drag, ["B"], "group", 0.8), { path: ["B"], kind: "group", placement: "after" });
    // 拖到其它分组内部 / 异级键行：无效
    assert.equal(computeDropInfo(drag, ["B", "SUB"], "group", 0.5), null);
    assert.equal(computeDropInfo(drag, ["B", "K"], "row", 0.3), null);
    // 嵌套组拖到顶层组行：异级，无效
    assert.equal(computeDropInfo({ path: ["A", "SUB"], kind: "group" }, ["B"], "group", 0.5), null);
});

test("computeDropInfo：键拖到分组行三区（前/中/后）", () => {
    const drag = { path: ["A", "K1"], kind: "leaf" };
    assert.deepEqual(computeDropInfo(drag, ["B"], "group", 0.1), { path: ["B"], kind: "group", placement: "before" });
    assert.deepEqual(computeDropInfo(drag, ["B"], "group", 0.5), { path: ["B"], kind: "group", placement: "inside" });
    assert.deepEqual(computeDropInfo(drag, ["B"], "group", 0.9), { path: ["B"], kind: "group", placement: "after" });
});

test("computeDropInfo：键拖到普通行前后插入（可跨组）", () => {
    const drag = { path: ["A", "K1"], kind: "leaf" };
    assert.deepEqual(computeDropInfo(drag, ["B", "K2"], "row", 0.2), { path: ["B", "K2"], kind: "row", placement: "before" });
    assert.deepEqual(computeDropInfo(drag, ["B", "K2"], "row", 0.8), { path: ["B", "K2"], kind: "row", placement: "after" });
    // 同级键
    assert.deepEqual(computeDropInfo(drag, ["A", "K2"], "row", 0.2), { path: ["A", "K2"], kind: "row", placement: "before" });
});

test("computeDropInfo：空 drag / 空路径无效", () => {
    assert.equal(computeDropInfo(null, ["A"], "row", 0.5), null);
    assert.equal(computeDropInfo({ path: ["A"], kind: "leaf" }, [], "row", 0.5), null);
});

test("isAncestor / pathId 基础", () => {
    assert.equal(isAncestor(["A"], ["A", "K"]), true);
    assert.equal(isAncestor(["A"], ["B", "K"]), false);
    assert.equal(isAncestor(["A"], ["A"]), false);
    assert.equal(isAncestor(["A", "B"], ["A"]), false);
    assert.equal(pathId(["A", "B"]), '["A","B"]');
});

// ---------- moveNode ----------

const sample = () => ({
    A: { K1: "一", K2: "二", SUB: { S1: "x" } },
    B: { K3: "三", K4: "四" }
});
test("moveNode：同分组键排序（after）", () => {
    const doc = sample();
    const res = moveNode(doc, ["A", "K1"], { path: ["A"], anchor: "K2", mode: "after" });
    assert.deepEqual(Object.keys(res.doc.A), ["K2", "K1", "SUB"]);
    assert.equal(res.doc.A.K1, "一");
    assert.equal(res.changed, true);
});

test("moveNode：同分组键排序（before，源在锚点前）", () => {
    const doc = sample();
    const res = moveNode(doc, ["A", "K1"], { path: ["A"], anchor: "K2", mode: "before" });
    assert.deepEqual(Object.keys(res.doc.A), ["K1", "K2", "SUB"]); // 无变化但合法
    assert.equal(res.changed, true);
});

test("moveNode：同分组键排序（before，源在锚点后）", () => {
    const doc = sample();
    const res = moveNode(doc, ["A", "K2"], { path: ["A"], anchor: "K1", mode: "before" });
    assert.deepEqual(Object.keys(res.doc.A), ["K2", "K1", "SUB"]);
});

test("moveNode：append 到分组末尾", () => {
    const doc = sample();
    const res = moveNode(doc, ["A", "K1"], { path: ["A"], anchor: null, mode: "append" });
    assert.deepEqual(Object.keys(res.doc.A), ["K2", "SUB", "K1"]);
});

test("moveNode：键跨分组移动到另一分组锚点前", () => {
    const doc = sample();
    const res = moveNode(doc, ["A", "K1"], { path: ["B"], anchor: "K3", mode: "before" });
    assert.deepEqual(Object.keys(res.doc.A), ["K2", "SUB"]);
    assert.deepEqual(Object.keys(res.doc.B), ["K1", "K3", "K4"]);
    assert.equal(res.doc.B.K1, "一");
});

test("moveNode：键跨分组 append", () => {
    const doc = sample();
    const res = moveNode(doc, ["A", "K1"], { path: ["B"], anchor: null, mode: "append" });
    assert.deepEqual(Object.keys(res.doc.B), ["K3", "K4", "K1"]);
    assert.deepEqual(Object.keys(res.doc.A), ["K2", "SUB"]);
});

test("moveNode：键拖到顶层", () => {
    const doc = sample();
    const res = moveNode(doc, ["A", "K1"], { path: [], anchor: null, mode: "append" });
    assert.deepEqual(Object.keys(res.doc), ["A", "B", "K1"]);
    assert.equal(res.doc.K1, "一");
    assert.deepEqual(Object.keys(res.doc.A), ["K2", "SUB"]);
});

test("moveNode：顶层分组排序", () => {
    const doc = sample();
    const res = moveNode(doc, ["A"], { path: [], anchor: "B", mode: "after" });
    assert.deepEqual(Object.keys(res.doc), ["B", "A"]);
    // 分组值引用未变
    assert.deepEqual(res.doc.A, doc.A);
});

test("moveNode：键从顶层移入分组", () => {
    const doc = { T1: "顶层", B: { K: "x" } };
    const res = moveNode(doc, ["T1"], { path: ["B"], anchor: null, mode: "append" });
    assert.deepEqual(Object.keys(res.doc), ["B"]);
    assert.deepEqual(Object.keys(res.doc.B), ["K", "T1"]);
});

test("moveNode：防止移入自身 / 后代", () => {
    const doc = sample();
    assert.equal(moveNode(doc, ["A"], { path: ["A"], anchor: null, mode: "append" }).changed, false);
    assert.equal(moveNode(doc, ["A"], { path: ["A", "SUB"], anchor: null, mode: "append" }).changed, false);
});

test("moveNode：无效路径 / 非对象目标不变更", () => {
    const doc = sample();
    assert.equal(moveNode(doc, ["A", "K1"], { path: ["A", "K2"], anchor: null, mode: "append" }).changed, false); // 目标父是字符串
    assert.equal(moveNode(doc, ["Nope"], { path: [], anchor: null, mode: "append" }).changed, false);
    assert.equal(moveNode(doc, ["A", "K1"], { path: ["A", "SUB", "S1"], anchor: null, mode: "append" }).changed, false); // 目标父是字符串
});

test("moveNode：同父无实际位移时保持顺序", () => {
    const doc = sample();
    const res = moveNode(doc, ["B", "K4"], { path: ["B"], anchor: "K4", mode: "before" });
    assert.deepEqual(Object.keys(res.doc.B), ["K3", "K4"]);
});

test("moveNode：同父 after 无实际位移时保持顺序", () => {
    const doc = sample();
    const res = moveNode(doc, ["B", "K3"], { path: ["B"], anchor: "K3", mode: "after" });
    assert.deepEqual(Object.keys(res.doc.B), ["K3", "K4"]);
    assert.equal(res.doc.B.K4, "四");
});

test("moveNode：跨父目标已有同名键时拒绝且不破坏原文档", () => {
    const doc = { A: { K1: "一", K3: "甲组三" }, B: { K3: "乙组三" } };
    const res = moveNode(doc, ["B", "K3"], { path: ["A"], anchor: null, mode: "append" });
    assert.equal(res.changed, false);
    assert.equal(res.reason, "duplicate-key");
    // 源仍在原处、目标值未被覆盖
    assert.equal(res.doc.B.K3, "乙组三");
    assert.equal(res.doc.A.K3, "甲组三");
    assert.equal(res.doc.A.K1, "一");
    assert.deepEqual(Object.keys(res.doc.B), ["K3"]);
});

test("moveNode：__proto__ 键不污染原型（Object.create(null) 重建）", () => {
    const doc = JSON.parse('{"A":{"__proto__":"x"},"B":{}}');
    const res = moveNode(doc, ["A", "__proto__"], { path: ["B"], anchor: null, mode: "append" });
    assert.equal(res.changed, true);
    assert.equal(res.doc.B.__proto__, "x");
    assert.equal(Object.getPrototypeOf(res.doc.B), null);
    assert.equal({}.polluted, undefined);
});

// ---------- computeAppendInfo ----------

test("computeAppendInfo：键可 append 到任意分组 / 顶层", () => {
    const drag = { path: ["A", "K1"], kind: "leaf" };
    assert.deepEqual(computeAppendInfo(drag, ["B"]), { path: ["B"], kind: "row", placement: "append" });
    assert.deepEqual(computeAppendInfo(drag, []), { path: [], kind: "row", placement: "append" });
});

test("computeAppendInfo：分组仅允许同级 append", () => {
    const drag = { path: ["A"], kind: "group" };
    // 顶层组 → 顶层末尾：允许
    assert.deepEqual(computeAppendInfo(drag, []), { path: [], kind: "row", placement: "append" });
    // 顶层组 → 其它分组内部：拒绝
    assert.equal(computeAppendInfo(drag, ["B"]), null);
    // 嵌套组 → 顶层：拒绝
    assert.equal(computeAppendInfo({ path: ["A", "SUB"], kind: "group" }, []), null);
    // 嵌套组 → 自身同级父：允许
    assert.deepEqual(
        computeAppendInfo({ path: ["A", "SUB"], kind: "group" }, ["A"]),
        { path: ["A"], kind: "row", placement: "append" }
    );
});

test("computeAppendInfo：不能 append 到自身或自己的后代", () => {
    assert.equal(computeAppendInfo({ path: ["A"], kind: "group" }, ["A"]), null);
    assert.equal(computeAppendInfo({ path: ["A"], kind: "group" }, ["A", "SUB"]), null);
    assert.equal(computeAppendInfo(null, []), null);
});
