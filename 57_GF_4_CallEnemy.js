//=============================================================================
// GF Plugins
// 57_GF_4_CallEnemy.js
//=============================================================================

var Imported = Imported || {};
Imported['57_GF_4_CallEnemy'] = true;

var GF = GF || {};
GF.CLE = GF.CLE || {};
GF.CLE.version = 1.00;
GF.CLE.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.00]        战斗 - 敌人召唤
 * @author 用户自定（移植自 NRP_CallEnemy by Takeshi Sunagawa）
 * @url https://afdian.net/a/ganfly
 * @orderAfter GF_0_CoreOfGame
 * @base GF_0_CoreOfGame
 * @orderAfter GF_2_CoreOfBattle
 * @base GF_2_CoreOfBattle
 * @orderAfter GF_2_CoreOfEnemy
 * @base GF_2_CoreOfEnemy
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 *
 * 这是一个免费插件，如果您是通过付费方式获得了此插件，请立即要求收费方退款。
 *
 * 本插件为敌人添加了"召唤同伴"的功能，可与 GF ATB 战斗系统配合使用。
 * 召唤出的敌人会自动出现在战场空位，并带有入场动画效果。
 * 本插件不依赖 NRP 系列插件，完全适配 GF 插件体系。
 *
 * ============================================================================
 *  前置需求
 * ============================================================================
 *
 * 这个插件只能在 RPGMakerMZ 上运行。
 *
 * ---- 前置插件列表 ----
 *
 * GF_0_CoreOfGame              系统 - 游戏核心
 * GF_2_CoreOfBattle            系统 - 战斗核心
 * GF_2_CoreOfEnemy             系统 - 敌人核心（用于敌群排列定位）
 *
 * ---- 可选前置 ----
 *
 * GF_3_BattleSystemATB         战斗 - ATB 战斗系统（支持 ATB 出场初始化）
 *
 * ---- 第4层 ----
 *
 * 这个插件是第4层插件，必须放在第0，1，2，3层下面，所有第5层GF插件的上面。
 *
 * ============================================================================
 *  兼容性
 * ============================================================================
 *
 * ---- 可扩展插件列表 ----
 *
 * GF_3_BattleSystemATB         战斗 - ATB 战斗系统
 *
 *     本插件与GF_3_BattleSystemATB共同使用时，召唤出的敌人会自动按ATB规则
 *     初始化充能进度，无需额外设置。
 *
 * ---- 敌群排列定位 ----
 *
 *     本插件优先使用 GF_2_CoreOfEnemy 的敌群排列系统为召唤敌人定位。
 *     你可以在本插件的参数中为不同敌群绑定召唤专用的排列样式：
 *
 *     • 「默认召唤排列样式」— 全局默认，填 0 表示沿用敌人核心的默认值
 *     • 「召唤阵型绑定」— 为特定敌群指定召唤时专用的排列样式 ID
 *       （样式 ID 对应 GF_2_CoreOfEnemy → 敌群排列样式 中的定义）
 *
 *     若未配置任何排列样式，将回退到网格自动定位（自动定位参数）。
 *
 * ============================================================================
 *  备注（notetag）
 * ============================================================================
 *
 * --- 技能备注（Skill Notetags）---
 *
 *  <CallEnemy: x>                /  <召唤敌人: x>
 *      设置该技能召唤敌人的 ID。x 为敌人数据库中的 ID。
 *      省略 ID 只写 <CallEnemy> 时，将召唤与技能使用者相同的敌人。
 *
 *  <CallEnemy: 1~5>             /  <召唤敌人: 1~5>
 *      ID 范围指定，随机召唤 1~5 号中的一名敌人。
 *
 *  <CallEnemy: 1,3,5>           /  <召唤敌人: 1,3,5>
 *      逗号分隔多个 ID，随机召唤其中之一。
 *
 *  <CallEnemyXY: x, y>          /  <坐标召唤: x, y>
 *      指定敌人出现的屏幕坐标（像素）。不指定则自动计算位置。
 *
 *  <CallEnemyEntry: style>      /  <登场效果: style>
 *      设置该技能的敌人登场动画风格。可选值：
 *      fade       - 淡入（透明度渐变）
 *      slide_left - 从左侧滑入
 *      slide_right- 从右侧滑入
 *      slide_top  - 从顶部滑入
 *      scale      - 从小到大缩放
 *      zoom       - 缩放+淡入组合
 *      none       - 无动画，瞬间出现
 *      不指定则使用插件参数的默认设置。
 *
 *  <CallEnemyEntryDuration: n>  /  <登场时长: n>
 *      设置该技能的登场动画持续帧数（1秒=60帧）。覆盖插件参数默认值。
 *
 * --- 敌人备注（Enemy Notetags）---
 *
 *  <CallEnemy: x>                /  <召唤敌人: x>
 *      设置该敌人被召唤时默认召唤的敌人 ID。
 *      仅在技能的 <CallEnemy> 没有指定 ID 时生效。
 *      同样支持范围（1~5）和逗号分隔（1,3,5）语法。
 *
 * ============================================================================
 *  插件指令（Plugin Command）
 * ============================================================================
 *
 *  敌人召唤
 *  在战斗事件中自由召唤指定敌人，可指定坐标。
 *
 * ============================================================================
 *  脚本接口（Script API）
 * ============================================================================
 *
 *  BattleManager.callEnemy(enemyId, x, y)
 *      在脚本中召唤指定 ID 的敌人。x、y 可选，留空则自动计算位置。
 *
 *  $gameTroop.callEnemy(enemyId, callArgs)
 *      底层调用，callArgs 可选字段：x, y, entryStyle, entryDuration
 *
 * ============================================================================
 *
 * @command CallEnemy
 * @text 敌人召唤
 * @desc 在战斗事件中召唤指定的敌人。
 *
 * @arg EnemyId
 * @text 敌人 ID
 * @type enemy
 * @desc 要召唤的敌人 ID。支持逗号分隔（1,3,5）和范围（1~5）语法。
 * 文本输入也支持公式。
 *
 * @arg X
 * @text X 坐标
 * @type string
 * @desc 敌人出现的屏幕 X 坐标。留空则自动计算。
 *
 * @arg Y
 * @text Y 坐标
 * @type string
 * @desc 敌人出现的屏幕 Y 坐标。留空则自动计算。
 *
 * @arg EntryStyle
 * @text 登场风格
 * @type select
 * @option 默认
 * @value default
 * @option 淡入
 * @value fade
 * @option 左侧滑入
 * @value slide_left
 * @option 右侧滑入
 * @value slide_right
 * @option 顶部滑入
 * @value slide_top
 * @option 缩放
 * @value scale
 * @option 缩放淡入
 * @value zoom
 * @option 无动画
 * @value none
 * @desc 登场动画风格。"默认"使用插件参数设定值。
 *
 * @arg EntryDuration
 * @text 登场时长
 * @type number
 * @min 0
 * @desc 登场动画持续帧数（1秒=60帧）。0表示使用插件参数默认值。
 *
 * @------------------------------------------------------------------
 * @ [插件参数] Plugin Parameters
 * @------------------------------------------------------------------
 *
 * @param MaxEnemyNo
 * @text 最大敌人数
 * @type number
 * @default 8
 * @min 1
 * @desc 战场上同时存在的最大敌人数（含阵亡）。超过此数则召唤失败。
 *
 * @param SuccessMessage
 * @text 成功消息
 * @type string
 * @default %1 出现了！
 * @desc 召唤成功时显示的消息。%1 将被替换为敌人名称。
 *
 * @param FailureMessage
 * @text 失败消息
 * @type string
 * @default 然而同伴没有出现！
 * @desc 召唤失败时显示的消息（已达最大敌人数等）。
 *
 * @param DeleteDeadEnemy
 * @text 清除阵亡敌人
 * @type boolean
 * @default false
 * @desc 召唤时移除已阵亡的敌人，防止位置冲突。
 * 注意：会阻止对已移除敌人的复活。
 *
 * @param EntryAnimation
 * @text 默认登场动画
 * @type select
 * @option 无动画
 * @value none
 * @option 淡入
 * @value fade
 * @option 左侧滑入
 * @value slide_left
 * @option 右侧滑入
 * @value slide_right
 * @option 顶部滑入
 * @value slide_top
 * @option 缩放
 * @value scale
 * @option 缩放淡入
 * @value zoom
 * @desc 敌人登场时的默认动画效果。技能可单独覆盖此设置。
 * @default fade
 *
 * @param EntryDuration
 * @text 动画时长（帧）
 * @type number
 * @default 30
 * @min 1
 * @max 300
 * @desc 登场动画持续时长（帧数，1秒=60帧）。建议值：淡入 15~30，滑入 20~40。
 *
 * @param AutoPosBaseX
 * @text 自动定位-基准X
 * @type number
 * @default 600
 * @desc 自动计算敌人位置时的基准 X 坐标（屏幕像素）。
 * 
 * @param AutoPosBaseY
 * @text 自动定位-基准Y
 * @type number
 * @default 240
 * @desc 自动计算敌人位置时的基准 Y 坐标（屏幕像素）。
 *
 * @param AutoPosSpacingX
 * @text 自动定位-间隔X
 * @type number
 * @default 130
 * @min 10
 * @desc 敌人之间的水平间隔像素。
 *
 * @param AutoPosSpacingY
 * @text 自动定位-间隔Y
 * @type number
 * @default 110
 * @min 10
 * @desc 敌人之间的垂直间隔像素。
 *
 * @param AutoPosCols
 * @text 自动定位-列数
 * @type number
 * @default 4
 * @min 1
 * @desc 自动排列时每行的敌人数量。
 *
 * @param DefaultSummonCood
 * @text 默认召唤排列样式
 * @type number
 * @min 0
 * @desc 召唤敌人时使用的默认敌群排列样式ID（对应敌人核心的敌群排列样式）。
 * 0=使用敌人核心的默认敌群排列。
 *
 * @param SummonCoodBind
 * @text 召唤阵型绑定
 * @type struct<CLE_SummonCoodBind>[]
 * @desc 为不同敌群绑定召唤专用的敌群排列样式ID。
 * 不绑定的敌群将使用「默认召唤排列样式」。
 * @default []
 *
 */
