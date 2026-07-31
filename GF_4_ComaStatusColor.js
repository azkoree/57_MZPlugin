//=============================================================================
// GF Plugins
// GF_4_ComaStatusColor.js
//=============================================================================

var Imported = Imported || {};
Imported.GF_4_ComaStatusColor = true;

var GF = GF || {};
GF.CSC = GF.CSC || {};
GF.CSC.version = 1.03;
GF.CSC.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.03]        界面 - 详细信息/状态画面颜色/显示/字体
 * @author 用户指定
 * @url https://afdian.net/a/ganfly
 * @orderAfter GF_1_CoreOfMenuActor
 * @base GF_1_CoreOfMenuActor
 * @orderAfter GF_0_CoreOfGame
 * @base GF_0_CoreOfGame
 * @orderAfter GF_2_CoreOfPartyStatus
 * @base GF_2_CoreOfPartyStatus
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 *
 * 本插件是角色信息框核心(GF_1_CoreOfMenuActor)的扩展补丁，为角色详细信息
 * 窗口（ActorStatusSet）提供每个样式独立的精细控制。
 *
 * 支持的覆盖控制：
 *   1. 属性名称颜色 / 数值颜色（按样式单独设置）
 *   2. 名称/等级/职业的显示/隐藏覆盖
 *   3. 名称/等级/职业的字体颜色覆盖
 *   4. 名称/等级/职业的字号覆盖
 *   5. 名称/等级/职业的字体文件覆盖
 *   6. 状态画面中「角色参数」「元素抗性」「状态抗性」的属性/数值颜色设置
 *
 * 本插件同时支持装备界面中的详细信息窗口（Window_EquipStatusParamList），
 * 确保在装备界面中属性颜色、显示覆盖、字号字体等设置同样生效，并与移除
 * 装备对比的插件（如 AAGFEquip2）兼容。
 *
 * 在状态画面中，本插件额外支持三个页签的颜色调整：
 *   - 角色参数（Window_StatusParamPlus）：参数名称和数值的颜色
 *   - 元素抗性（Window_StatusElement）：元素名称和抗性数值的颜色
 *   - 状态抗性（Window_StatusState）：状态名称和抗性数值的颜色
 *
 * 原版插件中，属性名称固定使用「系统颜色」，数值固定使用「基础颜色」，
 * 名称使用 HP 颜色（随血量变化），等级使用控制字符定义的颜色，
 * 职业使用基础颜色。本插件允许你为每个详细信息窗口样式分别覆盖这些值。
 *
 * ============================================================================
 *  前置需求
 * ============================================================================
 *
 * ---- 前置插件列表 ----
 *
 * GF_0_CoreOfGame               系统 - 游戏核心
 * GF_1_CoreOfMenuActor          系统 - 角色信息框核心
 * GF_2_CoreOfPartyStatus        （可选）状态画面 - 角色参数/元素抗性/状态抗性
 *
 * ---- 第4层 ----
 *
 * 这个插件是第4层插件，必须放在第0、1层插件的下面。
 * 如需使用状态画面颜色调整功能，需要在 GF_2_CoreOfPartyStatus 之后加载。
 *
 * ============================================================================
 *  使用方法
 * ============================================================================
 *
 * 1. 在插件参数「颜色样式配置」中，添加你要控制的详细信息窗口样式条目。
 * 2. 每个条目需要指定：
 *    - 样式ID：对应 ActorStatusSet 中的第几个样式（从1开始）
 *    - 属性颜色 / 数值颜色：分别控制参数名称和数值的颜色
 *    - 名称/等级/职业 的字体颜色、显示覆盖、字号、字体
 * 3. 颜色编号规则：
 *    - 0：使用默认颜色（属性名称=系统颜色，数值=基础颜色）
 *    - 1～200：使用 GF 普通颜色配置中的颜色编号
 *    - 201～400：使用 GF 高级渐变颜色配置中的颜色编号（201=1号高级颜色）
 * 4. 显示覆盖规则：
 *    - 使用默认：沿用 ActorStatusSet 中的设置
 *    - 强制显示：无论原设置如何，强制显示该项
 *    - 强制隐藏：无论原设置如何，强制隐藏该项
 * 5. 字号规则：
 *    - 0：使用窗口默认字号
 *    - >0：使用指定的字号（像素）
 * 6. 字体规则：
 *    - 留空：使用窗口默认字体
 *    - 填写字体名称：使用文本核心中加载的自定义字体
 * 7. 状态画面颜色设置：
 *    - 在插件参数「状态参数 - 属性颜色」「状态参数 - 数值颜色」
 *      「元素抗性 - 属性颜色」「元素抗性 - 数值颜色」
 *      「状态抗性 - 属性颜色」「状态抗性 - 数值颜色」中，
 *      分别设置状态画面中三个页签的属性名称颜色和数值颜色。
 *    - 颜色编号规则同上（0=使用默认，1-200=普通颜色，201-400=高级颜色）。
 *
 * ============================================================================
 *  兼容性
 * ============================================================================
 *
 * 本插件修改以下类的方法，不影响其他功能：
 *   Window_ActorStatusParamList:
 *     - paramName()       - 属性名称颜色
 *     - drawParam()       - 属性数值颜色
 *     - customParamName() - 自定义属性名称颜色
 *     - drawCustomParam() - 自定义属性数值颜色
 *   Window_ActorStatus:
 *     - refresh()         - 名称/等级/职业的显示覆盖
 *     - drawActorLevel()  - 等级的颜色/字号/字体覆盖
 *     - drawActorName()   - 名称的颜色/字号/字体覆盖
 *     - drawActorClass()  - 职业的颜色/字号/字体覆盖
 *   Window_EquipStatusParamList:
 *     - drawParam()       - 装备界面属性名称/数值颜色（适配无对比模式）
 *     - drawCustomParam() - 装备界面自定义属性名称/数值颜色
 *   Window_StatusParamPlus:
 *     - drawParamName()   - 状态画面角色参数名称颜色
 *     - drawCurrentParam() - 状态画面角色参数数值颜色
 *   Window_StatusElement:
 *     - drawElementName() - 状态画面元素抗性名称颜色
 *     - drawElementRate() - 状态画面元素抗性数值颜色
 *   Window_StatusState:
 *     - drawStateName()   - 状态画面状态抗性名称颜色
 *     - drawStateRate()   - 状态画面状态抗性数值颜色
 *
 * ============================================================================
 *  备注（notetag）
 * ============================================================================
 *
 * 无
 *
 * ============================================================================
 *  插件指令
 * ============================================================================
 *
 * 无
 *
 * ============================================================================
 *  脚本接口
 * ============================================================================
 *
 * GF.CSC.getAttrColor(styleId)      - 获取指定样式的属性颜色编号
 * GF.CSC.getValueColor(styleId)     - 获取指定样式的数值颜色编号
 * GF.CSC.getShowName(styleId)       - 获取名称显示覆盖（0=默认/1=显示/2=隐藏）
 * GF.CSC.getShowLevel(styleId)      - 获取等级显示覆盖
 * GF.CSC.getShowClass(styleId)      - 获取职业显示覆盖
 * GF.CSC.getNameColor(styleId)      - 获取名称颜色编号
 * GF.CSC.getNameFontSize(styleId)   - 获取名称字号覆盖
 * GF.CSC.getNameFontFace(styleId)   - 获取名称字体覆盖
 * GF.CSC.getLevelColor(styleId)     - 获取等级颜色编号
 * GF.CSC.getLevelFontSize(styleId)  - 获取等级字号覆盖
 * GF.CSC.getLevelFontFace(styleId)  - 获取等级字体覆盖
 * GF.CSC.getClassColor(styleId)     - 获取职业颜色编号
 * GF.CSC.getClassFontSize(styleId)  - 获取职业字号覆盖
 * GF.CSC.getClassFontFace(styleId)  - 获取职业字体覆盖
 * GF.CSC.getStatusParamAttrColor()  - 获取状态参数名称颜色编号
 * GF.CSC.getStatusParamValueColor() - 获取状态参数数值颜色编号
 * GF.CSC.getStatusElementAttrColor()  - 获取元素抗性名称颜色编号
 * GF.CSC.getStatusElementValueColor() - 获取元素抗性数值颜色编号
 * GF.CSC.getStatusStateAttrColor()    - 获取状态抗性名称颜色编号
 * GF.CSC.getStatusStateValueColor()   - 获取状态抗性数值颜色编号
 *
 * ============================================================================
 *  更新日志
 * ============================================================================
 *
 * [v1.00] 完成插件。
 * [v1.01] 增加名称/等级/职业的显示覆盖、字号、字体设置。
 * [v1.02] 增加名称/等级/职业的字体颜色设置。
 * [v1.03] 增加状态画面「角色参数」「元素抗性」「状态抗性」的颜色设置。
 *
 * ============================================================================
 *  帮助结束
 * ============================================================================
 *
 * @ ==========================================================================
 * @ 插件参数
 * @ ==========================================================================
 *
 * @param StatusColorSet
 * @text 颜色样式配置
 * @type struct<StatusColorConfig>[]
 * @desc 为每个详细信息窗口样式分别配置颜色、显示、字号和字体覆盖。
 * @default []
 *
 * @param StatusParamAttrColor
 * @text 状态参数 - 属性颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 状态画面「角色参数」页签的参数名称颜色编号。0=使用默认系统颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param StatusParamValueColor
 * @text 状态参数 - 数值颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 状态画面「角色参数」页签的参数数值颜色编号。0=使用默认基础颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param StatusElementAttrColor
 * @text 元素抗性 - 属性颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 状态画面「元素抗性」页签的元素名称颜色编号。0=使用默认系统颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param StatusElementValueColor
 * @text 元素抗性 - 数值颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 状态画面「元素抗性」页签的抗性数值颜色编号。0=使用默认基础颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param StatusStateAttrColor
 * @text 状态抗性 - 属性颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 状态画面「状态抗性」页签的状态名称颜色编号。0=使用默认系统颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param StatusStateValueColor
 * @text 状态抗性 - 数值颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 状态画面「状态抗性」页签的抗性数值颜色编号。0=使用默认基础颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 */
