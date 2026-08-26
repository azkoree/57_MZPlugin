//=============================================================================
// WSQ Plugins
// WSQ_EventPopIcon.js
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_EventPopIcon = true;

var WSQ = WSQ || {};
WSQ.EPI = WSQ.EPI || {};
WSQ.EPI.version = 1.03;
WSQ.EPI.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

/*:
 * @target MZ
 * @author WSQ
 * @plugindesc [v1.03]        地图 - 角色头顶显示图标（EAGLE-RGSS3 移植，独立无前置）
 *
 * @help
 * ============================================================================
 * 角色头顶显示图标（WSQ_EventPopIcon）
 * ============================================================================
 * 移植自 RMVA 插件《角色头顶显示图标 by 老鹰》v1.3.0 及其《Add-On 事件调查提示》
 * v2.2.0，合并为单个 RMMZ 插件。功能：
 *   - 为地图上的角色（玩家、事件）添加头顶图标显示功能，支持 4 种动画
 *     （浮动/震动/弹跳/放缩）、3 个锚点（头顶/脚下/中心）与显隐渐变。
 *   - 玩家接近或面朝事件时，按事件页首条注释自动显示调查提示图标。
 *
 * ============================================================================
 * 前置需求
 * ============================================================================
 * - 无。本插件不依赖 GF 插件体系，可在任意加载位置使用。
 * - 可选：HalfMove（半格移动插件）。启用时自动采用整格距离/面向判定。
 *
 * ============================================================================
 * 备注（notetag）
 * ============================================================================
 * 写在事件页的【第一条注释】中（与 RMVA 版语法完全一致，可直接照搬）：
 *
 * 1. 玩家靠近事件时显示图标（曼哈顿距离 <= 检测半径）：
 *      <图标靠近 icon 参数...>{{条件}}
 *      <图标靠近 事件 icon 参数...>{{条件}}    → 显示在事件头顶
 *      <图标靠近 玩家 icon 参数...>{{条件}}    → 显示在玩家头顶
 *
 * 2. 玩家面朝事件时显示图标（按确定键即可触发的状态，优先级大于「靠近」）：
 *      <图标面朝 icon 参数...>{{条件}}
 *      <图标面朝 事件 icon 参数...>{{条件}}
 *      <图标面朝 玩家 icon 参数...>{{条件}}
 *
 * 3. 图标参数（空格隔开，可写多条）：
 *      def=名称 → 应用「预设参数表」中的对应预设（预设字段覆盖同名字段；预设不含图标，图标编号仍由注释中的 icon 指定）
 *      pos=数字 → 显示位置（0 事件/角色头顶，1 脚底，2 中心）
 *      type=数字 → 动画类型（1 浮动，2 震动，3 弹跳，4 放缩）
 *      dir=数字 → 浮动方向（2 下→上，4 左→右，6 右→左，8 上→下，默认 8）
 *      l=数字 → 震动幅度（type=2 时有效）
 *      opa=数字 → 0 关闭显隐切换，1 开启渐隐渐现
 *      dx=数字 dy=数字 → 坐标额外偏移
 *      pri=数字 → 显示优先级（数字大的覆盖数字小的，默认 0）
 *
 * 4. {{条件}}：可省略，默认 true。条件内可用：
 *      s = 开关（s[1] 表示 1 号开关）
 *      v = 变量（v[1] 表示 1 号变量）
 *      ss = 独立开关（ss[[x, y, 'A']]，省略地图 ID 时自动补当前地图）
 *      es = 地图事件组（es[1] 表示 1 号事件）
 *      gp = 玩家（$gamePlayer）
 *      event = 当前事件
 *    示例：<图标靠近 4>{{s[1] && v[5] > 3}}
 *
 * 5. 事件级触发距离（写在首条注释中，覆盖「检测半径」参数）：
 *      <图标距离 d>
 *    示例：<图标距离 1>
 *
 * 6. 图标编号为 0 时表示不显示。
 * 同一事件页存在多条显示图标备注时，按顺序逐条判定，显示第一条满足条件的。
 *
 * ============================================================================
 * 兼容性
 * ============================================================================
 * - 所有引擎方法均以 alias 包裹（不覆盖、不破坏其他插件的链式调用）。
 * - 无前置依赖；与 HalfMove 半格移动配合时自动采用整格判定（自动检测）。
 * - 「检测频率」参数需小于「自动消失帧数」参数，否则调查提示图标会闪烁。
 * - 战斗场景不适用（本插件仅作用于地图场景的角色精灵）。
 *
 * ============================================================================
 * 脚本接口
 * ============================================================================
 * 在事件指令【脚本】中直接调用（推荐，目标 id 统一约定，参考 GF_5_HeadIcon 范式）：
 *
 *   WSQ.EPI.show(目标id, 图标编号, options?)      → boolean 是否成功
 *   WSQ.EPI.showOn(目标id列表, 图标编号, options?) → number 成功数量
 *   WSQ.EPI.hide(目标id)                          → boolean 是否清除
 *   WSQ.EPI.hideOn(目标id列表)                     → number 成功数量
 *   WSQ.EPI.clearAll()                            → number 清除数量（一键清除全部）
 *   WSQ.EPI.resolveTarget(目标id)                  → Game_Character | null
 *
 * 目标id：0=玩家，1以上=事件id（$gameMap.event(id)），-1起=跟随者（-1为第1个）。
 * 目标id列表：数组 [0,3,-1] 或逗号分隔字符串 "0,3,-1"（兼容中文逗号）。
 * 图标编号：系统图标集（IconSet）中的索引（与事件备注 <图标靠近 4> 的 icon 一致）。
 * options 对象（缺省字段保持当前显示参数不变，即增量修改）：
 *   { pos: 0|1|2, type: 1|2|3|4, dir: 2|4|6|8, l: 数字,
 *     opa: 0|1, dx: 数字, dy: 数字, def: 预设名, persist: true|false }
 *   persist（持续显示）：true 时图标不因「自动消失帧数」超时消失，持续显示直到
 *   被 hide / popIcon=0 / 新图标覆盖清除。适合事件对话中在说话人头上显示图标
 *   （事件运行时调查提示不刷新，普通显示约 10 帧后会被自动隐藏，persist 可避免）。
 *
 * 示例：
 *   // 玩家头上显示 4 号图标（默认参数）
 *   WSQ.EPI.show(0, 4);
 *   // 事件 3 头上显示 160 号图标，中心位置
 *   WSQ.EPI.show(3, 160, { pos: 2 });
 *   // 玩家与第 1 个跟随者同时显示 4 号图标，y 偏移 -60
 *   WSQ.EPI.showOn([0, -1], 4, { dy: -60 });
 *   // 应用预设并显示：def 字段引用「预设参数表」中的名称
 *   WSQ.EPI.show(0, 4, { def: "talk", dy: -60 });
 *   // 对话中显示说话人图标（持续显示，直到 hide）：
 *   //   事件：◆脚本：WSQ.EPI.show(3, 4, { persist: true })
 *   //        ◆显示文字：……
 *   //        ◆脚本：WSQ.EPI.hide(3)
 *   // 清除事件 3 头上的图标
 *   WSQ.EPI.hide(3);
 *   // 一键清除全部目标
 *   WSQ.EPI.clearAll();
 *
 * 底层属性接口（直接操作，同样可用）：
 *   $gamePlayer.popIcon = 4;                → 玩家头顶显示 4 号图标
 *   $gamePlayer.popIconParams.dy = -60;      → 微调显示参数（pos/type/dir/l/opa/dx/dy）
 *   $gamePlayer.popIconParams.def = "look";  → 应用预设（下一帧生效并自动清除 def 键）
 *   $gamePlayer.popIcon = 0;                 → 立即清除
 *   $gameMap.event(3).popIcon = 4;           → 事件同理
 *
 * @command ShowPopIcon
 * @text 头顶图标:显示
 * @desc 在单一目标头上显示图标（编号 0 = 不显示）
 *
 * @arg TargetId
 * @text 目标id
 * @type number
 * @desc 0=玩家，1以上=事件id，-1起=跟随者
 *
 * @arg IconId
 * @text 图标编号
 * @type number
 * @desc 系统图标集（IconSet）中的索引
 *
 * @arg Pos
 * @text 位置
 * @type number
 * @desc 留空=保持当前（0头顶，1脚底，2中心）
 *
 * @arg Type
 * @text 动画类型
 * @type number
 * @desc 留空=保持当前（1浮动，2震动，3弹跳，4放缩）
 *
 * @arg Dir
 * @text 浮动方向
 * @type number
 * @desc 留空=保持当前（2下→上，4左→右，6右→左，8上→下）
 *
 * @arg L
 * @text 震动幅度
 * @type number
 * @desc 留空=保持当前（type=2 时有效）
 *
 * @arg Opa
 * @text 显隐效果
 * @type number
 * @desc 留空=保持当前（0关闭，1开启渐隐渐现）
 *
 * @arg Dx
 * @text X偏移
 * @type number
 * @desc 留空=保持当前（像素，正右负左）
 *
 * @arg Dy
 * @text Y偏移
 * @type number
 * @desc 留空=保持当前（像素，正下负上）
 *
 * @arg Def
 * @text 预设名
 * @type string
 * @desc 应用「预设参数表」中的对应预设（可留空）
 *
 * @arg Persist
 * @text 持续显示
 * @type boolean
 * @desc 开启后图标不因「自动消失帧数」超时消失，持续显示直到被清除（事件中对话场景建议开启）
 *
 * @command HidePopIcon
 * @text 头顶图标:清除
 * @desc 清除单一目标头上的图标
 *
 * @arg TargetId
 * @text 目标id
 * @type number
 * @desc 0=玩家，1以上=事件id，-1起=跟随者
 *
 * @command HidePopIconAll
 * @text 头顶图标:全部清除
 * @desc 一键清除所有目标（玩家、全部事件、全部跟随者）头上显示的图标
 *
 * @param sepDetect
 * @text -----检测-----
 *
 * @param searchRange
 * @text 检测半径
 * @desc 玩家接近事件时显示图标的最大距离（格，曼哈顿距离 = |dx|+|dy|）。事件注释可用 <图标距离 d> 单独覆盖。
 * @type number
 * @default 3
 *
 * @param searchRangeVarId
 * @text 检测半径变量 ID
 * @desc 该序号的变量值大于 0 时，作为触发的最大距离（0 = 使用「检测半径」参数）。
 * @type number
 * @default 0
 *
 * @param freqUpdate
 * @text 检测频率
 * @desc 每隔该帧数进行一次图标显示的刷新（需小于「自动消失帧数」，保证图标连续显示）。
 * @type number
 * @default 7
 *
 * @param noPopHintSwitch
 * @text 禁止调查提示开关 ID
 * @desc 该开关开启时，不再自动显示任何「靠近/面朝」调查提示图标（脚本手动设置的不受影响）。
 * @type number
 * @default 0
 *
 * @param sepDisplay
 * @text -----显示-----
 *
 * @param noPopSwitch
 * @text 禁止显示开关 ID
 * @desc 该开关开启时，强制不显示任何头顶图标（0 = 不启用此功能）。
 * @type number
 * @default 0
 *
 * @param maxShowFrame
 * @text 自动消失帧数
 * @desc 图标自动消失的帧数（须大于「检测频率」，0 = 永不消失）。
 * @type number
 * @default 10
 *
 * @param showDuringEvent
 * @text 事件中图标保持
 * @desc 事件运行时（含对话），头顶图标不因「自动消失帧数」超时消失，持续显示直到被清除（0 关闭，1 开启）。配合脚本 WSQ.EPI.show(...,{persist:true}) 用于对话中在说话人头上显示图标。
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default false
 *
 * @param maxLoopFrame
 * @text 动画循环帧数
 * @desc 完整动画循环的总帧数（用于周期运动，1 秒 = 60 帧）。
 * @type number
 * @default 60
 *
 * @param iconOpacityDisabled
 * @text 禁用图标透明度
 * @desc 未启用状态的图标透明度（0-255，120 为半透明）。
 * @type number
 * @default 120
 *
 * @param headOffset
 * @text 头顶偏移基准
 * @desc 图标显示在角色头顶时，相对角色脚底的像素偏移（0 = 自动取地图图块高度）。
 * @type number
 * @default 0
 *
 * @param sepDefault
 * @text -----默认参数-----
 *
 * @param defaultPos
 * @text 默认位置
 * @desc 脚本设置图标时的默认显示位置（0 头顶，1 脚底，2 中心）。
 * @type number
 * @default 0
 *
 * @param defaultType
 * @text 默认动画类型
 * @desc 脚本设置图标时的默认动画类型（1 浮动，2 震动，3 弹跳，4 放缩）。
 * @type number
 * @default 1
 *
 * @param defaultDir
 * @text 默认浮动方向
 * @desc 浮动动画的移动方向（2 下→上，4 左→右，6 右→左，8 上→下）。
 * @type number
 * @default 8
 *
 * @param defaultL
 * @text 默认震动幅度
 * @desc 震动动画的幅度（type=2 时有效）。
 * @type number
 * @default 2
 *
 * @param defaultOpa
 * @text 默认显隐效果
 * @desc 0 关闭显隐切换效果，1 开启渐隐渐现。
 * @type number
 * @default 0
 *
 * @param defaultDx
 * @text 默认 X 偏移
 * @desc 图标坐标的默认横向偏移（像素，正右负左）。
 * @type number
 * @default 0
 *
 * @param defaultDy
 * @text 默认 Y 偏移
 * @desc 图标坐标的默认纵向偏移（像素，正下负上）。
 * @type number
 * @default 0
 *
 * @param sepTrigger
 * @text -----触发-----
 *
 * @param defTypeEventNear
 * @text 靠近默认动画类型
 * @desc 玩家靠近事件时显示的图标，未写 type 参数时使用的默认动画类型。
 * @type number
 * @default 3
 *
 * @param defPriEventNear
 * @text 靠近默认优先级
 * @desc 玩家靠近事件时显示的图标的默认优先级（数字大的覆盖数字小的）。
 * @type number
 * @default 0
 *
 * @param defTypeEventFront
 * @text 面朝默认动画类型
 * @desc 玩家面朝事件时显示的图标，未写 type 参数时使用的默认动画类型。
 * @type number
 * @default 1
 *
 * @param defPriEventFront
 * @text 面朝优先级增量
 * @desc 玩家面朝事件时显示的图标的优先级增量（面朝提示始终大于靠近提示）。
 * @type number
 * @default 1000
 *
 * @param sepPreset
 * @text -----预设-----
 *
 * @param presets
 * @text 预设参数表
 * @desc 通过 def=名称 引用的预设参数组。留空的字段不覆盖当前参数。图标编号不在此配置，一律由事件注释 / 脚本 / 插件指令指定。
 * @type struct<PopPreset>[]
 * @default [{"Name":"look","Pos":"0","Type":"1","Dir":"","L":"","Opa":"0","Dx":"","Dy":"30"},{"Name":"默认","Pos":"0","Type":"1","Dir":"8","L":"2","Opa":"0","Dx":"0","Dy":"0"}]
 */

