//=============================================================================
// GF Plugins
// WSQ_G_SpriteUIBtnNameColor.js
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_G_SpriteUIBtnNameColor = true;
Imported.GF_4_SpriteUIBtnNameColor = true; // 兼容别名（旧引用保留）

var GF = GF || {};
GF.SNC = GF.SNC || {};
GF.SNC.version = 2.01;
GF.SNC.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v2.01]        界面 - 贴图按钮名称颜色
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
 * 支持三种状态下的文字颜色 / 轮廓颜色分别设置：
 *   1. 平常状态  —— 按钮既未被光标选中、也未处于激活状态（含禁用按钮）
 *   2. 选中状态  —— 按钮被光标/鼠标选中（命令按钮：光标停留；独立按钮：悬停）
 *   3. 激活状态  —— 按钮被确认触发后的激活态（命令按钮：确认后保持到复位；
 *                    独立按钮：鼠标按住未松开）
 *
 * 颜色规则与引擎的按钮贴图帧（normal / select / active）完全同步，
 * 文字变色与按钮底图切帧发生在同一状态时机。
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
 *    - 平常文字/轮廓颜色（TextColor / OutlineColor，兼容旧版参数）
 *    - 选中文字/轮廓颜色（SelectTextColor / SelectOutlineColor）
 *    - 激活文字/轮廓颜色（ActiveTextColor / ActiveOutlineColor）
 * 3. 状态颜色回退规则（0 = 未设置，自动回退）：
 *    - 选中颜色未设置  → 使用平常颜色
 *    - 激活颜色未设置  → 使用选中颜色，仍为空则使用平常颜色
 *    - 全部为 0        → 使用引擎默认（普通）文字颜色
 *    因此旧版只填写 TextColor / OutlineColor 的配置，三种状态会
 *    显示同一种颜色，与 v1.00 行为完全一致。
 * 4. 颜色编号规则：
 *    - 0：使用默认颜色（文字颜色 = 普通颜色，即 ColorManager.normalColor()）
 *    - 1～200：使用 GF 普通颜色配置中的颜色编号
 *    - 201～400：使用 GF 高级渐变颜色配置中的颜色编号（201=1号高级颜色）
 * 5. 设置后，对应按钮组中的所有按钮名称都会根据按钮当前状态
 *    使用指定的颜色绘制。
 * 6. 支持范围：
 *    - 命令按钮组（Sprite_CommandWindow）内每个命令按钮的文字
 *    - 独立按钮（Sprite_SingleButton）的文字
 *    - 窗口级名称展示器（Sprite_ButtonNameRect，跟随当前命令显示），
 *      其颜色随「当前命令按钮」的状态变化（选中/激活回退规则同上）
 *
 * 7. 填写示例（以第 3 个按钮组样式为例）：
 *    - 样式ID = 3
 *    - 平常文字颜色 = 0（引擎默认）
 *    - 选中文字颜色 = 7（金色）
 *    - 激活文字颜色 = 18（红色）
 *    - 其余轮廓颜色都填 0（跟随文字规则自动回退）
 *    效果：按钮平常为默认文字色，光标选中时变金，确认触发后变红。
 *
 * ============================================================================
 *  兼容性
 * ============================================================================
 *
 * 本插件修改以下类的方法，不影响其他功能：
 *   Sprite_CommandWindow:
 *     - addGeneralCommand()  - 传递三态颜色数据到按钮名称
 *     - update()             - 每帧同步窗口级名称展示器的状态颜色
 *   Sprite_SingleButton:
 *     - createButtonName()   - 传递三态颜色数据到名称
 *     - update()             - 每帧按悬停/按下同步名称状态颜色
 *   Sprite_CommandButton:
 *     - update()             - 每帧按选中/激活同步名称状态颜色
 *   Sprite_ButtonName:
 *     - initData()           - 增加 colorInfo / textColor / outlineColor 字段
 *     - refresh()            - 应用文字颜色和轮廓颜色
 *     - _sncSetup()          - （新增）注入三态颜色数据并应用初始状态
 *     - _sncSetState()       - （新增）切换状态并仅在变化时重绘
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
 * GF.SNC.getNameColor(styleId)           - 获取指定样式的平常文字颜色编号
 * GF.SNC.getOutlineColor(styleId)        - 获取指定样式的平常轮廓颜色编号
 * GF.SNC.getStateTextColor(styleId, state)
 *                                        - 获取指定样式某状态的文字颜色编号
 *                                          state: "normal" / "select" / "active"
 * GF.SNC.getStateOutlineColor(styleId, state)
 *                                        - 获取指定样式某状态的轮廓颜色编号
 * GF.SNC.getHexColor(colorId)            - 将颜色编号转为十六进制颜色字符串
 * GF.SNC._configMap                      - 解析后的三态颜色配置表（仅供调试）
 *
 * ============================================================================
 *  更新日志
 * ============================================================================
 *
 * [v2.01] 修复：颜色编号→实际颜色的解析从插件加载阶段推迟到运行期
 *         （名称精灵创建时）。GF 颜色表 $dataColors/$dataSeniorColors 由
 *         扩展数据异步加载，插件加载阶段调用 ColorManager.textColor 会把
 *         所有编号兜底解析成 #ffffff（白色），导致文字恒为白色。
 * [v2.00] 新增：三种状态（平常/选中/激活）分别设置文字与轮廓颜色。
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
 * @desc 为每个按钮组样式分别设置三种状态下的按钮名称文字/轮廓颜色。
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
 * @text 平常文字颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 平常状态（未选中/未激活）下的文字颜色编号。0=回退引擎默认色，1-200=普通颜色，201-400=高级颜色。该参数兼容旧版，也是选中/激活颜色的最终回退色。
 * @default 0
 *
 * @param OutlineColor
 * @text 平常轮廓颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 平常状态（未选中/未激活）下的文字轮廓颜色编号。0=回退引擎默认色，1-200=普通颜色，201-400=高级颜色。该参数兼容旧版。
 * @default 0
 *
 * @param SelectTextColor
 * @text 选中文字颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 选中状态（光标停留/悬停）下的文字颜色编号。0=沿用平常文字颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param SelectOutlineColor
 * @text 选中轮廓颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 选中状态（光标停留/悬停）下的文字轮廓颜色编号。0=沿用平常轮廓颜色，1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param ActiveTextColor
 * @text 激活文字颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 激活状态（确认触发后）下的文字颜色编号。0=沿用选中颜色（无选中则沿用平常色），1-200=普通颜色，201-400=高级颜色。
 * @default 0
 *
 * @param ActiveOutlineColor
 * @text 激活轮廓颜色
 * @type number
 * @min 0
 * @max 400
 * @desc 激活状态（确认触发后）下的文字轮廓颜色编号。0=沿用选中轮廓（无选中则沿用平常色），1-200=普通颜色，201-400=高级颜色。
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
 * 取首个大于 0 的颜色编号，全部为 0 则返回 0（回退/默认）。
 * @param {...number} ids
 * @returns {number}
 */
