//=============================================================================
// GF Plugins
// 57_GF_4_BattleSpeedCtrl.js
//=============================================================================

var Imported = Imported || {};
Imported['57_GF_4_BattleSpeedCtrl'] = true;

var GF = GF || {};
GF.BSC = GF.BSC || {};
GF.BSC.version = 1.01;
GF.BSC.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.01]        战斗 - 战斗速度快捷键
 * @author 57 & deepseek
 * @url https://afdian.net/a/ganfly
 * @orderAfter GF_2_CoreOfOption
 * @base GF_2_CoreOfOption
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 * 
 * 这是一个免费插件，如果您是通过付费方式获得了此插件，请立即要求收费方退款。
 * 
 * 在战斗中按快捷键直接调整战斗速度，支持在四个档位间循环切换。
 * 
 *     正常 → 快速 → 很快 → 极快 → 快速 → ...
 * 
 * 调整后的速度会保存到系统设置中，下一场战斗保留，且在设置画面中也同步更新。
 *
 * ============================================================================
 *  前置需求
 * ============================================================================
 *
 * 这个插件只能在RPGMakerMZ上运行。
 *
 * ---- 前置插件列表 ----
 *
 * GF_2_CoreOfOption          系统 - 设置核心
 * GF_2_CoreOfBattle          系统 - 战斗核心 (可选，仅有战斗场景时生效)
 *
 * ---- 第4层 ----
 *
 * 这个插件是第4层插件，必须放在第0，1，2，3层下面，所有第5层GF插件的上面。
 *    
 * ============================================================================
 *  按键说明
 * ============================================================================
 *
 * 在战斗中按加速按键或减速按键即可调整战斗速度。
 * 
 * 按键名称为 RMMZ 标准 Input 系统支持的按键名称，常用的有：
 *   pagedown , pageup , a~z , 0~9 , f1~f12 ,
 *   ok , cancel , shift , control , tab , escape 等
 * 
 * GF_0_CoreOfGame 额外将 W 键映射为 pagedown ，Q 键映射为 pageup。
 * 如果你安装了 GF_0_CoreOfGame，可以方便地使用 W/Q 快捷键。
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
 * [v1.01] 修复加速时战斗指令光标移动也变快的问题。
 *
 * ============================================================================
 *  帮助结束
 * ============================================================================
 *
 * @param SpeedUpKey
 * @text 加速按键
 * @desc 在战斗中按此键提升战斗速度。可填写RMMZ Input系统支持的按键名称。
 * 安装了GF_0_CoreOfGame时，'pagedown' 亦可通过按 W 触发。
 * @default pagedown
 *
 * @param SpeedDownKey
 * @text 减速按键
 * @desc 在战斗中按此键降低战斗速度。可填写RMMZ Input系统支持的按键名称。
 * 安装了GF_0_CoreOfGame时，'pageup' 亦可通过按 Q 触发。
 * @default pageup
 *
 * @param SeName
 * @text 切换音效
 * @desc 切换战斗速度时播放的音效。留空则不播放。
 * @type file
 * @dir audio/se/
 * @require 1
 * @default
 *
 * @param SeVolume
 * @text 音效音量
 * @type number
 * @min 0
 * @max 100
 * @desc 音效音量，0~100。
 * @default 90
 *
 * @param SePitch
 * @text 音效音调
 * @type number
 * @min 50
 * @max 150
 * @desc 音效音调，50~150，100为原调。
 * @default 100
 *
 * @param SePan
 * @text 音效声相
 * @type number
 * @min -100
 * @max 100
 * @desc 音效声相，-100为左声道，0为居中，100为右声道。
 * @default 0
 */
//=============================================================================

//=============================================================================
// 前置依赖检查
//=============================================================================

if (!Imported.GF_2_CoreOfOption) {
    alert("错误:未找到前置插件 GF_2_CoreOfOption。\n请确保已安装并启用 GF_2_CoreOfOption 插件，并将其放置在 57_GF_4_BattleSpeedCtrl 插件之前。");
}

//=============================================================================
// 参数定义
//=============================================================================

GF.Parameters = PluginManager.parameters(GF.BSC.pluginName);
GF.Param = GF.Param || {};

