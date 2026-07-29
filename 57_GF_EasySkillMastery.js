//=============================================================================
// GF Plugins
// 57_GF_EasySkillMastery.js
//=============================================================================

var Imported = Imported || {};
Imported['57_GF_EasySkillMastery'] = true;

var GF = GF || {};
GF.ESM = GF.ESM || {};
GF.ESM.version = 1.03;
GF.ESM.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.03]         系统 - 简易技能熟练度
 * @author 57鞭策ai写
 * @url 
 * @orderAfter GF_2_CoreOfSkillElement
 * @base GF_2_CoreOfSkillElement
 * @orderAfter GF_3_ItemInfoWindow
 * @base GF_3_ItemInfoWindow
 * @orderAfter GF_3_ToastSystem
 * @base GF_3_ToastSystem
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 *
 * 这是一个免费插件，为技能添加熟练度系统。
 *
 * 在战斗中使用技能达到指定次数后即可精通该技能。
 * 精通后可获得以下增强效果：
 *
 *      伤害/治疗倍率提升
 *      HP/MP/TP/金钱消耗降低
 *      自定义精通效果（通过备注代码实现）
 *
 * 同时支持：
 *
 *      技能列表中显示熟练度进度（如 50/100）
 *      精通后显示精通图标
 *      信息窗口中通过 \SM 控制符显示熟练度
 *      技能精通时弹出推送通知（可选，需要GF_3_ToastSystem插件）
 *
 * ============================================================================
 *  前置需求
 * ============================================================================
 *
 * 这个插件只能在RPGMakerMZ上运行。
 *
 * ---- 前置插件列表 ----
 *
 * GF_0_CoreOfParam           系统 - 参数核心
 * GF_1_CoreOfWindowUI        系统 - 窗口UI核心
 * GF_2_CoreOfSkillElement    系统 - 技能元素核心
 * GF_3_ItemInfoWindow        控件 - 物品信息窗口
 * GF_3_ToastSystem           控件 - 信息推送系统
 *
 * ---- 第4层 ----
 *
 * 这个插件是第4层插件，必须放在第0，1，2，3层下面。
 *
 * ============================================================================
 *  通知功能
 * ============================================================================
 *
 * 启用精通通知后，当技能在战斗中达到精通次数时，会通过 GF_3_ToastSystem
 * 弹出推送通知，显示格式由插件参数'通知文本格式'决定。
 * 通知可在战斗中实时显示，无需等待战斗结束。
 *
 * ============================================================================
 *  备注 - 技能熟练度
 * ============================================================================
 *
 * ----技能备注
 *
 *    <Mastery Count: x>
 *    <精通次数: x>
 *
 *    - 设定该技能精通所需的使用次数，x替换为数值
 *      例如 <精通次数: 100> 代表使用100次后精通
 *      不设置此备注的技能不会追踪熟练度
 *
 *    <Mastery Damage Rate: x%>
 *    <精通伤害倍率: x%>
 *
 *    - 精通后的伤害/治疗倍率，x替换为百分比数值
 *      例如 <精通伤害倍率: 150%> 代表精通后伤害变为1.5倍
 *      默认为100%（无变化）
 *
 *    <Mastery HP Cost: x%>
 *    <精通HP消耗: x%>
 *
 *    - 精通后的HP消耗倍率
 *      例如 <精通HP消耗: 50%> 代表精通后HP消耗变为原来的一半
 *      默认为100%（无变化）
 *
 *    <Mastery MP Cost: x%>
 *    <精通MP消耗: x%>
 *
 *    - 精通后的MP消耗倍率
 *      默认为100%（无变化）
 *
 *    <Mastery TP Cost: x%>
 *    <精通TP消耗: x%>
 *
 *    - 精通后的TP消耗倍率
 *      默认为100%（无变化）
 *
 *    <Mastery Gold Cost: x%>
 *    <精通金钱消耗: x%>
 *
 *    - 精通后的金钱消耗倍率
 *      默认为100%（无变化）
 *
 *    <Custom Mastery Effect>
 *    code
 *    </Custom Mastery Effect>
 *    <自定义精通效果>
 *    code
 *    </自定义精通效果>
 *
 *    - 精通后每次使用技能时额外执行的代码
 *      可用变量: user（使用者）, skill（技能对象）
 *      例如 <自定义精通效果>
 *          user.gainTp(10);
 *          </自定义精通效果>
 *
 *    <Skill Mastery: xx>
 *    <技能精通: xx>
 *
 *    - 在信息窗口中手动指定精通效果的描述文本
 *      xx为显示内容，支持控制符
 *      例如 <技能精通: 伤害翻倍，消耗减半>
 *
 *    <Skill Mastery>
 *    xx
 *    xx
 *    </Skill Mastery>
 *    <技能精通>
 *    xx
 *    xx
 *    </技能精通>
 *
 *    - 多行手写精通效果描述，每行独立显示
 *      例如 <技能精通>
 *          伤害倍率: 150%
 *          HP消耗: 50%
 *          </技能精通>
 *
 *    - 若未设置上述备注，插件会自动根据已配置的精通效果
 *     （伤害倍率、消耗倍率、自定义效果）生成描述文本
 *
 * ============================================================================
 *  控制符
 * ============================================================================
 *
 * \SM - 在信息窗口或帮助窗口中显示当前技能的熟练度进度
 *       格式由插件参数"进度显示格式"决定
 *       例如 插件参数设为"%1/%2" 则显示 "50/100"
 *
 * ============================================================================
 *  用户规约
 * ============================================================================
 *
 *  1. GF系列插件可用于免费或商业游戏，前提是它们是通过合法手段获得的。
 *
 *  2. 请将此插件的作者在您的游戏致谢名单中列出。
 *
 *  3. 在您不声称源代码属于您的前提下，您可以根据需要编辑源代码。但不允许
 *     对插件本体进行修改后二次发布。
 *
 *  4. 其余未尽事宜，按照MIT规约处理。
 *
 * ============================================================================
 *  更新日志
 * ============================================================================
 *
 * [v1.03] 新增信息窗精通效果显示，支持手写备注和自动生成。
 *       新增 ShowMasteryEffect 参数控制显示时机。
 *
 * [v1.02] 新增精通通知功能，基于GF_3_ToastSystem，支持战斗中实时显示。
 *
 * [v1.01] 信息窗口中不再显示精通图标，仅显示进度文字。
 *
 * [v1.00] 完成插件。
 *
 * ============================================================================
 *  帮助结束
 * ============================================================================
 *
 * @ ==========================================================================
 * @ 插件参数
 * @ ==========================================================================
 *
 * @param General
 * @text ===常规设置===
 *
 * @param DefaultCount
 * @text 默认精通次数
 * @parent General
 * @type number
 * @min 1
 * @desc 技能默认需要多少次使用才能精通。当技能备注中未设置 <精通次数: x> 时使用此默认值。
 * @default 100
 *
 * @param MasteryIcon
 * @text 精通图标
 * @parent General
 * @type icon
 * @desc 技能精通后显示的图标ID，0代表不显示图标。
 * @default 0
 *
 * @param ShowProgressInSkillList
 * @text 技能列表显示进度文字
 * @parent General
 * @type boolean
 * @on 显示
 * @off 关闭
 * @desc 是否在技能列表中显示精通前的熟练度进度文字（如 50/100）。
 * 精通图标始终显示，不受此开关影响。
 * @default true
 *
 * @param ProgressFormat
 * @text 进度显示格式
 * @parent General
 * @desc 熟练度进度的显示格式。
 * %1 - 当前使用次数     %2 - 精通所需次数
 * @default %1/%2
 *
 * @param ProgressColor
 * @text 进度文字颜色
 * @parent General
 * @type number
 * @desc 熟练度进度文字的颜色序号。
 * @default 0
 *
 * @param InfoPriority
 * @text 信息窗显示层级
 * @parent General
 * @type number
 * @min 1
 * @desc 精通进度在物品信息窗口中的显示层级。
 * @default 3
 *
 * @param MasterySet
 * @text ===精通效果设置===
 *
 * @param EnableDamageRate
 * @text 启用精通伤害倍率
 * @parent MasterySet
 * @type boolean
 * @on 启用
 * @off 关闭
 * @desc 是否启用技能精通后的伤害/治疗倍率效果。
 * @default true
 *
 * @param EnableCostRate
 * @text 启用精通消耗倍率
 * @parent MasterySet
 * @type boolean
 * @on 启用
 * @off 关闭
 * @desc 是否启用技能精通后的HP/MP/TP/金钱消耗倍率效果。
 * @default true
 *
 * @param EnableCustomEffect
 * @text 启用自定义精通效果
 * @parent MasterySet
 * @type boolean
 * @on 启用
 * @off 关闭
 * @desc 是否启用技能精通后的自定义代码效果。
 * @default true
 *
 * @param ShowMasteryEffect
 * @text 精通效果显示模式
 * @parent MasterySet
 * @type select
 * @option 精通后才显示
 * @value after
 * @option 始终显示
 * @value always
 * @desc 信息窗口中精通效果的显示时机。
 * 精通后才显示：未精通时隐藏效果描述
 * 始终显示：无论是否精通都显示效果描述
 * @default after
 *
 * @param NotifySet
 * @text ===通知设置===
 *
 * @param EnableNotify
 * @text 启用精通通知
 * @parent NotifySet
 * @type boolean
 * @on 启用
 * @off 关闭
 * @desc 技能精通时是否弹出推送通知。
 * 需要 GF_3_ToastSystem 插件支持。
 * @default false
 *
 * @param NotifyFormat
 * @text 通知文本格式
 * @parent NotifySet
 * @desc 技能精通时通知的文本格式。
 * %1 - 技能名称
 * @default %1已精通！
 *
 * @param NotifyStyle
 * @text 通知推送样式
 * @parent NotifySet
 * @type number
 * @min 1
 * @desc 精通通知使用的推送样式ID，对应 GF_3_ToastSystem 的样式列表。
 * @default 1
 *
 */
