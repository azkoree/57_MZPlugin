//=============================================================================
// GF Patch Plugins
// WSQ_G_ItemInfoPatch.js
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_G_ItemInfoPatch = true;
Imported.GF_ItemInfoPatch = true; // 兼容别名（旧引用保留）

var GF = GF || {};
GF.Patch = GF.Patch || {};
GF.Patch.ItemInfoWheelScroll = GF.Patch.ItemInfoWheelScroll || { version: 1.00 };
GF.Patch.ItemInfoWheelScroll.version = 1.03;

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.03]  修补 - 物品信息窗口增强
 * @author 五十七
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
 *  3. 字号与行高：直接指定信息窗口的字号与正文行高（像素）。
 *     GF_3_ItemInfoWindow 本体没有这两个参数，字号与行高只能由
 *     「窗口样式」里的窗口缩放率统一折算（见下文）。
 * 
 *  4. 浮动窗口最大宽度：给「自适应浮动窗口」限定最大宽度，超过的
 *     长描述自动折行，窗口变高不变宽。可按样式序号分别配置（见下文）。
 * 
 * 滚轮穿透与自动换行仅对"固定窗口"模式（FixWindow = true）生效。
 * 字号与行高对全部信息窗口样式生效。
 * 浮动窗口最大宽度仅对"自适应浮动窗口"模式（FixWindow = false）生效。
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
 *  字号与行高
 * ============================================================================
 *
 *  ---- 为什么本体调不了 ----
 *
 *  GF_3_ItemInfoWindow 的字号与行高都由「窗口样式」里的窗口缩放率
 *  （WindowScale）折算，没有独立参数：
 *
 *      字号 = round(主字号 × WindowScale)
 *      行高 = round((字号 + 8) × WindowScale)
 *
 *  你当前物品信息窗口的 WindowScale = 0.7，游戏主字号（数据库-系统-高级）24：
 *      字号 = round(24 × 0.7) = 17
 *      行高 = round((17 + 8) × 0.7) = 18
 *  引擎默认的「+8」行距被缩放率一起缩掉了（8 × 0.7 = 5.6 再取整），
 *  所以正文行距会贴得很紧。
 *
 *  ---- 新增参数（单位统一为像素，填 0 = 保持原样）----
 *
 *  字体大小（像素）
 *      直接指定信息窗口内文字的字号。
 *      填 0 时沿用窗口样式折算出来的字号。
 *      该值不受 WindowScale 影响 ⇒ 6 种信息窗口样式会统一使用这个字号。
 *      标题区高度、大图标尺寸会随字号同步变化（这是改字号的正常连带影响，
 *      因为它们的尺寸基准就是行高，而行高跟随字号）。
 *
 *  正文行高（像素）
 *      只改「数据区正文行」与「底部信息行」的行高。数据区正文行包含：
 *      基础属性 / 基本效果 / 简介 / 被动状态块 / 附魔块 / 套装块等
 *      （这些扩展块本身就是调用本体的行绘制方法，所以会自动跟随）。
 *      填 0 时沿用原行高。
 *
 *      ---- 不受影响的部分 ----
 *      · 标题区高度（= 原行高 × 2.5 或 × 3）
 *      · 大图标尺寸（= 原行高 × 3）
 *      · 各小标题条高度（"基础属性 / 基本效果 / 简介" 的底色条）
 *
 *      ---- 排版行为 ----
 *      · 行高变大 ⇒ 内容超出窗口，可用滚轮（配合本插件的滚轮穿透）或
 *        拖动查看，窗口不会溢出画面。
 *      · 行高变小 ⇒ 底部信息行自动贴到窗口底边，下横线位置同步跟随。
 *
 *  ---- 推荐调整顺序 ----
 *
 *      先定「字体大小」，再按观感把「正文行高」调到 字号 + 4 ~ 字号 + 8。
 *      例如字号 20、正文行高 26（当前默认约 17 / 18）。
 *
 *  ---- 生效确认 ----
 *
 *  两个参数任一填了非 0 值，启动时会输出一行控制台日志（F12 打开控制台）：
 *      WSQ_G_ItemInfoPatch: 字号 22px，正文行高 28px
 *  没看到这行 ⇒ 参数没被读到（插件未开启 / 放在了 GF_3_ItemInfoWindow 上方），
 *  而不是"改了没效果"。
 *  参数填得不合法（非数字 / 超出 0~200）时会另给一条警告，并说明本次按什么值处理。
 *
 *  ---- 已知边界 ----
 *
 *  · 套装图鉴（GF_4_EquipSuit 的 Window_SuitBonuse）自带的底部分隔线
 *    是按引擎行高画的副本，本参数不会改变它的位置（偏差 = 行高差值，
 *    且该窗口底部信息行通常为空，视觉上表现为分隔线略高/略低）。
 *  · 套装块里的"部件标题行"同样按引擎行高推进，不会跟随本参数。
 *  · 使用本插件的字体覆盖后，若游戏内全局主字号被其它插件改写，
 *    本插件仍以填写的绝对像素为准。
 *
 * ============================================================================
 *  浮动窗口最大宽度
 * ============================================================================
 *
 *  ---- 问题 ----
 *
 *  「自适应浮动窗口」（窗口样式里「是否固定窗口」= 浮动）的宽度是按内容
 *  实时算出来的：
 *
 *      窗口宽度 = 内边距 + 各列内距 + 最宽一行文字 × 列数 + 宽度修正
 *
 *  所以描述里只要出现一行不换行的长文本（例如 <简介> 那一整段），
 *  窗口就会被越撑越宽，甚至超出画面。
 *
 *  固定窗口（「是否固定窗口」= 固定）的宽度是样式里手填的固定值，
 *  不存在这个问题 —— 它的问题是长文本会画出右边界之外。
 *
 *  ---- 参数 ----
 *
 *  浮动窗口最大宽度（列表）
 *      每一项填「样式序号」+「最大宽度(像素)」。
 *      样式序号 = GF_3_ItemInfoWindow 的「信息窗口样式列表」里的第几项
 *      （从 1 开始，与「窗口样式绑定设置」里填的编号一致）。
 *      最大宽度填 0 = 该样式不限宽。
 *
 *      只对「是否固定窗口」= 浮动的样式生效。给固定窗口样式填了不会报错，
 *      但启动时会输出一条提示，说明该样式本就是固定宽度。
 *
 *  ---- 限宽后的排版行为 ----
 *
 *      · 超过最大宽度的行自动折行：窗口变高、不变宽。
 *      · 折行是强制兜底 —— 即便上方「自动换行」开关关闭，只要该样式配了
 *        最大宽度，超限的行照样折行。否则限宽只会把文字裁掉。
 *      · 限宽生效时该样式的列数固定为 1 列。多列布局会把限宽后的可用宽度
 *        再除以列数（越折越窄、自相矛盾），所以两者互斥；想保留多列就不要
 *        给该样式配最大宽度。
 *      · 被动状态 / 附魔 / 套装等扩展块的数据会一并折行。
 *
 *  ---- 不受限宽保护的部分 ----
 *
 *      · 标题区（道具名）不折行。若名字本身比上限还宽，超出部分会被窗口
 *        边界裁切。
 *      · 底部信息行（重量 / 价格 / 品质等）不折行：它按横向排列绘制
 *        （多行并排在同一行上），折行只会让它横向溢出。
 *      · 可用宽度被夹取为至少 1 像素，避免宽度填得过小时出现负数。
 *
 *  ---- 生效确认 ----
 *
 *  配了非 0 值时启动会输出一行控制台日志（F12 打开控制台），例如：
 *      WSQ_G_ItemInfoPatch: 浮动窗口最大宽度 样式1 = 420px
 *  样式序号不存在、或该样式是固定窗口，都会另给一条警告说明原因。
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
 * [v1.02] 新增字体大小、正文行高参数。
 *        参数读取不再覆写全局 GF.Parameters（避免影响后续加载的 GF 插件）。
 * [v1.03] 新增浮动窗口最大宽度参数（按样式序号配置，超限自动折行）。
 *        折行相关方法移到 Window_ObjInfoBase，浮动窗口与固定窗口共用。
 *        修正：底部信息行不再折行 —— 它按横向排列绘制，折行只会横向溢出。
 *
 * @param EnableWordWrap
 * @text 自动换行
 * @desc 是否启用自动换行。开启后超出窗口宽度的描述会自动折行。
 * @type boolean
 * @on 启用
 * @off 关闭
 * @default false
 *
 * @param sep1
 * @text ----字号与行高----
 * @default 
 *
 * @param FontSize
 * @text 字体大小(像素)
 * @desc 信息窗口内文字的字号，单位像素。填 0 = 沿用窗口样式折算的字号
 * (物品窗口约 17px)。不受窗口缩放率影响，6 种信息窗口样式统一使用此字号。
 * 0 = 不覆盖，其余有效值 1 ~ 200（建议不小于 6）。
 * @type number
 * @min 0
 * @max 200
 * @default 0
 *
 * @param DataLineHeight
 * @text 正文行高(像素)
 * @desc 数据区正文行与底部信息行的行高，单位像素。填 0 = 沿用原行高。
 * 不影响标题区高度、大图标尺寸、小标题条高度。
 * 0 = 不覆盖，其余有效值 1 ~ 200。
 * @type number
 * @min 0
 * @max 200
 * @default 0
 *
 * @param sep2
 * @text ----浮动窗口----
 * @default 
 *
 * @param MaxWidthList
 * @text 浮动窗口最大宽度
 * @desc 按样式序号限定「自适应浮动窗口」的最大宽度，单位像素，超限自动折行。
 * 每项填「样式序号」+「最大宽度」；序号对应「信息窗口样式列表」的第几项(从 1 开始)。
 * 最大宽度填 0 = 不限宽。只对「是否固定窗口」= 浮动的样式生效。
 * @type struct<MaxWidthSet>[]
 * @default []
 *
 */
