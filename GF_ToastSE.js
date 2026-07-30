//=============================================================================
// GF Plugins
// GF_ToastSE.js
//=============================================================================

var Imported = Imported || {};
Imported.GF_ToastSE = true;

var GF = GF || {};
GF.TSE = GF.TSE || {};
GF.TSE.version = 1.00;
GF.TSE.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.00]     补丁 - 信息推送音效
 * @author 57 & deepseek
 * @url
 * @orderAfter GF_3_ToastSystem
 * @base GF_3_ToastSystem
 * @orderAfter GF_3_QuestSystem
 * @orderAfter GF_3_IndependEquipSystem
 * @orderAfter GF_EasySkillMastery
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 * 
 * 这是一个免费插件，如果您是通过付费方式获得了此插件，请立即要求收费方退款。
 * 
 * 为 GF_3_ToastSystem 信息推送系统增加音效支持。
 * 在信息推送框弹出时播放音效，不同场景可配置不同音效。
 * 同一批次弹出多条通知时，只播放一次音效。
 *
 * ============================================================================
 *  前置需求
 * ============================================================================
 *
 * 这个插件只能在RPGMakerMZ上运行。
 *
 * ---- 前置插件列表 ----
 *
 * GF_3_ToastSystem           控件 - 信息推送系统
 *
 * ---- 可选前置 ----
 *
 * GF_3_QuestSystem           玩法 - 任务系统（若需为任务通知配置音效）
 * GF_EasySkillMastery       系统 - 简易技能熟练度（若需为精通通知配置音效）
 *
 * ---- 第3层 ----
 *
 * 这个插件是第3层补丁插件，必须放在 GF_3_ToastSystem 和 GF_3_QuestSystem 下面。
 *
 * ============================================================================
 *  使用说明
 * ============================================================================
 * 
 * 1. 在插件参数中为每个场景配置音效文件名、音量和音调。
 * 2. 音效文件需放置在 audio/se/ 目录下。
 * 3. 文件名留空表示该场景不播放音效。
 * 4. 若同一批次中包含多种场景的通知，则播放"默认"音效。
 * 5. 若某场景的音效文件为空，则回退到"默认"音效。
 *
 * ============================================================================
 *  用户规约
 * ============================================================================
 * 
 * 1. 此插件可自由用于免费或商业游戏。
 * 2. 可自由修改源代码，但修改后需对修改部分自行负责。
 * 3. 其余未尽事宜，按照MIT规约处理。
 *
 * ============================================================================
 *  更新日志
 * ============================================================================
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
 * @param DefaultSE
 * @text ====默认音效====
 * @desc 当通知类型不属于下方任何分类，或同一批次混合了多种类型时，使用此音效。
 *
 * @param DefaultSEName
 * @text 默认-音效文件名
 * @parent DefaultSE
 * @type file
 * @require 1
 * @dir audio/se/
 * @desc 音效文件名，留空则不播放。
 * @default 
 *
 * @param DefaultSEVolume
 * @text 默认-音量
 * @parent DefaultSE
 * @type number
 * @min 0
 * @max 100
 * @desc 音量（0-100），默认80。
 * @default 80
 *
 * @param DefaultSEPitch
 * @text 默认-音调
 * @parent DefaultSE
 * @type number
 * @min 50
 * @max 150
 * @desc 音调（50-150），默认100。
 * @default 100
 *
 * @param ItemSE
 * @text ====物品/武器/防具得失音效====
 * @desc 获得或失去物品、武器、防具时使用的音效。
 *
 * @param ItemSEName
 * @text 物品得失-音效文件名
 * @parent ItemSE
 * @type file
 * @require 1
 * @dir audio/se/
 * @desc 音效文件名，留空则回退到默认音效。
 * @default 
 *
 * @param ItemSEVolume
 * @text 物品得失-音量
 * @parent ItemSE
 * @type number
 * @min 0
 * @max 100
 * @desc 音量（0-100），默认80。
 * @default 80
 *
 * @param ItemSEPitch
 * @text 物品得失-音调
 * @parent ItemSE
 * @type number
 * @min 50
 * @max 150
 * @desc 音调（50-150），默认100。
 * @default 100
 *
 * @param GoldSE
 * @text ====金钱得失音效====
 * @desc 获得或失去金钱时使用的音效。
 *
 * @param GoldSEName
 * @text 金钱得失-音效文件名
 * @parent GoldSE
 * @type file
 * @require 1
 * @dir audio/se/
 * @desc 音效文件名，留空则回退到默认音效。
 * @default 
 *
 * @param GoldSEVolume
 * @text 金钱得失-音量
 * @parent GoldSE
 * @type number
 * @min 0
 * @max 100
 * @desc 音量（0-100），默认80。
 * @default 80
 *
 * @param GoldSEPitch
 * @text 金钱得失-音调
 * @parent GoldSE
 * @type number
 * @min 50
 * @max 150
 * @desc 音调（50-150），默认100。
 * @default 100
 *
 * @param SkillSE
 * @text ====技能习得/遗忘音效====
 * @desc 角色习得或遗忘技能时使用的音效。
 *
 * @param SkillSEName
 * @text 技能-音效文件名
 * @parent SkillSE
 * @type file
 * @require 1
 * @dir audio/se/
 * @desc 音效文件名，留空则回退到默认音效。
 * @default 
 *
 * @param SkillSEVolume
 * @text 技能-音量
 * @parent SkillSE
 * @type number
 * @min 0
 * @max 100
 * @desc 音量（0-100），默认80。
 * @default 80
 *
 * @param SkillSEPitch
 * @text 技能-音调
 * @parent SkillSE
 * @type number
 * @min 50
 * @max 150
 * @desc 音调（50-150），默认100。
 * @default 100
 *
 * @param PartySE
 * @text ====角色入队/离队音效====
 * @desc 角色加入或离开队伍时使用的音效。
 *
 * @param PartySEName
 * @text 入队离队-音效文件名
 * @parent PartySE
 * @type file
 * @require 1
 * @dir audio/se/
 * @desc 音效文件名，留空则回退到默认音效。
 * @default 
 *
 * @param PartySEVolume
 * @text 入队离队-音量
 * @parent PartySE
 * @type number
 * @min 0
 * @max 100
 * @desc 音量（0-100），默认80。
 * @default 80
 *
 * @param PartySEPitch
 * @text 入队离队-音调
 * @parent PartySE
 * @type number
 * @min 50
 * @max 150
 * @desc 音调（50-150），默认100。
 * @default 100
 *
 * @param ExpSE
 * @text ====经验得失音效====
 * @desc 角色获得或失去经验时使用的音效。
 *
 * @param ExpSEName
 * @text 经验得失-音效文件名
 * @parent ExpSE
 * @type file
 * @require 1
 * @dir audio/se/
 * @desc 音效文件名，留空则回退到默认音效。
 * @default 
 *
 * @param ExpSEVolume
 * @text 经验得失-音量
 * @parent ExpSE
 * @type number
 * @min 0
 * @max 100
 * @desc 音量（0-100），默认80。
 * @default 80
 *
 * @param ExpSEPitch
 * @text 经验得失-音调
 * @parent ExpSE
 * @type number
 * @min 50
 * @max 150
 * @desc 音调（50-150），默认100。
 * @default 100
 *
 * @param LevelUpSE
 * @text ====角色升级音效====
 * @desc 角色升级时使用的音效。
 *
 * @param LevelUpSEName
 * @text 升级-音效文件名
 * @parent LevelUpSE
 * @type file
 * @require 1
 * @dir audio/se/
 * @desc 音效文件名，留空则回退到默认音效。
 * @default 
 *
 * @param LevelUpSEVolume
 * @text 升级-音量
 * @parent LevelUpSE
 * @type number
 * @min 0
 * @max 100
 * @desc 音量（0-100），默认80。
 * @default 80
 *
 * @param LevelUpSEPitch
 * @text 升级-音调
 * @parent LevelUpSE
 * @type number
 * @min 50
 * @max 150
 * @desc 音调（50-150），默认100。
 * @default 100
 *
 * @param MasterySE
 * @text ====技能精通音效====
 * @desc 技能熟练度达到精通时使用的音效。（需安装 GF_EasySkillMastery）
 *
 * @param MasterySEName
 * @text 精通-音效文件名
 * @parent MasterySE
 * @type file
 * @require 1
 * @dir audio/se/
 * @desc 音效文件名，留空则回退到默认音效。
 * @default 
 *
 * @param MasterySEVolume
 * @text 精通-音量
 * @parent MasterySE
 * @type number
 * @min 0
 * @max 100
 * @desc 音量（0-100），默认80。
 * @default 80
 *
 * @param MasterySEPitch
 * @text 精通-音调
 * @parent MasterySE
 * @type number
 * @min 50
 * @max 150
 * @desc 音调（50-150），默认100。
 * @default 100
 *
 * @param QuestSE
 * @text ====任务系统音效====
 * @desc 接受/放弃/完成/失败任务时使用的音效。（需安装 GF_3_QuestSystem）
 *
 * @param QuestSEName
 * @text 任务-音效文件名
 * @parent QuestSE
 * @type file
 * @require 1
 * @dir audio/se/
 * @desc 音效文件名，留空则回退到默认音效。
 * @default 
 *
 * @param QuestSEVolume
 * @text 任务-音量
 * @parent QuestSE
 * @type number
 * @min 0
 * @max 100
 * @desc 音量（0-100），默认80。
 * @default 80
 *
 * @param QuestSEPitch
 * @text 任务-音调
 * @parent QuestSE
 * @type number
 * @min 50
 * @max 150
 * @desc 音调（50-150），默认100。
 * @default 100
 *
 * @param GlossarySE
 * @text ====词典解锁通知音效====
 * @desc 词典条目解锁时使用的音效。（需安装 GF_3_ExternalGlossary）
 *
 * @param GlossarySEName
 * @text 词典解锁-音效文件名
 * @parent GlossarySE
 * @type file
 * @require 1
 * @dir audio/se/
 * @desc 音效文件名，留空则回退到默认音效。
 * @default 
 *
 * @param GlossarySEVolume
 * @text 词典解锁-音量
 * @parent GlossarySE
 * @type number
 * @min 0
 * @max 100
 * @desc 音量（0-100），默认80。
 * @default 80
 *
 * @param GlossarySEPitch
 * @text 词典解锁-音调
 * @parent GlossarySE
 * @type number
 * @min 50
 * @max 150
 * @desc 音调（50-150），默认100。
 * @default 100
 *
 */