/* ---------------------------------------------------------------------------
 * struct<StatusColorConfig>
 * ---------------------------------------------------------------------------
 */
/*~struct~StatusColorConfig:
 *
 * @param Note
 * @text 标签
 * @desc 只用于方便区分查看的标签，不作用在插件中。
 * @default ==新的颜色样式==
 *
 * @param StyleId
 * @text 样式ID
 * @type number
 * @min 1
 * @desc 对应角色详细信息窗口样式（ActorStatusSet）中的第几个样式（从1开始）
 * @default 1
 *
 * @param AttributeColor
 * @text 属性颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 属性名称的颜色编号。0=使用默认系统颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param ValueColor
 * @text 数值颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 属性数值的颜色编号。0=使用默认基础颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param NameOverride
 * @text ====名称覆盖====
 *
 * @param NameColor
 * @text 名称颜色
 * @parent NameOverride
 * @type number
 * @min 0
 * @max 400
 * @desc 名称文字的字体颜色编号。0=使用默认HP颜色（随血量变化），1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param ShowName
 * @text 显示名称
 * @parent NameOverride
 * @type select
 * @option 使用默认
 * @value 0
 * @option 强制显示
 * @value 1
 * @option 强制隐藏
 * @value 2
 * @desc 覆盖ActorStatusSet中的"显示名称"设置。0=沿用原设置，1=强制显示，2=强制隐藏。
 * @default 0
 *
 * @param NameFontSize
 * @text 名称字号
 * @parent NameOverride
 * @type number
 * @min 0
 * @desc 名称的字体大小（像素）。0=使用窗口默认字号。
 * @default 0
 *
 * @param NameFontFace
 * @text 名称字体
 * @parent NameOverride
 * @desc 名称的字体名称，必须填文本核心>>额外字体加载设置中的字体名称。留空使用默认。
 * @default
 *
 * @param LevelOverride
 * @text ====等级覆盖====
 *
 * @param LevelColor
 * @text 等级颜色
 * @parent LevelOverride
 * @type number
 * @min 0
 * @max 400
 * @desc 等级文字的字体颜色编号。0=使用默认控制字符颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param ShowLevel
 * @text 显示等级
 * @parent LevelOverride
 * @type select
 * @option 使用默认
 * @value 0
 * @option 强制显示
 * @value 1
 * @option 强制隐藏
 * @value 2
 * @desc 覆盖ActorStatusSet中的"显示等级"设置。0=沿用原设置，1=强制显示，2=强制隐藏。
 * @default 0
 *
 * @param LevelFontSize
 * @text 等级字号
 * @parent LevelOverride
 * @type number
 * @min 0
 * @desc 等级的字体大小（像素）。0=使用窗口默认字号。
 * @default 0
 *
 * @param LevelFontFace
 * @text 等级字体
 * @parent LevelOverride
 * @desc 等级的字体名称，必须填文本核心>>额外字体加载设置中的字体名称。留空使用默认。
 * @default
 *
 * @param ClassOverride
 * @text ====职业覆盖====
 *
 * @param ClassColor
 * @text 职业颜色
 * @parent ClassOverride
 * @type number
 * @min 0
 * @max 400
 * @desc 职业文字的字体颜色编号。0=使用默认基础颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param ShowClass
 * @text 显示职业
 * @parent ClassOverride
 * @type select
 * @option 使用默认
 * @value 0
 * @option 强制显示
 * @value 1
 * @option 强制隐藏
 * @value 2
 * @desc 覆盖ActorStatusSet中的"显示职业"设置。0=沿用原设置，1=强制显示，2=强制隐藏。
 * @default 0
 *
 * @param ClassFontSize
 * @text 职业字号
 * @parent ClassOverride
 * @type number
 * @min 0
 * @desc 职业的字体大小（像素）。0=使用窗口默认字号。
 * @default 0
 *
 * @param ClassFontFace
 * @text 职业字体
 * @parent ClassOverride
 * @desc 职业的字体名称，必须填文本核心>>额外字体加载设置中的字体名称。留空使用默认。
 * @default
 *
 */
