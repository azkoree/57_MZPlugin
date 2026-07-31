//=============================================================================
// GF Plugins Compatible
// WSQ_Achievement.js
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_Achievement = true;

var WSQ = WSQ || {};
WSQ.ACH = WSQ.ACH || {};
WSQ.ACH.version = 1.00;
WSQ.ACH.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

/*:
 * @target MZ
 * @author WSQ
 * @plugindesc [v1.00]        系统 - 成就系统（GF适配版，脱离DM_Common）
 * @base GF_0_CoreOfGame
 * @orderAfter GF_0_CoreOfGame
 * @base GF_1_CoreOfSpriteUI
 * @orderAfter GF_1_CoreOfSpriteUI
 * @base GF_1_CoreOfWindowUI
 * @orderAfter GF_1_CoreOfWindowUI
 * @base GF_3_ToastSystem
 * @orderAfter GF_3_ToastSystem
 * @url https://afdian.net/a/ganfly
 *
 * @help
 * ============================================================================
 * 成就系统（WSQ_Achievement）
 * ============================================================================
 * 基于 DM_Achievement 的功能重写，脱离 DM_Common 依赖，全面适配 GF 插件体系。
 * - UI 全面重构：取消信息窗口，列表项两行布局（图标+名称 / 描述+奖励右对齐）
 * - 分类系统：取消按完成情况筛选，改为插件参数自由配置的成就分类
 * - 弹窗提示：使用 GF_3_ToastSystem（ToastManager.addText）
 * - 窗口管线：全部走 GF 的 processInitParam，支持窗口移动动画与皮肤
 * - 分类模式：支持窗口分类列表与精灵按钮分类（通过「分类显示模式」参数切换）
 *
 * 使用步骤：
 * 1. 在「成就分类」参数中配置自定义分类（如：战斗、探索、收集）。
 * 2. 在「系统统计字段」勾选需要自动统计的项目。
 * 3. 在「自定义统计字段」添加需要手动更新的统计项。
 * 4. 在「成就规则列表」中配置成就，指定分类、图标、条件、奖励。
 * 5. 系统字段自动更新值，自定义字段通过插件指令「增加指定统计值」更新。
 * 6. 更新统计值时会自动检测成就条件，达成时自动发放奖励并提示。
 * 7. 插件指令「打开成就界面」可随时查看成就列表。
 *
 * ============================================================================
 * 前置需求
 * ============================================================================
 * - GF_0_CoreOfGame（第0层，金币图标与物品控制符）
 * - GF_1_CoreOfSpriteUI（第1层，精灵核心；按钮分类模式需要，窗口模式不需要）
 * - GF_1_CoreOfWindowUI（第1层，窗口核心：processInitParam / setupWindowInitParam）
 * - GF_3_ToastSystem（第3层，成就解锁弹窗提示）
 * 本插件位于第4层，需放在上述插件之后。
 *
 * ============================================================================
 * 兼容性
 * ============================================================================
 * - 不依赖 DM_Common，可与 DM_Achievement 同时存在（但建议二选一避免重复统计）。
 * - 若旧存档来自 DM_Achievement，统计值与领取记录字段名一致，可平滑继承。
 * - 按钮分类模式需要 GF_1_CoreOfSpriteUI 支持（插件已在依赖中声明），
 *   若未正确加载会自动回退到窗口模式。
 *
 * ============================================================================
 * 备注（notetag）
 * ============================================================================
 * 在数据库对象（敌人、道具、武器、防具、技能、角色）的备注栏中写入：
 *   <WSQ_ACH>   或   <成就统计>
 * 该插件会自动为该对象创建独立的统计项，用于更精细的成就条件。
 *
 * ■ 支持对象及生成的统计键名
 *   敌人备注  → defeatedMonsters + 敌人ID    （击杀该敌人时 +1）
 *   道具备注  → collectedItems + 道具ID      （获得该道具时增加）
 *              itemUseCount + 道具ID        （使用该道具时 +1）
 *              shopBuyCount_i + 道具ID      （购买该道具时增加）
 *              shopSellCount_i + 道具ID     （卖出该道具时增加）
 *   武器备注  → collectedWeapons + 武器ID   （获得该武器时增加）
 *              shopBuyCount_w + 武器ID      （购买该武器时增加）
 *              shopSellCount_w + 武器ID     （卖出该武器时增加）
 *   防具备注  → collectedArmors + 防具ID    （获得该防具时增加）
 *              shopBuyCount_a + 防具ID      （购买该防具时增加）
 *              shopSellCount_a + 防具ID     （卖出该防具时增加）
 *   技能备注  → skillUseCount + 技能ID      （使用该技能时 +1）
 *   角色备注  → damageDealt + 角色ID        （角色造成伤害累计）
 *              damageTaken + 角色ID        （角色受到伤害累计）
 *              criticalCount + 角色ID      （角色造成暴击次数）
 *              missCount + 角色ID          （角色攻击未命中次数）
 *              evasionCount + 角色ID       （角色闪避攻击次数）
 *              reviveCount + 角色ID        （角色从死亡复活次数）
 *              maxDamage + 角色ID          （角色单次最高伤害）
 *
 * ■ 示例
 *   达成"击败幽灵(敌人ID=7) 20次"：
 *     1. 敌人[7]备注写 <WSQ_ACH>
 *     2. 成就条件：defeatedMonsters7 >= 20
 *
 *   达成"使用治疗术(技能ID=15) 50次"：
 *     1. 技能[15]备注写 <WSQ_ACH>
 *     2. 成就条件：skillUseCount15 >= 50
 *
 * 注意：带 <WSQ_ACH> 的对象仍会更新对应的全局统计，两者独立计算。
 *       循环成就重置时会清空条件中涉及的自定义统计项。
 *
 * ============================================================================
 * 插件指令
 * ============================================================================
 * RecordStat 键名 数值 [覆盖]   # 增加指定统计值（数值可为负，覆盖为true时直接覆盖）
 * ShowAchievements              # 打开成就场景
 * CheckAchievement 成就名称     # 手动检测指定成就是否达成并发放奖励
 *
 * ============================================================================
 * 脚本调用
 * ============================================================================
 * 增加统计值  $gameSystem.recordAchievementStat("键名", 变化值, 是否覆盖);
 * 打开场景    SceneManager.push(Scene_Achievement)
 * 手动检测    $gameSystem.checkAchievementsForName("成就名称");
 * 查询达成    $gameSystem.isAchievementGranted("规则标识");
 *
 * ============================================================================
 * @command RecordStat
 * @text 增加指定统计值
 * @desc 手动更新任意统计字段的数值，支持自定义增减量
 *
 * @arg Key
 * @text 统计字段键名
 * @desc 【必填】要更新的统计项的内部键名，必须和插件参数中配置的完全一致
 *
 * @arg Value
 * @text 变化数值
 * @type number
 * @desc 统计值的变化量：正数增加、负数减少，默认+1
 * @default 1
 *
 * @arg Cover
 * @text 覆盖原值
 * @type boolean
 * @desc 开启时直接覆盖原值，否则累加
 * @default false
 *
 * @command ShowAchievements
 * @text 打开成就界面
 * @desc 打开成就列表场景
 *
 * @command CheckAchievement
 * @text 检测指定成就
 * @desc 手动检测指定成就是否已解锁并发放奖励（用于不能自动触发的成就）
 *
 * @arg Name
 * @text 成就名称
 * @desc 成就规则配置的成就名称
 *
 * @param systemStats
 * @text 系统统计字段
 * @type select[]
 * @option 战斗次数
 * @value battleCount
 * @option 胜利次数
 * @value winCount
 * @option 失败次数
 * @value deathCount
 * @option 逃跑次数
 * @value escapeCount
 * @option 击杀怪物数
 * @value defeatedMonsters
 * @option 存档次数
 * @value saveCount
 * @option 持有金币数
 * @value gold
 * @option 获得金币数
 * @value gainGold
 * @option 消耗金币数
 * @value costGold
 * @option 获得经验
 * @value exp
 * @option 获得物品数
 * @value collectedItems
 * @option 获得武器数
 * @value collectedWeapons
 * @option 获得防具数
 * @value collectedArmors
 * @option 步数
 * @value steps
 * @option 游戏时间
 * @value playtime
 * @option 队伍人数
 * @value partyMembers
 * @option 治愈HP总量
 * @value healAmount
 * @option 造成伤害总量
 * @value damageDealt
 * @option 受到伤害总量
 * @value damageTaken
 * @option 暴击次数
 * @value criticalCount
 * @option 闪避次数
 * @value evasionCount
 * @option 未命中次数
 * @value missCount
 * @option 普攻次数
 * @value attackCount
 * @option 防御次数
 * @value guardCount
 * @option 技能使用次数
 * @value skillUseCount
 * @option 道具使用次数
 * @value itemUseCount
 * @option 复活次数
 * @value reviveCount
 * @option 购买数量
 * @value shopBuyCount
 * @option 卖出数量
 * @value shopSellCount
 * @option 单次最大伤害
 * @value maxDamage
 * @option 连续战斗次数
 * @value consecutiveBattles
 * @desc 系统字段会自动更新统计值，成就规则参数里可直接调用
 * @default ["battleCount","winCount","deathCount","escapeCount","defeatedMonsters","saveCount","gold","gainGold","costGold","exp","collectedItems","collectedWeapons","collectedArmors","steps","playtime","partyMembers","healAmount","damageDealt","damageTaken","criticalCount","evasionCount","missCount","skillUseCount","itemUseCount","reviveCount","shopBuyCount","shopSellCount","attackCount","guardCount"]
 *
 * @param statsConfig
 * @text 自定义统计字段
 * @desc 自定义字段需要调用插件指令【增加指定统计值】手动更新字段值的变化
 * @type struct<StatField>[]
 * @default ["{\"displayName\":\"开宝箱\",\"keyName\":\"openedChests\"}"]
 *
 * @param categoryConfig
 * @text 成就分类
 * @desc 成就分类配置，显示在分类窗口中。"全部"会自动添加在最前面，无需在此配置。
 * @type struct<Category>[]
 * @default ["{\"id\":\"battle\",\"name\":\"战斗\"}","{\"id\":\"explore\",\"name\":\"探索\"}","{\"id\":\"collect\",\"name\":\"收集\"}"]
 *
 * @param achievementConfig
 * @text 成就规则列表
 * @type struct<AchievementRule>[]
 * @default []
 *
 * @param background
 * @text 场景背景设置
 * @type struct<Background>
 * @default {"Img":"","Opacity":"192","X":"0","Y":"0"}
 *
 * @param categoryWindow
 * @text 分类窗口设置
 * @type struct<ListWindowSet>
 * @desc 显示"全部"与各自定义分类的横向列表窗口
 * @default {"X":"191","Y":"96","Width":"984","Height":"75","Opacity":"150","FontSize":"26","LineHeight":"36","MaxCols":"4","ColSpace":"10","RowSpace":"0","WindowFontFace":"","WindowMoving":"{\"MoveType\":\"弹性移动\",\"MoveTime\":\"20\",\"MoveDelay\":\"0\",\"OpacityLock\":\"false\",\"StartPoint\":\"\",\"CoordinateType\":\"相对坐标\",\"SlideX\":\"0\",\"SlideY\":\"200\",\"SlideAbsoluteX\":\"0\",\"SlideAbsoluteY\":\"0\"}","WindowLayout":"{\"LayoutType\":\"默认皮肤\",\"Background\":\"\",\"BackgroundFile\":\"\",\"BackgroundX\":\"0\",\"BackgroundY\":\"0\"}"}
 *
 * @param listWindow
 * @text 列表窗口设置
 * @type struct<ListWindowSet>
 * @desc 显示当前分类下的成就列表，每项两行（图标+名称 / 描述+奖励）
 * @default {"X":"191","Y":"184","Width":"984","Height":"540","Opacity":"150","FontSize":"26","LineHeight":"36","MaxCols":"1","ColSpace":"10","RowSpace":"5","WindowFontFace":"","WindowMoving":"{\"MoveType\":\"弹性移动\",\"MoveTime\":\"20\",\"MoveDelay\":\"0\",\"OpacityLock\":\"false\",\"StartPoint\":\"\",\"CoordinateType\":\"相对坐标\",\"SlideX\":\"0\",\"SlideY\":\"200\",\"SlideAbsoluteX\":\"0\",\"SlideAbsoluteY\":\"0\"}","WindowLayout":"{\"LayoutType\":\"默认皮肤\",\"Background\":\"\",\"BackgroundFile\":\"\",\"BackgroundX\":\"0\",\"BackgroundY\":\"0\"}"}
 *
 * @param rewardColors
 * @text 奖励显示颜色
 * @type struct<RewardColors>
 * @desc 列表项与弹窗中各类奖励摘要的文字颜色（RMMZ颜色号0-31，0=默认白色）
 * @default {"gold":"6","exp":"6","item":"0","weapon":"0","armor":"0","variable":"0","switch":"0"}
 *
 * @param progressColor
 * @text 进度显示颜色
 * @type number
 * @min 0
 * @max 31
 * @desc 成就名称右侧"当前/目标"进度的文字颜色（0-31，0=白色）
 * @default 0
 *
 * @param completedColor
 * @text 已完成显示颜色
 * @type number
 * @min 0
 * @max 31
 * @desc 成就达成后"已完成！"的文字颜色（0-31，3=绿色）
 * @default 3
 *
 * @param showProgressLabel
 * @text 显示统计字段名
 * @type boolean
 * @default true
 * @desc 单条件成就的进度前面显示统计字段的名称（如：击杀怪物数: 15/20）
 *
 * @param showPopup
 * @text 成就解锁弹窗
 * @type boolean
 * @default true
 * @desc 达成成就时是否通过GF ToastSystem显示提示
 *
 * @param popupRewards
 * @text 弹窗显示奖励
 * @type boolean
 * @default true
 * @desc 开启时成就达成弹窗会显示奖励内容，否则只显示成就名称与描述
 *
 * @param sound
 * @text 成就解锁提示音
 * @type file
 * @dir audio/se/
 * @desc 达成成就时播放的提示音
 * @default Bell3
 *
 * @param CategoryMode
 * @text 分类显示模式
 * @type select
 * @option 窗口
 * @option 按钮
 * @desc 选择分类的显示方式。"窗口"使用传统窗口列表；"按钮"使用精灵核心的按钮组（需加载 GF_1_CoreOfSpriteUI）。
 * @default 窗口
 *
 * @param CategoryButtonSet
 * @text 分类按钮总体设置
 * @type struct<AchCategoryButtonSet>
 * @desc 按钮模式下分类按钮组的总体设置（位置、样式、贴图）。
 * @default {"ButtonSetX":"0","ButtonSetY":"0","ButtonSetStyle":"1","ButtonBitmapNum":"1","ButtonBackBitmap":"","ButtonSetBitmap":""}
 *
 * @param CategoryButtonList
 * @text 分类按钮贴图覆盖
 * @type struct<AchCategoryButtons>[]
 * @desc 【可选】为特定分类指定自定义按钮贴图。不配置则全部使用默认按钮贴图。
 *       分类按钮会自动从成就分类配置中检测可用分类生成。
 * @default []
 *
 */

