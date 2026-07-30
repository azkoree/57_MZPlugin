//=============================================================================
// SVBattlerAdvance_AddState.js
//=============================================================================

var Imported = Imported || {};
Imported.SVBattlerAdvance_AddState = true;

var GF = GF || {};
GF.ADSV = GF.ADSV || {};
GF.ADSV.AddState = GF.ADSV.AddState || {};
GF.ADSV.AddState.version = 1.03;

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.03] SVBattlerAdvance扩展 - 状态绑定动作
 * @author 57 & deepseek
 * @url
 * @orderAfter SVBattlerAdvance
 * @orderAfter GF_3_ActSeqSystem
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 *
 * SVBattlerAdvance 的扩展插件。
 * 允许将特定的 ADSV 精灵图动作绑定到状态上。
 * 当角色/敌人被附加该状态时自动切图，移除时自动恢复。
 *
 * ============================================================================
 *  使用方法
 * ============================================================================
 *
 * 1. 在数据库「状态」的备注栏填入：
 *
 *    <SVStatus: 动作名>
 *
 *    「动作名」必须在角色/敌人的 <adsv> 中已注册。
 *
 * 2. 在角色/敌人的 <adsv> 备注中注册该动作（格式与
 *    SVBattlerAdvance 完全一致）：
 *
 *    <adsv>
 *     动作名_帧数_帧速_播放模式;
 *    </adsv>
 *
 * 3. 对敌人同样适用：在敌人的备注中注册 <adsv>，
 *    在状态的备注中设置 <SVStatus: 动作名> 即可。
 *
 * ============================================================================
 *  多状态叠加
 * ============================================================================
 *
 * 当多个同时生效的状态都带有 <SVStatus> 时，以「状态 ID 最大」
 * 的那个为准（ID 越大优先级越高）。
 *
 * 移除高优先级状态后，自动回退到剩余状态中 ID 最大的动作。
 * 若剩余状态均无 <SVStatus> 标签，则恢复为默认待机动作。
 *
 * ============================================================================
 *  致命动作穿透
 * ============================================================================
 *
 * 以下动作即使 SVStatus 激活也会被放行（状态动画不可阻挡死亡/闪避等）：
 *   dead / dying / damage / evade / escape
 *
 * ============================================================================
 *  依赖
 * ============================================================================
 *
 * 需要以下插件，请按此顺序从上到下排列：
 *
 *   GF_2_CoreOfBattle
 *   GF_2_CoreOfEnemy
 *   GF_3_ActSeqSystem
 *   SVBattlerAdvance
 *   SVBattlerAdvance_AddState（本插件）
 *
 * ============================================================================
 *
 * @param DefaultRevertMotion
 * @text 默认恢复动作
 * @type string
 * @desc 所有 SVStatus 状态被移除后恢复的动作名。
 * 留空则自动使用 battler 的待机动作（idleMotion 或 "wait"）。
 * @default
 *
 */

//=============================================================================
// 参数初始化
//=============================================================================