//=============================================================================

//=============================================================================
// Parameter Variables
//=============================================================================

GF.Parameters = PluginManager.parameters(GF.CSC.pluginName);
GF.Param = GF.Param || {};

GF.CSC.StatusColorSet = (() => {
    const list = JSON.parse(GF.Parameters['StatusColorSet'] || '[]');
    const map = {};
    for (let i = 0; i < list.length; i++) {
        const data = JSON.parse(list[i] || '{}');
        const styleId = Number(data['StyleId'] || 1);
        map[styleId] = {
            // Colors
            attrColor: Number(data['AttributeColor'] || 0),
            valueColor: Number(data['ValueColor'] || 0),
            // Name
            nameColor: Number(data['NameColor'] || 0),
            showName: Number(data['ShowName'] || 0),
            nameFontSize: Number(data['NameFontSize'] || 0),
            nameFontFace: String(data['NameFontFace'] || ''),
            // Level
            levelColor: Number(data['LevelColor'] || 0),
            showLevel: Number(data['ShowLevel'] || 0),
            levelFontSize: Number(data['LevelFontSize'] || 0),
            levelFontFace: String(data['LevelFontFace'] || ''),
            // Class
            classColor: Number(data['ClassColor'] || 0),
            showClass: Number(data['ShowClass'] || 0),
            classFontSize: Number(data['ClassFontSize'] || 0),
            classFontFace: String(data['ClassFontFace'] || '')
        };
    }
    return map;
})();

