//=============================================================================
// WSQ_EventInteractEX.js
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_EventInteractEX = true;

var WSQ = WSQ || {};
WSQ.EIX = WSQ.EIX || {};
WSQ.EIX.version = 1.25;
WSQ.EIX.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

/*:
 * @target MZ
 * @author WSQ
 * @plugindesc [v1.25]        事件 - 事件互动扩展（EAGLE-RGSS3 移植，支持鼠标操作）
 *
 * @help
 * ============================================================================
 * 事件互动扩展（WSQ_EventInteractEX）
 * ============================================================================
 * 移植自 RMVA 插件《事件互动扩展 by 老鹰》（EAGLE-RGSS3），完整适配 RMMZ。
 * 玩家面向事件时，若事件页首条注释含【互动名称】，将弹出互动列表：
 *   按 SHIFT 切换下一个互动；按 确定键 执行当前互动；按 方向键 正常移动并关闭列表。
 *
 * 鼠标操作（v1.10 起支持）：
 *   - 左键点击事件：进入该事件触发范围后点击，直接打开互动列表（角色不会走过去，
 *     v1.20 起）；范围外点击则自动走过去，一进入触发范围即停下并弹出互动列表
 *     （v1.23 起），不会走到事件脸上触发未经筛选的事件流程。
 *   - 鼠标滚轮上下滚动：循环切换当前选中的互动。
 *   - 左键点击互动窗口任意位置：执行光标选中的互动（v1.20 起）。
 *   键盘与鼠标操作可混用（如滚轮选择后按确定键执行）。
 *
 * 与默认行为的关系：
 * - 首条注释含【xx】的事件页：确定键只执行「xx」标签块内的指令，其余指令不执行。
 * - 未写【xx】的普通事件页：确定键依旧执行整页指令，本插件完全不影响默认行为。
 *
 * ============================================================================
 * 前置需求
 * ============================================================================
 * - 无（独立插件，可在任意加载位置使用）
 * - 可选：HalfMove（半格移动插件；启用时本插件自动采用整格判定，请将其置于本插件之前）
 *
 * ============================================================================
 * 备注（notetag）
 * ============================================================================
 * 1. 互动列表（写在事件页的【第一条注释】中）：
 *      注释： 【交谈】【商店】【贿赂】
 *    可重复填写多个【xx】；未填写【xx】的事件页按默认方式执行全部指令。
 *
 * 2. 互动内容（写在当前事件页中，用「标签」指令界定指令块）：
 *      标签：交谈
 *      显示文字：测试语句1
 *      标签：InteractEnd
 *    确定执行该互动后，会跳转到同名「标签」处开始执行，遇到「标签：InteractEnd」结束。
 *    未编写对应标签块时，执行该互动不会运行任何指令。
 *
 * 3. 互动出现条件（在名称后追加 if{条件}）：
 *      注释： 【偷窃 if{s[1]}】【交谈】
 *    当 eval(条件) 返回 true 时才显示该互动。条件内可直接使用：
 *      s  —— 开关组（s[1] 表示 1 号开关）
 *      v  —— 变量组（v[1] 表示 1 号变量）
 *      e  —— 当前事件（Game_Event）
 *      es —— 地图事件组（$gameMap.events）
 *      gp —— 玩家（$gamePlayer）
 *    示例：【偷窃 if{s[1]}】→ 1 号开关开启时，才显示「偷窃」。
 *
 * 4. 触发范围（在首条注释中追加 range{数值}，v1.20 起）：
 *      注释： 【交谈】【商店】 range{3}
 *    该事件页的互动菜单触发范围单独设为 3 格，覆盖「互动触发范围」参数。
 *    未填写时使用参数默认值（默认 2 格）。
 *    范围的形状由「触发范围形状」参数决定（默认方形）：
 *      方形：范围 1 = 事件周围八格（含四个斜角），范围 2 = 周围 5×5 区域；
 *      菱形：范围 1 = 仅上下左右四格（斜角格算 2 格），范围 2 = 12 格。
 *    注意：面向触发（「忽略朝向限制」关闭时）只沿玩家面朝方向逐格判定，
 *    斜角方向的事件必须开启「忽略朝向限制」才会自动弹出列表。
 *
 * 5. 结束标签名可在「互动结束标签名」参数中修改（默认 InteractEnd）。
 *    建议使用专属名称，避免与事件中其他用途的「END」标签冲突。
 *
 * ============================================================================
 * 兼容性
 * ============================================================================
 * - 所有引擎方法均以 alias 包裹（不覆盖、不破坏其他插件的链式调用）。
 * - 与 HalfMove 半格移动配合时，面向判定使用整格坐标（自动检测，无需配置）。
 * - 支持键鼠双操作：确定/SHIFT（键盘）、左键点击/鼠标滚轮（鼠标）。鼠标点击事件
 *   或列表选项均会走互动标签逻辑，不会直接执行整页指令。
 * - 触发类型 1（事件接触）/ 2（玩家接触）的带标签事件，玩家点击、撞上或走上时
 *   同样转为互动列表，不会整页执行；无标签的接触事件保持引擎默认行为。
 * - 「忽略朝向限制」参数开启后，玩家周围（触发范围内）任意方向的事件都会自动
 *   弹出互动列表，无需面朝事件（适合鼠标操作，点击事件后转向菜单也不会消失；
 *   默认关闭，保留面向检测）。
 * - 「触发范围形状」参数（默认方形）统一作用于周围扫描、鼠标点击与自动走过去
 *   三类判定；面向触发不受该参数影响（始终沿面朝方向直线判定）。
 * - 请勿与 LTN_InteractionMenu 等同类「互动菜单」插件同时启用。
 *
 * ============================================================================
 * 插件指令
 * ============================================================================
 * 无。
 *
 * ============================================================================
 * 脚本接口
 * ============================================================================
 * - WSQ.EIX.trigger(event, type)
 *     触发指定事件的「type」互动（并行执行）。
 *     示例：WSQ.EIX.trigger($gameMap.events()[1], "贿赂");
 * - $gameMap.events()[1].startEx("贿赂")
 *     标记事件启动并携带互动类型（随后需调用 $gameMap.setupStartingEvent()）。
 * - WSQ.EIX.clear()
 *     手动清除当前互动信息（关闭列表）。
 *
 * @param sepExtract
 * @text -----互动提取-----
 *
 * @param iconSet
 * @text 互动图标映射
 * @desc 互动名称对应的系统图标编号（IconSet 图标集中的索引）。\n与事件注释【名称】完全一致的名称才会命中。
 * @type struct<InteractIcon>[]
 * @default [{"Name":"交谈","Icon":"4"},{"Name":"偷窃","Icon":"482"},{"Name":"送礼","Icon":"259"},{"Name":"贿赂","Icon":"361"},{"Name":"推","Icon":"11"},{"Name":"拉","Icon":"11"}]
 *
 * @param defaultIcon
 * @text 默认图标编号
 * @desc 未在「互动图标映射」中配置的互动名称，统一使用该图标编号。
 * @type number
 * @default 4
 *
 * @param tagOpen
 * @text 互动标记起始符
 * @desc 事件页首条注释中，互动名称的起始包裹符（默认【）。
 * @type string
 * @default 【
 *
 * @param tagClose
 * @text 互动标记结束符
 * @desc 事件页首条注释中，互动名称的结束包裹符（默认】）。
 * @type string
 * @default 】
 *
 * @param sepList
 * @text -----互动列表-----
 *
 * @param listType
 * @text 列表排列方式
 * @desc 0 - 横向排列；1 - 纵向排列。
 * @type number
 * @default 1
 *
 * @param listPos
 * @text 列表显示位置
 * @desc 0 - 事件下方；1 - 事件上方；2 - 事件右侧。
 * @type number
 * @default 2
 *
 * @param fontSize
 * @text 互动文字字号
 * @desc 互动名称的文字大小（像素）。
 * @type number
 * @default 18
 *
 * @param fontFace
 * @text 互动文字字体
 * @desc 互动名称使用的字体（留空 = 游戏默认字体）。
 * @type string
 * @default 
 *
 * @param hGap
 * @text 横向互动间距
 * @desc 横向排列时，项与项之间的水平间距（像素）。
 * @type number
 * @default 0
 *
 * @param vGap
 * @text 纵向互动间距
 * @desc 纵向排列时行与行、横向多行排列时行与行之间的间距（像素）。
 * @type number
 * @default 2
 *
 * @param eachLineMax
 * @text 横向每行最大数
 * @desc 横向排列时每行最多显示的数量（0 = 不换行）。
 * @type number
 * @default 0
 *
 * @param switchKey
 * @text 切换互动按键
 * @desc RMMZ 按键名（shift、pageup、pagedown、tab 等），触发时切换到下一个互动。
 * @type string
 * @default shift
 *
 * @param helpText
 * @text 切换提示文本
 * @desc 互动数量大于 1 时，列表底部显示的切换提示文字。
 * @type string
 * @default ↑↓ SHIFT / 滚轮
 *
 * @param helpFontSize
 * @text 提示文字字号
 * @desc 切换提示文字的大小（像素）。
 * @type number
 * @default 12
 *
 * @param helpOffsetX
 * @text 提示文字 X 偏移
 * @desc 切换提示文字的横向偏移（像素，正右负左）。
 * @type number
 * @default 0
 *
 * @param helpOffsetY
 * @text 提示文字 Y 偏移
 * @desc 切换提示文字的纵向偏移（像素，正下负上）。
 * @type number
 * @default 0
 *
 * @param sepWindow
 * @text -----窗口背景-----
 *
 * @param bgStyle
 * @text 窗口背景样式
 * @desc 0 - 默认暗淡背景（半透明黑）；1 - 窗口皮肤（使用「自选窗口皮肤」或游戏默认 Window 皮肤）。
 * @type number
 * @default 0
 *
 * @param bgSkin
 * @text 自选窗口皮肤
 * @desc 窗口皮肤文件名（img/system/ 下，可留空 = 游戏默认 Window）。仅「窗口背景样式 = 1」时生效。
 * @type file
 * @dir img/system/
 * @default 
 *
 * @param bgOpacity
 * @text 暗淡背景透明度
 * @desc 仅「窗口背景样式 = 0」时生效：暗淡背景的透明度（0-255，0 全透明，255 全黑；渐变与白条按同比例缩放）。
 * @type number
 * @default 160
 *
 * @param padding
 * @text 窗口内边距
 * @desc 列表内容与窗口边缘的间距（像素）。
 * @type number
 * @default 4
 *
 * @param sepTrigger
 * @text -----触发范围-----
 *
 * @param triggerRange
 * @text 互动触发范围
 * @desc 玩家面向事件时自动弹出互动列表的最大格子数（0 = 仅鼠标点击事件打开菜单；1 = 面前 1 格；2 = 面前 2 格；……）。事件页首条注释可用 range{n} 单独覆盖。
 * @type number
 * @default 2
 *
 * @param rangeShape
 * @text 触发范围形状
 * @desc 0 - 菱形（曼哈顿距离：范围 1 仅覆盖上下左右四格，斜角格算 2 格）；1 - 方形（切比雪夫距离：范围 1 即事件周围八格，含四个斜角）。统一作用于周围扫描、鼠标点击与自动走过去三类判定。
 * @type number
 * @default 1
 *
 * @param ignoreFacing
 * @text 忽略朝向限制
 * @desc 开启后，玩家周围（触发范围内）任意方向的事件都会自动弹出互动列表，无需面朝事件；玩家点击事件后转向也不会导致菜单消失（0 - 保留朝向限制；1 - 忽略朝向）。
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default false
 *
 * @param menuOnlyTrigger
 * @text 仅互动菜单触发
 * @desc 开启时，带互动标签的事件只能通过互动菜单执行（鼠标点击、接触、行动键均不能绕过菜单直接整页执行）；关闭时恢复引擎默认触发。
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default true
 *
 * @param sepExecute
 * @text -----执行-----
 *
 * @param termLabel
 * @text 互动结束标签名
 * @desc 事件页中标记互动指令块结束的标签名称（不含「标签：」前缀）。
 * @type string
 * @default InteractEnd
 *
 * @param sepMouse
 * @text -----鼠标支持-----
 *
 * @param wheelEnabled
 * @text 滚轮切换互动
 * @desc 互动列表开启时，鼠标滚轮上下滚动循环切换选中的互动（0 - 关闭；1 - 开启）。
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default true
 *
 * @param clickExecute
 * @text 鼠标点击执行
 * @desc 互动列表开启时，鼠标点击互动窗口任意位置执行光标选中的互动（0 - 关闭；1 - 开启）。
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default true
 *
 * @param clickOpenMenu
 * @text 点击事件打开菜单
 * @desc 鼠标点击带互动标签的事件格时，直接打开互动列表且角色不移动；仅当玩家已进入该事件的触发范围时生效，范围外点击则自动走过去，一进入触发范围即停下并弹出互动列表（0 - 关闭；1 - 开启）。
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default true
 */