//=============================================================================

//=============================================================================
// Version Checks
//=============================================================================

if (!Imported.GF_2_CoreOfSkillElement) {
    alert("错误:未找到前置插件 GF_2_CoreOfSkillElement。\n请确保已安装并启用 GF_2_CoreOfSkillElement 插件,并将其放置在 57_GF_EasySkillMastery 插件之前。");
} else if (GF.COSE.version < 1.05) {
    alert("错误:前置插件 GF_2_CoreOfSkillElement 版本过低。\n请升级至最新版本。");
}

if (!Imported.GF_3_ItemInfoWindow) {
    alert("警告:未找到 GF_3_ItemInfoWindow 插件。\n信息窗口中的熟练度显示功能将不可用。");
}

//=============================================================================
// Parameter Variables
//=============================================================================

GF.Parameters = PluginManager.parameters(GF.ESM.pluginName);
GF.Param = GF.Param || {};

GF.Param.ESMDefaultCount = Number(GF.Parameters['DefaultCount'] || 100);
GF.Param.ESMMasteryIcon = Number(GF.Parameters['MasteryIcon'] || 0);
GF.Param.ESMShowProgressInSkillList = eval(GF.Parameters['ShowProgressInSkillList'] || 'true');
GF.Param.ESMProgressFormat = String(GF.Parameters['ProgressFormat'] || '%1/%2');
GF.Param.ESMProgressColor = Number(GF.Parameters['ProgressColor'] || 0);
GF.Param.ESMInfoPriority = Number(GF.Parameters['InfoPriority'] || 3);
GF.Param.ESMEnableDamageRate = eval(GF.Parameters['EnableDamageRate'] || 'true');
GF.Param.ESMEnableCostRate = eval(GF.Parameters['EnableCostRate'] || 'true');
GF.Param.ESMEnableCustomEffect = eval(GF.Parameters['EnableCustomEffect'] || 'true');
GF.Param.ESMShowMasteryEffect = String(GF.Parameters['ShowMasteryEffect'] || 'after');
GF.Param.ESMEnableNotify = eval(GF.Parameters['EnableNotify'] || 'false');
GF.Param.ESMNotifyFormat = String(GF.Parameters['NotifyFormat'] || '%1已精通！');
GF.Param.ESMNotifyStyle = Number(GF.Parameters['NotifyStyle'] || 1);