//------------------------------------------------------------------------------
// Status screen color configs (v1.03)
//------------------------------------------------------------------------------

GF.CSC.StatusParamAttrColor = Number(GF.Parameters['StatusParamAttrColor'] || 0);
GF.CSC.StatusParamValueColor = Number(GF.Parameters['StatusParamValueColor'] || 0);
GF.CSC.StatusElementAttrColor = Number(GF.Parameters['StatusElementAttrColor'] || 0);
GF.CSC.StatusElementValueColor = Number(GF.Parameters['StatusElementValueColor'] || 0);
GF.CSC.StatusStateAttrColor = Number(GF.Parameters['StatusStateAttrColor'] || 0);
GF.CSC.StatusStateValueColor = Number(GF.Parameters['StatusStateValueColor'] || 0);

//------------------------------------------------------------------------------
// Color helpers (from v1.00)
//------------------------------------------------------------------------------

/**
 * 获取指定样式ID的属性颜色编号。
 * @param {number} styleId - 样式ID（1-based）
 * @returns {number} 颜色编号，0=使用默认
 */
GF.CSC.getAttrColor = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.attrColor : 0;
};

/**
 * 获取指定样式ID的数值颜色编号。
 * @param {number} styleId - 样式ID（1-based）
 * @returns {number} 颜色编号，0=使用默认
 */
GF.CSC.getValueColor = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.valueColor : 0;
};

//------------------------------------------------------------------------------
// Name/Level/Class color helpers (v1.02)
//------------------------------------------------------------------------------

/**
 * 获取名称颜色编号。0=使用默认（HP颜色）。
 */
GF.CSC.getNameColor = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.nameColor : 0;
};

/**
 * 获取等级颜色编号。0=使用默认。
 */
GF.CSC.getLevelColor = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.levelColor : 0;
};

/**
 * 获取职业颜色编号。0=使用默认（基础颜色）。
 */
GF.CSC.getClassColor = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.classColor : 0;
};

//------------------------------------------------------------------------------
// Display override helpers (v1.01)
//------------------------------------------------------------------------------

/**
 * 获取名称显示覆盖。0=默认，1=强制显示，2=强制隐藏。
 */
GF.CSC.getShowName = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.showName : 0;
};

/**
 * 获取等级显示覆盖。0=默认，1=强制显示，2=强制隐藏。
 */
GF.CSC.getShowLevel = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.showLevel : 0;
};

/**
 * 获取职业显示覆盖。0=默认，1=强制显示，2=强制隐藏。
 */
GF.CSC.getShowClass = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.showClass : 0;
};

//------------------------------------------------------------------------------
// Font helpers (v1.01)
//------------------------------------------------------------------------------

/**
 * 获取名称字号覆盖。0=使用默认。
 */
GF.CSC.getNameFontSize = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.nameFontSize : 0;
};

/**
 * 获取名称字体覆盖。空串=使用默认。
 */
GF.CSC.getNameFontFace = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.nameFontFace : '';
};

/**
 * 获取等级字号覆盖。0=使用默认。
 */
GF.CSC.getLevelFontSize = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.levelFontSize : 0;
};

/**
 * 获取等级字体覆盖。空串=使用默认。
 */
GF.CSC.getLevelFontFace = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.levelFontFace : '';
};

/**
 * 获取职业字号覆盖。0=使用默认。
 */
GF.CSC.getClassFontSize = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.classFontSize : 0;
};

/**
 * 获取职业字体覆盖。空串=使用默认。
 */
GF.CSC.getClassFontFace = function(styleId) {
    const config = GF.CSC.StatusColorSet[styleId];
    return config ? config.classFontFace : '';
};

//=============================================================================
// Common helpers
//=============================================================================

/**
 * 获取当前窗口使用的 ActorStatusSet 样式 ID。
 * 通过 _actorStatusData 反查其在 GF.COMA.ActorStatusSet 中的索引。
 */
GF.CSC.getStatusStyleId = function(windowObj) {
    const data = windowObj._actorStatusData;
    if (!data) return 0;
    const list = GF.COMA.ActorStatusSet;
    for (let i = 1; i < list.length; i++) {
        if (list[i] === data) return i;
    }
    return 0;
};

/**
 * 应用字体设置到指定的 Window 对象上。
 * @param {Window_Base} windowObj - 窗口对象
 * @param {number} fontSize - 字号（0=不修改）
 * @param {string} fontFace - 字体名称（空串=不修改）
 */
GF.CSC.applyFontSettings = function(windowObj, fontSize, fontFace) {
    if (fontSize > 0) {
        windowObj.contents.fontSize = fontSize;
    }
    if (fontFace && fontFace !== '') {
        if (FontManager.isCustomFontLoaded(fontFace)) {
            windowObj.contents.fontFace = fontFace;
        }
    }
};

//------------------------------------------------------------------------------
// Status screen color helpers (v1.03)
//------------------------------------------------------------------------------

/**
 * 获取状态参数名称颜色编号。0=使用默认（系统颜色）。
 */
GF.CSC.getStatusParamAttrColor = function() {
    return GF.CSC.StatusParamAttrColor;
};