/*~struct~InteractIcon:
 * @param Name
 * @text 互动名称
 * @desc 对应事件注释【名称】中的文本。
 * @type string
 * @default 交谈
 *
 * @param Icon
 * @text 图标编号
 * @desc 系统图标集（IconSet）中的索引。
 * @type number
 * @default 4
 *
 * @param Color
 * @text 文字颜色
 * @desc 该互动的文字颜色（CSS 格式，如 #ff6666；留空 = 默认选中白/未选中灰）。
 * @type string
 * @default 
 */

//=============================================================================
// 参数加载
//=============================================================================

WSQ.EIX.param = PluginManager.parameters(WSQ.EIX.pluginName);

// 字符串参数（带兜底）
WSQ.EIX.str = function (key, fallback) {
    var v = WSQ.EIX.param[key];
    return v == null || v === "" ? fallback : String(v);
};

// 数值参数（带兜底）
WSQ.EIX.num = function (key, fallback) {
    var n = Number(WSQ.EIX.param[key]);
    return isNaN(n) ? fallback : n;
};

// 布尔参数（带兜底；兼容 true/"true"/1）
WSQ.EIX.bool = function (key, fallback) {
    var v = WSQ.EIX.param[key];
    if (v == null || v === "") return fallback;
    return String(v).toLowerCase() === "true" || Number(v) === 1;
};

