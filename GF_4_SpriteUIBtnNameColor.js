//=============================================================================
// GF Plugins
// GF_4_SpriteUIBtnNameColor.js
//=============================================================================

var Imported = Imported || {};
Imported.GF_4_SpriteUIBtnNameColor = true;

var GF = GF || {};
GF.SNC = GF.SNC || {};
GF.SNC.version = 1.00;
GF.SNC.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.00]        界面 - 贴图按钮名称颜色
 * @author 用户指定
 * @url https://afdian.net/a/ganfly
 * @orderAfter GF_1_CoreOfSpriteUI
 * @base GF_1_CoreOfSpriteUI
 * @orderAfter GF_0_CoreOfText
 * @base GF_0_CoreOfText
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 *
 * 本插件是 GF_1_CoreOfSpriteUI（贴图UI核心）的扩展补丁，为按钮组中的
 * 按钮名称文字（Sprite_ButtonName）提供独立的颜色控制。
 *
 * 支持的覆盖控制：
 *   1. 按钮名称的文字颜色（通过 GF 颜色编号系统设置）
 *   2. 按钮名称的文字轮廓颜色
 *
 * 你可以为每一个按钮组样式（SpriteButtonSet 中的条目）分别设置颜色，
 * 也可以设置全局默认颜色。
 *
 * ============================================================================
 *  前置需求
 * ============================================================================
 *
 * ---- 前置插件列表 ----
 *
 * GF_0_CoreOfText               系统 - 文本核心
 * GF_1_CoreOfSpriteUI           系统 - 贴图UI核心
 *
 * ---- 第4层 ----
 *
 * 这个插件是第4层插件，必须放在第0、1层插件的下面。
 * 应在 GF_1_CoreOfSpriteUI 之后加载。
 *
 * ============================================================================
 *  使用方法
 * ============================================================================
 *
 * 1. 在插件参数「按钮名称颜色配置」中，添加你要控制的按钮组样式条目。
 * 2. 每个条目需要指定：
 *    - 样式ID：对应 SpriteButtonSet 中的第几个样式（从1开始）
 *    - 文字颜色：按钮名称文字的颜色编号
 *    - 轮廓颜色：按钮名称文字轮廓的颜色编号
 * 3. 颜色编号规则：
 *    - 0：使用默认颜色（文字颜色 = 普通颜色，即 ColorManager.normalColor()）
 *    - 1～200：使用 GF 普通颜色配置中的颜色编号
 *    - 201～400：使用 GF 高级渐变颜色配置中的颜色编号（201=1号高级颜色）
 * 4. 设置后，对应按钮组中的所有按钮名称都会使用指定的颜色绘制。
 * 5. 本插件同时支持命令按钮组（Sprite_CommandWindow）和
 *    独立按钮（Sprite_SingleButton）的名称颜色覆盖。
 *
 * ============================================================================
 *  兼容性
 * ============================================================================
 *
 * 本插件修改以下类的方法，不影响其他功能：
 *   Sprite_CommandWindow:
 *     - addGeneralCommand()  - 传递按钮名称颜色到名称数据
 *   Sprite_SingleButton:
 *     - createButtonName()   - 传递按钮名称颜色到名称数据
 *   Sprite_ButtonName:
 *     - initData()           - 增加 textColor / outlineColor 字段
 *     - refresh()            - 应用文字颜色和轮廓颜色
 *   Sprite_ButtonNameRect:
 *     - initialize()         - 传递颜色数据到子 Sprite_ButtonName
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
 * GF.SNC.getNameColor(styleId)       - 获取指定样式的文字颜色编号
 * GF.SNC.getOutlineColor(styleId)    - 获取指定样式的轮廓颜色编号
 * GF.SNC.getHexColor(colorId)        - 将颜色编号转为十六进制颜色字符串
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
 * @param ButtonNameColorSet
 * @text 按钮名称颜色配置
 * @type struct<BtnNameColorConfig>[]
 * @desc 为每个按钮组样式分别设置按钮名称文字颜色和轮廓颜色。
 * @default []
 *
 */
/* ---------------------------------------------------------------------------
 * struct<BtnNameColorConfig>
 * ---------------------------------------------------------------------------
 */