/**
 * 获取状态参数数值颜色编号。0=使用默认（基础颜色）。
 */
GF.CSC.getStatusParamValueColor = function() {
    return GF.CSC.StatusParamValueColor;
};

/**
 * 获取元素抗性名称颜色编号。0=使用默认（系统颜色）。
 */
GF.CSC.getStatusElementAttrColor = function() {
    return GF.CSC.StatusElementAttrColor;
};

/**
 * 获取元素抗性数值颜色编号。0=使用默认（基础颜色）。
 */
GF.CSC.getStatusElementValueColor = function() {
    return GF.CSC.StatusElementValueColor;
};

/**
 * 获取状态抗性名称颜色编号。0=使用默认（系统颜色）。
 */
GF.CSC.getStatusStateAttrColor = function() {
    return GF.CSC.StatusStateAttrColor;
};

/**
 * 获取状态抗性数值颜色编号。0=使用默认（基础颜色）。
 */
GF.CSC.getStatusStateValueColor = function() {
    return GF.CSC.StatusStateValueColor;
};

//=============================================================================
// Window_ActorStatusParamList — color overrides (v1.00)
//=============================================================================

/**
 * 获取当前参数列表窗口使用的样式ID。
 * 兼容旧版调用，转发到 getStatusStyleId。
 */
GF.CSC.getCurrentStyleId = function(paramListWindow) {
    return GF.CSC.getStatusStyleId(paramListWindow);
};

// Override: paramName — 属性名称颜色
GF.CSC.Window_ActorStatusParamList_paramName =
    Window_ActorStatusParamList.prototype.paramName;
Window_ActorStatusParamList.prototype.paramName = function(showIcon, paramType, paramId) {
    const styleId = GF.CSC.getCurrentStyleId(this);
    const colorId = GF.CSC.getAttrColor(styleId);
    let color;
    if (colorId > 0) {
        color = ColorManager.textColor(colorId);
    } else {
        color = ColorManager.textColor(ColorManager.systemColor());
    }
    let text = '';
    if (showIcon) {
        const icon = TextManager[paramType + 'Icon'](paramId);
        text += `\\i[${icon}]`;
    }
    text += `\\HexColor<${color}>${TextManager[paramType](paramId)}`;
    return text;
};

// Override: drawParam — 数值颜色
GF.CSC.Window_ActorStatusParamList_drawParam =
    Window_ActorStatusParamList.prototype.drawParam;
Window_ActorStatusParamList.prototype.drawParam = function(
    paramType, paramId, x, y, width, nameAlign, paramAlign, showIcon
) {
    width /= 2;
    const text = this.paramName(showIcon, paramType, paramId);
    this.drawTextEx(text, x, y, width, nameAlign);
    this.resetFontSettings();
    let value = this._actor[paramType](paramId);
    if (paramType !== 'param') {
        value *= 100;
        value = value.toFixed(1);
        value += '%';
    }
    const styleId = GF.CSC.getCurrentStyleId(this);
    const colorId = GF.CSC.getValueColor(styleId);
    if (colorId > 0) {
        const color = ColorManager.textColor(colorId);
        this.changeTextColor(color);
        this.drawText(value, x + width, y, width, paramAlign);
        this.resetFontSettings();
    } else {
        this.drawText(value, x + width, y, width, paramAlign);
    }
};

// Override: customParamName — 自定义属性名称颜色
GF.CSC.Window_ActorStatusParamList_customParamName =
    Window_ActorStatusParamList.prototype.customParamName;
Window_ActorStatusParamList.prototype.customParamName = function(name, icon) {
    const styleId = GF.CSC.getCurrentStyleId(this);
    const colorId = GF.CSC.getAttrColor(styleId);
    let color;
    if (colorId > 0) {
        color = ColorManager.textColor(colorId);
    } else {
        color = ColorManager.textColor(ColorManager.systemColor());
    }
    let text = '';
    if (icon) {
        text += `\\i[${icon}]`;
    }
    text += `\\HexColor<${color}>${name}`;
    return text;
};

// Override: drawCustomParam — 自定义数值颜色
GF.CSC.Window_ActorStatusParamList_drawCustomParam =
    Window_ActorStatusParamList.prototype.drawCustomParam;
Window_ActorStatusParamList.prototype.drawCustomParam = function(
    name, icon, value, x, y, width, nameAlign, paramAlign
) {
    width /= 2;
    const text = this.customParamName(name, icon);
    this.drawTextEx(text, x, y, width, nameAlign);
    this.resetFontSettings();
    const styleId = GF.CSC.getCurrentStyleId(this);
    const colorId = GF.CSC.getValueColor(styleId);
    if (colorId > 0) {
        const color = ColorManager.textColor(colorId);
        this.changeTextColor(color);
        this.drawText(value, x + width, y, width, paramAlign);
        this.resetFontSettings();
    } else {
        this.drawText(value, x + width, y, width, paramAlign);
    }
};

//=============================================================================
// Window_ActorStatus — display & font overrides (v1.01)
//=============================================================================

