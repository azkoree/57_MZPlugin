//=============================================================================
// GF Plugins
// GF_4_BattleActorUICtrl.js
//=============================================================================

var Imported = Imported || {};
Imported.GF_4_BattleActorUICtrl = true;

var GF = GF || {};
GF.BAUI = GF.BAUI || {};
GF.BAUI.version = 1.00;
GF.BAUI.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.00]        战斗 - 角色选择UI控制
 * @author 57 & deepseek
 * @url
 * @orderAfter GF_2_CoreOfBattle
 * @base GF_2_CoreOfBattle
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 *
 * 这是一个免费插件，如果您是通过付费方式获得了此插件，请立即要求收费方退款。
 *
 * 本插件用于在战斗中通过插件命令控制角色选择UI的显示与隐藏，方便战斗演出。
 *
 * 可分别控制以下两个UI元素：
 *   - 角色按钮条（侧视战斗）：屏幕顶部/侧边的参战角色头像按钮，由
 *     BattleActorCmdSet 参数配置，对应 _partySprite。
 *   - 角色状态窗口（正视图战斗）：屏幕底部显示角色状态信息的窗口，由
 *     BattleActorWindowSet 参数配置，对应 _actorWindow。
 *
 * 使用场景示例：
 *   在敌群事件中需要显示文章时，先通过命令收起角色按钮条/状态窗口，
 *   避免对话框被遮挡。演出结束后再通过命令还原。
 *
 * ============================================================================
 *  前置需求
 * ============================================================================
 *
 * 这个插件只能在RPGMakerMZ上运行。
 *
 * ---- 前置插件列表 ----
 *
 * GF_2_CoreOfBattle          系统 - 战斗核心
 *
 * ---- 第4层 ----
 *
 * 这个插件是第4层插件，必须放在第0，1，2，3层下面。
 *
 * ============================================================================
 *  插件指令
 * ============================================================================
 *
 * ★ 角色按钮条（侧视战斗，BattleActorCmdSet）
 *   战斗角色按钮条 显示       - 显示角色头像按钮条
 *   战斗角色按钮条 隐藏       - 隐藏角色头像按钮条
 *
 * ★ 角色状态窗口（正视图战斗，BattleActorWindowSet）
 *   战斗角色状态窗口 显示     - 显示角色状态窗口
 *   战斗角色状态窗口 隐藏     - 隐藏角色状态窗口
 *
 * ★ 全部（同时控制上述两者）
 *   战斗角色UI 显示           - 同时显示按钮条和状态窗口
 *   战斗角色UI 隐藏           - 同时隐藏按钮条和状态窗口
 *
 *   注意：
 *   - 插件指令仅在战斗中有效。
 *   - 显示时仅设为可见，不会激活（activate），以免抢走命令按钮的
 *     键盘焦点导致无法用确定键选择攻击/技能等命令。
 *
 * ============================================================================
 *  用户规约
 * ============================================================================
 *
 *  1. GF系列插件可用于免费或商业游戏，前提是它们是通过合法手段获得的，目
 *  前仅在qq群 568785370 发布。
 *
 *  2. 请将此插件的作者部分找到的所有作者名单在您的游戏致谢名单中列出，目
 *  前绝大多数插件作者为gt50，少部分插件包含作者Drill_up、芯☆淡茹水。
 *
 *  3. 在您不声称源代码属于您的前提下，您可以根据需要编辑源代码。但是，如
 *  果您对插件进行了任何更改，则您需要对修改部分负责，我们无法对用户的自定
 *  义代码负责。不允许对插件本体进行修改后二次发布，但是我们很乐意您在注明
 *  了引用的情况下将我们的插件作为基础来开发扩展插件或者在您的插件中调用或
 *  修改我们插件中的方法。
 *
 *  4. 对于付费插件，请不要重新分发这些插件，尊重作者的劳动成果，助力RMMZ
 *  插件生态良性循环，感谢您的理解。
 *
 *  5. 我们不对由于以下原因导致您的游戏中出现的问题负责，例如不是最新的插
 *  件版本，与其他插件的兼容问题，用户的自定义代码等。
 *
 *  6. 如果您的游戏使用了我们的插件，我们很乐意您在游戏完成后发给我们一份
 *  展示效果。
 *
 *  7. 其余未尽事宜，按照MIT规约处理。
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
 * @ 插件指令
 * @ ==========================================================================
 *
 * @command ShowPartySprite
 * @text 战斗角色按钮条 显示
 * @desc 显示角色头像按钮条（侧视战斗，BattleActorCmdSet配置的 _partySprite）
 *
 * @command HidePartySprite
 * @text 战斗角色按钮条 隐藏
 * @desc 隐藏角色头像按钮条（侧视战斗）
 *
 * @command ShowActorWindow
 * @text 战斗角色状态窗口 显示
 * @desc 显示角色状态窗口（正视图战斗，BattleActorWindowSet配置的 _actorWindow）
 *
 * @command HideActorWindow
 * @text 战斗角色状态窗口 隐藏
 * @desc 隐藏角色状态窗口（正视图战斗）
 *
 * @command ShowAll
 * @text 战斗角色UI 显示
 * @desc 同时显示角色按钮条和角色状态窗口
 *
 * @command HideAll
 * @text 战斗角色UI 隐藏
 * @desc 同时隐藏角色按钮条和角色状态窗口
 *
 * @ ==========================================================================
 * @ 插件参数
 * @ ==========================================================================
 *
 * @param GeneralSet
 * @text ====基本设置====
 *
 * @param PartySpriteHideVisible
 * @text 隐藏按钮条时保留占位
 * @parent GeneralSet
 * @type boolean
 * @on 保留占位
 * @off 完全隐藏
 * @desc 隐藏角色按钮条时是否仅隐藏交互（保留空位），完全隐藏则 visible=false。
 * 建议设为"完全隐藏"以避免遮挡对话框。
 * @default false
 *
 * @param ActorWindowHideWithAnimation
 * @text 隐藏状态窗口时播放收回动画
 * @parent GeneralSet
 * @type boolean
 * @on 播放
 * @off 立即隐藏
 * @desc 隐藏角色状态窗口时是否播放收回动画。关闭则直接 hide() 立即消失。
 * @default false
 *
 */