/*~struct~StatField:
 * @param displayName
 * @text 显示名称
 * @default 新统计项
 *
 * @param keyName
 * @text 内部键名
 * @default newStat
 */

/*~struct~Category:
 * @param id
 * @text 分类标识
 * @desc 唯一标识，用于成就规则中的分类字段匹配（不可重复，不能用"all"）
 * @default cat
 *
 * @param name
 * @text 分类名称
 * @desc 显示在分类窗口中的名称，支持控制字符
 * @default 新分类
 */

/*~struct~AchievementRule:
 * @param ruleName
 * @text 规则标识
 * @desc 唯一标识，用于判断是否已领取（不可重复）
 *
 * @param achievementName
 * @text 成就名称
 * @default
 * @desc 显示在成就列表中的名称，支持控制字符
 *
 * @param desc
 * @text 成就描述
 * @type multiline_string
 * @desc 成就的详细描述，显示在列表项第二行左侧，支持控制字符
 * @default
 *
 * @param category
 * @text 成就分类
 * @desc 该成就所属的分类标识（对应「成就分类」参数中的id）。留空则只出现在"全部"中。
 * @default
 *
 * @param iconIndex
 * @text 成就图标
 * @type icon
 * @default 0
 * @desc 显示在成就列表项第一行左侧的图标
 *
 * @param condition
 * @text 触发条件
 * @type struct<Condition>[]
 * @default []
 * @desc 成就达成条件（多条件为AND关系）
 *
 * @param rewards
 * @text 奖励内容
 * @desc 奖励公式可使用统计数据stats[keyName]，例如获取金币数stats.gold
 * @type struct<Reward>
 * @default {}
 *
 * @param hidden
 * @text 隐藏成就
 * @type boolean
 * @default false
 * @desc 开启后未达成时不在列表中显示，达成后显示
 *
 * @param repeatable
 * @text 循环成就
 * @type boolean
 * @default false
 * @desc 开启后，达成成就时会重置相关统计值，可以反复达成
 *
 */

/*~struct~Condition:
 * @param id
 * @text 统计字段的键名
 *
 * @param operator
 * @text 比较方式
 * @type select
 * @option 大于等于 (>=)
 * @value ge
 * @option 大于 (>)
 * @value gt
 * @option 等于 (==)
 * @value eq
 * @option 小于 (<)
 * @value lt
 * @option 小于等于 (<=)
 * @value le
 * @default ge
 *
 * @param value
 * @type number
 * @text 目标数值
 */

/*~struct~Reward:
 * @param gold
 * @text 金币公式
 * @type multiline_string
 * @default return 0;
 *
 * @param exp
 * @text 经验公式
 * @type multiline_string
 * @default return 0;
 *
 * @param items
 * @text 道具
 * @type struct<ItemReward>[]
 * @default []
 *
 * @param weapons
 * @text 武器
 * @type struct<WeaponReward>[]
 * @default []
 *
 * @param armors
 * @text 防具
 * @type struct<ArmorReward>[]
 * @default []
 *
 * @param variables
 * @text 变量
 * @type struct<VariableReward>[]
 * @default []
 *
 * @param switches
 * @text 开关
 * @type struct<SwitchReward>[]
 * @default []
 *
 * @param events
 * @text 公共事件
 * @type common_event[]
 * @default []
 * @desc 达成成就后自动执行的公共事件
 */

