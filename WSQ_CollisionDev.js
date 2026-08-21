//=============================================================================
// GF Plugins
// WSQ_CollisionDev.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc [v1.00] 工具 - 地图碰撞可视化（半透明红块显示不可通行区域，读取 HalfMove 半格/四分之一格 Region 设置）
 * @author 五十七
 * @url 
 *
 * @base HalfMove
 * @base Hendrix_Realtime_Parallax_Map_Builder
 * @base Keke_FreeCamera
 * @orderAfter HalfMove
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
 * @desc 是否为红块加描边，便于辨识边界。
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
 * @desc 开启后，红块直接画在你「刷 Region 的那一格」的对应半格/象限（设计视角），不再受
 *        HalfMove 内部 Math.ceil 坐标约定影响；关闭则为引擎真实被挡位置（碰撞视角）。
 * @default false
 *
 * @help
 * ============================================================================
 *  介绍 / Introduction
 * ============================================================================
 *  本插件是一个调试辅助工具。在测试游戏（test 模式）时，按下指定按键即可在
 *  地图上以半透明红色叠加层显示「无法通行的地方」。
 *
 *  它与 HalfMove 插件深度协作：直接调用 HalfMove 提供的
 *  Game_Map.prototype.isPassableByHalfRegionAndTag 方法，对每一格的四个半格
 *  （上/下/左/右/四角）子区域逐一探测，从而精确显示对应半格 / 四分之一格的
 *  不可通行区域，而非整格。
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
 *    强制重新生成叠加层。当你在编辑器里改了 Region / 半格设置后，可用它即时刷新，
 *    无需关闭再打开显示。
 *
 * ============================================================================
 *  备注 / Notetags
 * ============================================================================
 *  无。
 *
 * ============================================================================
 *  脚本接口 / Script Interface
 * ============================================================================
 *  • WSQ.CD.setVisible(bool)              —— 以代码方式开关叠加层
 *  • WSQ.CD.toggle()                      —— 切换叠加层显隐
 *  • WSQ.CD.rebuild()                     —— 强制重建当前地图的叠加层
 *  • WSQ.CD.isVisible()                   —— 返回当前是否显示
 *
 * ============================================================================
 *  两种绘制模式 / Two Render Modes
 * ============================================================================
 *  • 碰撞视角（默认，直觉绘制模式 = 关）：红块出现在「玩家实际无法通行的位置」。
 *    由于 HalfMove 内部用 Math.ceil(floatY) 取 Region，上/下、四角会偏移一格，
 *    红块与真实走位完全一致，但和"在哪格刷 Region"看起来相反。
 *  • 直觉绘制模式（开）：红块直接画在「你刷 Region 的那一格」的对应半格/象限，
 *    便于按图索骥摆地形。此模式仅展示 Region 类封锁，不绘制 Hendrix 刷漆阻挡
 *    格与 GF 碰撞层。
 *
 * ============================================================================
 *  版本 / Version
 * ============================================================================
 *  v1.01 (2026-08-21) 新增「直觉绘制模式」开关：红块画在刷 Region 的那一格对应
 *                      象限（设计视角），不再受 HalfMove 的 ceil 坐标约定影响。
 *  v1.00 (2026-08-21) 初版：按键切换、半格/四分之一格 Region 不可通行检测、
 *                           半透明红色叠加层、Hendrix / Keke 缩放与相机适配。
 * ============================================================================
 */

/*:ja
 * @target MZ
 * @plugindesc [v1.00] ツール - マップ衝突可視化（HalfMove の半マス/4分の1マス Region を読み取り、通行不可領域を半透明赤で表示）
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
    WSQ.CD.version = 1.01;
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
        opacity: Math.max(0, Math.min(255, Number(params['红色透明度'] || 110))),
        showBorder: String(params['显示边框'] || 'false') === 'true',
        borderOpacity: Math.max(0, Math.min(255, Number(params['边框透明度'] || 220))),
        showGrid: String(params['显示网格'] || 'true') === 'true',
        gridSize: 48,
        gridAlpha: Math.max(0, Math.min(255, Number(params['网格透明度'] || 140))),
        intuitive: String(params['直觉绘制模式'] || 'false') === 'true',
        red: 255, green: 48, blue: 48
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
    WSQ.CD.setVisible = function (v) {
        WSQ.CD._enabled = !!v;
        WSQ.CD._forceRebuild = true;
    };
    WSQ.CD.toggle = function () {
        WSQ.CD._enabled = !WSQ.CD._enabled;
        WSQ.CD._forceRebuild = true;
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

    function WSQ_CD_onUpdate(spriteset) {
        // 测试模式守卫
        if (CFG.testOnly && !Utils.isOptionValid('test')) {
            if (spriteset._wsqCDSprite) spriteset._wsqCDSprite.visible = false;
            return;
        }

        // 切换按键
        if (Input.isTriggered('wsQCollisionToggle')) {
            WSQ.CD._enabled = !WSQ.CD._enabled;
            WSQ.CD._forceRebuild = true;
            if (typeof console !== 'undefined' && console.log) {
                console.log(WSQ.CD.pluginName + '：碰撞显示 ' + (WSQ.CD._enabled ? '开' : '关'));
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