//=============================================================================

if (!Imported.GF_3_ToastSystem) {
    alert("错误:未找到前置插件 GF_3_ToastSystem。\n请确保已安装并启用 GF_3_ToastSystem 插件,并将其放置在 GF_ToastSE 插件之前。");
}

//=============================================================================
// Parameter Variables
//=============================================================================

GF.Parameters = PluginManager.parameters(GF.TSE.pluginName);
GF.Param = GF.Param || {};

GF.Param.TSEDefaultSE = {
    name: String(GF.Parameters['DefaultSEName'] || ''),
    volume: Number(GF.Parameters['DefaultSEVolume'] || 80),
    pitch: Number(GF.Parameters['DefaultSEPitch'] || 100),
};

GF.Param.TSEItemSE = {
    name: String(GF.Parameters['ItemSEName'] || ''),
    volume: Number(GF.Parameters['ItemSEVolume'] || 80),
    pitch: Number(GF.Parameters['ItemSEPitch'] || 100),
};

GF.Param.TSEGoldSE = {
    name: String(GF.Parameters['GoldSEName'] || ''),
    volume: Number(GF.Parameters['GoldSEVolume'] || 80),
    pitch: Number(GF.Parameters['GoldSEPitch'] || 100),
};

GF.Param.TSESkillSE = {
    name: String(GF.Parameters['SkillSEName'] || ''),
    volume: Number(GF.Parameters['SkillSEVolume'] || 80),
    pitch: Number(GF.Parameters['SkillSEPitch'] || 100),
};