GF.SNC.pickColorId = function(...ids) {
    for (let i = 0; i < ids.length; i++) {
        const id = Number(ids[i]);
        if (id > 0) return id;
    }
    return 0;
};

/**
 * 将颜色编号转为十六进制颜色字符串（0 返回空串 = 不覆盖，使用引擎默认）。
 * @param {number} colorId
 * @returns {string}
 */
/**
 * 构建一条状态颜色配置（仅保存颜色编号）。
 *
 * 注意：此处只保存编号、不调用 ColorManager.textColor() 转色。
 * GF 的颜色表（$dataColors / $dataSeniorColors）由扩展数据文件异步加载，
 * 插件文件加载阶段不可用，必须推迟到运行期（名称精灵创建时）再解析，
 * 否则所有编号都会被解析成白色（GF textColor 的兜底值）。
 */
GF.SNC.buildStateColor = function(normalTextId, normalOutlineId,
    selectTextId, selectOutlineId, activeTextId, activeOutlineId) {
    // 状态回退：select 缺省→normal；active 缺省→select→normal
    const nText = normalTextId;
    const nOutline = normalOutlineId;
    const sText = GF.SNC.pickColorId(selectTextId, normalTextId);
    const sOutline = GF.SNC.pickColorId(selectOutlineId, normalOutlineId);
    const aText = GF.SNC.pickColorId(activeTextId, selectTextId, normalTextId);
    const aOutline = GF.SNC.pickColorId(activeOutlineId, selectOutlineId, normalOutlineId);
    return {
        normal: {
            textId: nText,
            outlineId: nOutline
        },
        select: {
            textId: sText,
            outlineId: sOutline
        },
        active: {
            textId: aText,
            outlineId: aOutline
        }
    };
};

