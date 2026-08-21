//=============================================================================
// WSQ Plugins
// WSQ_PictureStage.js
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_PictureStage = true;

var WSQ = WSQ || {};
WSQ.PST = WSQ.PST || {};
WSQ.PST.version = 1.20;
WSQ.PST.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

// 插件参数：演出预设 + 事件大小
WSQ.PST.params = WSQ.PST.params || {};
(function () {
    const ps = PluginManager.parameters(WSQ.PST.pluginName);
    WSQ.PST.params.eventSize = Number(ps['EventSize'] || 48);
    let rawPresets = [];
    if (typeof ps['Presets'] === 'string') {
        try {
            rawPresets = JSON.parse(ps['Presets'] || '[]') || [];
        } catch (e) {
            rawPresets = [];
        }
    } else {
        rawPresets = ps['Presets'] || [];
    }
    // RMMZ 的 struct[] 参数可能存成「数组内每一项都是 JSON 字符串」，这里统一解析成对象
    WSQ.PST.params.presets = rawPresets.map(function (item) {
        if (typeof item === 'string') {
            try { return JSON.parse(item); } catch (e) { return null; }
        }
        return item;
    }).filter(Boolean);
})();

// 已演出图片/图标登记（按 PictureId 管理，便于清除 / 覆盖 / 移动）
WSQ.PST._sprites = WSQ.PST._sprites || {};
// 尚未加载完成时登记的待执行移动（图片加载完成后自动补移动）
WSQ.PST._pendingMoves = WSQ.PST._pendingMoves || {};