//=============================================================================
// DataManager - Notetag Parsing
//=============================================================================

GF.ESM.DataManager_setupObjNotetagSkill = DataManager.setupObjNotetagSkill;
DataManager.setupObjNotetagSkill = function (obj, notedata) {
    GF.ESM.DataManager_setupObjNotetagSkill.call(this, obj, notedata);
    this.setupESMNotetag(obj, notedata);
};

DataManager.setupESMNotetag = function (obj, notedata) {
    // Initialize mastery data (undefined = not tracked)
    obj.masteryCount = undefined;
    obj.masteryDamageRate = 1.0;
    obj.masteryHpCostRate = 1.0;
    obj.masteryMpCostRate = 1.0;
    obj.masteryTpCostRate = 1.0;
    obj.masteryGoldCostRate = 1.0;
    obj.masteryCustomEffect = '';
    obj.masteryInfoText = '';

    let evalMode = 'none';

    for (let i = 0; i < notedata.length; i++) {
        const line = notedata[i];

        if (line.match(/<(?:Mastery Count|精通次数)[:：]\s*(\d+)>/i)) {
            obj.masteryCount = parseInt(RegExp.$1);

        } else if (line.match(/<(?:Mastery Damage Rate|精通伤害倍率)[:：]\s*(\d+)%>/i)) {
            obj.masteryDamageRate = parseFloat(RegExp.$1) * 0.01;

        } else if (line.match(/<(?:Mastery HP Cost|精通HP消耗)[:：]\s*(\d+)%>/i)) {
            obj.masteryHpCostRate = parseFloat(RegExp.$1) * 0.01;

        } else if (line.match(/<(?:Mastery MP Cost|精通MP消耗)[:：]\s*(\d+)%>/i)) {
            obj.masteryMpCostRate = parseFloat(RegExp.$1) * 0.01;

        } else if (line.match(/<(?:Mastery TP Cost|精通TP消耗)[:：]\s*(\d+)%>/i)) {
            obj.masteryTpCostRate = parseFloat(RegExp.$1) * 0.01;

        } else if (line.match(/<(?:Mastery Gold Cost|精通金钱消耗)[:：]\s*(\d+)%>/i)) {
            obj.masteryGoldCostRate = parseFloat(RegExp.$1) * 0.01;

        } else if (line.match(/<(?:Custom Mastery Effect|自定义精通效果)>/i)) {
            evalMode = 'mastery effect';

        } else if (line.match(/<\/(?:Custom Mastery Effect|自定义精通效果)>/i)) {
            evalMode = 'none';

        } else if (evalMode === 'mastery effect') {
            obj.masteryCustomEffect += line + '\n';

        } else if (line.match(/<(?:Skill Mastery|技能精通)[:：]\s*(.*)>/i)) {
            obj.masteryInfoText = RegExp.$1;

        } else if (line.match(/<(?:Skill Mastery|技能精通)>/i)) {
            evalMode = 'mastery info';

        } else if (line.match(/<\/(?:Skill Mastery|技能精通)>/i)) {
            evalMode = 'none';

        } else if (evalMode === 'mastery info') {
            obj.masteryInfoText += line + '\n';
        }
    }
};

