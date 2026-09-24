//=============================================================================
// WSQ_ParallelWindow.js
//=============================================================================
// GF 对话核心补丁 —— 并行式气泡对话（老鹰 RGSS3「并行式对话」的 RMMZ/GF 移植版）
// 作者：WSQ
//
// 依赖（按顺序放置本插件之前）：
//   GF_0_CoreOfText      - 转义符文本绘制（Window_Base 文本管线扩展）
//   GF_1_CoreOfWindowUI  - 窗口 UI 核心（若有）
//   GF_2_CoreOfDialog    - 对话核心（窗口皮肤 drill_DSk / Sprite_MsgBubbleArrow）
//   GF_2_CoreOfMapEvent  - 地图图层 addAreaSprite / removeAreaSprite
//   WSQ_G_DialogPatch    -（可选，若启用则放置其之后）
//
// 功能：
//   - 事件注释 <并行对话> 之后的【显示文字】指令改为「并行气泡」：
//       不进入默认消息系统（$gameMessage / Window_Message / Scene_Message），
//       而是以多个独立气泡窗口显示在地图上，自动显隐，互不影响。
//       多个事件（各自并行事件页）可同时讲话，同屏并存多个气泡。
//   - 并行气泡不阻碍玩家移动；对当前解释器默认"挂起至气泡消失"，
//     写入 <no hangup> 后事件继续执行、气泡到时自动消失。
//   - 气泡外观与 GF 对话核心的「气泡对话」保持一致（同一套窗口皮肤样式
//     drill_DSk + 气泡箭头），跟随对话核心当前皮肤。
//   - 气泡打开/关闭使用窗口原生 openness 卷帘动画（速度跟随 GF 窗口参数
//     OpenSpeed / CloseSpeed），与 GF 常规窗口开合观感一致。
//   - 【显示文字】姓名框内容显示在气泡第一行（内联姓名）：
//       启用了 WSQ_G_DialogPatch 时遵循补丁「姓名显示格式/渐变背景/分隔线」
//       及「姓名自动定位气泡」；未启用时按姓名框原文显示。
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_ParallelWindow = true;