/*:
 * @target MZ
 * @plugindesc [v1.20]        演出 - 图片演出（事件相对显示、原点设置、移动演出、演出预设、套用 GF 移动动画）
 * @author 五十七
 * @url 
 *
 * @base GF_0_CoreOfMech
 * @base GF_1_CoreOfSpriteUI
 * @orderAfter GF_1_CoreOfSpriteUI
 *
 * @param EventSize
 * @text 事件大小
 * @type number
 * @min 1
 * @default 48
 * @desc 事件相对位置计算中“1 格”的像素大小（默认 48 = RMMZ 默认一格）。若角色行走图较大（如占 2x3 格），请改为角色实际占格对应的像素值（如 96/144），可省去逐条命令手动调偏移的麻烦。
 *
 * @param Presets
 * @text 演出预设
 * @type struct<PictureStagePreset>[]
 * @default []
 * @desc 预设“最终/起始扩大率、角度、不透明度、移动动画”等演出参数。配置好后，在「显示图片演出 / 显示图标演出 / 显示事件相对演出」命令里只需填写「预设名称」即可引用，无需逐条填写演出参数。
 *
 * @help
 * ============================================================================
 *  介绍
 * ----------------------------------------------------------------------------
 *   一个 GF 体系的「图片演出」插件。通过插件命令显示图片（img/pictures）或
 *   图标（system/IconSet），并应用与 GF_1_CoreOfSpriteUI 完全一致的移动动画
 *   （40+ 种缓动曲线），起步点支持「相对坐标」（相对终点偏移）与「绝对坐标」
 *   （屏幕绝对位置）两种方式。
 *
 *   v1.10 新增：
 *     - 【显示事件相对演出】：以玩家/本事件/指定事件为基准点，在其上/下/左/右
 *       显示图片或图标，并追加 xy 偏移。
 *     - 【移动演出元素】：按演出ID移动已有的图片/图标，目标可以是某事件的
 *       相对位置，也可以是指定 xy 坐标（原点可选左上或中间）。
 *       若显示后立即移动而素材仍在加载，插件会自动在加载完成后补执行移动。
 *
 *   v1.11 新增：
 *     - 显示图片演出 / 显示图标演出 / 显示事件相对演出 增加「原点」参数，
 *       可选择 中间（默认）或 左上。
 *
 *   v1.20 新增：
 *     - 【演出预设】：插件参数「演出预设」可集中配置 扩大率/角度/不透明度/
 *       移动动画 等演出参数。显示类命令里只保留 图片 + 位置（+原点）等基础
 *       参数，通过「预设名称」直接引用，命令更简洁。
 *     - 【事件大小】：插件参数「事件大小」（默认 48）用于事件相对位置的
 *       1 格像素计算。本项目的角色行走图较大（占 2x3 格）时，把该值改成
 *       角色实际占格对应的像素（如 96/144），可省去逐条命令手动调偏移。
 *     - 兼容旧事件：旧事件里已直接填写的 扩大率/角度/不透明度/移动动画
 *       仍然有效，且优先级高于预设（方便个别演出微调）。
 *
 *   事件相对位置的基准：
 *     - 上方 = 事件脚底中心上移 1 格；下方 = 下移 1 格；
 *       左/右 = 左右平移 1 格并垂直居中（可再用偏移X/Y微调）。
 *     - 单位按插件参数「事件大小」计算（默认 48 像素；不再读取地图
 *       tileWidth / tileHeight，便于大行走图角色统一调位）。
 *
 *   原点设置（显示图片演出 / 显示图标演出 / 显示事件相对演出）：
 *     - 中间：X/Y 指图片/图标中心（默认，与旧版行为一致）
 *     - 左上：X/Y 指图片/图标左上角
 *
 *   图片会从起步点，连同 角度 / 扩大率 / 不透明度 一起，以同一种缓动曲线
 *   平滑过渡到【最终状态】。预设（或旧命令）里的参数顺序即：
 *   先填最终状态，再填移动动画。
 *
 *   扩大率与角度支持单独设置【起始值】（起始扩大率X/Y、起始角度）。例如把
 *   起始扩大率设为 100、最终扩大率设为 120，即可做出“原地微放大”而非“从
 *   无到有弹出”的效果；起始/最终角度不同则形成旋转扫入。默认起始值均为 0
 *   （从极小放大、从不旋转开始），与你现有事件的行为保持一致。
 *
 *   底层复用 GF_0_CoreOfMech 的 OrbitManager 弹道引擎：
 *     - 位置 / 不透明度  → 复用 GF_1_CoreOfSpriteUI 的 Sprite.prototype.processInitParam
 *     - 扩大率 / 角度    → 本插件用 OrbitManager 的 ScaleX/ScaleY/Rotate 弹道接入
 *
 * ============================================================================
 *  前置需求
 * ----------------------------------------------------------------------------
 *   - 第0层：GF_0_CoreOfMech（弹道引擎，本插件直接依赖）
 *   - 第1层：GF_1_CoreOfSpriteUI（移动/透明度弹道，本插件复用其 processInitParam）
 *   - 本插件放第2层，加载顺序须在 GF_1_CoreOfSpriteUI 之后。
 *
 * ============================================================================
 *  插件命令
 * ----------------------------------------------------------------------------
 *  显示图片演出      ：显示一张图片并播放入场演出（图片 + 位置 + 预设名称）
 *  显示图标演出      ：显示一个 iconset 图标并播放入场演出（绝对坐标 + 预设名称）
 *  清除图片演出      ：按 id 清除某张，或填 0 清除全部（默认淡出退场，可改立即清除）
 *  显示事件相对演出  ：以事件为基准点显示图片/图标（上/下/左/右 + xy偏移 + 预设名称）
 *  移动演出元素      ：按ID移动已有图片/图标到事件相对位置或绝对坐标
 *
 * ============================================================================
 *  备注（notetag）
 * ----------------------------------------------------------------------------
 *   无。
 *
 * ============================================================================
 *  脚本接口
 * ----------------------------------------------------------------------------
 *   WSQ.PST.showPicture(paramObj)           —— 直接用对象调用（同插件命令参数）
 *   WSQ.PST.showIcon(paramObj)              —— 显示 iconset 图标（同插件命令参数）
 *   WSQ.PST.clearPicture(pictureId)         —— 清除（0 = 全部）
 *   WSQ.PST.showRelativeElement(paramObj)   —— 事件相对显示图片/图标（同插件命令参数）
 *   WSQ.PST.moveElement(paramObj)           —— 移动已有图片/图标（同插件命令参数）
 *
 *   以上显示类脚本接口同样支持 paramObj.PresetName = "预设名"；
 *   若对象里已直接给出 TargetScaleX 等演出参数，则不会覆盖为预设值。
 * ============================================================================
 *
 * @command 显示图片演出
 * @text 显示图片演出
 * @desc 显示一张图片并播放入场演出（图片 + 位置 + 预设名称；扩大率/角度/不透明度/移动动画由插件参数「演出预设」提供）
 *
 * @arg PictureName
 * @text 图片
 * @desc 从 img/pictures 文件夹中直接选择图片
 * @type file
 * @dir img/pictures/
 * @require 1
 * @default
 *
 * @arg PictureId
 * @text 图片ID
 * @desc 用于管理/清除的编号，同 id 再次显示会覆盖旧图
 * @type number
 * @default 1
 *
 * @arg TargetX
 * @text 最终位置 X
 * @desc 图片中心最终到达的屏幕 X
 * @type number
 * @default 0
 *
 * @arg TargetY
 * @text 最终位置 Y
 * @desc 图片中心最终到达的屏幕 Y
 * @type number
 * @default 0
 *
 * @arg OriginType
 * @text 原点
 * @type select
 * @option 中间
 * @option 左上
 * @default 中间
 * @desc 坐标原点：中间 = X/Y 为图片中心；左上 = X/Y 为图片左上角
 *
 * @arg PresetName
 * @text 预设名称
 * @desc 填写插件参数「演出预设」中配置好的预设名称；留空则使用默认演出参数（与原版一致）。旧事件里直接填写的扩大率/角度/不透明度/移动动画仍可覆盖预设。
 * @type string
 * @default
 *
 * @command 显示图标演出
 * @text 显示图标演出
 * @desc 显示一个 iconset 图标并播放入场演出（绝对坐标；扩大率/角度/不透明度/移动动画由插件参数「演出预设」提供）
 *
 * @arg IconIndex
 * @text 图标编号
 * @desc system/IconSet 中的图标编号
 * @type number
 * @default 0
 *
 * @arg PictureId
 * @text 演出ID
 * @desc 用于管理/移动/清除的编号，同 id 再次显示会覆盖旧图
 * @type number
 * @default 1
 *
 * @arg TargetX
 * @text 最终位置 X
 * @desc 图标中心最终到达的屏幕 X
 * @type number
 * @default 0
 *
 * @arg TargetY
 * @text 最终位置 Y
 * @desc 图标中心最终到达的屏幕 Y
 * @type number
 * @default 0
 *
 * @arg OriginType
 * @text 原点
 * @type select
 * @option 中间
 * @option 左上
 * @default 中间
 * @desc 坐标原点：中间 = X/Y 为图标中心；左上 = X/Y 为图标左上角
 *
 * @arg PresetName
 * @text 预设名称
 * @desc 填写插件参数「演出预设」中配置好的预设名称；留空则使用默认演出参数（与原版一致）。旧事件里直接填写的扩大率/角度/不透明度/移动动画仍可覆盖预设。
 * @type string
 * @default
 *
 * @command 清除图片演出
 * @text 清除图片演出
 * @desc 按 id 清除某张，或填 0 清除全部
 *
 * @arg PictureId
 * @text 图片ID
 * @desc 0 = 清除全部
 * @type number
 * @default 0
 *
 * @arg ExitMode
 * @text 退场方式
 * @desc 淡出退场 = 用 GF 原生 invertInitParamData() 倒放位置/透明度弹道（移动退场，沿与入场相同曲线飞回起点），缩放/旋转同步反向；若入场未锁定透明度则同时淡出。立即清除 = 瞬间移除
 * @type select
 * @option 淡出退场
 * @option 立即清除
 * @default 淡出退场
 *
 * @command 显示事件相对演出
 * @text 显示事件相对演出
 * @desc 以特定事件的上/下/左/右为相对位置显示图片或图标，可设xy偏移；扩大率/角度/不透明度/移动动画由插件参数「演出预设」提供
 *
 * @arg SourceType
 * @text 素材类型
 * @type select
 * @option 图片
 * @option 图标
 * @default 图片
 *
 * @arg PictureName
 * @text 图片
 * @desc 素材类型为图片时，从 img/pictures 文件夹选择
 * @type file
 * @dir img/pictures/
 * @default
 *
 * @arg IconIndex
 * @text 图标编号
 * @desc 素材类型为图标时，使用 system/IconSet 中的图标编号
 * @type number
 * @default 0
 *
 * @arg PictureId
 * @text 演出ID
 * @desc 用于管理/移动/清除的编号，同 id 再次显示会覆盖旧图
 * @type number
 * @default 1
 *
 * @arg EventType
 * @text 目标事件
 * @type select
 * @option 本事件
 * @option 指定id的事件
 * @option 玩家
 * @option 变量指定id的事件
 * @default 本事件
 *
 * @arg EventId
 * @text 事件id
 * @parent EventType
 * @type number
 * @default 1
 *
 * @arg EventVarId
 * @text 事件变量id
 * @parent EventType
 * @type variable
 * @default 1
 *
 * @arg RelativePosition
 * @text 相对位置
 * @type select
 * @option 上方
 * @option 下方
 * @option 左方
 * @option 右方
 * @default 上方
 *
 * @arg OffsetX
 * @text 偏移X
 * @type number
 * @desc 在相对位置基础上追加的x偏移（像素），正数向右
 * @default 0
 *
 * @arg OffsetY
 * @text 偏移Y
 * @type number
 * @desc 在相对位置基础上追加的y偏移（像素），正数向下
 * @default 0
 *
 * @arg OriginType
 * @text 原点
 * @type select
 * @option 中间
 * @option 左上
 * @default 中间
 * @desc 坐标原点：中间 = 图片/图标中心对齐事件相对点；左上 = 图片/图标左上角对齐事件相对点
 *
 * @arg PresetName
 * @text 预设名称
 * @desc 填写插件参数「演出预设」中配置好的预设名称；留空则使用默认演出参数（与原版一致）。旧事件里直接填写的扩大率/角度/不透明度/移动动画仍可覆盖预设。
 * @type string
 * @default
 *
 * @command 移动演出元素
 * @text 移动演出元素
 * @desc 按演出ID移动已有图片/图标到事件相对位置或指定坐标，使用GF移动动画
 *
 * @arg PictureId
 * @text 演出ID
 * @type number
 * @desc 要移动的图片/图标ID
 * @default 1
 *
 * @arg DestinationType
 * @text 目标类型
 * @type select
 * @option 事件相对位置
 * @option 绝对坐标
 * @default 绝对坐标
 *
 * @arg EventType
 * @text 目标事件
 * @parent DestinationType
 * @type select
 * @option 本事件
 * @option 指定id的事件
 * @option 玩家
 * @option 变量指定id的事件
 * @default 本事件
 *
 * @arg EventId
 * @text 事件id
 * @parent DestinationType
 * @type number
 * @default 1
 *
 * @arg EventVarId
 * @text 事件变量id
 * @parent DestinationType
 * @type variable
 * @default 1
 *
 * @arg RelativePosition
 * @text 相对位置
 * @parent DestinationType
 * @type select
 * @option 上方
 * @option 下方
 * @option 左方
 * @option 右方
 * @default 上方
 *
 * @arg OffsetX
 * @text 偏移X
 * @parent DestinationType
 * @type number
 * @desc 在相对位置基础上追加的x偏移（像素），正数向右
 * @default 0
 *
 * @arg OffsetY
 * @text 偏移Y
 * @parent DestinationType
 * @type number
 * @desc 在相对位置基础上追加的y偏移（像素），正数向下
 * @default 0
 *
 * @arg TargetX
 * @text 目标X
 * @parent DestinationType
 * @type number
 * @desc 目标类型为绝对坐标时生效。原点为左上时指元素左上角，中间时指元素中心
 * @default 0
 *
 * @arg TargetY
 * @text 目标Y
 * @parent DestinationType
 * @type number
 * @desc 目标类型为绝对坐标时生效
 * @default 0
 *
 * @arg OriginType
 * @text 原点
 * @parent DestinationType
 * @type select
 * @option 左上
 * @option 中间
 * @default 中间
 * @desc 绝对坐标的原点：左上=元素左上角，中间=元素中心
 *
 * @arg MoveAnim
 * @text 移动动画
 * @desc 缓动类型/时长/延迟。起点固定为当前所在位置
 * @type struct<MoveAnimation>
 * @default {"MoveType":"匀速移动","MoveTime":"20","MoveDelay":"0","OpacityLock":"true","CoordinateType":"相对坐标","SlideX":"100","SlideY":"0","SlideAbsoluteX":"0","SlideAbsoluteY":"0"}
 *
 */

