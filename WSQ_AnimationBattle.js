//=============================================================================
// WSQ_AnimationBattle.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.04]        战斗 - 全动画战斗（GF 行动序列驱动）
 * @author WSQ
 * @url
 * @base GF_2_CoreOfBattle
 * @base GF_2_CoreOfEnemy
 * @base GF_3_ActSeqSystem
 * @orderAfter GF_2_CoreOfBattle
 * @orderAfter GF_2_CoreOfEnemy
 * @orderAfter GF_3_ActSeqSystem
 * @help
 * ============================================================
 * 〓 介绍 〓
 * ============================================================
 * 本插件让角色/敌人把战斗中的所有动作改为播放"数据库 - 动画"，
 * 用动画代替默认 SV 战斗图（全动画战斗）。
 *
 * 设计改编自芯☆淡茹水的 XdRs_AnimationBattle.js，但重新架构：
 * - 演出（移动、等待、伤害时机）全部交给 GF 行动序列
 *   （GF_3_ActSeqSystem 的 MoveToTarget / ActionAnimation /
 *   ActionEffect / MotionWait 等指令）；
 * - 本插件只负责"动作名 → 动画 ID"的映射，并把映射结果接到
 *   精灵的 forceMotion / startMotion 钩子上（关键缺口修复：
 *   GF 行动序列对白名单动作走 forceMotion，原版只挂 startMotion）。
 *
 * 本插件不修改任何 GF 源码，仅通过扩展/覆写钩子实现。
 *
 * ============================================================
 * 〓 前置需求 〓
 * ============================================================
 * 必须在以下插件之后加载（第 3 层系统级扩展）：
 * - GF_2_CoreOfBattle   （系统 - 战斗核心）
 * - GF_2_CoreOfEnemy    （系统 - 敌人核心）
 * - GF_3_ActSeqSystem   （系统 - 动作序列）
 *
 * 战斗模式需为 SV 战斗（系统设置 - 战斗系统 - 模式 - SV 战斗）。
 *
 * ============================================================
 * 〓 兼容性 〓
 * ============================================================
 * - 与 XdRs_AnimationBattle.js 冲突（重复创建 Sprite_AnimationBattle），
 *   启用本插件时请在插件管理器关闭 XdRs_AnimationBattle.js。
 * - 与 GF_5_BattleMotion.js（独立动作精灵图）行为重叠，
 *   建议关闭，本插件不依赖也不冲突处理它。
 * - 未修改任何 GF 源码，通过 const 保存原方法 + 覆写的方式扩展。
 *
 * ============================================================
 * 〓 备注（notetag） 〓
 * ============================================================
 * 写在 角色（数据库 - 角色 备注）或 敌人（数据库 - 敌人 备注）里。
 * 判定"是否使用动画战斗"的标志：至少备注一个 <AB_walk>（待机动画）。
 *
 * 1) 通用：绑定任意动作名到动画 ID（英文/中文两种写法）
 *    <AB_xxxx:id>      /  <新动作xxxx:id>
 *    xxxx 为任意英文名（如 pose / summon / draw），不必预声明。
 *
 * 2) 预定义动作（与 RMMZ 核心 MOTIONS 对应）
 *    <AB_walk:id>      /  <待机动画:id>      ← 必须至少一个
 *    <AB_wait:id>      /  <等待动画:id>
 *    <AB_chant:id>     /  <吟唱动画:id>
 *    <AB_guard:id>     /  <防御动画:id>
 *    <AB_damage:id>    /  <受伤动画:id>
 *    <AB_evade:id>     /  <闪避动画:id>
 *    <AB_skill:id>     /  <技能动画:id>
 *    <AB_spell:id>     /  <法术动画:id>      （魔法，非 magic）
 *    <AB_item:id>      /  <物品动画:id>
 *    <AB_victory:id>   /  <胜利动画:id>
 *    <AB_dying:id>     /  <濒死动画:id>
 *    <AB_abnormal:id>  /  <异常动画:id>
 *    <AB_sleep:id>     /  <睡眠动画:id>
 *    <AB_dead:id>      /  <死亡动画:id>      （缺省则死亡消失）
 *    <AB_thrust:id>    /  <突刺动画:id>
 *    <AB_swing:id>     /  <挥砍动画:id>
 *    <AB_missile:id>   /  <远程动画:id>
 *
 * 3) 按武器类型 / 特定技能绑定
 *    <AB_attack2:55>   /  <物理攻击(武器类型2):55>
 *    <AB_skill10:45>   /  <技能(技能10):45>
 *
 * 4) 尺寸与定位
 *    <BattleImgWidth:n>   /  <战斗图宽:n>
 *    <BattleImgHeight:n>  /  <战斗图高:n>
 *    <BattleX:n>          /  <战斗X:n>     可选：覆盖 X 站位（未写则遵循 GF 战斗核心站位）
 *    <BattleY:n>          /  <战斗Y:n>     可选：覆盖 Y 站位（未写则遵循 GF 战斗核心站位）
 *
 * 5) 其它
 *    <NoAttackClose>   /  <不近身>
 *    <RD>              /  <随机音效>     （写在动画名字里）
 *
 * 6) 特定状态动画（优先于 <AB_abnormal:id>）
 *    <AB_status4:50>   /  <状态动画(状态4):50>
 *    当目标中了 4 号状态，且该状态的侧视动作为"状态异常"时，
 *    优先播放 50 号动画作为异常待机/循环动画；
 *    未写对应 <AB_statusN:id> 时仍回退到 <AB_abnormal:id>。
 *
 * ============================================================
 * 〓 插件指令 〓
 * ============================================================
 * 本插件为纯表现层，由行动序列驱动，无独立插件指令。
 *
 * ============================================================
 * 〓 脚本接口 〓
 * ============================================================
 * Game_BattlerBase.prototype.isAnimationBattle()
 * Game_BattlerBase.prototype.isAnimationBattleVisible()
 * Game_BattlerBase.prototype.isAnimationBattleMirror()
 * Game_BattlerBase.prototype.displayAnimationAction(type)
 * Game_BattlerBase.prototype.currentBattleAnimationId()
 * Game_BattlerBase.prototype.registerBattleAnimation(type, anmId)
 * Game_BattlerBase.prototype.stateAbnormalAnmAction()
 * Game_BattlerBase.prototype.playMotionAnimation(name, frames)
 * Sprite_Battler.prototype.isUseAnmBattle()
 *
 * 在行动序列中调用额外动作（纯 Eval 脚本）：
 *   ["Eval", { "eval": "subject.displayAnimationAction('pose')" }]
 *   ["Eval", { "eval": "subject.displayAnimationAction('pose'); this._logWindow._waitCount += 40;" }]
 *   ["Eval", { "eval": "subject.playMotionAnimation('pose', 40)" }]
 *
 * ============================================================
 * 〓 更新日志 〓
 * ============================================================
 * v1.04 - 新增：<AB_statusN:id> 特定状态异常动画绑定。
 *         当目标中了 N 号状态且该状态侧视动作为"状态异常"时，
 *         优先播放状态专属动画（如 <AB_status4:50>），
 *         否则回退到 <AB_abnormal:id>；状态专属动画按异常待机循环处理。
 * v1.03 - 修复：<AB_abnormal:id> 异常状态动画不生效。
 *         备注动作名改为不区分大小写（<AB_Abnormal:id> 也会注册为 abnormal），
 *         避免状态动作因大小写找不到动画而回退 walk；
 *         状态增减（addState/removeState/refresh）后立即重新评估状态动作；
 *         演出动画结束后回到 abnormal/sleep/dying 等状态动作而不是 walk；
 *         轮到角色选择指令时不再因原版 isInputting() 强制 walk 而覆盖异常/睡眠等状态动画；
 *         演出动画（damage/attack/skill 等）播放中不再被状态刷新打断，
 *         避免受伤动画只闪一帧；战斗开始时也按当前状态选择待机/异常/睡眠/濒死动画。
 * v1.02 - 修复：无 BattleX/BattleY 备注时角色站位错位。
 *         角色无备注时遵循 GF 战斗核心站位（HomePosition + OffsetX/OffsetY），
 *         与 SV 战斗一致；备注各自独立覆盖对应维度；敌人仍用 troop 坐标。
 * v1.01 - 修复：演出动画（伤害/攻击/技能等）播放中被 GF 行动序列
 *         PerformFinish → spriteReturnHome → refreshMotion 切断的问题
 *         （受伤只闪一帧/帧数漂移/循环重播）。动画战斗时演出动画
 *         播放中跳过待机刷新，播完后由 onActionEnd 自然回到 walk。
 * v1.00 - 初版：GF 行动序列驱动的全动画战斗；
 *         动作即动画键；forceMotion/startMotion 双钩子；
 *         额外动作 Eval 调用；攻击/技能动画衔接；
 *         保留渲染层 Sprite_AnimationBattle；双语 notetag。
 */

