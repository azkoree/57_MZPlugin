//=============================================================================
// 57_MoveLikeArcade.js
//=============================================================================

var Imported = Imported || {};
Imported['57_MoveLikeArcade'] = true;

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.00] 街机式移动模式 - 上下移动保持朝向，左右移动改变朝向
 * @author Codex
 * @url
 * @help
 * ============================================================================
 * 介绍
 * ============================================================================
 * 让角色的行走图运作模式变为街机清版格斗游戏风格：
 * - 只有左右移动时才会改变行走图的方向
 * - 上下移动会保持行走图方向不变（维持上一次左右移动的方向）
 * - 上下移动速度会比左右移动慢（可调节比例）
 * - 不影响事件触发，所有方向均可与事件交互
 * - 支持八方向/像素移动，对角移动时左右键可正常改变朝向
 *
 * ============================================================================
 * 与旧版插件的区别
 * ============================================================================
 * 旧版插件通常直接阻止 setDirection() 在上下移动时生效，
 * 导致角色的「逻辑方向」卡死在左/右。
 *
 * 这意味着按下决定键时，系统只检查角色左/右两侧的事件，
 * 而上方或下方的事件无法触发。
 *
 * 本插件通过分离「视觉方向」与「逻辑方向」解决此问题：
 * - 视觉方向（决定行走图画面的行）只在左右移动时改变
 * - 逻辑方向（决定按决定键时检查哪个方向的格子）正常更新
 * - 因此按决定键时上/下/左/右的事件都可以正常触发
 *
 * ============================================================================
 * 使用说明
 * ============================================================================
 * 1. 将此插件放入插件管理器
 * 2. 在插件参数中调整"上下移动速度比例"
 *    数值范围 0.10 ~ 1.00
 *    1.00 = 上下移动和左右一样快
 *    0.75 = 上下移动速度为左右的 75%
 *    建议值：0.75 ~ 0.85
 *
 * ============================================================================
 * 注意事项
 * ============================================================================
 * - 本插件只影响玩家的直接操作移动
 * - 事件指令的"移动路线"不受影响
 * - 传送后角色会面朝传送设定的方向，之后再进入街机模式
 * - 存档/读档正常，读档后会恢复存盘时的视觉方向状态
 * - 配合八方向/像素移动插件使用时，对角移动会以正常速度进行（不受上下减速影响）
 *
 * @param verticalSpeedRatio
 * @text 上下移动速度比例
 * @desc 上下移动速度相对于左右移动的比例（1.0=相同，0.5=一半）
 * @type number
 * @min 0.1
 * @max 1.0
 * @default 0.75
 * @decimals 2
 */
//=============================================================================

(() => {
    "use strict";

    const parameters = PluginManager.parameters("57_MoveLikeArcade");
    const verticalSpeedRatio = Number(parameters["verticalSpeedRatio"] || 0.75);

    //=========================================================================
    // Game_Player —— 分离视觉方向与逻辑方向
    //=========================================================================

    // 初始化时添加视觉方向属性
    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function () {
        _Game_Player_initMembers.call(this);
        this._visualDirection = this._direction || 6;
    };

    // setDirection 时只对左右方向更新视觉方向
    const _Game_Player_setDirection = Game_Player.prototype.setDirection;
    Game_Player.prototype.setDirection = function (d) {
        _Game_Player_setDirection.call(this, d);
        if (d === 4 || d === 6) {
            this._visualDirection = d;
        }
    };

    // 标记是否为垂直移动（用于后续速度控制）
    const _Game_Player_moveStraight = Game_Player.prototype.moveStraight;
    Game_Player.prototype.moveStraight = function (d) {
        this._isVerticalMove = d === 2 || d === 8;
        _Game_Player_moveStraight.call(this, d);
    };

    // 对角移动时始终用水平分量更新视觉方向（兼容传统 moveDiagonally 调用）
    const _Game_Player_moveDiagonally = Game_Player.prototype.moveDiagonally;
    Game_Player.prototype.moveDiagonally = function (horz, vert) {
        _Game_Player_moveDiagonally.call(this, horz, vert);
        if (horz === 4 || horz === 6) {
            this._visualDirection = horz;
        }
        this._isVerticalMove = false;
    };

    // 拦截 executeMove（兼容 DotMoveSystem 等像素移动插件）
    const _Game_Player_executeMove = Game_Player.prototype.executeMove;
    Game_Player.prototype.executeMove = function (direction) {
        if (direction === 1 || direction === 7) {
            // 左下/左上：视觉方向向左
            this._visualDirection = 4;
            this._isVerticalMove = false;
        } else if (direction === 3 || direction === 9) {
            // 右下/右上：视觉方向向右
            this._visualDirection = 6;
            this._isVerticalMove = false;
        } else if (direction === 4 || direction === 6) {
            // 纯左右
            this._visualDirection = direction;
            this._isVerticalMove = false;
        } else if (direction === 2 || direction === 8) {
            // 纯上下——不改变视觉方向，只标记减速
            this._isVerticalMove = true;
        }
        _Game_Player_executeMove.call(this, direction);
    };

    // 地图传送后同步视觉方向，使角色初始朝向与传送设定一致
    const _Game_Player_performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function () {
        _Game_Player_performTransfer.call(this);
        this._visualDirection = this._direction;
    };

    //=========================================================================
    // Sprite_Character —— 玩家精灵使用视觉方向绘制
    //=========================================================================

    const _Sprite_Character_characterPatternY =
        Sprite_Character.prototype.characterPatternY;
    Sprite_Character.prototype.characterPatternY = function () {
        const character = this._character;
        if (character === $gamePlayer && character._visualDirection) {
            return (character._visualDirection - 2) / 2;
        }
        return _Sprite_Character_characterPatternY.call(this);
    };

    //=========================================================================
    // Speed Control —— 上下移动变慢
    //=========================================================================

    const _Game_CharacterBase_distancePerFrame =
        Game_CharacterBase.prototype.distancePerFrame;
    Game_CharacterBase.prototype.distancePerFrame = function () {
        if (this === $gamePlayer && this._isVerticalMove) {
            return _Game_CharacterBase_distancePerFrame.call(this) * verticalSpeedRatio;
        }
        return _Game_CharacterBase_distancePerFrame.call(this);
    };
})();