/**
 * Override: refresh — 显示/隐藏覆盖
 *
 * 在执行原 refresh 之前，临时修改 _actorStatusData 中的
 * ShowActorName / ShowActorLevel / ShowActorClass 值，
 * 刷新后恢复原始值。
 * 此方法对 Window_ActorStatus 及其子类 Window_EquipStatusPlus 均生效。
 */
GF.CSC.Window_ActorStatus_refresh = Window_ActorStatus.prototype.refresh;
Window_ActorStatus.prototype.refresh = function() {
    const styleId = GF.CSC.getStatusStyleId(this);
    const data = this._actorStatusData;
    const restore = {};

    // Apply show/hide overrides
    const showName = GF.CSC.getShowName(styleId);
    if (showName === 1 || showName === 2) {
        restore.showName = data["ShowActorName"];
        data["ShowActorName"] = (showName === 1);
    }
    const showLevel = GF.CSC.getShowLevel(styleId);
    if (showLevel === 1 || showLevel === 2) {
        restore.showLevel = data["ShowActorLevel"];
        data["ShowActorLevel"] = (showLevel === 1);
    }
    const showClass = GF.CSC.getShowClass(styleId);
    if (showClass === 1 || showClass === 2) {
        restore.showClass = data["ShowActorClass"];
        data["ShowActorClass"] = (showClass === 1);
    }

    // Call original refresh (which reads _actorStatusData)
    GF.CSC.Window_ActorStatus_refresh.call(this);

    // Restore original values
    if ('showName' in restore) data["ShowActorName"] = restore.showName;
    if ('showLevel' in restore) data["ShowActorLevel"] = restore.showLevel;
    if ('showClass' in restore) data["ShowActorClass"] = restore.showClass;
};

/**
 * Override: drawActorLevel — 等级颜色/字号/字体覆盖
 *
 * 在原方法基础上加入等级字体颜色的覆盖。颜色通过 \\HexColor<> 控制字符
 * 注入到文本开头，同时保留原格式字符串中的 \\c[x] 控制字符的效果。
 */
GF.CSC.Window_ActorStatus_drawActorLevel =
    Window_ActorStatus.prototype.drawActorLevel;
Window_ActorStatus.prototype.drawActorLevel = function() {
    const styleId = GF.CSC.getStatusStyleId(this);
    const data = this._actorStatusData;
    if (!data["ShowActorLevel"]) return;
    const actor = this._actor;
    const fmt = GF.Param.COPLevelShowFmt;
    const level = TextManager.actorLevelText(actor.level);
    let text = fmt.format(TextManager.level, TextManager.levelA, level);
    // Apply color override
    const colorId = GF.CSC.getLevelColor(styleId);
    if (colorId > 0) {
        const color = ColorManager.textColor(colorId);
        text = `\\HexColor<${color}>${text}`;
    }
    const width = this.textWidthEx(text);
    let x, y;
    if (data["ParamShowMode"] === '自动顺序排列') {
        x = this.innerWidth - width;
        y = 0;
    } else {
        x = data["LevelX"];
        y = data["LevelY"];
    }
    // Apply font overrides
    const fontSize = GF.CSC.getLevelFontSize(styleId);
    const fontFace = GF.CSC.getLevelFontFace(styleId);
    if (fontSize > 0 || (fontFace && fontFace !== '')) {
        const oldSize = this.contents.fontSize;
        const oldFace = this.contents.fontFace;
        GF.CSC.applyFontSettings(this, fontSize, fontFace);
        this.drawTextEx(text, x, y);
        this.contents.fontSize = oldSize;
        this.contents.fontFace = oldFace;
    } else {
        this.drawTextEx(text, x, y);
    }
};

/**
 * Override: drawActorName — 名称颜色/字号/字体覆盖
 *
 * 在原方法基础上加入名称字体颜色的覆盖。
 * 默认情况下原方法使用 HP 颜色（随角色血量变化），
 * 设置颜色编号后则使用固定颜色绘制。
 */
GF.CSC.Window_ActorStatus_drawActorName =
    Window_ActorStatus.prototype.drawActorName;
Window_ActorStatus.prototype.drawActorName = function(actor, x, y, width) {
    const styleId = GF.CSC.getStatusStyleId(this);
    const colorId = GF.CSC.getNameColor(styleId);
    const fontSize = GF.CSC.getNameFontSize(styleId);
    const fontFace = GF.CSC.getNameFontFace(styleId);
    const needFont = fontSize > 0 || (fontFace && fontFace !== '');

    if (colorId > 0 || needFont) {
        // Save state
        const oldSize = this.contents.fontSize;
        const oldFace = this.contents.fontFace;
        // Apply font overrides
        if (needFont) {
            GF.CSC.applyFontSettings(this, fontSize, fontFace);
        }
        // Apply color
        width = width || 168;
        if (colorId > 0) {
            this.changeTextColor(ColorManager.textColor(colorId));
        } else {
            this.changeTextColor(ColorManager.hpColor(actor));
        }
        this.drawText(actor.name(), x, y, width);
        // Restore
        this.contents.fontSize = oldSize;
        this.contents.fontFace = oldFace;
    } else {
        GF.CSC.Window_ActorStatus_drawActorName.call(this, actor, x, y, width);
    }
};