var WSQ = WSQ || {};
WSQ.PW = WSQ.PW || {};
WSQ.PW.version = "1.12";
WSQ.PW.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.12]        系统 - 并行式气泡对话（老鹰并行式对话 GF 移植）
 * @author WSQ
 * @base GF_2_CoreOfDialog
 * @orderAfter GF_2_CoreOfDialog
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 *
 *  本插件将 RGSS3 老鹰的「并行式对话」移植到 GF 体系，
 *  并让气泡外观与 GF 对话核心自带的「气泡对话」视觉对齐。
 *
 *  在默认消息系统中，所有事件共用全局对话框，并行事件显示文字时会
 *  互相阻塞；对话框开启时还会阻挡玩家移动。本插件的「并行气泡」则
 *  以多个独立窗口绘制在地图上：每个事件可同时显示多个气泡、
 *  自动显示自动隐藏、互不影响，也不阻挡玩家移动。
 *
 * ============================================================================
 *  使用方式A：利用事件注释开关
 * ============================================================================
 *
 *  在 事件指令-注释 中填写：
 *      <并行对话>
 *  则之后的【显示文字】指令将使用并行气泡，不进入默认对话框。
 *
 *  在 事件指令-注释 中填写：
 *      <正常对话>
 *  则恢复使用默认对话框。
 *
 *  ※ 开关跟随当前解释器，事件结束后自动复位。
 *
 * ============================================================================
 *  在显示文字文本中设置并行气泡
 * ============================================================================
 *
 *  <pos 标签对>        设置气泡的显示位置（见下）。
 *  <wait 数字>         设置气泡显示时间（帧，不含淡入淡出）。
 *                       为 0 时不自动消失，可配合 <input> 或用脚本
 *                       WSQ.PW.finish("标识") 手动关闭。
 *  <input>             允许用 确定键 提前关闭本气泡（是否默认允许由插件
 *                       参数「默认允许按键关闭」控制，写 <input> 取反）。
 *  <until>条件</until> 当 条件表达式 求值为 true 时本气泡才关闭（覆盖 wait）。
 *                       条件内可用 s[1]（开关）、v[1]（变量）、event（当前事件）。
 *  <io 模式 参数对>    移入移出模式：fade 淡入淡出 / zoom 缩放。
 *                       参数对如 t=10 opa=8 zin=1.2 zout=0。
 *  <no hangup>         设置后不挂起当前事件：事件继续执行、气泡到时自动消失。
 *  <id 标识字符串>     本气泡的唯一标识（默认取事件 ID）。相同标识的新对话
 *                       会直接覆盖旧对话。建议使用字符串。
 *  <font 数字>         设置本气泡的基础文字大小。
 *  <reset>             强制重绘气泡（当文本仅含 \v[id] 等转义且值变化时使用）。
 *
 *  -------------------  <pos> 标签对内容  -------------------
 *
 *  定位由两枚九宫格号共同决定（沿用老鹰原版语义，注意行方向为镜像）：
 *    o2=数字  目标方位点（气泡先贴靠到目标的哪一侧/哪条线，键位即方向）：
 *               8 = 目标上缘（头顶）、2 = 目标下缘（脚底）、5 = 目标中心，
 *               4/6 = 左/右缘，7/9 = 左上/右上角，1/3 = 左下/右下角。
 *              （e=事件时 o2=8 即"行走图顶部中点"；mx/my 时 o2=5 即格子中心）
 *    o=数字   气泡从该方位点向哪一侧伸展（键位方向 = 伸展方向）：
 *               2 = 向目标上方伸展（底边贴方位线，头顶气泡的默认值）
 *               8 = 自方位线向下展开（顶边贴方位线）
 *               5 = 中线对齐、4/6 = 左/右展开，等等。
 *    wx= wy=  屏幕坐标（最高优先级）。如 wx=320 wy=240。
 *    mx= my=  地图格坐标（跟随地图移动）。如 mx=5 my=6。
 *    e=数字   绑定对象（跟随移动）：
 *             0   当前事件（取不到则绑定玩家）；
 *           正数   当前地图指定编号事件；
 *           负数   队伍中数据库 ID 对应的角色（不在队则取队首）。
 *    dx= dy=  最终像素偏移。
 *    fix=1    强制气泡完整显示在屏幕内。
 *    z=数字   设置气泡层级（同图层内排序参考值）。
 *
 *  示例：
 *    <pos e=0 o2=8 dy=-10>        → 显示在当前事件头顶上方（o 默认 2）
 *    <pos e=-1 o2=8 dy=-10>       → 显示在队首角色头顶上方
 *    <pos mx=5 my=6 o=5 o2=5>     → 显示在地图格 (5,6) 中心
 *    <wait 120><no hangup>...     → 常见于并行事件中的自动提示
 *
 * ============================================================================
 *  使用方式B：脚本接口
 * ============================================================================
 *
 *  WSQ.PW.add(id, data)
 *     生成/刷新一个并行气泡。
 *     id   ：唯一标识（推荐字符串，如 "提示文字"）
 *     data ：设置对象，可含：
 *       text       文本（含转义符）
 *       faceName / faceIndex  脸图
 *       wait       显示帧数（默认 90）
 *       input      允许按键关闭（true/false）
 *       until      关闭条件表达式字符串
 *       io / io_t  （已废弃，v1.10 起开闭为原生卷帘动画，忽略）
 *       font       字号
 *       pos        {o,wx,wy,mx,my,e,o2,dx,dy,fix,z}
 *       nohangup   true 则不挂起当前解释器（add 由事件调用时生效）
 *       reset      true 强制重绘
 *
 *  WSQ.PW.finishQ(id)   查询指定气泡是否已完全关闭（true=已关闭）。
 *  WSQ.PW.finish(id)    强制关闭指定气泡。
 *  WSQ.PW.msg(id)       获取指定气泡对象（Window_WSQParaBubble）。
 *  WSQ.PW.clearAll()    立即清除全部气泡。
 *
 *  示例：
 *    WSQ.PW.add("提示", {text:"宝箱被打开了！", wait:80,
 *        pos:{e:0,o2:8,dy:-10}});
 *
 * ============================================================================
 *  姓名框显示
 * ============================================================================
 *
 *  【显示文字】姓名框（说话者）填写内容后，并行气泡在正文上方第一行显示姓名
 *  （始终以「内联姓名」形态呈现——多气泡并发场景不适用独立姓名小窗）。
 *
 *  启用了 WSQ_G_DialogPatch 时，姓名观感与该补丁的内联姓名保持一致：
 *    - 文本格式遵循补丁参数「姓名显示格式」（默认 \c[2]%1\c[0]）；
 *    - 补丁「启用内联姓名 + 姓名渐变背景」开启时，姓名行绘制渐变背景条；
 *    - 补丁「启用内联姓名 + 姓名分隔线」开启时，姓名与正文间绘制分隔线，
 *      正文顺位下移；
 *    - 补丁「启用姓名自动定位气泡」开启、且本条文本未写 <pos> 时，姓名可
 *      按补丁同名匹配规则（事件名/this/player/(event n)/follower: 等）把
 *      气泡定位到对应角色/事件头顶。
 *  未启用该补丁时，姓名按姓名框原文显示（支持 \V \C 等转义符）。
 *
 * ============================================================================
 *  开闭动画
 * ============================================================================
 *
 *  并行气泡的打开/关闭使用窗口原生 openness 卷帘动画（与 GF 常规窗口一致，
 *  速度由 GF 窗口参数 OpenSpeed / CloseSpeed 控制）。旧版 <io fade/zoom>
 *  补间及参数「默认移入移出模式 / 移入移出帧数」在 v1.10 起不再驱动动画，
 *  仅作向后兼容保留（文本中出现亦会被安全忽略）。
 *
 * ============================================================================
 *  备注
 * ============================================================================
 *  - 仅在地图场景（Scene_Map）中生效；战斗/菜单等场景不显示并行气泡，
 *    此时带并行注释的显示文字会直接跳过（不挂起）。
 *  - 并行气泡文字可用的转义符与 GF 文本核心一致（\v \n \i \c 等）。
 *  - 并行气泡每实例为一个轻量窗口，同屏数量建议控制在几十个以内。
 *  - 皮肤样式跟随对话核心当前「消息窗口」皮肤（drill_DSk tag = Window_Message）。
 * ============================================================================
 *
 * @param CommentOn
 * @text 开启注释
 * @desc 事件注释中包含该文本时，启用并行气泡
 * @default <并行对话>
 *
 * @param CommentOff
 * @text 关闭注释
 * @desc 事件注释中包含该文本时，恢复默认对话框
 * @default <正常对话>
 *
 * @param DefaultWait
 * @text 默认显示帧数
 * @desc 气泡移入后、移出前的显示帧数（不含淡入淡出），文本未写 <wait> 时使用
 * @default 90
 *
 * @param DefaultIoType
 * @text 默认移入移出模式
 * @type select
 * @option fade
 * @option zoom
 * @desc （已废弃）v1.10 起开闭改为窗口原生卷帘动画，本参数不再生效
 * @default fade
 *
 * @param DefaultIoT
 * @text 默认移入移出帧数
 * @desc （已废弃）v1.10 起开闭改为窗口原生卷帘动画，本参数不再生效
 * @default 20
 *
 * @param InputByDefault
 * @text 默认允许按键关闭
 * @type boolean
 * @on 允许
 * @off 禁止
 * @desc true 时默认可用确定键提前关闭；文本中写 <input> 则取反
 * @default false
 *
 * @param FontSize
 * @text 默认文字大小
 * @type number
 * @min 0
 * @desc 气泡基础字号；0 = 使用系统对话字号
 * @default 0
 *
 * @param LineHeight
 * @text 默认行高
 * @type number
 * @min 0
 * @desc 气泡行高；0 = 使用系统对话行高
 * @default 0
 *
 * @param TextBorder
 * @text 额外边距加厚
 * @type number
 * @min 0
 * @desc 在 GF 消息气泡基准内边距之上整体加厚的像素数。
 *       0 = 与 GF 气泡对话框内边距完全一致（默认）。
 * @default 0
 *
 * @param FaceGap
 * @text 脸图与文字间距
 * @type number
 * @min 0
 * @desc 并行气泡内脸图与文字的间距（像素）
 * @default 20
 *
 * @param BubbleZ
 * @text 默认层级Z
 * @type number
 * @desc 并行气泡的 zIndex（同图层内多个气泡的排序参考）
 * @default 200
 *
 * @param BubbleLayer
 * @text 气泡图层
 * @type select
 * @option 上层
 * @option 最顶层
 * @option 图片层
 * @option 中层
 * @option 下层
 * @desc 气泡挂载的 GF 地图图层（上层 位于行走图上方、对话框下方）
 * @default 上层
 *
 * @param FollowMessageSkin
 * @text 跟随对话皮肤
 * @type boolean
 * @on 跟随
 * @off 不跟随
 * @desc 是否跟随对话核心消息窗口当前皮肤样式（drill_DSk tag=Window_Message）
 * @default true
 *
 * @param ShowTail
 * @text 显示气泡箭头
 * @type boolean
 * @on 显示
 * @off 隐藏
 * @desc 气泡绑定事件/角色时，是否显示指向目标的箭头（尾巴）
 * @default true
 *
 * @param ShowFace
 * @text 显示脸图
 * @type boolean
 * @on 显示
 * @off 隐藏
 * @desc 并行气泡是否支持脸图（网格默认 2行x4列；脸图文件名含 _行x列 可自定义
 *       规格，如 actor_1x1.png）
 * @default true
 *
 * @param PreConvert
 * @text 预设替换
 * @type multiline
 * @desc 每行一条「键=值」，文本中的「键」先被替换为「值」再解析标签。
 *       例：【头顶】=<pos e=0 o2=8 dy=-10 fix=1><wait 120><no hangup>
 * @default
 */
//=============================================================================

WSQ.PW.Parameters = PluginManager.parameters(WSQ.PW.pluginName);

WSQ.PW.param = function(key, def) {
    const v = WSQ.PW.Parameters[key];
    if (v === undefined || v === "") return def;
    return v;
};

WSQ.PW.commentOn = String(WSQ.PW.param("CommentOn", "<并行对话>"));
WSQ.PW.commentOff = String(WSQ.PW.param("CommentOff", "<正常对话>"));
WSQ.PW.defaultWait = Number(WSQ.PW.param("DefaultWait", 90));
WSQ.PW.defaultIoType = String(WSQ.PW.param("DefaultIoType", "fade"));
WSQ.PW.defaultIoT = Number(WSQ.PW.param("DefaultIoT", 20));
WSQ.PW.inputByDefault = String(WSQ.PW.param("InputByDefault", "false")) === "true";
WSQ.PW.fontSize = Number(WSQ.PW.param("FontSize", 0));
WSQ.PW.lineHeight = Number(WSQ.PW.param("LineHeight", 0));
WSQ.PW.textBorder = Number(WSQ.PW.param("TextBorder", 0));
WSQ.PW.faceGap = Number(WSQ.PW.param("FaceGap", 20));
WSQ.PW.bubbleZ = Number(WSQ.PW.param("BubbleZ", 200));
WSQ.PW.bubbleLayer = String(WSQ.PW.param("BubbleLayer", "上层"));
WSQ.PW.followSkin = String(WSQ.PW.param("FollowMessageSkin", "true")) !== "false";
WSQ.PW.showTail = String(WSQ.PW.param("ShowTail", "true")) !== "false";
WSQ.PW.showFace = String(WSQ.PW.param("ShowFace", "true")) !== "false";