/*~struct~BtnNameColorConfig:
 *
 * @param Note
 * @text 标签
 * @desc 只用于方便区分查看的标签，不作用在插件中。
 * @default ==新的颜色配置==
 *
 * @param StyleId
 * @text 样式ID
 * @type number
 * @min 1
 * @desc 对应按钮组样式（SpriteButtonSet）中的第几个样式（从1开始）。
 * @default 1
 *
 * @param TextColor
 * @text 文字颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 按钮名称的文字颜色编号。0=使用默认普通颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param OutlineColor
 * @text 轮廓颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 按钮名称的文字轮廓颜色编号。0=使用默认轮廓颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 */
//=============================================================================

//=============================================================================
// Parameter Variables
//=============================================================================

GF.Parameters = PluginManager.parameters(GF.SNC.pluginName);
GF.Param = GF.Param || {};

/**
 * 构建颜色配置映射表。
 * 将插件参数中的 ButtonNameColorSet 解析为 { styleId → { textColor, outlineColor } } 格式。
 */
GF.SNC.buildConfigMap = function() {
    const list = JSON.parse(GF.Parameters['ButtonNameColorSet'] || '[]');
    const map = {};
    for (let i = 0; i < list.length; i++) {
        const data = JSON.parse(list[i] || '{}');
        const styleId = Number(data['StyleId'] || 1);
        map[styleId] = {
            textColor: Number(data['TextColor'] || 0),
            outlineColor: Number(data['OutlineColor'] || 0)
        };
    }
    return map;
};

/**
 * 颜色配置映射表：{ styleId: { textColor, outlineColor } }
 */
GF.SNC._configMap = GF.SNC.buildConfigMap();

//=============================================================================
// Color helpers
//=============================================================================

/**
 * 获取指定样式ID的文字颜色编号。
 * @param {number} styleId - 样式ID（1-based）
 * @returns {number} 颜色编号，0=使用默认
 */
GF.SNC.getNameColor = function(styleId) {
    const config = GF.SNC._configMap[styleId];
    return config ? config.textColor : 0;
};

/**
 * 获取指定样式ID的轮廓颜色编号。
 * @param {number} styleId - 样式ID（1-based）
 * @returns {number} 颜色编号，0=使用默认
 */
GF.SNC.getOutlineColor = function(styleId) {
    const config = GF.SNC._configMap[styleId];
    return config ? config.outlineColor : 0;
};

/**
 * 将颜色编号转为十六进制颜色字符串。
 * @param {number} colorId - 颜色编号（0-400，0返回空串）
 * @returns {string} 十六进制颜色字符串，如 "#ff0000"
 */
GF.SNC.getHexColor = function(colorId) {
    if (colorId <= 0) return '';
    return ColorManager.textColor(colorId);
};

//=============================================================================
// Inject color data into SpriteButtonSetList
//=============================================================================

(function() {
    // Inject into SpriteButtonSetList
    const btnSetList = GF.COSU.SpriteButtonSetList;
    if (btnSetList) {
        for (let i = 1; i < btnSetList.length; i++) {
            const entry = btnSetList[i];
            if (!entry) continue;
            const config = GF.SNC._configMap[i];
            if (config) {
                if (config.textColor > 0) {
                    entry['btn_nameColor'] = GF.SNC.getHexColor(config.textColor);
                }
                if (config.outlineColor > 0) {
                    entry['btn_nameOutlineColor'] = GF.SNC.getHexColor(config.outlineColor);
                }
            }
        }
    }

    // Inject into SingleButtonSetList
    const singleList = GF.COSU.SingleButtonSetList;
    if (singleList) {
        for (let i = 1; i < singleList.length; i++) {
            const entry = singleList[i];
            if (!entry) continue;
            const config = GF.SNC._configMap[i];
            if (config) {
                if (config.textColor > 0) {
                    entry['btn_nameColor'] = GF.SNC.getHexColor(config.textColor);
                }
                if (config.outlineColor > 0) {
                    entry['btn_nameOutlineColor'] = GF.SNC.getHexColor(config.outlineColor);
                }
            }
        }
    }
})();

//=============================================================================
// Sprite_CommandWindow — addGeneralCommand override
//=============================================================================

GF.SNC.Sprite_CommandWindow_addGeneralCommand =
    Sprite_CommandWindow.prototype.addGeneralCommand;