//=============================================================================
// Game_Actor - Mastery Data Storage
//=============================================================================

GF.ESM.Game_Actor_initMembers = Game_Actor.prototype.initMembers;
Game_Actor.prototype.initMembers = function () {
    GF.ESM.Game_Actor_initMembers.call(this);
    this._skillMastery = {};
};

/**
 * Returns the mastery usage count for a skill.
 * @param {number} skillId
 * @returns {number}
 */
Game_Actor.prototype.skillMasteryCount = function (skillId) {
    return this._skillMastery[skillId] || 0;
};

/**
 * Increments the mastery usage count for a skill by 1.
 * @param {number} skillId
 */
Game_Actor.prototype.incrementSkillMastery = function (skillId) {
    if (!this._skillMastery) this._skillMastery = {};
    this._skillMastery[skillId] = (this._skillMastery[skillId] || 0) + 1;
};

/**
 * Returns the mastery threshold for a skill.
 * Uses skill notetag first, falls back to global default.
 * @param {object} skill - The skill data object
 * @returns {number}
 */
Game_Actor.prototype.skillMasteryMax = function (skill) {
    if (skill.masteryCount !== undefined && skill.masteryCount > 0) {
        return skill.masteryCount;
    }
    return GF.Param.ESMDefaultCount;
};

/**
 * Checks if a skill is being mastery-tracked.
 * @param {object} skill - The skill data object
 * @returns {boolean}
 */
Game_Actor.prototype.isSkillMasteryTracked = function (skill) {
    return skill.masteryCount !== undefined;
};

/**
 * Checks if a skill has been mastered.
 * @param {object} skill - The skill data object
 * @returns {boolean}
 */
Game_Actor.prototype.isSkillMastered = function (skill) {
    if (!this.isSkillMasteryTracked(skill)) return false;
    return this.skillMasteryCount(skill.id) >= this.skillMasteryMax(skill);
};