/*~struct~ItemReward:
 * @param id
 * @type item
 * @default 0
 * @param value
 * @type multiline_string
 * @text 数量
 * @default return 1;
 */

/*~struct~WeaponReward:
 * @param id
 * @type weapon
 * @default 0
 * @param value
 * @type multiline_string
 * @text 数量
 * @default return 1;
 */

/*~struct~ArmorReward:
 * @param id
 * @type armor
 * @default 0
 * @param value
 * @type multiline_string
 * @text 数量
 * @default return 1;
 */

/*~struct~VariableReward:
 * @param id
 * @type variable
 * @default 0
 * @param value
 * @type multiline_string
 * @text 数量
 * @default return 1;
 */

/*~struct~SwitchReward:
 * @param id
 * @type switch
 * @default 0
 * @param value
 * @text 值
 * @type boolean
 * @default true
 */

/*~struct~Background:
 *
 * @param Img
 * @text 图片
 * @type file
 * @dir img
 * @desc 背景图片
 * @default
 *
 * @param Opacity
 * @text 不透明度
 * @type number
 * @min 0
 * @max 255
 * @desc 背景图的不透明度，0~255。值越小越透明
 * @default 192
 *
 * @param X
 * @text 背景图偏移X坐标
 * @type number
 * @desc 背景图偏移X坐标
 * @default 0
 *
 * @param Y
 * @text 背景图偏移Y坐标
 * @type number
 * @desc 背景图偏移Y坐标
 * @default 0
 *
 */

/*~struct~RewardColors:
 *
 * @param gold
 * @text 金币颜色
 * @type number
 * @min 0
 * @max 31
 * @desc 金币奖励的文字颜色号（0-31，对应RMMZ颜色表，6=黄色）
 * @default 6
 *
 * @param exp
 * @text 经验颜色
 * @type number
 * @min 0
 * @max 31
 * @desc 经验奖励的文字颜色号
 * @default 6
 *
 * @param item
 * @text 道具颜色
 * @type number
 * @min 0
 * @max 31
 * @desc 道具奖励的文字颜色号
 * @default 0
 *
 * @param weapon
 * @text 武器颜色
 * @type number
 * @min 0
 * @max 31
 * @default 0
 *
 * @param armor
 * @text 防具颜色
 * @type number
 * @min 0
 * @max 31
 * @default 0
 *
 * @param variable
 * @text 变量颜色
 * @type number
 * @min 0
 * @max 31
 * @default 0
 *
 * @param switch
 * @text 开关颜色
 * @type number
 * @min 0
 * @max 31
 * @default 0
 *
 */

/*~struct~ListWindowSet:
 *
 * @param X
 * @type number
 * @text 窗口X坐标
 * @desc 窗口的位置。x轴方向平移，单位像素。0为贴在最左边。
 * @default 0
 *
 * @param Y
 * @type number
 * @text 窗口Y坐标
 * @desc 窗口的位置。y轴方向平移，单位像素。0为贴在最上面。
 * @default 0
 *
 * @param Width
 * @text 窗口宽度
 * @type number
 * @min 50
 * @desc 窗口的宽度设置。注意，实际文本域的宽度要比该设置小一些，因为有内边距。
 * @default 400
 *
 * @param Height
 * @text 窗口高度
 * @type number
 * @min 50
 * @desc 窗口的高度设置。注意，实际文本域的高度要比该设置小一些，因为有内边距。
 * @default 300
 *
 * @param Opacity
 * @text 不透明度
 * @type number
 * @min 0
 * @max 255
 * @desc 窗口的不透明度，0~255。值越小越透明
 * @default 150
 *
 * @param FontSize
 * @text 字体大小
 * @type number
 * @default 26
 *
 * @param LineHeight
 * @type number
 * @text 行高
 * @default 36
 *
 * @param MaxCols
 * @type number
 * @text 列数
 * @default 2
 *
 * @param ColSpace
 * @type number
 * @text 列间距
 * @default 10
 *
 * @param RowSpace
 * @type number
 * @text 行间距
 * @default 5
 *
 * @param WindowFontFace
 * @text 窗口字体名称
 * @desc 窗口字体名称，必须填文本核心>>额外字体加载设置中的字体名称
 * @default
 *
 * @param WindowMoving
 * @text 窗口移动动画
 * @type struct<WindowMoving>
 * @desc 窗口会从某个点跑回自己的原位置。
 * @default {"MoveType":"弹性移动","MoveTime":"20","MoveDelay":"0","OpacityLock":"false","StartPoint":"","CoordinateType":"相对坐标","SlideX":"0","SlideY":"200","SlideAbsoluteX":"0","SlideAbsoluteY":"0"}
 *
 * @param WindowLayout
 * @text 窗口布局
 * @type struct<WindowLayout>
 * @desc 控制窗口框架与窗口背景。
 * @default {"LayoutType":"默认皮肤","Background":"","BackgroundFile":"","BackgroundX":"0","BackgroundY":"0"}
 *
 */

/* ---------------------------------------------------------------------------
 * struct<WindowMoving>
 * --------------------------------------------------------------------------- */
/*~struct~WindowMoving:
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
 * @default 弹性移动
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
 * @desc 锁定透明度后在运动过程中透明度不变，否则会从0开始变化
 * @default false
 *
 * @param StartPoint
 * @text ====移动起点====
 * @default
 *
 * @param CoordinateType
 * @text 坐标类型
 * @parent StartPoint
 * @type select
 * @option 相对坐标
 * @value 相对坐标
 * @option 绝对坐标
 * @value 绝对坐标
 * @desc 起点的坐标类型。
 * @default 相对坐标
 *
 * @param SlideX
 * @text 起点-相对坐标X
 * @parent StartPoint
 * @desc 相对坐标以原位置为基准，负数向右，正数向左，单位像素。
 * @default 0
 *
 * @param SlideY
 * @text 起点-相对坐标Y
 * @parent StartPoint
 * @desc 相对坐标以原位置为基准，负数向上，正数向下，单位像素。
 * @default 200
 *
 * @param SlideAbsoluteX
 * @text 起点-绝对坐标X
 * @parent StartPoint
 * @desc 绝对坐标，窗口起点的屏幕X坐标，单位像素。
 * @default 0
 *
 * @param SlideAbsoluteY
 * @text 起点-绝对坐标Y
 * @parent StartPoint
 * @desc 绝对坐标，窗口起点的屏幕Y坐标，单位像素。
 * @default 0
 *
 */

/* ---------------------------------------------------------------------------
 * struct<WindowLayout>
 * --------------------------------------------------------------------------- */
/*~struct~WindowLayout:
 *
 * @param LayoutType
 * @text 布局类型
 * @type select
 * @option 默认皮肤
 * @value 默认皮肤
 * @option 单张背景贴图
 * @value 单张背景贴图
 * @option 隐藏布局
 * @value 隐藏布局
 * @desc 窗口布局的类型。
 * @default 默认皮肤
 *
 * @param Background
 * @text ===单张背景贴图===
 * @default
 *
 * @param BackgroundFile
 * @text 资源-贴图
 * @parent Background
 * @type file
 * @dir img/
 * @require 1
 * @desc 窗口的背景贴图的资源。
 * @default
 *
 * @param BackgroundX
 * @text 贴图位置修正 X
 * @parent Background
 * @desc 修正图片的位置用。以窗口的点为基准，负数向右，正数向左，单位像素。
 * @default 0
 *
 * @param BackgroundY
 * @text 贴图位置修正 Y
 * @parent Background
 * @desc 修正图片的位置用。以窗口的点为基准，负数向上，正数向下，单位像素。
 * @default 0
 *
 */
/* ---------------------------------------------------------------------------
 * struct<AchCategoryButtonSet>
 * --------------------------------------------------------------------------- */
/*~struct~AchCategoryButtonSet:
 *
 * @param ButtonSetX
 * @text 平移-按钮组 X
 * @desc x轴方向平移，单位像素。0为贴在最左边。
 * @default 0
 *
 * @param ButtonSetY
 * @text 平移-按钮组 Y
 * @desc y轴方向平移，单位像素。0为贴在最上面。
 * @default 0
 *
 * @param ButtonSetStyle
 * @text 按钮组样式
 * @type number
 * @min 1
 * @desc 按钮组对应的样式配置，对应 GF_1_CoreOfSpriteUI 按钮组核心 的样式id。
 * @default 1
 *
 * @param ButtonBitmapNum
 * @text 按钮贴图分割数量
 * @type number
 * @min 1
 * @max 3
 * @desc 按钮贴图分割数量，为2时，上面1/2代表常态按钮，下面1/2代表被选中/激活的按钮，
 *       为3时每1/3分别代表常态、选中、激活。
 * @default 1
 *
 * @param ButtonBackBitmap
 * @text 按钮组背景
 * @type file
 * @dir img/
 * @require 1
 * @desc 按钮组的整体背景
 * @default
 *
 * @param ButtonSetBitmap
 * @text 默认按钮贴图
 * @type file
 * @require 1
 * @dir img/
 * @desc 默认按钮的图片资源。
 * @default
 *
 */
/* ---------------------------------------------------------------------------
 * struct<AchCategoryButtons>
 * --------------------------------------------------------------------------- */