(function() {
    const pluginName = 'SVBattlerAdvance_AddState';
    const parameters = PluginManager.parameters(pluginName);
    const defaultRevertMotion = String(parameters['DefaultRevertMotion'] || '').trim();

    //=========================================================================
    // 状态备注解析
    //=========================================================================

    /**
     * 从状态的 note 中解析 <SVStatus: 动作名>
     * @param {string} note 状态的备注文本
     * @returns {string|null} 动作名，无标签时返回 null
     */
    function parseSVStatus(note) {
        if (!note) return null;
        const match = note.match(/<SVStatus:\s*(\S+)\s*>/i);
        return match ? match[1] : null;
    }

    /**
     * 查询指定状态 ID 绑定的动作名（带缓存）
     * @param {number} stateId
     * @returns {string|null}
     */
    function stateSVMotion(stateId) {
        if (!stateId) return null;
        const state = $dataStates[stateId];
        if (!state) return null;
        // 缓存到 state 对象上，避免重复解析
        if (state._svStatusMotion !== undefined) return state._svStatusMotion;
        state._svStatusMotion = parseSVStatus(state.note);
        return state._svStatusMotion;
    }

    //=========================================================================
    // Battler 辅助
    //=========================================================================

    function battlerHasAdsv(battler) {
        return battler && typeof battler.hasAdsv === 'function' && battler.hasAdsv();
    }

    function battlerHasMotionConfig(battler, motionName) {
        if (!battler || !motionName) return false;
        const config = battler.adsvConfig ? battler.adsvConfig() : null;
        return !!(config && config[motionName]);
    }

    /**
     * 获取 battler 当前生效状态中优先级最高的 SVStatus 状态
     * @param {Game_Battler} battler
     * @returns {object|null} 状态数据对象
     */
    function getTopSVStatusState(battler) {
        if (!battler) return null;
        const states = battler.states();
        if (!states || states.length === 0) return null;

        let topState = null;
        let topId = -1;

        for (const state of states) {
            const motion = stateSVMotion(state.id);
            if (motion && battlerHasMotionConfig(battler, motion)) {
                if (state.id > topId) {
                    topId = state.id;
                    topState = state;
                }
            }
        }

        return topState;
    }

    function getRevertMotion(battler) {
        if (defaultRevertMotion) return defaultRevertMotion;
        if (battler && typeof battler.idleMotion === 'function') {
            const idle = battler.idleMotion();
            if (idle) return idle;
        }
        return 'wait';
    }

    //=========================================================================
    // 查找 Sprite
    //=========================================================================

    function findSpriteForBattler(battler) {
        if (!battler) return null;
        const scene = SceneManager._scene;
        if (!scene) return null;
        const spriteset = scene._spriteset;
        if (!spriteset) return null;

        if (battler.isActor()) {
            const sprites = spriteset._actorSprites;
            if (sprites) {
                for (const sprite of sprites) {
                    if (sprite._actor === battler) return sprite;
                }
            }
        } else if (battler.isEnemy()) {
            const sprites = spriteset._enemySprites;
            if (sprites) {
                for (const sprite of sprites) {
                    if (sprite._enemy === battler) return sprite;
                }
            }
        }
        return null;
    }

    //=========================================================================
    // 应用 / 恢复 SVStatus 动作
    //=========================================================================

    function applySVStatusMotion(battler) {
        if (!battlerHasAdsv(battler)) return false;

        const state = getTopSVStatusState(battler);
        const motionName = state ? stateSVMotion(state.id) : null;

        if (motionName) {
            battler._svStatusActive = true;
            battler._svStatusMotion = motionName;

            // battler 层
            if (typeof battler.forceMotion === 'function') {
                battler.forceMotion(motionName);
            }
            // sprite 层（直接到位，避免跨帧延迟）
            const sprite = findSpriteForBattler(battler);
            if (sprite && typeof sprite.forceMotion === 'function') {
                sprite.forceMotion(motionName);
            }
            return true;
        }

        return false;
    }

    function revertSVStatusMotion(battler) {
        if (!battler._svStatusActive) return;
        battler._svStatusActive = false;
        battler._svStatusMotion = null;

        const revertMotion = getRevertMotion(battler);

        if (typeof battler.forceMotion === 'function') {
            battler.forceMotion(revertMotion);
        }
        const sprite = findSpriteForBattler(battler);
        if (sprite && typeof sprite.forceMotion === 'function') {
            sprite.forceMotion(revertMotion);
        }
    }

    function refreshSVStatusMotion(battler) {
        if (!battlerHasAdsv(battler)) return;

        const state = getTopSVStatusState(battler);
        if (state) {
            applySVStatusMotion(battler);
        } else if (battler._svStatusActive) {
            revertSVStatusMotion(battler);
        }
    }

    //=========================================================================
    // 挂钩 Game_Battler
    //=========================================================================

    // addState —— 附加状态时尝试应用 SVStatus 动作
    const _Game_Battler_addState_AS = Game_Battler.prototype.addState;
    Game_Battler.prototype.addState = function(stateId) {
        _Game_Battler_addState_AS.call(this, stateId);
        const motion = stateSVMotion(stateId);
        if (motion && battlerHasAdsv(this) && battlerHasMotionConfig(this, motion)) {
            applySVStatusMotion(this);
        }
    };

    // removeState —— 移除状态时刷新（回退或切换到下一个 SVStatus）
    const _Game_Battler_removeState_AS = Game_Battler.prototype.removeState;
    Game_Battler.prototype.removeState = function(stateId) {
        _Game_Battler_removeState_AS.call(this, stateId);
        if (battlerHasAdsv(this)) {
            refreshSVStatusMotion(this);
        }
    };

    // clearStates —— 清空所有状态时恢复
    const _Game_Battler_clearStates_AS = Game_Battler.prototype.clearStates;
    Game_Battler.prototype.clearStates = function() {
        _Game_Battler_clearStates_AS.call(this);
        if (battlerHasAdsv(this) && this._svStatusActive) {
            revertSVStatusMotion(this);
        }
    };

    // revive —— 复活后重新检查状态
    const _Game_Battler_revive_AS = Game_Battler.prototype.revive;
    Game_Battler.prototype.revive = function() {
        _Game_Battler_revive_AS.call(this);
        if (battlerHasAdsv(this)) {
            refreshSVStatusMotion(this);
        }
    };

    //=========================================================================
    // 挂钩 Sprite.startMotion —— 拦截器（防止 GF 入场序列等覆盖 SVStatus）
    //=========================================================================

    // 即使 SVStatus 激活也放行的致命动作
    const CRITICAL_MOTIONS = ['dead', 'dying', 'damage', 'evade', 'escape'];

    const _Sprite_Actor_startMotion_AS2 = Sprite_Actor.prototype.startMotion;
    Sprite_Actor.prototype.startMotion = function(motionType) {
        const battler = this._actor;
        if (battler && battler._svStatusActive && !this.__adsvGuard) {
            if (motionType !== battler._svStatusMotion && !CRITICAL_MOTIONS.includes(motionType)) {
                // 不调用原始 startMotion（它必定重置 _pattern=0）。
                // 改为直接修改 _motion 并更新 bitmap，保留动画进度。
                const svMotion = battler._svStatusMotion;
                // 确保动作已在 MOTIONS 中注册（自动注册缺失项）
                if (!Sprite_Actor.MOTIONS[svMotion]) {
                    let maxIdx = 0;
                    for (const k in Sprite_Actor.MOTIONS) {
                        if (Sprite_Actor.MOTIONS[k].index > maxIdx) maxIdx = Sprite_Actor.MOTIONS[k].index;
                    }
                    Sprite_Actor.MOTIONS[svMotion] = { index: maxIdx + 1, loop: true };
                }
                this.__adsvGuard = true;
                this._motion = Sprite_Actor.MOTIONS[svMotion];
                this._motionType = svMotion;
                GF.ADSV.handleMotionChange(this, svMotion);
                this.__adsvGuard = false;
                return;
            }
        }
        _Sprite_Actor_startMotion_AS2.call(this, motionType);
    };

    const _Sprite_Enemy_startMotion_AS2 = Sprite_Enemy.prototype.startMotion;
    Sprite_Enemy.prototype.startMotion = function(motionType) {
        const battler = this._enemy;
        if (battler && battler._svStatusActive && !this.__adsvGuard) {
            if (motionType !== battler._svStatusMotion && !CRITICAL_MOTIONS.includes(motionType)) {
                const svMotion = battler._svStatusMotion;
                if (!Sprite_Actor.MOTIONS[svMotion]) {
                    let maxIdx = 0;
                    for (const k in Sprite_Actor.MOTIONS) {
                        if (Sprite_Actor.MOTIONS[k].index > maxIdx) maxIdx = Sprite_Actor.MOTIONS[k].index;
                    }
                    Sprite_Actor.MOTIONS[svMotion] = { index: maxIdx + 1, loop: true };
                }
                this.__adsvGuard = true;
                this._motion = Sprite_Actor.MOTIONS[svMotion];
                this._motionType = svMotion;
                GF.ADSV.handleMotionChange(this, svMotion);
                this.__adsvGuard = false;
                return;
            }
        }
        _Sprite_Enemy_startMotion_AS2.call(this, motionType);
    };

    //=========================================================================
    // 挂钩 Sprite.updateBitmap —— 首次就绪时初始化自动状态
    //=========================================================================

    const _Sprite_Actor_updateBitmap_AS = Sprite_Actor.prototype.updateBitmap;
    Sprite_Actor.prototype.updateBitmap = function() {
        _Sprite_Actor_updateBitmap_AS.call(this);
        // 初次就绪时自动检查是否有 SVStatus 状态需要应用
        const battler = this._actor;
        if (battler && !this._svStatusInitDone && GF.ADSV.isAdsvActive(this)) {
            this._svStatusInitDone = true;
            refreshSVStatusMotion(battler);
        }
    };

    const _Sprite_Enemy_updateBitmap_AS = Sprite_Enemy.prototype.updateBitmap;
    Sprite_Enemy.prototype.updateBitmap = function() {
        _Sprite_Enemy_updateBitmap_AS.call(this);
        const battler = this._enemy;
        if (battler && !this._svStatusInitDone && GF.ADSV.isAdsvActive(this)) {
            this._svStatusInitDone = true;
            refreshSVStatusMotion(battler);
        }
    };

    //=========================================================================
    // 公开 API（供其他插件或行动序列脚本调用）
    //=========================================================================

    GF.ADSV.AddState.applyMotion   = applySVStatusMotion;
    GF.ADSV.AddState.revertMotion  = revertSVStatusMotion;
    GF.ADSV.AddState.refreshMotion = refreshSVStatusMotion;
    GF.ADSV.AddState.stateSVMotion = stateSVMotion;

    //=========================================================================
    // 初始化信息
    //=========================================================================

    console.log('[ADSV_AddState] SVBattlerAdvance_AddState v' + GF.ADSV.AddState.version + ' 已加载。');

})();