/*~struct~PopPreset:
 * @param Name
 * @text 预设名称
 * @desc 引用该预设时使用的名称（事件备注 def=名称）。
 * @type string
 * @default 
 *
 * @param Pos
 * @text 位置
 * @desc 0 头顶，1 脚底，2 中心；留空 = 不覆盖。
 * @type number
 * @default 
 *
 * @param Type
 * @text 动画类型
 * @desc 1 浮动，2 震动，3 弹跳，4 放缩；留空 = 不覆盖。
 * @type number
 * @default 
 *
 * @param Dir
 * @text 浮动方向
 * @desc 2 下→上，4 左→右，6 右→左，8 上→下；留空 = 不覆盖。
 * @type number
 * @default 
 *
 * @param L
 * @text 震动幅度
 * @desc 震动动画幅度；留空 = 不覆盖。
 * @type number
 * @default 
 *
 * @param Opa
 * @text 显隐效果
 * @desc 0 关闭，1 开启渐隐渐现；留空 = 不覆盖。
 * @type number
 * @default 
 *
 * @param Dx
 * @text X 偏移
 * @desc 横向偏移（像素）；留空 = 不覆盖。
 * @type number
 * @default 
 *
 * @param Dy
 * @text Y 偏移
 * @desc 纵向偏移（像素）；留空 = 不覆盖。
 * @type number
 * @default 
 */