// 互动图标映射：struct<InteractIcon>[] 双层编码解析（兼容未解析的原始数组）
WSQ.EIX.iconSet = [];
try {
    var raw = WSQ.EIX.str("iconSet", "[]");
    var arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    WSQ.EIX.iconSet = arr.map(function (s) {
        return typeof s === "string" ? JSON.parse(s) : s;
    });
} catch (e) {
    WSQ.EIX.iconSet = [];
    console.warn("WSQ_EventInteractEX: 互动图标映射参数解析失败，已回退为空映射。");
}

//=============================================================================
// 核心逻辑
//=============================================================================

WSQ.EIX._info = null;
WSQ.EIX._sprite = null;   // 列表精灵引用（Spriteset_Map.createCharacters 时注入）

// 清除当前互动信息
WSQ.EIX.clear = function () {
    WSQ.EIX._info = null;
};

// 重置互动信息；事件与互动列表均未变化时返回 false（避免无谓重绘）
// clicked：点击事件格打开的菜单（玩家未移动时保持显示，见 isClickMenuAlive）
WSQ.EIX.reset = function (event, syms, clicked) {
    var info = WSQ.EIX._info;
    if (info && info.event === event && info.syms.length === syms.length &&
        info.syms.every(function (s) { return syms.indexOf(s) >= 0; })) {
        return false;
    }
    WSQ.EIX._info = {
        event: event,
        syms: syms,
        i: 0,        // 当前选中索引
        iDraw: -1,   // 当前已绘制索引
        clicked: !!clicked,
        cx: clicked ? Math.round($gamePlayer.x) : 0,
        cy: clicked ? Math.round($gamePlayer.y) : 0
    };
    return true;
};

// 每帧扫描：检测玩家脚下/周围（触发范围内）的带标签事件，维护互动信息
// 「忽略朝向限制」开启时用四方向扫描，否则保持面向扫描（默认）
WSQ.EIX.scan = function () {
    var e = WSQ.EIX.getEventHere([0, 1, 2]);
    if (!e) {
        e = WSQ.EIX.bool("ignoreFacing", false)
            ? WSQ.EIX.getEventNearby([0, 1, 2])
            : WSQ.EIX.getEventThere([0, 1, 2]);
    }
    if (e) {
        var syms = WSQ.EIX.extractSyms(e);
        WSQ.EIX.reset(e, syms);
        WSQ.EIX.nextSym();
    } else if (!WSQ.EIX.isClickMenuAlive()) {
        WSQ.EIX.clear();
    }
};

// 点击打开的远处菜单：玩家位置未变、未设置新目的地时保持显示（否则清除）
WSQ.EIX.isClickMenuAlive = function () {
    var info = WSQ.EIX._info;
    if (!info || !info.clicked) return false;
    if ($gameTemp.isDestinationValid()) return false;
    if (info.event._erased) return false;
    if (Math.round($gamePlayer.x) !== info.cx || Math.round($gamePlayer.y) !== info.cy) return false;
    return true;
};

// 切换选中项（dir = ±1；SHIFT 键与鼠标滚轮共用）
WSQ.EIX.moveSel = function (dir) {
    var info = WSQ.EIX._info;
    if (!info || info.syms.length <= 1) return;
    info.i = (info.i + dir + info.syms.length) % info.syms.length;
};

// 处理切换按键（SHIFT → 下一个互动）
WSQ.EIX.nextSym = function () {
    var info = WSQ.EIX._info;
    if (!info || info.syms.length <= 1) return;
    if (Input.isTriggered(WSQ.EIX.str("switchKey", "shift"))) {
        WSQ.EIX.moveSel(1);
    }
};

// 鼠标滚轮切换互动；已消费时返回 true（调用方阻止页面滚动）
WSQ.EIX.onWheel = function (delta) {
    if (!WSQ.EIX.bool("wheelEnabled", true)) return false;
    var info = WSQ.EIX._info;
    if (!info || !info.syms || info.syms.length <= 1) return false;
    var scene = SceneManager._scene;
    if (!scene || !(scene instanceof Scene_Map) || !scene.isActive()) return false;
    if (!$gamePlayer.canMove()) return false;
    WSQ.EIX.moveSel(delta > 0 ? 1 : -1);
    return true;
};

// 执行当前互动；成功处理返回 true（阻止引擎默认触发）
WSQ.EIX.executeCurrent = function () {
    var info = WSQ.EIX._info;
    if (!info || !info.event) return false;
    var e = info.event;
    if (e._erased) {
        WSQ.EIX.clear();
        return false;
    }
    var syms = info.syms || [];
    var sym = syms[info.i];
    WSQ.EIX.clear();
    if (syms.length === 0) {
        e.start();
    } else {
        e.startEx(sym);
    }
    $gameMap.setupStartingEvent();
    return true;
};

// 脚本接口：触发指定事件的互动（并行执行）
WSQ.EIX.trigger = function (event, type) {
    if (!event) return;
    event.startEx(type);
    $gameMap.setupStartingEvent();
};

//=============================================================================
// 互动提取
//=============================================================================

// 从事件页首条注释中提取【xx】互动数组（含 if{条件} 过滤）
WSQ.EIX.extractSyms = function (event) {
    var list = event.list();
    if (!list) return [];
    var comment = null;
    for (var i = 0; i < list.length; i++) {
        if (list[i].code === 108) { comment = list[i]; break; }
    }
    if (!comment) return [];
    var text = String(comment.parameters[0] || "");
    var open = WSQ.EIX.escapeRegExp(WSQ.EIX.str("tagOpen", "【"));
    var close = WSQ.EIX.escapeRegExp(WSQ.EIX.str("tagClose", "】"));
    var re = new RegExp(open + "([\\s\\S]*?)" + close, "g");
    var syms = [];
    var m;
    while ((m = re.exec(text)) !== null) {
        var t = m[1];
        var cond = null;
        t = t.replace(/\s*(?:if)\s*\{([\s\S]*?)\}\s*/gi, function (match, c) {
            cond = c;
            return "";
        });
        if (cond) {
            try {
                if (WSQ.EIX.evalCond(cond, event) === false) continue;
            } catch (err) {
                continue;
            }
        }
        t = t.trim();
        if (t) syms.push(t);
    }
    return syms;
};

WSQ.EIX.escapeRegExp = function (s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// 从事件页首条注释提取 range{数值}（事件级触发范围覆盖；未填写返回 null）
WSQ.EIX.extractRange = function (event) {
    var list = event.list();
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
        if (list[i].code === 108) {
            var text = String(list[i].parameters[0] || "");
            var m = text.match(/range\s*\{(\d+)\}/i);
            if (m) return Math.max(1, Number(m[1]));
            return null;
        }
    }
    return null;
};

