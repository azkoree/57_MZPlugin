//=============================================================================
// GF Plugins
// WSQ_G_DialogPatch.js
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_G_DialogPatch = true;

var WSQ = WSQ || {};
WSQ.DP = WSQ.DP || {};
WSQ.DP.version = 1.08;
WSQ.DP.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.08]        系统 - 对话核心补丁（内联姓名/姓名渐变背景/姓名分隔线/气泡定位/气泡偏移/气泡动态宽高/对话框自动换行控制/字体装饰\font）
 * @author WSQ
 * @url https://afdian.net/a/ganfly
 * @orderAfter GF_2_CoreOfDialog
 * @base GF_2_CoreOfDialog
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 *  GF_2_CoreOfDialog（对话核心）的补丁，提供 姓名显示增强 / 气泡增强 /
 *  对话框自动换行控制 / \font 文字装饰 等能力。
 *
 * ============================================================================
 *  功能一览
 * ============================================================================
 *  1. 内联姓名      ：姓名直接显示在对话窗口第一行（不再用独立姓名窗口），
 *                     正文行数不缩水。开关见参数「启用内联姓名」。
 *  2. 姓名显示格式  ：参数「姓名显示格式」，%1 = 说话人姓名，支持 \c[n] 等转义符。
 *  3. 姓名自动定位气泡：姓名框填“事件名 / 队伍角色名 / this / player /
 *                     名称 (event 3) / follower: 名称”等，自动以气泡形式
 *                     定位到对应角色/事件头顶（详见参数「启用姓名自动定位气泡」）。
 *  4. 气泡目标脚本接口：WSQ.DP.setBubbleTarget(spec)，见下方「脚本接口」。
 *  5. 气泡独立偏移  ：参数「气泡偏移 X/Y」只调整气泡框位置，不影响普通对话窗口。
 *  6. 姓名渐变背景  ：给姓名行加渐变背景条，参数见「姓名渐变背景」组。
 *  7. 姓名分隔线    ：姓名与正文间画渐变分隔线，参数见「姓名分隔线」组。
 *  8. 气泡动态宽高  ：文本里插 <dh>/</dh>、<dw>/</dw> 标签，气泡随文字实时伸缩。
 *  9. 对话框自动换行：参数「对话框自动换行」统一控制普通框/气泡框
 *                     （跟随系统 / 强制开启 / 强制关闭）。
 *  10. \font 文字装饰：见下方「控制字符」。
 *
 * ============================================================================
 *  控制字符（\font 文字装饰）
 * ============================================================================
 *  在对话文本中插入 \font[param] 可临时改变文字 字体/字号/颜色/描边，
 *  并叠加 底纹 / 外发光 / 删除线 / 下划线 / 字距 等装饰。
 *
 *  【参数串写法】
 *    - 多个参数可紧贴、用空格或 = 分隔，无顺序要求：
 *      \font[ca 128] = \font[ca128] = \font[ca=128]
 *    - 参数效果持续生效，直到新的 \font、\c、换页或对话结束；只需写要变动的参数。
 *    - 用 $ 恢复默认，如 \font[size$] 恢复默认字号。
 *
 *  【参数一览】
 *    name      字体名。数字=按参数「字体预设」序号取字体；文字=直接作字体名（需已加载）
 *    size      字号。也可直接写在首位（\font[20]）
 *    ca        文字不透明度（0~255）
 *    i / b     斜体 / 加粗（1开 0关）
 *    o         描边（1开 0关），宽度由参数「描边宽度」控制
 *    or og ob oa   描边颜色 R/G/B/A（0~255）
 *    c         文字颜色（同 \c[n] 系统颜色编号）
 *    w         字距增量（像素，可负数）
 *    h         行高增量（像素）
 *    p         底纹：0关 / 1边框 / 2实心方框
 *    pc        底纹颜色（系统颜色编号）
 *    l         外发光（1开 0关），以发光色加粗描边模拟光晕
 *    lc        外发光颜色（系统颜色编号）
 *    lp        外发光强度（描边加粗倍数）
 *    d / dc    删除线 开关 / 颜色（系统颜色编号）
 *    u / uc    下划线 开关 / 颜色（系统颜色编号）
 *
 *  【示例】
 *    \font[p1 pc20]秘籍：\font[p0] 九阳神功   → “秘籍：”带边框底纹，其余正常
 *    \font[l1 lc2 lp3]天罚\font[l0]           → “天罚”带光晕
 *    \font[2]小字\font[size$]                 → 首参 2 即字号，随后恢复
 *    \font[c3 w1]每字加宽并变色\font[c0 w0]   → 改变字距和颜色
 *
 *  【注意事项】
 *    · 命中装饰参数（p/l/d/u/w/h/ca）的文本段改为逐字绘制，不走 GF 文本淡入；
 *      仅改字号/颜色/描边等基础属性不受影响。
 *    · RGSS3 原版的 阴影(s) / 文字破碎(k) 在 MZ 无对应 API，未移植；
 *      外发光为加粗描边光晕近似，非真模糊光晕。
 *    · 装饰对「气泡对话框」与「普通对话框」均生效；姓名行文字与竖排(RTL)
 *      文本不参与装饰。
 *
 * ============================================================================
 *  插件指令
 * ============================================================================
 *    WSQNameInline      enable:true/false   切换内联姓名
 *    WSQNameSeparator   enable:true/false   切换姓名分隔线
 *    WSQAutoBubbleByName enable:true/false  切换姓名自动定位气泡
 *    WSQBubbleOffset    OffsetX / OffsetY   设定气泡专属偏移
 *    WSQAutoWordWrap    mode:auto/on/off    设定对话框自动换行
 *  （均写入存档，跨场景/读档保持）
 *
 * ============================================================================
 *  脚本接口
 * ============================================================================
 *    WSQ.DP.nameInlineEnabled() / nameSeparatorEnabled() / autoBubbleByNameEnabled()
 *    WSQ.DP.setBubbleTarget(spec)        便捷设定气泡目标
 *      spec: 数字(>=1事件ID / 0本事件 / -1玩家 / <-1跟随者) 或 字符串
 *      ("aN"队伍角色 / 事件名 / 角色名) 或 null(清除)
 *    WSQ.DP.resolveBubbleTargetByName(name) / resolveBubbleDisplayName(name,target)
 *    WSQ.DP.bubbleOffset() / setBubbleOffset(x,y)
 *    WSQ.DP.resolveColor(str)            解析渐变颜色（数字色号 / #rrggbb / opacity）
 *    WSQ.DP.autoWordWrapMode() / setAutoWordWrap(mode)
 *    Window_Message#formatSpeakerName(name)
 *
 * ============================================================================
 *  备注
 * ============================================================================
 *    - 本补丁需放置在 GF_2_CoreOfDialog 之后加载。
 *    - 启用内联姓名后，独立姓名窗口会被隐藏（其 NameWindowColor 参数不再生效）。
 *    - 建议姓名格式以 \c[0] 结尾，确保后续正文颜色复位。
 * ============================================================================
 *
 * @param NameInlineEnabled
 * @text 启用内联姓名
 * @type boolean
 * @default false
 * @desc 开启后弃用独立姓名窗口，姓名显示在对话窗口第一行，正文下移一行。
 *       在气泡窗口与普通对话窗口中共用。
 *
 * @param NameFormat
 * @text 姓名显示格式
 * @type string
 * @default \c[2]%1\c[0]
 * @desc 姓名显示格式，%1 会被替换为说话人姓名。支持转义字符如 \c[2]...\c[0]。
 *       仅在“启用内联姓名”开启时生效。
 *
 * @param NameBackGradientSet
 * @text ── 姓名渐变背景 ──
 *
 * @param NameBackGradientEnabled
 * @parent NameBackGradientSet
 * @text 启用姓名渐变背景
 * @type boolean
 * @on 启用
 * @off 关闭
 * @desc 开启后，在「启用内联姓名」且有姓名时，为姓名行绘制一条渐变背景条。
 *       普通对话窗口与气泡窗口均生效。
 * @default false
 *
 * @param NameBackGradientColorL
 * @parent NameBackGradientSet
 * @text 渐变背景-左颜色
 * @desc 渐变背景左侧颜色。填数字=系统颜色编号（0-31），填#rrggbb=自定义颜色，
 *       填opacity或透明=该侧透明。
 * @default 16
 *
 * @param NameBackGradientColorR
 * @parent NameBackGradientSet
 * @text 渐变背景-右颜色
 * @desc 渐变背景右侧颜色。填数字=系统颜色编号（0-31），填#rrggbb=自定义颜色，
 *       填opacity或透明=该侧透明。
 * @default 0
 *
 * @param NameBackGradientLength
 * @parent NameBackGradientSet
 * @text 渐变背景长度
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @desc 渐变背景条宽度占“姓名可用区域宽度”的比例（0~1），从左往右绘制。
 *       0 表示不绘制。
 * @default 0.6
 *
 * @param NameSeparatorSet
 * @text ── 姓名分隔线 ──
 *
 * @param NameSeparatorEnabled
 * @parent NameSeparatorSet
 * @text 启用姓名分隔线
 * @type boolean
 * @on 启用
 * @off 关闭
 * @desc 开启后，在「启用内联姓名」且有姓名时，在姓名与正文之间绘制一条
 *       左对齐、从左到右渐变的横向分隔线。普通对话窗口与气泡窗口均生效。
 * @default false
 *
 * @param NameSeparatorColorL
 * @parent NameSeparatorSet
 * @text 分隔线-左颜色
 * @desc 分隔线左侧颜色。填数字=系统颜色编号（0-31），填#rrggbb=自定义颜色；
 *       右侧固定为透明，无需调整。
 * @default 16
 *
 * @param NameSeparatorLength
 * @parent NameSeparatorSet
 * @text 分隔线长度
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @desc 分隔线宽度占“姓名可用区域宽度”的比例（0~1），左对齐绘制。
 *       0 表示不绘制。
 * @default 0.6
 *
 * @param NameSeparatorMarginTop
 * @parent NameSeparatorSet
 * @text 分隔线-上边距
 * @type number
 * @min 0
 * @decimals 0
 * @desc 分隔线与姓名行之间的间距（像素）。该间距会计入对话框高度。
 * @default 4
 *
 * @param NameSeparatorMarginBottom
 * @parent NameSeparatorSet
 * @text 分隔线-下边距
 * @type number
 * @min 0
 * @decimals 0
 * @desc 分隔线与正文首行之间的间距（像素）。该间距会计入对话框高度。
 * @default 6
 * 
 * @param DynamicSizeSet
 * @text ── 气泡动态对话框 ──
 *
 * @param DefaultDynamicHeight
 * @parent DynamicSizeSet
 * @text 默认启用动态高度
 * @type boolean
 * @default false
 * @desc 未使用 <dh>/</dh> 标签时，气泡是否默认启用动态高度。
 *       若文本中出现 <dh> 则强制启用；仅出现 </dh> 则强制禁用。
 *
 * @param DefaultDynamicWidth
 * @parent DynamicSizeSet
 * @text 默认启用动态宽度
 * @type boolean
 * @default false
 * @desc 未使用 <dw>/</dw> 标签时，气泡是否默认启用动态宽度。
 *       若文本中出现 <dw> 则强制启用；仅出现 </dw> 则强制禁用。
 *
 * @param AutoBubbleByName
 * @text 启用姓名自动定位气泡
 * @type boolean
 * @default false
 * @desc 开启后，在“显示文字”的姓名框填写名称，会自动把对话显示为气泡并定位到
 *       对应角色/事件头顶。基础用法：直接填地图事件的“事件名”即可冒泡在该事件上；
 *       也可填队伍角色名（领队/跟随队员）定位到队伍角色，或用特殊写法
 *       this/player/名称 (event 3)/follower: 名称 等指向特定目标。
 *       特殊写法会把姓名框显示为被定位目标的真实姓名，而非原样显示关键字。
 *       未匹配到目标时回退为普通对话。详见插件功能三。可用插件指令
 *       WSQAutoBubbleByName 运行时切换。
 *
 * @param BubbleOffsetX
 * @text 气泡偏移 X
 * @type number
 * @min -9999
 * @max 9999
 * @default 0
 * @desc 气泡对话框的专属水平偏移（像素）。仅作用于气泡窗口，不影响普通对话窗口；
 *       与通用消息偏移叠加。可用插件指令 WSQBubbleOffset / 脚本 WSQ.DP.setBubbleOffset 覆盖。
 *
 * @param BubbleOffsetY
 * @text 气泡偏移 Y
 * @type number
 * @min -9999
 * @max 9999
 * @default 0
 * @desc 气泡对话框的专属垂直偏移（像素）。仅作用于气泡窗口，不影响普通对话窗口；
 *       与通用消息偏移叠加。可用插件指令 WSQBubbleOffset / 脚本 WSQ.DP.setBubbleOffset 覆盖。
 *
 * @param AutoWordWrap
 * @text 对话框自动换行
 * @type select
 * @option 跟随系统
 * @value auto
 * @option 强制开启
 * @value on
 * @option 强制关闭
 * @value off
 * @default auto
 * @desc 统一控制“普通对话框”与“气泡对话框”的自动换行（两者共用同一开关）。
 *       跟随系统：沿用 GF_0_CoreOfText 的全局“消息窗口自动换行”设置；
 *       强制开启/关闭：忽略系统设置，统一应用。可用插件指令
 *       WSQAutoWordWrap / 脚本 WSQ.DP.setAutoWordWrap 运行时切换。
 *
 * @param FontFacePresets
 * @text 字体预设
 * @type multiline_string
 * @default 1:黑体
 * @desc 每行一条"序号:字体名"，供 \font[name] 参数用数字序号引用。
 *       例：1:黑体 （实际字体名需已在游戏中加载，可在 GF_0_CoreOfText
 *       的"额外字体加载"中配置）。
 *
 * @param FontOutlineWidth
 * @text 描边宽度
 * @type number
 * @min 0
 * @max 20
 * @default 3
 * @desc \font[o1] 开启描边时的描边宽度（像素）。
 */