GF.Param.TSEPartySE = {
    name: String(GF.Parameters['PartySEName'] || ''),
    volume: Number(GF.Parameters['PartySEVolume'] || 80),
    pitch: Number(GF.Parameters['PartySEPitch'] || 100),
};

GF.Param.TSEExpSE = {
    name: String(GF.Parameters['ExpSEName'] || ''),
    volume: Number(GF.Parameters['ExpSEVolume'] || 80),
    pitch: Number(GF.Parameters['ExpSEPitch'] || 100),
};

GF.Param.TSELevelUpSE = {
    name: String(GF.Parameters['LevelUpSEName'] || ''),
    volume: Number(GF.Parameters['LevelUpSEVolume'] || 80),
    pitch: Number(GF.Parameters['LevelUpSEPitch'] || 100),
};

GF.Param.TSEMasterySE = {
    name: String(GF.Parameters['MasterySEName'] || ''),
    volume: Number(GF.Parameters['MasterySEVolume'] || 80),
    pitch: Number(GF.Parameters['MasterySEPitch'] || 100),
};

GF.Param.TSEQuestSE = {
    name: String(GF.Parameters['QuestSEName'] || ''),
    volume: Number(GF.Parameters['QuestSEVolume'] || 80),
    pitch: Number(GF.Parameters['QuestSEPitch'] || 100),
};