//=============================================================================
// 命名空间
//=============================================================================
"use strict";

var Imported = Imported || {};
Imported.WSQ_AnimationBattle = true;

var GF = GF || {};
GF.WAB = GF.WAB || {};
GF.WAB.version = 1.04;
GF.WAB.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
// 前置插件检查
//=============================================================================
if (!Imported.GF_2_CoreOfBattle || !Imported.GF_2_CoreOfEnemy || !Imported.GF_3_ActSeqSystem) {
    alert("错误:未找到前置插件 GF_2_CoreOfBattle / GF_2_CoreOfEnemy / GF_3_ActSeqSystem。\n请确保已安装并启用这三个插件，且放置在本插件之前。");
}

//=============================================================================
// 参数
//=============================================================================
GF.WAB.parameters = PluginManager.parameters(GF.WAB.pluginName);
GF.WAB.param = {};
GF.WAB.param.actorX = GF.WAB.parameters["actorX"] || "600 + index * 32;";
GF.WAB.param.actorY = GF.WAB.parameters["actorY"] || "280 + index * 64;";

//=============================================================================
// Game_BattlerBase
// 动作动画状态机：_battleAnms（动作名→动画ID 映射表）+ _anmActionType
//=============================================================================

GF.WAB.Game_BattlerBase_initMembers = Game_BattlerBase.prototype.initMembers;
Game_BattlerBase.prototype.initMembers = function () {
    GF.WAB.Game_BattlerBase_initMembers.call(this);
    this._battleAnms = { walk: 0 };
    this._anmActionType = "walk";
    this._currentAnmAction = "walk";
};