// 事件的生效触发范围：事件注释 range{n} 优先，否则用「互动触发范围」参数
WSQ.EIX.rangeOf = function (event) {
    var r = WSQ.EIX.extractRange(event);
    return r != null ? r : WSQ.EIX.num("triggerRange", 2);
};

// 计算 if{条件}：提供 s / v / e / es / gp 作用域
WSQ.EIX.evalCond = function (cond, event) {
    var s = new Proxy({}, {
        get: function (t, p) { return $gameSwitches.value(Number(p)); }
    });
    var v = new Proxy({}, {
        get: function (t, p) { return $gameVariables.value(Number(p)); }
    });
    var fn = new Function("s", "v", "e", "es", "gp", "return (" + cond + ");");
    return fn(s, v, event, $gameMap.events(), $gamePlayer);
};

// 获取指定互动的图标编号
WSQ.EIX.icon = function (t) {
    var hit = null;
    for (var i = 0; i < WSQ.EIX.iconSet.length; i++) {
        if (WSQ.EIX.iconSet[i].Name === t) { hit = WSQ.EIX.iconSet[i]; break; }
    }
    return hit ? Number(hit.Icon) : WSQ.EIX.num("defaultIcon", 4);
};

// 获取指定互动的文字颜色（CSS 字符串；未配置时返回 null，由调用方回退到默认色）
WSQ.EIX.itemColor = function (t) {
    for (var i = 0; i < WSQ.EIX.iconSet.length; i++) {
        var item = WSQ.EIX.iconSet[i];
        if (item.Name === t && item.Color) return String(item.Color);
    }
    return null;
};

//=============================================================================
// 事件检索（含 HalfMove 半格兼容：整格判定）
//=============================================================================

// 玩家脚下（同格）带互动标签的事件（任意触发类型、任意优先级）
WSQ.EIX.getEventHere = function (triggers) {
    var px = Math.round($gamePlayer.x);
    var py = Math.round($gamePlayer.y);
    return WSQ.EIX.getTaggedEvent(px, py, triggers, null);
};

// 玩家面前可互动的事件（按触发范围逐格扫描；柜台格无事件自然跳过，自动兼容柜台穿透）
WSQ.EIX.getEventThere = function (triggers) {
    var px = Math.round($gamePlayer.x);
    var py = Math.round($gamePlayer.y);
    var d = $gamePlayer.direction();
    var vec = WSQ.EIX.dirVector(d);
    var scanMax = Math.max(WSQ.EIX.num("triggerRange", 2), 9);
    for (var i = 1; i <= scanMax; i++) {
        var e = WSQ.EIX.getTaggedEvent(px + vec[0] * i, py + vec[1] * i, triggers, true);
        if (e && i <= WSQ.EIX.rangeOf(e)) {
            return e;
        }
    }
    return null;
};

// 玩家周围可互动的事件（忽略朝向：按「触发范围形状」由近到远逐层扫描——
// 方形 = 切比雪夫距离，范围 1 即周围八格含斜角；菱形 = 曼哈顿距离。
// 取最近的带标签事件）
WSQ.EIX.getEventNearby = function (triggers) {
    var px = Math.round($gamePlayer.x);
    var py = Math.round($gamePlayer.y);
    var scanMax = Math.max(WSQ.EIX.num("triggerRange", 2), 9);
    var shape = WSQ.EIX.num("rangeShape", 1);
    for (var dist = 1; dist <= scanMax; dist++) {
        for (var dx = -dist; dx <= dist; dx++) {
            for (var dy = -dist; dy <= dist; dy++) {
                if (shape === 1) {
                    if (Math.max(Math.abs(dx), Math.abs(dy)) !== dist) continue;
                } else {
                    if (Math.abs(dx) + Math.abs(dy) !== dist) continue;
                }
                var e = WSQ.EIX.getTaggedEvent(px + dx, py + dy, triggers, null);
                if (e && WSQ.EIX.inRange(e._x, e._y, px, py, WSQ.EIX.rangeOf(e))) {
                    return e;
                }
            }
        }
    }
    return null;
};

// 方向 → 单位向量（2 下 / 4 左 / 6 右 / 8 上）
WSQ.EIX.dirVector = function (d) {
    switch (d) {
        case 2: return [0, 1];
        case 4: return [-1, 0];
        case 6: return [1, 0];
        case 8: return [0, -1];
    }
    return [0, 0];
};

// 玩家/目标格与事件的距离（按「触发范围形状」：1 = 方形/切比雪夫，0 = 菱形/曼哈顿）
WSQ.EIX.distance = function (x1, y1, x2, y2) {
    var dx = Math.abs(x1 - x2);
    var dy = Math.abs(y1 - y2);
    return WSQ.EIX.num("rangeShape", 1) === 1 ? Math.max(dx, dy) : dx + dy;
};

// 目标格是否处于事件触发范围内（range 为该事件的生效范围）
WSQ.EIX.inRange = function (ex, ey, px, py, range) {
    return WSQ.EIX.distance(ex, ey, px, py) <= range;
};

// 获取指定格上带互动标签的事件（同一格有多个事件时取第一个带标签的；无标签返回 null）
WSQ.EIX.getTaggedEvent = function (x, y, triggers, normal) {
    var events = $gameMap.eventsXy(x, y);
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.isTriggerIn(triggers) &&
            (normal === null || event.isNormalPriority() === normal) &&
            event.list().length > 1 &&
            WSQ.EIX.extractSyms(event).length > 0) {
            return event;
        }
    }
    return null;
};

// HalfMove 存在时使用整格取格（roundNoHalf*），否则用引擎默认取格
WSQ.EIX.roundX = function (x, d) {
    if ($gameMap.roundNoHalfXWithDirection) return $gameMap.roundNoHalfXWithDirection(x, d);
    return $gameMap.roundXWithDirection(x, d);
};

WSQ.EIX.roundY = function (y, d) {
    if ($gameMap.roundNoHalfYWithDirection) return $gameMap.roundNoHalfYWithDirection(y, d);
    return $gameMap.roundYWithDirection(y, d);
};

WSQ.EIX.getMapEvent = function (x, y, triggers, normal) {
    var events = $gameMap.eventsXy(x, y);
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.isTriggerIn(triggers) &&
            (normal === null || event.isNormalPriority() === normal) &&
            event.list().length > 1) {
            return event;
        }
    }
    return null;
};

//=============================================================================
// 列表绘制（faithful 位图列表）
//=============================================================================