GF.Param.TSEGlossarySE = {
    name: String(GF.Parameters['GlossarySEName'] || ''),
    volume: Number(GF.Parameters['GlossarySEVolume'] || 80),
    pitch: Number(GF.Parameters['GlossarySEPitch'] || 100),
};

//=============================================================================
// Type Constants
//=============================================================================

GF.TSE.TYPE = {
    DEFAULT:  0,   // 默认（自定义文本等）
    ITEM:     1,   // 物品/武器/防具得失
    GOLD:     2,   // 金钱得失
    SKILL:    3,   // 技能习得/遗忘
    PARTY:    4,   // 角色入队/离队
    EXP:      5,   // 经验得失
    LEVEL_UP: 6,   // 角色升级
    QUEST:    7,   // 任务系统
    MASTERY:  8,   // 技能精通（GF_EasySkillMastery）
    GLOSSARY: 9,   // 词典解锁（GF_3_ExternalGlossary）
};

// Type → param mapping
GF.TSE._typeToParam = {};
GF.TSE._typeToParam[GF.TSE.TYPE.DEFAULT]  = GF.Param.TSEDefaultSE;
GF.TSE._typeToParam[GF.TSE.TYPE.ITEM]     = GF.Param.TSEItemSE;
GF.TSE._typeToParam[GF.TSE.TYPE.GOLD]     = GF.Param.TSEGoldSE;
GF.TSE._typeToParam[GF.TSE.TYPE.SKILL]    = GF.Param.TSESkillSE;
GF.TSE._typeToParam[GF.TSE.TYPE.PARTY]    = GF.Param.TSEPartySE;
GF.TSE._typeToParam[GF.TSE.TYPE.EXP]      = GF.Param.TSEExpSE;
GF.TSE._typeToParam[GF.TSE.TYPE.LEVEL_UP] = GF.Param.TSELevelUpSE;
GF.TSE._typeToParam[GF.TSE.TYPE.QUEST]    = GF.Param.TSEQuestSE;
GF.TSE._typeToParam[GF.TSE.TYPE.MASTERY]  = GF.Param.TSEMasterySE;
GF.TSE._typeToParam[GF.TSE.TYPE.GLOSSARY] = GF.Param.TSEGlossarySE;

//=============================================================================
// Game_Temp — batch accumulator & type tracking
//=============================================================================

// > 初始化
GF.TSE.Game_Temp_initialize = Game_Temp.prototype.initialize;
Game_Temp.prototype.initialize = function () {
    GF.TSE.Game_Temp_initialize.call(this);
    this._drill_GFTH_TSE_type = GF.TSE.TYPE.DEFAULT;      // 当前待标记类型
    this._drill_GFTH_TSE_batchTypes = new Set();            // 本批次累计的类型
};

// > 设置当前推送类型（由各toast方法调用）
Game_Temp.prototype.drill_GFTH_TSE_setType = function (type) {
    this._drill_GFTH_TSE_type = type;
};

// > 收集并清空批次类型，返回类型集合的数组
Game_Temp.prototype.drill_GFTH_TSE_flushBatchTypes = function () {
    const types = this._drill_GFTH_TSE_batchTypes;
    this._drill_GFTH_TSE_batchTypes = new Set();
    return Array.from(types);
};

//=============================================================================
// Game_Temp — monkey-patch pushNewText to tag data with type
//=============================================================================

GF.TSE.Game_Temp_pushNewText = Game_Temp.prototype.drill_GFTH_pushNewText;
Game_Temp.prototype.drill_GFTH_pushNewText = function (text) {
    const type = this._drill_GFTH_TSE_type;
    this._drill_GFTH_TSE_type = GF.TSE.TYPE.DEFAULT;       // 重置
    const prevLength = this._drill_GFTH_commandSeq.length;
    GF.TSE.Game_Temp_pushNewText.call(this, text);
    // 仅当确实有数据被推入时标记
    if (this._drill_GFTH_commandSeq.length > prevLength) {
        this._drill_GFTH_commandSeq[this._drill_GFTH_commandSeq.length - 1]['_tse_type'] = type;
        this._drill_GFTH_TSE_batchTypes.add(type);
    }
};

