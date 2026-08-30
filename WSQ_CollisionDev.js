//=============================================================================
// GF Plugins
// WSQ_CollisionDev.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc [v1.06] 工具 - 地图碰撞可视化（半透明红块显示不可通行区域，蓝色显示事件碰撞，读取 HalfMove 半格/四分之一格设置）
 * @author WSQ
 * @url https://github.com/WSQ-dev
 *
 * @base HalfMove
 * @base GF_2_CoreOfMapEvent
 * @base Hendrix_Realtime_Parallax_Map_Builder
 * @base Keke_FreeCamera
 * @orderAfter HalfMove
 * @orderAfter GF_2_CoreOfMapEvent
 * @orderAfter Hendrix_Realtime_Parallax_Map_Builder
 * @orderAfter Keke_FreeCamera
 *
 * @param 切换按键
 * @text 切换按键
 * @desc 按下此键切换碰撞显示的开关。可选值：F4 / F5 / F6 / F7 / F10 / F11。
 * @default F6
 *
 * @param 仅测试模式
 * @text 仅测试模式
 * @type boolean
 * @desc 仅 test 模式（带 ?test 启动）下生效，部署版不触发。
 * @default true
 *
 * @param 显示时完整重载地图
 * @text 显示时完整重载地图
 * @type boolean
 * @desc 从“隐藏”按切换键进入“显示”时，先完整重载当前地图（同地图传送重载，事件/图块一并刷新），
 *        再显示碰撞区域；若当前处于无法移动状态（事件/菜单等），会退回用内存数据重绘。
 *        关闭则仅用当前内存中的地图数据重绘。
 * @default true
 *
 * @param 红色透明度
 * @text 红色透明度
 * @type number
 * @min 0
 * @max 255
 * @desc 不可通行红块的填充透明度（0-255，越大越不透明）。
 * @default 110
 *
 * @param 显示边框
 * @text 显示边框
 * @type boolean
 * @desc 是否为红/蓝碰撞块加描边，便于辨识边界。
 * @default false
 *
 * @param 边框透明度
 * @text 边框透明度
 * @type number
 * @min 0
 * @max 255
 * @desc 描边透明度（显示边框为 true 时生效）。
 * @default 220
 *
 * @param 显示网格
 * @text 显示网格
 * @type boolean
 * @desc 打开碰撞预览时，叠加一层 48x48 白色网格，方便对齐参考。
 * @default true
 *
 * @param 网格透明度
 * @text 网格透明度
 * @type number
 * @min 0
 * @max 255
 * @desc 网格线的透明度（显示网格为 true 时生效）。
 * @default 140
 *
 * @param 直觉绘制模式
 * @text 直觉绘制模式
 * @type boolean
 * @desc 开启后，红块直接画在你「刷 Region 的那一格」的对应半格/象限（设计视角）；
 *        关闭则为引擎真实被挡位置（碰撞视角）。事件蓝块的画法由「事件碰撞绘制模式」单独控制。
 * @default false
 *
 * @param 显示事件碰撞
 * @text 显示事件碰撞
 * @type boolean
 * @desc 开启后，在红色地形碰撞之上叠加蓝色事件碰撞区域。
 * @default true
 *
 * @param 蓝色透明度
 * @text 蓝色透明度
 * @type number
 * @min 0
 * @max 255
 * @desc 事件碰撞蓝块的填充透明度（0-255，越大越不透明）。
 * @default 100
 *
 * @param 事件碰撞绘制模式
 * @text 事件碰撞绘制模式
 * @type select
 * @option 碰撞视角（逐格探测实际阻挡位置）
 * @value collision
 * @option 直觉模式（画配置矩形）
 * @value intuitive
 * @option 跟随红色直觉绘制模式
 * @value follow
 * @desc 控制事件碰撞蓝块的画法。默认“碰撞视角”显示引擎实际阻挡位置；
 *       若想和红色一起受「直觉绘制模式」开关控制，请选“跟随红色直觉绘制模式”。
 * @default collision
 *
 * @help
 * ============================================================================
 *  介绍 / Introduction
 * ============================================================================
 *  本插件是一个调试辅助工具。在测试游戏（test 模式）时，按下指定按键即可在
 *  地图上以半透明红色叠加层显示「无法通行的地方」，并用半透明蓝色叠加层显示
 *  事件的碰撞区域。
 *
 *  它与 HalfMove 插件深度协作：直接调用 HalfMove 提供的
 *  Game_Map.prototype.isPassableByHalfRegionAndTag 方法，对每一格的四个半格
 *  （上/下/左/右/四角）子区域逐一探测，从而精确显示对应半格 / 四分之一格的
 *  不可通行区域，而非整格。
 *
 *  事件碰撞预览读取 HalfMove 与 GF_2_CoreOfMapEvent 的碰撞设置：默认绘制
 *  事件坐标为中心的 1×1 格（即所在格下半部分 + 下一格上半部分），并支持
 *  <HMExpansionArea> 等备注扩展。
 *
 *  它与 Hendrix_Realtime_Parallax_Map_Builder（Sang Hendrix，商业插件）及
 *  Keke_FreeCamera 共存：叠加层挂载于 Spriteset_Map 之上，自动随相机平移与
 *  缩放移动，不修改任何被适配插件的本体。
 *
 * ============================================================================
 *  前置需求 / Requirements
 * ============================================================================
 *  • RPG Maker MZ
 *  • HalfMove（半格移动插件）—— 提供半格 / 四分之一格 Region 通行度判定。
 *    本插件置于 HalfMove 之后加载。
 *  • GF_2_CoreOfMapEvent（可选）—— 提供「事件碰撞体积」页面注释扩展，蓝色预览会读取。
 *  • Hendrix_Realtime_Parallax_Map_Builder（可选）—— 置于其之后加载即可共存。
 *  • Keke_FreeCamera（可选）—— 缩放场景下叠加层自动跟随。
 *
 *  加载层级说明：本插件为第 5 层调试补丁，应置于 HalfMove、Hendrix、
 *  Keke_FreeCamera 等依赖插件之后。
 *
 * ============================================================================
 *  兼容性 / Compatibility
 * ============================================================================
 *  • 通过 @orderAfter 声明依赖，不会覆写被适配插件的任何方法本体。
 *  • HalfMove 未加载时自动降级为整格 isPassable 判定（仍可用，但只显示整格）。
 *  • Hendrix 对 Game_Map.isPassable 的 alias（刷漆阻挡格）会被一并纳入——
 *    因为探针最终仍走 isPassableByHalfRegionAndTag -> 区域读取，与 painted
 *    tiles 互不冲突。
 *
 * ============================================================================
 *  插件指令 / Plugin Commands
 * ============================================================================
 *  • 重建碰撞显示（RebuildCollision）
 *    强制重新生成叠加层。仅用当前内存中的地图数据重绘，不重新读取磁盘；
 *    如需连同编辑器保存的最新数据一起刷新，请用切换键开显示（参数开启完整重载）或 WSQ.CD.reloadMap()。
 *
 * ============================================================================
 *  备注 / Notetags
 * ============================================================================
 *  本插件自身没有备注；它读取以下既有插件的事件碰撞设置：
 *  • HalfMove 事件备注：<HMExpansionArea:下,左,右,上> / <HM拡大領域:下,左,右,上>、
 *    <HMThroughDisable>、<HMTriggerExpansion:ON/OFF>、<HMWidth>/<HMHeight>。
 *  • GF_2_CoreOfMapEvent 事件页注释：=>事件碰撞体积:左:x 等四方向扩展。
 *  蓝色默认按「碰撞视角」逐格探测实际阻挡位置；切到「直觉模式」时，蓝色矩形会直接反映这些扩展。
 *
 * ============================================================================
 *  脚本接口 / Script Interface
 * ============================================================================
 *  • WSQ.CD.setVisible(bool)              —— 以代码方式开关叠加层
 *  • WSQ.CD.toggle()                      —— 切换叠加层显隐（开启时可按参数决定是否完整重载地图）
 *  • WSQ.CD.rebuild()                     —— 强制重建当前地图的叠加层
 *  • WSQ.CD.reloadMap()                   —— 完整重载当前地图（同地图传送重载，刷新事件/图块/Region）
 *  • WSQ.CD.isVisible()                   —— 返回当前是否显示
 *
 * ============================================================================
 *  两种绘制模式 / Two Render Modes
 * ============================================================================
 *  • 红色地形碰撞：由「直觉绘制模式」控制。
 *    开启 = 画在「你刷 Region 的那一格」的对应半格/象限（设计视角）；
 *    关闭 = 画在「玩家实际无法通行的位置」（碰撞视角，受 HalfMove Math.ceil 偏移影响）。
 *  • 事件碰撞（蓝色）：由「事件碰撞绘制模式」独立控制，默认「碰撞视角」。
 *    碰撞视角 = 逐半格/四分之一格探测事件实际会挡住玩家的位置；
 *    直觉模式 = 直接画事件配置的碰撞矩形（默认 1×1 格，可被备注扩展）；
 *    跟随红色 = 与「直觉绘制模式」开关保持一致。
 *
 * ============================================================================
 *  版本 / Version
 * ============================================================================
 *  v1.06 (2026-08-27) 新增「事件碰撞绘制模式」参数：默认“碰撞视角”，事件蓝块不再受红色
 *                      「直觉绘制模式」开关影响；可选“直觉模式”或“跟随红色直觉绘制模式”。
 *  v1.05 (2026-08-27) 新增事件碰撞预览：蓝色叠加层显示 HalfMove / GF 的事件碰撞设置，
 *                      支持「直觉绘制模式」画配置矩形与「碰撞视角」逐半格探测两种画法。
 *  v1.04 (2026-08-26) 进一步修复：在新 Scene_Map.onMapLoaded 前先摘下上一场景的
 *                      Hendrix chip，覆盖其它同地图重载入口，避免旧 chip 仍挂在旧
 *                      tilemap 上而无法被 Hendrix 复用。
 *  v1.03 (2026-08-26) 修复与 Hendrix 同地图热重载的兼容：重载前先摘下
 *                      Hendrix 笔刷 chip，并调整 requestMapReload / reserveTransfer
 *                      顺序，避免 Keke 同图直传吞掉重载。
 *  v1.02 (2026-08-25) 新增「显示时完整重载地图」：切回显示时走同地图传送重载，
 *                      编辑器保存后无需关闭测试进程即可刷新碰撞区域。
 *  v1.01 (2026-08-21) 新增「直觉绘制模式」开关：红块画在刷 Region 的那一格对应
 *                      象限（设计视角），不再受 HalfMove 的 ceil 坐标约定影响。
 *  v1.00 (2026-08-21) 初版：按键切换、半格/四分之一格 Region 不可通行检测、
 *                           半透明红色叠加层、Hendrix / Keke 缩放与相机适配。
 * ============================================================================
 */