// 预设替换表（键=值，逐行）
WSQ.PW.preConvert = {};
(function() {
    const raw = String(WSQ.PW.param("PreConvert", "") || "");
    const lines = raw.split(/[\r\n]+/);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const eq = line.indexOf("=");
        if (eq < 0) continue;
        const k = line.slice(0, eq);
        const v = line.slice(eq + 1);
        if (k) WSQ.PW.preConvert[k] = v;
    }
})();

//=============================================================================
// 场景/管理器状态
//=============================================================================

WSQ.PW._sprites = {};      // id => Window_WSQParaBubble
WSQ.PW._scene = null;      // 当前挂载的 Scene_Map
WSQ.PW._mapId = 0;

WSQ.PW.init = function() {
    WSQ.PW._sprites = {};
    WSQ.PW._scene = null;
    WSQ.PW._mapId = 0;
};

// 场景级初始化：清理旧状态
WSQ.PW.onSceneStart = function(scene) {
    if (!scene) return;
    if (WSQ.PW._scene === scene) return;
    WSQ.PW.clearAll();
    WSQ.PW._scene = scene;
    WSQ.PW._mapId = $gameMap ? $gameMap.mapId() : 0;
};

// 场景级收尾：销毁全部气泡
WSQ.PW.onSceneEnd = function(scene) {
    WSQ.PW.clearAll();
    WSQ.PW._scene = null;
};

// 场景每帧更新
WSQ.PW.update = function(scene) {
    if (WSQ.PW._scene !== scene) return;
    if (!$gameMap) return;
    // 地图切换时清空旧气泡
    if ($gameMap.mapId() !== WSQ.PW._mapId) {
        WSQ.PW.clearAll();
        WSQ.PW._mapId = $gameMap.mapId();
    }
    const keys = Object.keys(WSQ.PW._sprites);
    for (let i = 0; i < keys.length; i++) {
        const id = keys[i];
        const b = WSQ.PW._sprites[id];
        if (!b) continue;
        if (b.isFinished()) {
            WSQ.PW.removeBubble(id, b);
            continue;
        }
        b.updateBubble();
    }
};

WSQ.PW.removeBubble = function(id, b) {
    if (!b) return;
    delete WSQ.PW._sprites[id];
    if (WSQ.PW._scene && !WSQ.PW._scene._stopped) {
        try { WSQ.PW._scene.removeAreaSprite(b); } catch (e) {}
    }
    b.destroyBubble();
};

WSQ.PW.clearAll = function() {
    const keys = Object.keys(WSQ.PW._sprites);
    for (let i = 0; i < keys.length; i++) {
        const b = WSQ.PW._sprites[keys[i]];
        if (!b) continue;
        delete WSQ.PW._sprites[keys[i]];
        if (WSQ.PW._scene && !WSQ.PW._scene._stopped) {
            try { WSQ.PW._scene.removeAreaSprite(b); } catch (e) {}
        }
        b.destroyBubble();
    }
    WSQ.PW._sprites = {};
};

//=============================================================================
// 公共接口
//=============================================================================

WSQ.PW.add = function(id, data) {
    // 只在地图场景生效
    const scene = SceneManager._scene;
    if (!scene || !(scene instanceof Scene_Map)) {
        console.warn("[WSQ_ParallelWindow] 并行气泡仅支持地图场景，已跳过: " + id);
        return null;
    }
    WSQ.PW.onSceneStart(scene);
    let b = WSQ.PW._sprites[id];
    if (!b) {
        b = new Window_WSQParaBubble();
        WSQ.PW._sprites[id] = b;
        scene.addAreaSprite(b, WSQ.PW.bubbleLayer);
    }
    b.resetBubble(data || {});
    return b;
};

WSQ.PW.msg = function(id) {
    return WSQ.PW._sprites[id] || null;
};

WSQ.PW.finish = function(id) {
    const b = WSQ.PW.msg(id);
    if (b) b.finishNow();
};

// 查询指定气泡是否已完全关闭
WSQ.PW.finishQ = function(id) {
    return !WSQ.PW._sprites[id];
};

// 给解释器使用：挂起当前事件直到气泡 id 关闭
WSQ.PW.waitFor = function(interp, id) {
    if (!interp) return;
    interp._wsqWaitEid = id;
    interp.setWaitMode("wsqParaWait");
};

//=============================================================================
// 事件对象解析（与 GF 对话核心/老鹰语义对齐）
//=============================================================================

// 获取绑定对象：id 为 0=当前事件, 正数=地图事件, 负数=队伍中数据库角色
WSQ.PW.getEventTarget = function(id, eventId0) {
    if (id === 0) {
        if (eventId0 && $gameMap && $gameMap.event(eventId0)) {
            return $gameMap.event(eventId0);
        }
        return $gamePlayer;
    }
    if (id > 0) {
        if (!$gameMap) return null;
        let ev = $gameMap.event(id);
        if (!ev && eventId0) ev = $gameMap.event(eventId0);
        return ev;
    }
    // 负数：队伍中数据库 id 角色（不在队则取队首）
    const actorId = Math.abs(id);
    const members = $gameParty.members();
    for (let i = 0; i < members.length; i++) {
        if (members[i] && members[i].actorId() === actorId) {
            const f = $gamePlayer.followers()[i];
            if (f) return f;
        }
    }
    return $gamePlayer;
};

// 获取目标对象精灵（锚定框/箭头计算用）
WSQ.PW.getTargetSprite = function(target) {
    if (!target) return null;
    try {
        const scene = SceneManager._scene;
        if (scene && scene._spriteset &&
            typeof scene._spriteset.findTargetSprite === "function") {
            return scene._spriteset.findTargetSprite(target);
        }
    } catch (e) {}
    return null;
};

// 获取目标锚定矩形（屏幕坐标，y 为脚底、h 向上延伸）
WSQ.PW.getTargetRect = function(target, sprite) {
    const ts = $gameMap ? $gameMap.tileWidth() : 48;
    const th = $gameMap ? $gameMap.tileHeight() : 48;
    const r = {x: 0, y: 0, w: ts, h: th * 2};
    if (!target) return r;
    if (typeof target.screenX !== "function" || typeof target.screenY !== "function") {
        return r;
    }
    r.x = target.screenX();
    r.y = target.screenY();
    if (sprite && sprite.width > 0) {
        // 精灵锚点为底部中心：精灵矩形 = (x-w/2, y-h, w, h)
        r.x = sprite.x - sprite.width / 2;
        r.y = sprite.y - sprite.height;
        r.w = sprite.width;
        r.h = sprite.height;
    } else {
        r.x -= r.w / 2;
    }
    return r;
};

//=============================================================================
// 标签解析工具
//=============================================================================

// 解析 "k=v k2=v2 ..." 或裸关键字
WSQ.PW.parseTags = function(text) {
    const hash = {};
    const arr = String(text).split(/\s+/);
    for (let i = 0; i < arr.length; i++) {
        const tag = arr[i];
        if (!tag) continue;
        const eq = tag.indexOf("=");
        if (eq < 0) {
            hash[tag.toLowerCase()] = "";
        } else {
            hash[tag.slice(0, eq).toLowerCase()] = tag.slice(eq + 1);
        }
    }
    return hash;
};