// 每帧更新列表精灵（挂载于 Spriteset_Map.update）
WSQ.EIX.update = function (sprite, eventSprites) {
    var info = WSQ.EIX._info;
    if (!info || !info.syms || info.syms.length === 0 ||
        $gameMap.isEventRunning() || info.event._erased) {
        sprite.visible = false;
        return;
    }
    sprite.visible = true;
    if (WSQ.EIX.num("listType", 1) === 0) {
        WSQ.EIX.redrawType0(sprite);
    } else {
        WSQ.EIX.redrawType1(sprite);
    }
    WSQ.EIX.updatePosition(sprite, eventSprites);
};

// 按需重建位图（尺寸变化时才重建）
WSQ.EIX.setBitmap = function (sprite, w, h) {
    if (sprite.bitmap && sprite.bitmap.width === w && sprite.bitmap.height === h) return;
    if (sprite.bitmap) {
        sprite.bitmap.destroy();
        sprite.bitmap = null;
    }
    sprite.bitmap = new Bitmap(w, h);
};

// 测量用临时位图
WSQ.EIX.tempBitmap = function (fontSize) {
    if (!WSQ.EIX._tempBitmap) WSQ.EIX._tempBitmap = new Bitmap(1, 1);
    WSQ.EIX._tempBitmap.fontFace = WSQ.EIX.listFontFace();
    WSQ.EIX._tempBitmap.fontSize = fontSize;
    return WSQ.EIX._tempBitmap;
};

// 互动文字字体（留空 = 游戏默认字体）
WSQ.EIX.listFontFace = function () {
    var f = WSQ.EIX.str("fontFace", "");
    return f || $gameSystem.mainFontFace();
};

// 窗口皮肤位图（bgSkin 留空 = 游戏默认 Window）
WSQ.EIX.skinBitmap = function () {
    var name = WSQ.EIX.str("bgSkin", "").replace(/\.(png|jpg|jpeg|webp)$/i, "");
    return ImageManager.loadSystem(name || "Window");
};

// 0-255 透明度 → CSS alpha（0-1，自动夹取）
WSQ.EIX.alpha = function (a255) {
    var v = Math.max(0, Math.min(255, a255));
    return (v / 255).toFixed(3);
};

// 九宫格绘制窗口皮肤：内部实心暗板 + 边框九宫格。
// 说明：项目 Window.png 的 (0,0,95,95) 区域是编辑器样式（网格+调色板）而非暗色填充，
//       故内部改用纯色暗板保证可靠填充；边框沿用引擎 Window._refreshFrame
//       切片规格（源区 (96,0,96,96)，margin 24）。
WSQ.EIX.drawWindowSkin = function (bitmap, skin, w, h) {
    var m = 24;
    // 内部实心暗板（半透明黑，与游戏窗口观感一致）
    bitmap.fillRect(m, m, Math.max(w - m * 2, 1), Math.max(h - m * 2, 1), "rgba(0, 0, 0, 0.75)");
    // 边框九宫格
    bitmap.blt(skin, 96, 0, 24, 24, 0, 0, 24, 24);
    bitmap.blt(skin, 168, 0, 24, 24, w - 24, 0, 24, 24);
    bitmap.blt(skin, 96, 72, 24, 24, 0, h - 24, 24, 24);
    bitmap.blt(skin, 168, 72, 24, 24, w - 24, h - 24, 24, 24);
    bitmap.blt(skin, 120, 0, 48, 24, m, 0, w - 48, 24);
    bitmap.blt(skin, 120, 72, 48, 24, m, h - 24, w - 48, 24);
    bitmap.blt(skin, 96, 24, 24, 48, 0, m, 24, h - 48);
    bitmap.blt(skin, 168, 24, 24, 48, w - 24, m, 24, h - 48);
};

// 绘制图标（enabled 控制透明度；尺寸/列数跟随 ImageManager 与 IconSet 实际尺寸）
WSQ.EIX.drawIcon = function (bitmap, iconIndex, x, y, enabled) {
    var source = ImageManager.loadSystem("IconSet");
    var pw = ImageManager.iconWidth;
    var ph = ImageManager.iconHeight;
    var cols = source.width > 0 ? Math.floor(source.width / pw) : 16;
    if (cols < 1) cols = 16;
    var sx = (iconIndex % cols) * pw;
    var sy = Math.floor(iconIndex / cols) * ph;
    var ctx = bitmap.context;
    var alpha = ctx.globalAlpha;
    ctx.globalAlpha = enabled ? 1 : 0.5;
    bitmap.blt(source, sx, sy, pw, ph, x, y, pw, ph);
    ctx.globalAlpha = alpha;
};

// 横向排列
WSQ.EIX.redrawType0 = function (sprite) {
    if (WSQ.EIX._info.iDraw === WSQ.EIX._info.i) return;
    WSQ.EIX._info.iDraw = WSQ.EIX._info.i;
    var syms = WSQ.EIX._info.syms;
    var flagDrawHint = syms.length > 1;
    var symFontSize = WSQ.EIX.num("fontSize", 18);
    var iconW = ImageManager.iconWidth;
    var iconH = ImageManager.iconHeight;
    var iconWh = Math.max(iconW, iconH) + 4;
    var symOffset = WSQ.EIX.num("hGap", 0);
    var maxEachLine = WSQ.EIX.num("eachLineMax", 0) || null;
    var offsetLine = WSQ.EIX.num("vGap", 2);
    var pad = WSQ.EIX.num("padding", 4);
    var b = WSQ.EIX.tempBitmap(symFontSize);
    var ws = syms.map(function (t) { return b.measureTextWidth(t); });
    var w = 0, h = 0;
    if (maxEachLine) {
        var wsLines = [];
        for (var i = 0; i < ws.length; i += maxEachLine) wsLines.push(ws.slice(i, i + maxEachLine));
        var wsMax = wsLines.map(function (line) {
            return line.length * (iconWh + symOffset) + Math.max.apply(null, line) + pad * 2;
        });
        w = Math.max.apply(null, wsMax) + pad * 2;
        h = pad * 2 + iconWh * wsLines.length + offsetLine * (wsLines.length - 1);
    } else {
        w = syms.length * (iconWh + symOffset) + Math.max.apply(null, ws) + pad * 2;
        h = pad * 2 + iconWh;
    }
    if (flagDrawHint) h += WSQ.EIX.num("helpFontSize", 12) + 4;
    WSQ.EIX.setBitmap(sprite, w, h);
    var bitmap = sprite.bitmap;
    bitmap.clear();
    bitmap.fontFace = WSQ.EIX.listFontFace();
    bitmap.outlineWidth = 3;
    bitmap.textColor = "#ffffff";
    var y = pad;
    var hintH = flagDrawHint ? WSQ.EIX.num("helpFontSize", 12) + 4 : 0;
    if (WSQ.EIX.num("bgStyle", 0) === 1) {
        WSQ.EIX.drawWindowSkin(bitmap, WSQ.EIX.skinBitmap(), w, h);
    } else {
        var op = WSQ.EIX.num("bgOpacity", 160);
        bitmap.fillRect(0, 0, w, h - hintH, "rgba(0, 0, 0, " + WSQ.EIX.alpha(op) + ")");
    }
    bitmap.fontSize = symFontSize;
    var x = pad;
    var ox = 0;
    for (var j = 0; j < syms.length; j++) {
        var t = syms[j];
        var iconIndex = WSQ.EIX.icon(t);
        var dx = (iconWh - iconW) / 2;
        var dy = (iconWh - iconH) / 2;
        WSQ.EIX.drawIcon(bitmap, iconIndex, x + dx, y + dy, j === WSQ.EIX._info.i);
        x += iconWh + symOffset;
        if (j === WSQ.EIX._info.i) {
            ox = x - iconWh + (iconWh + ws[j]) / 2;
            x -= symOffset;
            bitmap.textColor = WSQ.EIX.itemColor(t) || "#ffffff";
            bitmap.drawText(t, x, y, ws[j], iconWh, 0);
            x += ws[j] + symOffset;
        }
        if (maxEachLine && j !== syms.length - 1 && (j + 1) % maxEachLine === 0) {
            x = pad;
            y += iconWh + offsetLine;
        }
    }
    if (flagDrawHint) {
        bitmap.fontSize = WSQ.EIX.num("helpFontSize", 12);
        bitmap.drawText(WSQ.EIX.str("helpText", "↑↓ SHIFT"), WSQ.EIX.num("helpOffsetX", 0), h - WSQ.EIX.num("helpFontSize", 12) - 2 + WSQ.EIX.num("helpOffsetY", 0), w, WSQ.EIX.num("helpFontSize", 12) + 2, 2);
    }
    sprite.ox = ox;
    sprite.oy = 0;
};