//=============================================================================
// Patch: 物品/武器/防具 — Game_Party
//=============================================================================

GF.TSE.Game_Party_gainItemToast = Game_Party.prototype.gainItemToast;
Game_Party.prototype.gainItemToast = function (item, amount) {
    $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.ITEM);
    GF.TSE.Game_Party_gainItemToast.call(this, item, amount);
    $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.DEFAULT);
};

GF.TSE.Game_Party_gainGoldToast = Game_Party.prototype.gainGoldToast;
Game_Party.prototype.gainGoldToast = function (amount) {
    $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.GOLD);
    GF.TSE.Game_Party_gainGoldToast.call(this, amount);
    $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.DEFAULT);
};

// 独立装备得失（需 GF_3_IndependEquipSystem）
if (Imported.GF_3_IndependEquipSystem && Game_Party.prototype.gainIndependEquipToast) {
    GF.TSE.Game_Party_gainIndependEquipToast = Game_Party.prototype.gainIndependEquipToast;
    Game_Party.prototype.gainIndependEquipToast = function (item, amount, list) {
        $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.ITEM);
        GF.TSE.Game_Party_gainIndependEquipToast.call(this, item, amount, list);
        $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.DEFAULT);
    };
}

//=============================================================================
// Patch: 技能 — Game_Actor
//=============================================================================

GF.TSE.Game_Actor_learnSkillToast = Game_Actor.prototype.learnSkillToast;
Game_Actor.prototype.learnSkillToast = function (skillId, isLearn) {
    $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.SKILL);
    GF.TSE.Game_Actor_learnSkillToast.call(this, skillId, isLearn);
    $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.DEFAULT);
};

//=============================================================================
// Patch: 入队/离队 — Game_Party
//=============================================================================

GF.TSE.Game_Party_addActorToast = Game_Party.prototype.addActorToast;
Game_Party.prototype.addActorToast = function (actorId, isIn) {
    $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.PARTY);
    GF.TSE.Game_Party_addActorToast.call(this, actorId, isIn);
    $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.DEFAULT);
};

//=============================================================================
// Patch: 经验 — Game_Actor
//=============================================================================

GF.TSE.Game_Actor_gainExpToast = Game_Actor.prototype.gainExpToast;
Game_Actor.prototype.gainExpToast = function (amount) {
    $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.EXP);
    GF.TSE.Game_Actor_gainExpToast.call(this, amount);
    $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.DEFAULT);
};

//=============================================================================
// Patch: 升级 — Game_Actor
//=============================================================================

GF.TSE.Game_Actor_levelUpToast = Game_Actor.prototype.levelUpToast;
Game_Actor.prototype.levelUpToast = function () {
    $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.LEVEL_UP);
    GF.TSE.Game_Actor_levelUpToast.call(this);
    $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.DEFAULT);
};

//=============================================================================
// Patch: 任务系统 — Game_Quest（条件加载）
//=============================================================================

if (Imported.GF_3_QuestSystem) {
    GF.TSE.Game_Quest_pushToastText = Game_Quest.prototype.pushToastText;
    Game_Quest.prototype.pushToastText = function (type) {
        $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.QUEST);
        GF.TSE.Game_Quest_pushToastText.call(this, type);
        $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.DEFAULT);
    };
}

//=============================================================================
// Patch: GF_3_ExternalGlossary — 词典解锁通知类型标记
//=============================================================================

if (Imported.GF_3_ExternalGlossary && GlossaryManager._pushUnlockToast) {

    GF.TSE.GlossaryManager__pushUnlockToast = GlossaryManager._pushUnlockToast;
    GlossaryManager._pushUnlockToast = function (typeId, entryId) {
        $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.GLOSSARY);
        GF.TSE.GlossaryManager__pushUnlockToast.call(this, typeId, entryId);
        $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.DEFAULT);
    };
}

//=============================================================================
// SE Helper
//=============================================================================

/**
 * 根据批次中收集的类型集合，决定播放哪个音效。
 *   - 仅一种类型：播放该类型的音效；若该类型文件名为空，则回退到默认音效。
 *   - 多种类型：播放默认音效。
 *   - 默认音效文件名为空：不播放。
 */
