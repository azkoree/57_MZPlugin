//=============================================================================
// GF Patch Plugins
// GF_Patch_ItemInfoPatch.js
//=============================================================================

var Imported = Imported || {};
Imported.GF_ItemInfoPatch = true;

var GF = GF || {};
GF.Patch = GF.Patch || {};
GF.Patch.ItemInfoWheelScroll = { version: 1.01 };

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.01]  修补 - 物品信息窗口增强
 * @author gt50 (patch by user)
 * 
 * @orderAfter GF_3_ItemInfoWindow
 * @base GF_3_ItemInfoWindow
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 * 
 * 这是 GF_3_ItemInfoWindow 的修补插件，提供以下增强：
 * 
 *  1. 滚轮穿透：鼠标停留在物品列表上时，滚轮即可滚动信息窗口，
 *     无需移动鼠标到信息窗口内部。
 * 
 *  2. 自动换行：当物品描述文字超出窗口宽度时，自动折行显示。
 *     同时支持手动换行标记 <BR>（不区分大小写）。
 * 
 * 两个功能均仅对"固定窗口"模式（FixWindow = true）生效。
 *
 * ============================================================================
 *  换行说明
 * ============================================================================
 *
 *  <BR> 手动换行：不区分大小写，始终生效。
 *    例如："攻击力+100<BR>防御力+50" 会显示为两行。
 *
 *  自动换行（开启后）：按窗口内宽自动折行，在中文/英文/数字边界
 *  均可断开。转义码（\c[n]、\i[n] 等）不会被截断。
 *
 *  注意：自动换行按单列宽度计算，在多列布局下文字可能比列宽略窄，
 *  但不会溢出。如需多列精确控制，请使用 <BR>。
 *
 * ============================================================================
 *  前置需求
 * ============================================================================
 *
 * 必须放在 GF_3_ItemInfoWindow 下方。
 *
 * ============================================================================
 *  更新日志
 * ============================================================================
 * 
 * [v1.00] 滚轮穿透功能。
 * [v1.01] 新增自动换行/<BR>手动换行功能。
 *
 * @param EnableWordWrap
 * @text 自动换行
 * @desc 是否启用自动换行。开启后超出窗口宽度的描述会自动折行。
 * @type boolean
 * @on 启用
 * @off 关闭
 * @default false
 *
 */
//=============================================================================

if (!Imported.GF_3_ItemInfoWindow) {
    alert("错误:未找到前置插件 GF_3_ItemInfoWindow。\n请确保 GF_ItemInfoPatch.js 放在 GF_3_ItemInfoWindow 下方。");
}

//=============================================================================
// Parameter Variables
//=============================================================================

GF.Parameters = PluginManager.parameters('GF_ItemInfoPatch');
GF.Patch.ItemInfoWheelScroll.EnableWordWrap =
    eval(GF.Parameters['EnableWordWrap'] || 'false');

//=============================================================================
// Window_ObjInfoFix - 滚轮穿透
//=============================================================================

Window_ObjInfoFix.prototype.processWheelScroll = function () {
    if (!this.visible) return;

    // 允许两种情况下滚动：
    // 1. 鼠标在信息窗口内部（原版行为）
    // 2. 鼠标在目标物品列表窗口内部（新增行为）
    const inInfoWindow = this.isTouchedInsideFrame();
    const inTargetWindow = this._targetWindow &&
        this._targetWindow.visible &&
        this._targetWindow.isTouchedInsideFrame();

    if (!inInfoWindow && !inTargetWindow) return;

    const threshold = 20;
    if (TouchInput.wheelY >= threshold) {
        this.scrollOriginBy(this.scrollSpeed() * 4);
    }
    if (TouchInput.wheelY <= -threshold) {
        this.scrollOriginBy(-this.scrollSpeed() * 4);
    }
};

//=============================================================================
// Window_ObjInfoFix - 自动换行 & <BR> 支持
//=============================================================================

/**
 * 刷新流程中插入换行处理。
 * 在 makeObjInfo() 之后、calculateDataLength() 之前运行。
 */
Window_ObjInfoFix.prototype.processWordWrap = function () {
    if (!this._data) return;

    const maxWidth = this.innerWidth - this.itemPadding() * 2;
    if (maxWidth <= 0) return;

    // 处理 _data 中的每一组
    const keys = this._dataKeys || Object.keys(this._data);
    for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const lines = this._data[key];
        if (!lines || !lines.length) continue;
        const newLines = [];
        for (let i = 0; i < lines.length; i++) {
            const wrapped = this.wrapLine(lines[i], maxWidth);
            for (let j = 0; j < wrapped.length; j++) {
                newLines.push(wrapped[j]);
            }
        }
        this._data[key] = newLines;
    }

    // 处理底部信息 _lastData
    if (this._lastData && this._lastData.length) {
        const newLast = [];
        for (let i = 0; i < this._lastData.length; i++) {
            const wrapped = this.wrapLine(this._lastData[i], maxWidth);
            for (let j = 0; j < wrapped.length; j++) {
                newLast.push(wrapped[j]);
            }
        }
        this._lastData = newLast;
    }
};

