//=============================================================================
// 57_FollowerTarget.js
//=============================================================================

var Imported = Imported || {};
Imported['57_FollowerTarget'] = true;

//=============================================================================
/*:
 * @target MZ
 * @plugindesc v1.3.0  跟随者移动路线 - 对跟随者设置移动路线
 * @author 57 & deepseek
 *
 * @orderAfter DotMoveSystem
 * @orderAfter GF_2_CoreOfMapEvent
 *
 * @help
 * ============================================================================
 *  简介
 * ============================================================================
 *
 * 本插件使得你可以将跟随者（队伍中的队员）作为"设置移动路线"
 * 等事件命令的目标，并在移动期间阻止跟随者被 DotMoveSystem
 * 自动吸附回玩家。
 *
 * ============================================================================
 *  使用方法
 * ============================================================================
 *
 * 1. 执行插件指令「跟随者: 切换目标」→ 选择跟随者编号（如 0）
 * 2. 使用「设置移动路线」→ 目标选「本事件」→ 编辑路线
 * 3. 跟随者将执行该移动路线，且不会被吸附回主角
 * 4. （可选）执行「跟随者: 重置目标」恢复默认
 *
 * 也适用于「显示动画」「显示气泡」「设置事件位置」等命令。
 *
 * 如不需要移动路线，只是想让跟随者原地停住：
 *   ◆插件指令：跟随者: 停止跟随 [0]
 *   ◆插件指令：跟随者: 恢复跟随 [0]
 *
 * 如果是通过"设置移动路线"给跟随者设了路线，当路线执行完毕
 * 后跟随者会自动恢复追踪，无需手动恢复。
 *
 * ============================================================================
 *  移动路线脚本
 * ============================================================================
 *
 * 在跟随者的移动路线中使用：
 *   this.chasePreceding()
 *     让跟随者向它前面的角色移动（恢复默认追踪行为）
 *
 * ============================================================================
 *  兼容性
 * ============================================================================
 *
 * - DotMoveSystem: 完全兼容。执行强制移动路线时自动跳过 chaseCharacter。
 * - GF_2_CoreOfMapEvent: 无冲突。
 *
 * @command ChangeFollowerTarget
 * @text 跟随者: 切换目标
 * @desc 将"本事件"重定向到指定跟随者。后续的移动路线等命令将作用于该跟随者。
 *
 * @arg FollowerIndex
 * @text 跟随者编号
 * @desc 0=第一队员, 1=第二, ... -1可切换回玩家。如需重置请使用"重置目标"指令。
 * @type combo
 * @option 0
 * @option 1
 * @option 2
 * @option 3
 * @option -1
 * @default 0
 *
 * @command ResetFollowerTarget
 * @text 跟随者: 重置目标
 * @desc 取消目标切换，恢复"本事件"的默认行为。
 *
 * @command StopFollow
 * @text 跟随者: 停止跟随
 * @desc 让指定跟随者停止追踪前面的角色（原地停下）。
 *
 * @arg FollowerIndex
 * @text 跟随者编号
 * @desc 要停止追踪的跟随者编号。
 * @type combo
 * @option 0
 * @option 1
 * @option 2
 * @option 3
 * @default 0
 *
 * @command ResumeFollow
 * @text 跟随者: 恢复跟随
 * @desc 让指定跟随者恢复追踪前面的角色。
 *
 * @arg FollowerIndex
 * @text 跟随者编号
 * @desc 要恢复追踪的跟随者编号。
 * @type combo
 * @option 0
 * @option 1
 * @option 2
 * @option 3
 * @default 0
 */
//=============================================================================