// 从文本中提取并行气泡标签，返回过滤后的纯文本
WSQ.PW.parseTextTags = function(text, params) {
    // 预设替换
    const pre = WSQ.PW.preConvert;
    for (const k in pre) {
        if (!Object.prototype.hasOwnProperty.call(pre, k)) continue;
        if (text.indexOf(k) >= 0) {
            text = text.split(k).join(pre[k]);
        }
    }
    // <reset>
    text = text.replace(/<reset>/gi, function() { params.reset = true; return ""; });
    // <font:? ?(数字)>
    text = text.replace(/<font:?\s*(\d+)\s*>/gi, function(m, n) {
        params.font = Number(n);
        return "";
    });
    // <no hangup>
    text = text.replace(/<no\s+hangup>/gi, function() { params.nohangup = true; return ""; });
    // <id:? ?(文本)>
    text = text.replace(/<id:?\s*(.*?)>/gi, function(m, s) {
        params.id = String(s).trim();
        return "";
    });
    // <wait:? ?(数字)>
    text = text.replace(/<wait:?\s*(\d+)\s*>/gi, function(m, n) {
        params.wait = Number(n);
        return "";
    });
    // <until>...</until>
    text = text.replace(/<until>([\s\S]*?)<\/until>/gi, function(m, s) {
        params.until = String(s).trim();
        return "";
    });
    // <input>
    text = text.replace(/<input>/gi, function() { params.input = true; return ""; });
    // <io:? *(\w+) ?(参数)>
    text = text.replace(/<io:?\s*(\w+)\s*(.*?)>/gi, function(m, t, rest) {
        params.io = t;
        params.io_params = WSQ.PW.parseTags(rest);
        return "";
    });
    // <pos:? ?(参数)>
    text = text.replace(/<pos:?\s*(.*?)>/gi, function(m, rest) {
        params.pos = WSQ.PW.parseTags(rest);
        return "";
    });
    // 去掉首尾换行
    text = text.replace(/^\n/, "").replace(/\n+$/, "");
    return text;
};

//--------------------------------------------------------------------------
// 姓名显示：与 WSQ_G_DialogPatch 的参数联动
//--------------------------------------------------------------------------

// 是否已启用 WSQ_G_DialogPatch（可借用其姓名格式/渐变/分隔线参数）
WSQ.PW.hasDP = function() {
    try {
        return !!(typeof Imported !== "undefined" && Imported.WSQ_G_DialogPatch &&
            window.WSQ && WSQ.DP && WSQ.DP.Param);
    } catch (e) {
        return false;
    }
};

// 姓名装饰（渐变背景/分隔线）仅当「补丁启用 + 补丁内联姓名开启」时跟随
WSQ.PW.paraNameInlineOn = function() {
    if (!WSQ.PW.hasDP()) return false;
    try { return !!WSQ.DP.nameInlineEnabled(); } catch (e) { return false; }
};

// 姓名行渐变背景是否生效（读补丁参数）
WSQ.PW.paraNameGradActive = function() {
    if (!WSQ.PW.paraNameInlineOn()) return false;
    try {
        return !!WSQ.DP.Param.NameBackGradientEnabled &&
            Number(WSQ.DP.Param.NameBackGradientLength) > 0;
    } catch (e) { return false; }
};

// 姓名分隔线是否生效（读补丁参数）
WSQ.PW.paraNameSepActive = function() {
    if (!WSQ.PW.paraNameInlineOn()) return false;
    try {
        return !!WSQ.DP.nameSeparatorEnabled() &&
            Number(WSQ.DP.Param.NameSeparatorLength) > 0;
    } catch (e) { return false; }
};

// 分隔线占用的纵向块高（上边距 + 线高2 + 下边距）；未生效为 0
WSQ.PW.paraNameSepBlock = function() {
    if (!WSQ.PW.paraNameSepActive()) return 0;
    try {
        return (Number(WSQ.DP.Param.NameSeparatorMarginTop) || 0) + 2 +
            (Number(WSQ.DP.Param.NameSeparatorMarginBottom) || 0);
    } catch (e) { return 0; }
};

// 姓名显示文本解析：补丁特殊写法（player/this/follower:/(event n) 等）→
// 真实姓名，并按补丁「姓名显示格式」套用（%1 = 姓名）；无补丁时原样返回。
WSQ.PW.resolveNameText = function(name, anchor) {
    let display = String(name);
    if (WSQ.PW.hasDP()) {
        try {
            if (typeof WSQ.DP.resolveBubbleDisplayName === "function") {
                const dn = WSQ.DP.resolveBubbleDisplayName(display, anchor || null);
                if (dn !== undefined) display = dn;
            }
            if (WSQ.DP.Param.NameFormat) {
                display = String(WSQ.DP.Param.NameFormat).replace(/%1/g, display);
            }
        } catch (e) {}
    }
    return display;
};

// 条件求值（用于 <until>），仿照 WSQ 系列 s/v 约定
WSQ.PW.evalCond = function(cond, ev) {
    const s = new Proxy({}, {
        get: function(t, p) { return $gameSwitches.value(Number(p)); }
    });
    const v = new Proxy({}, {
        get: function(t, p) { return $gameVariables.value(Number(p)); }
    });
    const fn = new Function("s", "v", "event", "return (" + cond + ");");
    return fn(s, v, ev);
};

// 根据脸图文件名识别规格：xxx_2x4.png → 行x列（默认 2行x4列）
WSQ.PW.getFaceGrid = function(name) {
    const m = String(name).match(/_(\d+)x(\d+)(?=\.[a-zA-Z0-9]+$)/);
    if (m) {
        return {rows: Math.max(1, Number(m[1])), cols: Math.max(1, Number(m[2]))};
    }
    return {rows: 2, cols: 4};
};

//=============================================================================
// Window_WSQParaBubble —— 并行气泡窗口
//=============================================================================

function Window_WSQParaBubble() {
    this.initialize.apply(this, arguments);
}
Window_WSQParaBubble.prototype = Object.create(Window_Base.prototype);
Window_WSQParaBubble.prototype.constructor = Window_WSQParaBubble;

Window_WSQParaBubble.prototype.initialize = function() {
    Window_Base.prototype.initialize.call(this, new Rectangle(0, 0, 200, 100));
    this._drill_DTA_textList = [];
    this._drill_DTA_widthList = [];
    this._wsqBubbleFinished = true;
    this._wsqParams = null;
    this._wsqPhase = "idle";      // idle | in | hold | out
    this._wsqCount = 0;
    this._wsqArrowSprite = null;
    this._wsqStyleId = -1;
    this._wsqTarget = null;
    this._wsqTargetSprite = null;
    this._wsqAutoAnchored = false;  // 由姓名自动定位产生的锚点
    this._wsqResetFlag = false;
    this._wsqShown = false;
    this.zIndex = WSQ.PW.bubbleZ;
    this.opacity = 255;             // 开合由 openness 卷帘控制，不透明度恒定
    this.visible = false;
    this.openness = 255;            // 初始为全开，避免首帧出现
};