// 纵向排列
WSQ.EIX.redrawType1 = function (sprite) {
    if (WSQ.EIX._info.iDraw === WSQ.EIX._info.i) return;
    WSQ.EIX._info.iDraw = WSQ.EIX._info.i;
    var syms = WSQ.EIX._info.syms;
    var flagDrawHint = syms.length > 1;
    var symFontSize = WSQ.EIX.num("fontSize", 18);
    var iconW = ImageManager.iconWidth;
    var iconH = ImageManager.iconHeight;
    var vGap = WSQ.EIX.num("vGap", 2);
    var pad = WSQ.EIX.num("padding", 4);
    var b = WSQ.EIX.tempBitmap(symFontSize);
    var ws = [], hs = [];
    for (var i = 0; i < syms.length; i++) {
        var tw = b.measureTextWidth(syms[i]);
        ws.push(tw + iconW);
        hs.push(Math.max(b.fontSize, iconH));
    }
    var w = Math.max.apply(null, ws) + pad * 2;
    var h = hs.reduce(function (s, v) { return s + v; }, 0) + vGap * (syms.length - 1) + pad * 2;
    if (flagDrawHint) h += WSQ.EIX.num("helpFontSize", 12) + 4;
    WSQ.EIX.setBitmap(sprite, w, h);
    var bitmap = sprite.bitmap;
    bitmap.clear();
    bitmap.fontFace = WSQ.EIX.listFontFace();
    bitmap.outlineWidth = 3;
    bitmap.textColor = "#ffffff";
    var y = pad;
    var oy = 0;
    var hintH = flagDrawHint ? WSQ.EIX.num("helpFontSize", 12) + 4 : 0;
    if (WSQ.EIX.num("bgStyle", 0) === 1) {
        WSQ.EIX.drawWindowSkin(bitmap, WSQ.EIX.skinBitmap(), w, h);
    } else {
        var op = WSQ.EIX.num("bgOpacity", 160);
        bitmap.gradientFillRect(2, 0, w - 2, h - hintH, "rgba(0, 0, 0, " + WSQ.EIX.alpha(op * 220 / 160) + ")", "rgba(0, 0, 0, " + WSQ.EIX.alpha(op * 150 / 160) + ")");
        bitmap.fillRect(0, 0, 2, h - hintH, "rgba(255, 255, 255, " + WSQ.EIX.alpha(op * 200 / 160) + ")");
    }
    bitmap.fontSize = symFontSize;
    for (var j = 0; j < syms.length; j++) {
        var x = pad;
        var iconIndex = WSQ.EIX.icon(syms[j]);
        if (j === WSQ.EIX._info.i) {
            bitmap.textColor = WSQ.EIX.itemColor(syms[j]) || "#ffffff";
            oy = y;
        } else {
            bitmap.textColor = WSQ.EIX.itemColor(syms[j]) || "#969696";
        }
        WSQ.EIX.drawIcon(bitmap, iconIndex, x, y + (hs[j] - iconH) / 2, j === WSQ.EIX._info.i);
        x += iconW + 2;
        bitmap.drawText(syms[j], x, y, ws[j], hs[j], 0);
        y += hs[j] + vGap;
    }
    if (flagDrawHint) {
        bitmap.fontSize = WSQ.EIX.num("helpFontSize", 12);
        bitmap.textColor = "#ffffff";
        bitmap.drawText(WSQ.EIX.str("helpText", "↑↓ SHIFT"), WSQ.EIX.num("helpOffsetX", 0), h - WSQ.EIX.num("helpFontSize", 12) - 2 + WSQ.EIX.num("helpOffsetY", 0), w, WSQ.EIX.num("helpFontSize", 12) + 2, 1);
    }
    sprite.ox = 0;
    sprite.oy = oy;
};

// 更新列表位置（跟随事件精灵）
WSQ.EIX.updatePosition = function (sprite, eventSprites) {
    var event = WSQ.EIX._info.event;
    sprite.x = event.screenX();
    sprite.y = event.screenY();
    var spriteE = null;
    for (var i = 0; i < eventSprites.length; i++) {
        if (eventSprites[i].character === event) { spriteE = eventSprites[i]; break; }
    }
    if (spriteE) {
        switch (WSQ.EIX.num("listPos", 2)) {
            case 0: // 事件下方
                break;
            case 1: // 事件上方
                sprite.y = event.screenY() - spriteE.height - sprite.height;
                break;
            case 2: // 事件右侧
                sprite.ox = 0;
                sprite.x = event.screenX() + spriteE.width / 2 + 2;
                sprite.y = event.screenY() - spriteE.height;
                break;
        }
    }
    if (sprite.x + sprite.width > Graphics.width) {
        sprite.x = Graphics.width - sprite.width;
    }
    if (sprite.y + sprite.height > Graphics.height) {
        sprite.y = Graphics.height - sprite.height;
    }
};

//=============================================================================
// 鼠标支持（点击选择 / 滚轮切换 / 地图触摸吞掉）
//=============================================================================

// 当前触摸点是否落在互动列表位图内（worldTransform 逆变换，兼容镜头位移）
WSQ.EIX.isTouchOnList = function () {
    var sprite = WSQ.EIX._sprite;
    var info = WSQ.EIX._info;
    if (!sprite || !sprite.visible || !sprite.bitmap || !sprite.worldVisible) return false;
    if (!info || !info.syms || info.syms.length === 0) return false;
    if ($gameMap.isEventRunning() || $gameMessage.isBusy()) return false;
    var scene = SceneManager._scene;
    if (!scene || !(scene instanceof Scene_Map) || !scene.isActive()) return false;
    var local = sprite.worldTransform.applyInverse(new Point(TouchInput.x, TouchInput.y));
    return local.x >= 0 && local.y >= 0 &&
        local.x <= sprite.bitmap.width && local.y <= sprite.bitmap.height;
};