/*~struct~MaxWidthSet:
 *
 * @param StyleIndex
 * @text 样式序号
 * @desc 对应 GF_3_ItemInfoWindow 参数「信息窗口样式列表」中的第几项，从 1 开始。
 * @type number
 * @min 1
 * @default 1
 *
 * @param MaxWidth
 * @text 最大宽度(像素)
 * @desc 该样式的窗口最大宽度，单位像素。0 = 不限宽（保持原自适应行为）。
 * 只对「是否固定窗口」= 浮动的样式生效。
 * @type number
 * @min 0
 * @max 2000
 * @default 0
 *
 */
//=============================================================================

if (!Imported.GF_3_ItemInfoWindow) {
    alert("错误:未找到前置插件 GF_3_ItemInfoWindow。\n请确保 WSQ_G_ItemInfoPatch.js 放在 GF_3_ItemInfoWindow 下方。");
}

//=============================================================================
// Parameter Variables
//=============================================================================

// ⚠️ 不要写成 GF.Parameters = ...：GF.Parameters 是 GF 全系列插件共用的
// 加载期全局变量（各插件自己会重新赋值一次再读取），这里覆写它会污染
// 其后加载的插件。统一挂在补丁自己的命名空间下。
GF.Patch.ItemInfoWheelScroll.parameters =
    PluginManager.parameters('WSQ_G_ItemInfoPatch');