/**
 * 对单行文本进行换行处理。
 * 始终处理 <BR>；仅在 EnableWordWrap 开启时做自动折行。
 * @param {string} text 原始文本
 * @param {number} maxWidth 最大像素宽度
 * @returns {string[]} 拆分后的文本行数组
 */
Window_ObjInfoFix.prototype.wrapLine = function (text, maxWidth) {
    if (!text) return [''];
    if (text === '') return [''];

    // Step 1: <BR> 手动换行（始终生效，不区分大小写）
    const segments = text.split(/<BR>/gi);

    // Step 2: 如果自动换行关闭，按 <BR> 和 \n 拆分后直接返回
    if (!GF.Patch.ItemInfoWheelScroll.EnableWordWrap) {
        const result = [];
        for (let i = 0; i < segments.length; i++) {
            const sub = segments[i].split('\n');
            for (let j = 0; j < sub.length; j++) {
                if (sub[j] !== '') result.push(sub[j]);
            }
        }
        return result.length > 0 ? result : [''];
    }

    // Step 3: 自动换行 — 先按 \n 拆分，再对每个片段按宽度折行
    const result = [];
    for (let i = 0; i < segments.length; i++) {
        const subs = segments[i].split('\n');
        for (let j = 0; j < subs.length; j++) {
            const sub = subs[j];
            if (sub === '') continue;
            if (this.textWidthEx(sub) <= maxWidth) {
                result.push(sub);
            } else {
                const autoWrapped = this.autoWrapLine(sub, maxWidth);
                for (let w = 0; w < autoWrapped.length; w++) {
                    result.push(autoWrapped[w]);
                }
            }
        }
    }
    return result.length > 0 ? result : [''];
};

/**
 * 将一行过长文本按像素宽度自动拆分为多行。
 * 逐个 token（转义码整体 / 单字符）推进，超出宽度时在 token 前断行。
 * @param {string} text 原始文本（不含 \n 和 <BR>）
 * @param {number} maxWidth 最大像素宽度
 * @returns {string[]} 拆分后的文本行
 */
Window_ObjInfoFix.prototype.autoWrapLine = function (text, maxWidth) {
    const tokens = this.tokenizeLine(text);
    const result = [];
    let current = '';

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const candidate = current + token;
        if (current !== '' && this.textWidthEx(candidate) > maxWidth) {
            result.push(current);
            current = token;
        } else {
            current = candidate;
        }
    }
    if (current !== '') result.push(current);
    return result.length > 0 ? result : [text];
};

/**
 * 将文本拆分为 token 数组：
 *  - 转义码整体作为一个 token（不会被截断）
 *  - 连续的非转义字符按单字符拆分
 * @param {string} text
 * @returns {string[]}
 */
Window_ObjInfoFix.prototype.tokenizeLine = function (text) {
    const tokens = [];
    let i = 0;
    while (i < text.length) {
        if (text[i] === '\\' && i + 1 < text.length) {
            const tokenStart = i;
            i++; // 跳过反斜杠
            const c = text[i];
            if (c === '{' || c === '}') {
                // \{ 或 \}
                i++;
            } else if (c === '\\') {
                // \\ 转义反斜杠
                i++;
            } else if (/[a-zA-Z]/.test(c)) {
                // \c[n], \i[n], \fs[n], \v[n], \n[n], \p[n] 等
                i++;
                if (i < text.length && text[i] === '[') {
                    let depth = 1;
                    i++;
                    while (i < text.length && depth > 0) {
                        if (text[i] === '[') depth++;
                        else if (text[i] === ']') depth--;
                        i++;
                    }
                }
            } else {
                // \. \| \! \> \< \^ \$ \G 等单字符转义
                i++;
            }
            tokens.push(text.substring(tokenStart, i));
        } else {
            // 普通字符按单字符拆分，保证可在任意字符边界断行
            tokens.push(text[i]);
            i++;
        }
    }
    return tokens;
};

//=============================================================================
// 替换 refresh 流程以插入换行处理
//=============================================================================

(function () {
    const _Window_ObjInfoFix_refresh = Window_ObjInfoFix.prototype.refresh;

    Window_ObjInfoFix.prototype.refresh = function () {
        if (!this._item || !this._targetWindow) {
            this.clearAll();
            return;
        }

        // 1. 构建原始数据
        this.makeObjInfo();

        // 2. 换行处理（<BR> 始终生效，自动换行按参数控制）
        this.processWordWrap();

        // 3. 计算布局
        this.calculateDataLength();
        this.calculateMaxCols();
        this.calculateAllDataHeight();
        this.createContents();
        this.resetOrigin();
        this.drawAllInfo();
    };
})();