Sprite_CommandWindow.prototype.addGeneralCommand = function(index, param) {
    // Call original
    GF.SNC.Sprite_CommandWindow_addGeneralCommand.call(this, index, param);

    // The original method creates t_data and assigns it to cmdData.nameData.
    // We need to add textColor and outlineColor to the last command's nameData.
    // Since addGeneralCommand pushes to this._commands, the last entry is ours.
    const cmd = this._commands[this._commands.length - 1];
    if (cmd && cmd._nameSprite) {
        const nameData = cmd._nameSprite._setData;
        const temp_data = this._setData;
        if (temp_data['btn_nameColor']) {
            nameData.textColor = temp_data['btn_nameColor'];
        }
        if (temp_data['btn_nameOutlineColor']) {
            nameData.outlineColor = temp_data['btn_nameOutlineColor'];
        }
        // Re-render with colors applied (initial refresh already ran)
        cmd._nameSprite.refresh();
    }
};

//=============================================================================
// Sprite_SingleButton — createButtonName override
//=============================================================================

GF.SNC.Sprite_SingleButton_createButtonName =
    Sprite_SingleButton.prototype.createButtonName;
Sprite_SingleButton.prototype.createButtonName = function() {
    GF.SNC.Sprite_SingleButton_createButtonName.call(this);
    // Apply color to the name sprite if it exists
    if (this._nameSprite) {
        const nameData = this._nameSprite._setData;
        const temp_data = this._setData;
        if (temp_data['btn_nameColor']) {
            nameData.textColor = temp_data['btn_nameColor'];
        }
        if (temp_data['btn_nameOutlineColor']) {
            nameData.outlineColor = temp_data['btn_nameOutlineColor'];
        }
        // Re-render with colors applied (initial refresh already ran)
        this._nameSprite.refresh();
    }
};

//=============================================================================
// Sprite_ButtonName — color overrides
//=============================================================================

/**
 * Override: initData — 增加 textColor/outlineColor 默认值
 */
GF.SNC.Sprite_ButtonName_initData = Sprite_ButtonName.prototype.initData;
Sprite_ButtonName.prototype.initData = function() {
    GF.SNC.Sprite_ButtonName_initData.call(this);
    const data = this._setData;
    data.textColor = data.textColor || '';
    data.outlineColor = data.outlineColor || '';
};

/**
 * Override: refresh — 应用文字颜色和轮廓颜色
 *
 * 在 drawTextEx 之前，为 _curText 注入 \\HexColor<> 和
 * \\OutlineHexColor<> 控制字符。
 */
GF.SNC.Sprite_ButtonName_refresh = Sprite_ButtonName.prototype.refresh;
Sprite_ButtonName.prototype.refresh = function() {
    const data = this._setData;
    // Build color prefix
    let colorPrefix = '';
    if (data.outlineColor) {
        colorPrefix += `\\OutlineHexColor<${data.outlineColor}>`;
    }
    if (data.textColor) {
        colorPrefix += `\\HexColor<${data.textColor}>`;
    }

    if (colorPrefix) {
        // Temporarily replace _curText for the draw
        const displayText = colorPrefix + this._curText;
        const originalText = this._curText;
        this._curText = displayText;
        GF.SNC.Sprite_ButtonName_refresh.call(this);
        this._curText = originalText;
    } else {
        // No color override — call original directly
        GF.SNC.Sprite_ButtonName_refresh.call(this);
    }
};

//=============================================================================
// Sprite_ButtonNameRect — pass color to child Sprite_ButtonName
//=============================================================================

/**
 * Override: initialize — 传递颜色数据到子 Sprite_ButtonName
 *
 * Sprite_ButtonNameRect 在创建子 Sprite_ButtonName 时没有传递
 * textColor/outlineColor。我们在初始化后补充设置。
 */
GF.SNC.Sprite_ButtonNameRect_initialize =
    Sprite_ButtonNameRect.prototype.initialize;
Sprite_ButtonNameRect.prototype.initialize = function(data, nameList, bitmap) {
    GF.SNC.Sprite_ButtonNameRect_initialize.call(this, data, nameList, bitmap);
    // Inject color into the child Sprite_ButtonName's data if available
    if (this._nameSprite && data) {
        const nameData = this._nameSprite._setData;
        if (data['btn_nameColor']) {
            nameData.textColor = data['btn_nameColor'];
        }
        if (data['btn_nameOutlineColor']) {
            nameData.outlineColor = data['btn_nameOutlineColor'];
        }
        // Re-render with colors applied (initial refresh already ran)
        this._nameSprite.refresh();
    }
};

//=============================================================================
// End of File
//=============================================================================