//-----------------------------------------------------------------------------
// 待机/状态类动作名（非演出动作）。演出动画（damage/attack/skill 等）
// 播放中应忽略 GF 的待机刷新（refreshMotion），避免被 PerformFinish 切断。
//-----------------------------------------------------------------------------
GF.WAB.IdleAnmActions = ["walk", "wait", "move", "moveA", "moveB", "guard", "chant", "victory", "escape", "dead", "sleep", "abnormal", "dying"];

// 特定状态异常动画（<AB_statusN:id>）属于状态类循环动画，不算演出动作。
Game_BattlerBase.prototype.isStateStatusAnmAction = function () {
    return /^status\d+$/i.test(this._anmActionType);
};

Game_BattlerBase.prototype.isPerformanceAnmAction = function () {
    return !GF.WAB.IdleAnmActions.contains(this._anmActionType) && !this.isStateStatusAnmAction();
};

//-----------------------------------------------------------------------------
// 初始化动作映射表（通用正则扫描）
//-----------------------------------------------------------------------------
Game_BattlerBase.prototype.initBattleAnms = function (obj) {
    if (!obj) return;
    const note = obj.note || "";
    // 通用：匹配所有 <AB_xxx:id>（xxx 为字母/数字/下划线），
    // 形如 <AB_attack2:55> / <AB_skill10:45> 自然注册键 attack2 / skill10
    const re = /<AB_([A-Za-z0-9_]+):(\d+)>/g;
    let m;
    while ((m = re.exec(note)) !== null) {
        const raw = m[1];
        const anmId = parseInt(m[2]);
        let name = raw.toLowerCase();
        if (name === "magic") name = "spell"; // 旧 magic 重映射为 spell
        this.registerBattleAnimation(name, anmId);
        // 保留原始写法（如 <AB_Abnormal> → abnormal + Abnormal 双键），
        // 避免大小写不一致导致状态动作找不到动画。
        if (raw !== name) {
            this.registerBattleAnimation(raw, anmId);
        }
    }
};

Game_BattlerBase.prototype.registerBattleAnimation = function (type, anmId) {
    if ($dataAnimations[anmId]) {
        this._battleAnms[type] = anmId;
    }
};

//-----------------------------------------------------------------------------
// 状态查询
//-----------------------------------------------------------------------------
Game_BattlerBase.prototype.isAnimationBattle = function () {
    return this._battleAnms["walk"] > 0;
};

Game_BattlerBase.prototype.isAnimationBattleVisible = function () {
    return !this.isDead() || !!this._battleAnms["dead"];
};

Game_BattlerBase.prototype.isAnimationBattleMirror = function () {
    if (this.isEnemy()) return this._currentAnmAction !== "moveB";
    return this._currentAnmAction === "moveB";
};

Game_BattlerBase.prototype.isAttackActioning = function () {
    return ["attack", "skill", "spell", "magic"].some(type => {
        return this._anmActionType.contains(type);
    });
};

Game_BattlerBase.prototype.isLoopAnmAction = function () {
    return ["walk", "move", "guard", "chant", "victory", "abnormal", "sleep", "dying", "dead"].some(type => {
        return this._anmActionType.contains(type);
    }) || this.isStateStatusAnmAction();
};

Game_BattlerBase.prototype.hasWeaponTypeAnm = function (wtypId) {
    return wtypId > 0 && !!this._battleAnms["attack" + wtypId];
};

Game_BattlerBase.prototype.hasSkillTypeAnm = function (skillId) {
    return skillId > 0 && !!this._battleAnms["skill" + skillId];
};

//-----------------------------------------------------------------------------
// 动作切换
//-----------------------------------------------------------------------------
Game_BattlerBase.prototype.currentBattleAnimationId = function () {
    return this._battleAnms[this._anmActionType];
};

Game_BattlerBase.prototype.displayAnimationAction = function (type) {
    type = type === "escape" ? "moveB" : type;
    this._currentAnmAction = type;
    type = this._battleAnms[type] ? type : "walk";
    this._anmActionType = type;
};

// 当前处于"状态异常"侧视动作时，选择异常循环动画：
// 按状态优先级找到第一个 motion === 1 且备注了 <AB_statusN:id> 的活跃状态，
// 使用该状态专属动画；找不到时回退到通用 <AB_abnormal:id>。
Game_BattlerBase.prototype.stateAbnormalAnmAction = function () {
    for (const state of this.states()) {
        if (state.motion === 1 && this._battleAnms["status" + state.id]) {
            return "status" + state.id;
        }
    }
    return "abnormal";
};

Game_BattlerBase.prototype.animationBattleIdleAction = function () {
    if (!$gameParty.inBattle()) return "walk";
    const stateMotion = this.stateMotionIndex();
    if (this.isDead() || stateMotion === 3) return "dead";
    if (stateMotion === 2) return "sleep";
    if (this.isChanting()) return "chant";
    if (this.isGuard() || this.isGuardWaiting()) return "guard";
    if (stateMotion === 1) return this.stateAbnormalAnmAction();
    if (this.isDying()) return "dying";
    return "walk";
};