/*~struct~CLE_SummonCoodBind:
 *
 * @param Troops
 * @text 受影响的敌群ID
 * @type troop[]
 * @desc 受影响的敌群ID
 * @default []
 *
 * @param TroopSetId
 * @text 召唤排列样式ID
 * @type number
 * @desc 召唤时使用的敌群排列样式ID（对应敌人核心中定义的排列样式ID）。
 * @default 0
 *
 */

//-----------------------------------------------------------------------------
// Plugin Parameters
//-----------------------------------------------------------------------------

var CLE = GF.CLE;

CLE.Parameters = PluginManager.parameters(CLE.pluginName);
CLE.Param = CLE.Param || {};

CLE.Param.MaxEnemyNo       = Number(CLE.Parameters['MaxEnemyNo'] || 8);
CLE.Param.SuccessMessage   = String(CLE.Parameters['SuccessMessage'] || '%1 出现了！');
CLE.Param.FailureMessage   = String(CLE.Parameters['FailureMessage'] || '然而同伴没有出现！');
CLE.Param.DeleteDeadEnemy  = CLE.Parameters['DeleteDeadEnemy'] === 'true';
CLE.Param.EntryAnimation   = String(CLE.Parameters['EntryAnimation'] || 'fade');
CLE.Param.EntryDuration    = Number(CLE.Parameters['EntryDuration'] || 30);
CLE.Param.AutoPosBaseX     = Number(CLE.Parameters['AutoPosBaseX'] || 600);
CLE.Param.AutoPosBaseY     = Number(CLE.Parameters['AutoPosBaseY'] || 240);
CLE.Param.AutoPosSpacingX  = Number(CLE.Parameters['AutoPosSpacingX'] || 130);
CLE.Param.AutoPosSpacingY  = Number(CLE.Parameters['AutoPosSpacingY'] || 110);
CLE.Param.AutoPosCols      = Number(CLE.Parameters['AutoPosCols'] || 4);