/*:ja
 * @target MZ
 * @plugindesc [v1.06] ツール - マップ衝突可視化（HalfMove の半マス/4分の1マス Region を読み取り、通行不可領域を半透明赤・イベント衝突を青で表示）
 * @author WSQ
 */

(function () {
    'use strict';

    //=========================================================================
    // 命名空间与导入标记 / Namespace & Import flag
    //=========================================================================
    var Imported = Imported || {};
    Imported.WSQ_CollisionDev = true;

    var WSQ = WSQ || {};
    WSQ.CD = WSQ.CD || {};
    WSQ.CD.version = 1.06;
    WSQ.CD.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

    //=========================================================================
    // 参数读取 / Parameters
    //=========================================================================
    var params = PluginManager.parameters(WSQ.CD.pluginName);

    // 切换按键：名称 -> 键盘 code（避开 F8 调试 / F9 debug / F12 刷新）
    var KEY_CODES = {
        'F4': 115, 'F5': 116, 'F6': 117, 'F7': 118,
        'F10': 121, 'F11': 122
    };
    var toggleKeyName = String(params['切换按键'] || 'F6');
    var toggleKeyCode = KEY_CODES[toggleKeyName] || 117;
    Input.keyMapper[toggleKeyCode] = 'wsQCollisionToggle';

    var CFG = {
        testOnly: String(params['仅测试模式'] || 'true') === 'true',
        reloadOnShow: String(params['显示时完整重载地图'] || 'true') === 'true',
        opacity: Math.max(0, Math.min(255, Number(params['红色透明度'] || 110))),
        showBorder: String(params['显示边框'] || 'false') === 'true',
        borderOpacity: Math.max(0, Math.min(255, Number(params['边框透明度'] || 220))),
        showGrid: String(params['显示网格'] || 'true') === 'true',
        gridSize: 48,
        gridAlpha: Math.max(0, Math.min(255, Number(params['网格透明度'] || 140))),
        intuitive: String(params['直觉绘制模式'] || 'false') === 'true',
        showEventCollision: String(params['显示事件碰撞'] || 'true') === 'true',
        blueOpacity: Math.max(0, Math.min(255, Number(params['蓝色透明度'] || 100))),
        eventMode: String(params['事件碰撞绘制模式'] || 'collision'),
        red: 255, green: 48, blue: 48,
        blueR: 64, blueG: 160, blueB: 255
    };

    // 读取 HalfMove 的半格 Region 编号（兼容参数键名的中英文差异）。
    // 这些编号在 HalfMove 内部为局部变量，本插件通过 PluginManager.parameters 取得，
    // 以尊重用户实际配置（含多值数组），缺失时回退到默认 11-18 / 20,21。
    function getHMParamId(hm, keys, fallback) {
        if (!hm) return fallback;
        for (var i = 0; i < keys.length; i++) {
            if (!hm.hasOwnProperty(keys[i])) continue;
            var raw = hm[keys[i]];
            if (raw === '' || raw == null) continue;
            try {
                var v = JSON.parse(raw);
                if (Array.isArray(v)) return v.map(Number);
                return [Number(v)];
            } catch (e) {
                var parts = String(raw).split(',');
                var out = [];
                for (var j = 0; j < parts.length; j++) {
                    var n = parseInt(parts[j], 10);
                    if (!isNaN(n)) out.push(n);
                }
                return out.length ? out : fallback;
            }
        }
        return fallback;
    }

    var _hmParams = PluginManager.parameters('HalfMove');
    var HM_IDS = {
        upper: getHMParamId(_hmParams, ['UpperNpRegionId', '上半分移動不可Region'], [11]),
        lower: getHMParamId(_hmParams, ['LowerNpRegionId', '下半分移動不可Region'], [12]),
        right: getHMParamId(_hmParams, ['RightNpRegionId', '右半分移動不可Region'], [13]),
        left:  getHMParamId(_hmParams, ['LeftNpRegionId', '左半分移動不可Region'], [14]),
        all:   getHMParamId(_hmParams, ['AllNpRegionId', '全方向移動不可Region'], [20, 21]),
        ru:    getHMParamId(_hmParams, ['RightUpNpRegionId', '右上移動不可Region'], [15]),
        rd:    getHMParamId(_hmParams, ['RightDownNpRegionId', '右下移動不可Region'], [16]),
        lu:    getHMParamId(_hmParams, ['LeftUpNpRegionId', '左上移動不可Region'], [17]),
        ld:    getHMParamId(_hmParams, ['LeftDownNpRegionId', '左下移動不可Region'], [18])
    };
    // 反转：region id -> 类型名，供直觉模式查询
    var ID_TO_TYPE = {};
    (function () {
        for (var t in HM_IDS) {
            if (!HM_IDS.hasOwnProperty(t)) continue;
            var arr = HM_IDS[t];
            for (var k = 0; k < arr.length; k++) ID_TO_TYPE[arr[k]] = t;
        }
    })();

    WSQ.CD._enabled = false;        // 当前是否显示
    WSQ.CD._forceRebuild = false;   // 强制重建标记

    //=========================================================================
    // 工具函数 / Helpers
    //=========================================================================

    // 依据 HalfMove 的半格判定，探测某「子区域左下角坐标 (fx, fy)」是否可通行
    // fx, fy 为浮点瓦片坐标（如 5.5 表示第 5 格的右半部分）。
    function isSubTilePassable(fx, fy) {
        var gm = $gameMap;
        if (gm && typeof gm.isPassableByHalfRegionAndTag === 'function') {
            return gm.isPassableByHalfRegionAndTag(fx, fy);
        }
        // 降级：HalfMove 未加载时按整格判定
        if (gm && typeof gm.isPassable === 'function') {
            return gm.isPassable(Math.floor(fx), Math.floor(fy));
        }
        return true;
    }

    // 直觉模式：把某一 Region 类型映射到 sub×sub 子格集合（设计视角下的对应象限）。
    // sub 为每轴细分数（2=半格，4=四分之一格）。half 为上下/左右的分界。
    function quadrantCells(type, sub) {
        var cells = [];
        var half = Math.floor(sub / 2);
        for (var sy = 0; sy < sub; sy++) {
            for (var sx = 0; sx < sub; sx++) {
                var inTop = sy < half, inBot = sy >= half;
                var inLeft = sx < half, inRight = sx >= half;
                var hit = false;
                if (type === 'all') hit = true;
                else if (type === 'upper') hit = inTop;
                else if (type === 'lower') hit = inBot;
                else if (type === 'left') hit = inLeft;
                else if (type === 'right') hit = inRight;
                else if (type === 'ru') hit = inTop && inRight;
                else if (type === 'rd') hit = inBot && inRight;
                else if (type === 'lu') hit = inTop && inLeft;
                else if (type === 'ld') hit = inBot && inLeft;
                if (hit) cells.push([sx, sy]);
            }
        }
        return cells;
    }

    //=========================================================================
    // 事件碰撞辅助 / Event collision helpers
    //=========================================================================

    // 碰撞视角：探测某个子区域坐标 (fx, fy) 是否会被事件挡住（玩家视角）。
    // 同时覆盖 RMMZ/GF 整格扩展矩形与 HalfMove 的半格/触发器扩展区域。
    function isEventBlockedAt(fx, fy) {
        if (!$gameMap || typeof $gameMap.events !== 'function') return false;
        var events = $gameMap.events();
        for (var i = 0; i < events.length; i++) {
            var ev = events[i];
            if (!ev || ev._erased) continue;
            if (typeof ev.page === 'function' && !ev.page()) continue;
            if (ev.isThrough()) continue;
            if (!ev.isNormalPriority()) continue;
            // 粗略包围盒过滤：远距离事件无需逐个精细判定
            if (Math.abs(ev.x - fx) > 8 || Math.abs(ev.y - fy) > 8) continue;
            // 标准整格 / GF 事件碰撞体积 / HalfMove HMWidth/HMHeight 扩展矩形
            if (ev.pos(fx, fy)) return true;
            // HalfMove 半格碰撞：含 <HMTriggerExpansion>/<HMExpansionArea> 扩展区域
            if (typeof ev.posExpansionNt === 'function' && ev.posExpansionNt(fx, fy)) {
                if (typeof ev.isHalfThrough !== 'function' || !ev.isHalfThrough(fy)) {
                    return true;
                }
            }
        }
        return false;
    }

    // 直觉模式：返回事件配置的碰撞矩形（地图像素空间），默认 1 格下半部分。
    // 支持 HalfMove 的 posUnit/ExpansionArea 以及 GF/HM 的整格扩展。
    function getEventFootprintRects(ev, tw, th) {
        var rects = [];
        var x = ev.x;
        var y = ev.y;
        var half = 0.5;

        // 1) HalfMove posUnit：以事件坐标为中心、1×1 格。
        //    在地图像素空间表现为「事件所在格下半部分 + 下一格上半部分」。
        var uLeft = Math.round((x - half + 0.5) * tw);
        var uTop = Math.round((y - half + 1) * th);
        rects.push({
            x: uLeft,
            y: uTop,
            width: Math.max(1, Math.round(tw)),
            height: Math.max(1, Math.round(th))
        });

        // 2) HalfMove 备注 <HMExpansionArea:下,左,右,上>（自定义扩展区域）
        if (ev._customExpansion && Array.isArray(ev._expansionArea) && ev._expansionArea.length >= 4) {
            var down = Number(ev._expansionArea[0]) || 0;
            var left = Number(ev._expansionArea[1]) || 0;
            var right = Number(ev._expansionArea[2]) || 0;
            var up = Number(ev._expansionArea[3]) || 0;
            var eLeft = Math.round((x - left + 0.5) * tw);
            var eTop = Math.round((y - up + 1) * th);
            var eRight = Math.round((x + right + 0.5) * tw);
            var eBottom = Math.round((y + down + 1) * th);
            if (eRight > eLeft && eBottom > eTop) {
                rects.push({ x: eLeft, y: eTop, width: eRight - eLeft, height: eBottom - eTop });
            }
        }

        // 3) GF_2_CoreOfMapEvent 事件碰撞体积（页面注释，四方向扩展）
        var gfSum = (Number(ev._addedHitboxLeft) || 0) + (Number(ev._addedHitboxRight) || 0) +
                    (Number(ev._addedHitboxUp) || 0) + (Number(ev._addedHitboxDown) || 0);
        if (gfSum > 0) {
            var gLeft = Math.round((x - (Number(ev._addedHitboxLeft) || 0)) * tw);
            var gTop = Math.round((y - (Number(ev._addedHitboxUp) || 0)) * th);
            var gRight = Math.round((x + (Number(ev._addedHitboxRight) || 0) + 1) * tw);
            var gBottom = Math.round((y + (Number(ev._addedHitboxDown) || 0) + 1) * th);
            if (gRight > gLeft && gBottom > gTop) {
                rects.push({ x: gLeft, y: gTop, width: gRight - gLeft, height: gBottom - gTop });
            }
        }

        // 4) HalfMove 旧版 <HMWidth>/<HMHeight>（整格宽高扩展）
        var evW = Number(ev._eventWidth) || 0;
        var evH = Number(ev._eventHeight) || 0;
        if (evW > 0 || evH > 0) {
            var wRect = Math.max(1, evW);
            var hRect = Math.max(1, evH);
            rects.push({
                x: Math.round(x * tw),
                y: Math.round(y * th),
                width: Math.round(wRect * tw),
                height: Math.round(hRect * th)
            });
        }
        return rects;
    }


    function buildOverlayBitmap() {
        var gm = $gameMap;
        if (!gm) return null;

        var tw = gm.tileWidth();
        var th = gm.tileHeight();
        var w = gm.width();
        var h = gm.height();

        // 每轴细分数：HalfMove 的 Game_Map.tileUnit 决定（0.5 -> 2 等分 = 半格；
        // 0.25 -> 4 等分 = 四分之一格）。
        var unit = (typeof Game_Map.tileUnit === 'number' && Game_Map.tileUnit > 0)
            ? Game_Map.tileUnit : 0.5;
        var sub = Math.round(1 / unit);
        if (sub < 1) sub = 1;
        if (sub > 8) sub = 8; // 安全上限，防止异常 tileUnit 拖垮性能

        var bmp = new Bitmap(Math.max(1, w * tw), Math.max(1, h * th));
        var fillA = 'rgba(' + CFG.red + ',' + CFG.green + ',' + CFG.blue + ',' + (CFG.opacity / 255) + ')';
        var borderA = 'rgba(' + CFG.red + ',' + CFG.green + ',' + CFG.blue + ',' + (CFG.borderOpacity / 255) + ')';
        var blueFillA = 'rgba(' + CFG.blueR + ',' + CFG.blueG + ',' + CFG.blueB + ',' + (CFG.blueOpacity / 255) + ')';
        var blueBorderA = 'rgba(' + CFG.blueR + ',' + CFG.blueG + ',' + CFG.blueB + ',' + (CFG.borderOpacity / 255) + ')';
        var sw = Math.max(1, Math.round(tw * unit));
        var sh = Math.max(1, Math.round(th * unit));

        // 子格绘制辅助（红块 + 可选描边）
        function drawCell(dx, dy) {
            bmp.fillRect(dx, dy, sw, sh, fillA);
            if (CFG.showBorder) {
                var bw = 2;
                bmp.fillRect(dx, dy, sw, bw, borderA);                  // 上
                bmp.fillRect(dx, dy + sh - bw, sw, bw, borderA);        // 下
                bmp.fillRect(dx, dy, bw, sh, borderA);                  // 左
                bmp.fillRect(dx + sw - bw, dy, bw, sh, borderA);        // 右
            }
        }

        // 蓝色事件碰撞：子格填充 + 矩形填充共用（裁剪到地图位图范围内）
        function drawBlueRect(rx, ry, rw, rh) {
            var x1 = Math.max(0, Math.round(rx));
            var y1 = Math.max(0, Math.round(ry));
            var x2 = Math.min(bmp.width, Math.round(rx) + Math.max(1, Math.round(rw)));
            var y2 = Math.min(bmp.height, Math.round(ry) + Math.max(1, Math.round(rh)));
            if (x2 <= x1 || y2 <= y1) return;
            bmp.fillRect(x1, y1, x2 - x1, y2 - y1, blueFillA);
            if (CFG.showBorder) {
                var bw = Math.min(2, x2 - x1, y2 - y1);
                bmp.fillRect(x1, y1, x2 - x1, bw, blueBorderA);                  // 上
                bmp.fillRect(x1, y2 - bw, x2 - x1, bw, blueBorderA);             // 下
                bmp.fillRect(x1, y1, bw, y2 - y1, blueBorderA);                  // 左
                bmp.fillRect(x2 - bw, y1, bw, y2 - y1, blueBorderA);             // 右
            }
        }

        function drawBlueCell(dx, dy) {
            drawBlueRect(dx, dy, sw, sh);
        }

        if (CFG.intuitive) {
            // 直觉模式（设计视角）：直接读每格 Region，红块画在「刷 Region 的那一格」对应象限。
            // 此模式反映你的设计意图，不受 HalfMove 内部 Math.ceil(floatY) 坐标约定的反向偏移影响。
            // 注意：仅展示 Region 类半格封锁；Hendrix 刷漆阻挡格 / GF 碰撞层不在此模式绘制。
            for (var iy = 0; iy < h; iy++) {
                for (var ix = 0; ix < w; ix++) {
                    var rid = gm.regionId(ix, iy);
                    if (!rid) continue;
                    var type = ID_TO_TYPE[rid];
                    if (!type) continue;
                    var cells = quadrantCells(type, sub);
                    for (var c = 0; c < cells.length; c++) {
                        var sx = cells[c][0], sy = cells[c][1];
                        var dx = Math.round((ix + sx * unit) * tw);
                        var dy = Math.round((iy + sy * unit) * th);
                        drawCell(dx, dy);
                    }
                }
            }
        } else {
            // 碰撞视角（默认）：忠实引擎，调用 isPassableByHalfRegionAndTag 探测实际被挡子格。
            for (var iy = 0; iy < h; iy++) {
                for (var ix = 0; ix < w; ix++) {
                    for (var sy = 0; sy < sub; sy++) {
                        for (var sx = 0; sx < sub; sx++) {
                            // 探测坐标：HalfMove 的 isPassableByHalfRegionAndTag 内部用
                            // y = Math.ceil(floatY) 取 Region，因此下半格探针读「下方一格」，
                            // 上半格探针读「本格」——这正是引擎真实被挡位置（与直觉相反）。
                            var probeX = ix + sx * unit;
                            var probeY = iy + sy * unit;
                            if (isSubTilePassable(probeX, probeY)) continue; // 可通行 -> 不画

                            // 绘制坐标：子格真实左下角（地图像素空间）
                            var dx = Math.round((ix + sx * unit) * tw);
                            var dy = Math.round((iy + sy * unit) * th);
                            drawCell(dx, dy);
                        }
                    }
                }
            }
        }
        // 事件碰撞预览（蓝色）
        if (CFG.showEventCollision) {
            var eventIntuitive = CFG.eventMode === 'intuitive' ||
                (CFG.eventMode === 'follow' && CFG.intuitive);
            if (eventIntuitive) {
                // 直觉模式：画事件配置的碰撞矩形（默认 1 格下半部分，可被备注扩展）
                var events = gm.events();
                for (var ei = 0; ei < events.length; ei++) {
                    var ev = events[ei];
                    if (!ev || ev._erased) continue;
                    if (typeof ev.page === 'function' && !ev.page()) continue;
                    if (ev.isThrough()) continue;
                    if (!ev.isNormalPriority()) continue;
                    var rects = getEventFootprintRects(ev, tw, th);
                    for (var ri = 0; ri < rects.length; ri++) {
                        drawBlueRect(rects[ri].x, rects[ri].y, rects[ri].width, rects[ri].height);
                    }
                }
            } else {
                // 碰撞视角：逐半格探测事件实际阻挡位置
                // 子格探测坐标换算成角色逻辑坐标：角色脚底在该子格底部中心。
                for (var iy2 = 0; iy2 < h; iy2++) {
                    for (var ix2 = 0; ix2 < w; ix2++) {
                        for (var sy2 = 0; sy2 < sub; sy2++) {
                            for (var sx2 = 0; sx2 < sub; sx2++) {
                                var charX2 = ix2 + sx2 * unit + (unit / 2 - 0.5);
                                var charY2 = iy2 + sy2 * unit + (unit - 1);
                                if (!isEventBlockedAt(charX2, charY2)) continue;
                                var dx2 = Math.round((ix2 + sx2 * unit) * tw);
                                var dy2 = Math.round((iy2 + sy2 * unit) * th);
                                drawBlueCell(dx2, dy2);
                            }
                        }
                    }
                }
            }
        }


        // 对齐网格：48x48 白色细线，绘制在红块之上，方便对齐参考
        if (CFG.showGrid) {
            var gs = CFG.gridSize > 0 ? CFG.gridSize : 48;
            var gA = 'rgba(255,255,255,' + (CFG.gridAlpha / 255) + ')';
            var totalW = Math.max(1, w * tw);
            var totalH = Math.max(1, h * th);
            var x = 0;
            for (; x <= totalW; x += gs) {
                bmp.fillRect(x, 0, 1, totalH, gA); // 竖线
            }
            var y = 0;
            for (; y <= totalH; y += gs) {
                bmp.fillRect(0, y, totalW, 1, gA); // 横线
            }
        }
        return bmp;
    }

    //=========================================================================
    // 公开脚本接口 / Public API
    //=========================================================================

    //=========================================================================
    // Hendrix 兼容辅助 / Hendrix compatibility helper
    //=========================================================================
    // Hendrix 的同地图热重载会走“复用旧 chip 精灵”分支：新场景 onMapLoaded 时，
    // 旧 Spriteset_Map.destroy 还没执行，chip 仍挂在旧 _tilemap 上，导致 reattach
    // 判断 !sprite.parent 失败而无法接管。这里在重载前先把旧 chip 摘下（不销毁），
    // 让新场景能正常重新挂载。
    function detachHendrixChipsFromTilemap(tilemap) {
        if (!tilemap) {
            return;
        }
        var children = tilemap.children.slice();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child && child._chipZ !== undefined && child.parent === tilemap) {
                tilemap.removeChild(child);
            }
        }
    }

    function detachHendrixChipsForReload() {
        if (!Imported.Hendrix_Realtime_Parallax_Map_Builder) {
            return;
        }
        var scene = SceneManager._scene;
        if (!(scene instanceof Scene_Map) || !scene._spriteset) {
            return;
        }
        detachHendrixChipsFromTilemap(scene._spriteset._tilemap);
    }

    function detachHendrixChipsFromPreviousScene() {
        if (!Imported.Hendrix_Realtime_Parallax_Map_Builder) {
            return;
        }
        var prev = SceneManager._previousScene;
        if (!(prev instanceof Scene_Map) || !prev._spriteset) {
            return;
        }
        detachHendrixChipsFromTilemap(prev._spriteset._tilemap);
    }

    WSQ.CD.reloadMap = function () {
        // 完整重载当前地图：使用 RMMZ 原生的同地图传送 + requestMapReload，
        // 触发 Scene_Map 重建，从而重新读取 data/MapXXX.json 并刷新事件/图块/Region。
        if (!$gameMap || !$gamePlayer || $gamePlayer.isTransferring()) {
            return false;
        }
        if (!$gamePlayer.canMove()) {
            return false;
        }
        // 先摘下 Hendrix 旧 chip，供新场景的“同地图复用”分支重新挂载；
        // 其后再置位 requestMapReload，避免 Keke 的同地图 fadeType 2 直传优化吞掉重载。
        detachHendrixChipsForReload();
        $gamePlayer.requestMapReload();
        $gamePlayer.reserveTransfer(
            $gameMap.mapId(),
            $gamePlayer.x,
            $gamePlayer.y,
            $gamePlayer.direction(),
            2
        );
        return true;
    };

    function applyToggle(reloadOnShow) {
        var turningOn = !WSQ.CD._enabled;
        if (turningOn) {
            WSQ.CD._enabled = true;
            if (reloadOnShow && WSQ.CD.reloadMap()) {
                // 已请求完整地图重载，新场景的 Spriteset 会自动按新数据重建叠加层
                WSQ.CD._forceRebuild = false;
            } else {
                // 未触发重载或重载条件不满足：退回当前内存数据重绘
                WSQ.CD._forceRebuild = true;
            }
        } else {
            WSQ.CD._enabled = false;
            WSQ.CD._forceRebuild = true;
        }
        return turningOn;
    }

    WSQ.CD.setVisible = function (v) {
        WSQ.CD._enabled = !!v;
        WSQ.CD._forceRebuild = true;
    };
    WSQ.CD.toggle = function () {
        applyToggle(CFG.reloadOnShow);
    };
    WSQ.CD.isVisible = function () {
        return WSQ.CD._enabled;
    };
    WSQ.CD.rebuild = function () {
        WSQ.CD._forceRebuild = true;
    };

    //=========================================================================
    // 插件指令 / Plugin Command
    //=========================================================================
    PluginManager.registerCommand(WSQ.CD.pluginName, 'RebuildCollision', function () {
        WSQ.CD._forceRebuild = true;
    });

    //=========================================================================
    // 叠加层：挂载于 Spriteset_Map 之上
    //=========================================================================
    var _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function () {
        _Spriteset_Map_createLowerLayer.call(this);
        this._wsqCDSprite = new Sprite();
        this._wsqCDSprite.visible = false;
        this._wsqCDBuiltMapId = 0; // 强制首帧重建
        this.addChild(this._wsqCDSprite); // 置于最上层（调试叠加层，清晰可见）
    };

    var _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function () {
        _Spriteset_Map_update.call(this);
        WSQ_CD_onUpdate(this);
    };

    var _Spriteset_Map_destroy = Spriteset_Map.prototype.destroy;
    Spriteset_Map.prototype.destroy = function (options) {
        if (this._wsqCDSprite && this._wsqCDSprite.bitmap) {
            this._wsqCDSprite.bitmap.destroy();
            this._wsqCDSprite.bitmap = null;
        }
        this._wsqCDSprite = null;
        _Spriteset_Map_destroy.call(this, options);
    };

    //=========================================================================
    // Scene_Map 兼容补丁：提前摘下上一场景的 Hendrix chip
    //=========================================================================
    // 新 Scene_Map 的 onMapLoaded 会先于旧 Spriteset_Map.destroy 执行，
    // 导致 Hendrix 的同地图“复用旧 chip”分支看不到已脱离父节点的 chip。
    // 这里在调用 Hendrix 的 onMapLoaded 前，先把上一场景的 Hendrix chip 摘下。
    var _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function () {
        detachHendrixChipsFromPreviousScene();
        _Scene_Map_onMapLoaded.call(this);
    };

    function WSQ_CD_onUpdate(spriteset) {
        // 测试模式守卫
        if (CFG.testOnly && !Utils.isOptionValid('test')) {
            if (spriteset._wsqCDSprite) spriteset._wsqCDSprite.visible = false;
            return;
        }

        // 切换按键
        if (Input.isTriggered('wsQCollisionToggle')) {
            var turningOn = applyToggle(CFG.reloadOnShow);
            if (typeof console !== 'undefined' && console.log) {
                console.log(WSQ.CD.pluginName + '：碰撞显示 ' + (turningOn ? '开' : '关') +
                    (turningOn && CFG.reloadOnShow ? '（完整重载地图）' : ''));
            }
        }

        var sprite = spriteset._wsqCDSprite;
        if (!sprite) return;

        if (!WSQ.CD._enabled) {
            sprite.visible = false;
            return;
        }

        // 需要（重新）构建？地图切换 / 强制重建 / 尚未构建
        var needBuild = WSQ.CD._forceRebuild ||
            !sprite.bitmap ||
            spriteset._wsqCDBuiltMapId !== $gameMap.mapId();

        if (needBuild) {
            if (sprite.bitmap) {
                sprite.bitmap.destroy();
                sprite.bitmap = null;
            }
            var bmp = buildOverlayBitmap();
            if (bmp) {
                sprite.bitmap = bmp;
                spriteset._wsqCDBuiltMapId = $gameMap.mapId();
            }
            WSQ.CD._forceRebuild = false;
        }

        // 每帧跟随相机平移（场景缩放由父级 SceneManager._scene 统一处理）
        if (sprite.bitmap) {
            var tw = $gameMap.tileWidth();
            var th = $gameMap.tileHeight();
            sprite.x = -$gameMap.displayX() * tw;
            sprite.y = -$gameMap.displayY() * th;
            sprite.visible = true;
        } else {
            sprite.visible = false;
        }
    }

})();