//=============================================================================
// Dependency Check
//=============================================================================

if (!Imported.GF_2_CoreOfBattle) {
    alert("错误:未找到前置插件 GF_2_CoreOfBattle。\n请确保已安装并启用 GF_2_CoreOfBattle 插件,并将其放置在 GF_4_BattleActorUICtrl 插件之前。");
} else if (GF.COB.version < 1.00) {
    alert("错误:前置插件 GF_2_CoreOfBattle 版本过低。\n请升级至最新版本。");
}

//=============================================================================
// Parameter Variables
//=============================================================================

const params = PluginManager.parameters(GF.BAUI.pluginName);
GF.BAUI.partySpriteHideVisible = eval(params['PartySpriteHideVisible'] || 'false');
GF.BAUI.actorWindowHideWithAnim = eval(params['ActorWindowHideWithAnimation'] || 'false');

//=============================================================================
// Internal Helpers
//=============================================================================

/**
 * 获取当前战斗场景中的 _partySprite（角色按钮条）
 */
GF.BAUI.getPartySprite = function () {
    const scene = SceneManager._scene;
    if (!scene || !(scene instanceof Scene_Battle)) return null;
    return scene._partySprite || null;
};

/**
 * 获取当前战斗场景中的 _actorWindow（角色状态窗口）
 */
GF.BAUI.getActorWindow = function () {
    const scene = SceneManager._scene;
    if (!scene || !(scene instanceof Scene_Battle)) return null;
    return scene._actorWindow || null;
};

/**
 * 显示角色按钮条
 * 注意：仅设为可见，不调用 activate()。
 * 因为 Sprite_PartyCommand 在构造函数中已 deactivate 自身，
 * 恢复时若激活会干扰 _commandSprite 的键盘输入（抢走确定键事件）。
 */
GF.BAUI.showPartySprite = function () {
    const sprite = GF.BAUI.getPartySprite();
    if (!sprite) return;
    sprite.show();
};

/**
 * 隐藏角色按钮条
 */
GF.BAUI.hidePartySprite = function () {
    const sprite = GF.BAUI.getPartySprite();
    if (!sprite) return;
    if (GF.BAUI.partySpriteHideVisible) {
        // 仅停用交互，保留可见空位
        sprite.deactivate();
    } else {
        // 完全隐藏
        sprite.hide();
    }
};

/**
 * 显示角色状态窗口
 * 注意：仅设为可见并刷新，不调用 activate()。
 * 避免与 _commandSprite 的键盘输入冲突。
 */
GF.BAUI.showActorWindow = function () {
    const window = GF.BAUI.getActorWindow();
    if (!window) return;
    window.refresh();
    window.show();
};

/**
 * 隐藏角色状态窗口
 */
GF.BAUI.hideActorWindow = function () {
    const window = GF.BAUI.getActorWindow();
    if (!window) return;
    if (GF.BAUI.actorWindowHideWithAnim) {
        // 通过 invert 移动动画收回
        window.deactivate();
        window.invertInitParamData();
    } else {
        // 立即隐藏
        window.hide();
    }
};

//=============================================================================
// PluginManager
//=============================================================================

// ---- 角色按钮条（侧视战斗） ----

PluginManager.registerCommand(GF.BAUI.pluginName, 'ShowPartySprite', args => {
    GF.BAUI.showPartySprite();
});

PluginManager.registerCommand(GF.BAUI.pluginName, 'HidePartySprite', args => {
    GF.BAUI.hidePartySprite();
});

// ---- 角色状态窗口（正视图战斗） ----

PluginManager.registerCommand(GF.BAUI.pluginName, 'ShowActorWindow', args => {
    GF.BAUI.showActorWindow();
});

PluginManager.registerCommand(GF.BAUI.pluginName, 'HideActorWindow', args => {
    GF.BAUI.hideActorWindow();
});

// ---- 全部 ----

PluginManager.registerCommand(GF.BAUI.pluginName, 'ShowAll', args => {
    GF.BAUI.showPartySprite();
    GF.BAUI.showActorWindow();
});

PluginManager.registerCommand(GF.BAUI.pluginName, 'HideAll', args => {
    GF.BAUI.hidePartySprite();
    GF.BAUI.hideActorWindow();
});

//=============================================================================
// End of File
//=============================================================================