Game_BattlerBase.prototype.reductionBattleAnimation = function () {
    this.displayAnimationAction(this.animationBattleIdleAction());
};

// 状态变化（addState/removeState/refresh）后立即重新评估状态动作。
// 演出动画（damage/attack/skill 等）播放中不打断，播完后由
// reductionBattleAnimation 回到正确的状态动作；死亡除外，立即切 dead。
Game_BattlerBase.prototype.refreshAnimationBattleState = function () {
    if (!$gameParty.inBattle() || !this.isAnimationBattle()) return;
    if (this.isDead()) {
        this.displayAnimationAction("dead");
        return;
    }
    if (this.isPerformanceAnmAction()) return;
    const idle = this.animationBattleIdleAction();
    if (idle !== this._anmActionType) {
        this.displayAnimationAction(idle);
    }
};

Game_BattlerBase.prototype.onAnimationActionEnd = function () {
    if (!this.isLoopAnmAction() && !this.isDead()) {
        this.reductionBattleAnimation();
    }
};

//-----------------------------------------------------------------------------
// 便捷封装：播放动作动画并等待 frames 帧（行动序列 Eval 调用）
//-----------------------------------------------------------------------------
Game_BattlerBase.prototype.playMotionAnimation = function (name, frames) {
    this.displayAnimationAction(name);
    if (frames > 0 && BattleManager._logWindow) {
        BattleManager._logWindow._waitCount += frames;
    }
};

//-----------------------------------------------------------------------------
// 尺寸与定位（默认值）
//-----------------------------------------------------------------------------
Game_BattlerBase.prototype.battleImgWidth = function () {
    return 64;
};

Game_BattlerBase.prototype.battleImgHeight = function () {
    return 64;
};

Game_BattlerBase.prototype.screenX = function () {
    return 0;
};

Game_BattlerBase.prototype.screenY = function () {
    return 0;
};

//=============================================================================
// Game_Battler
//=============================================================================

// 动画战斗单位不参与原生 SV 行动流程
const WAB_Game_Battler_isActing = Game_Battler.prototype.isActing;
Game_Battler.prototype.isActing = function () {
    return !this.isAnimationBattle() && WAB_Game_Battler_isActing.call(this);
};

const WAB_Game_Battler_isWeaponAnimationRequested = Game_Battler.prototype.isWeaponAnimationRequested;
Game_Battler.prototype.isWeaponAnimationRequested = function () {
    return !this.isAnimationBattle() && WAB_Game_Battler_isWeaponAnimationRequested.call(this);
};

// 战斗开始时切换到待机/状态/死亡动画
const WAB_Game_Battler_onBattleStart = Game_Battler.prototype.onBattleStart;
Game_Battler.prototype.onBattleStart = function () {
    WAB_Game_Battler_onBattleStart.call(this);
    if (this.isAnimationBattle()) {
        const type = this.isDead() ? "dead" : this.animationBattleIdleAction();
        this.displayAnimationAction(type);
    }
};

// 复活处理（dead 动画 → reborn / walk）
// 同时处理状态增减后的状态动作刷新（abnormal/sleep/dying/dead 等）
const WAB_Game_Battler_refresh = Game_Battler.prototype.refresh;
Game_Battler.prototype.refresh = function () {
    WAB_Game_Battler_refresh.call(this);
    if (this._currentAnmAction === "dead" && !this.isDead()) {
        this.displayAnimationAction("reborn");
        return;
    }
    this.refreshAnimationBattleState();
};

//=============================================================================
// Game_Actor
//=============================================================================

const WAB_Game_Actor_setup = Game_Actor.prototype.setup;
Game_Actor.prototype.setup = function (actorId) {
    WAB_Game_Actor_setup.call(this, actorId);
    this.initBattleAnms(this.actor());
};

const WAB_Game_Actor_performAttack = Game_Actor.prototype.performAttack;
Game_Actor.prototype.performAttack = function () {
    if (this.isAnimationBattle()) {
        const weapon = this.weapons()[0];
        const wtypeId = weapon ? weapon.wtypeId : 0;
        const result = this.hasWeaponTypeAnm(wtypeId);
        this.displayAnimationAction("attack" + (result ? wtypeId : ""));
    } else {
        WAB_Game_Actor_performAttack.call(this);
    }
};

const WAB_Game_Actor_performAction = Game_Actor.prototype.performAction;
Game_Actor.prototype.performAction = function (action) {
    if (this.isAnimationBattle() && action.isSkill()) {
        this.performAnmSkillAction(action);
    } else {
        WAB_Game_Actor_performAction.call(this, action);
    }
};

Game_Actor.prototype.performAnmSkillAction = function (action) {
    const skillId = action.item().id;
    const result = this.hasSkillTypeAnm(skillId);
    if (result) {
        this.displayAnimationAction("skill" + skillId);
    } else {
        if (action.isMagicSkill()) {
            this.displayAnimationAction("spell");
        } else if (!!this._battleAnms["skill"]) {
            this.displayAnimationAction("skill");
        } else {
            this.performAttack();
        }
    }
};