/* ---------------------------------------------------------------------------
 * struct<MoveAnimation>
 * （与 GF_1_CoreOfSpriteUI 的 MoveAnimation 结构体完全一致，可直接复用其手感）
 * ---------------------------------------------------------------------------
 */
/*~struct~MoveAnimation:
 *
 * @param MoveType
 * @text 移动类型
 * @type select
 * @option 匀速移动
 * @option 增减速移动
 * @option 弹性移动
 * @option 不移动
 * @option InSine
 * @option OutSine
 * @option InOutSine
 * @option InQuad
 * @option OutQuad
 * @option InOutQuad
 * @option InCubic
 * @option OutCubic
 * @option InOutCubic
 * @option InQuart
 * @option OutQuart
 * @option InOutQuart
 * @option InQuint
 * @option OutQuint
 * @option InOutQuint
 * @option InExpo
 * @option OutExpo
 * @option InOutExpo
 * @option InCirc
 * @option OutCirc
 * @option InOutCirc
 * @option InBack
 * @option OutBack
 * @option InOutBack
 * @option InElastic
 * @option OutElastic
 * @option InOutElastic
 * @option InBounce
 * @option OutBounce
 * @option InOutBounce
 * @desc 初始的移动方式。
 * @default 匀速移动
 *
 * @param MoveTime
 * @text 移动时长
 * @type number
 * @min 1
 * @desc 起点位置回到原位置所需的时间，单位帧。（1秒60帧）
 * @default 20
 *
 * @param MoveDelay
 * @text 移动延迟
 * @type number
 * @min 0
 * @desc 开始移动前的等待时间，单位帧。（1秒60帧）
 * @default 0
 *
 * @param OpacityLock
 * @text 是否锁定透明度
 * @type boolean
 * @on 锁定
 * @off 不锁定
 * @desc 锁定透明度后在运动过程中透明度不变，否则会从0开始淡入。
 * @default true
 *
 * @param StartPoint
 * @text ====起点====
 *
 * @param CoordinateType
 * @text 坐标类型
 * @parent StartPoint
 * @type select
 * @option 相对坐标
 * @value 相对坐标
 * @option 绝对坐标
 * @value 绝对坐标
 * @desc 起点的坐标类型。相对坐标 = 相对终点偏移；绝对坐标 = 屏幕绝对位置。
 * @default 相对坐标
 *
 * @param SlideX
 * @text 起点-相对坐标 X
 * @parent StartPoint
 * @desc 相对坐标以原位置为基准，负数向右，正数向左，单位像素。
 * @default 100
 *
 * @param SlideY
 * @text 起点-相对坐标 Y
 * @parent StartPoint
 * @desc 相对坐标以原位置为基准，负数向上，正数向下，单位像素。
 * @default 0
 *
 * @param SlideAbsoluteX
 * @text 起点-统一坐标 X
 * @parent StartPoint
 * @desc 绝对坐标以屏幕的位置为准，0表示贴在最左边，单位像素。
 * @default 0
 *
 * @param SlideAbsoluteY
 * @text 起点-统一坐标 Y
 * @parent StartPoint
 * @desc 绝对坐标以屏幕的位置为准，0表示贴在最上面，单位像素。
 * @default 0
 *
 */