// 点击互动窗口：直接执行光标选中的互动（v1.20：不再按选项命中，点击窗口任意位置均可）
WSQ.EIX.clickList = function () {
    var info = WSQ.EIX._info;
    if (!info) return;
    WSQ.EIX.executeCurrent();
};

// 触摸点所在格的带标签事件；仅当玩家已进入该事件的触发范围（曼哈顿距离 ≤
// max(1, rangeOf)）时返回事件，否则返回 null（范围外点击不响应，玩家正常走过去）
WSQ.EIX.taggedEventAtTouch = function () {
    // 格内任意点击点统一向下取整（Math.round 会把 x.5 上取整偏到右下格，导致
    // 点击事件格中心找不到事件）
    var x = Math.floor($gameMap.canvasToMapX(TouchInput.x));
    var y = Math.floor($gameMap.canvasToMapY(TouchInput.y));
    var events = $gameMap.eventsXy(x, y);
    var px = Math.round($gamePlayer.x);
    var py = Math.round($gamePlayer.y);
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (WSQ.EIX.extractSyms(event).length === 0) continue;
        var dist = WSQ.EIX.distance(event._x, event._y, px, py);
        if (dist <= Math.max(1, WSQ.EIX.rangeOf(event))) {
            return event;
        }
    }
    return null;
};

// 当前触摸点是否可点击打开互动菜单（点击带标签事件格且玩家已进入其触发范围）
WSQ.EIX.isTouchOnTaggedEvent = function () {
    if (!WSQ.EIX.bool("clickOpenMenu", true)) return false;
    if ($gameMap.isEventRunning() || $gameMessage.isBusy()) return false;
    return WSQ.EIX.taggedEventAtTouch() !== null;
};

// 打开触摸点所在格的互动菜单（点击事件格直接开菜单，角色不移动）
WSQ.EIX.openMenuAtTouch = function () {
    var event = WSQ.EIX.taggedEventAtTouch();
    if (event) {
        WSQ.EIX.reset(event, WSQ.EIX.extractSyms(event), true);
    }
};

// 触摸目的地是带标签事件、且玩家已进入其触发范围 → 停止移动（停在范围边缘，
// 不走到事件脸上，避免触发任何接触路径；菜单由 scan 在停下后弹出）
WSQ.EIX.shouldStopAtRange = function () {
    if (!WSQ.EIX.bool("menuOnlyTrigger", true)) return false;
    if (!$gameTemp.isDestinationValid()) return false;
    var destX = Math.floor($gameTemp.destinationX());
    var destY = Math.floor($gameTemp.destinationY());
    var px = Math.round($gamePlayer.x);
    var py = Math.round($gamePlayer.y);
    var events = $gameMap.eventsXy(destX, destY);
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (WSQ.EIX.extractSyms(event).length === 0) continue;
        var dist = WSQ.EIX.distance(event._x, event._y, px, py);
        if (dist <= Math.max(1, WSQ.EIX.rangeOf(event))) {
            return true;
        }
    }
    return false;
};

//--- Scene_Map：点击互动窗口执行选中项 / 点击事件格直接开菜单 / 吞掉地图触摸 ----
// 挂载点与 WSQ_MapButtonBar 一致（processMapTouch + moveByInput 双拦截）

var _WSQ_EIX_Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
Scene_Map.prototype.processMapTouch = function () {
    // 1. 点击/按住互动窗口 → 执行光标选中的互动（最高优先）
    if (WSQ.EIX.isTouchOnList() && TouchInput.isPressed()) {
        this._touchCount = 0;
        $gameTemp.clearDestination();
        if (TouchInput.isTriggered() && WSQ.EIX.bool("clickExecute", true)) {
            WSQ.EIX.clickList();
        }
        return;
    }
    // 2. 点击/按住带标签事件格 → 打开/保持互动菜单（角色不移动，不会"跑两格"丢菜单）
    if (WSQ.EIX.isTouchOnTaggedEvent() && TouchInput.isPressed()) {
        this._touchCount = 0;
        $gameTemp.clearDestination();
        if (TouchInput.isTriggered()) {
            WSQ.EIX.openMenuAtTouch();
        }
        return;
    }
    return _WSQ_EIX_Scene_Map_processMapTouch.apply(this, arguments);
};

//--- Game_Player：按住列表忽略触摸目的地 / 范围外点击走过去、进入范围即停 --------

var _WSQ_EIX_Game_Player_moveByInput = Game_Player.prototype.moveByInput;
Game_Player.prototype.moveByInput = function () {
    if (WSQ.EIX.isTouchOnList() && TouchInput.isPressed()) {
        if (Input.dir4 !== 0) {
            _WSQ_EIX_Game_Player_moveByInput.apply(this, arguments);
        } else if (!this.isMoving()) {
            $gameTemp.clearDestination();
        }
        return;
    }
    // 点击范围外事件后自动走向事件：一进入触发范围即停在范围边缘（不接近触发），
    // 互动菜单由 scan 在停下后自动弹出
    if (WSQ.EIX.shouldStopAtRange()) {
        $gameTemp.clearDestination();
        return;
    }
    return _WSQ_EIX_Game_Player_moveByInput.apply(this, arguments);
};

//--- 滚轮监听（仅地图场景且列表开启时消费） ---------------------------------------

document.addEventListener("wheel", function (e) {
    var delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
    if (delta !== 0 && WSQ.EIX.onWheel(delta)) {
        e.preventDefault();
    }
}, { passive: false });

//=============================================================================
// 引擎挂载（全部 alias 包裹）
//=============================================================================

//--- Game_Player：每帧扫描 + 确定键拦截 ------------------------------------

var _WSQ_EIX_Game_Player_updateNonmoving = Game_Player.prototype.updateNonmoving;
Game_Player.prototype.updateNonmoving = function (wasMoving, sceneActive) {
    if (!$gameMap.isEventRunning()) {
        WSQ.EIX.scan();
    }
    return _WSQ_EIX_Game_Player_updateNonmoving.apply(this, arguments);
};

var _WSQ_EIX_Game_Player_triggerAction = Game_Player.prototype.triggerAction;
Game_Player.prototype.triggerAction = function () {
    if (this.canMove() && Input.isTriggered("ok")) {
        if (this.getOnOffVehicle()) {
            return true;
        }
        if (WSQ.EIX.executeCurrent()) {
            return true;
        }
    }
    return _WSQ_EIX_Game_Player_triggerAction.apply(this, arguments);
};