const WAB_Game_Actor_performDamage = Game_Actor.prototype.performDamage;
Game_Actor.prototype.performDamage = function () {
    if (this.isSpriteVisible() && this.isAnimationBattle()) {
        const type = this.isDead() ? "dead" : "damage";
        this.displayAnimationAction(type);
        !this.isDead() && SoundManager.playActorDamage();
    } else {
        WAB_Game_Actor_performDamage.call(this);
    }
};

Game_Actor.prototype.screenX = function () {
    const mx = this.screenMetaX();
    if (!mx) {
        const index = this.index();
        try { return eval(GF.WAB.param.actorX); }
        catch (e) { console.error("【全动画战斗】角色战斗位置（X坐标）书写有误！"); }
    }
    return mx;
};

Game_Actor.prototype.screenY = function () {
    const my = this.screenMetaY();
    if (!my) {
        const index = this.index();
        try { return eval(GF.WAB.param.actorY); }
        catch (e) { console.error("【全动画战斗】角色战斗位置（Y坐标）书写有误！"); }
    }
    return my;
};

Game_Actor.prototype.screenMetaX = function () {
    const v = Number(this.actor().meta.BattleX);
    return Number.isFinite(v) ? v : 0;
};

Game_Actor.prototype.screenMetaY = function () {
    const v = Number(this.actor().meta.BattleY);
    return Number.isFinite(v) ? v : 0;
};

Game_Actor.prototype.battleImgWidth = function () {
    const w = parseInt(this.actor().meta.BattleImgWidth);
    return w || Game_BattlerBase.prototype.battleImgWidth.call(this);
};

Game_Actor.prototype.battleImgHeight = function () {
    const h = parseInt(this.actor().meta.BattleImgHeight);
    return h || Game_BattlerBase.prototype.battleImgHeight.call(this);
};

//=============================================================================
// Game_Enemy
//=============================================================================

const WAB_Game_Enemy_setup = Game_Enemy.prototype.setup;
Game_Enemy.prototype.setup = function (enemyId, x, y) {
    WAB_Game_Enemy_setup.call(this, enemyId, x, y);
    this.initBattleAnms(this.enemy());
};

Game_Enemy.prototype.weapons = function () {
    return [];
};

const WAB_Game_Enemy_performAttack = Game_Enemy.prototype.performAttack;
Game_Enemy.prototype.performAttack = function () {
    if (this.isAnimationBattle()) {
        this.displayAnimationAction("attack");
    } else {
        WAB_Game_Enemy_performAttack.call(this);
    }
};

const WAB_Game_Enemy_performAction = Game_Enemy.prototype.performAction;
Game_Enemy.prototype.performAction = function (action) {
    if (!this.isAnimationBattle()) {
        WAB_Game_Enemy_performAction.call(this, action);
    } else {
        Game_Actor.prototype.performAction.call(this, action);
    }
};

const WAB_Game_Enemy_performDamage = Game_Enemy.prototype.performDamage;
Game_Enemy.prototype.performDamage = function () {
    if (!this.isAnimationBattle()) {
        WAB_Game_Enemy_performDamage.call(this);
    } else {
        SoundManager.playEnemyDamage();
        const type = this.isDead() ? "dead" : "damage";
        this.displayAnimationAction(type);
    }
};

Game_Enemy.prototype.performAnmSkillAction = function (action) {
    Game_Actor.prototype.performAnmSkillAction.call(this, action);
};

Game_Enemy.prototype.battleImgWidth = function () {
    const w = parseInt(this.enemy().meta.BattleImgWidth);
    return w || Game_BattlerBase.prototype.battleImgWidth.call(this);
};

Game_Enemy.prototype.battleImgHeight = function () {
    const h = parseInt(this.enemy().meta.BattleImgHeight);
    return h || Game_BattlerBase.prototype.battleImgHeight.call(this);
};

//=============================================================================
// Sprite_Battler
// 动画精灵挂载 / 混合色转发
//=============================================================================

Sprite_Battler.prototype.isUseAnmBattle = function () {
    return !!this._battler && this._battler.isAnimationBattle();
};

Sprite_Battler.prototype.isAnmAttackTiming = function () {
    return this._anmBattleSprite && this._anmBattleSprite.isAnmAttackTiming();
};

Sprite_Battler.prototype.closeAnmAttackTimingPopup = function () {
    return this._anmBattleSprite && this._anmBattleSprite.closeAnmAttackTimingPopup();
};

const WAB_Sprite_Battler_setBlendColor = Sprite_Battler.prototype.setBlendColor;
Sprite_Battler.prototype.setBlendColor = function (color) {
    WAB_Sprite_Battler_setBlendColor.call(this, color);
    this._anmBattleSprite && this._anmBattleSprite.setBlendColor(color);
};

const WAB_Sprite_Battler_update = Sprite_Battler.prototype.update;
Sprite_Battler.prototype.update = function () {
    WAB_Sprite_Battler_update.call(this);
    this.updateAnmBattle();
};

// 动画战斗时不更新 SV 帧
const WAB_Sprite_Battler_updateFrame = Sprite_Battler.prototype.updateFrame;
Sprite_Battler.prototype.updateFrame = function () {
    !this.isUseAnmBattle() && WAB_Sprite_Battler_updateFrame.call(this);
};

