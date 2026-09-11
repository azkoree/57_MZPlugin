//=============================================================================
// WSQ Plugins
// WSQ_HendrixAnimationMOGPatch.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc [v1.01]        补丁 - Hendrix_Animation_Solution 与 MOG_CharDustTrail 兼容
 * @author WSQ
 * @url https://afdian.net/a/ganfly
 *
 * @param DustAboveLayer
 * @text 尘土显示层级（Hendrix Priority）
 * @desc 设置尘土显示在 Hendrix 哪个优先级层之上。取值范围 1~8；层 4 为普通地面/视差层。尘土 z 会设为该层 z + 0.5。
 * @type number
 * @min 1
 * @max 8
 * @default 4
 *
 * @help
 * =============================================================================
 * 介绍
 * =============================================================================
 * 解决 Hendrix_Animation_Solution 与 MOG_CharDustTrail 同时使用时，
 * MOG_CharDustTrail 的尘土效果不触发的问题。
 *
 * 根因：
 * Hendrix_Animation_Solution 覆盖了 Game_Character.prototype.update，
 * 并且它内部保存的是 MOG_CharDustTrail 加载之前的旧 Game_CharacterBase.update。
 * 因此 MOG 之后挂到 Game_CharacterBase.prototype.update 上的 _pposX/_pposY
 * 刷新与 updateDusTrail() 调用被绕过，尘土精灵永远不会开始动画。
 *
 * 本补丁在 Game_Character.prototype.update 这一层重新补上 MOG 的触发逻辑：
 *   1. 先记录本帧移动前的 _pposX/_pposY；
 *   2. 继续调用现有的 Game_Character.prototype.update（保留 Hendrix_Animation 等逻辑）；
 *   3. 再调用 canUpdateDustTrail() / updateDusTrail()，让 MOG 尘土正常触发。
 *
 * 不会重复调用核心移动更新，因此不会导致移动/动画双步进。
 *
 * =============================================================================
 * 额外兼容：Hendrix_Realtime_Parallax 图层遮挡
 * =============================================================================
 * Hendrix 视差图层也是 _tilemap 的子节点，并按 priority 映射 z：
 *
 *   priority 1  -> z = -2
 *   priority 2  -> z = -1
 *   priority 3  -> z = 0.5
 *   priority 4  -> z = 1
 *   priority 5  -> z = 4
 *   priority 6  -> z = 6
 *   priority 7  -> z = 8
 *   priority 8  -> z = 10
 *
 * MOG 尘土原本固定 z = 0，因此当 Hendrix 地面/视差层为层 4（z = 1）时，
 * 尘土会被盖在下面。本插件通过“尘土显示层级”参数，把尘土容器的 z 设成
 * 目标层 z + 0.5，使其显示在该层之上。
 *
 * 示例：
 * - 地图地面层是 Hendrix 层 4：参数填 4，尘土会显示在层 4 之上。
 * - 地图地面层是 Hendrix 层 2：参数填 2，尘土会显示在层 2 之上。
 *
 * =============================================================================
 * 前置需求
 * =============================================================================
 * - Hendrix_Animation_Solution
 * - MOG_CharDustTrail
 * - Hendrix_Realtime_Parallax_Map_Builder（若需要调整图层遮挡层）
 *
 * 加载顺序：
 *   1. Hendrix_Animation_Solution
 *   2. MOG_CharDustTrail
 *   3. Hendrix_Realtime_Parallax_Map_Builder
 *   4. WSQ_HendrixAnimationMOGPatch
 *
 * =============================================================================
 * 兼容性
 * =============================================================================
 * 只覆盖 Game_Character.prototype.update，并只调整
 * CharDustTrailSprites 的 z 值，不会修改 Hendrix 或 MOG 插件本体。
 *
 */

//=============================================================================
// ** 插件注册与参数
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_HendrixAnimationMOGPatch = true;

var WSQ = WSQ || {};
WSQ.HAMP = WSQ.HAMP || {};
WSQ.HAMP.version = 1.01;
WSQ.HAMP.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

WSQ.HAMP.parameters = PluginManager.parameters('WSQ_HendrixAnimationMOGPatch');
WSQ.HAMP.dustAboveLayer = Number(WSQ.HAMP.parameters['DustAboveLayer'] || 4);

// Hendrix priority -> z 映射（与 Hendrix_Realtime_Parallax_Map_Builder 一致）
WSQ.HAMP.priorityToZ = WSQ.HAMP.priorityToZ || {
    1: -2,
    2: -1,
    3: 0.5,
    4: 1,
    5: 4,
    6: 6,
    7: 8,
    8: 10
};

WSQ.HAMP.dustZ = function () {
    var baseZ = WSQ.HAMP.priorityToZ[WSQ.HAMP.dustAboveLayer];
    if (baseZ === undefined) {
        baseZ = 1;
    }
    return baseZ + 0.5;
}();

//=============================================================================
// ** 兼容补丁：Game_Character.prototype.update
//=============================================================================

(function () {

    if (!Imported.MOG_CharDustEffect || !Imported.Hendrix_Animation_Solution) {
        return;
    }

    var _WSQ_HAMP_GameCharacterUpdate = Game_Character.prototype.update;

    Game_Character.prototype.update = function () {
        // MOG 需要本帧移动前的实时坐标来判定“是否刚离开上一步”。
        this._pposX = Math.round(this._realX);
        this._pposY = Math.round(this._realY);

        // 继续走 Hendrix_Animation 的 Game_Character.prototype.update，
        // 不要在下面重复调用 Game_CharacterBase.update，避免核心移动更新执行两次。
        _WSQ_HAMP_GameCharacterUpdate.apply(this, arguments);

        // 补上原本被 Hendrix_Animation 绕过的 MOG 尘土触发逻辑。
        if (this.canUpdateDustTrail()) {
            this.updateDusTrail();
        }
    };

})();

//=============================================================================
// ** 兼容补丁：调整尘土容器 z，避免被 Hendrix 视差层遮挡
//=============================================================================

(function () {

    if (!Imported.MOG_CharDustEffect || !CharDustTrailSprites) {
        return;
    }

    var _WSQ_HAMP_InitialSetup = CharDustTrailSprites.prototype.initialSetup;

    CharDustTrailSprites.prototype.initialSetup = function (sprite, id) {
        _WSQ_HAMP_InitialSetup.call(this, sprite, id);
        this.z = WSQ.HAMP.dustZ;
    };

})();