// 字体：消息窗口同款字体，<font>/参数可覆盖字号
Window_WSQParaBubble.prototype.standardFontFace = function() {
    return $gameSystem.messageFontFace();
};
Window_WSQParaBubble.prototype.standardFontSize = function() {
    const p = this._wsqParams;
    if (p && p.font > 0) return p.font;
    if (WSQ.PW.fontSize > 0) return WSQ.PW.fontSize;
    return $gameSystem.messageFontSize();
};
Window_WSQParaBubble.prototype.lineHeight = function() {
    const p = this._wsqParams;
    const fs = (p && p.font > 0) ? p.font : (WSQ.PW.fontSize > 0 ? WSQ.PW.fontSize : 0);
    if (fs > 0) return fs + 8;
    if (WSQ.PW.lineHeight > 0) return WSQ.PW.lineHeight;
    return $gameSystem.messageLineHeight();
};
Window_WSQParaBubble.prototype.standardFontOutlineWidth = function() {
    if (typeof Window_Base.prototype.standardFontOutlineWidth === "function") {
        return Window_Base.prototype.standardFontOutlineWidth.call(this);
    }
    return 4;
};

// 确保以消息字体渲染（覆盖核心里 mainFont 的设置）
Window_WSQParaBubble.prototype.resetFontSettings = function() {
    if (!this.contents) return;
    this.contents.fontFace = this.standardFontFace();
    this.contents.fontSize = this.standardFontSize();
    try {
        this.contents.outlineWidth = this.standardFontOutlineWidth();
    } catch (e) {
        this.contents.outlineWidth = 4;
    }
    this.contents.fontBold = false;
    this.contents.fontItalic = false;
    this.resetTextColor();
    try {
        if (typeof this.resetFontShadow === "function") this.resetFontShadow();
    } catch (e) {}
};

//--------------------------------------------------------------------------
// 重置/启动一个气泡
//--------------------------------------------------------------------------
Window_WSQParaBubble.prototype.resetBubble = function(data) {
    const oldText = this._wsqParams ? this._wsqParams.text : "";
    const oldName = this._wsqParams ? (this._wsqParams.speakerName || "") : "";
    const newName = (data.speakerName !== undefined) ? String(data.speakerName) : "";
    const sameContent = data.text === oldText && newName === oldName;
    const oldIdle = this._wsqPhase === "idle" || this._wsqBubbleFinished;
    const force = data.reset === true || oldIdle;
    if (!force && this._wsqPhase === "hold" && sameContent) {
        // 同文本且仍在显示：只重置计时并重放开启动画
        if (data.wait !== undefined && data.wait !== null) {
            this._wsqParams.wait = Number(data.wait);
        }
        this.restartBubble();
        return this;
    }
    if (!force && sameContent) {
        // 移入/移出中收到相同内容：回到移入起点重新计时
        this.restartBubble();
        return this;
    }
    this._wsqParams = data || {};
    this._wsqBubbleFinished = false;
    this._wsqResetFlag = false;
    this._wsqPhase = "in";
    this._wsqCount = 0;
    this._wsqStyleId = -1;
    this._wsqShown = false;
    this._wsqTargetSprite = null;
    this._wsqAutoAnchored = false;
    this._wsqTarget = null;

    // 参数默认值
    const p = this._wsqParams;
    if (p.text === undefined) p.text = "";
    if (p.faceName === undefined) p.faceName = "";
    if (p.faceIndex === undefined) p.faceIndex = 0;
    if (p.font === undefined) p.font = 0;
    if (p.wait === undefined || p.wait === null) p.wait = WSQ.PW.defaultWait;
    if (p.wait < 0) p.wait = 1;
    if (p.until === undefined) p.until = "";
    p.input = !!p.input;
    if (WSQ.PW.inputByDefault) p.input = !p.input;   // 与默认相反
    if (p.pos === undefined) p.pos = null;
    if (p.z === undefined) p.z = 0;

    // 姓名框（说话者）：姓名显示 + 姓名自动定位气泡（补丁开启时）
    const name = newName;
    p.speakerName = name;
    p._hasName = name !== "";
    p._displayName = p._hasName ? name : "";
    if (p._hasName && WSQ.PW.hasDP()) {
        // 1) 定位目标：<pos e=> 显式指定优先；否则若补丁「姓名自动定位气泡」
        //    开启，按姓名匹配角色/事件（this/player/(event n)/follower:/事件名）。
        let anchor = null;
        if (p.pos && p.pos["e"] !== undefined && p.pos["e"] !== "") {
            const eid0 = (data.eventId !== undefined) ? data.eventId : 0;
            this._wsqTarget = WSQ.PW.getEventTarget(Number(p.pos["e"]), eid0);
            anchor = this._wsqTarget;
        } else if (WSQ.DP.autoBubbleByNameEnabled && WSQ.DP.autoBubbleByNameEnabled()) {
            try { anchor = WSQ.DP.resolveBubbleTargetByName(name); } catch (e) { anchor = null; }
        }
        if (anchor && !this._wsqTarget) {
            this._wsqTarget = anchor;
            this._wsqAutoAnchored = true;
        }
        // 2) 显示名：特殊写法 → 真实姓名，并按补丁姓名格式套用
        p._displayName = WSQ.PW.resolveNameText(name, anchor);
    } else if (p.pos && p.pos["e"] !== undefined && p.pos["e"] !== "") {
        // 无补丁：仅 <pos e=> 绑定目标
        const eid0 = (data.eventId !== undefined) ? data.eventId : 0;
        this._wsqTarget = WSQ.PW.getEventTarget(Number(p.pos["e"]), eid0);
    }

    // 皮肤跟随（drill_DSk tag = Window_Message）
    if (WSQ.PW.followSkin) {
        this._drill_DSk_tag = "Window_Message";
        try {
            if (!this._drill_DSk_background) this.drill_DSk_createBackground();
            if (!this._drill_DSk_border) this.drill_DSk_createBorder();
        } catch (e) {}
    }

    // 箭头子精灵（依赖 GF_2_CoreOfDialog 的 Sprite_MsgBubbleArrow）
    if (!this._wsqArrowSprite && typeof Sprite_MsgBubbleArrow === "function") {
        this._wsqArrowSprite = new Sprite_MsgBubbleArrow();
        this.addChild(this._wsqArrowSprite);
        this._wsqArrowSprite.hide();
    }

    // 应用皮肤样式 + 重绘内容
    this.refreshSkinStyle();
    this.redrawBubble();
    this.showBubble();
    // 原生开合：从闭合状态卷帘打开（GF 窗口参数 OpenSpeed 控制速度）
    this._opening = false;
    this._closing = false;
    this.openness = 0;
    this._wsqPhase = "in";
    this._wsqCount = 0;
    this.open();
    return this;
};

// 重新开始：回到「移入」起点，重放原生开启动画
Window_WSQParaBubble.prototype.restartBubble = function() {
    this._wsqPhase = "in";
    this._wsqCount = 0;
    if (this._wsqParams && this._wsqParams.text !== undefined) {
        this.redrawBubble();
    }
    this._opening = false;
    this._closing = false;
    this.openness = 0;
    this.open();
    this.showBubble();
};

Window_WSQParaBubble.prototype.showBubble = function() {
    this.visible = true;
    this._wsqShown = true;
};

// 皮肤跟随刷新（检测消息窗口皮肤是否变化并重刷背景/边框）
Window_WSQParaBubble.prototype.refreshSkinStyle = function() {
    if (!WSQ.PW.followSkin) return;
    let id = -1;
    try {
        id = $gameSystem.drill_DSk_getStyleId("Window_Message");
    } catch (e) { return; }
    if (this._wsqStyleId === id) return;
    this._wsqStyleId = id;
    try {
        if (typeof this.drill_DSk_refreshBackground === "function") {
            this.drill_DSk_refreshBackground();
        }
        if (typeof this.drill_DSk_refreshBorder === "function") {
            this.drill_DSk_refreshBorder();
        }
    } catch (e) {}
};