// 动画战斗精灵的创建/销毁
Sprite_Battler.prototype.updateAnmBattle = function () {
    if (this._anmBattleSprite) {
        if (!this.isUseAnmBattle()) {
            this.removeChild(this._anmBattleSprite);
            this._anmBattleSprite = null;
        }
    } else {
        if (this.isUseAnmBattle()) {
            this._anmBattleSprite = new Sprite_AnimationBattle(this._battler, this);
            this.addChild(this._anmBattleSprite);
        }
    }
};

//=============================================================================
// Sprite_Actor
// 核心钩子：forceMotion / startMotion → displayAnimationAction
//=============================================================================

// startMotion：动画战斗时切换动画（MoveToTarget 等 requestMotion 链）
const WAB_Sprite_Actor_startMotion = Sprite_Actor.prototype.startMotion;
Sprite_Actor.prototype.startMotion = function (motionType) {
    WAB_Sprite_Actor_startMotion.call(this, motionType);
    if (this.isUseAnmBattle()) {
        this._battler.displayAnimationAction(motionType);
    }
};

// forceMotion：动画战斗时切换动画（行动序列 MotionType 白名单链）—— 关键缺口修复
const WAB_Sprite_Actor_forceMotion = Sprite_Actor.prototype.forceMotion;
Sprite_Actor.prototype.forceMotion = function (motionType) {
    if (this.isUseAnmBattle()) {
        this._battler.displayAnimationAction(motionType);
    } else {
        WAB_Sprite_Actor_forceMotion.call(this, motionType);
    }
};

// 动画战斗时不更新 SV 位图/帧（主图为空白 Bitmap，避免加载 SV 图）
const WAB_Sprite_Actor_updateBitmap = Sprite_Actor.prototype.updateBitmap;
Sprite_Actor.prototype.updateBitmap = function () {
    !this.isUseAnmBattle() && WAB_Sprite_Actor_updateBitmap.call(this);
};

const WAB_Sprite_Actor_updateFrame = Sprite_Actor.prototype.updateFrame;
Sprite_Actor.prototype.updateFrame = function () {
    !this.isUseAnmBattle() && WAB_Sprite_Actor_updateFrame.call(this);
};

// setBattler：动画战斗时初始化动画样式（空白主图、阴影、状态位置）
const WAB_Sprite_Actor_setBattler = Sprite_Actor.prototype.setBattler;
Sprite_Actor.prototype.setBattler = function (battler) {
    const result = this._actor !== battler;
    WAB_Sprite_Actor_setBattler.call(this, battler);
    result && this.setupAnmStyle();
};

Sprite_Actor.prototype.setupAnmStyle = function () {
    if (this.isUseAnmBattle()) {
        const w = this._actor.battleImgWidth();
        const h = this._actor.battleImgHeight();
        this._mainSprite.bitmap = new Bitmap(w, h);
        if (this._shadowSprite) {
            this._shadowSprite.bitmap = new Bitmap(32, 32);
        }
        if (this._stateSprite) {
            this._stateSprite.y = -h + 96;
        }
    } else {
        if (this._stateSprite) {
            this._stateSprite.y = 0;
        }
        if (this._shadowSprite) {
            this._shadowSprite.bitmap = ImageManager.loadSystem("Shadow2");
        }
    }
};

// setActorHome：动画战斗时
//   - 角色：BattleX/BattleY 备注优先（各自独立覆盖对应维度）；
//           无备注 → 遵循 GF 战斗核心站位（COBActorSpriteSet.HomePosition 公式 + OffsetX/OffsetY）
//   - 敌人：troop 坐标（GF_2_CoreOfEnemy.setupCood / TroopCoodSet，本身就是战斗核心位置）
const WAB_Sprite_Actor_setActorHome = Sprite_Actor.prototype.setActorHome;
Sprite_Actor.prototype.setActorHome = function (index) {
    if (this.isUseAnmBattle()) {
        const actor = this._actor;
        if (!actor) return;
        if (actor.isActor()) {
            const meta = actor.actor().meta;
            const hasX = meta.BattleX !== undefined;
            const hasY = meta.BattleY !== undefined;
            if (hasX || hasY) {
                // 备注覆盖对应维度；未备注维度取 GF 战斗核心站位
                const set = GF.Param.COBActorSpriteSet;
                let position;
                try {
                    position = set.HomePosition.call(this, index);
                } catch (e) {
                    position = new Point(0, 0);
                    GF.Util.displayError(e, set.HomePosition, '角色站位坐标公式错误');
                }
                const x = hasX ? (Number(meta.BattleX) || 0) : position.x + set.OffsetX;
                const y = hasY ? (Number(meta.BattleY) || 0) : position.y + set.OffsetY;
                this.setHome(x, y);
            } else {
                // 无备注：完全遵循 GF 战斗核心站位（含 try/catch 容错与入场移动）
                WAB_Sprite_Actor_setActorHome.call(this, index);
            }
        } else {
            // 敌人：troop 坐标
            this.setHome(actor.screenX(), actor.screenY());
        }
    } else {
        WAB_Sprite_Actor_setActorHome.call(this, index);
    }
};