(() => {
    "use strict";

    const PLUGIN_NAME = document.currentScript
        ? decodeURIComponent(document.currentScript.src.match(/^.*\/(.+)\.js$/)[1])
        : "57_FollowerTarget";

    // =========================================================================
    // Plugin Command Registration
    // =========================================================================

    PluginManager.registerCommand(PLUGIN_NAME, "ChangeFollowerTarget", function(args) {
        const rawValue = args.FollowerIndex;
        if (rawValue === "" || rawValue === undefined || rawValue === null) {
            this._followerTargetId = null;
        } else {
            const followerIndex = Number(rawValue);
            if (isNaN(followerIndex)) {
                this._followerTargetId = null;
            } else if (followerIndex === -1) {
                this._followerTargetId = -1;
            } else if (followerIndex >= 0) {
                this._followerTargetId = -(followerIndex + 2);
            } else {
                this._followerTargetId = null;
            }
        }
    });

    PluginManager.registerCommand(PLUGIN_NAME, "ResetFollowerTarget", function() {
        this._followerTargetId = null;
    });

    PluginManager.registerCommand(PLUGIN_NAME, "StopFollow", function(args) {
        const idx = Number(args.FollowerIndex);
        const follower = $gamePlayer.followers().follower(idx);
        if (follower) {
            follower._stopChase = true;
        }
    });

    PluginManager.registerCommand(PLUGIN_NAME, "ResumeFollow", function(args) {
        const idx = Number(args.FollowerIndex);
        const follower = $gamePlayer.followers().follower(idx);
        if (follower) {
            follower._stopChase = false;
        }
    });

    // =========================================================================
    // Game_Interpreter - character() override
    // 当命令目标是"本事件"且已设置目标切换时，重定向到跟随者
    //
    // ID 编码：
    //   -1  = 玩家
    //    0  = 本事件
    //   >0  = 地图事件
    //   -2  = 跟随者 0（第一队员）
    //   -3  = 跟随者 1（第二队员）
    //   ...
    // =========================================================================

    const _Game_Interpreter_character = Game_Interpreter.prototype.character;
    Game_Interpreter.prototype.character = function(param) {
        if (param === 0 && this._followerTargetId != null) {
            param = this._followerTargetId;
        }

        if (param <= -2) {
            if ($gameParty.inBattle()) return null;
            const followerIndex = Math.abs(param) - 2;
            return $gamePlayer.followers().follower(followerIndex) || null;
        }

        return _Game_Interpreter_character.call(this, param);
    };

    // =========================================================================
    // Game_Interpreter - terminate() 清理
    // =========================================================================

    const _Game_Interpreter_terminate = Game_Interpreter.prototype.terminate;
    Game_Interpreter.prototype.terminate = function() {
        this._followerTargetId = null;
        _Game_Interpreter_terminate.apply(this, arguments);
    };

    // =========================================================================
    // Game_Follower - chaseCharacter() override
    // 正在执行强制移动路线、或被手动停止追踪时，跳过自动追踪
    // =========================================================================

    const _Game_Follower_chaseCharacter = Game_Follower.prototype.chaseCharacter;
    Game_Follower.prototype.chaseCharacter = function(character) {
        // 自己正在执行强制路线 → 不追踪
        if (this.isMoveRouteForcing()) return;
        // 被手动停止 → 不追踪
        if (this._stopChase) return;
        // 前面的角色正在执行强制路线 → 不追踪（避免连锁跟随）
        if (character && character.isMoveRouteForcing && character.isMoveRouteForcing()) return;
        _Game_Follower_chaseCharacter.call(this, character);
    };

    // =========================================================================
    // Game_Follower - chasePreceding()
    // 在跟随者的移动路线脚本中使用，恢复默认追踪行为
    // =========================================================================

    Game_Follower.prototype.chasePreceding = function() {
        const followers = $gamePlayer.followers();
        if (!followers) return;
        const data = followers.data();
        const index = data.indexOf(this);
        const preceding = index > 0 ? followers.follower(index - 1) : $gamePlayer;
        if (preceding && this.moveTowardCharacter) {
            this.moveTowardCharacter(preceding);
        }
    };

})();