/**
 * Gets the formatted mastery progress text.
 * @param {object} skill - The skill data object
 * @returns {string}
 */
Game_Actor.prototype.skillMasteryProgressText = function (skill) {
    if (!this.isSkillMasteryTracked(skill)) return '';
    const count = this.skillMasteryCount(skill.id);
    const max = this.skillMasteryMax(skill);
    const fmt = GF.Param.ESMProgressFormat;
    return fmt.split('%1').join(count).split('%2').join(max);
};

/**
 * Gets the mastery effect description text for info window display.
 * Uses custom text if provided, otherwise auto-generates.
 * @param {object} skill - The skill data object
 * @returns {string[]} Array of text lines
 */
Game_Actor.prototype.skillMasteryEffectText = function (skill) {
    // Use custom text if provided
    if (skill.masteryInfoText && skill.masteryInfoText.trim() !== '') {
        return skill.masteryInfoText.trim().split('\n').filter(function (l) { return l.trim() !== ''; });
    }

    // Auto-generate effect description
    var parts = [];
    var sysC = 4, incC = 24, decC = 2;
    if (GF.Param.IIWGlobalSet) {
        if (GF.Param.IIWGlobalSet.SystemColor != null) sysC = GF.Param.IIWGlobalSet.SystemColor;
        if (GF.Param.IIWGlobalSet.IncreaseColor != null) incC = GF.Param.IIWGlobalSet.IncreaseColor;
        if (GF.Param.IIWGlobalSet.DecreaseColor != null) decC = GF.Param.IIWGlobalSet.DecreaseColor;
    }

    if (GF.Param.ESMEnableDamageRate && skill.masteryDamageRate !== 1.0) {
        var pct = Math.round(skill.masteryDamageRate * 100);
        var col = pct > 100 ? incC : (pct < 100 ? decC : sysC);
        parts.push('\\c[' + sysC + ']伤害倍率\\c[' + col + ']' + pct + '%\\c[0]');
    }
    if (GF.Param.ESMEnableCostRate) {
        if (skill.masteryHpCostRate !== 1.0) {
            var pct = Math.round(skill.masteryHpCostRate * 100);
            var col = pct < 100 ? incC : (pct > 100 ? decC : sysC);
            parts.push('\\c[' + sysC + ']HP消耗\\c[' + col + ']' + pct + '%\\c[0]');
        }
        if (skill.masteryMpCostRate !== 1.0) {
            var pct = Math.round(skill.masteryMpCostRate * 100);
            var col = pct < 100 ? incC : (pct > 100 ? decC : sysC);
            parts.push('\\c[' + sysC + ']MP消耗\\c[' + col + ']' + pct + '%\\c[0]');
        }
        if (skill.masteryTpCostRate !== 1.0) {
            var pct = Math.round(skill.masteryTpCostRate * 100);
            var col = pct < 100 ? incC : (pct > 100 ? decC : sysC);
            parts.push('\\c[' + sysC + ']TP消耗\\c[' + col + ']' + pct + '%\\c[0]');
        }
        if (skill.masteryGoldCostRate !== 1.0) {
            var pct = Math.round(skill.masteryGoldCostRate * 100);
            var col = pct < 100 ? incC : (pct > 100 ? decC : sysC);
            parts.push('\\c[' + sysC + ']金钱消耗\\c[' + col + ']' + pct + '%\\c[0]');
        }
    }
    if (GF.Param.ESMEnableCustomEffect && skill.masteryCustomEffect) {
        parts.push('\\c[' + sysC + ']自定义效果\\c[0]');
    }

    if (parts.length === 0) return [];
    return [parts.join(' ')];
};

//=============================================================================
// Game_BattlerBase - Skill Usage Counting
//=============================================================================