/**
 * Override: drawActorClass — 职业颜色/字号/字体覆盖
 *
 * 在原方法基础上加入职业字体颜色的覆盖。
 * 默认情况下原方法使用基础颜色（normalColor），
 * 设置颜色编号后则使用固定颜色绘制。
 */
GF.CSC.Window_ActorStatus_drawActorClass =
    Window_ActorStatus.prototype.drawActorClass;
Window_ActorStatus.prototype.drawActorClass = function(actor, x, y, width) {
    const styleId = GF.CSC.getStatusStyleId(this);
    const colorId = GF.CSC.getClassColor(styleId);
    const fontSize = GF.CSC.getClassFontSize(styleId);
    const fontFace = GF.CSC.getClassFontFace(styleId);
    const needFont = fontSize > 0 || (fontFace && fontFace !== '');

    if (colorId > 0 || needFont) {
        // Save state
        const oldSize = this.contents.fontSize;
        const oldFace = this.contents.fontFace;
        // Apply font overrides
        if (needFont) {
            GF.CSC.applyFontSettings(this, fontSize, fontFace);
        }
        // Apply color
        width = width || 168;
        if (colorId > 0) {
            this.changeTextColor(ColorManager.textColor(colorId));
        } else {
            this.resetTextColor();
        }
        this.drawText(actor.currentClass().name, x, y, width);
        // Restore
        this.contents.fontSize = oldSize;
        this.contents.fontFace = oldFace;
    } else {
        GF.CSC.Window_ActorStatus_drawActorClass.call(this, actor, x, y, width);
    }
};

//=============================================================================
// Window_EquipStatusParamList — color overrides for equipment screen
//=============================================================================

/**
 * Override: drawParam — 装备界面参数绘制（颜色 + 无对比模式）
 *
 * 装备界面使用 Window_EquipStatusParamList（继承自 Window_ActorStatusParamList），
 * 它有独立的 drawParam 方法。此覆盖：
 *   1. 使用 paramName() 渲染参数名称（应用属性颜色覆盖）
 *   2. 使用数值颜色覆盖渲染参数值
 *   3. 不绘制箭头和对比属性（适配 AAGFEquip2 的修改意图）
 *   4. 保留 paramWidth() / paramNameWidth() 的布局计算（兼容 AAGFEquip2 的覆写）
 */
GF.CSC.Window_EquipStatusParamList_drawParam =
    Window_EquipStatusParamList.prototype.drawParam;
Window_EquipStatusParamList.prototype.drawParam = function(
    paramType, paramId, x, y, width, nameAlign, paramAlign, showIcon
) {
    const styleId = GF.CSC.getStatusStyleId(this);
    // --- Attribute name (uses paramName for color override) ---
    const text = this.paramName(showIcon, paramType, paramId);
    const paramNameWidth = this.paramNameWidth();
    this.drawTextEx(text, x, y, paramNameWidth, nameAlign);
    this.resetFontSettings();
    // --- Value ---
    x += paramNameWidth + this.itemPadding();
    const paramWidth = this.paramWidth(width);
    let value = this._actor[paramType](paramId);
    if (paramType !== 'param') {
        value *= 100;
        value = value.toFixed(1);
        value += '%';
    }
    // Apply value color override
    const colorId = GF.CSC.getValueColor(styleId);
    if (colorId > 0) {
        const color = ColorManager.textColor(colorId);
        this.changeTextColor(color);
        this.drawText(value, x, y, paramWidth, paramAlign);
        this.resetFontSettings();
    } else {
        this.drawText(value, x, y, paramWidth, paramAlign);
    }
    // --- Skip arrow and new-param comparison (AAGFEquip2 behavior) ---
};

/**
 * Override: drawCustomParam — 装备界面自定义参数绘制（颜色适配）
 *
 * 与 drawParam 同理，为装备界面的自定义参数应用颜色覆盖。
 */
GF.CSC.Window_EquipStatusParamList_drawCustomParam =
    Window_EquipStatusParamList.prototype.drawCustomParam;
Window_EquipStatusParamList.prototype.drawCustomParam = function(
    name, icon, value, x, y, width, nameAlign, paramAlign
) {
    const styleId = GF.CSC.getStatusStyleId(this);
    // --- Custom param name (uses customParamName for color override) ---
    const text = this.customParamName(name, icon);
    const paramNameWidth = this.paramNameWidth();
    this.drawTextEx(text, x, y, paramNameWidth, nameAlign);
    this.resetFontSettings();
    // --- Value ---
    x += paramNameWidth + this.itemPadding();
    const paramWidth = this.paramWidth(width);
    // Apply value color override
    const colorId = GF.CSC.getValueColor(styleId);
    if (colorId > 0) {
        const color = ColorManager.textColor(colorId);
        this.changeTextColor(color);
        this.drawText(value, x, y, paramWidth, paramAlign);
        this.resetFontSettings();
    } else {
        this.drawText(value, x, y, paramWidth, paramAlign);
    }
};

//=============================================================================
// Window_StatusParamPlus — status screen param color overrides (v1.03)
//=============================================================================

/**
 * Override: drawParamName — 状态画面角色参数名称颜色
 *
 * 在原方法基础上替换系统颜色为自定义属性颜色。
 */
GF.CSC.Window_StatusParamPlus_drawParamName =
    Window_StatusParamPlus.prototype.drawParamName;