//=============================================================================

// 依赖检查
if (!Imported.GF_2_CoreOfDialog) {
    alert(
        "错误:未找到前置插件 GF_2_CoreOfDialog。\n" +
        "请确认已安装并启用 GF_2_CoreOfDialog 插件，并将其放置在 WSQ_G_DialogPatch 之前。"
    );
}

//=============================================================================
// Parameter Variables
//=============================================================================

WSQ.DP.Parameters = PluginManager.parameters(WSQ.DP.pluginName);
WSQ.DP.Param = WSQ.DP.Param || {};

WSQ.DP.Param.NameInlineEnabled = String(
    WSQ.DP.Parameters["NameInlineEnabled"] || "false"
).trim().toLowerCase() === "true";

WSQ.DP.Param.NameFormat = String(
    WSQ.DP.Parameters["NameFormat"] || "\\c[2]%1\\c[0]"
);

WSQ.DP.Param.NameBackGradientEnabled = String(
    WSQ.DP.Parameters["NameBackGradientEnabled"] || "false"
).trim().toLowerCase() === "true";

WSQ.DP.Param.NameBackGradientColorL = String(
    WSQ.DP.Parameters["NameBackGradientColorL"] || "16"
);
WSQ.DP.Param.NameBackGradientColorR = String(
    WSQ.DP.Parameters["NameBackGradientColorR"] || "0"
);

let nameGradientLen = Number(WSQ.DP.Parameters["NameBackGradientLength"]);
if (!Number.isFinite(nameGradientLen)) nameGradientLen = 0.6;
WSQ.DP.Param.NameBackGradientLength = Math.min(1, Math.max(0, nameGradientLen));

WSQ.DP.Param.NameSeparatorEnabled = String(
    WSQ.DP.Parameters["NameSeparatorEnabled"] || "false"
).trim().toLowerCase() === "true";

WSQ.DP.Param.NameSeparatorColorL = String(
    WSQ.DP.Parameters["NameSeparatorColorL"] || "16"
);

let nameSeparatorLen = Number(WSQ.DP.Parameters["NameSeparatorLength"]);
if (!Number.isFinite(nameSeparatorLen)) nameSeparatorLen = 0.6;
WSQ.DP.Param.NameSeparatorLength = Math.min(1, Math.max(0, nameSeparatorLen));

let nameSeparatorMarginTop = Number(WSQ.DP.Parameters["NameSeparatorMarginTop"]);
if (!Number.isFinite(nameSeparatorMarginTop)) nameSeparatorMarginTop = 4;
WSQ.DP.Param.NameSeparatorMarginTop = Math.max(0, nameSeparatorMarginTop);

let nameSeparatorMarginBottom = Number(WSQ.DP.Parameters["NameSeparatorMarginBottom"]);
if (!Number.isFinite(nameSeparatorMarginBottom)) nameSeparatorMarginBottom = 6;
WSQ.DP.Param.NameSeparatorMarginBottom = Math.max(0, nameSeparatorMarginBottom);

WSQ.DP.Param.DefaultDynamicHeight = String(
    WSQ.DP.Parameters["DefaultDynamicHeight"] || "false"
).trim().toLowerCase() === "true";

WSQ.DP.Param.DefaultDynamicWidth = String(
    WSQ.DP.Parameters["DefaultDynamicWidth"] || "false"
).trim().toLowerCase() === "true";

WSQ.DP.Param.AutoBubbleByName = String(
    WSQ.DP.Parameters["AutoBubbleByName"] || "false"
).trim().toLowerCase() === "true";

WSQ.DP.Param.BubbleOffsetX = Number(WSQ.DP.Parameters["BubbleOffsetX"] || 0) || 0;
WSQ.DP.Param.BubbleOffsetY = Number(WSQ.DP.Parameters["BubbleOffsetY"] || 0) || 0;