//--------------------------------------------------------------------------
// 重绘气泡（测量 → 定尺寸 → 画脸图/文字）
//--------------------------------------------------------------------------
Window_WSQParaBubble.prototype.redrawBubble = function() {
    const p = this._wsqParams;
    if (!p) return;
    this.preparePos();

    const extra = Math.max(0, WSQ.PW.textBorder);    // 在 GF 基准内边距之上整体加厚
    const gap = WSQ.PW.faceGap;                      // 脸图与文字间距（GF 同值 20）
    const padBase = Math.max(8, this.padding || 18); // 窗口 padding（= GF 气泡 18）
    const rightPad = Math.max(0, 2 * this.itemPadding()); // GF 宽公式等效右留白（默认 16）
    const edgeL = 4;   // GF 消息气泡文本/脸图距内容区左缘（newLineX margin=4）
    const lh = this.lineHeight();

    // 1) 保证测量画布足够大
    if (!this.contents || this.contents.width < 640 || this.contents.height < 320) {
        this.move(this.x, this.y, 640, 320);
        this.createContents();
    }

    // 2) 脸图规格
    let faceW = 0, faceH = 0, faceBmp = null;
    if (WSQ.PW.showFace && p.faceName && p.faceName !== "") {
        try {
            const bmp = ImageManager.loadFace(p.faceName);
            const grid = WSQ.PW.getFaceGrid(p.faceName);
            if (bmp && bmp.width > 0) {
                faceBmp = bmp;
                faceW = Math.max(1, Math.floor(bmp.width / grid.cols));
                faceH = Math.max(1, Math.floor(bmp.height / grid.rows));
            }
        } catch (e) { faceBmp = null; }
    }
    p.faceW = faceW;
    p.faceH = faceH;
    p._faceBmp = faceBmp;
    p._faceCol = 0;
    p._faceRow = 0;
    if (faceBmp) {
        const grid = WSQ.PW.getFaceGrid(p.faceName);
        p._faceCol = p.faceIndex % grid.cols;
        p._faceRow = Math.floor(p.faceIndex / grid.cols) % grid.rows;
    }

    // 3) 姓名区（第一行）：有姓名时占一行 + 可选分隔线块
    const hasName = !!(p._hasName && p._displayName !== "");
    let nameW = 0;
    const nameH = hasName ? lh : 0;
    const sepBlock = hasName ? WSQ.PW.paraNameSepBlock() : 0;
    if (hasName) {
        try {
            const ns = this.textSizeEx(p._displayName);
            if (ns) nameW = Math.ceil(ns.width);
        } catch (e) {}
        if (nameW <= 0 && this.contents) {
            nameW = Math.ceil(this.contents.measureTextWidth(p._displayName));
        }
    }
    p._nameH = nameH;
    p._sepBlock = sepBlock;
    p._nameW = nameW;

    // 4) 文本测量（多行由 \n 换行）
    const text = String(p.text || "");
    this.resetFontSettings();
    let textW = 0, textH = 0;
    if (text !== "") {
        try {
            const ts = this.textSizeEx(text);
            if (ts) { textW = Math.ceil(ts.width); textH = Math.ceil(ts.height); }
        } catch (e) {}
        if (textW <= 0) {
            // 兜底：按行测量
            const lines = String(text).split("\n");
            for (let i = 0; i < lines.length; i++) {
                const w = this.contents ? Math.ceil(this.contents.measureTextWidth(lines[i])) : 0;
                if (w > textW) textW = w;
            }
            if (textW <= 0) textW = 10;
        }
    }
    const nLines = Math.max(1, String(text).split("\n").length);
    if (textH <= 0) textH = lh * nLines;

    // 5) 内容区排版（画布坐标系；与 GF 消息气泡几何同源）
    //    内容自 contents 原点起排，四周留白由窗口外尺寸提供：
    //    上/下 = padding(18)；左 = edgeL(4)；右 = rightPad(16)——与 GF
    //    changeToBubble 的 width=textW+margin+(padding+itemPadding)*2、
    //    height=textH+windowPadding*2 完全等价（无脸无姓名时外尺寸一致）。
    //    有脸图时：脸左缘=edgeL(4)，文字前移 faceW+gap(20)，同 GF spacing。
    const bodyH = Math.max(textH, faceH);
    const topY = 0;
    const bodyTop = topY + nameH + sepBlock;
    const textY = bodyTop + Math.max(0, Math.round((bodyH - textH) / 2));
    const faceY = bodyTop + Math.max(0, Math.round((bodyH - faceH) / 2));
    // 脸左缘=edgeL(4)；文字起点对齐 GF newLineX 的 faceWidth+spacing(20)
    //（GF 脸 x=4、spacing=20 → 脸与文字实际间距 = 20-4 = 16）
    const faceLead = faceW > 0 ? Math.max(0, faceW + gap - edgeL) : 0;
    p._nameY = topY;
    p._faceX = edgeL;
    p._faceY = faceY;
    p._drawX = edgeL + faceLead;
    p._drawY = textY;
    p._textW = textW;
    p._textH = textH;
    // 内容区宽度须同时容纳正文与姓名（姓名可能比正文长）
    const contentW = edgeL + faceLead + Math.max(textW, nameW) + rightPad;
    const contentH = nameH + sepBlock + bodyH;

    // 6) 设置窗口外尺寸（内容区 + 上下左右 padding；extra 整体加厚）
    const outerW = Math.max(16, Math.ceil(contentW + (padBase + extra) * 2));
    const outerH = Math.max(16, Math.ceil(contentH + (padBase + extra) * 2));
    this.move(this.x, this.y, outerW, outerH);
    this.createContents();

    // 7) 绘制
    this.redrawContent(text, p);
    this.updatePosition();
};

Window_WSQParaBubble.prototype.redrawContent = function(text, p) {
    if (!this.contents) return;
    this.contents.clear();
    const lh = this.lineHeight();

    // 姓名行（第一行，内联姓名）
    if (p._hasName && p._displayName !== "") {
        const nameX = p._drawX;
        const nameAvail = Math.max(1, this.contents.width - nameX - Math.max(0, 2 * this.itemPadding()));
        // 姓名渐变背景（补丁：内联姓名 + 渐变背景 开启时跟随其参数）
        if (WSQ.PW.paraNameGradActive()) {
            const ratio = Math.min(1, Math.max(0, Number(WSQ.DP.Param.NameBackGradientLength)));
            const barW = Math.floor((this.contents.width - nameX) * ratio);
            if (barW >= 4 && typeof this.contents.gradientFillNormalRect === "function") {
                try {
                    const colorL = WSQ.DP.resolveColor(WSQ.DP.Param.NameBackGradientColorL);
                    const colorR = WSQ.DP.resolveColor(WSQ.DP.Param.NameBackGradientColorR);
                    this.contents.gradientFillNormalRect(nameX, p._nameY, barW, lh, colorL, colorR);
                } catch (e) {}
            }
        }
        this.resetFontSettings();
        try {
            this.drawTextEx(p._displayName, nameX, p._nameY, nameAvail, "left");
        } catch (e) {}
        // 姓名分隔线（补丁：内联姓名 + 分隔线 开启时跟随其参数）
        if (WSQ.PW.paraNameSepActive()) {
            const ratio = Math.min(1, Math.max(0, Number(WSQ.DP.Param.NameSeparatorLength)));
            const sepW = Math.floor((this.contents.width - nameX) * ratio);
            if (sepW >= 4 && typeof this.contents.gradientFillNormalRect === "function") {
                try {
                    const sepY = p._nameY + lh + (Number(WSQ.DP.Param.NameSeparatorMarginTop) || 0);
                    const colorL = WSQ.DP.resolveColor(WSQ.DP.Param.NameSeparatorColorL);
                    this.contents.gradientFillNormalRect(nameX, sepY, sepW, 2, colorL, "rgba(0,0,0,0)");
                } catch (e) {}
            }
        }
    }

    // 脸图
    if (p.faceW > 0 && p._faceBmp) {
        try {
            this.contents.blt(
                p._faceBmp,
                p._faceCol * p.faceW, p._faceRow * p.faceH,
                p.faceW, p.faceH,
                p._faceX, p._faceY
            );
        } catch (e) {}
    }
    // 正文
    if (text !== "") {
        this.resetFontSettings();
        const availW = Math.max(1, this.contents.width - p._drawX - Math.max(0, 2 * this.itemPadding()));
        try {
            this.drawTextEx(text, p._drawX, p._drawY, availW, "left");
        } catch (e) {}
    }
};