Window_StatusParamPlus.prototype.drawParamName = function(x, y, paramId, paramType) {
    let width = this.rectWidth() - this.itemPadding() * 2;
    if (this._windowSet.ShowParamIcon) {
        const icon = TextManager[paramType + 'Icon'](paramId);
        const iconY = y + Math.floor((this.lineHeight() - ImageManager.iconHeight) / 2);
        this.drawIcon(icon, x, iconY);
        const iconWidth = ImageManager.iconWidth + 4;
        x += iconWidth;
        width -= iconWidth;
    }
    const attrColor = GF.CSC.getStatusParamAttrColor();
    if (attrColor > 0) {
        this.changeTextColor(ColorManager.textColor(attrColor));
    } else {
        this.changeTextColor(ColorManager.systemColor());
    }
    this.drawText(TextManager[paramType](paramId), x, y, width);
};

/**
 * Override: drawCurrentParam — 状态画面角色参数数值颜色
 *
 * 在原方法基础上替换基础颜色为自定义数值颜色。
 */
GF.CSC.Window_StatusParamPlus_drawCurrentParam =
    Window_StatusParamPlus.prototype.drawCurrentParam;
Window_StatusParamPlus.prototype.drawCurrentParam = function(x, y, paramId, paramType) {
    const width = this.rectWidth() - this.itemPadding() * 2;
    const valueColor = GF.CSC.getStatusParamValueColor();
    if (valueColor > 0) {
        this.changeTextColor(ColorManager.textColor(valueColor));
    } else {
        this.resetTextColor();
    }
    let text = this._actor[paramType](paramId);
    if (paramType !== 'param') {
        text *= 100;
        text = text.toFixed(1);
        text += '%';
    }
    this.drawText(text, x, y, width, "right");
};

//=============================================================================
// Window_StatusElement — status screen element color overrides (v1.03)
//=============================================================================

/**
 * Override: drawElementName — 状态画面元素抗性名称颜色
 *
 * 在原方法基础上替换系统颜色为自定义属性颜色。
 */
GF.CSC.Window_StatusElement_drawElementName =
    Window_StatusElement.prototype.drawElementName;
Window_StatusElement.prototype.drawElementName = function(x, y, eleId) {
    const width = this.rectWidth() - this.itemPadding() * 2;
    const eleName = $dataSystem.elements[eleId];
    const attrColor = GF.CSC.getStatusElementAttrColor();
    if (attrColor > 0) {
        this.changeTextColor(ColorManager.textColor(attrColor));
    } else {
        this.changeTextColor(ColorManager.systemColor());
    }
    this.drawText(eleName, x, y, width);
};

/**
 * Override: drawElementRate — 状态画面元素抗性数值颜色
 *
 * 在原方法基础上替换基础颜色为自定义数值颜色。
 */
GF.CSC.Window_StatusElement_drawElementRate =
    Window_StatusElement.prototype.drawElementRate;
Window_StatusElement.prototype.drawElementRate = function(x, y, eleId) {
    const width = this.rectWidth() - this.itemPadding() * 2;
    const valueColor = GF.CSC.getStatusElementValueColor();
    if (valueColor > 0) {
        this.changeTextColor(ColorManager.textColor(valueColor));
    } else {
        this.resetTextColor();
    }
    const eleRate = 1 - this._actor.elementRate(eleId);
    const text = (eleRate * 100).toFixed(1) + '%';
    this.drawText(text, x, y, width, "right");
};

//=============================================================================
// Window_StatusState — status screen state color overrides (v1.03)
//=============================================================================

/**
 * Override: drawStateName — 状态画面状态抗性名称颜色
 *
 * 在原方法基础上替换系统颜色为自定义属性颜色。
 */
GF.CSC.Window_StatusState_drawStateName =
    Window_StatusState.prototype.drawStateName;
Window_StatusState.prototype.drawStateName = function(x, y, stateId) {
    const width = this.rectWidth() - this.itemPadding() * 2;
    const attrColor = GF.CSC.getStatusStateAttrColor();
    if (attrColor > 0) {
        this.changeTextColor(ColorManager.textColor(attrColor));
    } else {
        this.changeTextColor(ColorManager.systemColor());
    }
    this.drawItemName($dataStates[stateId], x, y, width);
};

/**
 * Override: drawStateRate — 状态画面状态抗性数值颜色
 *
 * 在原方法基础上替换基础颜色为自定义数值颜色。
 */
GF.CSC.Window_StatusState_drawStateRate =
    Window_StatusState.prototype.drawStateRate;
Window_StatusState.prototype.drawStateRate = function(x, y, stateId) {
    const width = this.rectWidth() - this.itemPadding() * 2;
    const valueColor = GF.CSC.getStatusStateValueColor();
    if (valueColor > 0) {
        this.changeTextColor(ColorManager.textColor(valueColor));
    } else {
        this.resetTextColor();
    }
    let stateRate = 1 - this._actor.stateRate(stateId);
    if (this._actor.isStateResist(stateId)) stateRate = 1;
    const text = (stateRate * 100).toFixed(1) + '%';
    this.drawText(text, x, y, width, "right");
};

//=============================================================================
// End of File
//=============================================================================