// 对话框自动换行模式：auto（跟随 GF_0_CoreOfText 全局开关）/ on（强制开启）/ off（强制关闭）。
let autoWordWrap = String(WSQ.DP.Parameters["AutoWordWrap"] || "auto").trim().toLowerCase();
if (!["auto", "on", "off"].includes(autoWordWrap)) autoWordWrap = "auto";
WSQ.DP.Param.AutoWordWrap = autoWordWrap;

// \font 字体预设（序号:字体名，每行一条）
WSQ.DP.Param.FontFacePresets = {};
String(WSQ.DP.Parameters["FontFacePresets"] || "1:黑体")
    .split(/[\r\n]+/)
    .forEach((line) => {
        const idx = line.indexOf(":");
        if (idx > 0) {
            const n = parseInt(line.slice(0, idx).trim(), 10);
            const name = line.slice(idx + 1).trim();
            if (!isNaN(n) && name) WSQ.DP.Param.FontFacePresets[n] = name;
        }
    });

// \font[o1] 开启描边时的描边宽度
let fontOutlineWidth = Number(WSQ.DP.Parameters["FontOutlineWidth"]);
if (!Number.isFinite(fontOutlineWidth)) fontOutlineWidth = 3;
WSQ.DP.Param.FontOutlineWidth = Math.max(0, Math.min(20, fontOutlineWidth));

// 颜色解析（参照 GF_3_AlchemySystem 的 AlchemyManager._resolveColor / 本项目
// WSQ_Achievement 的同款实现）
// 支持：数字=系统颜色编号（ColorManager.textColor）、#rrggbb=自定义颜色、opacity/透明=该侧透明
WSQ.DP.resolveColor = function (colorStr) {
    if (colorStr === undefined || colorStr === null || colorStr === "") return "#ffffff";
    const s = String(colorStr).trim().toLowerCase();
    if (s === "opacity" || s === "透明") return "rgba(0,0,0,0)";
    if (s.charAt(0) === "#") return s;
    const n = Number(colorStr);
    if (!isNaN(n)) return ColorManager.textColor(n);
    return "#ffffff";
};

//=============================================================================
// 运行时状态
//=============================================================================

// 当前是否启用内联姓名。
// 优先读取存档中的运行时开关（由插件指令设置），否则回退到插件参数。
WSQ.DP.nameInlineEnabled = function () {
    if ($gameSystem && $gameSystem._wsqDpNameInline !== undefined) {
        return !!$gameSystem._wsqDpNameInline;
    }
    return WSQ.DP.Param.NameInlineEnabled;
};

// 当前是否启用“姓名自动定位气泡”。
WSQ.DP.autoBubbleByNameEnabled = function () {
    if ($gameSystem && $gameSystem._wsqDpAutoBubbleByName !== undefined) {
        return !!$gameSystem._wsqDpAutoBubbleByName;
    }
    return WSQ.DP.Param.AutoBubbleByName;
};

// 当前自动换行模式：auto / on / off。
// 优先读取存档中的运行时设置（由插件指令 / 脚本设置），否则回退到插件参数。
WSQ.DP.autoWordWrapMode = function () {
    if ($gameSystem && $gameSystem._wsqDpAutoWordWrap !== undefined) {
        return $gameSystem._wsqDpAutoWordWrap;
    }
    return WSQ.DP.Param.AutoWordWrap;
};

// 便捷脚本接口：运行时设定自动换行模式（"auto" / "on" / "off"）。
// 写入存档，跨场景/读档保持；传 null/undefined 则恢复为插件参数默认值。
WSQ.DP.setAutoWordWrap = function (mode) {
    if (mode === null || mode === undefined) {
        if ($gameSystem) $gameSystem._wsqDpAutoWordWrap = undefined;
        return;
    }
    const m = String(mode).trim().toLowerCase();
    if ($gameSystem) {
        $gameSystem._wsqDpAutoWordWrap = ["auto", "on", "off"].includes(m) ? m : "auto";
    }
};

// 当前是否启用姓名分隔线。
// 优先读取存档中的运行时开关（由插件指令设置），否则回退到插件参数。
WSQ.DP.nameSeparatorEnabled = function () {
    if ($gameSystem && $gameSystem._wsqDpNameSeparator !== undefined) {
        return !!$gameSystem._wsqDpNameSeparator;
    }
    return WSQ.DP.Param.NameSeparatorEnabled;
};

// 当前这条消息是否实际绘制姓名分隔线。
// 仅当「启用内联姓名 + 启用分隔线 + 分隔线长度 > 0 + 当前消息有姓名」时成立。
WSQ.DP.nameSeparatorActive = function () {
    if (!WSQ.DP.nameInlineEnabled()) return false;
    if (!WSQ.DP.nameSeparatorEnabled()) return false;
    if (!(WSQ.DP.Param.NameSeparatorLength > 0)) return false;
    return !!($gameMessage && $gameMessage.speakerName && $gameMessage.speakerName());
};

// 姓名分隔线占用的额外高度（像素）。
// 分隔线固定绘制高度为 2 像素；额外高度 = 上边距 + 2 + 下边距。
WSQ.DP.nameSeparatorHeight = function () {
    if (!WSQ.DP.nameSeparatorActive()) return 0;
    return (WSQ.DP.Param.NameSeparatorMarginTop || 0) + 2 + (WSQ.DP.Param.NameSeparatorMarginBottom || 0);
};

// 脚本接口 / 姓名自动匹配 临时指定的气泡目标角色（Game_Character / Game_Actor）。
// 取值含义：
//   undefined -> 未指定，回退对话核心默认逻辑
//   null      -> 显式清除（强制不显示气泡）
//   其它       -> 目标角色对象
WSQ.DP._forcedBubbleTarget = undefined;

// 气泡对话框专属偏移的“按对话”临时覆盖（仅作用于该条气泡对话，结束后复位）。
//   undefined -> 未指定，回退到运行时/参数默认值
//   其余     -> { x, y } 对象
WSQ.DP._forcedBubbleOffset = undefined;

// 解析当前生效的气泡专属偏移（按对话覆盖 > 运行时存档 > 插件参数）。
WSQ.DP.bubbleOffset = function () {
    if (WSQ.DP._forcedBubbleOffset) {
        return WSQ.DP._forcedBubbleOffset;
    }
    if ($gameSystem && $gameSystem._wsqDpBubbleOffsetX !== undefined) {
        return { x: $gameSystem._wsqDpBubbleOffsetX, y: $gameSystem._wsqDpBubbleOffsetY };
    }
    return { x: WSQ.DP.Param.BubbleOffsetX, y: WSQ.DP.Param.BubbleOffsetY };
};

// 便捷脚本接口：设定下一段（气泡）对话的气泡偏移。
//   x, y 为像素偏移（与通用消息偏移叠加，仅作用于气泡窗口）。
//   传 null/undefined（任一为 null 即视为清除）则恢复为参数/运行时默认值。
WSQ.DP.setBubbleOffset = function (x, y) {
    if (x === null || x === undefined || y === null || y === undefined) {
        WSQ.DP._forcedBubbleOffset = undefined;
        return;
    }
    WSQ.DP._forcedBubbleOffset = { x: Number(x) || 0, y: Number(y) || 0 };
};

// 把“aN”形式的字符串解析为队伍中对应数据库编号的角色（Game_Actor）。
WSQ.DP._findPartyMemberByActorId = function (actorId) {
    if (!actorId) return null;
    const members = ($gameParty && $gameParty.members) ? $gameParty.members() : [];
    let actor = members.find(a => a && a.actorId && a.actorId() === actorId);
    if (!actor && $gameParty && $gameParty.battleMembers) {
        actor = $gameParty.battleMembers().find(a => a && a.actorId && a.actorId() === actorId);
    }
    return actor || null;
};

// 按“角色名”查找玩家队伍在地图/战斗中的气泡目标：
//   - 地图上：领队 -> Game_Player，其他队员 -> 对应队列 Game_Follower；
//   - 战斗中：返回 Game_Actor（战斗 Sprite 按 Game_Actor 匹配）。
WSQ.DP._findPartyMemberTargetByName = function (name) {
    if (!name) return null;
    const members = ($gameParty && $gameParty.members) ? $gameParty.members() : [];
    const leader = ($gameParty && $gameParty.leader) ? $gameParty.leader() : null;
    const followers = ($gamePlayer && $gamePlayer.followers && $gamePlayer.followers().data)
        ? $gamePlayer.followers().data() : [];
    for (let i = 0; i < members.length; i++) {
        const actor = members[i];
        if (!actor || !actor.name) continue;
        if (actor.name() !== name) continue;
        // 战斗中直接返回角色本体，交给战斗 Spriteset 匹配。
        if ($gameParty.inBattle && $gameParty.inBattle()) {
            return actor;
        }
        // 领队对应玩家本体。
        if (actor === leader) return $gamePlayer;
        // 其他队员对应队列中的跟随者。
        const follower = followers.find(f => f && f.actor && f.actor() === actor);
        if (follower) return follower;
        continue;
    }
    return null;
};