//--------------------------------------------------------------------------
// 每帧更新（由 WSQ.PW.update 调用）
//--------------------------------------------------------------------------
Window_WSQParaBubble.prototype.updateBubble = function() {
    if (this._wsqBubbleFinished || this._wsqPhase === "idle") return;
    this.refreshSkinStyle();
    // 原生开合步进（openness 卷帘；速度 = GF 窗口参数 OpenSpeed/CloseSpeed）
    // 本窗口不在场景自动更新链上，需手动推进开/合
    if (this._wsqPhase === "in" && this._opening) {
        this.updateOpen();
    } else if (this._wsqPhase === "out" && this._closing) {
        this.updateClose();
    }
    // 箭头贴图每帧更新（内部：隐藏时也刷新样式结构，显示时才播放 GIF/特效）
    if (this._wsqArrowSprite) {
        this._wsqArrowSprite.update();
    }
    this.updatePosition();
    this.updatePhase();
};

Window_WSQParaBubble.prototype.isFinished = function() {
    return this._wsqBubbleFinished;
};

//--------------------------------------------------------------------------
// 状态机：in（卷帘展开）→ hold（保持）→ out（卷帘收起）→ 完成
// 开合由 Window 原生 openness 驱动，本函数只负责阶段推进
//--------------------------------------------------------------------------
Window_WSQParaBubble.prototype.updatePhase = function() {
    const p = this._wsqParams;
    if (!p) return;

    if (this._wsqPhase === "in") {
        // 等待卷帘完全展开
        if (this.isOpen()) {
            this._wsqPhase = "hold";
            this._wsqCount = 0;
        }
        return;
    }

    if (this._wsqPhase === "hold") {
        this._wsqCount += 1;
        if (this._wsqResetFlag) {
            this.startOut();
            return;
        }
        // until 条件
        if (p.until && p.until !== "") {
            try {
                if (WSQ.PW.evalCond(p.until, this._wsqTarget) === true) {
                    this.startOut();
                    return;
                }
            } catch (e) {}
            return;
        }
        // 按键关闭
        if (p.input && Input.isTriggered("ok")) {
            this.startOut();
            return;
        }
        // 计时（wait<=0 且无 input/until：等待外部 finish）
        if (p.wait > 0 && this._wsqCount >= p.wait) {
            this.startOut();
        }
        return;
    }

    if (this._wsqPhase === "out") {
        // 等待卷帘完全闭合
        if (this.isClosed()) {
            this._wsqPhase = "idle";
            this._wsqBubbleFinished = true;
            this.visible = false;
        }
        return;
    }
};

// 进入移出阶段：收起原生卷帘
Window_WSQParaBubble.prototype.startOut = function() {
    if (this._wsqPhase === "out") return;
    this._wsqPhase = "out";
    this._wsqCount = 0;
    this.close();
};

// 强制立即关闭（进入移出）
Window_WSQParaBubble.prototype.finishNow = function() {
    this._wsqResetFlag = true;
    this.startOut();
};

//--------------------------------------------------------------------------
// 位置计算（九宫格锚定，每帧跟随）
//--------------------------------------------------------------------------
Window_WSQParaBubble.prototype.preparePos = function() {
    const p = this._wsqParams;
    p._posRect = null;
    const h = p.pos || {};
    const rect = {
        o: Number(h["o"] || 0),
        o2: Number(h["o2"] || 0),
        dx: Number(h["dx"] || 0),
        dy: Number(h["dy"] || 0),
        fix: Number(h["fix"] || 0),
        z: (h["z"] !== undefined && h["z"] !== "") ? Number(h["z"]) : 0,
        target: null,
        mapTile: false,
        fixed: false,
        static: false,
        wx: 0, wy: 0, mx: 0, my: 0
    };
    if (h["wx"] !== undefined || h["wy"] !== undefined) {
        rect.static = true;
        rect.fixed = true;
        rect.wx = Number(h["wx"] || 0);
        rect.wy = Number(h["wy"] || 0);
        if (rect.o <= 0) rect.o = 7;   // 默认：窗口左下角位于屏幕点
        if (rect.o2 <= 0) rect.o2 = 1;
    } else if (h["mx"] !== undefined || h["my"] !== undefined) {
        rect.mapTile = true;
        rect.mx = Number(h["mx"] || 0);
        rect.my = Number(h["my"] || 0);
        if (rect.o <= 0) rect.o = 5;
        if (rect.o2 <= 0) rect.o2 = 5;
    } else if (h["e"] !== undefined && h["e"] !== "") {
        rect.target = this._wsqTarget;
        if (rect.o <= 0) rect.o = 2;    // 默认：自身 上中
        if (rect.o2 <= 0) rect.o2 = 8;  // 默认：目标 下中 → 气泡位于头顶上方
    } else if (!p.pos && this._wsqAutoAnchored && this._wsqTarget) {
        // 未写 <pos> 但姓名自动定位命中：锚定到对应角色/事件头顶
        rect.target = this._wsqTarget;
        if (rect.o <= 0) rect.o = 2;    // 自身：上中
        if (rect.o2 <= 0) rect.o2 = 8;  // 目标：下中 → 气泡位于头顶上方
    } else {
        rect.static = true;
        rect.fixed = true;
        rect.wx = 0;
        rect.wy = 0;
        if (rect.o <= 0) rect.o = 1;
        if (rect.o2 <= 0) rect.o2 = 1;
    }
    p._posRect = rect;
    return rect;
};

// 每帧计算当前位置
Window_WSQParaBubble.prototype.updatePosition = function() {
    const p = this._wsqParams;
    if (!p || !p._posRect) {
        if (p) { this.x = 0; this.y = 0; }
        return;
    }
    const rect = p._posRect;
    let r = {x: 0, y: 0, w: 0, h: 0};
    if (rect.target) {
        const sprite = WSQ.PW.getTargetSprite(rect.target);
        this._wsqTargetSprite = sprite;
        r = WSQ.PW.getTargetRect(rect.target, sprite);
    } else if (rect.mapTile) {
        const ts = $gameMap.tileWidth();
        const th = $gameMap.tileHeight();
        r = {
            x: $gameMap.adjustX(rect.mx) * ts,
            y: $gameMap.adjustY(rect.my) * ts,
            w: ts,
            h: th
        };
    } else if (rect.fixed) {
        r = {x: rect.wx, y: rect.wy, w: 0, h: 0};
    }
    this.applyPlacement(rect, r);
};