GF.ESM.Game_BattlerBase_paySkillCost = Game_BattlerBase.prototype.paySkillCost;
Game_BattlerBase.prototype.paySkillCost = function (skill) {
    GF.ESM.Game_BattlerBase_paySkillCost.call(this, skill);

    // Only count for actors
    if (!this.isActor || !this.isActor()) return;

    // Only count tracked skills
    if (!this.isSkillMasteryTracked(skill)) return;

    // Remember old count to detect mastery achievement
    const oldCount = this.skillMasteryCount(skill.id);

    // Increment mastery count
    this.incrementSkillMastery(skill.id);

    // Check if mastery was just achieved - show toast notification
    const threshold = this.skillMasteryMax(skill);
    if (oldCount < threshold && this.skillMasteryCount(skill.id) >= threshold) {
        if (GF.Param.ESMEnableNotify && Imported.GF_3_ToastSystem) {
            const fmt = GF.Param.ESMNotifyFormat;
            const msg = fmt.split('%1').join(skill.name);
            ToastManager.addTextWithStyle(msg, GF.Param.ESMNotifyStyle);
        }
    }

    // Run custom mastery effect if enabled and skill is mastered
    if (GF.Param.ESMEnableCustomEffect &&
        this.isSkillMastered(skill) &&
        skill.masteryCustomEffect) {
        try {
            const fn = new Function('user', 'skill', skill.masteryCustomEffect);
            fn(this, skill);
        } catch (e) {
            if (typeof GF !== 'undefined' && GF.Util && GF.Util.displayError) {
                GF.Util.displayError(e, 'ESM_CUSTOM_EFFECT',
                    'Custom Mastery Effect error for skill ' + skill.id);
            } else {
                console.error('ESM Custom Mastery Effect error:', e);
            }
        }
    }
};

//=============================================================================
// Game_BattlerBase - Cost Reduction for Mastered Skills
//=============================================================================

if (GF.Param.ESMEnableCostRate) {

    GF.ESM.Game_BattlerBase_skillHpCost = Game_BattlerBase.prototype.skillHpCost;
    Game_BattlerBase.prototype.skillHpCost = function (skill) {
        let cost = GF.ESM.Game_BattlerBase_skillHpCost.call(this, skill);
        if (this.isActor && this.isActor() && this.isSkillMastered(skill)) {
            cost = Math.floor(cost * skill.masteryHpCostRate);
        }
        return cost;
    };

    GF.ESM.Game_BattlerBase_skillMpCost = Game_BattlerBase.prototype.skillMpCost;
    Game_BattlerBase.prototype.skillMpCost = function (skill) {
        let cost = GF.ESM.Game_BattlerBase_skillMpCost.call(this, skill);
        if (this.isActor && this.isActor() && this.isSkillMastered(skill)) {
            cost = Math.floor(cost * skill.masteryMpCostRate);
        }
        return Math.max(0, cost);
    };

    GF.ESM.Game_BattlerBase_skillTpCost = Game_BattlerBase.prototype.skillTpCost;
    Game_BattlerBase.prototype.skillTpCost = function (skill) {
        let cost = GF.ESM.Game_BattlerBase_skillTpCost.call(this, skill);
        if (this.isActor && this.isActor() && this.isSkillMastered(skill)) {
            cost = Math.floor(cost * skill.masteryTpCostRate);
        }
        return Math.max(0, cost);
    };

    GF.ESM.Game_BattlerBase_skillGoldCost = Game_BattlerBase.prototype.skillGoldCost;
    Game_BattlerBase.prototype.skillGoldCost = function (skill) {
        let cost = GF.ESM.Game_BattlerBase_skillGoldCost.call(this, skill);
        if (this.isActor && this.isActor() && this.isSkillMastered(skill)) {
            cost = Math.floor(cost * skill.masteryGoldCostRate);
        }
        return Math.max(0, cost);
    };
}

//=============================================================================
// Game_Action - Damage Boost for Mastered Skills
//=============================================================================

if (GF.Param.ESMEnableDamageRate) {

    GF.ESM.Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function (target, critical) {
        let value = GF.ESM.Game_Action_makeDamageValue.call(this, target, critical);
        const skill = this.item();
        const subject = this.subject();
        if (skill && DataManager.isSkill(skill) &&
            subject && subject.isActor && subject.isActor() &&
            typeof subject.isSkillMastered === 'function' &&
            subject.isSkillMastered(skill)) {
            value = Math.floor(value * skill.masteryDamageRate);
        }
        return value;
    };

}

//=============================================================================
// Window_SkillList - Mastery Display in Skill List
//=============================================================================

/**
 * Hook getOtherCostText to append mastery progress/icon to the cost display.
 * This follows the same pattern as GF_4_SkillLimitUse.
 */
GF.ESM.Window_SkillList_getOtherCostText = Window_SkillList.prototype.getOtherCostText;
Window_SkillList.prototype.getOtherCostText = function (skill, text) {
    text = this.getMasteryCostText(skill, text);
    return GF.ESM.Window_SkillList_getOtherCostText.call(this, skill, text);
};