/* ---------------------------------------------------------------------------
 * struct<PictureStagePreset>
 * 演出预设：把“扩大率 / 角度 / 不透明度 / 移动动画”集中到插件参数，
 * 显示类插件命令通过「预设名称」引用。
 * ---------------------------------------------------------------------------
 */
/*~struct~PictureStagePreset:
 *
 * @param PresetName
 * @text 预设名称
 * @desc 插件命令「显示图片演出 / 显示图标演出 / 显示事件相对演出」中要填写的名称。留空则不使用预设。
 * @type string
 * @default 默认
 *
 * @param TargetRotation
 * @text 最终角度(度)
 * @desc 最终旋转角度，0 为不旋转
 * @type number
 * @default 0
 *
 * @param TargetScaleX
 * @text 最终扩大率X(%)
 * @desc 100 = 原始大小
 * @type number
 * @default 100
 *
 * @param StartScaleX
 * @text 起始扩大率X(%)
 * @desc 入场起点的横向缩放，100 = 原始大小。默认0 = 从极小放大进入
 * @type number
 * @default 0
 *
 * @param TargetScaleY
 * @text 最终扩大率Y(%)
 * @desc 100 = 原始大小
 * @type number
 * @default 100
 *
 * @param StartScaleY
 * @text 起始扩大率Y(%)
 * @desc 入场起点的纵向缩放，100 = 原始大小。默认0 = 从极小放大进入
 * @type number
 * @default 0
 *
 * @param TargetOpacity
 * @text 最终不透明度
 * @desc 0-255，255 为完全不透明
 * @type number
 * @default 255
 *
 * @param StartRotation
 * @text 起始角度(度)
 * @desc 入场起点的旋转角度，0 为不旋转。可与最终角度不同，形成旋转扫入
 * @type number
 * @default 0
 *
 * @param MoveAnim
 * @text 移动动画
 * @desc 起步点 + 缓动类型。CoordinateType = 相对坐标 / 绝对坐标
 * @type struct<MoveAnimation>
 * @default {"MoveType":"匀速移动","MoveTime":"20","MoveDelay":"0","OpacityLock":"true","CoordinateType":"相对坐标","SlideX":"100","SlideY":"0","SlideAbsoluteX":"0","SlideAbsoluteY":"0"}
 *
 */


/* ---------------------------------------------------------------------------
 * 图片演出精灵
 *   位置 + 透明度  → 交给 GF 原生 Sprite.prototype.processInitParam
 *   扩大率 + 角度  → 本插件用 OrbitManager 的 ScaleX/ScaleY/Rotate 弹道接入
 * ---------------------------------------------------------------------------
 */
class Sprite_PictureActor extends Sprite {
    initialize(bitmap) {
        super.initialize(bitmap);
        this.anchor.set(0.5, 0.5);     // 以中心为基准，缩放/旋转更自然
        this._pstData = null;
        this._pstCur = -1;
        this._pstFinished = false;
        this._pstMoveOnly = false;
        this._pstOnFinish = null;
    }

    // data: { x, y, rotation(rad), scaleX, scaleY, opacity, opacityLock,
    //         moveType, moveTime, moveDelay, moveEndDelay,
    //         coordType, slideX, slideY, absX, absY }
    setupPicture(data) {
        this._pstData = data;

        // ---- 位置 + 透明度：复用 GF_1_CoreOfSpriteUI 的 Sprite.prototype.processInitParam ----
        const posData = {
            x: data.x,
            y: data.y,
            opacityMax: data.opacity,
            opacityLock: data.opacityLock,
            slideTime: data.moveTime,
            slideDelay: data.moveDelay,
            slideEndDelay: data.moveEndDelay,
            slideMoveType: data.moveType,
            slidePosType: data.coordType,
            slideX: data.slideX,
            slideY: data.slideY,
            slideAbsoluteX: data.absX,
            slideAbsoluteY: data.absY
        };
        this.processInitParam(posData);

        // ---- 扩大率 X / Y + 角度：用 GF_0_CoreOfMech 的 OrbitManager 自己接 ----
        const tType = this._moveTypeToTargetType(data.moveType);

        const sxData = {
            scaleXMode: "目标值模式",
            scaleXTime: data.moveTime,
            scaleXDelay: data.moveDelay,
            scaleXEndDelay: data.moveEndDelay,
            targetType: tType,
            targetDifference: data.scaleX - data.startScaleX
        };
        OrbitManager.drill_COBa_setBallisticsScaleX(sxData);
        OrbitManager.drill_COBa_preBallisticsScaleX(this, 0, data.startScaleX);

        const syData = {
            scaleYMode: "目标值模式",
            scaleYTime: data.moveTime,
            scaleYDelay: data.moveDelay,
            scaleYEndDelay: data.moveEndDelay,
            targetType: tType,
            targetDifference: data.scaleY - data.startScaleY
        };
        OrbitManager.drill_COBa_setBallisticsScaleY(syData);
        OrbitManager.drill_COBa_preBallisticsScaleY(this, 0, data.startScaleY);

        const rData = {
            rotateMode: "目标值模式",
            rotateTime: data.moveTime,
            rotateDelay: data.moveDelay,
            rotateEndDelay: data.moveEndDelay,
            targetType: tType,
            targetDifference: data.rotation - data.startRotation
        };
        OrbitManager.drill_COBa_setBallisticsRotate(rData);
        OrbitManager.drill_COBa_preBallisticsRotate(this, 0, data.startRotation);

        // 初始帧（起步点）
        this._pstCur = 0;
        this._pstFinished = false;
        this._applyPSTFrame(0);
    }