GF.Patch.ItemInfoWheelScroll.EnableWordWrap =
    eval(GF.Patch.ItemInfoWheelScroll.parameters['EnableWordWrap'] || 'false');

/**
 * 读取整数型参数。
 *
 * 后加的参数在已保存的 plugins.js 里不存在（插件管理器不会用新的 @default
 * 覆盖已保存值），因此必须容忍 undefined / 空串 / 非数字，一律回落到
 * fallback；不能写成 parseInt(p.X) || 0 —— NaN 与 0 无法区分。
 *
 * @param {string} name 参数键名
 * @param {number} fallback 缺省值（0 = 不覆盖）
 * @param {number} min 下限
 * @param {number} max 上限
 * @returns {number}
 */
GF.Patch.ItemInfoWheelScroll.readIntParam = function (name, fallback, min, max) {
    const store = GF.Patch.ItemInfoWheelScroll;
    const raw = store.parameters[name];
    if (raw === undefined || String(raw).trim() === '') return fallback;
    const value = Number(String(raw).trim());
    if (isNaN(value)) {
        console.warn('WSQ_G_ItemInfoPatch: 参数 ' + name + ' 不是有效数字("' +
            raw + '")，本次按 ' + fallback + ' 处理。');
        return fallback;
    }
    if (value < min || value > max) {
        const clamped = Math.max(min, Math.min(max, value));
        console.warn('WSQ_G_ItemInfoPatch: 参数 ' + name + ' = ' + value +
            ' 超出范围 ' + min + '~' + max + '，本次按 ' + clamped + ' 处理。');
        return clamped;
    }
    return value;
};