//=============================================================================
// 参数加载
//=============================================================================

WSQ.EPI.param = PluginManager.parameters(WSQ.EPI.pluginName);

// 字符串参数（带兜底）
WSQ.EPI.str = function (key, fallback) {
    var v = WSQ.EPI.param[key];
    return v == null || v === "" ? fallback : String(v);
};

// 数值参数（带兜底）
WSQ.EPI.num = function (key, fallback) {
    var n = Number(WSQ.EPI.param[key]);
    return isNaN(n) ? fallback : n;
};

// 布尔参数（带兜底；兼容 true/"true"/1）
WSQ.EPI.bool = function (key, fallback) {
    var v = WSQ.EPI.param[key];
    if (v == null || v === "") return fallback;
    return String(v).toLowerCase() === "true" || Number(v) === 1;
};

// 图标是否持续显示（不因 maxShowFrame 超时消失）：
//   ① 角色参数 persist=true（show 接口显式指定）
//   ② 「事件中图标保持」参数开启 且 事件运行中（含对话）
WSQ.EPI.isPersisted = function (character) {
    if (!character) return false;
    if (character.popIconParams._persist === true) return true;
    if (WSQ.EPI.bool("showDuringEvent", false) && $gameMap.isEventRunning()) return true;
    return false;
};