// 召唤专用敌群排列绑定
CLE.Param.DefaultSummonCood = Number(CLE.Parameters['DefaultSummonCood'] || 0);
CLE.Param.SummonCoodBind = (() => {
    const data = {};
    try {
        const sets = JSON.parse(CLE.Parameters['SummonCoodBind'] || '[]');
        for (let i = 0; i < sets.length; i++) {
            const set = JSON.parse(sets[i] || '{}');
            set.Troops = JSON.parse(set.Troops || '[]');
            for (let j = 0; j < set.Troops.length; j++) {
                data[set.Troops[j]] = Number(set.TroopSetId);
            }
        }
    } catch (e) {
        console.warn('57_GF_4_CallEnemy: SummonCoodBind parse error', e);
    }
    return data;
})();

//=============================================================================
// Dependency Check
//=============================================================================

if (!Imported.GF_0_CoreOfGame) {
    alert('错误: 未找到前置插件 GF_0_CoreOfGame。\n请确保已安装并启用 GF_0_CoreOfGame 插件。');
} else if (!Imported.GF_2_CoreOfEnemy) {
    alert('错误: 未找到前置插件 GF_2_CoreOfEnemy。\n请确保已安装并启用 GF_2_CoreOfEnemy 插件。');
} else if (GF.COEY.version < 1.04) {
    alert('错误: 前置插件 GF_2_CoreOfEnemy 版本过低。\n请升级至最新版本。');
}

//=============================================================================
// Helper Functions
//=============================================================================

/**
 * 将注记中的 ID 字符串解析为数组。
 * 支持语法：单独数字、逗号分隔（1,3,5）、范围（1~5）
 * @param {string} targetId - 注记字符串
 * @returns {number[]} 敌人 ID 数组
 */