/*~struct~AchCategoryButtons:
 *
 * @param Note
 * @text 标签
 * @desc 只用于方便区分查看的标签，不作用在插件中。
 * @default --新的分类按钮--
 *
 * @param Symbol
 * @text 关键字
 * @type combo
 * @option all
 * @desc 分类标识，对应「成就分类」参数中的id（如 battle、explore、collect 或自定义分类ID）。"all"用于"全部"分类。
 * @default all
 *
 * @param Bitmap
 * @text 按钮贴图
 * @type file
 * @require 1
 * @dir img/
 * @desc 该分类的自定义按钮贴图。不填则使用默认按钮贴图。
 * @default
 *
 */

// ============================================================================
// 参数解析工具（替代 DM_Common 的 deepParse / parseEscapeCharacters / parseArg / pop）
// ============================================================================
WSQ.ACH.safeJSONParse = function (str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return null;
    }
};

WSQ.ACH.deepParse = function (input) {
    if (typeof input === "string") {
        const parsed = WSQ.ACH.safeJSONParse(input);
        if (parsed !== null) return WSQ.ACH.deepParse(parsed);
    }
    if (Array.isArray(input)) {
        return input.map(WSQ.ACH.deepParse);
    }
    if (input && typeof input === "object") {
        return Object.fromEntries(
            Object.entries(input).map(([k, v]) => [k, WSQ.ACH.deepParse(v)])
        );
    }
    return input;
};

WSQ.ACH._tempWindowForEscape = null;
WSQ.ACH.parseEscapeCharacters = function (str) {
    if (typeof str !== "string") return str;
    if (!WSQ.ACH._tempWindowForEscape || WSQ.ACH._tempWindowForEscape._destroyed) {
        WSQ.ACH._tempWindowForEscape = new Window_Base(new Rectangle(0, 0, 0, 0));
    }
    return WSQ.ACH._tempWindowForEscape.convertEscapeCharacters(str);
};

WSQ.ACH.parseArg = function (arg) {
    const val = WSQ.ACH.parseEscapeCharacters(arg);
    return WSQ.ACH.deepParse(val);
};

// 弹窗提示（替代 DM.pop，使用 GF_3_ToastSystem）
WSQ.ACH.pop = function (msg) {
    if (typeof ToastManager !== "undefined" && ToastManager.addText) {
        ToastManager.addText(msg);
    } else if (typeof console !== "undefined") {
        console.warn("[WSQ_Achievement] ToastSystem 未启用，弹窗内容：", msg);
    }
};

// ============================================================================
// 参数预处理
// ============================================================================
WSQ.ACH.Parameters = PluginManager.parameters(WSQ.ACH.pluginName);
WSQ.Param = WSQ.Param || {};
WSQ.Param.ACH = WSQ.ACH.deepParse(WSQ.ACH.Parameters);

// 将窗口参数转换为 GF 兼容的 WindowSet
WSQ.ACH.setupWindowParam = function (raw) {
    if (!Imported.GF_1_CoreOfWindowUI) return null;
    const gfSet = {
        WindowX: raw.X || 0,
        WindowY: raw.Y || 0,
        WindowWidth: raw.Width || 100,
        WindowHeight: raw.Height || 100,
        WindowFontSize: raw.FontSize || 26,
        WindowFontFace: raw.WindowFontFace || "",
        WindowLineHeight: raw.LineHeight || 36,
        WindowCols: raw.MaxCols || 0,
        WindowMoving: JSON.stringify(raw.WindowMoving || {}),
        WindowLayout: JSON.stringify(raw.WindowLayout || {})
    };
    return DataManager.setupWindowInitParam(gfSet);
};

WSQ.Param.ACH.categoryWindow.WindowSet = WSQ.ACH.setupWindowParam(WSQ.Param.ACH.categoryWindow);
WSQ.Param.ACH.listWindow.WindowSet = WSQ.ACH.setupWindowParam(WSQ.Param.ACH.listWindow);

// 系统统计字段显示名（用于条件展示）
WSQ.ACH.systemStatDisplayNames = {
    battleCount: "战斗次数",
    winCount: "胜利次数",
    deathCount: "失败次数",
    escapeCount: "逃跑次数",
    defeatedMonsters: "击杀怪物数",
    saveCount: "存档次数",
    gold: "持有金币数",
    gainGold: "获得金币数",
    costGold: "消耗金币数",
    exp: "获得经验",
    collectedItems: "获得物品数",
    collectedWeapons: "获得武器数",
    collectedArmors: "获得防具数",
    steps: "步数",
    playtime: "游戏时间",
    partyMembers: "队伍人数",
    healAmount: "治愈HP总量",
    damageDealt: "造成伤害总量",
    damageTaken: "受到伤害总量",
    criticalCount: "暴击次数",
    evasionCount: "闪避次数",
    missCount: "未命中次数",
    attackCount: "普攻次数",
    guardCount: "防御次数",
    skillUseCount: "技能使用次数",
    itemUseCount: "道具使用次数",
    reviveCount: "复活次数",
    shopBuyCount: "购买数量",
    shopSellCount: "卖出数量",
    maxDamage: "单次最大伤害",
    consecutiveBattles: "连续战斗次数"
};

// 根据统计键名获取显示名称
WSQ.ACH.getStatDisplayName = function (key) {
    if (!key) return key;
    // 1. 系统统计字段
    if (WSQ.ACH.systemStatDisplayNames[key]) {
        return WSQ.ACH.systemStatDisplayNames[key];
    }
    // 2. 自定义统计字段
    const customStats = WSQ.Param.ACH.statsConfig || [];
    for (let i = 0; i < customStats.length; i++) {
        if (customStats[i].keyName === key) {
            return customStats[i].displayName || key;
        }
    }
    // 3. 带后缀的对象统计（如 defeatedMonsters7 → 击败幽灵 等）
    const baseKey = key.replace(/\d+$/g, '');
    if (baseKey !== key) {
        const baseName = WSQ.ACH.getStatDisplayName(baseKey);
        if (baseName) {
            const suffix = key.slice(baseKey.length);
            return baseName + suffix;
        }
    }
    // 4. 回退：用键名自身
    return key;
};

// 判断数据库对象是否带有 <WSQ_ACH> / <成就统计> 备注标签
WSQ.ACH.hasAchNote = function (obj) {
    if (!obj || !obj.meta) return false;
    return !!(obj.meta.WSQ_ACH || obj.meta["成就统计"]);
};

// ============================================================================
// 预处理成就规则：生成条件函数 & 奖励函数 & 依赖图
// ============================================================================
WSQ.ACH.prepareAchievements = function () {
    const rules = WSQ.Param.ACH.achievementConfig;
    const graph = {};
    WSQ.Param.ACH.systemStats = Object.fromEntries(
        (WSQ.Param.ACH.systemStats || []).map(key => [key, true])
    );
    (rules || []).forEach((rule, idx) => {
        const condArray = rule.condition || [];
        // 1. 条件函数
        rule.conditionFunc = (stats) => {
            return condArray.every(cond => {
                const current = stats[cond.id] || 0;
                const target = Number(cond.value);
                switch (cond.operator) {
                    case "ge": return current >= target;
                    case "gt": return current > target;
                    case "eq": return current === target;
                    case "lt": return current < target;
                    case "le": return current <= target;
                    default: return current >= target;
                }
            });
        };
        // 2. 奖励函数（用 new Function 编译公式字符串）
        const r = rule.rewards || {};
        try { r.goldFunc = new Function("stats", r.gold || "return 0;"); } catch (e) { r.goldFunc = () => 0; }
        try { r.expFunc = new Function("stats", r.exp || "return 0;"); } catch (e) { r.expFunc = () => 0; }
        ["items", "weapons", "armors", "variables"].forEach(type => {
            (r[type] || []).forEach(item => {
                try { item.valueFunc = new Function("stats", item.value || "return 1;"); }
                catch (e) { item.valueFunc = () => 1; }
            });
        });
        // 3. 构建依赖图
        condArray.forEach(cond => {
            const key = cond.id;
            if (!graph[key]) graph[key] = new Set();
            graph[key].add(idx);
        });
    });
    return graph;
};

WSQ.ACH.ruleDependencyGraph = WSQ.ACH.prepareAchievements();