// 动画战斗时从 home 开始（无入场偏移）
const WAB_Sprite_Actor_moveToStartPosition = Sprite_Actor.prototype.moveToStartPosition;
Sprite_Actor.prototype.moveToStartPosition = function () {
    if (this.isUseAnmBattle()) {
        const x = this._actor.isActor() ? 300 : 0;
        this.startMove(x, 0, 0);
    } else {
        WAB_Sprite_Actor_moveToStartPosition.call(this);
    }
};

// 逃跑：动画战斗时快速离场
const WAB_Sprite_Actor_retreat = Sprite_Actor.prototype.retreat;
Sprite_Actor.prototype.retreat = function () {
    if (this.isUseAnmBattle()) {
        const x = this._actor.isActor() ? 500 : 0;
        this.startMove(x, 0, 30);
    } else {
        WAB_Sprite_Actor_retreat.call(this);
    }
};

// refreshMotion：动画战斗时，正在播放演出动画（伤害/攻击/技能等非循环动作）
// 时忽略 GF 的待机刷新 —— GF 行动序列 PerformFinish 会对所有存活成员调用
// spriteReturnHome → refreshMotion → startMotion("walk"/"wait")，会立刻把刚
// 切到的演出动画切断（"受伤只闪一帧"）。演出动画播完后由 onActionEnd 自然
// 回到正确的状态动作（walk/abnormal/sleep/dying 等），因此这里一律跳过刷新。
// 空闲时的 refreshMotion 不交给原版（原版在 isInputting() 时强制 walk），
// 而是按当前状态动作重新设置，确保轮到角色选择指令时异常/睡眠等状态动画
// 不会被 walk 覆盖。
const WAB_Sprite_Actor_refreshMotion = Sprite_Actor.prototype.refreshMotion;
Sprite_Actor.prototype.refreshMotion = function () {
    if (!this.isUseAnmBattle()) {
        WAB_Sprite_Actor_refreshMotion.call(this);
        return;
    }
    const battler = this._battler;
    if (battler.isPerformanceAnmAction()) return;
    // 胜利/逃跑等结束性动画不被待机刷新覆盖
    if (battler._currentAnmAction === "victory" || battler._currentAnmAction === "escape" ||
        battler._anmActionType === "moveB") {
        return;
    }
    const idle = battler.animationBattleIdleAction();
    if (battler._anmActionType !== idle) {
        battler.displayAnimationAction(idle);
    }
};

// stepForward：动画战斗时前移（SV 动作的替代，幅度固定）
const WAB_Sprite_Actor_stepForward = Sprite_Actor.prototype.stepForward;
Sprite_Actor.prototype.stepForward = function () {
    if (this.isUseAnmBattle()) {
        const x = this._actor.isActor() ? -48 : 48;
        this.startMove(x, 0, 12);
    } else {
        WAB_Sprite_Actor_stepForward.call(this);
    }
};

//=============================================================================
// Sprite_AnimationBattle
// 渲染层：把"数据库 - 动画"当作战图渲染在精灵位置（继承 Sprite_AnimationMV）
//=============================================================================

function Sprite_AnimationBattle() {
    this.initialize.apply(this, arguments);
}

Sprite_AnimationBattle.prototype = Object.create(Sprite_AnimationMV.prototype);
Sprite_AnimationBattle.prototype.constructor = Sprite_AnimationBattle;

Sprite_AnimationBattle.prototype.initialize = function (battle, target) {
    this._battle = battle;
    this._targets = [target];
    this._cellSprites = [];
    this._screenFlashSprite = null;
    this._lastVoiceAnmId = -1;
    Sprite_AnimationMV.prototype.initialize.call(this);
    this.restart(battle.isDead());
    this.setupBattlerDeadStyle();
};

Sprite_AnimationBattle.prototype.initMembers = function () {
    this._targets = this._targets || [];
    this._animation = null;
    this._mirror = false;
    this._lock = false;
    this._delay = 0;
    this._rate = 4;
    this._duration = 0;
    this._flashColor = [0, 0, 0, 0];
    this._flashDuration = 0;
    this._screenFlashDuration = 0;
    this._hidingDuration = 0;
    this._hue1 = 0;
    this._hue2 = 0;
    this._bitmap1 = null;
    this._bitmap2 = null;
    this._cellSprites = this._cellSprites || [];
    this._screenFlashSprite = null;
    this._duplicated = false;
    this.z = 8;
    this.closeAnmAttackTimingPopup();
};

// 当前动作是否属攻击类（决定是否启用"对象闪烁帧 = 伤害时机"）
Sprite_AnimationBattle.prototype.isAttackStyle = function () {
    return this._battle && this._battle.isAttackActioning();
};

Sprite_AnimationBattle.prototype.isAnmAttackTiming = function () {
    return this._attackTiming;
};

Sprite_AnimationBattle.prototype.isRandVoice = function () {
    return this._animation && /<RD>/.test(this._animation.name);
};

Sprite_AnimationBattle.prototype.closeAnmAttackTimingPopup = function () {
    this._attackTiming = false;
};

// 重新播放当前动作对应的动画
Sprite_AnimationBattle.prototype.restart = function (wasDead) {
    this.initMembers();
    this._anmId = this._battle.currentBattleAnimationId();
    this._mirror = this._battle.isAnimationBattleMirror();
    this._animation = $dataAnimations[this._anmId];
    this._delay = 0;
    this.setupRate();
    this.setupDuration();
    this.loadBitmaps();
    this.createCellSprites();
    this.playSetingVoice(wasDead);
    this.checkAttackTiming();
};