function CLE_makeTargets(targetId) {
    const targets = [];
    if (targetId === undefined || targetId === null || targetId === '') {
        return targets;
    }
    for (let id of String(targetId).split(',')) {
        id = id.trim();
        if (id.indexOf('~') >= 0) {
            const parts = id.split('~');
            const start = parseInt(parts[0], 10);
            const end   = parseInt(parts[1], 10);
            if (isNaN(start) || isNaN(end)) continue;
            if (end < start) {
                for (let i = start; i >= end; i--) targets.push(i);
            } else {
                for (let i = start; i <= end; i++) targets.push(i);
            }
        } else {
            const val = parseInt(id, 10);
            if (!isNaN(val)) targets.push(val);
        }
    }
    return targets;
}

/**
 * 从 action 中获取要召唤的敌人 ID。
 * @param {Game_Action} action - 当前执行的行动
 * @returns {number|null} 敌人 ID，无效时返回 null
 */
function CLE_getCallEnemyId(action) {
    const meta = action.item().meta.CallEnemy;
    if (!meta) return null;

    let enemyId;
    if (meta === true) {
        // 未指定 ID：从使用者获取
        const subject = action.subject();
        if (!subject) return null;
        if (!subject.isEnemy()) {
            // 主角使用此技能时需在注记中明确指定敌人 ID
            console.warn('57_GF_4_CallEnemy: <CallEnemy> without ID used by non-enemy subject, ignored');
            return null;
        }
        const dataEnemy = subject.enemy();
        if (dataEnemy && dataEnemy.meta && dataEnemy.meta.CallEnemy) {
            const ids = CLE_makeTargets(dataEnemy.meta.CallEnemy);
            enemyId = ids.length > 0 ? ids[Math.randomInt(ids.length)] : null;
        } else {
            enemyId = subject.enemyId();
        }
    } else {
        const ids = CLE_makeTargets(meta);
        enemyId = ids.length > 0 ? ids[Math.randomInt(ids.length)] : null;
    }
    return enemyId;
}

/**
 * 从技能/敌人注记中获取登场动画风格。
 * @param {Game_Action} action - 当前行动
 * @param {Game_Enemy} newEnemy - 新召唤的敌人
 * @returns {string} 动画风格名称
 */
function CLE_getEntryStyle(action, newEnemy) {
    if (action && action.item()) {
        const meta = action.item().meta.CallEnemyEntry;
        if (meta && meta !== 'default') return meta;
        // 检查中文注记
        const metaCn = action.item().meta['登场效果'];
        if (metaCn && metaCn !== 'default') return metaCn;
    }
    return CLE.Param.EntryAnimation;
}

/**
 * 从技能/敌人注记中获取登场动画时长。
 * @param {Game_Action} action - 当前行动
 * @returns {number} 动画帧数
 */
function CLE_getEntryDuration(action) {
    if (action && action.item()) {
        const meta = action.item().meta.CallEnemyEntryDuration;
        if (meta) {
            const val = parseInt(meta, 10);
            if (!isNaN(val) && val > 0) return val;
        }
        // 中文注记
        const metaCn = action.item().meta['登场时长'];
        if (metaCn) {
            const val = parseInt(metaCn, 10);
            if (!isNaN(val) && val > 0) return val;
        }
    }
    return CLE.Param.EntryDuration;
}

/**
 * 获取召唤坐标的注记覆盖。
 * @param {Game_Action} action - 当前行动
 * @returns {{x: number|null, y: number|null}|null}
 */
function CLE_getXYFromNote(action) {
    if (!action || !action.item()) return null;
    const meta = action.item().meta.CallEnemyXY;
    if (meta) {
        const parts = String(meta).split(',');
        if (parts.length >= 2) {
            const x = parseInt(parts[0].trim(), 10);
            const y = parseInt(parts[1].trim(), 10);
            if (!isNaN(x) && !isNaN(y)) return { x: x, y: y };
        }
    }
    // 中文注记
    const metaCn = action.item().meta['坐标召唤'];
    if (metaCn) {
        const parts = String(metaCn).split(',');
        if (parts.length >= 2) {
            const x = parseInt(parts[0].trim(), 10);
            const y = parseInt(parts[1].trim(), 10);
            if (!isNaN(x) && !isNaN(y)) return { x: x, y: y };
        }
    }
    return null;
}

/**
 * 获取召唤敌人时应使用的敌群排列样式 ID。
 * 优先级：
 *   1. 本插件的 SummonCoodBind[当前敌群ID]
 *   2. 本插件的 DefaultSummonCood（>0 时）
 *   3. GF_2_CoreOfEnemy 的绑定/默认值
 * @returns {number|undefined} 样式 ID，undefined 表示无排列
 */