// 生成奖励摘要字符串（用于列表项第二行右对齐显示）
WSQ.ACH.buildRewardSummary = function (rule, stats) {
    const parts = [];
    const r = rule.rewards || {};
    const colors = WSQ.Param.ACH.rewardColors || {};
    const c = (key, def) => {
        const v = Number(colors[key]);
        return Number.isFinite(v) ? v : def;
    };
    const gold = r.goldFunc ? r.goldFunc(stats) : 0;
    if (gold > 0) parts.push(`\\C[${c("gold", 6)}]金币+${gold}\\C[0]`);
    const exp = r.expFunc ? r.expFunc(stats) : 0;
    if (exp > 0) parts.push(`\\C[${c("exp", 6)}]经验+${exp}\\C[0]`);
    (r.items || []).forEach(it => {
        const val = it.valueFunc ? it.valueFunc(stats) : 0;
        const item = $dataItems[it.id];
        if (it.id > 0 && val > 0 && item) parts.push(`\\C[${c("item", 0)}]${item.name}×${val}\\C[0]`);
    });
    (r.weapons || []).forEach(it => {
        const val = it.valueFunc ? it.valueFunc(stats) : 0;
        const item = $dataWeapons[it.id];
        if (it.id > 0 && val > 0 && item) parts.push(`\\C[${c("weapon", 0)}]${item.name}×${val}\\C[0]`);
    });
    (r.armors || []).forEach(it => {
        const val = it.valueFunc ? it.valueFunc(stats) : 0;
        const item = $dataArmors[it.id];
        if (it.id > 0 && val > 0 && item) parts.push(`\\C[${c("armor", 0)}]${item.name}×${val}\\C[0]`);
    });
    (r.variables || []).forEach(it => {
        const val = it.valueFunc ? it.valueFunc(stats) : 0;
        if (it.id > 0) {
            const name = $dataSystem.variables[it.id] || `变量${it.id}`;
            parts.push(`\\C[${c("variable", 0)}]${name}${val >= 0 ? "+" : ""}${val}\\C[0]`);
        }
    });
    (r.switches || []).forEach(it => {
        if (it.id > 0) {
            const name = $dataSystem.switches[it.id] || `开关${it.id}`;
            parts.push(`\\C[${c("switch", 0)}]${name}:${it.value ? "开" : "关"}\\C[0]`);
        }
    });
    return parts.join("  ·  ");
};

// 生成成就进度文本（单条件显示 current/target，多条件显示 已满足数/总数）
WSQ.ACH.buildProgressText = function (rule, stats) {
    const conds = rule.condition || [];
    if (conds.length === 0) return "";
    const showLabel = WSQ.Param.ACH.showProgressLabel;
    if (conds.length === 1) {
        const cond = conds[0];
        const current = stats[cond.id] || 0;
        const target = Number(cond.value) || 0;
        const progress = `${current}/${target}`;
        if (showLabel) {
            const label = WSQ.ACH.getStatDisplayName(cond.id);
            return `${label}: ${progress}`;
        }
        return progress;
    }
    const met = conds.filter(cond => {
        const current = stats[cond.id] || 0;
        const target = Number(cond.value) || 0;
        switch (cond.operator) {
            case "ge": return current >= target;
            case "gt": return current > target;
            case "eq": return current === target;
            case "lt": return current < target;
            case "le": return current <= target;
            default: return current >= target;
        }
    }).length;
    return `${met}/${conds.length}`;
};

// ============================================================================
// Game_System 扩展
// ============================================================================
WSQ.ACH.Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function () {
    WSQ.ACH.Game_System_initialize.call(this);
    this._achievementStats = {};
    this._grantedAchievements = {};
};

// 记录统计值
Game_System.prototype.recordAchievementStat = function (key, value = 1, cover = false) {
    if (cover) {
        this._achievementStats[key] = value;
    } else {
        if (this._achievementStats[key] === undefined) {
            this._achievementStats[key] = 0;
        }
        this._achievementStats[key] += value;
    }
    this.checkAchievementsForKey(key);
};

// 只检查依赖指定键的成就
Game_System.prototype.checkAchievementsForKey = function (key) {
    const relatedRuleIndices = WSQ.ACH.ruleDependencyGraph[key] || [];
    const stats = this._achievementStats;
    relatedRuleIndices.forEach(idx => {
        const rule = WSQ.Param.ACH.achievementConfig[idx];
        const id = rule.ruleName;
        // 已领取处理
        if (this._grantedAchievements[id]) {
            if (rule.repeatable) {
                rule.condition.forEach(c => { this._achievementStats[c.id] = 0; });
                delete this._grantedAchievements[id];
            } else {
                return;
            }
        }
        // 条件判断
        if (!rule.conditionFunc(stats)) return;
        // 发放奖励
        const desc = this._grantAchievementRewards(rule, stats);
        this._grantedAchievements[id] = true;
        // 循环成就发完立刻重置
        if (rule.repeatable) {
            rule.condition.forEach(c => { this._achievementStats[c.id] = 0; });
            delete this._grantedAchievements[id];
        }
        WSQ.ACH.notice(desc, rule.achievementName || rule.ruleName, rule.desc);
    });
};

// 按成就名称手动检测
Game_System.prototype.checkAchievementsForName = function (name) {
    const stats = this._achievementStats;
    const rules = WSQ.Param.ACH.achievementConfig.filter(r => r.achievementName === name);
    for (const rule of rules) {
        const id = rule.ruleName;
        if (this._grantedAchievements[id]) {
            if (rule.repeatable) {
                rule.condition.forEach(c => { this._achievementStats[c.id] = 0; });
                delete this._grantedAchievements[id];
            } else {
                continue;
            }
        }
        if (!rule.conditionFunc(stats)) continue;
        const desc = this._grantAchievementRewards(rule, stats);
        this._grantedAchievements[id] = true;
        if (rule.repeatable) {
            rule.condition.forEach(c => { this._achievementStats[c.id] = 0; });
            delete this._grantedAchievements[id];
        }
        WSQ.ACH.notice(desc, rule.achievementName || rule.ruleName, rule.desc);
        break;
    }
};

// 成就解锁提示（使用 GF ToastSystem）
WSQ.ACH.notice = function (descriptions, name, desc) {
    const sound = WSQ.Param.ACH.sound;
    if (sound) {
        AudioManager.playSe({ name: sound, volume: 100, pitch: 100, pan: 0 });
    }
    if (WSQ.Param.ACH.showPopup) {
        let msg = `\\C[6]成就解锁：${name}\\C[0]`;
        if (desc) msg += `\n${desc}`;
        if (descriptions.length > 0 && WSQ.Param.ACH.popupRewards) {
            msg += `\n奖励：\n` + descriptions.map(item => `  ${item}`).join("\n");
        }
        WSQ.ACH.pop(msg);
    }
};

// 奖励发放（返回描述数组）
Game_System.prototype._grantAchievementRewards = function (rule, stats) {
    const rewards = rule.rewards || {};
    const descriptions = [];
    // 金币
    const gold = rewards.goldFunc ? rewards.goldFunc(stats) : 0;
    if (gold > 0) {
        $gameParty.gainGold(gold);
        let desc = $dataSystem.currencyUnit;
        if (Imported.GF_0_CoreOfGame && GF.Param.COGGoldSet) {
            desc = `\\I[${GF.Param.COGGoldSet.GoldIcon}]` + desc;
        }
        descriptions.push(`${desc} +${gold}`);
    }
    // 经验
    const exp = rewards.expFunc ? rewards.expFunc(stats) : 0;
    if (exp > 0) {
        $gameParty.battleMembers().forEach(m => m.gainExp(exp));
        descriptions.push(`${TextManager.exp} +${exp}`);
    }
    // 道具
    (rewards.items || []).forEach(it => {
        const id = it.id, val = it.valueFunc ? it.valueFunc(stats) : 0;
        const item = $dataItems[id];
        if (id > 0 && val > 0 && item) {
            $gameParty.gainItem(item, val);
            let desc = (Imported.GF_0_CoreOfGame) ? `\\Item[${id}]` : `\\I[${item.iconIndex}]${item.name}`;
            descriptions.push(`${desc} ×${val}`);
        }
    });
    // 武器
    (rewards.weapons || []).forEach(it => {
        const id = it.id, val = it.valueFunc ? it.valueFunc(stats) : 0;
        const item = $dataWeapons[id];
        if (id > 0 && val > 0 && item) {
            $gameParty.gainItem(item, val);
            let desc = (Imported.GF_0_CoreOfGame) ? `\\Weapon[${id}]` : `\\I[${item.iconIndex}]${item.name}`;
            descriptions.push(`${desc} ×${val}`);
        }
    });
    // 防具
    (rewards.armors || []).forEach(it => {
        const id = it.id, val = it.valueFunc ? it.valueFunc(stats) : 0;
        const item = $dataArmors[id];
        if (id > 0 && val > 0 && item) {
            $gameParty.gainItem(item, val);
            let desc = (Imported.GF_0_CoreOfGame) ? `\\Armor[${id}]` : `\\I[${item.iconIndex}]${item.name}`;
            descriptions.push(`${desc} ×${val}`);
        }
    });
    // 变量
    (rewards.variables || []).forEach(it => {
        const id = it.id, val = it.valueFunc ? it.valueFunc(stats) : 0;
        if (id > 0) {
            const old = $gameVariables.value(id);
            $gameVariables.setValue(id, old + val);
            const varName = $dataSystem.variables[id] || `变量${id}`;
            descriptions.push(`${varName} ${val >= 0 ? "+" : ""}${val}`);
        }
    });
    // 开关
    (rewards.switches || []).forEach(it => {
        if (it.id > 0) {
            $gameSwitches.setValue(it.id, it.value);
            const swName = $dataSystem.switches[it.id] || `开关${it.id}`;
            descriptions.push(`${swName} ${it.value ? "开启" : "关闭"}`);
        }
    });
    // 公共事件
    const ceIds = rewards.events || [];
    ceIds.forEach(id => {
        if (id > 0) {
            $gameTemp.reserveCommonEvent(id);
            const ce = $dataCommonEvents[id];
            const ceName = ce ? ce.name : `公共事件${id}`;
            descriptions.push(`执行：${ceName}`);
        }
    });
    return descriptions;
};

// 查询成就是否已达成
Game_System.prototype.isAchievementGranted = function (ruleName) {
    return !!this._grantedAchievements[ruleName];
};

