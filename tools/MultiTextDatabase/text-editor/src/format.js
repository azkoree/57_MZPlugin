// 换行符格式转换（编辑器 <-> 文件）
// 编辑器形式：textarea 中的真实换行（\n）
// 文件形式：按用户所选模式，换行保存为 <br>（RMMZ 换行控制符）或字面 \n（\\n 两字符）

export const LINE_BREAK_BR = "br";
export const LINE_BREAK_N = "n";

// 递归转换所有字符串叶子（数组/对象均处理，非字符串原样返回）
export function convertStrings(obj, fn) {
    if (typeof obj === "string") return fn(obj);
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map((x) => convertStrings(x, fn));
    // Object.create(null) 重建：避免数据含 __proto__ 键时触发原型 setter 丢键
    const out = Object.create(null);
    for (const k of Object.keys(obj)) out[k] = convertStrings(obj[k], fn);
    return out;
}

// 文件形式 → 编辑器形式：<br> 与字面 \n 都还原为真实换行
export function displayFromFile(data) {
    return convertStrings(data, (s) =>
        s.replace(/<br\/?>/gi, "\n").replace(/\\n/g, "\n")
    );
}

// 编辑器形式 → 文件形式：真实换行按所选模式转换（已有 <br> 等字面内容保留）
export function toFileForm(data, mode) {
    const target = mode === LINE_BREAK_N ? "\\n" : "<br>";
    return convertStrings(data, (s) => s.replace(/\n/g, target));
}