/**
 * 运行期解析配置：把编号转换为可直接用于 \\HexColor<> 控制符的颜色值。
 * 必须在游戏数据加载完成之后调用（$dataColors 已就绪）。
 * @param {object} config - buildStateColor 产出的编号配置
 * @returns {{normal:{text:string,outline:string},select:object,active:object}}
 *          每个颜色值为 GF 颜色 token（#hex / senior_xxx），空串=不覆盖
 */
GF.SNC.resolveConfig = function(config) {
    const result = {};
    for (const state of ['normal', 'select', 'active']) {
        const seg = config[state] || {};
        result[state] = {
            text: GF.SNC.getHexColor(seg.textId),
            outline: GF.SNC.getHexColor(seg.outlineId)
        };
    }
    return result;
};

/**
 * 构建颜色配置映射表。
 * 将插件参数中的 ButtonNameColorSet 解析为
 * { styleId → { normal/select/active: { textId, outlineId } } } 格式（仅编号）。
 * 编号到实际颜色的转换由 GF.SNC.resolveConfig() 在运行期完成。
 */
GF.SNC.buildConfigMap = function() {
    const list = JSON.parse(GF.Parameters['ButtonNameColorSet'] || '[]');
    const map = {};
    for (let i = 0; i < list.length; i++) {
        const data = JSON.parse(list[i] || '{}');
        const styleId = Number(data['StyleId'] || 1);
        map[styleId] = GF.SNC.buildStateColor(
            Number(data['TextColor'] || 0),
            Number(data['OutlineColor'] || 0),
            Number(data['SelectTextColor'] || 0),
            Number(data['SelectOutlineColor'] || 0),
            Number(data['ActiveTextColor'] || 0),
            Number(data['ActiveOutlineColor'] || 0)
        );
    }
    return map;
};

/**
 * 三态颜色配置映射表（仅编号，运行期经 resolveConfig 转色）：
 * { styleId: { normal/select/active: { textId, outlineId } } }
 */
GF.SNC._configMap = GF.SNC.buildConfigMap();

//=============================================================================
// Color helpers
//=============================================================================

/**
 * 获取指定样式ID的平常（normal）文字颜色编号。
 * @param {number} styleId - 样式ID（1-based）
 * @returns {number} 颜色编号，0=使用默认
 */
GF.SNC.getNameColor = function(styleId) {
    const config = GF.SNC._configMap[styleId];
    return config ? config.normal.textId : 0;
};

/**
 * 获取指定样式ID的平常（normal）轮廓颜色编号。
 * @param {number} styleId - 样式ID（1-based）
 * @returns {number} 颜色编号，0=使用默认
 */
GF.SNC.getOutlineColor = function(styleId) {
    const config = GF.SNC._configMap[styleId];
    return config ? config.normal.outlineId : 0;
};

/**
 * 获取指定样式ID、指定状态的文字颜色编号。
 * @param {number} styleId - 样式ID（1-based）
 * @param {string} state - "normal" / "select" / "active"
 * @returns {number} 颜色编号，0=使用默认
 */
GF.SNC.getStateTextColor = function(styleId, state) {
    const config = GF.SNC._configMap[styleId];
    if (!config || !config[state]) return 0;
    return config[state].textId;
};

/**
 * 获取指定样式ID、指定状态的轮廓颜色编号。
 * @param {number} styleId - 样式ID（1-based）
 * @param {string} state - "normal" / "select" / "active"
 * @returns {number} 颜色编号，0=使用默认
 */
GF.SNC.getStateOutlineColor = function(styleId, state) {
    const config = GF.SNC._configMap[styleId];
    if (!config || !config[state]) return 0;
    return config[state].outlineId;
};

/**
 * 将颜色编号转为可直接使用的颜色字符串（#hex 或 senior_xxx 高级色）。
 * @param {number} colorId - 颜色编号（0-400，0返回空串）
 * @returns {string} 颜色字符串，如 "#ff0000" / "senior_0_100_#ffffff"；异常时返回空串
 */