// ============================================================================
// 自动监听（系统统计字段）
// ============================================================================
WSQ.ACH.Game_System_onBattleStart = Game_System.prototype.onBattleStart;
Game_System.prototype.onBattleStart = function () {
    WSQ.ACH.Game_System_onBattleStart.call(this);
    if (WSQ.Param.ACH.systemStats["battleCount"]) {
        this.recordAchievementStat("battleCount");
    }
    if (WSQ.Param.ACH.systemStats["consecutiveBattles"]) {
        this.recordAchievementStat("consecutiveBattles");
    }
};

if (WSQ.Param.ACH.systemStats["winCount"]) {
    WSQ.ACH.Game_System_onBattleWin = Game_System.prototype.onBattleWin;
    Game_System.prototype.onBattleWin = function () {
        WSQ.ACH.Game_System_onBattleWin.call(this);
        this.recordAchievementStat("winCount");
    };
}

if (WSQ.Param.ACH.systemStats["deathCount"]) {
    WSQ.ACH.BattleManager_processDefeat = BattleManager.processDefeat;
    BattleManager.processDefeat = function () {
        WSQ.ACH.BattleManager_processDefeat.call(this);
        $gameSystem.recordAchievementStat("deathCount");
    };
}

if (WSQ.Param.ACH.systemStats["escapeCount"]) {
    WSQ.ACH.Game_System_onBattleEscape = Game_System.prototype.onBattleEscape;
    Game_System.prototype.onBattleEscape = function () {
        WSQ.ACH.Game_System_onBattleEscape.call(this);
        this.recordAchievementStat("escapeCount");
    };
}

if (WSQ.Param.ACH.systemStats["defeatedMonsters"]) {
    WSQ.ACH.Game_Enemy_die = Game_Enemy.prototype.die;
    Game_Enemy.prototype.die = function () {
        WSQ.ACH.Game_Enemy_die.call(this);
        $gameSystem.recordAchievementStat("defeatedMonsters");
        if (WSQ.ACH.hasAchNote(this.enemy())) {
            $gameSystem.recordAchievementStat("defeatedMonsters" + this._enemyId, 1);
        }
    };
}

WSQ.ACH.Game_System_onBeforeSave = Game_System.prototype.onBeforeSave;
Game_System.prototype.onBeforeSave = function () {
    WSQ.ACH.Game_System_onBeforeSave.call(this);
    if (WSQ.Param.ACH.systemStats["saveCount"]) {
        this.recordAchievementStat("saveCount");
    }
    if (WSQ.Param.ACH.systemStats["consecutiveBattles"]) {
        this.recordAchievementStat("consecutiveBattles", 0, true);
    }
};

WSQ.ACH.Game_Party_gainGold = Game_Party.prototype.gainGold;
Game_Party.prototype.gainGold = function (amount) {
    WSQ.ACH.Game_Party_gainGold.call(this, amount);
    if (amount > 0 && WSQ.Param.ACH.systemStats["gainGold"]) {
        $gameSystem.recordAchievementStat("gainGold", amount);
    }
    if (amount < 0 && WSQ.Param.ACH.systemStats["costGold"]) {
        $gameSystem.recordAchievementStat("costGold", -amount);
    }
    if (WSQ.Param.ACH.systemStats["gold"]) {
        $gameSystem.recordAchievementStat("gold", this.gold(), true);
    }
};

if (WSQ.Param.ACH.systemStats["exp"]) {
    WSQ.ACH.Game_Actor_gainExp = Game_Actor.prototype.gainExp;
    Game_Actor.prototype.gainExp = function (exp) {
        WSQ.ACH.Game_Actor_gainExp.call(this, exp);
        $gameSystem.recordAchievementStat("exp", exp);
    };
}

WSQ.ACH.Game_Party_gainItem = Game_Party.prototype.gainItem;
Game_Party.prototype.gainItem = function (item, amount, includeEquip) {
    WSQ.ACH.Game_Party_gainItem.call(this, item, amount, includeEquip);
    if (amount <= 0) return;
    if (WSQ.Param.ACH.systemStats["collectedItems"] && DataManager.isItem(item)) {
        $gameSystem.recordAchievementStat("collectedItems", amount);
        if (WSQ.ACH.hasAchNote(item)) {
            $gameSystem.recordAchievementStat("collectedItems" + item.id, amount);
        }
    }
    if (WSQ.Param.ACH.systemStats["collectedWeapons"] && DataManager.isWeapon(item)) {
        $gameSystem.recordAchievementStat("collectedWeapons", amount);
        if (WSQ.ACH.hasAchNote(item)) {
            $gameSystem.recordAchievementStat("collectedWeapons" + item.id, amount);
        }
    }
    if (WSQ.Param.ACH.systemStats["collectedArmors"] && DataManager.isArmor(item)) {
        $gameSystem.recordAchievementStat("collectedArmors", amount);
        if (WSQ.ACH.hasAchNote(item)) {
            $gameSystem.recordAchievementStat("collectedArmors" + item.id, amount);
        }
    }
};

if (WSQ.Param.ACH.systemStats["steps"]) {
    WSQ.ACH.Game_Party_increaseSteps = Game_Party.prototype.increaseSteps;
    Game_Party.prototype.increaseSteps = function () {
        WSQ.ACH.Game_Party_increaseSteps.call(this);
        $gameSystem.recordAchievementStat("steps");
    };
}

if (WSQ.Param.ACH.systemStats["playtime"]) {
    WSQ.ACH.Game_System_playtime = Game_System.prototype.playtime;
    Game_System.prototype.playtime = function () {
        const playtime = WSQ.ACH.Game_System_playtime.call(this);
        this.recordAchievementStat("playtime", playtime, true);
        return playtime;
    };
}

if (WSQ.Param.ACH.systemStats["partyMembers"]) {
    WSQ.ACH.Game_Party_addActor = Game_Party.prototype.addActor;
    Game_Party.prototype.addActor = function (actorId) {
        WSQ.ACH.Game_Party_addActor.call(this, actorId);
        const size = this.size();
        $gameSystem.recordAchievementStat("partyMembers", size, true);
    };
}

if (WSQ.Param.ACH.systemStats["healAmount"]) {
    WSQ.ACH.Game_Battler_gainHp = Game_Battler.prototype.gainHp;
    Game_Battler.prototype.gainHp = function (value) {
        WSQ.ACH.Game_Battler_gainHp.call(this, value);
        if (value > 0 && this.isActor()) {
            $gameSystem.recordAchievementStat("healAmount", value);
        }
    };
}

// 造成伤害 / 受到伤害 / 单次最大伤害
WSQ.ACH.Game_Action_executeHpDamage = Game_Action.prototype.executeHpDamage;
Game_Action.prototype.executeHpDamage = function (target, value) {
    WSQ.ACH.Game_Action_executeHpDamage.call(this, target, value);
    if (value <= 0) return;
    const user = this.subject();
    if (user.isActor()) {
        const actorId = user.baseActorId ? user.baseActorId() : user.actorId();
        const data = $dataActors[actorId];
        if (WSQ.Param.ACH.systemStats["damageDealt"]) {
            $gameSystem.recordAchievementStat("damageDealt", value);
            if (WSQ.ACH.hasAchNote(data)) {
                $gameSystem.recordAchievementStat("damageDealt" + actorId, value);
            }
        }
        if (WSQ.Param.ACH.systemStats["maxDamage"]) {
            const currentMax = $gameSystem._achievementStats["maxDamage"] || 0;
            if (value > currentMax) {
                $gameSystem.recordAchievementStat("maxDamage", value, true);
            }
            if (WSQ.ACH.hasAchNote(data)) {
                const actorKey = "maxDamage" + actorId;
                const actorCurrentMax = $gameSystem._achievementStats[actorKey] || 0;
                if (value > actorCurrentMax) {
                    $gameSystem.recordAchievementStat(actorKey, value, true);
                }
            }
        }
    }
    if (target.isActor() && WSQ.Param.ACH.systemStats["damageTaken"]) {
        $gameSystem.recordAchievementStat("damageTaken", value);
        const actorId = target.baseActorId ? target.baseActorId() : target.actorId();
        const data = $dataActors[actorId];
        if (WSQ.ACH.hasAchNote(data)) {
            $gameSystem.recordAchievementStat("damageTaken" + actorId, value);
        }
    }
};

// 暴击 / 未命中 / 闪避
WSQ.ACH.Game_Action_apply = Game_Action.prototype.apply;
Game_Action.prototype.apply = function (target) {
    WSQ.ACH.Game_Action_apply.call(this, target);
    const user = this.subject();
    const result = target.result();
    if (user.isActor()) {
        const actorId = user.baseActorId ? user.baseActorId() : user.actorId();
        const data = $dataActors[actorId];
        if (WSQ.Param.ACH.systemStats["criticalCount"] && result.critical && result.isHit()) {
            $gameSystem.recordAchievementStat("criticalCount");
            if (WSQ.ACH.hasAchNote(data)) {
                $gameSystem.recordAchievementStat("criticalCount" + actorId);
            }
        }
        if (WSQ.Param.ACH.systemStats["missCount"] && !result.isHit()) {
            $gameSystem.recordAchievementStat("missCount");
            if (WSQ.ACH.hasAchNote(data)) {
                $gameSystem.recordAchievementStat("missCount" + actorId);
            }
        }
    }
    if (WSQ.Param.ACH.systemStats["evasionCount"] && target.isActor() && !result.isHit()) {
        $gameSystem.recordAchievementStat("evasionCount");
        const actorId = target.baseActorId ? target.baseActorId() : target.actorId();
        const data = $dataActors[actorId];
        if (WSQ.ACH.hasAchNote(data)) {
            $gameSystem.recordAchievementStat("evasionCount" + actorId);
        }
    }
};