Window_SkillList.prototype.getMasteryCostText = function (skill, text) {
    if (!this._actor || !skill) return text;

    // Check if skill is mastery-tracked
    if (!this._actor.isSkillMasteryTracked(skill)) return text;

    const masteryIcon = GF.Param.ESMMasteryIcon;
    const colorId = GF.Param.ESMProgressColor;

    // Add separator if there's existing text
    if (text !== '') {
        text += ' ';
    }

    if (this._actor.isSkillMastered(skill)) {
        // Mastered: always show icon
        if (masteryIcon > 0) {
            text += '\\i[' + masteryIcon + ']';
        }
    } else if (GF.Param.ESMShowProgressInSkillList) {
        // Not yet mastered: show progress text (if enabled)
        text += '\\c[' + colorId + ']';
        text += this._actor.skillMasteryProgressText(skill);
        text += '\\c[0]';
    }

    return text;
};

//=============================================================================
// Window_Base - \SM Control Character
//=============================================================================

/**
 * Hook convertEscapeCharacters to handle \SM control character.
 * \SM is replaced with the mastery progress text for the current item/skill.
 */
GF.ESM.Window_Base_convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
Window_Base.prototype.convertEscapeCharacters = function (text) {
    text = GF.ESM.Window_Base_convertEscapeCharacters.call(this, text);
    text = text.replace(/\\SM/gi, function () {
        const item = this._item;
        const actor = this._actor;
        if (item && actor &&
            typeof actor.isSkillMasteryTracked === 'function' &&
            actor.isSkillMasteryTracked(item)) {
            return actor.skillMasteryProgressText(item);
        }
        return '';
    }.bind(this));
    return text;
};

//=============================================================================
// Window_ObjInfoBase - Info Window Integration
//=============================================================================

if (Imported.GF_3_ItemInfoWindow) {

    /**
     * Hook getObjOtherInfos to push mastery progress into the info window
     * at the configured priority level.
     */
    GF.ESM.Window_ObjInfoBase_getObjOtherInfos = Window_ObjInfoBase.prototype.getObjOtherInfos;
    Window_ObjInfoBase.prototype.getObjOtherInfos = function () {
        GF.ESM.Window_ObjInfoBase_getObjOtherInfos.call(this);
        this.getObjMasteryInfo();
    };

    Window_ObjInfoBase.prototype.getObjMasteryInfo = function () {
        const item = this._item;
        const actor = this._actor;

        // Only process skills that have mastery tracking
        if (!item || !DataManager.isSkill(item)) return;
        if (!actor) return;
        if (!actor.isSkillMasteryTracked || !actor.isSkillMasteryTracked(item)) return;

        const priority = GF.Param.ESMInfoPriority;
        this._data[priority] = this._data[priority] || [];

        const progressText = actor.skillMasteryProgressText(item);
        const colorId = GF.Param.ESMProgressColor;
        const isMastered = actor.isSkillMastered(item);

        // Always show progress text
        const text = '\\c[' + colorId + ']' + progressText + '\\c[0]';
        this.pushData(text, priority, item);

        // Show mastery effect description (on next line, same priority)
        const showEffect = (GF.Param.ESMShowMasteryEffect === 'always') ||
                           (GF.Param.ESMShowMasteryEffect === 'after' && isMastered);
        if (showEffect) {
            const lines = actor.skillMasteryEffectText(item);
            for (let i = 0; i < lines.length; i++) {
                this.pushData(lines[i], priority, item);
            }
        }
    };

}

//=============================================================================
// Scene_Battle - ToastSystem Rendering Support
//=============================================================================