    // 移动已有演出元素：起点 = 当前位置，终点 = data.x/y（绝对坐标）。
    // 只重建位置/透明度弹道，缩放/旋转保持当前值不动。
    // data: { x, y, moveType, moveTime, moveDelay, moveEndDelay }
    moveTo(data) {
        this._pstData = data;
        this._pstCur = -1;
        this._pstFinished = false;
        this._pstExiting = false;
        this._pstMoveOnly = true;

        // ---- 位置 + 透明度：起点=当前位置，终点=目标位置（绝对坐标模式） ----
        const posData = {
            x: data.x,
            y: data.y,
            opacityMax: this.opacity,
            opacityLock: true,
            slideTime: data.moveTime,
            slideDelay: data.moveDelay,
            slideEndDelay: data.moveEndDelay,
            slideMoveType: data.moveType,
            slidePosType: '绝对坐标',
            slideX: 0,
            slideY: 0,
            slideAbsoluteX: this.x,
            slideAbsoluteY: this.y
        };
        this._initParamData = null;     // 让 processInitParam 重新建一套位置/透明度弹道
        this.processInitParam(posData);

        // 移动不重建缩放/旋转弹道；清掉旧弹道避免入场动画被重放
        this._drill_COBa_scaleX = null;
        this._drill_COBa_scaleY = null;
        this._drill_COBa_rotate = null;
        this._pstMoveOnly = true;
    }

    // 把位置的缓动名翻译成 一维弹道(targetType) 能识别的缓动名
    _moveTypeToTargetType(moveType) {
        switch (moveType) {
            case '匀速移动': return '匀速变化';
            case '增减速移动': return '增减速变化';
            case '弹性移动': return '弹性变化';
            case '不移动': return '瞬间变化';
            default: return moveType;   // InSine / OutBounce ... 直接透传
        }
    }

    // 落一帧：把缩放/旋转弹道数组写到 sprite（位置/透明度由 GF 的 super.update 驱动）
    _applyPSTFrame(i) {
        const sx = this._drill_COBa_scaleX;
        const sy = this._drill_COBa_scaleY;
        const rt = this._drill_COBa_rotate;
        if (sx) this.scale.x = sx[Math.min(i, sx.length - 1)];
        if (sy) this.scale.y = sy[Math.min(i, sy.length - 1)];
        if (rt) this.rotation = rt[Math.min(i, rt.length - 1)];
    }

    update() {
        super.update();                 // GF 原生：入场时正向播位置/透明度；退场时倒放
        if (!this._pstData) return;
        if (this._pstExiting) { this._applyExitScaleRotate(); return; }
        if (this._pstFinished) return;

        // 移动演出：只播位置/透明度（super.update 已驱动），按 GF 弹道当前帧判完成
        if (this._pstMoveOnly) {
            const ip = this.initParamData();
            const len = ip && ip._drill_COBa_x ? ip._drill_COBa_x.length : 0;
            if (len > 0 && ip._slideCur >= len - 1) {
                this._pstFinished = true;
                this._pstMoveOnly = false;
                if (this._pstOnFinish) this._pstOnFinish();
            }
            return;
        }

        this._pstCur++;
        this._applyPSTFrame(this._pstCur);
        const len = (this._drill_COBa_scaleX || []).length;
        if (this._pstCur >= len - 1) {
            this._pstCur = len - 1;
            this._applyPSTFrame(this._pstCur);
            this._pstFinished = true;
            if (this._pstOnFinish) this._pstOnFinish();
        }
    }

    // 退场：用 GF 原生的 invertInitParamData() 倒放【位置 + 透明度】弹道，
    // 这才是真正的"移动退场"——位置沿与入场完全相同的曲线飞回起点。
    // 缩放 / 旋转 本插件用 GF 倒放同款帧序（_slideCur）在 _applyExitScaleRotate 同步回放。
    startExit(onDone) {
        if (!this._pstData || this._pstExiting) { if (onDone) onDone(); return; }
        this._pstExiting = true;
        this._pstOnExit = onDone;
        // 1) 原生倒放：位置 + 透明度沿入场弹道反向回到起点（super.update 自动驱动）
        this.invertInitParamData();
        // 2) 倒放到底（_slideCur 回到 0）时触发回调，移除精灵
        this.processInitParamCallBack(() => {
            const cb = this._pstOnExit; this._pstOnExit = null;
            this._pstExiting = false;
            if (cb) cb();
        });
    }

    // 退场时按 GF 倒放帧序 _slideCur（length-1 → 0）同步应用缩放/旋转
    // 位置与不透明度已由 super.update() 经 GF 原生倒放处理
    _applyExitScaleRotate() {
        const ip = this.initParamData();
        if (!ip) return;
        const i = ip._slideCur;        // GF 倒放：从数组末帧递减到首帧，正好对应原始数组下标
        const sx = this._drill_COBa_scaleX, sy = this._drill_COBa_scaleY, rt = this._drill_COBa_rotate;
        if (sx) this.scale.x = sx[Math.min(i, sx.length - 1)];
        if (sy) this.scale.y = sy[Math.min(i, sy.length - 1)];
        if (rt) this.rotation = rt[Math.min(i, rt.length - 1)];
    }

    pstOnFinish(cb) { this._pstOnFinish = cb; }
    pstOnExit(cb) { this._pstOnExit = cb; }
}

/* ---------------------------------------------------------------------------
 * 内部工具
 * ---------------------------------------------------------------------------
 */
function GF_PST_addToScene(sprite) {
    const scene = SceneManager._scene;
    if (!scene) return;
    const wl = scene._windowLayer;
    if (wl && scene.children.indexOf(wl) >= 0) {
        // 放在窗口层之下，像 RMMZ 原生图片一样（不挡菜单）
        scene.addChildAt(sprite, scene.children.indexOf(wl));
    } else {
        scene.addChild(sprite);
    }
}

WSQ.PST._parseMoveAnim = function (jsonStr) {
    if (jsonStr && typeof jsonStr === 'object') return jsonStr;
    let move = {};
    try { move = JSON.parse(jsonStr || '{}'); } catch (e) { move = {}; }
    return move;
};

// 预设未填写任何字段时使用的默认值（与 v1.11 插件命令的默认参数一致）
WSQ.PST._defaultPreset = {
    TargetRotation: 0,
    TargetScaleX: 100,
    StartScaleX: 0,
    TargetScaleY: 100,
    StartScaleY: 0,
    TargetOpacity: 255,
    StartRotation: 0,
    MoveType: '匀速移动',
    MoveTime: 20,
    MoveDelay: 0,
    MoveEndDelay: 0,
    OpacityLock: true,
    CoordinateType: '相对坐标',
    SlideX: 100,
    SlideY: 0,
    SlideAbsoluteX: 0,
    SlideAbsoluteY: 0
};