/** 字体大小（像素），0 = 沿用窗口样式折算的字号 */
GF.Patch.ItemInfoWheelScroll.FontSize =
    GF.Patch.ItemInfoWheelScroll.readIntParam('FontSize', 0, 0, 200);

/** 正文行高（像素），0 = 沿用原行高 */
GF.Patch.ItemInfoWheelScroll.DataLineHeight =
    GF.Patch.ItemInfoWheelScroll.readIntParam('DataLineHeight', 0, 0, 200);

// 生效可见性：填了值却"看着没变化"时，先在控制台确认这一行
// （本项目的经典坑＝参数没被读到，但游戏零异常）
if (GF.Patch.ItemInfoWheelScroll.FontSize > 0 ||
    GF.Patch.ItemInfoWheelScroll.DataLineHeight > 0) {
    const _iiw = GF.Patch.ItemInfoWheelScroll;
    console.log('WSQ_G_ItemInfoPatch: 字号 ' +
        (_iiw.FontSize > 0 ? _iiw.FontSize + 'px' : '沿用窗口样式') +
        '，正文行高 ' +
        (_iiw.DataLineHeight > 0 ? _iiw.DataLineHeight + 'px' : '沿用原行高'));
}

/** 最大宽度的取值上限（像素），与参数注解里的 @max 保持一致 */
GF.Patch.ItemInfoWheelScroll.MaxWidthLimit = 2000;

/**
 * 扩展块的数据字段名。
 *
 * 这些字段由各扩展插件在 makeObjInfo() 阶段自建（被动状态 / 附魔 / 套装），
 * 形状统一为「数组，其元素是行数组」；插件未加载时字段不存在，按 undefined 跳过。
 * 只在限宽生效时对它们折行 —— 否则窗口收窄后这些块会画出边界。
 */
GF.Patch.ItemInfoWheelScroll.BlockFields = [
    '_stateTitle', '_stateData', '_stateAfter',
    '_enchaseTitle', '_resonanceObj', '_enchaseData', '_enchaseAfter',
    '_suitTitle', '_suitInside', '_pieceTitle', '_suitData', '_suitAfter'
];

/**
 * 浮动窗口最大宽度表：样式序号 → 最大宽度（像素）。
 *
 * GF 的列表型 struct 存法为「JSON 字符串数组，每项本身又是一段 JSON 字符串」，
 * 这里按同样的形态解析。未配置 / 解析失败 ⇒ 返回空对象，此时本功能完全不
 * 介入，排版与未装补丁时逐项一致。
 *
 * @type {Object.<number, number>}
 */
GF.Patch.ItemInfoWheelScroll.MaxWidthList = (function () {
    const store = GF.Patch.ItemInfoWheelScroll;
    const limit = store.MaxWidthLimit;
    const result = {};
    const raw = store.parameters['MaxWidthList'];
    if (raw === undefined || String(raw).trim() === '') return result;

    let list;
    try {
        list = JSON.parse(raw);
    } catch (e) {
        console.warn('WSQ_G_ItemInfoPatch: 参数 MaxWidthList 不是合法列表，' +
            '浮动窗口最大宽度本次不生效。');
        return result;
    }
    if (!Array.isArray(list)) return result;

    for (let i = 0; i < list.length; i++) {
        let item = list[i];
        if (typeof item === 'string') {
            try {
                item = JSON.parse(item);
            } catch (e) {
                continue;
            }
        }
        if (!item) continue;

        const index = Number(item.StyleIndex);
        if (!(index >= 1)) {
            console.warn('WSQ_G_ItemInfoPatch: 浮动窗口最大宽度第 ' + (i + 1) +
                ' 项的样式序号("' + item.StyleIndex + '")无效，已跳过。');
            continue;
        }

        const rawWidth = String(item.MaxWidth === undefined ? '' : item.MaxWidth).trim();
        if (rawWidth === '') continue;
        const width = Number(rawWidth);
        if (isNaN(width)) {
            console.warn('WSQ_G_ItemInfoPatch: 样式 ' + index + ' 的最大宽度("' +
                item.MaxWidth + '")不是有效数字，该项按不限宽处理。');
            continue;
        }
        if (width <= 0) continue; // 0 = 明确不限宽，无需警告
        if (width > limit) {
            console.warn('WSQ_G_ItemInfoPatch: 样式 ' + index + ' 的最大宽度 ' + width +
                ' 超出上限 ' + limit + '，本次按 ' + limit + ' 处理。');
        }
        result[index] = Math.min(limit, Math.round(width));
    }
    return result;
})();