GF.SNC.getHexColor = function(colorId) {
    if (!colorId || colorId <= 0) return '';
    try {
        const color = ColorManager.textColor(colorId);
        if (typeof color !== 'string' || color === '') return '';
        return color;
    } catch (e) {
        // 颜色表尚未就绪或编号越界等异常：返回空串（不注入，走引擎默认）
        return '';
    }
};

//=============================================================================
// Inject color data into SpriteButtonSetList / SingleButtonSetList
//=============================================================================

(function() {
    // 向样式表条目注入三态颜色编号数据（仅编号，色值在运行期解析，
    // 避免插件加载阶段 $dataColors 尚未就绪导致全部解析成白色）
    const injectList = function(setList) {
        if (!setList) return;
        for (let i = 1; i < setList.length; i++) {
            const entry = setList[i];
            if (!entry) continue;
            const config = GF.SNC._configMap[i];
            if (!config) continue;
            entry['btn_nameColorInfo'] = config;
        }
    };

    // Inject into SpriteButtonSetList
    injectList(GF.COSU.SpriteButtonSetList);
    // Inject into SingleButtonSetList
    injectList(GF.COSU.SingleButtonSetList);
})();

//=============================================================================
// Sprite_ButtonName — state color helpers
//=============================================================================

/**
 * 向名称精灵注入三态颜色数据并应用初始状态色。
 *
 * 注意：颜色编号→实际颜色的解析（resolveConfig）发生在这里 —— 名称精灵
 * 只在游戏数据加载完成后才会被创建，此时 GF 颜色表（$dataColors 等）
 * 必然已就绪，不会再出现全部解析为白色的情况。
 *
 * @param {object|null} colorInfo - 三态颜色编号配置，null=不启用状态变色
 * @param {string} state - 初始状态："normal" / "select" / "active"
 */
Sprite_ButtonName.prototype._sncSetup = function(colorInfo, state) {
    const data = this._setData;
    data.colorInfo = colorInfo || null;
    this._sncColors = data.colorInfo ? GF.SNC.resolveConfig(data.colorInfo) : null;
    this._sncState = null;
    if (this._sncColors) {
        this._sncSetState(state || 'normal');
    }
};

/**
 * 切换名称颜色状态。仅当状态变化时更新 textColor/outlineColor 并重绘，
 * 每帧调用无额外开销。
 * @param {string} state - "normal" / "select" / "active"
 */
Sprite_ButtonName.prototype._sncSetState = function(state) {
    if (!this._sncColors) return;
    if (this._sncState === state) return;
    this._sncState = state;
    const data = this._setData;
    const segment = this._sncColors[state] || null;
    const text = segment ? segment.text : '';
    const outline = segment ? segment.outline : '';
    if (data.textColor !== text || data.outlineColor !== outline) {
        data.textColor = text;
        data.outlineColor = outline;
        this.refresh();
    }
};

//=============================================================================
// Sprite_CommandWindow — addGeneralCommand / update overrides
//=============================================================================

GF.SNC.Sprite_CommandWindow_addGeneralCommand =
    Sprite_CommandWindow.prototype.addGeneralCommand;
Sprite_CommandWindow.prototype.addGeneralCommand = function(index, param) {
    // Call original
    GF.SNC.Sprite_CommandWindow_addGeneralCommand.call(this, index, param);

    // The original method creates t_data and assigns it to cmdData.nameData.
    // We need to attach the three-state color data to the new command button's
    // name sprite, then render with the initial state color.
    const cmd = this._commands[this._commands.length - 1];
    if (cmd && cmd._nameSprite) {
        const colorInfo =
            (this._setData && this._setData['btn_nameColorInfo']) || null;
        cmd._nameSprite._sncSetup(colorInfo, 'normal');
    }
};