// 随机动作语音：动画名备注 <RD> 时，该动画首次播放时随机抽一个音效
Sprite_AnimationBattle.prototype.playSetingVoice = function (wasDead) {
    if (!wasDead && this.isRandVoice() && this._anmId !== this._lastVoiceAnmId) {
        this._lastVoiceAnmId = this._anmId;
        const arr = this._animation.timings.filter(tm => !!tm.se).map(tm => tm.se);
        const se = arr[Math.randomInt(arr.length)];
        se && AudioManager.playSe(se);
    }
};

// 攻击动画未设置对象闪烁帧时，攻击首帧即伤害时机
Sprite_AnimationBattle.prototype.checkAttackTiming = function () {
    if (this.isAttackStyle()) {
        this._attackTiming = !this._animation.timings.some(tm => tm.flashScope === 1);
    }
};

// 死亡定格：备注 <AB_dead> 时锁定在最后一帧
Sprite_AnimationBattle.prototype.setupBattlerDeadStyle = function () {
    if (this._battle.isDead() && this._animation) {
        this._lock = true;
        this._duration = 1;
        this.updateFrame();
    }
};

Sprite_AnimationBattle.prototype.createCellSprites = function () {
    if (this._cellSprites.length === 0) {
        Sprite_AnimationMV.prototype.createCellSprites.call(this);
    }
};

Sprite_AnimationBattle.prototype.createScreenFlashSprite = function () {
    if (!this._screenFlashSprite) {
        Sprite_AnimationMV.prototype.createScreenFlashSprite.call(this);
    }
};

Sprite_AnimationBattle.prototype.setBlendColor = function (color) {
    Sprite_AnimationMV.prototype.setBlendColor.call(this, color);
    for (const s of this._cellSprites) {
        s.setBlendColor(color);
    }
};

Sprite_AnimationBattle.prototype.onActionEnd = function () {
    this._battle.onAnimationActionEnd();
    if (this._battle.isDead()) {
        this._lock = true;
    } else {
        this.restart();
    }
};

// 音效/对象闪烁时机处理；攻击类动画的对象闪烁帧 = 一次伤害时机（多段攻击）
Sprite_AnimationBattle.prototype.processTimingData = function (timing) {
    if (!this.isRandVoice() || !timing.se) {
        Sprite_AnimationMV.prototype.processTimingData.call(this, timing);
        if (this.isAttackStyle() && timing.flashScope === 1) {
            this._attackTiming = true;
        }
    }
};

Sprite_AnimationBattle.prototype.startFlash = function () {
};

Sprite_AnimationBattle.prototype.update = function () {
    this.updateVisibility();
    this.updateCurrentAnm();
    if (!this._lock) {
        Sprite_AnimationMV.prototype.update.call(this);
    }
};

// 位置固定：动画跟随精灵（由父精灵移动控制）
Sprite_AnimationBattle.prototype.updatePosition = function () {
};

Sprite_AnimationBattle.prototype.updateFlash = function () {
};

Sprite_AnimationBattle.prototype.updateMain = function () {
    Sprite_AnimationMV.prototype.updateMain.call(this);
    if (this._duration <= 0) {
        this.onActionEnd();
    }
};

Sprite_AnimationBattle.prototype.updateVisibility = function () {
    if (this._battle) {
        this.visible = this._battle.isSpriteVisible() && this._battle.isAnimationBattleVisible();
    } else {
        this.visible = false;
    }
};

// 每帧检测动作变化，自动重启播放新动画
Sprite_AnimationBattle.prototype.updateCurrentAnm = function () {
    if (this._anmId !== this._battle.currentBattleAnimationId()) {
        this.restart();
    }
};

//=============================================================================
// Spriteset_Battle
// 敌人创建：动画战斗敌人用 Sprite_Actor 实例（沿用原 createEnemies 逻辑）
//=============================================================================

const WAB_Spriteset_Battle_createEnemies = Spriteset_Battle.prototype.createEnemies;
Spriteset_Battle.prototype.createEnemies = function () {
    // 先调用已加载版本（原生创建 Sprite_Enemy；若在本插件之后加载的
    // 插件已覆写 createEnemies，如 GF_4_BattlerGauge 的重建标志，其钩子仍生效）
    WAB_Spriteset_Battle_createEnemies.call(this);
    // 再把动画战斗敌人的精灵就地替换为 Sprite_Actor 实例（沿用原 XdRs 逻辑）
    const sprites = this._enemySprites;
    for (let i = 0; i < sprites.length; i++) {
        const sprite = sprites[i];
        const battler = sprite && sprite._battler;
        if (battler && battler.isAnimationBattle() && !(sprite instanceof Sprite_Actor)) {
            const newSprite = new Sprite_Actor(battler);
            const idx = this._battleField.children.indexOf(sprite);
            this._battleField.removeChild(sprite);
            if (idx >= 0) {
                this._battleField.addChildAt(newSprite, Math.min(idx, this._battleField.children.length));
            } else {
                this._battleField.addChild(newSprite);
            }
            sprites[i] = newSprite;
        }
    }
};

//=============================================================================
// 结束
//=============================================================================