// 生效可见性 + 配置体检：
// 「序号写错」和「样式是固定窗口」这两种情况都是填了完全没反应、游戏零异常，
// 必须在这里出声，否则只能靠肉眼比对排版去猜。
(function () {
    const store = GF.Patch.ItemInfoWheelScroll;
    const indexes = Object.keys(store.MaxWidthList);
    if (!indexes.length) return;

    const parts = [];
    for (let i = 0; i < indexes.length; i++) {
        parts.push('样式' + indexes[i] + ' = ' + store.MaxWidthList[indexes[i]] + 'px');
    }
    console.log('WSQ_G_ItemInfoPatch: 浮动窗口最大宽度 ' + parts.join('，'));

    const list = (GF.IIW && GF.IIW.WindowStyleList) || null;
    if (!list) return;
    for (let i = 0; i < indexes.length; i++) {
        const index = Number(indexes[i]);
        const set = list[index];
        if (!set) {
            console.warn('WSQ_G_ItemInfoPatch: 浮动窗口最大宽度填了样式序号 ' + index +
                '，但「信息窗口样式列表」里当前只有 ' + (list.length - 1) + ' 项，该项不会生效。');
            continue;
        }
        if (set.FixWindow) {
            console.warn('WSQ_G_ItemInfoPatch: 样式 ' + index +
                ' 是固定窗口（「是否固定窗口」= 固定），浮动窗口最大宽度对它不生效' +
                '（它的宽度由样式里的「窗口宽度」参数决定）。');
        }
    }
})();

//=============================================================================
// Window_ObjInfoBase - 字号与行高
//=============================================================================