// 预设参数表：struct<PopPreset>[] 双层编码解析（兼容未解析的原始数组）
WSQ.EPI.presets = {};
(function () {
    try {
        var raw = WSQ.EPI.str("presets", "[]");
        var arr = typeof raw === "string" ? JSON.parse(raw) : raw;
        arr.forEach(function (s) {
            var p = typeof s === "string" ? JSON.parse(s) : s;
            if (!p || !p.Name) return;
            var preset = {};
            var keys = {
                Pos: "pos", Type: "type",
                Dir: "dir", L: "l", Opa: "opa", Dx: "dx", Dy: "dy"
            };
            for (var k in keys) {
                if (p[k] !== "" && p[k] != null) preset[keys[k]] = Number(p[k]);
            }
            WSQ.EPI.presets[String(p.Name)] = preset;
        });
    } catch (e) {
        WSQ.EPI.presets = {};
        console.warn("WSQ_EventPopIcon: 预设参数表解析失败，已回退为空预设。");
    }
})();

// 应用预设：预设字段覆盖同名字段（与原版 Ruby merge 语义一致）
WSQ.EPI.applyDefault = function (name, params) {
    var preset = WSQ.EPI.presets[name];
    if (!preset) return params;
    var result = {};
    for (var k in params) result[k] = params[k];
    for (var k2 in preset) result[k2] = preset[k2];
    return result;
};

//=============================================================================
// 常量与正则（备注语法与原版完全一致）
//=============================================================================

WSQ.EPI.REGEXP_EVENT_NEAR = /<图标靠近 *(事件|玩家)? *(\d+) *?(.*?)>(\{\{.*?\}\})?/m;
WSQ.EPI.REGEXP_EVENT_FRONT = /<图标面朝 *(事件|玩家)? *(\d+) *?(.*?)>(\{\{.*?\}\})?/m;
WSQ.EPI.REGEXP_EVENT_NEAR_G = /<图标靠近 *(事件|玩家)? *(\d+) *?(.*?)>(\{\{.*?\}\})?/gm;
WSQ.EPI.REGEXP_EVENT_FRONT_G = /<图标面朝 *(事件|玩家)? *(\d+) *?(.*?)>(\{\{.*?\}\})?/gm;
WSQ.EPI.REGEXP_EVENT_ICON_DIST = /<图标距离 *(\d+)>/m;

// 事件页首条注释文本（第一条 108 注释指令）
WSQ.EPI.eventCommentHead = function (list) {
    if (!list) return "";
    for (var i = 0; i < list.length; i++) {
        if (list[i].code === 108) return String(list[i].parameters[0] || "");
    }
    return "";
};