if (Imported.GF_3_ToastSystem) {

    /**
     * Copy toast rendering pipeline from Scene_MenuBase to Scene_Battle
     * so mastery notifications display during combat.
     */

    GF.ESM.Scene_Battle_initialize = Scene_Battle.prototype.initialize;
    Scene_Battle.prototype.initialize = function () {
        GF.ESM.Scene_Battle_initialize.call(this);
        this._drill_GFTH_windowQueueUpTank = [];
        this._drill_GFTH_windowAllocator = new Game_ToastAllocator();
        this._drill_GFTH_windowTank = [];
    };

    GF.ESM.Scene_Battle_terminate = Scene_Battle.prototype.terminate;
    Scene_Battle.prototype.terminate = function () {
        GF.ESM.Scene_Battle_terminate.call(this);
        $gameTemp._drill_GFTH_commandSeq = [];
    };

    GF.ESM.Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function () {
        GF.ESM.Scene_Battle_update.call(this);
        this.drill_ESM_updateToastRegist();
        this.drill_ESM_updateToastTimeOut();
        if (this._drill_GFTH_windowAllocator) {
            this._drill_GFTH_windowAllocator.drill_allocator_update();
        }
        this.drill_ESM_updateToastAddChild();
        this.drill_ESM_updateToastDeleteCommand();
        this.drill_ESM_updateToastDelete();
        this.drill_ESM_updateToastPosition();
    };

    Scene_Battle.prototype.drill_ESM_updateToastRegist = function () {
        const tank = this._drill_GFTH_windowQueueUpTank;
        if (!tank) return;
        for (let i = tank.length - 1; i >= 0; i--) {
            const w = tank[i];
            const result = this._drill_GFTH_windowAllocator.drill_allocator_doRegist(w);
            if (result == null) return;
            tank.splice(i, 1);
        }
    };

    Scene_Battle.prototype.drill_ESM_updateToastTimeOut = function () {
        const tank = this._drill_GFTH_windowQueueUpTank;
        if (!tank) return;
        for (let i = tank.length - 1; i >= 0; i--) {
            if (tank[i]._drill_curTime > 60) {
                tank[i]._drill_destroyed = true;
                tank.splice(i, 1);
            }
        }
    };

    Scene_Battle.prototype.drill_ESM_updateToastAddChild = function () {
        if (!$gameTemp._drill_GFTH_commandSeq.length) return;
        const head = $gameTemp._drill_GFTH_commandSeq[0];
        let maxCount;
        if (head) {
            maxCount = head.s_data.regist_pushCount - this._drill_GFTH_windowTank.length;
            if (maxCount <= 0) return;
        }
        const len = Math.min($gameTemp._drill_GFTH_commandSeq.length, maxCount);
        for (let i = len - 1; i >= 0; i--) {
            const data = $gameTemp._drill_GFTH_commandSeq[i];
            if (!data) continue;
            const w = new Window_InfoToast(data);
            w.zIndex = data.s_data.window_map_zIndex;
            this._drill_GFTH_windowTank.push(w);
            this._drill_GFTH_windowQueueUpTank.push(w);
            this.addChild(w);
            $gameTemp._drill_GFTH_commandSeq.splice(i, 1);
        }
    };

    Scene_Battle.prototype.drill_ESM_updateToastDeleteCommand = function () {
        if (!$gameTemp._drill_GFTH_clearAllCurrentWindow) return;
        $gameTemp._drill_GFTH_clearAllCurrentWindow = false;
        const tank = this._drill_GFTH_windowTank;
        for (let i = 0; i < tank.length; i++) {
            tank[i]._drill_destroyed = true;
        }
    };

    Scene_Battle.prototype.drill_ESM_updateToastDelete = function () {
        const tank = this._drill_GFTH_windowTank;
        for (let i = tank.length - 1; i >= 0; i--) {
            if (tank[i].drill_isDead()) {
                this.removeChild(tank[i]);
                tank.splice(i, 1);
            }
        }
    };

    Scene_Battle.prototype.drill_ESM_updateToastPosition = function () {
        const tank = this._drill_GFTH_windowTank;
        for (let i = 0; i < tank.length; i++) {
            const w = tank[i];
            if (!w._drill_COBa_x || !w._drill_COBa_x.length) continue;
            let xx = 0, yy = 0;
            let t = w._drill_curTime;
            if (t < 0) t = 0;
            if (t > w._drill_COBa_x.length - 1) t = w._drill_COBa_x.length - 1;
            w._drill_COBa_curPosX = w._drill_COBa_x[t];
            w._drill_COBa_curPosY = w._drill_COBa_y[t];
            xx += w._drill_COBa_curPosX;
            yy += w._drill_COBa_curPosY;
            xx -= w._drill_width * w._drill_anchor_x;
            yy -= w._drill_height * w._drill_anchor_y;
            w.x = Math.floor(xx);
            w.y = Math.floor(yy);
        }
    };

}

//=============================================================================
// End of Plugin
//=============================================================================