(function () {
    const store = GF.Patch.ItemInfoWheelScroll;

    if (typeof Window_ObjInfoBase === 'undefined') {
        // 前置缺失已由文件顶部的 alert 提示，这里只留一条控制台记录，避免弹两次
        console.warn('WSQ_G_ItemInfoPatch: 未找到 Window_ObjInfoBase，字号与行高功能未生效。');
        return;
    }
    if (Window_ObjInfoBase.prototype.dataLineHeight) return; // 防止重复加载

    /**
     * 数据区正文行高（像素）。
     * 参数为 0 时沿用原行高 lineHeight()，即排版与未装本补丁时完全一致。
     * @returns {number}
     */
    Window_ObjInfoBase.prototype.dataLineHeight = function () {
        const height = store.DataLineHeight;
        if (height > 0) return height;
        return this.lineHeight();
    };

    //-------------------------------------------------------------------------
    // 字体大小
    // 原实现：round(主字号 × 该样式的 WindowScale)。
    // 参数 > 0 时改用绝对像素（不再乘 WindowScale），因此不受缩放率影响。
    // 行高 lineHeight() = round((字号 + 8) × WindowScale) 会自动跟随新字号，
    // 于是标题区、大图标尺寸也随之改变 —— 这是改字号应有的连带影响。
    //-------------------------------------------------------------------------

    Window_ObjInfoBase.prototype.standardFontSize = function () {
        const size = store.FontSize;
        if (size > 0) return size;
        return Math.round($gameSystem.mainFontSize() * this.scaleRate());
    };

    //-------------------------------------------------------------------------
    // 正文行高
    // 以下 5 个方法是「数据区正文行」与「底部信息行」唯一的高度/坐标来源，
    // 把它们从 lineHeight() 改到 dataLineHeight()，即可只改正文行距，
    // 而标题区（titleHeight）、大图标（lineHeight × 3）、小标题条不受影响。
    //
    // 各扩展插件（GF_4_PassiveState 的被动状态块、GF_4_EquipEnchase 的附魔块、
    // GF_4_EquipSuit 的套装块）自身排版都调用这里的三个方法，故自动跟随。
    //-------------------------------------------------------------------------

    Window_ObjInfoBase.prototype.calculateDataHeight = function (data, type) {
        const lineHeight = this.dataLineHeight();
        if (type === 1) {
            return data.length * lineHeight;
        }
        if (data.length % this.maxCols()) {
            return ((data.length - (data.length % this.maxCols())) / this.maxCols() + 1) * lineHeight;
        }
        return (data.length / this.maxCols()) * lineHeight;
    };

    Window_ObjInfoBase.prototype.drawObjInfoSingleCol = function (data, x, y) {
        const dataLength = data.length;
        const lineHeight = this.dataLineHeight();
        for (let i = 0; i < dataLength; i++) {
            this.drawTextEx(data[i], x, y);
            y += lineHeight;
        }
    };

    Window_ObjInfoBase.prototype.drawObjInfoMultCol = function (data, x_0, y_0) {
        const dataLength = data.length;
        const width = this.innerWidth / this.maxCols();
        const cols = Math.ceil(dataLength / this.maxCols());
        const lineHeight = this.dataLineHeight();
        for (let i = 0; i < dataLength; i++) {
            const x = x_0 + Math.floor(i / cols) * width;
            const y = (i % cols) * lineHeight + y_0;
            this.drawTextEx(data[i], x, y);
        }
    };

    Window_ObjInfoBase.prototype.calculateLastInfoHeight = function () {
        return this.dataLineHeight() + this.itemPadding() * 2;
    };

    // 底部下横线原本按 lineHeight 计算，必须与底部信息行用同一行高，
    // 否则正文行距变大时横线会压在文字上。其余逻辑与原实现逐行一致。
    Window_ObjInfoBase.prototype.drawOutline = function (x, y, w, h, color) {
        const itemColor = this.getItemColor();
        const th = this.titleHeight();
        const bootom = Math.floor(this.contentsHeight() - this.dataLineHeight() - this.itemPadding() * 3 / 2);
        if (!this._windowSet.WindowOutline) {
            if (!itemColor) {
                this.drawHorzLine(th);
            }
            this.drawHorzLine(bootom);
            return;
        }
        const lw = this._windowSet.WindowOutlineWidth;
        const bitmap = this.contents;
        if (!itemColor) {
            bitmap.strokeRoundRect(x + lw / 2, y + lw / 2, w - lw, h - lw, color, 5, lw);
            bitmap.fillRect(x + lw, y + th, w - 2 * lw, lw, color); //中横
            bitmap.fillRect(x + lw, bootom, w - 2 * lw, lw, color); //下横
        } else if (!ColorManager.isSeniorColor(itemColor)) {
            bitmap.gradientStrokeRoundRect(x + lw / 2, y + lw / 2, w - lw, h - lw, itemColor, color, true, 5, lw);
            bitmap.fillRect(x + lw, y + th, w - 2 * lw, lw, itemColor); //中横
            bitmap.fillRect(x + lw, bootom, w - 2 * lw, lw, color); //下横
        } else {
            bitmap.strokeRoundRect(x + lw / 2, y + lw / 2, w - lw, h - lw, itemColor, 5, lw);
            bitmap.fillRect(x + lw, y + th, w - 2 * lw, lw, itemColor); //中横
            bitmap.fillRect(x + lw, bootom, w - 2 * lw, lw, itemColor); //下横
        }
    };
})();

//=============================================================================
// Window_ObjInfoBase - 浮动窗口最大宽度（公共查询）
//=============================================================================