// 普攻 / 防御 / 技能 / 道具使用次数
WSQ.ACH.Game_Actor_useItem = Game_Actor.prototype.useItem;
Game_Actor.prototype.useItem = function (item) {
    WSQ.ACH.Game_Actor_useItem.call(this, item);
    if (WSQ.Param.ACH.systemStats["itemUseCount"] && DataManager.isItem(item)) {
        $gameSystem.recordAchievementStat("itemUseCount");
    }
    if (item === $dataSkills[this.attackSkillId()]) {
        if (WSQ.Param.ACH.systemStats["attackCount"]) {
            $gameSystem.recordAchievementStat("attackCount");
        }
    } else if (item === $dataSkills[this.guardSkillId()]) {
        if (WSQ.Param.ACH.systemStats["guardCount"]) {
            $gameSystem.recordAchievementStat("guardCount");
        }
    } else if (WSQ.Param.ACH.systemStats["skillUseCount"] && DataManager.isSkill(item)) {
        $gameSystem.recordAchievementStat("skillUseCount");
    }
    // 带 <WSQ_ACH> 备注的对象记录带ID的统计项
    if (WSQ.ACH.hasAchNote(item)) {
        if (DataManager.isItem(item)) {
            $gameSystem.recordAchievementStat("itemUseCount" + item.id);
        } else if (DataManager.isSkill(item)) {
            $gameSystem.recordAchievementStat("skillUseCount" + item.id);
        }
    }
};

// 复活次数
if (WSQ.Param.ACH.systemStats["reviveCount"]) {
    WSQ.ACH.Game_Battler_removeState = Game_Battler.prototype.removeState;
    Game_Battler.prototype.removeState = function (stateId) {
        const wasDead = this.isDead();
        WSQ.ACH.Game_Battler_removeState.call(this, stateId);
        if (wasDead && !this.isDead() && this.isActor()) {
            $gameSystem.recordAchievementStat("reviveCount");
            const actorId = this.baseActorId ? this.baseActorId() : this.actorId();
            const data = $dataActors[actorId];
            if (WSQ.ACH.hasAchNote(data)) {
                $gameSystem.recordAchievementStat("reviveCount" + actorId);
            }
        }
    };
}

// 商店购买 / 卖出
WSQ.ACH.Scene_Shop_doBuy = Scene_Shop.prototype.doBuy;
Scene_Shop.prototype.doBuy = function (number) {
    WSQ.ACH.Scene_Shop_doBuy.call(this, number);
    if (WSQ.Param.ACH.systemStats["shopBuyCount"]) {
        $gameSystem.recordAchievementStat("shopBuyCount", number);
    }
    const item = this._item;
    if (WSQ.ACH.hasAchNote(item)) {
        let type = "";
        if (DataManager.isItem(item)) type = "i";
        else if (DataManager.isWeapon(item)) type = "w";
        else if (DataManager.isArmor(item)) type = "a";
        if (type) {
            $gameSystem.recordAchievementStat("shopBuyCount_" + type + item.id, number);
        }
    }
};

WSQ.ACH.Scene_Shop_doSell = Scene_Shop.prototype.doSell;
Scene_Shop.prototype.doSell = function (number) {
    WSQ.ACH.Scene_Shop_doSell.call(this, number);
    if (WSQ.Param.ACH.systemStats["shopSellCount"]) {
        $gameSystem.recordAchievementStat("shopSellCount", number);
    }
    const item = this._item;
    if (WSQ.ACH.hasAchNote(item)) {
        let type = "";
        if (DataManager.isItem(item)) type = "i";
        else if (DataManager.isWeapon(item)) type = "w";
        else if (DataManager.isArmor(item)) type = "a";
        if (type) {
            $gameSystem.recordAchievementStat("shopSellCount_" + type + item.id, number);
        }
    }
};

// ============================================================================
// 存档兼容
// ============================================================================
WSQ.ACH.DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function (contents) {
    WSQ.ACH.DataManager_extractSaveContents.call(this, contents);
    if (!$gameSystem._achievementStats) $gameSystem._achievementStats = {};
    if (!$gameSystem._grantedAchievements) $gameSystem._grantedAchievements = {};
};

// ============================================================================
// 成就场景
// ============================================================================
class Scene_Achievement extends Scene_MenuBase {
    create() {
        super.create();
        this.createCategoryWindow();
        this.createListWindow();
    }

    createBackground() {
        super.createBackground();
        const bg = WSQ.Param.ACH.background || {};
        if (!bg.Img) return;
        this._backgroundSprite.bitmap = ImageManager.loadBitmap("img/", bg.Img);
        this._backgroundSprite.filters = [];
        this._backgroundSprite.move(bg.X || 0, bg.Y || 0);
        this.setBackgroundOpacity(bg.Opacity != null ? bg.Opacity : 192);
    }

    get useButtonMode() {
        const mode = String(WSQ.Param.ACH.CategoryMode || '窗口');
        return mode === '按钮' && typeof Sprite_CommandWindow !== 'undefined';
    }

    createCategoryWindow() {
        if (this.useButtonMode) {
            this._categoryWidget = new Sprite_AchievementCategory();
            this._categoryWidget.setHandler('ok', this.onCategoryOk.bind(this));
            this._categoryWidget.setHandler('cancel', this.onCategoryCancel.bind(this));
        } else {
            const set = WSQ.Param.ACH.categoryWindow;
            this._categoryWidget = new Window_AchievementCategory(set);
            this._categoryWidget.setHandler('ok', this.onCategoryOk.bind(this));
            this._categoryWidget.setHandler('cancel', this.popScene.bind(this));
        }
        this.addChild(this._categoryWidget);
        // 按钮模式下分类不获取焦点（点击事件由精灵按钮处理），窗口模式下激活
        if (!this.useButtonMode) {
            this._categoryWidget.activate();
            this._categoryWidget.select(0);
        }
    }

    createListWindow() {
        const set = WSQ.Param.ACH.listWindow;
        this._listWindow = new Window_AchievementList(set);
        this._listWindow.setHandler("ok", this.onListOk.bind(this));
        this._listWindow.setHandler("cancel", this.onListCancel.bind(this));
        this.addChild(this._listWindow);
        // 初始用分类控件当前选中项过滤
        this._listWindow.setCategory(this._categoryWidget.categoryId());
        // 窗口模式下：分类窗口光标移动时自动刷新列表
        if (!this.useButtonMode && typeof this._categoryWidget.setListWindow === 'function') {
            this._categoryWidget.setListWindow(this._listWindow);
        }
        // 按钮模式下列表窗口一开始就获取焦点；窗口模式下列表窗口等待分类确定
        if (this.useButtonMode) {
            this._listWindow.activate();
            this._listWindow.select(0);
        } else {
            this._listWindow.deactivate();
            this._listWindow.deselect();
        }
    }

    onCategoryOk() {
        const symbol = this._categoryWidget.categoryId();
        this._listWindow.setCategory(symbol);
        this._listWindow.activate();
        this._listWindow.select(0);
        if (!this.useButtonMode) {
            this._categoryWidget.deactivate();
        }
    }

    onCategoryCancel() {
        // 按钮模式下分类取消即退出；窗口模式已使用 popScene
        if (this.useButtonMode) {
            this.popScene();
        }
    }

    onListCancel() {
        if (this.useButtonMode) {
            // 按钮模式：列表取消直接退出
            this.popScene();
        } else {
            this._listWindow.deactivate();
            this._listWindow.deselect();
            this._categoryWidget.activate();
        }
    }

    onListOk() {
        // 列表项确认：保持激活，便于浏览（无详情窗口）
        this._listWindow.activate();
    }
}

// ----------------------------------------------------------------------------
// 分类窗口（横向多列，"全部" + 自定义分类）
// ----------------------------------------------------------------------------
class Window_AchievementCategory extends Window_Command {
    initialize(windowSet) {
        this._windowSet = windowSet;
        const rect = new Rectangle(
            Number(windowSet.X) || 0,
            Number(windowSet.Y) || 0,
            Number(windowSet.Width) || 400,
            Number(windowSet.Height) || 75
        );
        super.initialize(rect);
        if (this._windowSet.WindowSet) {
            this.processInitParam(this._windowSet.WindowSet);
            this.refresh();
        }
    }

    maxCols() {
        return Number(this._windowSet.MaxCols) || 4;
    }

    makeCommandList() {
        this.addCommand("全部", "all");
        const cats = WSQ.Param.ACH.categoryConfig || [];
        cats.forEach(c => {
            if (c.id && c.id !== "all") {
                this.addCommand(c.name || c.id, c.id);
            }
        });
    }

    categoryId() {
        return this.currentSymbol() || 'all';
    }

    setListWindow(listWindow) {
        this._listWindow = listWindow;
    }

    updateHelp() {
        if (this._listWindow) {
            this._listWindow.setCategory(this.categoryId());
        }
    }