WSQ.PST._presetStyleKeys = ['TargetRotation', 'TargetScaleX', 'StartScaleX', 'TargetScaleY', 'StartScaleY', 'TargetOpacity', 'StartRotation'];
WSQ.PST._presetMoveKeys = ['MoveType', 'MoveTime', 'MoveDelay', 'MoveEndDelay', 'OpacityLock', 'CoordinateType', 'SlideX', 'SlideY', 'SlideAbsoluteX', 'SlideAbsoluteY'];

// 按名称查找插件参数「演出预设」
WSQ.PST._getPreset = function (name) {
    const presets = WSQ.PST.params && WSQ.PST.params.presets;
    if (!presets || !presets.length) return null;
    name = String(name || '');
    if (!name) return null;
    for (let i = 0; i < presets.length; i++) {
        if (String(presets[i].PresetName || '') === name) return presets[i];
    }
    return null;
};

// 给显示参数 p 依次套用：默认值 → 预设 → 旧命令参数/脚本显式参数（兼容旧事件与脚本覆盖）
WSQ.PST._applyPreset = function (p, presetName, legacyArgs) {
    p = p || {};
    // 1) 默认值（记录哪些字段是“没填、被默认值填充”的，预设只覆盖这些字段）
    const defaulted = {};
    for (const key in WSQ.PST._defaultPreset) {
        if (p[key] === undefined || p[key] === null || p[key] === '') {
            p[key] = WSQ.PST._defaultPreset[key];
            defaulted[key] = true;
        }
    }
    // 2) 预设
    const preset = WSQ.PST._getPreset(presetName);
    if (presetName && !preset) {
        console.warn('[WSQ_PictureStage] 未找到演出预设「' + presetName + '」，已使用默认演出参数');
    }
    if (preset) {
        for (const key of WSQ.PST._presetStyleKeys) {
            if (defaulted[key] && preset[key] !== undefined && preset[key] !== null && preset[key] !== '') {
                p[key] = preset[key];
            }
        }
        const move = WSQ.PST._parseMoveAnim(preset.MoveAnim);
        for (const key of WSQ.PST._presetMoveKeys) {
            if (defaulted[key] && move[key] !== undefined && move[key] !== null && move[key] !== '') {
                p[key] = move[key];
            }
        }
    }
    // 3) 旧命令参数 / 脚本里显式填写的参数覆盖（优先级最高）
    if (legacyArgs) {
        for (const key of WSQ.PST._presetStyleKeys) {
            if (legacyArgs[key] !== undefined && legacyArgs[key] !== null && legacyArgs[key] !== '') {
                p[key] = legacyArgs[key];
            }
        }
        const move = WSQ.PST._parseMoveAnim(legacyArgs.MoveAnim);
        for (const key of WSQ.PST._presetMoveKeys) {
            if (move[key] !== undefined && move[key] !== null && move[key] !== '') {
                p[key] = move[key];
            }
        }
    }
    return p;
};

// 脚本接口直接传 PresetName 时，自动套用预设；对象里已显式填写的参数优先
WSQ.PST._applyPresetIfNeeded = function (p) {
    if (!p || !p.PresetName) return p;
    return WSQ.PST._applyPreset(p, p.PresetName, p);
};


WSQ.PST._buildData = function (p) {
    // 兼容脚本接口直接传 MoveAnim 结构体字符串的情况（命令入口已由 _applyPreset 展开成平铺字段）
    const move = WSQ.PST._parseMoveAnim(p.MoveAnim);
    const has = function (v) { return v !== undefined && v !== null && v !== ''; };
    const opacityLock = has(p.OpacityLock)
        ? (p.OpacityLock === true || p.OpacityLock === 'true')
        : (move.OpacityLock === true || move.OpacityLock === 'true');
    return {
        x: Number(p.TargetX || 0),
        y: Number(p.TargetY || 0),
        rotation: Number(p.TargetRotation || 0) * Math.PI / 180,
        scaleX: Number(p.TargetScaleX || 100) / 100,
        scaleY: Number(p.TargetScaleY || 100) / 100,
        startRotation: Number(p.StartRotation || 0) * Math.PI / 180,
        startScaleX: Number(p.StartScaleX != null && p.StartScaleX !== '' ? p.StartScaleX : 0) / 100,
        startScaleY: Number(p.StartScaleY != null && p.StartScaleY !== '' ? p.StartScaleY : 0) / 100,
        opacity: Number(p.TargetOpacity || 255),
        opacityLock: opacityLock,
        moveType: String(p.MoveType || move.MoveType || '匀速移动'),
        moveTime: Math.max(1, Number(p.MoveTime || move.MoveTime || 20)),
        moveDelay: Math.max(0, Number(p.MoveDelay || move.MoveDelay || 0)),
        moveEndDelay: Math.max(0, Number(p.MoveEndDelay || move.MoveEndDelay || 0)),
        coordType: String(p.CoordinateType || move.CoordinateType || '相对坐标'),
        slideX: Number(has(p.SlideX) ? p.SlideX : (move.SlideX || 0)),
        slideY: Number(has(p.SlideY) ? p.SlideY : (move.SlideY || 0)),
        absX: Number(has(p.SlideAbsoluteX) ? p.SlideAbsoluteX : (move.SlideAbsoluteX || 0)),
        absY: Number(has(p.SlideAbsoluteY) ? p.SlideAbsoluteY : (move.SlideAbsoluteY || 0))
    };
};