// 解析“特殊写法”在姓名框中实际应显示的姓名。
// 返回 undefined 表示不需要改写（沿用姓名框原始内容）。
WSQ.DP.resolveBubbleDisplayName = function (name, target) {
    if (!name || !target) return undefined;
    // 与 resolveBubbleTargetByName 保持一致：先替换 \V[n]，再去掉颜色代码用于判断。
    let raw = String(name).replace(/\\V\[(\d+)\]/gi, (m, n) => $gameVariables.value(parseInt(n, 10)));
    const clean = raw.replace(/\\C\[(\d+)\]/gi, "").trim();
    if (clean === "") return undefined;
    const lower = clean.toLowerCase();

    // 任意名 (event 3) / 任意名 (3)：保留括号前的“任意名”作为显示名
    if (/\((?:event\s*)?\d+\)\s*$/i.test(clean)) {
        const display = raw.replace(/\s*\((?:event\s*)?\d+\)\s*$/i, "").trim();
        return display || undefined;
    }
    // 任意名 (this)：保留括号前的“任意名”
    if (/\(this\)\s*$/i.test(clean)) {
        const display = raw.replace(/\s*\(this\)\s*$/i, "").trim();
        return display || undefined;
    }
    // this：显示当前事件的事件名
    if (lower === "this") {
        if (target.event && target.event() && target.event().name) {
            return target.event().name;
        }
        return undefined;
    }
    // player：显示队伍领队（玩家）的真实角色名
    if (lower === "player") {
        const leader = ($gameParty && $gameParty.leader) ? $gameParty.leader() : null;
        return leader && leader.name ? leader.name() : undefined;
    }
    // follower: 名称 / follower: 序号：显示对应跟随者的真实角色名
    if (lower.startsWith("follower:")) {
        if (target.actor) {
            const actor = target.actor();
            return actor && actor.name ? actor.name() : undefined;
        }
        if (target.name) return target.name();
        return undefined;
    }
    return undefined;
};

// 按“姓名”解析气泡目标角色（参照 Hendrix 同名事件匹配 + 关键字）。
// 返回 Game_Character / Game_Actor，未匹配返回 null。
WSQ.DP.resolveBubbleTargetByName = function (name) {
    if (!name) return null;
    // 支持 \V[n] 变量替换（与对话核心一致）
    let raw = String(name).replace(/\\V\[(\d+)\]/gi, (m, n) => $gameVariables.value(parseInt(n, 10)));
    // 去掉颜色代码后匹配
    const clean = raw.replace(/\\C\[(\d+)\]/gi, "").trim();
    if (clean === "") return null;
    const lower = clean.toLowerCase();

    // 当前事件
    if (lower === "this" || /\(this\)$/i.test(clean)) {
        const evId = ($gameMap._interpreter && $gameMap._interpreter.eventId) ? $gameMap._interpreter.eventId() : 0;
        return evId > 0 ? $gameMap.event(evId) : null;
    }
    // 指定事件 ID：Name (event 3) 或 Name (3)
    const evIdMatch = clean.match(/\((?:event\s*)?(\d+)\)\s*$/i);
    if (evIdMatch) {
        return $gameMap.event(parseInt(evIdMatch[1], 10)) || null;
    }
    // 玩家：地图上返回 Game_Player，战斗中返回领队角色（与对话核心的“领队角色”一致）。
    if (lower === "player") {
        if ($gameParty.inBattle && $gameParty.inBattle()) {
            return ($gameParty.leader && $gameParty.leader()) || $gamePlayer;
        }
        return $gamePlayer;
    }
    // 跟随者：follower: 名称 / follower: 序号
    if (lower.startsWith("follower:")) {
        const fid = clean.substring(9).trim();
        const followers = ($gamePlayer.followers && $gamePlayer.followers().data)
            ? $gamePlayer.followers().data()
            : (($gamePlayer._followers && $gamePlayer._followers.data) ? $gamePlayer._followers.data() : []);
        const aid = parseInt(fid, 10);
        if (!isNaN(aid)) {
            const f = followers[aid - 1] || null;
            if (!(f && f.actor && f.actor())) return null;
            return ($gameParty.inBattle && $gameParty.inBattle()) ? f.actor() : f;
        }
        for (let i = 0; i < followers.length; i++) {
            const f = followers[i];
            if (f && f.actor && f.actor() && f.actor().name() === fid) {
                return ($gameParty.inBattle && $gameParty.inBattle()) ? f.actor() : f;
            }
        }
        return null;
    }
    // 优先按地图事件名匹配（仅匹配有活动页的事件），保持原有事件名定位习惯。
    const ev = $gameMap.events().find(e => e.event() && e.event().name === clean && e.page() !== null);
    if (ev) return ev;
    // 再按玩家队伍角色名匹配（领队 / 队列跟随者）。
    const partyTarget = WSQ.DP._findPartyMemberTargetByName(clean);
    return partyTarget || null;
};

// 便捷脚本接口：设定下一段对话的气泡目标。
//   spec 为数字：1+ 事件ID / 0 本事件 / -1 玩家 / <-1 跟随者
//   spec 为字符串："aN" 队伍角色(数据库编号N) / 其它 按事件名或队伍角色名匹配
//   spec 为 null/undefined：清除手动指定，回退对话核心默认
WSQ.DP.setBubbleTarget = function (spec) {
    if (spec === null || spec === undefined) {
        WSQ.DP._forcedBubbleTarget = undefined;
        return;
    }
    let target = null;
    if (typeof spec === "string") {
        const aMatch = String(spec).trim().match(/^a(\d+)$/i);
        if (aMatch) {
            target = WSQ.DP._findPartyMemberByActorId(parseInt(aMatch[1], 10));
        } else {
            target = WSQ.DP.resolveBubbleTargetByName(spec);
        }
    } else {
        const n = Number(spec);
        if (!isNaN(n)) {
            if (n >= 1) {
                target = $gameMap.event(n);
            } else if (n === 0) {
                const evId = ($gameMap._interpreter && $gameMap._interpreter.eventId) ? $gameMap._interpreter.eventId() : 0;
                target = evId > 0 ? $gameMap.event(evId) : null;
            } else if (n === -1) {
                target = $gamePlayer;
            } else {
                const idx = -n - 2; // -2->0, -3->1 ...
                const followers = ($gamePlayer.followers && $gamePlayer.followers().data)
                    ? $gamePlayer.followers().data()
                    : (($gamePlayer._followers && $gamePlayer._followers.data) ? $gamePlayer._followers.data() : []);
                const f = followers[idx] || null;
                target = f && ($gameParty.inBattle && $gameParty.inBattle()) ? f.actor() : f;
            }
        }
    }
    WSQ.DP._forcedBubbleTarget = target;
};

//=============================================================================
// Plugin Commands
//=============================================================================

PluginManager.registerCommand(WSQ.DP.pluginName, "WSQNameInline", (args) => {
    const enable = String(args.enable || "false").trim().toLowerCase() === "true";
    if ($gameSystem) {
        $gameSystem._wsqDpNameInline = enable;
    }
});

PluginManager.registerCommand(WSQ.DP.pluginName, "WSQNameSeparator", (args) => {
    const enable = String(args.enable || "false").trim().toLowerCase() === "true";
    if ($gameSystem) {
        $gameSystem._wsqDpNameSeparator = enable;
    }
});

PluginManager.registerCommand(WSQ.DP.pluginName, "WSQAutoBubbleByName", (args) => {
    const enable = String(args.enable || "false").trim().toLowerCase() === "true";
    if ($gameSystem) {
        $gameSystem._wsqDpAutoBubbleByName = enable;
    }
});

PluginManager.registerCommand(WSQ.DP.pluginName, "WSQBubbleOffset", (args) => {
    const x = Number(args.OffsetX || 0) || 0;
    const y = Number(args.OffsetY || 0) || 0;
    if ($gameSystem) {
        $gameSystem._wsqDpBubbleOffsetX = x;
        $gameSystem._wsqDpBubbleOffsetY = y;
    }
});

PluginManager.registerCommand(WSQ.DP.pluginName, "WSQAutoWordWrap", (args) => {
    const mode = String(args.mode || "auto").trim().toLowerCase();
    if ($gameSystem) {
        $gameSystem._wsqDpAutoWordWrap = ["auto", "on", "off"].includes(mode) ? mode : "auto";
    }
});

//=============================================================================
// Window_Message : 动态气泡宽高
//=============================================================================

// 解析 <dh>/</dh>、<dw>/</dw> 控制标签（仅在气泡模式生效）。
// 标签会从显示文本中剥离，不显示在正文里。
WSQ.DP.Window_Message_convertDefaultExEscapeCharacters =
    Window_Message.prototype.convertDefaultExEscapeCharacters;