// 解析 key=value 标签串（空格分隔，支持引号包裹的值）
WSQ.EPI.parseTags = function (str) {
    var h = {};
    if (!str) return h;
    var re = /(\w+)\s*=\s*("[^"]*"|'[^']*'|\S+)/g;
    var m;
    while ((m = re.exec(str)) !== null) {
        h[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return h;
};

// 独立开关键解析：ss[[x, y, 'A']] → [mapId, x, y, 'A']；ss[[mapId, x, y, 'A']] 直接使用
WSQ.EPI.selfSwitchKey = function (str) {
    var parts = String(str).split(",");
    var arr = [];
    for (var i = 0; i < parts.length; i++) {
        var part = String(parts[i]).trim();
        arr.push(/^\d+$/.test(part) ? Number(part) : part);
    }
    if (arr.length === 3) arr.unshift($gameMap.mapId());
    return arr;
};

// {{条件}} 求值：提供 s/v/ss/es/gp/event 作用域
WSQ.EPI.evalCond = function (cond, event) {
    var s = new Proxy({}, {
        get: function (t, p) { return $gameSwitches.value(Number(p)); }
    });
    var v = new Proxy({}, {
        get: function (t, p) { return $gameVariables.value(Number(p)); }
    });
    var ss = new Proxy({}, {
        get: function (t, p) { return $gameSelfSwitches.value(WSQ.EPI.selfSwitchKey(p)); }
    });
    var es = new Proxy({}, {
        get: function (t, p) { return $gameMap._events[Number(p)] || null; }
    });
    var fn = new Function("s", "v", "ss", "es", "gp", "event", "return (" + cond + ");");
    return fn(s, v, ss, es, $gamePlayer, event);
};

WSQ.EPI.checkBool = function (cond, def, event) {
    if (cond === "" || cond == null) return def;
    try {
        return WSQ.EPI.evalCond(cond, event);
    } catch (e) {
        return def;
    }
};

//=============================================================================
// 绘图核心（图标精灵）
//=============================================================================

// 内置缓动（替代原版依赖的 EasingFuction，仅 type=4 放缩动画使用）
WSQ.EPI.easeOutBack = function (t) {
    var c1 = 1.70158;
    var c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

WSQ.EPI.easeInOutQuint = function (t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
};

// 绘制图标（尺寸/列数跟随 ImageManager 与 IconSet 实际尺寸）
// 仅显式传 false 时使用「禁用图标透明度」；默认（不传/true）全不透明
// （对应原版 enabled=true 的默认参数语义，JS 无默认参数须显式处理）
WSQ.EPI.drawIcon = function (bitmap, iconIndex, x, y, enabled) {
    var source = ImageManager.loadSystem("IconSet");
    var pw = ImageManager.iconWidth;
    var ph = ImageManager.iconHeight;
    var cols = source.width > 0 ? Math.floor(source.width / pw) : 16;
    if (cols < 1) cols = 16;
    var sx = (iconIndex % cols) * pw;
    var sy = Math.floor(iconIndex / cols) * ph;
    var ctx = bitmap.context;
    var alpha = ctx.globalAlpha;
    ctx.globalAlpha = enabled === false ? WSQ.EPI.num("iconOpacityDisabled", 120) / 255 : 1;
    bitmap.blt(source, sx, sy, pw, ph, x, y, pw, ph);
    ctx.globalAlpha = alpha;
};

// 头顶偏移基准：参数 > 0 用参数，否则取地图图块高度
WSQ.EPI.getHeadOffset = function () {
    var head = WSQ.EPI.num("headOffset", 0);
    if (head > 0) return head;
    try {
        if ($gameMap && $gameMap.tileHeight) {
            var th = $gameMap.tileHeight();
            if (th > 0) return th;
        }
    } catch (e) {}
    return 48;
};

// 每帧更新图标精灵（锚点/位置/动画/显隐/偏移）
WSQ.EPI.updateIconSprite = function (iconSprite, iconId, frame, params) {
    var pw = ImageManager.iconWidth;
    var ph = ImageManager.iconHeight;
    if (frame === 0) {
        iconSprite.visible = true;
        if (!iconSprite.bitmap) {
            iconSprite.bitmap = new Bitmap(pw, ph);
        }
        iconSprite.bitmap.clear();
        WSQ.EPI.drawIcon(iconSprite.bitmap, iconId, 0, 0);
        iconSprite.opacity = 255;
        iconSprite.scale.x = 1;
        iconSprite.scale.y = 1;
        // 锚点（原版 ox/oy；RMMZ 无 ox/oy 语义，用 PIXI anchor）
        switch (Number(params.pos)) {
            case 0: iconSprite.anchor.set(0.5, 1); break;   // 头顶：底部中点
            case 1: iconSprite.anchor.set(0.5, 0); break;   // 脚下：顶部中点
            default: iconSprite.anchor.set(0.5, 0.5); break; // 中心
        }
    }
    var head = WSQ.EPI.getHeadOffset();
    iconSprite.x = 0;
    iconSprite.y = 0;
    iconSprite.z = 200;
    switch (Number(params.pos)) {
        case 0: iconSprite.y -= head; break;
        case 1: break;
        default: iconSprite.y -= Math.floor(head / 2); break;
    }
    var offset = WSQ.EPI.calcOffset(frame, params, iconSprite);
    iconSprite.x += offset[0];
    iconSprite.y += offset[1];
    // 显隐渐变
    if (Number(params.opa) === 1) {
        if (frame >= 1 && frame <= 29) {
            iconSprite.opacity -= 6;
        } else if (frame >= 30 && frame <= 59) {
            iconSprite.opacity += 6;
        }
    }
    // 额外偏移
    iconSprite.x += Number(params.dx) || 0;
    iconSprite.y += Number(params.dy) || 0;
};

WSQ.EPI.calcOffset = function (frame, params, iconSprite) {
    var type = Number(params.type) || 1;
    switch (type) {
        case 1: return WSQ.EPI.offsetType1(frame, Number(params.dir) || 8);
        case 2: return WSQ.EPI.offsetType2(Number(params.l) || 2);
        case 3: return WSQ.EPI.offsetType3(frame);
        case 4: return WSQ.EPI.offsetType4(frame, iconSprite);
    }
    return [0, 0];
};

// type 1 浮动：dir 2 下→上 / 4 左→右 / 6 右→左 / 8 上→下（默认）
WSQ.EPI.offsetType1 = function (frame, dir) {
    var dx = 0, dy = 0;
    if (frame >= 1 && frame <= 29) {
        switch (dir) {
            case 2: dy = Math.floor(frame / 4); break;
            case 4: dx = -Math.floor(frame / 4); break;
            case 6: dx = Math.floor(frame / 4); break;
            default: dy = -Math.floor(frame / 4); break;
        }
    } else if (frame >= 30 && frame <= 59) {
        var v = Math.floor((29 - (frame - 29)) / 4);
        switch (dir) {
            case 2: dy = v; break;
            case 4: dx = -v; break;
            case 6: dx = v; break;
            default: dy = -v; break;
        }
    }
    return [dx, dy];
};

// type 2 震动：随机抖动，幅度 l
WSQ.EPI.offsetType2 = function (l) {
    return [(-1.0 + l * Math.random()) * 2, (-1.0 + l * Math.random()) * 2];
};

// type 3 弹跳：抛物线
WSQ.EPI.offsetType3 = function (frame) {
    var dy = 0;
    if (frame >= 1 && frame <= 40) {
        dy = 12 - Math.pow(frame - 20, 2) * 0.03;
        dy = -dy;
    }
    return [0, dy];
};

// type 4 放缩：easeOutBack 放大 → easeInOutQuint 收回
WSQ.EPI.offsetType4 = function (frame, iconSprite) {
    var dzoom = 0.4;
    var t, v;
    if (frame >= 1 && frame <= 29) {
        t = frame / 30;
        v = WSQ.EPI.easeOutBack(t);
        iconSprite.scale.x = iconSprite.scale.y = 1.0 + dzoom * v;
    } else if (frame >= 30 && frame <= 59) {
        t = (frame - 29) / 30;
        v = WSQ.EPI.easeInOutQuint(t);
        iconSprite.scale.x = iconSprite.scale.y = 1.0 + dzoom - dzoom * v;
    }
    return [0, 0];
};

//=============================================================================
// 自动调查提示（原 AddOn：靠近/面朝检测）
//=============================================================================

WSQ.EPI.getSearchRange = function () {
    var vid = WSQ.EPI.num("searchRangeVarId", 0);
    if (vid > 0) {
        var v = $gameVariables.value(vid);
        if (v > 0) return v;
    }
    return WSQ.EPI.num("searchRange", 3);
};

// HalfMove 存在时整格取面前格，否则引擎默认（自动检测）
WSQ.EPI.roundX = function (x, d) {
    if ($gameMap.roundNoHalfXWithDirection) return $gameMap.roundNoHalfXWithDirection(x, d);
    return $gameMap.roundXWithDirection(x, d);
};

WSQ.EPI.roundY = function (y, d) {
    if ($gameMap.roundNoHalfYWithDirection) return $gameMap.roundNoHalfYWithDirection(y, d);
    return $gameMap.roundYWithDirection(y, d);
};

WSQ.EPI._searchCount = 0;

// 按检测频率节流的扫描入口
WSQ.EPI.updateSearchPop = function () {
    if ($gameSwitches.value(WSQ.EPI.num("noPopHintSwitch", 0))) return;
    // RMMZ 无 Game_Map.interpreter()（MV API），官方等价为 isEventRunning()
    // （= 主解释器运行中 || 有事件启动中，比原版只查主解释器更严，事件执行中不刷新图标）
    if ($gameMap.isEventRunning()) return;
    WSQ.EPI._searchCount++;
    if (WSQ.EPI._searchCount <= WSQ.EPI.num("freqUpdate", 7)) return;
    WSQ.EPI.checkSearchPop();
    WSQ.EPI._searchCount = 0;
};

WSQ.EPI.checkSearchPop = function () {
    var events = $gameMap.events();
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (event._erased) continue;
        var r = WSQ.EPI.checkEventFront(event);
        WSQ.EPI.checkEventNear(event, r[0], r[1]);
    }
};

// 玩家面朝事件时显示图标（优先级大于「靠近」）
WSQ.EPI.checkEventFront = function (event) {
    var player = $gamePlayer;
    var x2 = WSQ.EPI.roundX(player.x, player.direction());
    var y2 = WSQ.EPI.roundY(player.y, player.direction());
    var f = Math.round(event.x) === Math.round(x2) && Math.round(event.y) === Math.round(y2);
    if (!f) return [false, false];
    var t = WSQ.EPI.eventCommentHead(event.list());
    var fEvent = false, fPlayer = false;
    var m;
    WSQ.EPI.REGEXP_EVENT_FRONT_G.lastIndex = 0; // 防御：重置 exec 游标
    while ((m = WSQ.EPI.REGEXP_EVENT_FRONT_G.exec(t)) !== null) {
        var isEvent = (m[1] || "事件") === "事件";
        var target = isEvent ? event : player;
        if (m[4] && WSQ.EPI.checkBool(m[4].slice(2, -2), false, target) !== true) continue;
        var h = WSQ.EPI.parseTags((m[3] || "").replace(/^\s+/, ""));
        if (h.def) h = WSQ.EPI.applyDefault(h.def, h);
        h.type = h.type || WSQ.EPI.num("defTypeEventFront", 1);
        h.pri = Number(h.pri != null ? h.pri : WSQ.EPI.num("defPriEventNear", 0));
        h.pri += WSQ.EPI.num("defPriEventFront", 1000);
        target.popIconParams.pri = target.popIconParams.pri || 0;
        if (target.popIconParams.pri > h.pri) continue;
        target.popIcon = Number(m[2]) || 0;
        if (Number(h.icon) > 0) target.popIcon = Number(h.icon);
        h.icon = 0; // 置零，防止重复刷新和持续显示
        for (var k in h) target.popIconParams[k] = h[k];
        if (isEvent) fEvent = true; else fPlayer = true;
    }
    return [fEvent, fPlayer];
};

// 玩家靠近事件时显示图标
WSQ.EPI.checkEventNear = function (event, fEvent, fPlayer) {
    var player = $gamePlayer;
    var d = Math.abs(Math.round(event.x) - Math.round(player.x)) +
            Math.abs(Math.round(event.y) - Math.round(player.y));
    var t = WSQ.EPI.eventCommentHead(event.list());
    var m = t.match(WSQ.EPI.REGEXP_EVENT_ICON_DIST);
    var dist = m ? Number(m[1]) : WSQ.EPI.getSearchRange();
    if (d > dist) return;
    var mm;
    WSQ.EPI.REGEXP_EVENT_NEAR_G.lastIndex = 0; // 防御：重置 exec 游标
    while ((mm = WSQ.EPI.REGEXP_EVENT_NEAR_G.exec(t)) !== null) {
        var isEvent = (mm[1] || "事件") === "事件";
        // 已显示对应位置的面朝图标，则跳过该位置的靠近判定
        if ((fEvent && isEvent) || (fPlayer && !isEvent)) continue;
        var target = isEvent ? event : player;
        if (mm[4] && WSQ.EPI.checkBool(mm[4].slice(2, -2), false, target) !== true) continue;
        var h = WSQ.EPI.parseTags((mm[3] || "").replace(/^\s+/, ""));
        if (h.def) h = WSQ.EPI.applyDefault(h.def, h);
        h.type = h.type || WSQ.EPI.num("defTypeEventNear", 3);
        h.pri = Number(h.pri != null ? h.pri : WSQ.EPI.num("defPriEventNear", 0));
        target.popIconParams.pri = target.popIconParams.pri || 0;
        if (target.popIconParams.pri > h.pri) continue;
        target.popIcon = Number(mm[2]) || 0;
        if (Number(h.icon) > 0) target.popIcon = Number(h.icon);
        h.icon = 0;
        for (var k in h) target.popIconParams[k] = h[k];
    }
};

//=============================================================================
// Game_CharacterBase：头顶图标变量（含读档兜底）
//=============================================================================

var _WSQ_EPI_Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function () {
    _WSQ_EPI_Game_CharacterBase_initMembers.call(this);
    this.resetPopIconParams();
};

Game_CharacterBase.prototype.resetPopIconParams = function () {
    this._popIcon = 0;
    this._popIconParams = {
        pos: WSQ.EPI.num("defaultPos", 0),
        dx: WSQ.EPI.num("defaultDx", 0),
        dy: WSQ.EPI.num("defaultDy", 0),
        type: WSQ.EPI.num("defaultType", 1),
        dir: WSQ.EPI.num("defaultDir", 8),
        l: WSQ.EPI.num("defaultL", 2),
        opa: WSQ.EPI.num("defaultOpa", 0)
    };
};

Object.defineProperty(Game_CharacterBase.prototype, "popIcon", {
    get: function () { return this._popIcon || 0; },
    set: function (v) { this._popIcon = v; },
    configurable: true
});

Object.defineProperty(Game_CharacterBase.prototype, "popIconParams", {
    get: function () {
        // 旧存档反序列化不走构造函数，这里兜底初始化
        if (!this._popIconParams) this.resetPopIconParams();
        return this._popIconParams;
    },
    set: function (v) { this._popIconParams = v; },
    configurable: true
});

//=============================================================================
// Sprite_Character：头顶图标精灵的创建/绘制/释放
//=============================================================================

// 主更新逻辑（顺序与原版 update_popicon 一致）
Sprite_Character.prototype.updatePopIcon = function () {
    // 开关控制：强制消除
    if ($gameSwitches.value(WSQ.EPI.num("noPopSwitch", 0))) {
        if (this._popIcon !== 0) this.endPopIcon();
        return;
    }
    if (!this._popiconSprite) this.resetPopIcon();
    this.handleNewIconRequest();
    if (this._popIcon <= 0) return;
    var params = this._character.popIconParams;
    // 自动消失计时（persist 或「事件中图标保持」开启时不超时）
    if (this._popiconCount - this._popiconLastActivate > WSQ.EPI.num("maxShowFrame", 10) &&
        !WSQ.EPI.isPersisted(this._character)) {
        this.endPopIcon();
        return;
    }
    // 图标集未就绪时跳过本帧（防止空白图标）
    if (!ImageManager.loadSystem("IconSet").isReady()) return;
    var frame = this._popiconCount % WSQ.EPI.num("maxLoopFrame", 60);
    // 应用预设（def 键在应用后清除，防重复）
    if (params.def) {
        params = WSQ.EPI.applyDefault(params.def, params);
        this._character.popIconParams = params;
        if (Number(params.icon) > 0) {
            this._character.popIcon = this._popIcon = Number(params.icon);
        }
        delete params.def;
    }
    WSQ.EPI.updateIconSprite(this._popiconSprite, this._popIcon, frame, params);
    this._popiconCount++;
};

Sprite_Character.prototype.resetPopIcon = function () {
    this._popIcon = this._character.popIcon;
    this._character.popIcon = -1; // 标记已激活
    if (!this._popiconSprite) {
        this._popiconSprite = new Sprite();
        this._popiconSprite.z = 200;
        this.addChild(this._popiconSprite);
    }
    this._popiconCount = 0;
    this._popiconLastActivate = 0;
};

Sprite_Character.prototype.handleNewIconRequest = function () {
    if (this._character.popIcon <= 0) return;
    if (this._character.popIcon === this._popIcon) {
        // 图标 ID 与当前相同：重置计时器（保持连续显示）
        this._popiconLastActivate = this._popiconCount;
        this._character.popIcon = -1;
    } else {
        // 新图标：完全重置
        this.resetPopIcon();
    }
};

Sprite_Character.prototype.endPopIcon = function () {
    if (this._popiconSprite) this._popiconSprite.visible = false;
    this._popIcon = 0;
    this._character.popIcon = 0;
    // 优先级重置（原 AddOn 的 end_popicon 扩展）+ 清除持续显示标记
    if (this._character.popIconParams) {
        this._character.popIconParams.pri = 0;
        delete this._character.popIconParams._persist;
    }
};

var _WSQ_EPI_Sprite_Character_update = Sprite_Character.prototype.update;
Sprite_Character.prototype.update = function () {
    // apply 透传参数：Sprite_Character.update 无参，但其他插件可能扩展带参调用
    _WSQ_EPI_Sprite_Character_update.apply(this, arguments);
    if (this._character) this.updatePopIcon();
};

var _WSQ_EPI_Sprite_Character_dispose = Sprite_Character.prototype.dispose;
Sprite_Character.prototype.dispose = function () {
    _WSQ_EPI_Sprite_Character_dispose.apply(this, arguments);
    if (this._popiconSprite) {
        if (this._popiconSprite.bitmap) this._popiconSprite.bitmap.destroy();
        this._popiconSprite.destroy();
        this._popiconSprite = null;
    }
};

//=============================================================================
// Game_Player：每帧扫描调查提示
//=============================================================================

var _WSQ_EPI_Game_Player_update = Game_Player.prototype.update;
Game_Player.prototype.update = function () {
    // 关键：必须 apply 透传 sceneActive 参数——RMMZ 的 update(sceneActive)
    // 依赖它控制输入处理（updateMoveByInput(sceneActive)，false 时完全不处理
    // 键盘/触摸输入），用 call(this) 会丢参导致玩家无法移动
    _WSQ_EPI_Game_Player_update.apply(this, arguments);
    WSQ.EPI.updateSearchPop();
};

//=============================================================================
// 脚本接口（v1.01：参考 GF_5_HeadIcon 范式，统一目标 id 约定）
//=============================================================================
// 目标id：0=玩家，1以上=事件id，-1起=跟随者（-1为第1个跟随者）

WSQ.EPI.resolveTarget = function (targetId) {
    var id = Number(targetId);
    if (!isFinite(id)) return null;
    if (id === 0) return $gamePlayer || null;
    if (id > 0) {
        if (!$gameMap) return null;
        return $gameMap.event(id) || null;
    }
    if (!$gamePlayer) return null;
    var followerIndex = -id - 1;
    return $gamePlayer.followers().follower(followerIndex) || null;
};

// 解析目标id列表：数组 / 数字 / 逗号（中英文）分隔字符串
WSQ.EPI.parseTargetIds = function (input) {
    if (Array.isArray(input)) return input;
    if (typeof input === "number") return [input];
    return String(input).split(/[,，\s]+/).filter(function (s) { return s !== ""; }).map(Number);
};

// 在单一目标上显示图标；options 缺省字段保持当前显示参数（增量修改）
WSQ.EPI.show = function (targetId, iconId, options) {
    var character = WSQ.EPI.resolveTarget(targetId);
    if (!character) return false;
    var icon = Number(iconId);
    if (!(icon > 0)) return false;   // 0 = 不显示
    options = options || {};
    var params = character.popIconParams;
    var numKeys = ["pos", "type", "dir", "l", "opa", "dx", "dy"];
    for (var i = 0; i < numKeys.length; i++) {
        var k = numKeys[i];
        if (options[k] !== undefined && options[k] !== null && options[k] !== "") {
            params[k] = Number(options[k]);
        }
    }
    if (options.def !== undefined && options.def !== null && options.def !== "") {
        params.def = String(options.def);
    }
    // persist：持续显示，不因「自动消失帧数」超时消失（直到 hide / popIcon=0 / 被覆盖）
    if (options.persist !== undefined && options.persist !== null && options.persist !== "") {
        params._persist = String(options.persist).toLowerCase() === "true" || Number(options.persist) === 1;
    }
    character.popIcon = icon;
    return true;
};

// 在多个目标上显示同一图标，返回成功数量
WSQ.EPI.showOn = function (targetIds, iconId, options) {
    var ids = WSQ.EPI.parseTargetIds(targetIds);
    var count = 0;
    for (var i = 0; i < ids.length; i++) {
        if (WSQ.EPI.show(ids[i], iconId, options)) count++;
    }
    return count;
};

// 清除单一目标头上的图标（同时清除持续显示标记）
WSQ.EPI.hide = function (targetId) {
    var character = WSQ.EPI.resolveTarget(targetId);
    if (!character) return false;
    if (character.popIconParams) delete character.popIconParams._persist;
    character.popIcon = 0;
    return true;
};

// 清除多个目标头上的图标，返回成功数量
WSQ.EPI.hideOn = function (targetIds) {
    var ids = WSQ.EPI.parseTargetIds(targetIds);
    var count = 0;
    for (var i = 0; i < ids.length; i++) {
        if (WSQ.EPI.hide(ids[i])) count++;
    }
    return count;
};

// 一键清除所有目标（玩家、全部事件、全部跟随者）头上的图标，返回清除数量
WSQ.EPI.clearAll = function () {
    var count = 0;
    var targets = [];
    if ($gamePlayer) {
        targets.push($gamePlayer);
        var followers = $gamePlayer.followers()._data || [];
        for (var i = 0; i < followers.length; i++) {
            if (followers[i]) targets.push(followers[i]);
        }
    }
    if ($gameMap && $gameMap.events) {
        var events = $gameMap.events();
        for (var i = 0; i < events.length; i++) {
            if (events[i]) targets.push(events[i]);
        }
    }
    for (var i = 0; i < targets.length; i++) {
        if (targets[i].popIcon !== 0) {
            targets[i].popIcon = 0;
            if (targets[i].popIconParams) delete targets[i].popIconParams._persist;
            count++;
        }
    }
    return count;
};

//=============================================================================
// 插件指令
//=============================================================================

PluginManager.registerCommand(WSQ.EPI.pluginName, "ShowPopIcon", function (args) {
    WSQ.EPI.show(args.TargetId, args.IconId, {
        pos: args.Pos, type: args.Type, dir: args.Dir, l: args.L,
        opa: args.Opa, dx: args.Dx, dy: args.Dy, def: args.Def, persist: args.Persist
    });
});

PluginManager.registerCommand(WSQ.EPI.pluginName, "HidePopIcon", function (args) {
    WSQ.EPI.hide(args.TargetId);
});

PluginManager.registerCommand(WSQ.EPI.pluginName, "HidePopIconAll", function (args) {
    WSQ.EPI.clearAll();
});