function CLE_getTroopCoodStyle() {
    const troopId = $gameTroop._troopId;

    // 1. 检查召唤专用绑定
    if (CLE.Param.SummonCoodBind && CLE.Param.SummonCoodBind[troopId]) {
        return CLE.Param.SummonCoodBind[troopId];
    }

    // 2. 检查召唤默认样式（>0 才使用）
    if (CLE.Param.DefaultSummonCood > 0) {
        return CLE.Param.DefaultSummonCood;
    }

    // 3. 回退到 GF_2_CoreOfEnemy 的设定
    if (Imported.GF_2_CoreOfEnemy) {
        if (GF.Param.COEYTroopCoodBind && GF.Param.COEYTroopCoodBind[troopId]) {
            return GF.Param.COEYTroopCoodBind[troopId];
        }
        if (GF.Param.COEYDefaultTroopCood > 0) {
            return GF.Param.COEYDefaultTroopCood;
        }
    }

    return 0;
}

/**
 * 使用 GF_2_CoreOfEnemy 的敌群排列系统计算新敌人的位置。
 * 优先使用 GF 的排列样式，若无配置则回退到网格自动定位。
 * @param {Game_Enemy} newEnemy - 新召唤的敌人
 * @param {number} enemyIndex - 新敌人在 $gameTroop._enemies 中的索引
 * @returns {{x: number, y: number}} 屏幕坐标
 */
function CLE_getGFPosition(newEnemy, enemyIndex) {
    // 尝试使用 GF 敌群排列系统
    if (Imported.GF_2_CoreOfEnemy) {
        const styleId = CLE_getTroopCoodStyle();
        if (styleId) {
            const data = GF.COEY.TroopCoodSet[styleId];
            if (data) {
                const cood = $gameTroop.getEnemyCustomCood(data, enemyIndex);
                // 只使用 GF 返回的合法坐标（>0），与 setupEnemyCood 逻辑一致
                if (cood && cood.x > 0 && cood.y > 0) {
                    return { x: cood.x, y: cood.y };
                }
            }
        }
    }

    // 回退：网格自动定位
    const cols = CLE.Param.AutoPosCols;
    const col = enemyIndex % cols;
    const row = Math.floor(enemyIndex / cols);
    return {
        x: CLE.Param.AutoPosBaseX + col * CLE.Param.AutoPosSpacingX,
        y: CLE.Param.AutoPosBaseY + row * CLE.Param.AutoPosSpacingY
    };
}

/**
 * 在 Sprite_Enemy 上启动入场动画。
 * 设置初始状态，动画将随着每帧 update 播放。
 * @param {Sprite_Enemy} sprite - 敌人精灵
 * @param {string} style - 动画风格
 * @param {number} duration - 持续帧数
 */
function CLE_startEntryAnimation(sprite, style, duration) {
    if (style === 'none' || duration <= 0) {
        sprite.opacity = 255;
        sprite.scale.x = 1;
        sprite.scale.y = 1;
        return;
    }
    sprite._CLE_animating = true;
    sprite._CLE_animStyle = style;
    sprite._CLE_animDuration = duration;
    sprite._CLE_animTimer = 0;

    switch (style) {
        case 'fade':
            sprite.opacity = 0;
            sprite.scale.x = 1;
            sprite.scale.y = 1;
            break;
        case 'slide_left':
            sprite.opacity = 255;
            // 使用 _offsetX 实现滑入（_homeX + _offsetX 决定最终 x）
            sprite._CLE_animStartOffset = sprite._offsetX;
            sprite._offsetX = sprite._offsetX - 500;
            sprite._CLE_animEndOffset = sprite._CLE_animStartOffset;
            sprite.scale.x = 1;
            sprite.scale.y = 1;
            break;
        case 'slide_right':
            sprite.opacity = 255;
            sprite._CLE_animStartOffset = sprite._offsetX;
            sprite._offsetX = sprite._offsetX + 500;
            sprite._CLE_animEndOffset = sprite._CLE_animStartOffset;
            sprite.scale.x = 1;
            sprite.scale.y = 1;
            break;
        case 'slide_top':
            sprite.opacity = 255;
            sprite._CLE_animStartOffset = sprite._offsetY;
            sprite._offsetY = sprite._offsetY - 400;
            sprite._CLE_animEndOffset = sprite._CLE_animStartOffset;
            sprite.scale.x = 1;
            sprite.scale.y = 1;
            break;
        case 'scale':
            sprite.opacity = 255;
            sprite.scale.x = 0.3;
            sprite.scale.y = 0.3;
            break;
        case 'zoom':
            sprite.opacity = 0;
            sprite.scale.x = 0.1;
            sprite.scale.y = 0.1;
            break;
        default:
            sprite._CLE_animating = false;
            sprite.opacity = 255;
            sprite.scale.x = 1;
            sprite.scale.y = 1;
            break;
    }
}

//-----------------------------------------------------------------------------
// Plugin Command
//-----------------------------------------------------------------------------