Window_Message.prototype.convertDefaultExEscapeCharacters = function (text) {
    let ret = WSQ.DP.Window_Message_convertDefaultExEscapeCharacters
        ? WSQ.DP.Window_Message_convertDefaultExEscapeCharacters.call(this, text)
        : text;
    let dh = false;
    let dw = false;
    if (this.isBubbleStyle()) {
        const hasDh = /<dh>/i.test(ret);
        const hasDw = /<dw>/i.test(ret);
        const hasCloseDh = /<\/dh>/i.test(ret);
        const hasCloseDw = /<\/dw>/i.test(ret);
        ret = ret.replace(/<dh>/gi, () => { dh = true; return ""; });
        ret = ret.replace(/<\/dh>/gi, () => { dh = false; return ""; });
        ret = ret.replace(/<dw>/gi, () => { dw = true; return ""; });
        ret = ret.replace(/<\/dw>/gi, () => { dw = false; return ""; });
        // 开启标签优先：只要出现 <dh>/<dw> 就强制启用；
        // 若只出现结束标签，则强制禁用（用于覆盖“默认开启”）。
        if (hasDh) this._wsqDpH = true;
        else if (hasCloseDh) this._wsqDpH = false;
        if (hasDw) this._wsqDpW = true;
        else if (hasCloseDw) this._wsqDpW = false;
    }
    return ret;
};

// 自动换行时使用固定的“布局宽度”，避免动态宽度变化导致换行点来回跳动。
WSQ.DP.Window_Message_needWordWrap = Window_Message.prototype.needWordWrap;
Window_Message.prototype.needWordWrap = function (textState) {
    if (this.isBubbleStyle() && this._wsqDpLayoutInner > 0 && this._wordWrap) {
        if (!textState) return false;
        const text = textState.buffer + (textState.text[textState.index] || "");
        const width = this.textWidth(text);
        // textSizeEx 的 x 从 0 开始，而实际绘制从 newLineX 开始；
        // 把测量阶段的起始位移补齐，保证测量与实际绘制的换行点一致。
        const x = textState.drawing ? textState.x : textState.x + (this._wsqDpMargin || 0);
        return width + x > this._wsqDpLayoutInner;
    }
    return WSQ.DP.Window_Message_needWordWrap.call(this, textState);
};

// 绘制帧结束后刷新气泡当前应显示的宽/高。
// 只允许“内容位图保持最终大小 + 窗口外框缩小/放大”的方式做动态变化，
// 因此绝不调用 createContents()。
Window_Message.prototype.wsqDpApplyCurrentBubbleSize = function (textState) {
    if (!this.isBubbleStyle()) return;
    const dynH = !!this._wsqDpH;
    const dynW = !!this._wsqDpW;
    if (!dynH && !dynW) return;

    const st = textState || this._textState;
    if (!st) return;
    const padH = this._wsqDpPadH !== undefined ? this._wsqDpPadH : $gameSystem.windowPadding();
    const padW = this._wsqDpPadW !== undefined
        ? this._wsqDpPadW
        : ($gameSystem.windowPadding() + (typeof this.itemPadding === "function" ? this.itemPadding() : 8));
    const fullH = this._wsqDpFullH || this.height;
    const fullW = this._wsqDpFullW || this.width;
    const margin = this._wsqDpMargin !== undefined ? this._wsqDpMargin :
        (($gameMessage && $gameMessage.faceName() !== "")
            ? ImageManager.faceWidth + 20
            : 4);

    let contentH = this.lineHeight();
    let contentW = 0;
    if (st) {
        contentW = Math.max(st.outputWidth || 0, 0);
        contentH = Math.max(contentH, st.outputHeight || 0, st.y + (st.height || 0));
    }

    if (dynW) {
        const minW = padW * 2 + margin + 8;
        const nameMinW = this._wsqDpMinW || 0;
        const targetW = Math.min(fullW, Math.max(minW, nameMinW, Math.ceil(contentW) + margin + padW * 2));
        if (targetW !== this.width) this.width = targetW;
    }

    if (dynH) {
        let targetH = Math.min(fullH, Math.ceil(contentH) + padH * 2);
        // 脸图兼容：有脸图时至少完整显示脸图高度。
        if ($gameMessage && $gameMessage.faceName() !== "") {
            const faceH = (typeof ImageManager.faceHeight === "number") ? ImageManager.faceHeight : 96;
            targetH = Math.min(fullH, Math.max(targetH, faceH + padH * 2));
        }
        if (targetH !== this.height) this.height = targetH;
    }

    // 动态尺寸改变后，需要同步气泡箭头/脸图的位置，避免顶部贴图停留在旧高度。
    if (this._bubbleArrow && typeof this.refreshBubbleArrow === "function") {
        this.refreshBubbleArrow();
    }
    if (this._bubbleFace && this._bubbleFace.visible && $gameMessage && $gameMessage.faceName() !== "") {
        const faceH = (typeof ImageManager.faceHeight === "number") ? ImageManager.faceHeight : 96;
        this._bubbleFace.x = $gameSystem.windowPadding();
        this._bubbleFace.y = this.height - faceH - $gameSystem.windowPadding();
    }
};

// 绘制循环中每一帧更新一次气泡尺寸。
// 注意：GF 对话核心在文本绘制完成时（onEndOfText）会把 this._textState 置空，
// 因此必须在本帧调用 GF.updateMessage 之前先捕获 textState；否则在“按下确定键快进
// 一口气显示完所有文字”的那一帧，气泡的最终拉伸会因为读取到 null 而被跳过，
// 导致气泡停在当前打字尺寸、文字显示不全。
WSQ.DP.Window_Message_updateMessage = Window_Message.prototype.updateMessage;
Window_Message.prototype.updateMessage = function () {
    const textState = this._textState;
    const result = WSQ.DP.Window_Message_updateMessage.call(this);
    this.wsqDpApplyCurrentBubbleSize(textState);
    return result;
};

//=============================================================================
// Window_Message : 内联姓名
//=============================================================================

// 按格式参数渲染姓名字符串，%1 替换为实际姓名。
Window_Message.prototype.formatSpeakerName = function (name) {
    const format = WSQ.DP.Param.NameFormat;
    return (format || "%1").replace(/%1/g, String(name));
};

// 姓名行渐变背景（可选）：在姓名文字下方绘制一条从左到右的渐变条。
// 长度 = 姓名可用区域宽度的比例（0~1）；RTL 文本时条从右缘向左延伸。
Window_Message.prototype.drawNameGradientBackground = function (textState, nameX) {
    if (!WSQ.DP.Param.NameBackGradientEnabled) return;
    const ratio = Number(WSQ.DP.Param.NameBackGradientLength);
    if (!(ratio > 0)) return;
    const avail = textState.rtl ? nameX : this.innerWidth - nameX;
    const barW = Math.floor(avail * Math.min(1, Math.max(0, ratio)));
    if (barW < 4) return;
    const barX = textState.rtl ? nameX - barW : nameX;
    const colorL = WSQ.DP.resolveColor(WSQ.DP.Param.NameBackGradientColorL);
    const colorR = WSQ.DP.resolveColor(WSQ.DP.Param.NameBackGradientColorR);
    if (typeof this.contents.gradientFillNormalRect !== "function") return;
    this.contents.gradientFillNormalRect(barX, 0, barW, this.lineHeight(), colorL, colorR);
};

// 姓名分隔线：在姓名行与正文之间绘制一条左对齐、从左到右渐变的横向线。
// 右侧固定为透明（rgba(0,0,0,0)），左侧颜色由插件参数控制。
Window_Message.prototype.drawNameSeparator = function (textState, nameX) {
    if (!WSQ.DP.nameSeparatorActive()) return;
    const ratio = Number(WSQ.DP.Param.NameSeparatorLength);
    if (!(ratio > 0)) return;
    // 左对齐：以姓名起点为分隔线起点，向右延伸。
    const avail = Math.max(0, this.innerWidth - nameX);
    const sepW = Math.floor(avail * Math.min(1, Math.max(0, ratio)));
    if (sepW < 4) return;
    const sepY = this.lineHeight() + (WSQ.DP.Param.NameSeparatorMarginTop || 0);
    const colorL = WSQ.DP.resolveColor(WSQ.DP.Param.NameSeparatorColorL);
    const colorR = "rgba(0,0,0,0)";
    if (typeof this.contents.gradientFillNormalRect !== "function") return;
    this.contents.gradientFillNormalRect(nameX, sepY, sepW, 2, colorL, colorR);
};

// 覆写 numVisibleRows：仅在「启用内联姓名且当前这条消息确实有姓名」时，
// 给窗口高度额外预留一行，使设定的对话行数始终留给正文、姓名不抢占行。
// 无姓名时不预留，行数保持灵活。
WSQ.DP.Window_Message_numVisibleRows = Window_Message.prototype.numVisibleRows;
Window_Message.prototype.numVisibleRows = function () {
    const rows = WSQ.DP.Window_Message_numVisibleRows.call(this);
    return (WSQ.DP.nameInlineEnabled() && $gameMessage.speakerName()) ? rows + 1 : rows;
};

