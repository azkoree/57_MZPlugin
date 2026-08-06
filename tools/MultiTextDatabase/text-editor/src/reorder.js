// 拖拽排序 / 节点移动的纯逻辑（与 Vue 无关，便于单测）
//
// 数据模型：文本库是一个嵌套纯对象（JSON 对象）。对象键的先后顺序即显示/保存顺序
// （非纯数字键按插入顺序），因此"排序"= 重建对象的键序。
//
// 拖拽语义约定：
// - 分组（对象值）只能在同级内排序；不能拖入其它分组（避免组嵌套循环、避免误操作）。
// - 键（字符串值）可以同级排序，也可以拖到其它分组（含顶层）内部。
// - 悬停位置：ratio = 鼠标在目标行内的相对高度（0~1）。
//   * 普通行：上半 = 插入其前（before），下半 = 插入其后（after）；
//   * 分组行：上 35% = before，下 35% = after，中间 = 放入分组内部末尾（inside）。

export function pathId(path) {
    return JSON.stringify(path || []);
}

// ancestor 是否是 p 的严格祖先（不含自身）
export function isAncestor(ancestor, p) {
    if (ancestor.length >= p.length) return false;
    for (let i = 0; i < ancestor.length; i++) {
        if (ancestor[i] !== p[i]) return false;
    }
    return true;
}

function isPlainObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
}

// 自身属性检查（不用 in：__proto__/toString 等原型链键会误判）
function hasProp(obj, k) {
    return Object.prototype.hasOwnProperty.call(obj, k);
}

// 安全遍历：任一层缺失即返回 undefined
export function resolveAt(doc, path) {
    let cur = doc;
    for (const k of path) {
        if (cur === null || typeof cur !== "object") return undefined;
        cur = cur[k];
    }
    return cur;
}

// 计算一次拖拽悬停对应的放置信息（无效返回 null）
// drag: { path, kind: 'group'|'leaf' }
// targetPath: 悬停行的路径；targetKind: 'group'（分组行）| 'row'（其它行）
// ratio: 鼠标相对行顶的高度比例（0~1）
// 返回 { path: targetPath, kind: targetKind, placement: 'before'|'after'|'inside' }
export function computeDropInfo(drag, targetPath, targetKind, ratio) {
    if (!drag || !Array.isArray(targetPath) || targetPath.length === 0) return null;
    if (typeof ratio !== "number" || !isFinite(ratio)) ratio = 0.5;
    // 不能拖到自身
    if (pathId(drag.path) === pathId(targetPath)) return null;
    // 不能拖到自己的后代（防止把分组移进自己内部）
    if (isAncestor(drag.path, targetPath)) return null;
    const sameParent = pathId(drag.path.slice(0, -1)) === pathId(targetPath.slice(0, -1));

    if (targetKind === "group") {
        if (drag.kind === "group") {
            // 分组只能在同级内排序
            if (!sameParent) return null;
            return { path: targetPath, kind: "group", placement: ratio < 0.5 ? "before" : "after" };
        }
        // 键拖到分组行：上 35% 前 / 下 35% 后 / 中间放入分组内部
        if (ratio < 0.35) return { path: targetPath, kind: "group", placement: "before" };
        if (ratio > 0.65) return { path: targetPath, kind: "group", placement: "after" };
        return { path: targetPath, kind: "group", placement: "inside" };
    }
    // 普通行（键 / 只读值）：前后插入；分组拖到异级行无效
    if (drag.kind === "group" && !sameParent) return null;
    return { path: targetPath, kind: "row", placement: ratio < 0.5 ? "before" : "after" };
}

// 计算插入位置：keys 为"删除源之后"的键序数组
function anchorIndex(keys, to) {
    if (!to.anchor || to.mode === "append") return keys.length;
    const ai = keys.indexOf(to.anchor);
    if (ai === -1) return keys.length;
    return to.mode === "before" ? ai : ai + 1;
}