PluginManager.registerCommand(CLE.pluginName, 'CallEnemy', function(args) {
    const enemyIdStr = String(args.EnemyId || '');
    const entryStyle = String(args.EntryStyle || 'default');
    const entryDuration = Number(args.EntryDuration) || 0;

    // 解析敌人 ID（支持逗号和范围语法）
    const enemyIds = CLE_makeTargets(enemyIdStr);
    if (enemyIds.length === 0) return;
    const enemyId = enemyIds[Math.randomInt(enemyIds.length)];

    // 坐标
    let x = null, y = null;
    if (args.X && args.X !== '') {
        const parsed = Number(args.X);
        if (!isNaN(parsed)) x = parsed;
    }
    if (args.Y && args.Y !== '') {
        const parsed = Number(args.Y);
        if (!isNaN(parsed)) y = parsed;
    }

    // 构造参数
    const callArgs = {};
    if (x !== null && y !== null) {
        callArgs.x = x;
        callArgs.y = y;
    }
    if (entryStyle !== 'default') callArgs.entryStyle = entryStyle;
    if (entryDuration > 0) callArgs.entryDuration = entryDuration;

    // 执行召唤
    const subject = BattleManager._subject || $gameTroop.aliveMembers()[0];
    if (!subject) return;
    const action = new Game_Action(subject);
    action.callEnemy(enemyId, callArgs);

    // 换行
    BattleManager._logWindow.push('waitForNewLine');
    BattleManager._logWindow.push('popBaseLine');
    BattleManager._logWindow.push('clear');
});

//-----------------------------------------------------------------------------
// BattleManager
//-----------------------------------------------------------------------------

/**
 * 判断当前行动是否为召唤敌人的技能。
 */
BattleManager.isCallEnemySkill = function() {
    const action = BattleManager._action;
    if (action) {
        const item = action.item();
        return item && !!item.meta.CallEnemy;
    }
    return false;
};

/**
 * 脚本接口：直接召唤指定敌人。
 * @param {number} enemyId - 敌人 ID
 * @param {number} [x] - X 坐标（可选）
 * @param {number} [y] - Y 坐标（可选）
 */
BattleManager.callEnemy = function(enemyId, x, y) {
    const subject = this._subject || $gameTroop.aliveMembers()[0];
    if (!subject) return;
    const action = new Game_Action(subject);
    const callArgs = {};
    if (x !== undefined && y !== undefined) {
        callArgs.x = x;
        callArgs.y = y;
    }
    action.callEnemy(enemyId, callArgs);
};

//-----------------------------------------------------------------------------
// Game_Action
//-----------------------------------------------------------------------------

/**
 * 保存当前召唤行动的相关数据，供后续流程使用。
 */
var CLE_currentCallData = null;

/**
 * 执行敌人召唤。
 * @param {number} enemyId - 要召唤的敌人 ID
 * @param {object} [callArgs] - 可选参数
 */
Game_Action.prototype.callEnemy = function(enemyId, callArgs) {
    // 检查最大敌人数限制
    const aliveCount = $gameTroop.aliveMembers().length;
    if (CLE.Param.MaxEnemyNo > 0 && CLE.Param.MaxEnemyNo <= aliveCount) {
        // 显示失败消息
        BattleManager._logWindow.displayCallEnemy(this, this.subject(), null, callArgs);
        return;
    }

    // 清除阵亡敌人（防止位置冲突）
    if (CLE.Param.DeleteDeadEnemy) {
        for (const enemy of $gameTroop.deadMembers()) {
            enemy.prohibitRevive();
        }
    }

    // 创建新敌人实例
    const newEnemy = new Game_Enemy(enemyId, 0, 0, true);
    $gameTroop._enemies.push(newEnemy);
    $gameTroop.makeUniqueNames();

    // 保存召唤数据供后续使用
    CLE_currentCallData = {
        enemy: newEnemy,
        sprite: null,
        args: callArgs || {}
    };

    // 预加载精灵
    CLE_currentCallData.sprite = new Sprite_Enemy(newEnemy);

    // 标记成功
    this.makeSuccess(newEnemy);
    BattleManager._logWindow.displayCallEnemy(this, newEnemy, CLE_currentCallData.sprite, callArgs);
};

//-----------------------------------------------------------------------------
// BattleManager — invokeAction hook
//-----------------------------------------------------------------------------

const CLE_BattleManager_invokeAction = BattleManager.invokeAction;
BattleManager.invokeAction = function(subject, target) {
    CLE_BattleManager_invokeAction.apply(this, arguments);

    if (BattleManager.isCallEnemySkill()) {
        const enemyId = CLE_getCallEnemyId(this._action);
        if (enemyId) {
            this._action.callEnemy(enemyId);
        }
    }
};

//-----------------------------------------------------------------------------
// Window_BattleLog
//-----------------------------------------------------------------------------

/**
 * 显示召唤消息并推入登场流程。
 */