// 覆写 windowHeight：在「内联姓名 + 姓名分隔线」且当前消息有姓名时，
// 额外加上分隔线上边距 + 分隔线高度(2px) + 下边距，保证普通对话窗口
// 不会因为分隔线挤压正文行数。
WSQ.DP.Window_Message_windowHeight = Window_Message.prototype.windowHeight;
Window_Message.prototype.windowHeight = function () {
    const h = WSQ.DP.Window_Message_windowHeight.call(this);
    return h + WSQ.DP.nameSeparatorHeight();
};

// 气泡窗口的宽高由 GF 的 changeToBubble 按“正文实际尺寸”计算，
// 完全不经过 numVisibleRows。因此内联姓名要额外预留一行，必须在此处处理。
// 同时姓名的宽度也要作为气泡宽度的兜底：若姓名比正文更长，
// 不能让气泡框按短正文缩得太窄，否则姓名会被裁切。
// 仅在「启用内联 + 当前消息有姓名 + 是首页」时处理，后续分页不再加高/加宽，
// 避免底部留空行或额外留白。
WSQ.DP.Window_Message_changeToBubble = Window_Message.prototype.changeToBubble;
Window_Message.prototype.changeToBubble = function () {
    const dynH = !!this._wsqDpH;
    const dynW = !!this._wsqDpW;
    const faceExists = $gameMessage.faceName() !== "";
    const faceWidth = ImageManager.faceWidth;
    const spacing = 20;
    const padding = this.padding + this.itemPadding();
    const margin = faceExists ? faceWidth + spacing : 4;
    this._wsqDpMargin = margin;
    this._wsqDpPadW = padding;
    this._wsqDpPadH = $gameSystem.windowPadding();

    // 自动换行：以“消息窗口宽度”作为气泡最大外宽，固定换行布局。
    // 这样动态宽度改变窗口外框时，不会让换行点跟着来回跳动。
    this._wsqDpLayoutInner = 0;
    if (this._wordWrap && this.isBubbleStyle()) {
        const maxOuterW = Math.min(this.windowWidth(), Graphics.boxWidth);
        this._wsqDpLayoutInner = Math.max(1, maxOuterW - this.padding * 2);
        this.width = maxOuterW;
        WSQ.DP.Window_Message_changeToBubble.call(this);
        // 自动换行需要以“消息窗口宽度”作为换行上限；但实际外宽仍以文字内容为准，
        // 未写满上限时气泡保持贴合内容。动态宽度时可再缩小到当前文字宽度，
        // 内容位图仍按最终宽度绘制，避免裁切。
        const measuredOuter = this.width;
        this.width = Math.min(maxOuterW, Math.max(1, measuredOuter));
        this.createContents();
    } else {
        WSQ.DP.Window_Message_changeToBubble.call(this);
    }

    // 记录最终尺寸（未启用动态时也记录，便于后续判断）。
    this._wsqDpFullW = this.width;
    this._wsqDpFullH = this.height;

    if (WSQ.DP.nameInlineEnabled() && $gameMessage.speakerName() && this._wsqFirstPage) {
        // 姓名宽度兜底：与 GF 原始 changeToBubble 使用相同的 margin / padding 计算，
        // 保证“姓名所需宽度 + 边距”能完整塞进气泡。
        const formattedName = this.formatSpeakerName($gameMessage.speakerName());
        const prevWordWrap = this._wordWrap;
        const nameSize = this.textSizeEx(formattedName);
        this._wordWrap = prevWordWrap;
        const requiredWidth = Math.ceil(nameSize.width) + margin + padding * 2;
        this._wsqDpMinW = requiredWidth;
        if (this.width < requiredWidth) {
            this.width = requiredWidth;
        }

        // 姓名行额外加高一行
        this.height += this.lineHeight();

        // 若启用姓名分隔线，再补上分隔线区域高度（上边距 + 线高 + 下边距）
        this.height += WSQ.DP.nameSeparatorHeight();
        this.createContents();

        // 名称/分隔线补完后，最终尺寸仍要记录为“完整高度”。
        this._wsqDpFullW = this.width;
        this._wsqDpFullH = this.height;
    }

    // 动态宽高：把窗口先缩到当前已绘制文字对应的初始尺寸。
    // 内容位图仍保留完整大小，因此不会丢失已绘制文字。
    if (dynH || dynW) {
        this.wsqDpApplyCurrentBubbleSize();
    }
};

// 每条新消息开始时复位首页标记（姓名只画在首页）。
WSQ.DP.Window_Message_startMessage = Window_Message.prototype.startMessage;
Window_Message.prototype.startMessage = function () {
    this._wsqFirstPage = true;
    this._wsqDpH = !!WSQ.DP.Param.DefaultDynamicHeight;
    this._wsqDpW = !!WSQ.DP.Param.DefaultDynamicWidth;
    this._wsqDpLayoutInner = 0;
    this._wsqDpMinW = 0;
    WSQ.DP.Window_Message_startMessage.call(this);
};

// 覆写 newPage：在正文绘制前，于第一行绘制姓名，并将正文起始行下移一行。
// 同时，在绘制姓名/设定好正文起始位置后，刷新一次气泡动态尺寸。
WSQ.DP.Window_Message_newPage = Window_Message.prototype.newPage;
Window_Message.prototype.newPage = function (textState) {
    // 先执行原生逻辑（清屏、复位字体、刷新姓名窗口内容等）
    WSQ.DP.Window_Message_newPage.call(this, textState);

    if (WSQ.DP.nameInlineEnabled()) {
        const name = $gameMessage.speakerName();
        const formatted = name ? this.formatSpeakerName(name) : "";
        if (formatted !== "") {
            // 动态宽度生效时，姓名/分隔线/渐变背景都应按“最终完整宽度”计算，
            // 否则当前窗口还处于初始拉伸宽度，背景和分隔线会被算短。
            const prevDynWidth = this.width;
            if (this.isBubbleStyle() && this._wsqDpW && this._wsqDpFullW) {
                this.width = this._wsqDpFullW;
            }

            // 姓名绘制位置与正文起始对齐（自动处理立绘留白与 RTL）
            const nameX = this.newLineX(textState);

            // 姓名行渐变背景（可选）：先画背景，再画姓名文字
            this.drawNameGradientBackground(textState, nameX);

            // 姓名文字本身不参与主文本的自动换行标记。
            const prevWordWrap = this._wordWrap;
            this.drawTextEx(formatted, nameX, 0, this.innerWidth - nameX);
            // drawTextEx 内部会重新走 convertEscapeCharacters，可能把 _wordWrap 重置，
            // 这里恢复主文本的自动换行标记。
            this._wordWrap = prevWordWrap;

            // 姓名分隔线（可选）：在姓名行与正文之间绘制，并占用的高度一并计入
            this.drawNameSeparator(textState, nameX);

            // 正文顺位下移：先移过姓名行，再移过分隔线区域
            textState.y += this.lineHeight();
            textState.y += WSQ.DP.nameSeparatorHeight();

            // 姓名可能以非默认色结尾，复位字体避免影响后续正文
            this.resetFontSettings();

            // 首页姓名已绘制，后续分页不再加高/绘制姓名
            this._wsqFirstPage = false;

            // 恢复动态宽度下的初始拉伸宽度，后续由 wsqDpApplyCurrentBubbleSize 统一校正。
            if (this.isBubbleStyle() && this._wsqDpW && this._wsqDpFullW) {
                this.width = prevDynWidth;
            }
        }
    }

    // 姓名偏移/正文起始位置确定后，刷新一次初始动态尺寸。
    this.wsqDpApplyCurrentBubbleSize();
};

// 覆写 updateSpeakerName：启用内联时不再向独立姓名窗口写入姓名。
WSQ.DP.Window_Message_updateSpeakerName = Window_Message.prototype.updateSpeakerName;
Window_Message.prototype.updateSpeakerName = function () {
    if (WSQ.DP.nameInlineEnabled()) return;
    WSQ.DP.Window_Message_updateSpeakerName.call(this);
};

// 覆写 synchronizeNameBox：启用内联时隐藏独立姓名窗口。
WSQ.DP.Window_Message_synchronizeNameBox = Window_Message.prototype.synchronizeNameBox;
Window_Message.prototype.synchronizeNameBox = function () {
    if (WSQ.DP.nameInlineEnabled() && this._nameBoxWindow) {
        this._nameBoxWindow.visible = false;
        return;
    }
    if (WSQ.DP.Window_Message_synchronizeNameBox) {
        WSQ.DP.Window_Message_synchronizeNameBox.call(this);
    }
};