GF.SNC.Sprite_CommandWindow_update = Sprite_CommandWindow.prototype.update;
Sprite_CommandWindow.prototype.update = function() {
    GF.SNC.Sprite_CommandWindow_update.call(this);
    // Window-level name displayer (Sprite_ButtonNameRect) follows the
    // current command: sync its color with the current command button state.
    const ns = this._nameSprite;
    if (ns && ns._nameSprite && ns._nameSprite._sncSetState) {
        if (ns._nameSprite._setData && ns._nameSprite._setData.colorInfo) {
            let state = 'normal';
            const i = this.index();
            if (i > -1 && this._commands && this._commands[i]) {
                state = this._commands[i]._act ? 'active' : 'select';
            }
            ns._nameSprite._sncSetState(state);
        }
    }
};

//=============================================================================
// Sprite_CommandButton — update override (sync name state)
//=============================================================================

GF.SNC.Sprite_CommandButton_update = Sprite_CommandButton.prototype.update;
Sprite_CommandButton.prototype.update = function() {
    GF.SNC.Sprite_CommandButton_update.call(this);
    if (this._nameSprite && this._nameSprite._sncSetState) {
        if (this._nameSprite._setData && this._nameSprite._setData.colorInfo) {
            let state = 'normal';
            if (this._act) {
                state = 'active';
            } else if (this.parent && this.isBeingSelect() && this.isEnabled()) {
                state = 'select';
            }
            this._nameSprite._sncSetState(state);
        }
    }
};

//=============================================================================
// Sprite_SingleButton — createButtonName / update overrides
//=============================================================================

GF.SNC.Sprite_SingleButton_createButtonName =
    Sprite_SingleButton.prototype.createButtonName;
Sprite_SingleButton.prototype.createButtonName = function() {
    GF.SNC.Sprite_SingleButton_createButtonName.call(this);
    // Apply the three-state color data to the name sprite if it exists
    if (this._nameSprite) {
        const colorInfo =
            (this._setData && this._setData['btn_nameColorInfo']) || null;
        this._nameSprite._sncSetup(colorInfo, 'normal');
    }
};

GF.SNC.Sprite_SingleButton_update = Sprite_SingleButton.prototype.update;
Sprite_SingleButton.prototype.update = function() {
    GF.SNC.Sprite_SingleButton_update.call(this);
    if (this._nameSprite && this._nameSprite._sncSetState) {
        if (this._nameSprite._setData && this._nameSprite._setData.colorInfo) {
            let state = 'normal';
            if (this.isPressed() && this.isEnabled()) {
                state = 'active';
            } else if (this.isBeingTouched() && this.isEnabled()) {
                state = 'select';
            }
            this._nameSprite._sncSetState(state);
        }
    }
};

//=============================================================================
// Sprite_ButtonName — refresh color overrides
//=============================================================================

/**
 * Override: initData — 增加 colorInfo/textColor/outlineColor 默认值
 */
GF.SNC.Sprite_ButtonName_initData = Sprite_ButtonName.prototype.initData;
Sprite_ButtonName.prototype.initData = function() {
    GF.SNC.Sprite_ButtonName_initData.call(this);
    const data = this._setData;
    data.colorInfo = data.colorInfo || null;
    data.textColor = data.textColor || '';
    data.outlineColor = data.outlineColor || '';
};

/**
 * Override: refresh — 应用文字颜色和轮廓颜色
 *
 * 在 drawTextEx 之前，为 _curText 注入 \\HexColor<> 和
 * \\OutlineHexColor<> 控制字符。textColor/outlineColor 由
 * _sncSetState 按当前按钮状态维护。
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
// Sprite_ButtonNameRect — pass color data to child Sprite_ButtonName
//=============================================================================

/**
 * Override: initialize — 传递三态颜色数据到子 Sprite_ButtonName
 *
 * Sprite_ButtonNameRect 在创建子 Sprite_ButtonName 时没有传递
 * colorInfo 等字段。我们在初始化后补充设置。
 */
GF.SNC.Sprite_ButtonNameRect_initialize =
    Sprite_ButtonNameRect.prototype.initialize;
Sprite_ButtonNameRect.prototype.initialize = function(data, nameList, bitmap) {
    GF.SNC.Sprite_ButtonNameRect_initialize.call(this, data, nameList, bitmap);
    // Inject the three-state color data into the child name sprite
    if (this._nameSprite && data) {
        const colorInfo = data['btn_nameColorInfo'] || null;
        this._nameSprite._sncSetup(colorInfo, 'normal');
    }
};

//=============================================================================
// End of File
//=============================================================================