GF.TSE.playBatchSE = function (typeArray) {
    if (!typeArray || typeArray.length === 0) return;

    // 去重
    const uniqueTypes = [...new Set(typeArray)];

    let seParam;
    if (uniqueTypes.length === 1) {
        seParam = GF.TSE._typeToParam[uniqueTypes[0]];
        // 当前类型文件名为空 → 回退默认
        if (!seParam || !seParam.name) {
            seParam = GF.Param.TSEDefaultSE;
        }
    } else {
        // 混合类型 → 默认
        seParam = GF.Param.TSEDefaultSE;
    }

    if (!seParam || !seParam.name) return;

    AudioManager.playSe({
        name: seParam.name,
        volume: seParam.volume,
        pitch: seParam.pitch,
        pan: 0,
    });
};

//=============================================================================
// Patch: Scene_Map — 批次结束时播放音效
//=============================================================================

GF.TSE.Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function () {
    // 先收集并清空在本帧之前累积的批次类型
    const batchTypes = $gameTemp.drill_GFTH_TSE_flushBatchTypes();

    GF.TSE.Scene_Map_update.call(this);

    // 在原update执行期间可能又有新的push（通过drill_GFTH_updateWindowAddChild间接触发的情况极少，
    // 但这里也收集一次，确保不遗漏）
    const batchTypes2 = $gameTemp.drill_GFTH_TSE_flushBatchTypes();

    const allTypes = batchTypes.concat(batchTypes2);
    if (allTypes.length > 0) {
        GF.TSE.playBatchSE(allTypes);
    }
};

//=============================================================================
// Patch: Scene_MenuBase — 批次结束时播放音效
//=============================================================================

GF.TSE.Scene_MenuBase_update = Scene_MenuBase.prototype.update;
Scene_MenuBase.prototype.update = function () {
    const batchTypes = $gameTemp.drill_GFTH_TSE_flushBatchTypes();

    GF.TSE.Scene_MenuBase_update.call(this);

    const batchTypes2 = $gameTemp.drill_GFTH_TSE_flushBatchTypes();

    const allTypes = batchTypes.concat(batchTypes2);
    if (allTypes.length > 0) {
        GF.TSE.playBatchSE(allTypes);
    }
};

//=============================================================================
// Patch: GF_EasySkillMastery — 精通通知类型标记 & 战斗内音效
//=============================================================================

if (Imported.GF_EasySkillMastery) {

    // > 标记精通通知的类型
    //   GF_EasySkillMastery 在 paySkillCost 中调用 ToastManager.addTextWithStyle，
    //   我们需要在 pushNewText 之前把类型设为 MASTERY。
    //   这里再包一层 paySkillCost，在原始调用前检测是否即将触发精通通知。
    GF.TSE.Game_BattlerBase_paySkillCost = Game_BattlerBase.prototype.paySkillCost;
    Game_BattlerBase.prototype.paySkillCost = function (skill) {
        let willNotify = false;
        if (GF.Param.ESMEnableNotify && Imported.GF_3_ToastSystem) {
            if (this.isActor && this.isActor() &&
                typeof this.isSkillMasteryTracked === 'function' &&
                this.isSkillMasteryTracked(skill)) {
                const oldCount = this.skillMasteryCount(skill.id);
                const threshold = this.skillMasteryMax(skill);
                if (oldCount < threshold && oldCount + 1 >= threshold) {
                    willNotify = true;
                }
            }
        }

        if (willNotify) {
            $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.MASTERY);
        }

        GF.TSE.Game_BattlerBase_paySkillCost.call(this, skill);

        if (willNotify) {
            $gameTemp.drill_GFTH_TSE_setType(GF.TSE.TYPE.DEFAULT);
        }
    };

    // > 战斗场景 — 批次音效钩子
    //   GF_EasySkillMastery 为 Scene_Battle 添加了完整的 toast 渲染管线，
    //   但 GF_ToastSE 原本只监听 Scene_Map / Scene_MenuBase。
    //   这里给 Scene_Battle 也加上批次音效刷新，确保战斗中精通通知的音效实时播放。
    GF.TSE.Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function () {
        const batchTypes = $gameTemp.drill_GFTH_TSE_flushBatchTypes();

        GF.TSE.Scene_Battle_update.call(this);

        const batchTypes2 = $gameTemp.drill_GFTH_TSE_flushBatchTypes();

        const allTypes = batchTypes.concat(batchTypes2);
        if (allTypes.length > 0) {
            GF.TSE.playBatchSE(allTypes);
        }
    };

}