    callUpdateHelp() {
        this.updateHelp();
    }
}

// ----------------------------------------------------------------------------
// 成就列表窗口（两行布局：图标+名称 / 描述+奖励右对齐）
// ----------------------------------------------------------------------------
class Window_AchievementList extends Window_Selectable {
    initialize(windowSet) {
        this._windowSet = windowSet;
        this._category = "all";
        const rect = new Rectangle(
            Number(windowSet.X) || 0,
            Number(windowSet.Y) || 0,
            Number(windowSet.Width) || 400,
            Number(windowSet.Height) || 300
        );
        super.initialize(rect);
        if (this._windowSet.WindowSet) {
            this.processInitParam(this._windowSet.WindowSet);
        }
        this.refresh();
        this.select(0);
    }

    maxCols() {
        return Number(this._windowSet.MaxCols) || 1;
    }

    // 每项两行：图标+名称一行，描述+奖励一行（含上下内边距，确保不超出不重叠）
    itemHeight() {
        const lh = this.lineHeight();
        const rowSpace = Number(this._windowSet.RowSpace) || 5;
        const pad = this.itemPadding();
        return lh * 2 + rowSpace + pad * 2;
    }

    setCategory(symbol) {
        if (this._category === symbol) return;
        this._category = symbol;
        this.refresh();
        this.select(0);
    }

    makeItemList() {
        const cat = this._category;
        const stats = $gameSystem ? $gameSystem._achievementStats : {};
        this._data = (WSQ.Param.ACH.achievementConfig || []).filter(rule => {
            // 隐藏成就未达成不显示
            if (rule.hidden && !$gameSystem.isAchievementGranted(rule.ruleName)) return false;
            // 分类过滤
            if (cat === "all") return true;
            return rule.category === cat;
        });
    }

    maxItems() {
        return this._data ? this._data.length : 0;
    }

    itemAt(index) {
        return this._data ? this._data[index] : null;
    }

    refresh() {
        this.makeItemList();
        super.refresh();
    }

    drawItem(index) {
        const rule = this.itemAt(index);
        if (!rule) return;
        const rect = this.itemRect(index);
        const granted = $gameSystem.isAchievementGranted(rule.ruleName);
        const lh = this.lineHeight();
        const pad = this.itemPadding();
        const rowSpace = Number(this._windowSet.RowSpace) || 5;
        const innerX = rect.x + pad;
        const innerY = rect.y + pad;
        const innerW = rect.width - pad * 2;

        // 第一行：图标 + 名称（左）+ 进度/已完成（右对齐）
        const iconW = ImageManager.iconWidth;
        const iconH = ImageManager.iconHeight;
        const iconY = innerY + Math.floor((lh - iconH) / 2);
        const iconIndex = Number(rule.iconIndex) || 0;
        let nameX = innerX;
        if (iconIndex > 0) {
            this.drawIcon(iconIndex, innerX, iconY, iconW, iconH);
            nameX = innerX + iconW + 4;
        }
        const name = String(rule.achievementName || rule.ruleName || "");
        // 进度文本：达成显示"已完成！"，否则显示 current/target
        const statsForProgress = $gameSystem._achievementStats;
        let progressText = "";
        let progressColorNum = 0;
        if (granted) {
            progressText = "已完成！";
            progressColorNum = Number(WSQ.Param.ACH.completedColor);
            if (!Number.isFinite(progressColorNum)) progressColorNum = 3;
        } else {
            progressText = WSQ.ACH.buildProgressText(rule, statsForProgress);
            progressColorNum = Number(WSQ.Param.ACH.progressColor);
            if (!Number.isFinite(progressColorNum)) progressColorNum = 0;
        }
        const progressFullText = progressText ? `\\C[${progressColorNum}]${progressText}\\C[0]` : "";
        const progressW = progressFullText ? this.textWidthEx(progressFullText) + 16 : 0;
        const nameOffset = nameX - innerX;
        const nameW = innerW - nameOffset - progressW;

        this.changePaintOpacity(granted);
        this.resetTextColor();
        if (!granted) {
            this.changeTextColor(ColorManager.normalColor());
            this.changePaintOpacity(false);
        } else {
            this.changeTextColor(ColorManager.crisisColor());
        }
        this.drawTextEx(name, nameX, innerY, nameW);
        this.changePaintOpacity(true);
        // 进度右对齐：区域起点 = nameX + nameW，宽度 = progressW
        if (progressFullText) {
            this.changePaintOpacity(true);
            this.resetTextColor();
            this.drawTextEx(progressFullText, nameX + nameW, innerY, progressW, "right");
        }

        // 第二行：描述（左）+ 奖励摘要（右对齐）
        const descY = innerY + lh + rowSpace;
        const stats = $gameSystem._achievementStats;
        const summary = String(WSQ.ACH.buildRewardSummary(rule, stats) || "");
        const summaryW = this.textWidthEx(summary);
        const reserveW = Math.min(innerW * 0.55, Math.max(summaryW + 12, 0));
        const descW = innerW - reserveW;

        this.changePaintOpacity(granted);
        const desc = String(rule.desc || "");
        if (desc) {
            this.drawTextEx(desc, innerX, descY, descW);
        }
        // 奖励右对齐：右侧区域起点 = innerX + descW，宽度 = reserveW，GF 原生 align="right"
        if (summary) {
            this.changePaintOpacity(true);
            this.resetTextColor();
            this.drawTextEx(summary, innerX + descW, descY, reserveW, "right");
        }
        this.changePaintOpacity(true);
    }

    isEnabled(item) {
        if (!item) return false;
        const granted = $gameSystem.isAchievementGranted(item.ruleName);
        if (item.hidden && !granted) return false;
        return true;
    }

    isCurrentItemEnabled() {
        return this.isEnabled(this.itemAt(this.index()));
    }
}

// ----------------------------------------------------------------------------
// 按钮式分类精灵（按钮模式）
// ----------------------------------------------------------------------------
class Sprite_AchievementCategory extends Sprite_CommandWindow {
    initialize() {
        const btnSet = WSQ.Param.ACH.CategoryButtonSet;
        // 构建贴图覆盖查找表
        this._bitmapOverrides = {};
        const overrideList = WSQ.Param.ACH.CategoryButtonList || [];
        for (let i = 0; i < overrideList.length; i++) {
            const entry = overrideList[i];
            if (entry && entry.Symbol) {
                this._bitmapOverrides[entry.Symbol] = entry.Bitmap || '';
            }
        }
        const data = JsonEx.makeDeepCopy(GF.COSU.SpriteButtonSetList[btnSet.ButtonSetStyle] || {});
        data.x = btnSet.ButtonSetX;
        data.y = btnSet.ButtonSetY;
        data.btn_src_default = btnSet.ButtonSetBitmap;
        data.btn_bitmap_num = btnSet.ButtonBitmapNum;
        data['back_bitmap'] = btnSet.ButtonBackBitmap;
        data.btn_paramList = this._bitmapOverrides;
        super.initialize(data);
        this._index = 0;
    }

    extractBtnParamList(bitmapOverrides) {
        const paramList = [];
        // "全部"分类
        const allParam = {
            symbol: 'all',
            bitmap: (bitmapOverrides && bitmapOverrides['all']) || '',
            name: '全部',
            enable: true,
            ext: null
        };
        paramList.push(allParam);
        // 自定义分类
        const cats = WSQ.Param.ACH.categoryConfig || [];
        for (let i = 0; i < cats.length; i++) {
            const cat = cats[i];
            if (!cat.id || cat.id === 'all') continue;
            const param = {
                symbol: cat.id,
                bitmap: (bitmapOverrides && bitmapOverrides[cat.id]) || '',
                name: cat.name || cat.id,
                enable: true,
                ext: null
            };
            paramList.push(param);
        }
        return paramList;
    }

    categoryId() {
        return this.currentSymbol() || 'all';
    }

    currentCategoryId() {
        return this.categoryId();
    }

    // --- 兼容 Window 接口 ---
    resetInitParamData() {}

    createNameSprite() {}
    refreshNameSprite() {}
    canSelectAndOk() { return true; }
    canExCusorMove() { return true; }
    canHandling() { return true; }

    update() {
        if (!this._commands || this._commands.length === 0) {
            this._index = -1;
        }
        if (typeof Sprite_CommandWindow.prototype.update === 'function') {
            Sprite_CommandWindow.prototype.update.call(this);
        }
    }
}

// ============================================================================
// 插件指令
// ============================================================================
PluginManager.registerCommand(WSQ.ACH.pluginName, "RecordStat", args => {
    const key = WSQ.ACH.parseEscapeCharacters(args.Key);
    const value = WSQ.ACH.parseArg(args.Value);
    const cover = WSQ.ACH.parseArg(args.Cover);
    if (!key) {
        WSQ.ACH.pop("统计键名不能为空！");
        return;
    }
    $gameSystem.recordAchievementStat(key, value, cover);
});

PluginManager.registerCommand(WSQ.ACH.pluginName, "ShowAchievements", () => {
    SceneManager.push(Scene_Achievement);
});

PluginManager.registerCommand(WSQ.ACH.pluginName, "CheckAchievement", args => {
    const name = WSQ.ACH.parseEscapeCharacters(args.Name);
    $gameSystem.checkAchievementsForName(name);
});