(function () {
    const store = GF.Patch.ItemInfoWheelScroll;

    if (typeof Window_ObjInfoBase === 'undefined') return;
    if (Window_ObjInfoBase.prototype.objInfoMaxWidth) return; // 防止重复加载

    /**
     * 本窗口对应的样式序号（1 起，对应「信息窗口样式列表」的顺序）。
     * 找不到时返回 0。
     * @returns {number}
     */
    Window_ObjInfoBase.prototype.objInfoStyleIndex = function () {
        const list = (GF.IIW && GF.IIW.WindowStyleList) || null;
        if (!list) return 0;
        for (let i = 1; i < list.length; i++) {
            if (list[i] === this._windowSet) return i;
        }
        return 0;
    };

    /**
     * 本窗口的最大宽度（像素）。0 = 不限宽。
     *
     * 只对「自适应浮动窗口」生效：固定窗口的宽度是样式里手填的固定值，
     * 不随内容变化，因此直接返回 0（本功能不介入）。
     *
     * @returns {number}
     */
    Window_ObjInfoBase.prototype.objInfoMaxWidth = function () {
        if (!this._windowSet) return 0;
        if (this._windowSet.FixWindow) return 0;
        const index = this.objInfoStyleIndex();
        if (!index) return 0;
        const width = store.MaxWidthList[index];
        return width > 0 ? width : 0;
    };

    /**
     * 宽度修正值。与本体 resetWindowSize 用的是同一个表达式
     * （样式里的「宽度修正」参数，支持填算式），保持口径一致。
     * @returns {number}
     */
    Window_ObjInfoBase.prototype.objInfoOffsetWidth = function () {
        const raw = this._windowSet ? this._windowSet.OffsetWidth : 0;
        if (raw === undefined || raw === null || String(raw).trim() === '') return 0;
        let value = 0;
        try {
            value = eval(raw);
        } catch (e) {
            return 0;
        }
        value = Number(value);
        return isNaN(value) ? 0 : value;
    };

    /**
     * 单行文字可用的像素宽度（折行断行的依据）。
     *
     * · 未限宽 ⇒ 沿用原行为（当前窗口内宽 − 左右内距）。
     * · 已限宽 ⇒ 按「最大宽度」反推，不看当前窗口宽度：
     *   否则会形成循环 —— 宽度依赖折行结果，折行又依赖宽度。
     *
     * @returns {number}
     */
    Window_ObjInfoBase.prototype.objInfoWrapWidth = function () {
        const limit = this.objInfoMaxWidth();
        if (limit > 0) {
            const cols = Math.max(1, this.maxCols());
            const usable = limit - this.padding * 2 -
                this.itemPadding() * cols * 2 - this.objInfoOffsetWidth();
            return Math.max(1, usable / cols);
        }
        return this.innerWidth - this.itemPadding() * 2;
    };

    /**
     * 本窗口是否处于「已限宽 ⇒ 必须折行」状态。
     * @returns {boolean}
     */
    Window_ObjInfoBase.prototype.objInfoForceWrap = function () {
        return this.objInfoMaxWidth() > 0;
    };

    /**
     * 一批行的折行结果（逐行调用 wrapLine 后展平）。
     * @param {string[]} lines
     * @param {number} maxWidth
     * @returns {string[]}
     */
    Window_ObjInfoBase.prototype.wrapTextLines = function (lines, maxWidth) {
        const result = [];
        if (!lines || !lines.length) return result;
        for (let i = 0; i < lines.length; i++) {
            const wrapped = this.wrapLine(lines[i], maxWidth);
            for (let j = 0; j < wrapped.length; j++) {
                result.push(wrapped[j]);
            }
        }
        return result;
    };
})();

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
// Window_ObjInfoBase - 换行 & <BR> 支持
//=============================================================================
// v1.03：这些方法原先挂在 Window_ObjInfoFix 上，现移到基类，
// 让「自适应浮动窗口」(Window_ObjInfoFloat) 也能复用同一套折行逻辑。
// 固定窗口走继承拿到的方法体完全等价，行为不变。

/**
 * 刷新流程中插入换行处理。
 * 在 makeObjInfo() 之后、calculateDataLength() 之前运行。
 */
Window_ObjInfoBase.prototype.processWordWrap = function () {
    if (!this._data) return;

    const maxWidth = this.objInfoWrapWidth();
    if (maxWidth <= 0) return;

    // 数据区各组
    const keys = this._dataKeys || Object.keys(this._data);
    for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const lines = this._data[key];
        if (!lines || !lines.length) continue;
        this._data[key] = this.wrapTextLines(lines, maxWidth);
    }

    // 底部信息行（重量 / 价格 / 品质等）不折行：
    // 它是按「多行横向并排」绘制的（drawLastInfo 里 x 逐段右移），
    // 折行只会让这一行横向更长，反而更容易出界。

    // 扩展块（被动状态 / 附魔 / 套装）：仅在限宽生效时折行。
    // 这些字段由各扩展插件自建，形状统一为「数组，其元素是行数组」；
    // 插件未加载时字段不存在，直接跳过。
    // 未限宽时不介入 ⇒ 固定窗口下的既有排版与本插件 v1.02 一致。
    if (this.objInfoForceWrap()) {
        const fields = GF.Patch.ItemInfoWheelScroll.BlockFields;
        for (let f = 0; f < fields.length; f++) {
            const group = this[fields[f]];
            if (!Array.isArray(group)) continue;
            for (let g = 0; g < group.length; g++) {
                if (!Array.isArray(group[g])) continue;
                group[g] = this.wrapTextLines(group[g], maxWidth);
            }
        }
    }
};