// 按 keys 顺序重建对象，并把 insertKey/insertValue 插到 idx 处
// 用 Object.create(null) 构造，避免数据含 __proto__ 键时污染原型
function rebuildWithInsert(oldObj, keys, insertKey, insertValue, idx) {
    const out = Object.create(null);
    for (let i = 0; i <= keys.length; i++) {
        if (i === idx) out[insertKey] = insertValue;
        if (i < keys.length) out[keys[i]] = oldObj[keys[i]];
    }
    return out;
}

// 把 parentPath 处的子对象替换为 newChild；顶层（空路径）时返回新的顶层对象
function replaceChild(doc, parentPath, newChild) {
    if (parentPath.length === 0) return newChild;
    const parent = resolveAt(doc, parentPath.slice(0, -1));
    if (!isPlainObject(parent)) return doc;
    parent[parentPath[parentPath.length - 1]] = newChild;
    return doc;
}

// 空白区（列表底部）拖拽的放置信息：等价于 append 到 toPath（目标父路径）末尾。
// 与 computeDropInfo 同规则：分组只能同级（源父必须等于 toPath），键可任意；
// 不能放到自身或自己的后代内部。无效返回 null。
export function computeAppendInfo(drag, toPath) {
    if (!drag || !Array.isArray(toPath)) return null;
    if (drag.kind === "group" && pathId(drag.path.slice(0, -1)) !== pathId(toPath)) return null;
    if (pathId(drag.path) === pathId(toPath)) return null;
    if (isAncestor(drag.path, toPath)) return null;
    return { path: toPath, kind: "row", placement: "append" };
}

// 移动节点。doc: 当前文档顶层对象；fromPath: 源节点路径（长度≥1）
// to: { path: 目标父路径, anchor: 锚点键名（插到其前/后）| null, mode: 'before'|'after'|'append' }
// 原地修改嵌套对象；若顶层对象被重排，返回新的顶层对象。
// 返回 { doc, changed }；跨父且目标父已有同名键时返回 { doc, changed:false, reason:'duplicate-key' }。
export function moveNode(doc, fromPath, to) {
    if (!Array.isArray(fromPath) || fromPath.length === 0 ||
        !to || !Array.isArray(to.path)) {
        return { doc, changed: false };
    }
    const fromKey = fromPath[fromPath.length - 1];
    const fromParentPath = fromPath.slice(0, -1);
    const fromParent = resolveAt(doc, fromParentPath);
    if (!isPlainObject(fromParent) || !hasProp(fromParent, fromKey)) return { doc, changed: false };
    const toParent = resolveAt(doc, to.path);
    if (!isPlainObject(toParent)) return { doc, changed: false };
    // 目标父不能是源自身或其后代
    if (pathId(to.path) === pathId(fromPath) || isAncestor(fromPath, to.path)) {
        return { doc, changed: false };
    }

    const value = fromParent[fromKey];
    const sameParent = pathId(fromParentPath) === pathId(to.path);
    let top = doc;

    if (sameParent) {
        // 锚点就是源自身：无实际位移（UI 层已阻止，纯函数层面防御）
        if (to.anchor === fromKey) return { doc, changed: false };
        const keys = Object.keys(fromParent).filter((k) => k !== fromKey);
        const idx = anchorIndex(keys, to);
        const newParent = rebuildWithInsert(fromParent, keys, fromKey, value, idx);
        top = replaceChild(top, fromParentPath, newParent);
        return { doc: top, changed: true };
    }

    // 跨父：目标父已有同名键会覆盖丢数据，在任何修改之前拒绝
    if (hasProp(toParent, fromKey)) return { doc, changed: false, reason: "duplicate-key" };
    // 先删源，再插入目标（目标父若在源内，删除后需重新定位）
    const fromKeys = Object.keys(fromParent).filter((k) => k !== fromKey);
    const newFrom = Object.create(null);
    for (const k of fromKeys) newFrom[k] = fromParent[k];
    top = replaceChild(top, fromParentPath, newFrom);
    const curTo = resolveAt(top, to.path);
    if (!isPlainObject(curTo)) return { doc, changed: false };
    const toKeys = Object.keys(curTo);
    const idx = anchorIndex(toKeys, to);
    const newTo = rebuildWithInsert(curTo, toKeys, fromKey, value, idx);
    top = replaceChild(top, to.path, newTo);
    return { doc: top, changed: true };
}