// 统一的“显示一个已加载 Bitmap”入口：图片或图标都走这里
WSQ.PST._showBitmap = function (p, bitmap, isIcon) {
    const pictureId = Number(p.PictureId || 1);
    WSQ.PST._showTokens = WSQ.PST._showTokens || {};
    const token = {};
    WSQ.PST._showTokens[pictureId] = token;
    const data = WSQ.PST._buildData(p);

    // 同 id 旧图先移除（覆盖式显示），并作废该 id 尚未执行的移动
    if (WSQ.PST._sprites[pictureId]) {
        const old = WSQ.PST._sprites[pictureId];
        if (old.parent) old.parent.removeChild(old);
        WSQ.PST._sprites[pictureId] = null;
    }
    if (WSQ.PST._pendingMoves) delete WSQ.PST._pendingMoves[pictureId];

    const sprite = new Sprite_PictureActor();
    const doSetup = function () {
        if (WSQ.PST._showTokens[pictureId] !== token) return;   // 该次显示已被清除/覆盖
        sprite.bitmap = bitmap;
        if (isIcon) {
            const iconIndex = Number(p.IconIndex || 0);
            const iw = ImageManager.iconWidth;
            const ih = ImageManager.iconHeight;
            const col = iconIndex % 16;
            const row = Math.floor(iconIndex / 16);
            sprite.setFrame(col * iw, row * ih, iw, ih);
        }
        // 原点：左上 = X/Y 指图片/图标左上角（锚点仍为中心，按最终扩大率换算中心坐标）
        if (String(p.OriginType || '中间') === '左上') {
            data.x += sprite.width * data.scaleX / 2;
            data.y += sprite.height * data.scaleY / 2;
        }
        sprite.setupPicture(data);
        GF_PST_addToScene(sprite);
        WSQ.PST._sprites[pictureId] = sprite;
        // 若显示后立刻被登记过“移动”，加载完成后自动补执行
        if (WSQ.PST._pendingMoves && WSQ.PST._pendingMoves[pictureId]) {
            const pm = WSQ.PST._pendingMoves[pictureId];
            delete WSQ.PST._pendingMoves[pictureId];
            WSQ.PST.moveElement(pm);
        }
    };
    if (bitmap.isReady()) {
        doSetup();
    } else {
        bitmap.addLoadListener(doSetup);
    }
};

WSQ.PST.showPicture = function (p) {
    WSQ.PST._applyPresetIfNeeded(p);
    // file 类型会带扩展名（如 foo.png），ImageManager.loadPicture 期望无扩展名
    const rawName = String(p.PictureName || '');
    const pictureName = rawName.replace(/\.(png|jpg|jpeg|webp)$/i, '');
    const bitmap = ImageManager.loadPicture(pictureName);
    WSQ.PST._showBitmap(p, bitmap, false);
};

// 显示 iconset 图标（绝对坐标）
WSQ.PST.showIcon = function (p) {
    WSQ.PST._applyPresetIfNeeded(p);
    const bitmap = ImageManager.loadSystem('IconSet');
    WSQ.PST._showBitmap(p, bitmap, true);
};

// 目标事件解析：EventType = 本事件 / 指定id的事件 / 玩家 / 变量指定id的事件
WSQ.PST._resolveEvent = function (spec) {
    spec = spec || {};
    if (!$gameMap) return null;
    const type = String(spec.EventType || '指定id的事件').toLowerCase();
    if (type === '玩家' || type === 'player') return $gamePlayer || null;
    if (type === '本事件' || type === 'this' || type === 'thisevent') {
        const interpreter = $gameMap._interpreter;
        const id = interpreter ? interpreter._eventId : 0;
        if (id > 0) return $gameMap.event(id) || null;
        return $gamePlayer || null;
    }
    if (type === '变量指定id的事件' || type === 'variable') {
        const vid = Number(spec.EventVarId || 0);
        const id = $gameVariables.value(vid);
        return id ? ($gameMap.event(id) || null) : null;
    }
    const id = Number(spec.EventId || 0);
    return id ? ($gameMap.event(id) || null) : null;
};

// 事件相对位置使用的“1 格”像素大小（插件参数 EventSize，默认 48）
WSQ.PST._eventTileSize = function () {
    const size = Number(WSQ.PST.params && WSQ.PST.params.eventSize);
    return (size > 0) ? size : 48;
};

// 事件相对点：基准 = 事件脚底中心屏幕坐标；上/下/左/右各有一个基础偏移，可再追加 OffsetX/Y
WSQ.PST._eventRelativePoint = function (character, position, offsetX, offsetY) {
    const size = WSQ.PST._eventTileSize();
    const sx = character.screenX();
    const sy = character.screenY();
    let x = sx;
    let y = sy;
    switch (String(position || '上方').toLowerCase()) {
        case '下方': case 'down': case 'below': y = sy + size; break;
        case '左方': case 'left': x = sx - size; y = sy - size / 2; break;
        case '右方': case 'right': x = sx + size; y = sy - size / 2; break;
        default:   y = sy - size; break;   // 上方 / up / above
    }
    return {
        x: x + Number(offsetX || 0),
        y: y + Number(offsetY || 0)
    };
};

// 事件相对显示图片/图标
WSQ.PST.showRelativeElement = function (p) {
    WSQ.PST._applyPresetIfNeeded(p);
    const character = WSQ.PST._resolveEvent(p);
    if (!character) {
        console.warn('[WSQ_PictureStage] 未找到目标事件，无法显示相对位置演出');
        return false;
    }
    const pt = WSQ.PST._eventRelativePoint(character, p.RelativePosition, p.OffsetX, p.OffsetY);
    p.TargetX = pt.x;
    p.TargetY = pt.y;
    const sourceType = String(p.SourceType || '图片').toLowerCase();
    if (sourceType === '图标' || sourceType === 'icon') {
        const bitmap = ImageManager.loadSystem('IconSet');
        WSQ.PST._showBitmap(p, bitmap, true);
    } else {
        const rawName = String(p.PictureName || '');
        const pictureName = rawName.replace(/\.(png|jpg|jpeg|webp)$/i, '');
        if (!pictureName) {
            console.warn('[WSQ_PictureStage] 未填写图片名，无法显示相对位置演出');
            return false;
        }
        const bitmap = ImageManager.loadPicture(pictureName);
        WSQ.PST._showBitmap(p, bitmap, false);
    }
    return true;
};

// 移动目标解析：事件相对位置 / 绝对坐标（原点=左上/中间）
WSQ.PST._resolveDestination = function (p) {
    p = p || {};
    const destType = String(p.DestinationType || '');
    // 脚本接口省略 DestinationType 时，只要带了事件参数就按事件相对位置处理
    if (destType === '事件相对位置' || (!destType && (p.EventType || p.EventId || p.EventVarId))) {
        const character = WSQ.PST._resolveEvent(p);
        if (!character) return null;
        return WSQ.PST._eventRelativePoint(character, p.RelativePosition, p.OffsetX, p.OffsetY);
    }
    let x = Number(p.TargetX || 0);
    let y = Number(p.TargetY || 0);
    if (String(p.OriginType || '中间') === '左上') {
        const sprite = WSQ.PST._sprites[Number(p.PictureId || 1)];
        if (sprite) {
            // 锚点恒为 0.5，左上角对齐 = 中心坐标 + 半宽/半高
            x += sprite.width * Math.abs(sprite.scale.x) / 2;
            y += sprite.height * Math.abs(sprite.scale.y) / 2;
        }
    }
    return { x: x, y: y };
};