Window_WSQParaBubble.prototype.applyPlacement = function(rect, r) {
    const w = this.width;
    const h = this.height;
    // —— 九宫格定位（老鹰原版 reset_xy 两步语义，行方向为镜像映射）——
    // 目标矩形 r 为屏幕坐标：r 顶 = 对象头顶、r 底 = 对象脚底。
    // o2 = 目标方位（小键盘键位视觉位置 = 气泡所在方位）：
    //     键位 7,8,9（上排）→ 目标上缘（头顶）；1,2,3（下排）→ 目标下缘（脚底）；
    //     4,5,6 → 目标中线；列位 1,4,7 左 / 2,5,8 中 / 3,6,9 右。
    //     即先把气泡"左上角"落到该方位点（tx,ty）。
    // o  = 气泡从该方位点向哪一侧伸展（键位方向 = 伸展方向）：
    //     1,2,3 → 整体向"上"伸展（底边贴方位线）；4,5,6 → 中线对齐；
    //     7,8,9 → 从方位线向"下"展开（顶边贴方位线）。
    // 例：o2=8（头顶中线）+ o=2（向上伸展）= 气泡整体位于头顶上方。
    const o2 = Math.max(1, Math.min(9, rect.o2 || 5));
    const o2col = (o2 - 1) % 3;
    const o2row = Math.floor((o2 - 1) / 3);
    const tx = r.x + r.w * o2col / 2;
    const ty = r.y + r.h * (2 - o2row) / 2;
    const o = Math.max(1, Math.min(9, rect.o || 5));
    const ocol = (o - 1) % 3;
    const orow = Math.floor((o - 1) / 3);
    let x = tx - w * ocol / 2;
    let y = ty - h * (2 - orow) / 2;
    // fix：保证完整在屏内
    if (rect.fix === 1) {
        x = Math.max(0, Math.min(x, Graphics.width - w));
        y = Math.max(0, Math.min(y, Graphics.height - h));
    }
    this.x = Math.round(x + rect.dx);
    this.y = Math.round(y + rect.dy);
    if (rect.z > 0) this.zIndex = rect.z;
    this.updateArrow(rect, r);
};

// 气泡箭头：气泡在目标上方 → 箭头在窗口下缘；在目标下方 → 箭头翻转到上缘
Window_WSQParaBubble.prototype.updateArrow = function(rect, r) {
    const arrow = this._wsqArrowSprite;
    if (!arrow) return;
    // 卷帘未全开或已开始收起时不显示箭头
    if (!WSQ.PW.showTail || !rect || !rect.target || !this._wsqTargetSprite ||
            !this.isOpen() || this._wsqPhase === "out") {
        arrow.visible = false;
        return;
    }
    const sp = this._wsqTargetSprite;
    const targetY = sp.y;
    const myCenterY = this.y + this.height / 2;
    const arrowX = Math.round(sp.x - this.x);
    if (myCenterY > targetY) {
        // 气泡在目标下方（少见）：箭头指向上
        arrow.y = 0;
        arrow.scale.y = -1;
    } else {
        arrow.y = this.height;
        arrow.scale.y = 1;
    }
    arrow.x = arrowX;
    // 仅当箭头样式已就绪（refreshAll 在 update() 内执行）才显示
    if (arrow._drill_DAr_sprite) {
        arrow.visible = true;
    } else {
        arrow.visible = false;
    }
};

//--------------------------------------------------------------------------
// 销毁
//--------------------------------------------------------------------------
Window_WSQParaBubble.prototype.destroyBubble = function() {
    if (this._wsqBubbleFinished && !this._wsqParams) return;
    this._wsqBubbleFinished = true;
    this._wsqPhase = "idle";
    this._wsqParams = null;
    this.visible = false;
    this._opening = false;
    this._closing = false;
    this.openness = 255;
    this._wsqArrowSprite = null;
    try {
        Window_Base.prototype.destroy.call(this);
    } catch (e) {}
};

//=============================================================================
// Game_Interpreter 拦截
//=============================================================================

WSQ.PW.Game_Interpreter_clear = Game_Interpreter.prototype.clear;
Game_Interpreter.prototype.clear = function() {
    WSQ.PW.Game_Interpreter_clear.call(this);
    this._wsqParaMode = false;
    this._wsqWaitEid = null;
};

WSQ.PW.Game_Interpreter_command108 = Game_Interpreter.prototype.command108;
Game_Interpreter.prototype.command108 = function(params) {
    const r = WSQ.PW.Game_Interpreter_command108.call(this, params);
    const comments = this._comments || [];
    for (let i = 0; i < comments.length; i++) {
        const t = String(comments[i]);
        if (t.indexOf(WSQ.PW.commentOff) >= 0) {
            this._wsqParaMode = false;
            break;
        }
        if (t.indexOf(WSQ.PW.commentOn) >= 0) {
            this._wsqParaMode = true;
            break;
        }
    }
    return r;
};

WSQ.PW.Game_Interpreter_command101 = Game_Interpreter.prototype.command101;
Game_Interpreter.prototype.command101 = function(params) {
    // 普通模式：交给后续消息链（其内含 $gameMessage 忙等判断）
    if (!this._wsqParaMode) {
        return WSQ.PW.Game_Interpreter_command101.call(this, params);
    }
    // 并行气泡路径：不进入 $gameMessage / 不触发消息场景
    const data = {
        eventId: this._eventId || 0,
        faceName: params[0] || "",
        faceIndex: Number(params[1] || 0),
        background: Number(params[2] || 0),
        position: Number(params[3] || 2),
        speakerName: params[4] || ""
    };
    // 收集后续文本行（code 401）
    const texts = [];
    while (this.nextEventCode() === 401) {
        this._index++;
        texts.push(this.currentCommand().parameters[0]);
    }
    let text = texts.join("\n");
    text = WSQ.PW.parseTextTags(text, data);
    if (data.id === undefined || data.id === "") {
        data.id = "ev" + (this._eventId !== undefined ? this._eventId : 0);
    }
    if (text === "") {
        // 无正文：跳过，不挂起
        return true;
    }
    data.text = text;
    WSQ.PW.add(String(data.id), data);
    if (data.nohangup !== true) {
        WSQ.PW.waitFor(this, String(data.id));
    }
    return true;
};

// 自定义等待模式：等待指定并行气泡关闭
WSQ.PW.Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
Game_Interpreter.prototype.updateWaitMode = function() {
    if (this._waitMode === "wsqParaWait") {
        const id = this._wsqWaitEid;
        if (id !== undefined && id !== null && WSQ.PW.finishQ(id)) {
            this._wsqWaitEid = null;
            return true;
        }
        return false;
    }
    return WSQ.PW.Game_Interpreter_updateWaitMode.call(this);
};

//=============================================================================
// Scene_Map 钩子
//=============================================================================

WSQ.PW.Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
Scene_Map.prototype.createAllWindows = function() {
    WSQ.PW.Scene_Map_createAllWindows.call(this);
    WSQ.PW.onSceneStart(this);
};

WSQ.PW.Scene_Map_terminate = Scene_Map.prototype.terminate;
Scene_Map.prototype.terminate = function() {
    WSQ.PW.onSceneEnd(this);
    WSQ.PW.Scene_Map_terminate.call(this);
};

WSQ.PW.Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    WSQ.PW.update(this);
    WSQ.PW.Scene_Map_update.call(this);
};

//=============================================================================
// DataManager 初始化
//=============================================================================

WSQ.PW.DataManager_init = DataManager.init;
DataManager.init = function() {
    WSQ.PW.DataManager_init.call(this);
    WSQ.PW.init();
};

//=============================================================================
// End of File
//=============================================================================