GF.Param.BSCSpeedUpKey = String(GF.Parameters['SpeedUpKey'] || 'pagedown');
GF.Param.BSCSpeedDownKey = String(GF.Parameters['SpeedDownKey'] || 'pageup');
GF.Param.BSCSeName = String(GF.Parameters['SeName'] || '');
GF.Param.BSCSeVolume = Number(GF.Parameters['SeVolume'] || 90);
GF.Param.BSCSePitch = Number(GF.Parameters['SePitch'] || 100);
GF.Param.BSCSePan = Number(GF.Parameters['SePan'] || 0);

//=============================================================================
// 战斗速度档位文本
//=============================================================================

GF.BSC.SpeedLabels = ['正常', '快速', '很快', '极快'];

//=============================================================================
// 播放切换音效
//=============================================================================

GF.BSC.playChangeSound = function() {
    const name = GF.Param.BSCSeName;
    if (!name) return;
    AudioManager.playSe({
        name: name,
        volume: GF.Param.BSCSeVolume,
        pitch: GF.Param.BSCSePitch,
        pan: GF.Param.BSCSePan
    });
};

//=============================================================================
// Window_Selectable — 加速时跳过光标移动
//=============================================================================

// 在加速循环的额外帧中，跳过光标移动处理，防止光标移动加速
GF.BSC.Window_Selectable_processCursorMove = Window_Selectable.prototype.processCursorMove;
Window_Selectable.prototype.processCursorMove = function() {
    if (GF.BSC._suppressCursorInput) return;
    GF.BSC.Window_Selectable_processCursorMove.call(this);
};

//=============================================================================
// Scene_Battle — 标记加速循环（抑制所有按键输入）
//=============================================================================

// 覆写加速循环，在额外更新帧期间临时屏蔽所有 Input.isTriggered/isRepeated，
// 防止战斗 UI 窗口的输入处理也跟着加速。
// 同时放宽守卫条件，让加速在战斗演出阶段（BattleManager.isBusy() == true）也生效。
GF.BSC.Scene_Battle_updateBattleAniSpeedLoop = Scene_Battle.prototype.updateBattleAniSpeedLoop;
Scene_Battle.prototype.updateBattleAniSpeedLoop = function() {
    const time = ConfigManager.battleSpeed;
    if (time === undefined) return;
    if (time <= 0) return;
    // 不检查 BattleManager.isBusy()，让加速覆盖战斗演出阶段
    if (this._battleAniSpeedLoop) return;
    if ($gameMessage.isBusy()) return;
    this._battleAniSpeedLoop = true;
    GF.BSC._suppressCursorInput = true;
    // 临时替换 Input 方法，让额外帧不重复处理按键
    const _isTriggered = Input.isTriggered;
    const _isRepeated = Input.isRepeated;
    Input.isTriggered = function() { return false; };
    Input.isRepeated = function() { return false; };
    for (let i = 0; i < time; i++) {
        this.update();
        SceneManager.updateEffekseer();
    }
    Input.isTriggered = _isTriggered;
    Input.isRepeated = _isRepeated;
    GF.BSC._suppressCursorInput = false;
    this._battleAniSpeedLoop = false;
};

//=============================================================================
// Scene_Battle — 按键检测
//=============================================================================

GF.BSC.Scene_Battle_update = Scene_Battle.prototype.update;
Scene_Battle.prototype.update = function() {
    GF.BSC.Scene_Battle_update.call(this);
    this.updateBattleSpeedCtrl();
};

Scene_Battle.prototype.updateBattleSpeedCtrl = function() {
    // 只在非忙碌状态下处理按键
    if (BattleManager.isBusy()) return;
    if (this._battleAniSpeedLoop) return;
    if ($gameMessage.isBusy()) return;
    if (ConfigManager.battleSpeed === undefined) return;

    const speedUpKey = GF.Param.BSCSpeedUpKey;
    const speedDownKey = GF.Param.BSCSpeedDownKey;
    const currentSpeed = Number(ConfigManager.battleSpeed) || 0;

    if (Input.isTriggered(speedUpKey)) {
        // 加速循环: 0→1→2→3→0
        const newSpeed = (currentSpeed + 1) % 4;
        ConfigManager.battleSpeed = newSpeed;
        GF.BSC.playChangeSound();
    } else if (Input.isTriggered(speedDownKey)) {
        // 减速循环: 0→3→2→1→0
        const newSpeed = (currentSpeed + 3) % 4;
        ConfigManager.battleSpeed = newSpeed;
        GF.BSC.playChangeSound();
    }
};