Window_BattleLog.prototype.displayCallEnemy = function(action, target, targetSprite, callArgs) {
    if (!target) {
        // 已达上限，显示失败
        if (CLE.Param.FailureMessage) {
            this.push('addText', CLE.Param.FailureMessage);
        }
        return;
    }

    if (target.result() && target.result().success) {
        if (CLE.Param.SuccessMessage) {
            this.push('addText', CLE.Param.SuccessMessage.format(target.name()));
        }
        // 等待图片加载
        this._waitMode = 'callEnemy';
        this.push('performCallEnemy', action, target, targetSprite, callArgs);
    } else if (CLE.Param.FailureMessage) {
        this.push('addText', CLE.Param.FailureMessage);
    }
};

/**
 * 等待模式检查：等待敌人图片加载完成。
 */
const CLE_Window_BattleLog_updateWaitMode = Window_BattleLog.prototype.updateWaitMode;
Window_BattleLog.prototype.updateWaitMode = function() {
    if (this._waitMode === 'callEnemy') {
        // 等待精灵图片加载完成
        if (CLE_currentCallData && CLE_currentCallData.sprite) {
            const bitmap = CLE_currentCallData.sprite.bitmap;
            if (bitmap && !bitmap.isReady()) {
                return true;
            }
        }
        // 图片加载完成，清除等待标记
        this._waitMode = '';
    }
    return CLE_Window_BattleLog_updateWaitMode.apply(this, arguments);
};

/**
 * 执行敌人登场：将精灵添加到 Spriteset 并启动入场动画。
 */
Window_BattleLog.prototype.performCallEnemy = function(action, newEnemy, newSprite, callArgs) {
    if (!newEnemy || !newSprite) return;

    const spriteset = this._spriteset;
    if (!spriteset) return;
    if (!spriteset._enemySprites || !spriteset._battleField) return;

    // ---- 1. 获取动画参数 ----
    const entryStyle = (callArgs && callArgs.entryStyle) || CLE_getEntryStyle(action, newEnemy);
    const entryDuration = (callArgs && callArgs.entryDuration) || CLE_getEntryDuration(action);

    // ---- 2. 添加精灵到 Spriteset ----
    spriteset._enemySprites.push(newSprite);
    spriteset._enemySprites.sort(spriteset.compareEnemySprite.bind(spriteset));
    spriteset._battleField.addChild(newSprite);

    // ---- 3. 设置位置 ----
    // 3a. 优先使用 callArgs 传入的坐标
    let posX = null, posY = null;
    if (callArgs && callArgs.x !== null && callArgs.x !== undefined &&
        callArgs.y !== null && callArgs.y !== undefined) {
        posX = callArgs.x;
        posY = callArgs.y;
    }

    // 3b. 检查技能注记中的坐标
    if (posX === null) {
        const noteXY = CLE_getXYFromNote(action);
        if (noteXY) {
            posX = noteXY.x;
            posY = noteXY.y;
        }
    }

    // 3c. 使用 GF 排列系统或回退自动定位
    if (posX === null) {
        const enemyIndex = $gameTroop._enemies.indexOf(newEnemy);
        if (enemyIndex >= 0) {
            const pos = CLE_getGFPosition(newEnemy, enemyIndex);
            posX = pos.x;
            posY = pos.y;
        }
    }

    // 应用位置
    if (posX !== null && posY !== null) {
        newSprite.x = posX;
        newSprite.y = posY;
        // 同步到 Game_Enemy（使用 GF 的标准 setupCood 方法）
        newEnemy.setupCood(posX, posY);
    }

    // ---- 4. 同步 home 坐标 ----
    const battler = newSprite._battler;
    newSprite.setHome(battler.screenX(), battler.screenY());
    battler._homeX = newSprite._homeX;
    battler._homeY = newSprite._homeY;

    // ---- 5. 按 Y 坐标重新排序 ----
    spriteset._enemySprites.sort(spriteset.compareEnemySprite.bind(spriteset));
    // 重新调整 child 顺序以匹配排序
    for (const s of spriteset._enemySprites) {
        if (spriteset._battleField.children.indexOf(s) >= 0) {
            spriteset._battleField.removeChild(s);
            spriteset._battleField.addChild(s);
        }
    }

    // ---- 6. 初始化战斗状态（含 ATB 充能） ----
    newEnemy.onBattleStart();

    // ---- 7. 确保 GF 的 ATB 充能图标同步创建 ----
    if (Imported.GF_2_CoreOfBattle && newEnemy.tpbAddBattler) {
        newEnemy.tpbAddBattler();
    }

    // ---- 8. 启动入场动画 ----
    CLE_startEntryAnimation(newSprite, entryStyle, entryDuration);

    // ---- 9. 如果有动画，在日志中插入等待 ----
    if (entryStyle !== 'none' && entryDuration > 0) {
        this.push('wait', entryDuration);
    }
};