//--- Game_Player：拦截玩家动作对含标签事件的整页启动（转交互动列表） --------------
// 鼠标/触摸触发事件的完整链路有三条，都必须拦截（否则会绕过列表直接整页执行）：
//   1. triggerTouchAction(D1/D2/D3) -> checkEventTriggerHere/There -> event.start()
//   2. 移动撞上事件格（moveStraight 失败）-> checkEventTriggerTouchFront
//      -> checkEventTriggerTouch(x, y) -> startMapEvent([1,2]) -> event.start()
//      （触发类型 1/2「接触」事件的真正触发路径，v1.11 补拦）
//   3. 走到事件格上（walk-onto）-> updateNonmoving -> checkEventTriggerHere([1,2])
// 统一规则：凡玩家动作要启动的、页面带互动标签的事件一律不启动，改为打开/保持
// 互动列表（对应调用方随后的 setupStartingEvent() 返回 false，不执行）。

WSQ.EIX.blockStartAt = function (x, y, triggers, normal) {
    if (!WSQ.EIX.bool("menuOnlyTrigger", true)) return false;
    if ($gameMap.isEventRunning()) return false;
    var events = $gameMap.eventsXy(x, y);
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.isTriggerIn(triggers) && event.isNormalPriority() === normal) {
            var syms = WSQ.EIX.extractSyms(event);
            if (syms.length > 0) {
                WSQ.EIX.reset(event, syms);
                return true;
            }
        }
    }
    return false;
};

var _WSQ_EIX_Game_Player_checkEventTriggerHere = Game_Player.prototype.checkEventTriggerHere;
Game_Player.prototype.checkEventTriggerHere = function (triggers) {
    if (this.canStartLocalEvents() &&
        WSQ.EIX.blockStartAt(Math.round(this.x), Math.round(this.y), triggers, false)) {
        return;
    }
    return _WSQ_EIX_Game_Player_checkEventTriggerHere.apply(this, arguments);
};

var _WSQ_EIX_Game_Player_checkEventTriggerThere = Game_Player.prototype.checkEventTriggerThere;
Game_Player.prototype.checkEventTriggerThere = function (triggers) {
    if (this.canStartLocalEvents()) {
        var direction = this.direction();
        var x2 = WSQ.EIX.roundX(this.x, direction);
        var y2 = WSQ.EIX.roundY(this.y, direction);
        if (WSQ.EIX.blockStartAt(x2, y2, triggers, true)) {
            return;
        }
        if (!$gameMap.isAnyEventStarting() && $gameMap.isCounter(x2, y2)) {
            var x3 = WSQ.EIX.roundX(x2, direction);
            var y3 = WSQ.EIX.roundY(y2, direction);
            if (WSQ.EIX.blockStartAt(x3, y3, triggers, true)) {
                return;
            }
        }
    }
    return _WSQ_EIX_Game_Player_checkEventTriggerThere.apply(this, arguments);
};

// 移动撞上事件格（触发类型 1/2 接触事件）路径的拦截
var _WSQ_EIX_Game_Player_checkEventTriggerTouch = Game_Player.prototype.checkEventTriggerTouch;
Game_Player.prototype.checkEventTriggerTouch = function (x, y) {
    if (this.canStartLocalEvents() && WSQ.EIX.blockStartAt(x, y, [1, 2], true)) {
        return;
    }
    return _WSQ_EIX_Game_Player_checkEventTriggerTouch.apply(this, arguments);
};

//--- Game_Event：互动启动（新增方法）+ 启动标志清理 -------------------------

Game_Event.prototype.startEx = function (type) {
    var list = this.list();
    if (list && list.length > 1) {
        this._startingType = type;
        this.start();
    }
};

var _WSQ_EIX_Game_Event_clearStartingFlag = Game_Event.prototype.clearStartingFlag;
Game_Event.prototype.clearStartingFlag = function () {
    this._startingType = null;
    return _WSQ_EIX_Game_Event_clearStartingFlag.call(this);
};

//--- Game_Map：事件启动后跳转到互动标签 --------------------------------------

var _WSQ_EIX_Game_Map_setupStartingMapEvent = Game_Map.prototype.setupStartingMapEvent;
Game_Map.prototype.setupStartingMapEvent = function () {
    var type = null;
    var events = this.events();
    for (var i = 0; i < events.length; i++) {
        if (events[i].isStarting()) {
            type = events[i]._startingType || null;
            break;
        }
    }
    var result = _WSQ_EIX_Game_Map_setupStartingMapEvent.call(this);
    if (result && type) {
        this._interpreter.eventInteractSearch(type);
    }
    return result;
};

//--- Game_Interpreter：标签指令拦截（InteractEnd 结束互动） -------------------

var _WSQ_EIX_Game_Interpreter_command118 = Game_Interpreter.prototype.command118;
Game_Interpreter.prototype.command118 = function () {
    var result = _WSQ_EIX_Game_Interpreter_command118.apply(this, arguments);
    var command = this.currentCommand();
    if (this._eagleSym && command && command.parameters[0] === WSQ.EIX.str("termLabel", "InteractEnd")) {
        this.eventInteractFinish();
    }
    return result;
};

// 跳转到指定互动标签（未找到则直接结束）
Game_Interpreter.prototype.eventInteractSearch = function (sym) {
    this._eagleSym = sym;
    for (var i = 0; i < this._list.length; i++) {
        if (this._list[i].code === 118 && this._list[i].parameters[0] === sym) {
            this._index = i;
            return;
        }
    }
    this.eventInteractFinish();
};

// 结束互动（跳过剩余指令）
Game_Interpreter.prototype.eventInteractFinish = function () {
    this._index = this._list.length;
    this._eagleSym = null;
};

//--- Spriteset_Map：列表精灵的创建 / 更新 / 释放 ------------------------------

var _WSQ_EIX_Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
Spriteset_Map.prototype.createCharacters = function () {
    _WSQ_EIX_Spriteset_Map_createCharacters.call(this);
    this._wsqEIXSprite = new Sprite();
    this._wsqEIXSprite.z = 500;
    this._wsqEIXSprite.visible = false;
    this._tilemap.addChild(this._wsqEIXSprite);
    WSQ.EIX._sprite = this._wsqEIXSprite;
};

var _WSQ_EIX_Spriteset_Map_update = Spriteset_Map.prototype.update;
Spriteset_Map.prototype.update = function () {
    _WSQ_EIX_Spriteset_Map_update.call(this);
    if (this._wsqEIXSprite) {
        WSQ.EIX.update(this._wsqEIXSprite, this._characterSprites);
    }
};

var _WSQ_EIX_Spriteset_Map_destroy = Spriteset_Map.prototype.destroy;
Spriteset_Map.prototype.destroy = function (options) {
    WSQ.EIX.clear();
    WSQ.EIX._sprite = null;
    if (this._wsqEIXSprite) {
        if (this._wsqEIXSprite.bitmap) {
            this._wsqEIXSprite.bitmap.destroy();
            this._wsqEIXSprite.bitmap = null;
        }
        this._wsqEIXSprite.destroy();
        this._wsqEIXSprite = null;
    }
    return _WSQ_EIX_Spriteset_Map_destroy.call(this, options);
};