/**
 * 对单行文本进行换行处理。
 * 始终处理 <BR>；仅在 EnableWordWrap 开启、或本窗口限宽生效时按宽度折行。
 * @param {string} text 原始文本
 * @param {number} maxWidth 最大像素宽度
 * @returns {string[]} 拆分后的文本行数组
 */
Window_ObjInfoBase.prototype.wrapLine = function (text, maxWidth) {
    if (!text) return [''];
    if (text === '') return [''];

    // Step 1: <BR> 手动换行（始终生效，不区分大小写）
    const segments = text.split(/<BR>/gi);

    // Step 2: 自动换行关闭、且本窗口没在限宽时，只按 <BR> / \n 拆分后返回。
    //         限宽必须折行兜底，否则窗口收窄只会把文字裁掉。
    if (!GF.Patch.ItemInfoWheelScroll.EnableWordWrap && !this.objInfoForceWrap()) {
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
Window_ObjInfoBase.prototype.autoWrapLine = function (text, maxWidth) {
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
Window_ObjInfoBase.prototype.tokenizeLine = function (text) {
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

//=============================================================================
// Window_ObjInfoFloat - 浮动窗口最大宽度
//=============================================================================

(function () {
    if (typeof Window_ObjInfoFloat === 'undefined') return;
    if (Window_ObjInfoFloat.prototype.objInfoMaxColsPatched) return; // 防止重复加载

    //-------------------------------------------------------------------------
    // 列数：限宽生效时锁定为 1 列。
    //
    // 本体按「数据总行数」自适应列数（1 ~ 4 列），而折行会让行数暴增 ⇒
    // 列数跟着涨到 4 ⇒ 每列可用宽度又被除以 4 ⇒ 越折越窄、自相矛盾。
    // 所以限宽与多列布局互斥：限宽即单列。
    // 未限宽时不介入，本体原有的多列逻辑不受影响。
    //-------------------------------------------------------------------------
    const _objInfoFloatMaxCols = Window_ObjInfoFloat.prototype.maxCols;
    Window_ObjInfoFloat.prototype.maxCols = function () {
        if (this.objInfoMaxWidth() > 0) return 1;
        return _objInfoFloatMaxCols.call(this);
    };
    Window_ObjInfoFloat.prototype.objInfoMaxColsPatched = true;

    //-------------------------------------------------------------------------
    // 宽度：按内容算完之后，再按最大宽度收窄。
    // 收窄后仍超出 ⇒ 存在不参与折行的内容（标题区的道具名），由窗口边界裁切。
    //-------------------------------------------------------------------------
    const _objInfoFloatResetWindowSize = Window_ObjInfoFloat.prototype.resetWindowSize;
    Window_ObjInfoFloat.prototype.resetWindowSize = function () {
        _objInfoFloatResetWindowSize.call(this);
        const limit = this.objInfoMaxWidth();
        if (limit > 0 && this.width > limit) this.width = Math.floor(limit);
    };

    //-------------------------------------------------------------------------
    // 刷新流程：
    // · 未限宽 ⇒ 原样走本体（连 <BR> 都不处理），保证参数为 0 时排版与
    //   未装本补丁逐项一致。
    // · 已限宽 ⇒ 照抄本体的步骤，只在 makeObjInfo() 之后插入折行处理。
    //-------------------------------------------------------------------------
    const _objInfoFloatRefresh = Window_ObjInfoFloat.prototype.refresh;
    Window_ObjInfoFloat.prototype.refresh = function () {
        if (!this._item || !this._targetWindow) return this.clearAll();
        if (this.objInfoMaxWidth() <= 0) return _objInfoFloatRefresh.call(this);

        this.makeObjInfo();
        this.processWordWrap();
        this.calculateDataLength();
        this.calculateMaxCols();
        this.calculateAllDataHeight();
        this.calculateAllDataWidth();
        this.resetWindowSize();
        this.createContents();
        this.updatePosition();
        this.drawAllInfo();
    };
})();