/**
 * 隐藏召唤技能的默认"失败"消息（由本插件自行控制）。
 */
const CLE_Window_BattleLog_displayFailure = Window_BattleLog.prototype.displayFailure;
Window_BattleLog.prototype.displayFailure = function(target) {
    if (BattleManager.isCallEnemySkill()) {
        return; // 不显示标准失败消息
    }
    CLE_Window_BattleLog_displayFailure.apply(this, arguments);
};

//-----------------------------------------------------------------------------
// Sprite_Enemy — Entry Animation Update
//-----------------------------------------------------------------------------

/**
 * 在 Sprite_Enemy.update 中添加入场动画更新。
 */
const CLE_Sprite_Enemy_update = Sprite_Enemy.prototype.update;
Sprite_Enemy.prototype.update = function() {
    CLE_Sprite_Enemy_update.call(this);

    // 入场动画
    if (this._CLE_animating) {
        this._CLE_animTimer++;
        const progress = Math.min(this._CLE_animTimer / this._CLE_animDuration, 1);
        // ease-out quad 缓出
        const eased = 1 - Math.pow(1 - progress, 2);

        switch (this._CLE_animStyle) {
            case 'fade':
                this.opacity = Math.round(255 * eased);
                break;
            case 'slide_left':
            case 'slide_right':
                // _offsetX 被 updatePosition() 每帧应用于 x
                this._offsetX = this._CLE_animStartOffset +
                    (this._CLE_animEndOffset - this._CLE_animStartOffset) * eased;
                break;
            case 'slide_top':
                // _offsetY 被 updatePosition() 每帧应用于 y
                this._offsetY = this._CLE_animStartOffset +
                    (this._CLE_animEndOffset - this._CLE_animStartOffset) * eased;
                break;
            case 'scale':
                this.scale.x = 0.3 + 0.7 * eased;
                this.scale.y = 0.3 + 0.7 * eased;
                break;
            case 'zoom':
                this.opacity = Math.round(255 * eased);
                this.scale.x = 0.1 + 0.9 * eased;
                this.scale.y = 0.1 + 0.9 * eased;
                break;
        }

        if (progress >= 1) {
            this._CLE_animating = false;
            // 确保最终状态
            this.opacity = 255;
            if (this._CLE_animStyle === 'slide_left' || this._CLE_animStyle === 'slide_right') {
                this._offsetX = this._CLE_animEndOffset;
            }
            if (this._CLE_animStyle === 'slide_top') {
                this._offsetY = this._CLE_animEndOffset;
            }
            this.scale.x = 1;
            this.scale.y = 1;
        }
    }
};

//-----------------------------------------------------------------------------
// Game_Battler — Prohibit Revive (for dead enemy cleanup)
//-----------------------------------------------------------------------------

/**
 * 标记为禁止复活。
 */
Game_Battler.prototype.prohibitRevive = function() {
    this._CLE_prohibitRevive = true;
};

/**
 * 检查是否禁止复活。
 */
Game_Battler.prototype.isProhibitRevive = function() {
    return !!this._CLE_prohibitRevive;
};

// ATB 模式下，如果删除了阵亡敌人，应阻止对它们的复活技能
if (CLE.Param.DeleteDeadEnemy) {
    const CLE_Game_Action_testApply = Game_Action.prototype.testApply;
    Game_Action.prototype.testApply = function(target) {
        if (this.isForDeadFriend() && target.isProhibitRevive && target.isProhibitRevive()) {
            return false;
        }
        return CLE_Game_Action_testApply.apply(this, arguments);
    };

    // 过滤掉复活禁止的敌人
    let CLE_checkProhibitRevive = false;

    const CLE_Game_Action_targetsForDead = Game_Action.prototype.targetsForDead;
    Game_Action.prototype.targetsForDead = function(unit) {
        CLE_checkProhibitRevive = true;
        const ret = CLE_Game_Action_targetsForDead.apply(this, arguments);
        CLE_checkProhibitRevive = false;
        return ret;
    };

    const CLE_Game_Troop_members = Game_Troop.prototype.members;
    Game_Troop.prototype.members = function() {
        if (CLE_checkProhibitRevive) {
            return this._enemies.filter(function(enemy) {
                return !enemy.isProhibitRevive();
            });
        }
        return CLE_Game_Troop_members.apply(this, arguments);
    };
}

//-----------------------------------------------------------------------------
// Sprite_Enemy — initialize anim flag
//-----------------------------------------------------------------------------

// 初始化入场动画标志
const CLE_Sprite_Enemy_initMembers = Sprite_Enemy.prototype.initMembers;
Sprite_Enemy.prototype.initMembers = function() {
    CLE_Sprite_Enemy_initMembers.call(this);
    this._CLE_animating = false;
};