// 移动已有演出元素
WSQ.PST.moveElement = function (p) {
    const pictureId = Number(p.PictureId || 1);
    const sprite = WSQ.PST._sprites[pictureId];
    if (!sprite || !sprite.moveTo) {
        // 如果同一ID的显示还在加载中，先登记，加载完成后自动补移动
        if (WSQ.PST._showTokens && WSQ.PST._showTokens[pictureId]) {
            WSQ.PST._pendingMoves[pictureId] = Object.assign({}, p);
            return true;
        }
        console.warn('[WSQ_PictureStage] 未找到演出ID ' + pictureId + '，无法移动');
        return false;
    }
    if (WSQ.PST._pendingMoves) delete WSQ.PST._pendingMoves[pictureId];
    const pt = WSQ.PST._resolveDestination(p);
    if (!pt) {
        console.warn('[WSQ_PictureStage] 移动目标解析失败（找不到目标事件）');
        return false;
    }
    const move = WSQ.PST._parseMoveAnim(p.MoveAnim);
    sprite.moveTo({
        x: pt.x,
        y: pt.y,
        moveType: String(move.MoveType || p.MoveType || '匀速移动'),
        moveTime: Math.max(1, Number(move.MoveTime || p.MoveTime || 20)),
        moveDelay: Math.max(0, Number(move.MoveDelay || p.MoveDelay || 0)),
        moveEndDelay: Math.max(0, Number(move.MoveEndDelay || p.MoveEndDelay || 0))
    });
    return true;
};

WSQ.PST.clearPicture = function (pictureId, animated) {
    if (animated === undefined) animated = true;   // 默认淡出退场
    if (!pictureId) {
        Object.keys(WSQ.PST._sprites).forEach(function (id) {
            WSQ.PST._removeSprite(WSQ.PST._sprites[id], animated);
        });
        // 全部清除时，未完成加载的显示与待执行移动一并作废
        WSQ.PST._showTokens = {};
        WSQ.PST._pendingMoves = {};
        return;
    }
    const id = Number(pictureId);
    // 若该 id 还在加载中，作废加载回调与待执行移动
    if (WSQ.PST._showTokens) delete WSQ.PST._showTokens[id];
    if (WSQ.PST._pendingMoves) delete WSQ.PST._pendingMoves[id];
    WSQ.PST._removeSprite(WSQ.PST._sprites[id], animated);
};

// 移除单张：animated=true 时先播反向退场，播完再移除；否则立即移除
WSQ.PST._removeSprite = function (sprite, animated) {
    if (!sprite) return;
    // 先从登记里摘掉（避免同 id 重新显示时撞车），精灵本身继续存在直到退场结束
    for (const id in WSQ.PST._sprites) {
        if (WSQ.PST._sprites[id] === sprite) {
            WSQ.PST._sprites[id] = null;
            if (WSQ.PST._showTokens) delete WSQ.PST._showTokens[id];   // 作废未完成的加载回调
            if (WSQ.PST._pendingMoves) delete WSQ.PST._pendingMoves[id];
            break;
        }
    }
    if (animated && sprite.startExit) {
        sprite.startExit(function () {
            if (sprite.parent) sprite.parent.removeChild(sprite);
        });
    } else {
        if (sprite.parent) sprite.parent.removeChild(sprite);
    }
};

/* ---------------------------------------------------------------------------
 * 插件命令
 * ---------------------------------------------------------------------------
 */
PluginManager.registerCommand(WSQ.PST.pluginName, '显示图片演出', function (args) {
    const p = {
        PictureName: args.PictureName,
        PictureId: args.PictureId,
        TargetX: args.TargetX,
        TargetY: args.TargetY,
        OriginType: args.OriginType,
        PresetName: args.PresetName
    };
    WSQ.PST._applyPreset(p, args.PresetName, args);
    WSQ.PST.showPicture(p);
});

PluginManager.registerCommand(WSQ.PST.pluginName, '显示图标演出', function (args) {
    const p = {
        IconIndex: args.IconIndex,
        PictureId: args.PictureId,
        TargetX: args.TargetX,
        TargetY: args.TargetY,
        OriginType: args.OriginType,
        PresetName: args.PresetName
    };
    WSQ.PST._applyPreset(p, args.PresetName, args);
    WSQ.PST.showIcon(p);
});


PluginManager.registerCommand(WSQ.PST.pluginName, '清除图片演出', function (args) {
    const animated = args.ExitMode !== '立即清除';
    WSQ.PST.clearPicture(Number(args.PictureId || 0), animated);
});

PluginManager.registerCommand(WSQ.PST.pluginName, '显示事件相对演出', function (args) {
    const p = {
        SourceType: args.SourceType,
        PictureName: args.PictureName,
        IconIndex: args.IconIndex,
        PictureId: args.PictureId,
        EventType: args.EventType,
        EventId: args.EventId,
        EventVarId: args.EventVarId,
        RelativePosition: args.RelativePosition,
        OffsetX: args.OffsetX,
        OffsetY: args.OffsetY,
        OriginType: args.OriginType,
        PresetName: args.PresetName
    };
    // “本事件”在指令回调里直接取当前解释器的事件id，最可靠
    if (args.EventType === '本事件') {
        p.EventType = '指定id的事件';
        p.EventId = this._eventId || 1;
    }
    WSQ.PST._applyPreset(p, args.PresetName, args);
    WSQ.PST.showRelativeElement(p);
});

PluginManager.registerCommand(WSQ.PST.pluginName, '移动演出元素', function (args) {
    const p = {
        PictureId: args.PictureId,
        DestinationType: args.DestinationType,
        EventType: args.EventType,
        EventId: args.EventId,
        EventVarId: args.EventVarId,
        RelativePosition: args.RelativePosition,
        OffsetX: args.OffsetX,
        OffsetY: args.OffsetY,
        TargetX: args.TargetX,
        TargetY: args.TargetY,
        OriginType: args.OriginType,
        MoveAnim: args.MoveAnim
    };
    // “本事件”在指令回调里直接取当前解释器的事件id，最可靠
    if (args.EventType === '本事件') {
        p.EventType = '指定id的事件';
        p.EventId = this._eventId || 1;
    }
    WSQ.PST.moveElement(p);
});