// 覆写 updateBubblePosition：在对话核心原生定位（含通用消息偏移 messageOffset）
// 之后，叠加本补丁的“气泡专属偏移”。该偏移仅作用于气泡窗口，不影响普通对话窗口。
// 注意：原方法在 opening/closing 阶段会提前返回、不重算位置，故此处必须沿用相同的
// 守卫，否则会在开/关阶段的每一帧重复叠加偏移导致累积漂移。
WSQ.DP.Window_Message_updateBubblePosition = Window_Message.prototype.updateBubblePosition;
Window_Message.prototype.updateBubblePosition = function () {
    if (WSQ.DP.Window_Message_updateBubblePosition) {
        WSQ.DP.Window_Message_updateBubblePosition.call(this);
    }
    if (this.visible && this.isBubbleStyle() && !this.isOpening() && !this.isClosing()) {
        const off = WSQ.DP.bubbleOffset();
        this.x += off.x;
        this.y += off.y;
    }
};

// 修复气泡箭头方向不复位（GF 对话核心 refreshBubbleArrow 的已知缺陷）：
// 原函数仅在“气泡位于角色下方”时把 this._bubbleArrow.scale.y 设为 -1（箭头朝上），
// 但“气泡位于角色上方”的分支没有把 scale.y 恢复为 1。由于 _bubbleArrow 精灵只创建
// 一次、跨多条对话复用（仅 terminateMessage 时 hide，不重建），一旦某条对话的气泡
// 出现在目标下方（scale.y 被置 -1），之后即便气泡又回到目标上方，箭头仍保持翻转状态，
// 视觉上“方向不稳定 / 切回时箭头方向错乱”。
// 此处覆写并显式按当前 this.y 与角色 y 的关系设置 scale.y，确保每条消息方向正确。
WSQ.DP.Window_Message_refreshBubbleArrow = Window_Message.prototype.refreshBubbleArrow;
Window_Message.prototype.refreshBubbleArrow = function () {
    if (WSQ.DP.Window_Message_refreshBubbleArrow) {
        WSQ.DP.Window_Message_refreshBubbleArrow.call(this);
    }
    const sprite = $gameMessage.bubbleSprite();
    if (!sprite || !this._bubbleArrow) return;
    if (this.y > sprite.y) {
        this._bubbleArrow.scale.y = -1; // 气泡在角色下方 → 箭头朝上
    } else {
        this._bubbleArrow.scale.y = 1;  // 气泡在角色上方 → 箭头朝下（显式复位，关键修复）
    }
};

//=============================================================================
// Window_NameBox : 内联时禁止独立窗口启动
//=============================================================================

WSQ.DP.Window_NameBox_start = Window_NameBox.prototype.start;
Window_NameBox.prototype.start = function () {
    if (WSQ.DP.nameInlineEnabled()) {
        this.visible = false;
        return;
    }
    if (WSQ.DP.Window_NameBox_start) {
        WSQ.DP.Window_NameBox_start.call(this);
    }
};

//=============================================================================
// Game_Message : 气泡目标（姓名自动定位 + 便捷脚本接口）
//=============================================================================
// 统一控制“普通对话框”与“气泡对话框”的自动换行（两者共用同一开关）。
// 对话核心原本在气泡模式下一律禁用自动换行（msgWordWrap = 原值 && !bubbleSprite）；
// 这里提供独立的插件参数 / 运行时开关：
//   on  -> 强制开启（忽略系统设置，普通框与气泡框都换行）
//   off -> 强制关闭（忽略系统设置，普通框与气泡框都不换行）
//   auto-> 沿用 GF_0_CoreOfText 的全局“消息窗口自动换行”设置，等价于接入前行为。
// msgWordWrap() 是 Window_Message 中 _wordWrap 的唯一来源，覆写此处即可同时覆盖
// 默认对话框与气泡对话框，无需分别处理。
WSQ.DP.Game_Message_msgWordWrap = Game_Message.prototype.msgWordWrap;
Game_Message.prototype.msgWordWrap = function () {
    const mode = WSQ.DP.autoWordWrapMode();
    if (mode === "on") return true;
    if (mode === "off") return false;
    // auto：沿用 GF_0_CoreOfText 的全局“消息窗口自动换行”开关
    // （等价于接入本功能前的默认行为，保证与对话核心兼容）。
    if (GF.COD.Game_Message_msgWordWrap) {
        return GF.COD.Game_Message_msgWordWrap.call(this);
    }
    return WSQ.DP.Game_Message_msgWordWrap.call(this);
};

// 对话核心在 addText 时按“气泡数据”系统参数设定气泡目标，较死板。
// 本段在 setupBubbleSprite 中优先采用本补丁的目标（姓名自动匹配 / 脚本接口），
// 未命中再回退对话核心默认逻辑。

WSQ.DP.Game_Message_setupBubbleSprite = Game_Message.prototype.setupBubbleSprite;
Game_Message.prototype.setupBubbleSprite = function () {
    // 已设定则跳过（保留对话核心“只设一次”的语义）
    if (this._bubbleSprite) return;

    const name = $gameMessage.speakerName();

    // 特殊写法（player / this / follower: 等）命中目标后，把姓名框内容替换为
    // 被定位目标的真实姓名，避免原样显示关键字或括号写法。
    const applyDisplayName = (t) => {
        if (!t || !name) return;
        const displayName = WSQ.DP.resolveBubbleDisplayName(name, t);
        if (displayName !== undefined && displayName !== name) {
            this.setSpeakerName(displayName);
        }
    };

    // 功能三：姓名自动定位气泡
    if (WSQ.DP.autoBubbleByNameEnabled()) {
        if (name) {
            const t = WSQ.DP.resolveBubbleTargetByName(name);
            if (t) {
                applyDisplayName(t);
                this._bubbleSprite = SceneManager.getBubbleTargetSprite(t);
                return;
            }
        }
    }

    // 功能四：脚本接口手动指定目标
    if (WSQ.DP._forcedBubbleTarget !== undefined) {
        const t = WSQ.DP._forcedBubbleTarget;
        applyDisplayName(t);
        this._bubbleSprite = t ? SceneManager.getBubbleTargetSprite(t) : null;
        return;
    }

    // 回退对话核心原生逻辑（按气泡数据系统参数）
    if (WSQ.DP.Game_Message_setupBubbleSprite) {
        WSQ.DP.Game_Message_setupBubbleSprite.call(this);
    }
};

// 每条消息结束时清除手动指定的气泡目标，避免泄漏到后续对话。
WSQ.DP.Game_Message_clear = Game_Message.prototype.clear;
Game_Message.prototype.clear = function () {
    if (WSQ.DP.Game_Message_clear) {
        WSQ.DP.Game_Message_clear.call(this);
    }
    WSQ.DP._forcedBubbleTarget = undefined;
    WSQ.DP._forcedBubbleOffset = undefined;
};

//=============================================================================
// Window_Message : \font 文字装饰（移植自 鹰式对话框扩展 EAGLE-MessageEX）
//=============================================================================
// 复刻 \font[param] 文字绘制设置：
//   name/size/ca/i/b/o/or/og/ob/oa/c（字体基础属性）
//   w/h（字距/行高增量）、p/pc（底纹）、l/lc/lp（外发光→描边光晕近似）、
//   d/dc（删除线）、u/uc（下划线）
// 说明：
//   · RGSS3 原版的"阴影 s / 文字破碎 k"在 MZ 无对应 API，本移植不提供。
//   · 外发光在 MZ 中无局部模糊，用"加粗描边光晕"近似实现。
//   · 命中装饰（p/l/d/u/w/h/ca 任一非默认）的文本段改为逐字绘制，
//     不再走 GF 的文本淡入动画；仅改基础属性的段落不受影响。
//   · 装饰参数持续生效（存于 this._wsqFnt），直到新的 \font、换页或 resetFontSettings。
//   · 竖排（RTL）文本段不参与装饰，自动回退为普通绘制。

// 解析 \font 参数串（仿鹰式 parse_param：字母+数字组合、可加空格/=、$ 复位；
// 首位纯数字为 size 快捷参数）
WSQ.DP.parseFontParam = function (paramText) {
    const ps = {};
    let s = String(paramText || "").trim().toLowerCase();
    let m = s.match(/^\-?\d+/);
    if (m) {
        ps.size = parseInt(m[0], 10);
        s = s.slice(m[0].length);
    }
    while (s.length > 0) {
        s = s.replace(/^\s+/, "");
        m = s.match(/^[a-z]+/);
        if (!m) break;
        const key = m[0];
        s = s.slice(key.length);
        s = s.replace(/^\s+/, "");
        if (s.charAt(0) === "=") {
            s = s.slice(1);
            s = s.replace(/^\s+/, "");
        }
        if (s.charAt(0) === "$") {
            s = s.slice(1);
            ps[key] = null;
            continue;
        }
        m = s.match(/^\-?\d+/);
        if (m) {
            ps[key] = parseInt(m[0], 10);
            s = s.slice(m[0].length);
        } else {
            ps[key] = null;
        }
    }
    return ps;
};

// 1/0 / true/false / 布尔 统一转布尔
WSQ.DP.checkBool = function (v) {
    if (v === null || v === undefined) return false;
    if (typeof v === "boolean") return v;
    return v !== 0;
};

// 0~255 分量 → CSS rgba 字符串（a 为 0~255，转 0~1）
WSQ.DP.rgba = function (r, g, b, a) {
    const c = (n) => Math.max(0, Math.min(255, Math.round(Number(n) || 0)));
    const al = Math.max(0, Math.min(1, (a === undefined || a === null ? 255 : Number(a) || 0) / 255));
    return "rgba(" + c(r) + "," + c(g) + "," + c(b) + "," + al + ")";
};

// \font[name]：数字序号 → 插件参数「字体预设」中的字体名；否则直接作为字体名
WSQ.DP.fontFaceFor = function (name) {
    const n = parseInt(name, 10);
    if (!isNaN(n) && String(n) === String(name).trim()) {
        return WSQ.DP.Param.FontFacePresets[n] || "sans-serif";
    }
    return String(name);
};

// 当前 \font 参数是否需要逐字装饰绘制
Window_Message.prototype.wsqDpNeedDecor = function (fs) {
    if (!fs) return false;
    if (fs.p) return true;
    if (fs.l) return true;
    if (fs.d) return true;
    if (fs.u) return true;
    if (fs.w) return true;
    if (fs.h) return true;
    if (fs.ca !== undefined && fs.ca !== null) return true;
    return false;
};

// 应用 \font 基础字体属性到内容位图（ps 为合并后的当前参数）
// 注意：MZ 的 Bitmap 没有嵌套 font 对象，字体属性直接挂在 Bitmap 上
// （fontFace/fontSize/fontBold/fontItalic/outlineColor/outlineWidth/textColor）。
Window_Message.prototype.wsqDpApplyFontParams = function (ps) {
    const bmp = this.contents;
    if (!bmp) return;
    if (ps.name !== undefined) {
        bmp.fontFace = ps.name === null ? this.standardFontFace() : WSQ.DP.fontFaceFor(ps.name);
    }
    if (ps.size !== undefined) {
        bmp.fontSize = ps.size === null ? this.standardFontSize() : ps.size;
    }
    if (ps.b !== undefined && ps.b !== null) bmp.fontBold = WSQ.DP.checkBool(ps.b);
    if (ps.i !== undefined && ps.i !== null) bmp.fontItalic = WSQ.DP.checkBool(ps.i);
    if (ps.o !== undefined && ps.o !== null) {
        bmp.outlineWidth = WSQ.DP.checkBool(ps.o) ? WSQ.DP.Param.FontOutlineWidth : 0;
    }
    if (ps.or !== undefined || ps.og !== undefined || ps.ob !== undefined || ps.oa !== undefined) {
        bmp.outlineColor = WSQ.DP.rgba(
            ps.or !== undefined && ps.or !== null ? ps.or : 0,
            ps.og !== undefined && ps.og !== null ? ps.og : 0,
            ps.ob !== undefined && ps.ob !== null ? ps.ob : 0,
            ps.oa !== undefined && ps.oa !== null ? ps.oa : 255
        );
    }
};

// \font[param] 转义符处理：解析参数串 → 合并当前字体参数 → 应用字体属性
Window_Message.prototype.wsqDpControlFont = function (textState) {
    let paramStr = "";
    if (textState.text.charAt(textState.index) === "[") {
        const end = textState.text.indexOf("]", textState.index);
        if (end >= 0) {
            paramStr = textState.text.slice(textState.index + 1, end);
            textState.index = end + 1;
        } else {
            paramStr = textState.text.slice(textState.index + 1);
            textState.index = textState.text.length;
        }
    }
    const ps = WSQ.DP.parseFontParam(paramStr);
    if (!this._wsqFnt) this._wsqFnt = {};
    for (const k in ps) this._wsqFnt[k] = ps[k];
    this.wsqDpApplyFontParams(this._wsqFnt);
    if (ps.c !== undefined && ps.c !== null) {
        this.changeTextColor(ColorManager.textColor(ps.c));
    }
};

// 底纹绘制（type 1=边框，2=实心方框）
Window_Message.prototype.wsqDpDrawFontBackdrop = function (x, y, w, h, type, colorIndex) {
    const color = ColorManager.textColor(colorIndex === undefined || colorIndex === null ? 0 : colorIndex);
    if (type === 1) {
        this.contents.fillRect(x, y, w, 1, color);
        this.contents.fillRect(x, y + h - 1, w, 1, color);
        this.contents.fillRect(x, y, 1, h, color);
        this.contents.fillRect(x + w - 1, y, 1, h, color);
    } else if (type === 2) {
        this.contents.fillRect(x, y, w, h, color);
    }
};

// 逐字绘制带装饰的文本段（替代整段 drawText；textState 推进与 GF 版一致）
Window_Message.prototype.wsqDpFlushDecoratedText = function (textState) {
    const text = textState.buffer;
    const rtl = textState.rtl;
    const fs = this._wsqFnt;
    const bmp = this.contents;
    if (!bmp) return;
    const saved = {
        face: bmp.fontFace,
        size: bmp.fontSize,
        bold: bmp.fontBold,
        italic: bmp.fontItalic,
        outlineWidth: bmp.outlineWidth,
        outlineColor: bmp.outlineColor,
        textColor: bmp.textColor,
    };
    this.wsqDpApplyFontParams(fs);
    if (fs.l) {
        bmp.outlineWidth = Math.max(
            bmp.outlineWidth,
            (fs.lp === undefined || fs.lp === null ? 2 : fs.lp) * 4
        );
        bmp.outlineColor = ColorManager.textColor(fs.lc === undefined || fs.lc === null ? 0 : fs.lc);
    }
    const lineHeight = textState.height + (fs.h || 0);
    const y = textState.y;
    let x = textState.x;
    for (let i = 0; i < text.length; i++) {
        const c = text.charAt(i);
        const w = this.textWidth(c);
        if (fs.p) this.wsqDpDrawFontBackdrop(x, y, w, lineHeight, fs.p, fs.pc);
        if (fs.ca !== undefined && fs.ca !== null) {
            const ctx = bmp.context;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, fs.ca / 255));
            bmp.drawText(c, x, y, w, lineHeight);
            ctx.restore();
        } else {
            bmp.drawText(c, x, y, w, lineHeight);
        }
        if (fs.d) {
            bmp.fillRect(
                x,
                Math.floor(y + lineHeight / 2),
                w,
                1,
                ColorManager.textColor(fs.dc === undefined || fs.dc === null ? 0 : fs.dc)
            );
        }
        if (fs.u) {
            bmp.fillRect(
                x,
                y + lineHeight - 1,
                w,
                1,
                ColorManager.textColor(fs.uc === undefined || fs.uc === null ? 0 : fs.uc)
            );
        }
        x += w + (fs.w || 0);
    }
    bmp.fontFace = saved.face;
    bmp.fontSize = saved.size;
    bmp.fontBold = saved.bold;
    bmp.fontItalic = saved.italic;
    bmp.outlineWidth = saved.outlineWidth;
    bmp.outlineColor = saved.outlineColor;
    bmp.textColor = saved.textColor;
    const advance = x - textState.x;
    textState.x += rtl ? -advance : advance;
    textState.buffer = this.createTextBuffer(rtl);
    const outputWidth = Math.abs(textState.x - textState.startX);
    if (textState.outputWidth < outputWidth) textState.outputWidth = outputWidth;
    textState.outputHeight = y - textState.startY + lineHeight;
};

// 覆写 processEscapeCharacter：新增 \font 指令（链式调用 GF 版）
WSQ.DP.Window_Message_processEscapeCharacter =
    Window_Message.prototype.processEscapeCharacter;
Window_Message.prototype.processEscapeCharacter = function (code, textState) {
    switch (code) {
        case "FONT":
            this.wsqDpControlFont(textState);
            break;
        default:
            WSQ.DP.Window_Message_processEscapeCharacter.call(this, code, textState);
            break;
    }
};

// 覆写 flushTextState：命中装饰参数时逐字绘制（链式调用 GF 版）
// 注意：仅在正式绘制阶段（textState.drawing=true）执行装饰。
// changeToBubble 的气泡尺寸测量走 textSizeEx（drawing=false），此时窗口内容位图
// 尚未创建（this.contents 为空），装饰绘制会崩，故测量阶段走原版。
WSQ.DP.Window_Message_flushTextState = Window_Message.prototype.flushTextState;
Window_Message.prototype.flushTextState = function (textState) {
    const fs = this._wsqFnt;
    if (
        fs &&
        textState.drawing &&
        this.wsqDpNeedDecor(fs) &&
        textState.buffer &&
        textState.buffer.length > 0 &&
        !textState.rtl &&
        this.contents
    ) {
        this.wsqDpFlushDecoratedText(textState);
        return;
    }
    WSQ.DP.Window_Message_flushTextState.call(this, textState);
};

// 重置字体设置时清除 \font 状态（新消息 / 换页 / 姓名绘制前自动调用）
WSQ.DP.Window_Base_resetFontSettings = Window_Base.prototype.resetFontSettings;
Window_Base.prototype.resetFontSettings = function () {
    WSQ.DP.Window_Base_resetFontSettings.call(this);
    this._wsqFnt = null;
};
