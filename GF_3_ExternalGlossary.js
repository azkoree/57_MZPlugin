//=============================================================================
// GF Plugins
// GF_3_ExternalGlossary.js
//=============================================================================

var Imported = Imported || {};
Imported.GF_3_ExternalGlossary = true;

var GF = GF || {};
GF.GGM = GF.GGM || {};
GF.GGM.version = 1.02;
GF.GGM.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.02]        玩法 - 用语词典
 * @author 57拷打ai写
 * @url 
 * @orderAfter GF_1_CoreOfWindowUI
 * @base GF_1_CoreOfWindowUI
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 * 
 * 用语词典插件是RPG游戏中的重要辅助功能，帮助玩家查阅游戏中的各种术语、
 * 角色、怪物、物品、世界观设定等信息。主要提供以下功能：
 * 
 *     多种词典类别
 *     外部 JSON 数据
 *     分类管理
 *     多页面图文内容
 *     图片显示
 *     收集率统计
 *     条目解锁机制
 *     动态文本（控制字符）
 *     快捷跳转
 *
 * ============================================================================
 *  前置需求
 * ============================================================================
 *
 * 这个插件只能在RPGMakerMZ上运行。
 *
 * ---- 前置插件列表 ----
 *
 * GF_1_CoreOfWindowUI        系统 - 窗口UI核心
 *
 * ---- 可选前置插件 ----
 *
 * GF_1_CoreOfSpriteUI        系统 - 精灵核心
 *
 *     如果插件参数「分类显示模式」设置为"按钮"，则必须加载此插件以使用
 *     精灵按钮组功能。设置为"窗口"（默认）则不需要此插件。
 *
 * ---- 第3层 ----
 *
 * 这个插件是第3层插件，必须放在第0，1，2层下面，所有4，5层GF插件的上面。
 * 
 * 本插件是GF系列的扩展插件。GF插件需加群获得，请！qq群 568785370 ，谢谢
 *
 * ============================================================================
 *  兼容性
 * ============================================================================
 *
 * ---- 可扩展插件列表 ----
 *
 * GF_2_CoreOfMainMenu        系统 - 主菜单核心
 *
 *     可以在主菜单设置进入用语词典菜单的按钮
 *     关键字：glossary
 *     按钮名称：return '图鉴';
 *     是否显示按钮：return Imported.GF_3_ExternalGlossary;
 *     是否允许激活按钮：return true;
 *     按钮激活后效果：运行代码
 *     按钮激活运行代码：SceneManager.push(Scene_GFGlossary);
 *
 * ============================================================================
 *  数据文件介绍
 * ============================================================================
 *
 * 所有词典数据保存在外部 JSON 文件中，文件路径在插件参数「词典文件列表」
 * 中配置。每个 JSON 文件对应一个独立的词典。
 *
 * JSON 文件路径示例：
 *     dataEx/Glossary/monsters.json      怪物图鉴
 *     dataEx/Glossary/characters.json    角色图鉴
 *
 * JSON 数据结构参见帮助文档后续章节。
 *
 * ============================================================================
 *  插件指令
 * ============================================================================
 *
 *     打开词典菜单
 *     打开指定词典
 *     解锁词典条目
 *     锁定词典条目
 *     全部解锁
 *     全部锁定
 *     标记条目已查看
 *     重置新条目标记
 *     刷新词典数据
 *
 * ============================================================================
 *  脚本
 * ============================================================================
 * 
 *     GlossaryManager.open(type);
 *         - 打开指定类型的词典界面
 * 
 *     GlossaryManager.openWithCategory(type, categoryId);
 *         - 打开词典并选中指定分类
 * 
 *     GlossaryManager.openWithEntry(type, categoryId, entryId);
 *         - 打开词典并跳转到指定条目
 * 
 *     GlossaryManager.isUnlocked(type, entryId);
 *         - 是否已解锁指定条目，返回 true/false
 * 
 *     GlossaryManager.setUnlocked(type, entryId, unlocked);
 *         - 设置条目的解锁状态
 * 
 *     GlossaryManager.unlockAll(type);
 *         - 解锁指定词典的所有条目
 * 
 *     GlossaryManager.lockAll(type);
 *         - 锁定指定词典的所有条目
 * 
 *     GlossaryManager.isSeen(type, entryId);
 *         - 是否已查看指定条目
 * 
 *     GlossaryManager.markAsSeen(type, entryId);
 *         - 标记条目为已查看
 * 
 *     GlossaryManager.resetNewFlags(type);
 *         - 重置所有条目的新标记
 * 
 *     GlossaryManager.getGlossaryTypes();
 *         - 获取所有加载的词典类型编号数组
 * 
 *     GlossaryManager.getEntryCount(type, categoryId);
 *         - 获取指定分类的条目总数
 * 
 *     GlossaryManager.getUnlockedCount(type, categoryId);
 *         - 获取指定分类的已解锁条目数
 * 
 *     GlossaryManager.getCompleteRate(type, categoryId);
 *         - 获取指定分类的收集率（0-100）
 * 
 *     GlossaryManager.entryList(type, categoryId);
 *         - 获取指定分类的条目列表（按 order 排序）
 * 
 *     GlossaryManager.reloadData();
 *         - 重新扫描加载所有 JSON 文件
 *
 * ============================================================================
 *  词典数据 JSON 格式
 * ============================================================================
 *
 * 每个 JSON 文件对应一个词典，结构如下：
 *
 * {
 *   "glossaryType": 1,           // 词典类型编号（唯一）
 *   "commandName": "怪物图鉴",   // 菜单显示名称
 *   "useCategory": true,         // 是否启用分类
 *   "commandSwitchId": 0,        // 菜单出现条件开关
 *   "backPicture": "",           // 背景图片
 *   "backPictureOpacity": 180,   // 背景透明度 0-255
 *   "glossaryHelp": "...",       // 列表帮助文本
 *   "categoryHelp": "...",       // 分类帮助文本
 *   "categories": [              // 分类列表
 *     {
 *       "id": "field",
 *       "name": "原野怪物",
 *       "iconIndex": 123,
 *       "order": 1,
 *       "condition": { "switchId": 0, "script": "" }
 *     }
 *   ],
 *   "entries": [                // 条目列表
 *     {
 *       "id": 1,
 *       "name": "史莱姆",
 *       "iconIndex": 136,
 *       "color": "#4a90e2",
 *       "categoryId": "field",
 *       "order": 1,
 *       "unlockCondition": {
 *         "type": "switch",
 *         "switchId": 5,
 *         "variableId": 0,
 *         "variableValue": 1,
 *         "script": "",
 *         "notifySwitchId": 0,
 *         "notifyVariableId": 0
 *       },
 *       "seenCondition": {
 *         "switchId": 10,
 *         "setWhenOpened": true
 *       },
 *       "textColorSwitch": {
 *         "switchId": 5,
 *         "color": 10
 *       },
 *       "noCollect": false,
 *       "noPageNumber": false,
 *       "pages": [
 *         {
 *           "pageIndex": 1,
 *           "description": "最常见的魔物…",
 *           "picture": "slime",
 *           "picturePosition": "top",
 *           "pictureAlign": "center",
 *           "picturePriority": "top",
 *           "pictureScale": 1.0,
 *           "pictureX": 0,
 *           "pictureY": 0,
 *           "textPosition": 0,
 *           "enemyId": 0,
 *           "showSwitchId": 0,
 *           "extraPictures": [
 *             { "filename": "slime_icon", "x": 10, "y": 200 }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * ============================================================================
 *  支持的控制字符
 * ============================================================================
 *
 * 在 description 中可以使用以下控制字符：
 *
 *     \mhp[n]     敌人 n 的最大 HP
 *     \mmp[n]     敌人 n 的最大 MP
 *     \atk[n]     敌人 n 的攻击力
 *     \def[n]     敌人 n 的防御力
 *     \mag[n]     敌人 n 的魔法力
 *     \mdf[n]     敌人 n 的魔法防御
 *     \agi[n]     敌人 n 的敏捷性
 *     \luk[n]     敌人 n 的运气
 *     \exp[n]     敌人 n 的获得经验值
 *     \money[n]   敌人 n 的获得金币
 *     \drop[n]    敌人 n 的掉落物品名称
 *     \v[n]       变量 n 的当前值
 *     \s[n]       开关 n 的状态文本（ON/OFF）
 *     \data[prop] 关联数据的属性
 *     \script{code} 执行脚本 code 并替换为返回值
 *
 * ============================================================================
 *  更新日志
 * ============================================================================
 * 
 * [v1.02] 阅读弹窗退出动画改用 GF 窗口核心的收起动画（倒放窗口移动/透明度动画），
 *         移除退出延迟(帧)、退出动画效果两个参数；退出动画时长由阅读弹窗窗口设置
 *         （ReadingPopupWindowSet）中的移动时间（WindowMoving.MoveTime）决定。
 * [v1.01] 阅读弹窗新增退出延迟和过渡动画效果参数（退出延迟(帧)、退出动画效果）。
 * [v1.00] 初始版本。
 *
 * ============================================================================
 *  帮助结束
 * ============================================================================
 *
 * @ ==========================================================================
 * @ 插件指令
 * @ ==========================================================================
 *
 * @command OpenGlossaryMenu
 * @text 打开词典菜单
 * @desc 打开词典主界面
 *
 * @ --------------------------------------------------------------------------
 *
 * @command OpenGlossaryType
 * @text 打开指定词典
 * @desc 打开指定类型的词典
 *
 * @arg TypeId
 * @text 词典类型ID
 * @type number
 * @min 1
 * @desc 词典类型编号
 * @default 1
 *
 * @arg CategoryId
 * @text 分类ID
 * @desc 要选中的分类ID（留空则不选中分类）
 * @default 
 *
 * @arg EntryId
 * @text 条目ID
 * @type number
 * @min 0
 * @desc 要跳转到的条目ID（0=不跳转）
 * @default 0
 *
 * @ --------------------------------------------------------------------------
 *
 * @command UnlockEntry
 * @text 解锁词典条目
 * @desc 解锁指定条目
 *
 * @arg TypeId
 * @text 词典类型ID
 * @type number
 * @min 1
 * @desc 词典类型编号
 * @default 1
 *
 * @arg EntryId
 * @text 条目ID
 * @type number
 * @min 1
 * @desc 条目编号
 * @default 1
 *
 * @arg ShowPopup
 * @text 弹出阅读窗口
 * @type boolean
 * @on 弹出
 * @off 不弹出
 * @desc 解锁后是否弹出阅读窗口显示条目内容。仅在解锁时有效，不受插件参数默认设置的影响。
 * @default false
 *
 * @ --------------------------------------------------------------------------
 *
 * @command LockEntry
 * @text 锁定词典条目
 * @desc 锁定指定条目
 *
 * @arg TypeId
 * @text 词典类型ID
 * @type number
 * @min 1
 * @desc 词典类型编号
 * @default 1
 *
 * @arg EntryId
 * @text 条目ID
 * @type number
 * @min 1
 * @desc 条目编号
 * @default 1
 *
 * @ --------------------------------------------------------------------------
 *
 * @command UnlockAll
 * @text 全部解锁
 * @desc 解锁指定词典的所有条目
 *
 * @arg TypeId
 * @text 词典类型ID
 * @type number
 * @min 1
 * @desc 词典类型编号
 * @default 1
 *
 * @ --------------------------------------------------------------------------
 *
 * @command LockAll
 * @text 全部锁定
 * @desc 锁定指定词典的所有条目
 *
 * @arg TypeId
 * @text 词典类型ID
 * @type number
 * @min 1
 * @desc 词典类型编号
 * @default 1
 *
 * @ --------------------------------------------------------------------------
 *
 * @command MarkSeen
 * @text 标记条目已查看
 * @desc 将条目标记为已查看
 *
 * @arg TypeId
 * @text 词典类型ID
 * @type number
 * @min 1
 * @desc 词典类型编号
 * @default 1
 *
 * @arg EntryId
 * @text 条目ID
 * @type number
 * @min 1
 * @desc 条目编号
 * @default 1
 *
 * @ --------------------------------------------------------------------------
 *
 * @command ResetNewFlags
 * @text 重置新条目标记
 * @desc 重置所有新条目的标记
 *
 * @arg TypeId
 * @text 词典类型ID
 * @type number
 * @min 1
 * @desc 词典类型编号
 * @default 1
 *
 * @ --------------------------------------------------------------------------
 *
 * @command RefreshGlossaryData
 * @text 刷新词典数据
 * @desc 重新扫描并加载 JSON 文件
 *
 * @ --------------------------------------------------------------------------
 *
 * @command SetGlossaryUnlockNotify
 * @text 词典解锁通知:设置模式
 * @desc 设置词典条目解锁时的通知推送模式
 *
 * @arg Mode
 * @text 通知模式
 * @type select
 * @option 全部推送
 * @value all
 * @option 仅自动解锁推送
 * @value auto
 * @option 仅手动解锁推送
 * @value manual
 * @option 不推送
 * @value none
 * @desc 词典条目解锁时是否推送通知。
 * @default all
 *
 * @ ==========================================================================
 * @ 插件参数
 * @ ==========================================================================
 *
 * @param GeneralSet
 * @text ====一般设置====
 *
 * @param GlossaryFileList
 * @text 词典文件列表
 * @parent GeneralSet
 * @type struct<GlossaryFile>[]
 * @desc 在此配置所有词典JSON文件的路径和标签。每个条目对应一个词典文件。
 * @default ["{\"name\":\"怪物图鉴\",\"file\":\"dataEx/Glossary/monsters.json\"}","{\"name\":\"角色图鉴\",\"file\":\"dataEx/Glossary/characters.json\"}"]
 *
 * @param FontSize
 * @text 字体大小
 * @parent GeneralSet
 * @type number
 * @min 10
 * @desc 词典界面的默认字体大小。
 * @default 22
 *
 * @param AutoResizePicture
 * @text 图片自动缩小
 * @parent GeneralSet
 * @type boolean
 * @on 自动缩小
 * @off 不缩小
 * @desc 图片是否自动适应窗口。
 * @default true
 *
 * @param PicturePosition
 * @text 图片显示位置
 * @parent GeneralSet
 * @type select
 * @option 上方
 * @value top
 * @option 下方
 * @value bottom
 * @option 文本末尾
 * @value text
 * @desc 图片默认显示位置（top/bottom/text）。
 * @default top
 *
 * @param PictureAlign
 * @text 图片对齐
 * @parent GeneralSet
 * @type select
 * @option 左对齐
 * @value left
 * @option 居中
 * @value center
 * @option 右对齐
 * @value right
 * @desc 图片默认对齐方式。
 * @default center
 *
 * @param PicturePriority
 * @text 图片优先度
 * @parent GeneralSet
 * @type select
 * @option 图片在上
 * @value top
 * @option 图片在下
 * @value bottom
 * @desc 图片默认显示优先级。
 * @default top
 *
 * @param FramelessDesign
 * @text 无边框设计
 * @parent GeneralSet
 * @type boolean
 * @on 隐藏窗口边框和背景
 * @off 显示边框
 * @desc 是否隐藏窗口边框和背景。
 * @default false
 *
 * @param NewEntryColor
 * @text 新条目颜色
 * @parent GeneralSet
 * @type number
 * @min 0
 * @max 31
 * @desc 新解锁未查看条目的文字颜色（系统颜色编号）。
 * @default 2
 *
 * @param DefaultTextColor
 * @text 默认文字颜色
 * @parent GeneralSet
 * @type number
 * @min 0
 * @max 31
 * @desc 已查看条目的文字颜色（系统颜色编号）。
 * @default 0
 *
 * @param PageWrap
 * @text 页面循环
 * @parent GeneralSet
 * @type boolean
 * @on 循环
 * @off 不循环
 * @desc 多页时到达末尾是否回到第一页。
 * @default true
 *
 * @param BottomHelp
 * @text 帮助最底部
 * @parent GeneralSet
 * @type boolean
 * @on 底端显示
 * @off 顶端显示
 * @desc 帮助窗口是否显示在最底部。
 * @default true
 *
 * @param ShowPageNumber
 * @text 页码显示
 * @parent GeneralSet
 * @type boolean
 * @on 显示
 * @off 隐藏
 * @desc 多页条目是否在底部显示页码。
 * @default true
 *
 * @param AutoLineWrap
 * @text 自动换行
 * @parent GeneralSet
 * @type boolean
 * @on 启用
 * @off 禁用
 * @desc 文本触碰到窗口边缘时是否自动换行。
 * @default true
 *
 * @param HideEmptyGlossary
 * @text 隐藏无解锁条目的词典
 * @parent GeneralSet
 * @type boolean
 * @on 隐藏
 * @off 始终显示
 * @desc 词典选择界面中，没有任何已解锁条目的词典自动隐藏不显示。
 * @default false
 *
 * @param HideEmptyCategory
 * @text 隐藏无解锁条目的分类
 * @parent GeneralSet
 * @type boolean
 * @on 隐藏
 * @off 始终显示
 * @desc 分类选择界面中，没有任何已解锁条目的分类自动隐藏不显示。
 * @default false
 *
 * @param CompleteMsgFormat
 * @text 收集率消息格式
 * @parent GeneralSet
 * @desc 收集率显示文本，%1 表示百分比。
 * @default 收集率 %1％
 *
 * @param CategoryMode
 * @text 分类显示模式
 * @parent GeneralSet
 * @type select
 * @option 窗口
 * @option 按钮
 * @desc 选择分类的显示方式。"窗口"使用传统窗口列表；"按钮"使用精灵核心的按钮组（需加载 GF_1_CoreOfSpriteUI）。
 * @default 窗口
 *
 * @param CategoryButtonSet
 * @text 分类按钮总体设置
 * @parent GeneralSet
 * @type struct<GlossaryCategoryButtonSet>
 * @desc 按钮模式下分类按钮组的总体设置（位置、样式、贴图）。
 * @default {"ButtonSetX":"0","ButtonSetY":"0","ButtonSetStyle":"1","ButtonBitmapNum":"1","ButtonBackBitmap":"","ButtonSetBitmap":""}
 *
 * @param CategoryButtonList
 * @text 分类按钮贴图覆盖
 * @parent GeneralSet
 * @type struct<GlossaryCategoryButtons>[]
 * @desc 【可选】为特定分类指定自定义按钮贴图。不配置则全部使用默认按钮贴图。
 *       分类按钮会自动从词典分类数据中检测可用分类生成。
 * @default []
 *
 * @param GlossaryListMode
 * @text 词典列表显示模式
 * @parent GeneralSet
 * @type select
 * @option 窗口
 * @option 按钮
 * @desc 选择词典选择列表的显示方式。"窗口"使用传统窗口列表；"按钮"使用精灵核心的按钮组（需加载 GF_1_CoreOfSpriteUI）。
 * @default 窗口
 *
 * @param GlossaryListButtonSet
 * @text 词典列表按钮总体设置
 * @parent GeneralSet
 * @type struct<GlossaryListButtonSet>
 * @desc 按钮模式下词典列表按钮组的总体设置（位置、样式、贴图）。
 * @default {"ButtonSetX":"0","ButtonSetY":"0","ButtonSetStyle":"1","ButtonBitmapNum":"1","ButtonBackBitmap":"","ButtonSetBitmap":""}
 *
 * @param GlossaryListButtonList
 * @text 词典列表按钮贴图覆盖
 * @parent GeneralSet
 * @type struct<GlossaryListButtons>[]
 * @desc 【可选】为特定词典指定自定义按钮贴图。不配置则全部使用默认按钮贴图。
 *       词典按钮会自动从已加载的词典类型中生成。
 * @default []
 *
 * @param TextSet
 * @text ====用语设置====
 *
 * @param OngoingText
 * @text 进行中用语
 * @parent TextSet
 * @desc 条目已解锁时的标签文本。
 * @default 已解锁
 *
 * @param LockedText
 * @text 未解锁用语
 * @parent TextSet
 * @desc 条目未解锁时显示的文本。
 * @default ???
 *
 * @param SeenText
 * @text 已查看用语
 * @parent TextSet
 * @desc 已查看标记文本。
 * @default 已读
 *
 * @param NewText
 * @text 新条目用语
 * @parent TextSet
 * @desc 新条目标记文本。
 * @default New!
 *
 * @param CompleteText
 * @text 收集完成用语
 * @parent TextSet
 * @desc 100% 收集时显示的文本。
 * @default 已收集全
 *
 * @param UnknownIcon
 * @text 未知条目图标
 * @parent TextSet
 * @type number
 * @min 0
 * @desc 未解锁时显示的图标索引（0=不显示）。
 * @default 0
 *
 * @param HideListSingleGlossary
 * @text 单词典时隐藏列表
 * @parent TextSet
 * @type boolean
 * @on 隐藏
 * @off 显示
 * @desc 只有一个词典时是否隐藏词典选择列表。
 * @default true
 *
 * @param CompleteDisplay
 * @text 收集率显示方式
 * @parent TextSet
 * @type select
 * @option 显示分类细分
 * @value category
 * @option 只显示总体收集率
 * @value overall
 * @option 不显示
 * @value none
 * @desc 收集率窗口的显示方式。
 * @default overall
 *
 * @param NotifySet
 * @text ====词典解锁通知====
 *
 * @param GlossaryUnlockNotifyMode
 * @text 解锁通知模式
 * @parent NotifySet
 * @type select
 * @option 全部推送
 * @value all
 * @option 仅自动解锁推送
 * @value auto
 * @option 仅手动解锁推送
 * @value manual
 * @option 不推送
 * @value none
 * @desc 词典条目解锁时是否推送通知，自动解锁指满足条件自动解锁，手动解锁指通过插件指令或脚本解锁。
 * @default all
 *
 * @param GlossaryUnlockFmt
 * @text 解锁通知格式
 * @parent NotifySet
 * @desc 解锁通知的文本格式，%1为词典名称，%2为条目名称。（注意：需要开启推送插件才能显示）
 * @default \\c[24]图鉴解锁\\c[0] %2
 *
 * @param GlossaryUnlockStyleId
 * @text 解锁通知样式ID
 * @parent NotifySet
 * @type number
 * @min 0
 * @desc 使用的信息推送样式ID，0为使用当前默认样式。（需要推送插件支持）
 * @default 0
 *
 * @param DialogueAutoUnlockSet
 * @text ====对话自动解锁====
 *
 * @param DialogueAutoUnlock
 * @text 对话自动解锁
 * @parent DialogueAutoUnlockSet
 * @type boolean
 * @on 开启
 * @off 关闭
 * @desc 对话文本中出现条目标题时自动解锁该条目。
 * @default true
 *
 * @param DialogueAutoUnlockSwitchId
 * @text 条件开关
 * @parent DialogueAutoUnlockSet
 * @type number
 * @min 0
 * @desc 只有此开关开启时才触发自动解锁。0为无条件。
 * @default 0
 *
 * @param ReadingPopupSet
 * @text ====阅读弹窗设置====
 *
 * @param EnableReadingPopup
 * @text 启用阅读弹窗
 * @parent ReadingPopupSet
 * @type boolean
 * @on 启用
 * @off 禁用
 * @desc 启用后，解锁条目时弹出阅读窗口模拟发现阅读物的过程。对话自动解锁时是否弹出受此参数控制。
 * @default false
 *
 * @param ReadingPopupWindowSet
 * @text 阅读弹窗设置
 * @parent ReadingPopupSet
 * @type struct<GlossaryWindowSet>
 * @desc 阅读弹窗的窗口设置（位置、大小、字体、动画、背景）。
 *       退出时窗口会倒放该移动/透明度动画作为收起效果（GF 窗口核心收起动画），
 *       收起动画时长由窗口移动时间（WindowMoving.MoveTime）决定。
 * @default {"WindowX":"200","WindowY":"100","WindowWidth":"880","WindowHeight":"520","WindowFontSize":"22","WindowFontFace":"","WindowLineHeight":"36","WindowMoving":"{\"MoveType\":\"不移动\",\"MoveTime\":\"20\",\"MoveDelay\":\"0\",\"OpacityLock\":\"false\",\"StartPoint\":\"\",\"CoordinateType\":\"相对坐标\",\"SlideX\":\"0\",\"SlideY\":\"0\",\"SlideAbsoluteX\":\"0\",\"SlideAbsoluteY\":\"0\"}","WindowLayout":"{\"LayoutType\":\"默认皮肤\",\"Background\":\"\",\"BackgroundFile\":\"\",\"BackgroundX\":\"0\",\"BackgroundY\":\"0\"}"}
 *
 * @param MenuSet
 * @text ====词典菜单设置====
 *
 * @param MainLayoutFile
 * @text 资源-整体布局
 * @parent MenuSet
 * @type file
 * @dir img/
 * @require 1
 * @desc 词典界面的整体布局背景图。
 * @default 
 *
 * @param PopDelay
 * @text 菜单退出延迟
 * @parent MenuSet
 * @type number
 * @desc 退出该菜单时的延迟，用于播放退出动画，为0则不播放。
 * @default 20
 *
 * @param HelpWindowSet
 * @text 帮助窗口设置
 * @parent MenuSet
 * @type struct<GlossaryWindowSet>
 * @desc 窗口设置。
 * @default {"WindowX":"59","WindowY":"668","WindowWidth":"1248","WindowHeight":"74","WindowFontSize":"20","WindowFontFace":"","WindowLineHeight":"36","WindowMoving":"{\"MoveType\":\"匀速移动\",\"MoveTime\":\"20\",\"MoveDelay\":\"0\",\"OpacityLock\":\"false\",\"StartPoint\":\"\",\"CoordinateType\":\"相对坐标\",\"SlideX\":\"0\",\"SlideY\":\"80\",\"SlideAbsoluteX\":\"0\",\"SlideAbsoluteY\":\"0\"}","WindowLayout":"{\"LayoutType\":\"默认皮肤\",\"Background\":\"\",\"BackgroundFile\":\"\",\"BackgroundX\":\"0\",\"BackgroundY\":\"0\"}"}
 *
 * @param GlossaryListWindowSet
 * @text 词典列表窗口设置
 * @parent MenuSet
 * @type struct<GlossaryWindowSet>
 * @desc 窗口设置。
 * @default {"WindowX":"59","WindowY":"92","WindowWidth":"240","WindowHeight":"576","WindowFontSize":"22","WindowFontFace":"","WindowLineHeight":"36","WindowMoving":"{\"MoveType\":\"匀速移动\",\"MoveTime\":\"20\",\"MoveDelay\":\"0\",\"OpacityLock\":\"false\",\"StartPoint\":\"\",\"CoordinateType\":\"相对坐标\",\"SlideX\":\"-80\",\"SlideY\":\"0\",\"SlideAbsoluteX\":\"0\",\"SlideAbsoluteY\":\"0\"}","WindowLayout":"{\"LayoutType\":\"默认皮肤\",\"Background\":\"\",\"BackgroundFile\":\"\",\"BackgroundX\":\"0\",\"BackgroundY\":\"0\"}"}
 *
 * @param CategoryWindowSet
 * @text 分类窗口设置
 * @parent MenuSet
 * @type struct<GlossaryWindowSet>
 * @desc 窗口设置。
 * @default {"WindowX":"59","WindowY":"92","WindowWidth":"1248","WindowHeight":"61","WindowFontSize":"22","WindowFontFace":"","WindowLineHeight":"36","WindowMoving":"{\"MoveType\":\"匀速移动\",\"MoveTime\":\"20\",\"MoveDelay\":\"0\",\"OpacityLock\":\"false\",\"StartPoint\":\"\",\"CoordinateType\":\"相对坐标\",\"SlideX\":\"-80\",\"SlideY\":\"0\",\"SlideAbsoluteX\":\"0\",\"SlideAbsoluteY\":\"0\"}","WindowLayout":"{\"LayoutType\":\"默认皮肤\",\"Background\":\"\",\"BackgroundFile\":\"\",\"BackgroundX\":\"0\",\"BackgroundY\":\"0\"}"}
 *
 * @param EntryListWindowSet
 * @text 条目列表窗口设置
 * @parent MenuSet
 * @type struct<GlossaryWindowSet>
 * @desc 窗口设置。
 * @default {"WindowX":"59","WindowY":"153","WindowWidth":"229","WindowHeight":"443","WindowFontSize":"22","WindowFontFace":"","WindowLineHeight":"36","WindowMoving":"{\"MoveType\":\"匀速移动\",\"MoveTime\":\"20\",\"MoveDelay\":\"0\",\"OpacityLock\":\"false\",\"StartPoint\":\"\",\"CoordinateType\":\"相对坐标\",\"SlideX\":\"-80\",\"SlideY\":\"0\",\"SlideAbsoluteX\":\"0\",\"SlideAbsoluteY\":\"0\"}","WindowLayout":"{\"LayoutType\":\"默认皮肤\",\"Background\":\"\",\"BackgroundFile\":\"\",\"BackgroundX\":\"0\",\"BackgroundY\":\"0\"}"}
 *
 * @param ContentWindowSet
 * @text 内容窗口设置
 * @parent MenuSet
 * @type struct<GlossaryWindowSet>
 * @desc 窗口设置。
 * @default {"WindowX":"288","WindowY":"153","WindowWidth":"1019","WindowHeight":"515","WindowFontSize":"22","WindowFontFace":"","WindowLineHeight":"36","WindowMoving":"{\"MoveType\":\"匀速移动\",\"MoveTime\":\"20\",\"MoveDelay\":\"0\",\"OpacityLock\":\"false\",\"StartPoint\":\"\",\"CoordinateType\":\"相对坐标\",\"SlideX\":\"80\",\"SlideY\":\"0\",\"SlideAbsoluteX\":\"0\",\"SlideAbsoluteY\":\"0\"}","WindowLayout":"{\"LayoutType\":\"默认皮肤\",\"Background\":\"\",\"BackgroundFile\":\"\",\"BackgroundX\":\"0\",\"BackgroundY\":\"0\"}"}
 *
 * @param CompleteWindowSet
 * @text 收集率窗口设置
 * @parent MenuSet
 * @type struct<GlossaryWindowSet>
 * @desc 窗口设置。
 * @default {"WindowX":"59","WindowY":"596","WindowWidth":"229","WindowHeight":"72","WindowFontSize":"18","WindowFontFace":"","WindowLineHeight":"30","WindowMoving":"{\"MoveType\":\"匀速移动\",\"MoveTime\":\"20\",\"MoveDelay\":\"0\",\"OpacityLock\":\"false\",\"StartPoint\":\"\",\"CoordinateType\":\"相对坐标\",\"SlideX\":\"-80\",\"SlideY\":\"0\",\"SlideAbsoluteX\":\"0\",\"SlideAbsoluteY\":\"0\"}","WindowLayout":"{\"LayoutType\":\"默认皮肤\",\"Background\":\"\",\"BackgroundFile\":\"\",\"BackgroundX\":\"0\",\"BackgroundY\":\"0\"}"}
 *
 */
/* ---------------------------------------------------------------------------
 * struct<GlossaryFile>
 * ---------------------------------------------------------------------------
 */
/*~struct~GlossaryFile:
 *
 * @param name
 * @text 词典标签
 * @desc 用于在插件参数中标识此文件的标签，不实际影响游戏。
 * @default 怪物图鉴
 *
 * @param file
 * @text 文件路径
 * @desc 词典JSON文件的路径，相对于游戏根目录。
 * @default dataEx/Glossary/monsters.json
 *
 */
/* ---------------------------------------------------------------------------
 * struct<GlossaryWindowSet>
 * ---------------------------------------------------------------------------
 */
/*~struct~GlossaryWindowSet:
 *
 * @param WindowX
 * @text 窗口X坐标
 * @desc 窗口的位置。x轴方向平移，单位像素。0为贴在最左边。
 * @default 250
 *
 * @param WindowY
 * @text 窗口Y坐标
 * @desc 窗口的位置。y轴方向平移，单位像素。0为贴在最上面。
 * @default 66
 *
 * @param WindowWidth
 * @text 窗口宽度
 * @type number
 * @min 50
 * @desc 窗口规划的矩形区域宽度。
 * @default 370
 *
 * @param WindowHeight
 * @text 窗口高度
 * @type number
 * @min 50
 * @desc 窗口规划的矩形区域高度。
 * @default 340
 *
 * @param WindowFontSize
 * @text 窗口字体大小
 * @type number
 * @min 1
 * @desc 窗口的字体大小。
 * @default 22
 *
 * @param WindowFontFace
 * @text 窗口字体名称
 * @desc 窗口字体名称，必须填文本核心>>额外字体加载设置中的字体名称。
 * @default 
 *
 * @param WindowLineHeight
 * @text 窗口行高
 * @type number
 * @min 1
 * @desc 窗口行高。
 * @default 36
 *
 * @param WindowCols
 * @text 窗口列数
 * @type number
 * @min 1
 * @desc 窗口可显示的列数（0 表示使用默认值 1）。
 * @default 0
 *
 * @param WindowRows
 * @text 窗口行数
 * @type number
 * @min 1
 * @desc 窗口可显示的行数（0 表示由行高自动计算）。
 * @default 0
 *
 * @param WindowMoving
 * @text 窗口移动动画
 * @type struct<WindowMoving>
 * @desc 窗口会从某个点跑回自己的原位置。
 * @default {"MoveType":"匀速移动","MoveTime":"20","MoveDelay":"0","OpacityLock":"false","StartPoint":"","CoordinateType":"相对坐标","SlideX":"-80","SlideY":"0","SlideAbsoluteX":"0","SlideAbsoluteY":"0"}
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
 * ---------------------------------------------------------------------------
 */
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
 * @desc 锁定透明度后在运动过程中透明度不变，否则会从0开始变化。
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
 * @default 100
 * 
 * @param SlideY
 * @text 起点-相对坐标Y
 * @parent StartPoint
 * @desc 相对坐标以原位置为基准，负数向上，正数向下，单位像素。
 * @default 0
 *
 * @param SlideAbsoluteX
 * @text 起点-绝对坐标X
 * @parent StartPoint
 * @desc 绝对坐标位置，单位像素。
 * @default 0
 * 
 * @param SlideAbsoluteY
 * @text 起点-绝对坐标Y
 * @parent StartPoint
 * @desc 绝对坐标位置，单位像素。
 * @default 0
 *
 */
/* ---------------------------------------------------------------------------
 * struct<WindowLayout>
 * ---------------------------------------------------------------------------
 */
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
 * struct<GlossaryCategoryButtonSet>
 * ---------------------------------------------------------------------------
 */
/*~struct~GlossaryCategoryButtonSet:
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
 * struct<GlossaryCategoryButtons>
 * ---------------------------------------------------------------------------
 */
/*~struct~GlossaryCategoryButtons:
 *
 * @param Note
 * @text 标签
 * @desc 只用于方便区分查看的标签，不作用在插件中。
 * @default --新的分类按钮--
 *
 * @param Symbol
 * @text 关键字
 * @desc 分类标识，对应词典数据中的分类ID（如自定义分类ID，或自动分类标识）。
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
/* ---------------------------------------------------------------------------
 * struct<GlossaryListButtonSet>
 * ---------------------------------------------------------------------------
 */
/*~struct~GlossaryListButtonSet:
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
 * struct<GlossaryListButtons>
 * ---------------------------------------------------------------------------
 */
/*~struct~GlossaryListButtons:
 *
 * @param Note
 * @text 标签
 * @desc 只用于方便区分查看的标签，不作用在插件中。
 * @default --新的词典按钮--
 *
 * @param Symbol
 * @text 关键字
 * @desc 词典类型编号（字符串形式，如 "1"、"2"）。
 * @default 1
 *
 * @param Bitmap
 * @text 按钮贴图
 * @type file
 * @require 1
 * @dir img/
 * @desc 该词典的自定义按钮贴图。不填则使用默认按钮贴图。
 * @default
 *
 */

//=============================================================================
// 插件代码
//=============================================================================

(() => {
    //=========================================================================
    // 参数解析
    //=========================================================================

    GF.Parameters = PluginManager.parameters(GF.GGM.pluginName);
    GF.Param = GF.Param || {};

    // ---- 词典文件列表 ----
    GF.Param.GGMGlossaryFileList = JSON.parse(GF.Parameters['GlossaryFileList'] || '[]').map(set => {
        set = JSON.parse(set || '{}');
        return {
            name: String(set.name || ''),
            file: String(set.file || '')
        };
    });

    // ---- 一般设置 ----
    GF.Param.GGMFontSize = Number(GF.Parameters['FontSize'] || 22);
    GF.Param.GGMAutoResizePicture = eval(GF.Parameters['AutoResizePicture'] || 'true');
    GF.Param.GGMPicturePosition = String(GF.Parameters['PicturePosition'] || 'top');
    GF.Param.GGMPictureAlign = String(GF.Parameters['PictureAlign'] || 'center');
    GF.Param.GGMPicturePriority = String(GF.Parameters['PicturePriority'] || 'top');
    GF.Param.GGMFramelessDesign = eval(GF.Parameters['FramelessDesign'] || 'false');
    GF.Param.GGMNewEntryColor = Number(GF.Parameters['NewEntryColor'] || 2);
    GF.Param.GGMDefaultTextColor = Number(GF.Parameters['DefaultTextColor'] || 0);
    GF.Param.GGMPageWrap = eval(GF.Parameters['PageWrap'] || 'true');
    GF.Param.GGMBottomHelp = eval(GF.Parameters['BottomHelp'] || 'true');
    GF.Param.GGMShowPageNumber = eval(GF.Parameters['ShowPageNumber'] || 'true');
    GF.Param.GGMAutoLineWrap = eval(GF.Parameters['AutoLineWrap'] || 'true');
    GF.Param.GGMCompleteMsgFormat = String(GF.Parameters['CompleteMsgFormat'] || '收集率 %1％');

    // ---- 隐藏空词典/空分类 ----
    GF.Param.GGMHideEmptyGlossary = eval(GF.Parameters['HideEmptyGlossary'] || 'false');
    GF.Param.GGMHideEmptyCategory = eval(GF.Parameters['HideEmptyCategory'] || 'false');

    // ---- 分类显示模式 ----
    GF.Param.GGMCategoryMode = String(GF.Parameters['CategoryMode'] || '窗口');
    GF.Param.GGMCategoryButtonSet = (() => {
        const set = JSON.parse(GF.Parameters['CategoryButtonSet'] || '{}');
        return {
            ButtonSetX: Number(set.ButtonSetX || 0),
            ButtonSetY: Number(set.ButtonSetY || 0),
            ButtonSetStyle: Number(set.ButtonSetStyle || 1),
            ButtonBitmapNum: Number(set.ButtonBitmapNum || 1),
            ButtonBackBitmap: String(set.ButtonBackBitmap || ''),
            ButtonSetBitmap: String(set.ButtonSetBitmap || '')
        };
    })();
    GF.Param.GGMCategoryButtonList = (() => {
        const raw = GF.Parameters['CategoryButtonList'] || '[]';
        try {
            return JSON.parse(raw).map(entry => {
                const obj = typeof entry === 'string' ? JSON.parse(entry) : entry;
                return { Symbol: String(obj.Symbol || 'all'), Bitmap: String(obj.Bitmap || '') };
            });
        } catch (e) {
            return [];
        }
    })();

    // ---- 词典列表显示模式 ----
    GF.Param.GGMGlossaryListMode = String(GF.Parameters['GlossaryListMode'] || '窗口');
    GF.Param.GGMGlossaryListButtonSet = (() => {
        const set = JSON.parse(GF.Parameters['GlossaryListButtonSet'] || '{}');
        return {
            ButtonSetX: Number(set.ButtonSetX || 0),
            ButtonSetY: Number(set.ButtonSetY || 0),
            ButtonSetStyle: Number(set.ButtonSetStyle || 1),
            ButtonBitmapNum: Number(set.ButtonBitmapNum || 1),
            ButtonBackBitmap: String(set.ButtonBackBitmap || ''),
            ButtonSetBitmap: String(set.ButtonSetBitmap || '')
        };
    })();
    GF.Param.GGMGlossaryListButtonList = (() => {
        const raw = GF.Parameters['GlossaryListButtonList'] || '[]';
        try {
            return JSON.parse(raw).map(entry => {
                const obj = typeof entry === 'string' ? JSON.parse(entry) : entry;
                return { Symbol: String(obj.Symbol || '1'), Bitmap: String(obj.Bitmap || '') };
            });
        } catch (e) {
            return [];
        }
    })();

    // ---- 用语设置 ----
    GF.Param.GGMOngoingText = String(GF.Parameters['OngoingText'] || '已解锁');
    GF.Param.GGMLockedText = String(GF.Parameters['LockedText'] || '???');
    GF.Param.GGMSeenText = String(GF.Parameters['SeenText'] || '已读');
    GF.Param.GGMNewText = String(GF.Parameters['NewText'] || 'New!');
    GF.Param.GGMCompleteText = String(GF.Parameters['CompleteText'] || '已收集全');
    GF.Param.GGMUnknownIcon = Number(GF.Parameters['UnknownIcon'] || 0);
    GF.Param.GGMHideListSingleGlossary = eval(GF.Parameters['HideListSingleGlossary'] || 'true');
    GF.Param.GGMCompleteDisplay = String(GF.Parameters['CompleteDisplay'] || 'category');

    // ---- 词典解锁通知 ----
    GF.Param.GGMUnlockNotifyMode = String(GF.Parameters['GlossaryUnlockNotifyMode'] || 'all');
    GF.Param.GGMUnlockNotifyFmt = String(GF.Parameters['GlossaryUnlockFmt'] || '\\c[24]图鉴解锁\\c[0] %2');
    GF.Param.GGMUnlockNotifyStyleId = Number(GF.Parameters['GlossaryUnlockStyleId'] || 0);

    // ---- 对话自动解锁 ----
    GF.Param.GGMDialogueAutoUnlock = eval(GF.Parameters['DialogueAutoUnlock'] || 'true');
    GF.Param.GGMDialogueAutoUnlockSwitchId = Number(GF.Parameters['DialogueAutoUnlockSwitchId'] || 0);

    // ---- 阅读弹窗设置 ----
    GF.Param.GGMEnableReadingPopup = eval(GF.Parameters['EnableReadingPopup'] || 'false');
    GF.Param.GGMReadingPopupWindowSet = DataManager.setupWindowInitParam(
        JSON.parse(GF.Parameters['ReadingPopupWindowSet'] || '{}')
    );

    // ---- 窗口设置 ----
    GF.Param.GGMHelpWindowSet = DataManager.setupWindowInitParam(
        JSON.parse(GF.Parameters['HelpWindowSet'] || '{}')
    );
    GF.Param.GGMGlossaryListWindowSet = DataManager.setupWindowInitParam(
        JSON.parse(GF.Parameters['GlossaryListWindowSet'] || '{}')
    );
    GF.Param.GGMCategoryWindowSet = DataManager.setupWindowInitParam(
        JSON.parse(GF.Parameters['CategoryWindowSet'] || '{}')
    );
    GF.Param.GGMEntryListWindowSet = DataManager.setupWindowInitParam(
        JSON.parse(GF.Parameters['EntryListWindowSet'] || '{}')
    );
    GF.Param.GGMContentWindowSet = DataManager.setupWindowInitParam(
        JSON.parse(GF.Parameters['ContentWindowSet'] || '{}')
    );
    GF.Param.GGMCompleteWindowSet = DataManager.setupWindowInitParam(
        JSON.parse(GF.Parameters['CompleteWindowSet'] || '{}')
    );

    // ---- 菜单设置 ----
    GF.Param.GGMMainLayoutFile = String(GF.Parameters['MainLayoutFile'] || '');
    GF.Param.GGMPopDelay = Number(GF.Parameters['PopDelay'] || 20);

    //=========================================================================
    // 数据加载
    //=========================================================================

    var $dataGlossaries = {};

    /**
     * 从外部 JSON 文件加载所有词典数据
     */
    function loadAllGlossaryData() {
        const fileList = GF.Param.GGMGlossaryFileList;
        $dataGlossaries = {};
        for (let i = 0; i < fileList.length; i++) {
            const item = fileList[i];
            if (!item.file) continue;
            loadSingleGlossaryFile(item.file);
        }
    }

    /**
     * 加载单个词典 JSON 文件
     */
    function loadSingleGlossaryFile(filePath) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', filePath, false); // 同步加载，确数据可用
        xhr.overrideMimeType('application/json');
        try {
            xhr.send();
            if (xhr.status >= 200 && xhr.status < 400) {
                const data = JSON.parse(xhr.responseText);
                if (data && data.glossaryType) {
                    $dataGlossaries[data.glossaryType] = data;
                }
            }
        } catch (e) {
            console.warn('GF_ExternalGlossary: Failed to load ' + filePath, e);
        }
    }

    // 挂载到 DataManager 的数据库加载流程
    GF.GGM.DataManager_loadDatabase = DataManager.loadDatabase;
    DataManager.loadDatabase = function () {
        GF.GGM.DataManager_loadDatabase.call(this);
        loadAllGlossaryData();
    };

    GF.GGM.DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function (contents) {
        GF.GGM.DataManager_extractSaveContents.call(this, contents);
        loadAllGlossaryData();
        $gameSystem.checkGGMData();
    };

    //=========================================================================
    // Game_System 扩展
    //=========================================================================

    GF.GGM.Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function () {
        GF.GGM.Game_System_initialize.call(this);
        this.initGGMData();
        GlossaryManager.refreshAllUnlockConditions();
    };

    Game_System.prototype.initGGMData = function () {
        this._glossaryUnlocked = {};  // { typeId: { entryId: true/false } }
        this._glossarySeen = {};      // { typeId: { entryId: true/false } }
        this._glossaryCurrentPage = {}; // { typeId: { entryId: pageIndex } }
    };

    Game_System.prototype.checkGGMData = function () {
        if (this._glossaryUnlocked === undefined) {
            this._glossaryUnlocked = {};
        }
        if (this._glossarySeen === undefined) {
            this._glossarySeen = {};
        }
        if (this._glossaryCurrentPage === undefined) {
            this._glossaryCurrentPage = {};
        }
    };

    Game_System.prototype.glossaryUnlocked = function (typeId, entryId) {
        const typeData = this._glossaryUnlocked[typeId];
        if (!typeData) return false;
        return typeData[entryId] === true;
    };

    Game_System.prototype.setGlossaryUnlocked = function (typeId, entryId, unlocked) {
        if (!this._glossaryUnlocked[typeId]) {
            this._glossaryUnlocked[typeId] = {};
        }
        this._glossaryUnlocked[typeId][entryId] = !!unlocked;
    };

    Game_System.prototype.glossarySeen = function (typeId, entryId) {
        const typeData = this._glossarySeen[typeId];
        if (!typeData) return false;
        return typeData[entryId] === true;
    };

    Game_System.prototype.setGlossarySeen = function (typeId, entryId, seen) {
        if (!this._glossarySeen[typeId]) {
            this._glossarySeen[typeId] = {};
        }
        this._glossarySeen[typeId][entryId] = !!seen;
    };

    Game_System.prototype.glossaryCurrentPage = function (typeId, entryId) {
        const typeData = this._glossaryCurrentPage[typeId];
        if (!typeData) return 0;
        const page = typeData[entryId];
        return page !== undefined ? page : 0;
    };

    Game_System.prototype.setGlossaryCurrentPage = function (typeId, entryId, page) {
        if (!this._glossaryCurrentPage[typeId]) {
            this._glossaryCurrentPage[typeId] = {};
        }
        this._glossaryCurrentPage[typeId][entryId] = page;
    };

    //=========================================================================
    // GlossaryManager
    //=========================================================================

    class GlossaryManager {

        // ---- 查询 ----

        static getGlossary(typeId) {
            return $dataGlossaries[typeId] || null;
        }

        static getGlossaryTypes() {
            return Object.keys($dataGlossaries).map(Number).sort((a, b) => a - b);
        }

        /**
         * 获取有已解锁条目的词典类型列表
         */
        static getVisibleGlossaryTypes() {
            if (!GF.Param.GGMHideEmptyGlossary) return this.getGlossaryTypes();
            const allTypes = this.getGlossaryTypes();
            return allTypes.filter(typeId => this.hasUnlockedEntries(typeId, null));
        }

        /**
         * 检查指定分类下是否有已解锁条目
         * @param {number} typeId 词典类型
         * @param {string|null} categoryId 分类ID，null 表示检查全词典
         */
        static hasUnlockedEntries(typeId, categoryId) {
            const entries = this.entryList(typeId, categoryId);
            return entries.some(e => this.isUnlocked(typeId, e.id));
        }

        static getGlossaryCount() {
            return Object.keys($dataGlossaries).length;
        }

        static getGlossaryName(typeId) {
            const glossary = this.getGlossary(typeId);
            return glossary ? glossary.commandName || '' : '';
        }

        static getCategories(typeId) {
            const glossary = this.getGlossary(typeId);
            if (!glossary || !glossary.useCategory || !glossary.categories) return [];
            return glossary.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        static getCategory(typeId, categoryId) {
            const categories = this.getCategories(typeId);
            return categories.find(c => c.id === categoryId) || null;
        }

        static entryList(typeId, categoryId) {
            const glossary = this.getGlossary(typeId);
            if (!glossary || !glossary.entries) return [];
            return glossary.entries
                .filter(e => !categoryId || e.categoryId === categoryId)
                .sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        static getEntry(typeId, entryId) {
            const entries = this.entryList(typeId);
            return entries.find(e => e.id === entryId) || null;
        }

        static getEntryCount(typeId, categoryId) {
            return this.entryList(typeId, categoryId).length;
        }

        // ---- 收集率 ----

        static getUnlockedCount(typeId, categoryId) {
            const entries = this.entryList(typeId, categoryId);
            return entries.filter(e => this.isUnlocked(typeId, e.id)).length;
        }

        static getCollectibleCount(typeId, categoryId) {
            const entries = this.entryList(typeId, categoryId);
            return entries.filter(e => !e.noCollect).length;
        }

        static getCompleteRate(typeId, categoryId) {
            const total = this.getCollectibleCount(typeId, categoryId);
            if (total === 0) return 0;
            return Math.floor((this.getUnlockedCount(typeId, categoryId) / total) * 100);
        }

        // ---- 解锁状态 ----

        static isUnlocked(typeId, entryId) {
            const entry = this.getEntry(typeId, entryId);
            if (!entry) return false;
            const condition = entry.unlockCondition;
            if (!condition || condition.type === 'none' || condition.type === 'auto') {
                return $gameSystem.glossaryUnlocked(typeId, entryId);
            }
            return $gameSystem.glossaryUnlocked(typeId, entryId);
        }

        static setUnlocked(typeId, entryId, unlocked) {
            // 在触发任何可能重置 _glossaryUnlockSource 的操作前保存来源
            const unlockSource = $gameTemp._glossaryUnlockSource || 'manual';

            $gameSystem.setGlossaryUnlocked(typeId, entryId, unlocked);
            const entry = this.getEntry(typeId, entryId);
            if (entry && entry.unlockCondition) {
                // 处理 notifySwitchId
                if (entry.unlockCondition.notifySwitchId > 0 && unlocked) {
                    $gameSwitches.setValue(entry.unlockCondition.notifySwitchId, true);
                }
                // 处理 notifyVariableId
                if (entry.unlockCondition.notifyVariableId > 0 && unlocked) {
                    $gameVariables.setValue(entry.unlockCondition.notifyVariableId, entryId);
                }
            }
            // 推送解锁通知
            if (unlocked && Imported.GF_3_ToastSystem) {
                this._pushUnlockToast(typeId, entryId);
            }
            // 阅读弹窗 — 解锁时弹出（放在 toast 之后，但使用提前保存的来源信息）
            if (unlocked) {
                this._triggerReadingPopup(typeId, entryId, unlockSource);
            }
        }

        /**
         * 触发阅读弹窗（由 setUnlocked 内部调用）
         * @param {number} typeId 词典类型ID
         * @param {number} entryId 条目ID
         * @param {string} unlockSource 解锁来源 ('auto'|'manual')
         */
        static _triggerReadingPopup(typeId, entryId, unlockSource) {
            // 检查是否有强制弹窗标记（插件指令传入）
            if ($gameTemp._glossaryReadingForcePopup) {
                $gameTemp._glossaryReadingForcePopup = false;
                this.openReadingPopup(typeId, entryId);
                return;
            }
            // 对话自动解锁：受插件参数控制
            if (unlockSource === 'auto') {
                if (GF.Param.GGMEnableReadingPopup) {
                    this.openReadingPopup(typeId, entryId);
                }
                return;
            }
            // 手动解锁（脚本/其他插件指令调用）：默认不弹窗
        }

        /**
         * 打开阅读弹窗场景
         * @param {number} typeId 词典类型ID
         * @param {number} entryId 条目ID
         */
        static openReadingPopup(typeId, entryId) {
            // 截取当前屏幕作为背景（RMMZ 标准方法）
            SceneManager.snapForBackground();
            $gameTemp._glossaryReadingData = { typeId: typeId, entryId: entryId };
            SceneManager.push(Scene_GFGlossaryReading);
        }

        static _pushUnlockToast(typeId, entryId) {
            const mode = GF.Param.GGMUnlockNotifyMode || 'all';
            if (mode === 'none') return;

            const source = $gameTemp._glossaryUnlockSource || 'manual';
            if (mode === 'auto' && source !== 'auto') return;
            if (mode === 'manual' && source !== 'manual') return;
            // 重置标记
            $gameTemp._glossaryUnlockSource = 'none';

            const glossary = this.getGlossary(typeId);
            if (!glossary) return;
            const entry = this.getEntry(typeId, entryId);
            if (!entry) return;

            let text = GF.Param.GGMUnlockNotifyFmt || '\\c[24]图鉴解锁\\c[0] %2';
            text = text.replace(/%1/g, glossary.commandName || '');
            text = text.replace(/%2/g, entry.name || '');

            const styleId = GF.Param.GGMUnlockNotifyStyleId || 0;
            if (styleId > 0 && ToastManager.addTextWithStyle) {
                ToastManager.addTextWithStyle(text, styleId);
            } else {
                ToastManager.addText(text);
            }
        }

        static unlockAll(typeId) {
            const entries = this.entryList(typeId);
            entries.forEach(e => this.setUnlocked(typeId, e.id, true));
        }

        static lockAll(typeId) {
            const entries = this.entryList(typeId);
            entries.forEach(e => this.setUnlocked(typeId, e.id, false));
        }

        // ---- 查看状态 ----

        static isSeen(typeId, entryId) {
            return $gameSystem.glossarySeen(typeId, entryId);
        }

        static markAsSeen(typeId, entryId) {
            $gameSystem.setGlossarySeen(typeId, entryId, true);
            // 处理 seenCondition
            const entry = this.getEntry(typeId, entryId);
            if (entry && entry.seenCondition && entry.seenCondition.setWhenOpened) {
                if (entry.seenCondition.switchId > 0) {
                    $gameSwitches.setValue(entry.seenCondition.switchId, true);
                }
            }
        }

        static resetNewFlags(typeId) {
            const entries = this.entryList(typeId);
            entries.forEach(e => this.markAsSeen(typeId, e.id, true));
        }

        static isNew(typeId, entryId) {
            return this.isUnlocked(typeId, entryId) && !this.isSeen(typeId, entryId);
        }

        // ---- 页面状态 ----

        static getCurrentPage(typeId, entryId) {
            return $gameSystem.glossaryCurrentPage(typeId, entryId);
        }

        static setCurrentPage(typeId, entryId, page) {
            $gameSystem.setGlossaryCurrentPage(typeId, entryId, page);
        }

        // ---- 条件检查 ----

        /**
         * 检查条目解锁条件并自动更新状态
         */
        static checkUnlockCondition(typeId, entryId) {
            const entry = this.getEntry(typeId, entryId);
            if (!entry) return false;
            const condition = entry.unlockCondition;
            if (!condition || condition.type === 'none' || condition.type === 'auto') {
                return $gameSystem.glossaryUnlocked(typeId, entryId);
            }
            let unlocked = false;
            switch (condition.type) {
                case 'switch':
                    if (condition.switchId > 0 && $gameSwitches.value(condition.switchId)) {
                        unlocked = true;
                    }
                    break;
                case 'variable':
                    if (condition.variableId > 0 &&
                        $gameVariables.value(condition.variableId) >= (condition.variableValue || 1)) {
                        unlocked = true;
                    }
                    break;
                case 'script':
                    if (condition.script) {
                        try {
                            const result = eval(condition.script);
                            if (result === true) {
                                unlocked = true;
                            }
                        } catch (e) {
                            console.warn('GF_ExternalGlossary: Script error in unlock condition', e);
                        }
                    }
                    break;
            }
            if (unlocked && !$gameSystem.glossaryUnlocked(typeId, entryId)) {
                $gameTemp._glossaryUnlockSource = 'auto';
                this.setUnlocked(typeId, entryId, true);
            }
            return $gameSystem.glossaryUnlocked(typeId, entryId);
        }

        /**
         * 刷新所有条目的解锁状态
         */
        static refreshAllUnlockConditions() {
            if (!$gameSystem || !$gameSystem._glossaryUnlocked) return;
            const types = this.getGlossaryTypes();
            types.forEach(typeId => {
                const entries = this.entryList(typeId);
                entries.forEach(e => {
                    this.checkUnlockCondition(typeId, e.id);
                });
            });
        }

        // ---- 打开界面 ----

        static open(typeId) {
            if (typeId !== undefined && typeId !== null) {
                $gameSystem._glossaryOpenType = typeId;
                $gameSystem._glossaryOpenCategory = null;
                $gameSystem._glossaryOpenEntry = 0;
            }
            SceneManager.push(Scene_GFGlossary);
        }

        static openWithCategory(typeId, categoryId) {
            $gameSystem._glossaryOpenType = typeId;
            $gameSystem._glossaryOpenCategory = categoryId;
            $gameSystem._glossaryOpenEntry = 0;
            SceneManager.push(Scene_GFGlossary);
        }

        static openWithEntry(typeId, categoryId, entryId) {
            $gameSystem._glossaryOpenType = typeId;
            $gameSystem._glossaryOpenCategory = categoryId;
            $gameSystem._glossaryOpenEntry = entryId;
            SceneManager.push(Scene_GFGlossary);
        }

        // ---- 数据刷新 ----

        static reloadData() {
            loadAllGlossaryData();
            this.refreshAllUnlockConditions();
        }

        // ---- 分类可见条件 ----

        static isCategoryVisible(typeId, categoryId) {
            const category = this.getCategory(typeId, categoryId);
            if (!category) return false;
            const condition = category.condition;
            if (!condition) return true;
            if (condition.switchId > 0) {
                if (!$gameSwitches.value(condition.switchId)) return false;
            }
            if (condition.script) {
                try {
                    if (!eval(condition.script)) return false;
                } catch (e) {
                    return false;
                }
            }
            return true;
        }

        // ---- 页面可见条件 ----

        static isPageVisible(typeId, entryId, pageIndex) {
            const entry = this.getEntry(typeId, entryId);
            if (!entry || !entry.pages) return false;
            const page = entry.pages.find(p => p.pageIndex === pageIndex);
            if (!page) return false;
            if (page.showSwitchId > 0) {
                return $gameSwitches.value(page.showSwitchId);
            }
            return true;
        }

        // ---- 文本颜色 ----

        static getEntryTextColor(typeId, entryId) {
            const entry = this.getEntry(typeId, entryId);
            if (!entry) return GF.Param.GGMDefaultTextColor;

            // 检查开关控制颜色
            if (entry.textColorSwitch && entry.textColorSwitch.switchId > 0) {
                if ($gameSwitches.value(entry.textColorSwitch.switchId)) {
                    return entry.textColorSwitch.color || GF.Param.GGMDefaultTextColor;
                }
            }

            // 新条目颜色
            if (this.isNew(typeId, entryId)) {
                return GF.Param.GGMNewEntryColor;
            }

            return GF.Param.GGMDefaultTextColor;
        }

        // ---- 对话文本自动解锁 ----

        /**
         * 扫描对话文本，自动解锁名称出现在文本中的条目
         */
        static checkDialogueForAutoUnlock(text) {
            if (!text) return;

            // 检查开关条件
            const switchId = GF.Param.GGMDialogueAutoUnlockSwitchId;
            if (switchId > 0 && !$gameSwitches.value(switchId)) return;

            const types = this.getGlossaryTypes();
            for (let ti = 0; ti < types.length; ti++) {
                const typeId = types[ti];
                const entries = this.entryList(typeId);
                for (let ei = 0; ei < entries.length; ei++) {
                    const entry = entries[ei];
                    if (!entry.name) continue;
                    if (this.isUnlocked(typeId, entry.id)) continue;
                    if (text.indexOf(entry.name) >= 0) {
                        $gameTemp._glossaryUnlockSource = 'auto';
                        this.setUnlocked(typeId, entry.id, true);
                    }
                }
            }
        }
    }

    //=========================================================================
    // Game_Temp 初始化
    //=========================================================================

    GF.GGM.Game_Temp_initialize = Game_Temp.prototype.initialize;
    Game_Temp.prototype.initialize = function () {
        GF.GGM.Game_Temp_initialize.call(this);
        this._glossaryUnlockSource = 'none'; // 'none' | 'auto' | 'manual'
        this._glossaryReadingData = null;    // { typeId, entryId } 阅读弹窗数据
        this._glossaryReadingForcePopup = false; // true 表示强制弹出阅读窗口
    };

    //=========================================================================
    // Game_Switches 钩子 — 开关变化时刷新解锁条件
    //=========================================================================

    GF.GGM.Game_Switches_setValue = Game_Switches.prototype.setValue;
    Game_Switches.prototype.setValue = function (switchId, value) {
        const last = this.value(switchId);
        GF.GGM.Game_Switches_setValue.call(this, switchId, value);
        if (last !== this.value(switchId)) {
            GlossaryManager.refreshAllUnlockConditions();
        }
    };

    //=========================================================================
    // Game_Variables 钩子 — 变量变化时刷新解锁条件
    //=========================================================================

    GF.GGM.Game_Variables_setValue = Game_Variables.prototype.setValue;
    Game_Variables.prototype.setValue = function (variableId, value) {
        const last = this.value(variableId);
        GF.GGM.Game_Variables_setValue.call(this, variableId, value);
        if (last !== this.value(variableId)) {
            GlossaryManager.refreshAllUnlockConditions();
        }
    };

    //=========================================================================
    // 插件指令
    //=========================================================================

    PluginManager.registerCommand(GF.GGM.pluginName, 'OpenGlossaryMenu', () => {
        $gameSystem._glossaryOpenType = 0;
        $gameSystem._glossaryOpenCategory = null;
        $gameSystem._glossaryOpenEntry = 0;
        SceneManager.push(Scene_GFGlossary);
    });

    PluginManager.registerCommand(GF.GGM.pluginName, 'OpenGlossaryType', args => {
        const typeId = Number(args.TypeId) || 1;
        const categoryId = args.CategoryId || null;
        const entryId = Number(args.EntryId) || 0;
        $gameSystem._glossaryOpenType = typeId;
        $gameSystem._glossaryOpenCategory = categoryId;
        $gameSystem._glossaryOpenEntry = entryId;
        SceneManager.push(Scene_GFGlossary);
    });

    PluginManager.registerCommand(GF.GGM.pluginName, 'UnlockEntry', args => {
        const typeId = Number(args.TypeId) || 1;
        const entryId = Number(args.EntryId) || 1;
        const showPopup = (String(args.ShowPopup) === 'true');
        $gameTemp._glossaryUnlockSource = 'manual';
        if (showPopup) {
            $gameTemp._glossaryReadingForcePopup = true;
        }
        GlossaryManager.setUnlocked(typeId, entryId, true);
    });

    PluginManager.registerCommand(GF.GGM.pluginName, 'LockEntry', args => {
        const typeId = Number(args.TypeId) || 1;
        const entryId = Number(args.EntryId) || 1;
        GlossaryManager.setUnlocked(typeId, entryId, false);
    });

    PluginManager.registerCommand(GF.GGM.pluginName, 'UnlockAll', args => {
        const typeId = Number(args.TypeId) || 1;
        $gameTemp._glossaryUnlockSource = 'manual';
        GlossaryManager.unlockAll(typeId);
    });

    PluginManager.registerCommand(GF.GGM.pluginName, 'LockAll', args => {
        const typeId = Number(args.TypeId) || 1;
        GlossaryManager.lockAll(typeId);
    });

    PluginManager.registerCommand(GF.GGM.pluginName, 'MarkSeen', args => {
        const typeId = Number(args.TypeId) || 1;
        const entryId = Number(args.EntryId) || 1;
        GlossaryManager.markAsSeen(typeId, entryId);
    });

    PluginManager.registerCommand(GF.GGM.pluginName, 'ResetNewFlags', args => {
        const typeId = Number(args.TypeId) || 1;
        GlossaryManager.resetNewFlags(typeId);
    });

    PluginManager.registerCommand(GF.GGM.pluginName, 'RefreshGlossaryData', () => {
        GlossaryManager.reloadData();
    });

    PluginManager.registerCommand(GF.GGM.pluginName, 'SetGlossaryUnlockNotify', args => {
        const mode = String(args.Mode || 'all');
        GF.Param.GGMUnlockNotifyMode = mode;
    });

    //=========================================================================
    // Window_GFGlossaryReading — 阅读弹窗
    //=========================================================================

    var Window_GFGlossaryReading = function () {
        this.initialize.apply(this, arguments);
    };

    Window_GFGlossaryReading.prototype = Object.create(Window_Base.prototype);
    Window_GFGlossaryReading.prototype.constructor = Window_GFGlossaryReading;

    Window_GFGlossaryReading.prototype.initialize = function () {
        Window_Base.prototype.initialize.call(this);
        this._windowSet = GF.Param.GGMReadingPopupWindowSet;
        this._typeId = 0;
        this._entryId = 0;
        this._currentPage = 0;
        this._maxPages = 0;
        this._pictureBitmap = null;
        this._extraPictures = [];
        this._handlers = {};
        this.processInitParam(this._windowSet);
        this._refreshArrows = function () {
            this.downArrowVisible = false;
            this.upArrowVisible = false;
        };
    };

    Window_GFGlossaryReading.prototype.setEntry = function (typeId, entryId) {
        this._typeId = typeId;
        this._entryId = entryId;
        this._currentPage = 0;
        this._pictureBitmap = null;
        this._extraPictures = [];
        this.refresh();
    };

    Window_GFGlossaryReading.prototype.refresh = function () {
        this.contents.clear();
        this.contentsBack.clear();
        if (this._typeId <= 0 || this._entryId <= 0) return;

        var entry = GlossaryManager.getEntry(this._typeId, this._entryId);
        if (!entry) return;

        // 标记为已查看
        GlossaryManager.markAsSeen(this._typeId, this._entryId);

        // 绘制标题
        this._drawTitle(entry);

        // 计算可显示的页
        var visiblePages = this._getVisiblePages(entry);
        this._maxPages = visiblePages.length;
        if (this._currentPage >= this._maxPages) {
            this._currentPage = Math.max(0, this._maxPages - 1);
        }
        if (this._currentPage < 0) this._currentPage = 0;

        // 保存当前页
        if (this._maxPages > 0) {
            GlossaryManager.setCurrentPage(this._typeId, this._entryId, this._currentPage);
        }

        // 绘制内容
        if (this._maxPages > 0 && this._currentPage < visiblePages.length) {
            var page = visiblePages[this._currentPage];
            this._drawPage(page, entry);
        }

        // 页码
        this._drawPageNumber(entry);
    };

    Window_GFGlossaryReading.prototype._drawTitle = function (entry) {
        var lh = this.lineHeight();
        var tw = this.textWidth(entry.name);
        var cx = (this.innerWidth - tw) / 2;
        this.changeTextColor(ColorManager.textColor(9)); // 标题用浅色
        this.drawText(entry.name, cx, 4, tw, 'left');
        this.changeTextColor(ColorManager.normalColor());
        // 标题下划线
        this.contents.paintOpacity = 120;
        this.contents.fillRect(cx, lh - 2, tw, 1, ColorManager.textColor(9));
        this.contents.paintOpacity = 255;
    };

    Window_GFGlossaryReading.prototype._getVisiblePages = function (entry) {
        if (!entry || !entry.pages) return [];
        return entry.pages.filter(function (p) {
            return GlossaryManager.isPageVisible(this._typeId, this._entryId, p.pageIndex);
        }.bind(this));
    };

    Window_GFGlossaryReading.prototype._drawPage = function (page, entry) {
        if (!page) return;

        var desc = page.description || '';
        var picName = page.picture || '';
        var picPos = page.picturePosition || GF.Param.GGMPicturePosition || 'top';
        var picAlign = page.pictureAlign || GF.Param.GGMPictureAlign || 'center';
        var picPriority = page.picturePriority || GF.Param.GGMPicturePriority || 'top';
        var picScale = page.pictureScale || 1.0;
        var picX = page.pictureX || 0;
        var picY = page.pictureY || 0;
        var textY = page.textPosition || 0;
        var enemyId = page.enemyId || 0;
        var titleHeight = this.lineHeight() + 4;

        var processedDesc = this._processControlChars(desc, enemyId, entry);

        if (picName) {
            this._pictureBitmap = ImageManager.loadPicture(picName);
        }

        if (this._pictureBitmap && this._pictureBitmap.isReady()) {
            this._drawPicture(this._pictureBitmap, picPos, picAlign, picPriority, picScale, picX, picY, titleHeight);
        }

        var extraPics = page.extraPictures || [];
        this._extraPictures = [];
        for (var i = 0; i < extraPics.length; i++) {
            var ep = extraPics[i];
            if (ep.filename) {
                var bmp = ImageManager.loadPicture(ep.filename);
                this._extraPictures.push({ bitmap: bmp, x: ep.x || 0, y: ep.y || 0 });
                if (bmp.isReady()) {
                    this.contents.blt(bmp, 0, 0, bmp.width, bmp.height, ep.x || 0, ep.y || 0);
                }
            }
        }

        if (!picName || picPriority === 'bottom') {
            this._drawTextContent(processedDesc, titleHeight + textY);
        }
    };

    Window_GFGlossaryReading.prototype._drawPicture = function (bitmap, picPos, picAlign, picPriority, picScale, picX, picY, titleOffset) {
        if (!bitmap || !bitmap.isReady()) return;

        var bmpW = bitmap.width * picScale;
        var bmpH = bitmap.height * picScale;

        var dx = 0;
        switch (picAlign) {
            case 'left': dx = 0; break;
            case 'right': dx = this.innerWidth - bmpW; break;
            case 'center': default: dx = (this.innerWidth - bmpW) / 2; break;
        }
        dx += picX;

        var dy = picY + titleOffset;
        switch (picPos) {
            case 'top': dy = picY + titleOffset; break;
            case 'bottom': dy = this.innerHeight - bmpH - picY; break;
            case 'text': default: dy = picY + titleOffset; break;
        }

        if (picPriority === 'bottom') {
            this.contentsBack.blt(bitmap, 0, 0, bitmap.width, bitmap.height, dx, dy, bmpW, bmpH);
        } else {
            this.contents.blt(bitmap, 0, 0, bitmap.width, bitmap.height, dx, dy, bmpW, bmpH);
        }
    };

    Window_GFGlossaryReading.prototype._drawTextContent = function (desc, startY) {
        if (!desc) return;
        var lh = this.lineHeight();
        var maxWidth = this.innerWidth - this.itemPadding() * 2 - 8;

        var lines = desc.split(/\\n/);

        if (GF.Param.GGMAutoLineWrap) {
            var wrapped = [];
            for (var li = 0; li < lines.length; li++) {
                var wrapResult = this._wrapLine(lines[li], maxWidth);
                for (var wi = 0; wi < wrapResult.length; wi++) {
                    wrapped.push(wrapResult[wi]);
                }
            }
            lines = wrapped;
        }

        var y = startY || this.lineHeight() + 4;
        for (var i = 0; i < lines.length; i++) {
            this.drawTextEx(lines[i], 0, y);
            y += lh;
        }
    };

    Window_GFGlossaryReading.prototype._wrapLine = function (line, maxWidth) {
        if (!line) return [''];
        var plain = line.replace(/\\[a-zA-Z]+\{[^}]*\}/g, '').replace(/\\[a-zA-Z]+\[[^\]]*\]/g, '');
        if (this.textWidth(plain) <= maxWidth) return [line];

        var result = [];
        var cur = '';
        var curPlain = '';

        for (var i = 0; i < line.length; i++) {
            if (line[i] === '\\' && i + 1 < line.length) {
                var rest = line.substring(i);
                var m = rest.match(/^\\([a-zA-Z]+)(\{[^}]*\}|\[[^\]]*\])/);
                if (m) {
                    cur += m[0];
                    i += m[0].length - 1;
                    continue;
                }
            }

            var nextCur = cur + line[i];
            var nextPlain = curPlain + line[i];

            if (this.textWidth(nextPlain) > maxWidth && cur.length > 0) {
                result.push(cur);
                cur = line[i];
                curPlain = line[i];
            } else {
                cur = nextCur;
                curPlain = nextPlain;
            }
        }
        if (cur) result.push(cur);
        return result;
    };

    Window_GFGlossaryReading.prototype._processControlChars = function (desc, enemyId, entry) {
        if (!desc) return '';
        var text = desc;

        if (enemyId > 0 && $dataEnemies && $dataEnemies[enemyId]) {
            var enemy = $dataEnemies[enemyId];
            text = text.replace(/\\mhp\[(\d+)\]/gi, function (m, d) { return String(enemy.params[0]).padStart(Number(d) || 1, '0'); });
            text = text.replace(/\\mmp\[(\d+)\]/gi, function (m, d) { return String(enemy.params[1]).padStart(Number(d) || 1, '0'); });
            text = text.replace(/\\atk\[(\d+)\]/gi, function (m, d) { return String(enemy.params[2]).padStart(Number(d) || 1, '0'); });
            text = text.replace(/\\def\[(\d+)\]/gi, function (m, d) { return String(enemy.params[3]).padStart(Number(d) || 1, '0'); });
            text = text.replace(/\\mag\[(\d+)\]/gi, function (m, d) { return String(enemy.params[4]).padStart(Number(d) || 1, '0'); });
            text = text.replace(/\\mdf\[(\d+)\]/gi, function (m, d) { return String(enemy.params[5]).padStart(Number(d) || 1, '0'); });
            text = text.replace(/\\agi\[(\d+)\]/gi, function (m, d) { return String(enemy.params[6]).padStart(Number(d) || 1, '0'); });
            text = text.replace(/\\luk\[(\d+)\]/gi, function (m, d) { return String(enemy.params[7]).padStart(Number(d) || 1, '0'); });
            text = text.replace(/\\exp\[(\d+)\]/gi, function (m, d) { return String(enemy.exp).padStart(Number(d) || 1, '0'); });
            text = text.replace(/\\money\[(\d+)\]/gi, function (m, d) { return String(enemy.gold).padStart(Number(d) || 1, '0'); });
            text = text.replace(/\\drop\[(\d+)\]/gi, function (m, idx) {
                var i = Number(idx) - 1;
                if (i >= 0 && enemy.dropItems && enemy.dropItems[i]) {
                    var di = enemy.dropItems[i];
                    var item = di.kind === 1 ? $dataItems[di.dataId] : di.kind === 2 ? $dataWeapons[di.dataId] : $dataArmors[di.dataId];
                    return item ? item.name : '无';
                }
                return '无';
            });
        }

        text = text.replace(/\\v\[(\d+)\]/gi, function (m, n) { return String($gameVariables.value(Number(n))); });
        text = text.replace(/\\s\[(\d+)\]/gi, function (m, n) { return $gameSwitches.value(Number(n)) ? 'ON' : 'OFF'; });
        text = text.replace(/\\data\[(\w+)\]/gi, function (m, prop) { return entry && entry[prop] !== undefined ? String(entry[prop]) : m; });
        text = text.replace(/\\script\{([^}]*)\}/gi, function (m, code) {
            try { var result = eval(code); return result !== undefined ? String(result) : ''; }
            catch (e) { return m; }
        });

        return text;
    };

    Window_GFGlossaryReading.prototype._drawPageNumber = function (entry) {
        if (!GF.Param.GGMShowPageNumber || this._maxPages <= 1) return;
        if (entry && entry.noPageNumber) return;
        var pageText = (this._currentPage + 1) + '/' + this._maxPages;
        var pw = this.textWidth(pageText);
        this.drawText(pageText, (this.innerWidth - pw) / 2, this.innerHeight - this.lineHeight(), pw, 'center');
    };

    Window_GFGlossaryReading.prototype.cursorRight = function (wrap) {
        if (this._maxPages <= 1) return;
        if (this._currentPage < this._maxPages - 1) {
            this._currentPage++;
        } else if (wrap || GF.Param.GGMPageWrap) {
            this._currentPage = 0;
        }
        SoundManager.playCursor();
        this.refresh();
    };

    Window_GFGlossaryReading.prototype.cursorLeft = function (wrap) {
        if (this._maxPages <= 1) return;
        if (this._currentPage > 0) {
            this._currentPage--;
        } else if (wrap || GF.Param.GGMPageWrap) {
            this._currentPage = this._maxPages - 1;
        }
        SoundManager.playCursor();
        this.refresh();
    };

    Window_GFGlossaryReading.prototype.maxPage = function () { return this._maxPages; };
    Window_GFGlossaryReading.prototype.currentPageIndex = function () { return this._currentPage; };

    Window_GFGlossaryReading.prototype.processTouch = function () {
        if (this.isOpenAndActive() && this._maxPages > 1 && TouchInput.isTriggered()) {
            var x = TouchInput.x;
            if (x > 0 && x < Graphics.width / 2) {
                this.cursorLeft(true);
            } else if (x >= Graphics.width / 2) {
                this.cursorRight(true);
            }
        }
    };

    Window_GFGlossaryReading.prototype.isCurrentItemEnabled = function () { return true; };

    //=========================================================================
    // Window_GFGlossaryHelp
    //=========================================================================

    class Window_GFGlossaryHelp extends Window_Base {
        initialize() {
            this._windowSet = GF.Param.GGMHelpWindowSet;
            super.initialize();
            this.processInitParam(this._windowSet);
            this._text = '';
        }

        setText(text) {
            if (this._text !== text) {
                this._text = text;
                this.refresh();
            }
        }

        clear() {
            this.setText('');
        }

        refresh() {
            this.contents.clear();
            if (this._text) {
                this.drawTextEx(this._text, 4, 0);
            }
        }
    }

    //=========================================================================
    // Window_GFGlossaryList — 词典选择列表
    //=========================================================================

    class Window_GFGlossaryList extends Window_Selectable {
        initialize() {
            this._windowSet = GF.Param.GGMGlossaryListWindowSet;
            this._typeList = [];
            this._index = -1;
            super.initialize();
            this.processInitParam(this._windowSet);
            this.refresh();
        }

        maxItems() {
            return this._typeList.length;
        }

        item(index) {
            return this._typeList[index] || null;
        }

        refresh() {
            this._typeList = GlossaryManager.getVisibleGlossaryTypes();
            super.refresh();
        }

        drawItem(index) {
            const typeId = this.item(index);
            if (typeId === null || typeId === undefined) return;
            const rect = this.itemRect(index);
            const name = GlossaryManager.getGlossaryName(typeId);
            const glossary = GlossaryManager.getGlossary(typeId);
            this.resetFontSettings();
            this.changePaintOpacity(true);
            this.drawText(name, rect.x, rect.y, rect.width, 'left');
        }

        selectType(typeId) {
            const idx = this._typeList.indexOf(typeId);
            if (idx >= 0) {
                this.select(idx);
            }
        }

        currentTypeId() {
            const item = this.item(this.index());
            return item !== null ? item : 0;
        }
    }

    //=========================================================================
    // Window_GFGlossaryCategory — 分类选择列表
    //=========================================================================

    class Window_GFGlossaryCategory extends Window_Selectable {
        initialize() {
            this._windowSet = GF.Param.GGMCategoryWindowSet;
            this._typeId = 0;
            this._categoryList = [];
            super.initialize();
            this.processInitParam(this._windowSet);
            this._lastCategoryIndex = -1;
            this._onCursorMove = null;
            this.refresh();
        }

        setCursorMoveHandler(callback) {
            this._onCursorMove = callback;
        }

        update() {
            super.update();
            if (!this.active) return;
            const currentIndex = this.index();
            if (currentIndex !== this._lastCategoryIndex) {
                this._lastCategoryIndex = currentIndex;
                if (typeof this._onCursorMove === 'function') {
                    this._onCursorMove();
                }
            }
        }

        maxCols() {
            const data = this.initParamData();
            if (data && data.maxCols > 0) {
                return data.maxCols;
            }
            return 1;
        }

        itemHeight() {
            const data = this.initParamData();
            if (data && data.maxRows > 0) {
                return Math.floor(this.innerHeight / data.maxRows);
            }
            return super.itemHeight();
        }

        maxItems() {
            return this._categoryList.length;
        }

        item(index) {
            return this._categoryList[index] || null;
        }

        setTypeId(typeId) {
            if (this._typeId !== typeId) {
                this._typeId = typeId;
                this.refresh();
                if (this._categoryList.length > 0) {
                    this.select(0);
                }
            }
        }

        refresh() {
            this._categoryList = [];
            if (this._typeId > 0) {
                const allCategories = GlossaryManager.getCategories(this._typeId);
                this._categoryList = allCategories.filter(c =>
                    GlossaryManager.isCategoryVisible(this._typeId, c.id) &&
                    (!GF.Param.GGMHideEmptyCategory || GlossaryManager.hasUnlockedEntries(this._typeId, c.id))
                );
            }
            super.refresh();
        }

        drawItem(index) {
            const category = this.item(index);
            if (!category) return;
            const rect = this.itemRect(index);
            this.resetFontSettings();
            this.changePaintOpacity(true);
            if (category.iconIndex > 0) {
                this.drawIcon(category.iconIndex, rect.x, rect.y + (rect.height - ImageManager.iconWidth) / 2);
                this.drawText(category.name, rect.x + ImageManager.iconWidth + 4, rect.y, rect.width - ImageManager.iconWidth - 4, 'left');
            } else {
                this.drawText(category.name, rect.x, rect.y, rect.width, 'left');
            }
        }

        currentCategoryId() {
            const item = this.item(this.index());
            return item ? item.id : null;
        }

        selectCategory(categoryId) {
            if (categoryId) {
                const idx = this._categoryList.findIndex(c => c.id === categoryId);
                if (idx >= 0) this.select(idx);
            }
        }
    }

    //=========================================================================
    // Window_GFGlossaryEntry — 条目列表
    //=========================================================================

    class Window_GFGlossaryEntry extends Window_Selectable {
        initialize() {
            this._windowSet = GF.Param.GGMEntryListWindowSet;
            this._typeId = 0;
            this._categoryId = null;
            this._entryList = [];
            super.initialize();
            this.processInitParam(this._windowSet);
            this._lastEntryIndex = -1;
            this._onCursorMove = null;
            this.refresh();
        }

        setCursorMoveHandler(callback) {
            this._onCursorMove = callback;
        }

        update() {
            super.update();
            if (!this.active) return;
            const currentIndex = this.index();
            if (currentIndex !== this._lastEntryIndex) {
                this._lastEntryIndex = currentIndex;
                if (typeof this._onCursorMove === 'function') {
                    this._onCursorMove();
                }
            }
        }

        maxItems() {
            return this._entryList.length;
        }

        item(index) {
            return this._entryList[index] || null;
        }

        setFilter(typeId, categoryId) {
            if (this._typeId !== typeId || this._categoryId !== categoryId) {
                this._typeId = typeId;
                this._categoryId = categoryId;
                this.refresh();
                if (this._entryList.length > 0) {
                    this.select(0);
                }
            }
        }

        refresh() {
            this._entryList = [];
            if (this._typeId > 0) {
                this._entryList = GlossaryManager.entryList(this._typeId, this._categoryId);
            }
            super.refresh();
        }

        drawItem(index) {
            const entry = this.item(index);
            if (!entry) return;
            const rect = this.itemRect(index);
            this.resetFontSettings();
            const isUnlocked = GlossaryManager.isUnlocked(this._typeId, entry.id);
            this.changePaintOpacity(isUnlocked);

            // 图标
            const iconX = rect.x;
            if (isUnlocked && entry.iconIndex > 0) {
                this.drawIcon(entry.iconIndex, iconX, rect.y + (rect.height - ImageManager.iconWidth) / 2);
            } else if (!isUnlocked && GF.Param.GGMUnknownIcon > 0) {
                this.drawIcon(GF.Param.GGMUnknownIcon, iconX, rect.y + (rect.height - ImageManager.iconWidth) / 2);
            }

            // 名称
            const textX = iconX + ImageManager.iconWidth + 4;
            const colorIndex = GlossaryManager.getEntryTextColor(this._typeId, entry.id);
            const isNew = GlossaryManager.isNew(this._typeId, entry.id);

            if (isUnlocked) {
                this.changeTextColor(ColorManager.textColor(colorIndex));
                const name = isNew ? entry.name + ' ' + GF.Param.GGMNewText : entry.name;
                this.drawText(name, textX, rect.y, rect.width - ImageManager.iconWidth - 4, 'left');
                this.resetFontSettings();
            } else {
                this.changePaintOpacity(false);
                this.drawText(GF.Param.GGMLockedText, textX, rect.y, rect.width - ImageManager.iconWidth - 4, 'left');
                this.changePaintOpacity(true);
            }
        }

        isCurrentItemEnabled() {
            const entry = this.item(this.index());
            if (!entry) return false;
            return GlossaryManager.isUnlocked(this._typeId, entry.id);
        }

        currentEntryId() {
            const item = this.item(this.index());
            return item ? item.id : 0;
        }

        selectEntry(entryId) {
            if (entryId > 0) {
                const idx = this._entryList.findIndex(e => e.id === entryId);
                if (idx >= 0) this.select(idx);
            }
        }
    }

    //=========================================================================
    // Window_GFGlossaryComplete — 收集率窗口
    //=========================================================================

    class Window_GFGlossaryComplete extends Window_Base {
        initialize() {
            this._windowSet = GF.Param.GGMCompleteWindowSet;
            this._typeId = 0;
            this._categoryId = null;
            super.initialize();
            this.processInitParam(this._windowSet);
            this.refresh();
        }

        setFilter(typeId, categoryId) {
            if (this._typeId !== typeId || this._categoryId !== categoryId) {
                this._typeId = typeId;
                this._categoryId = categoryId;
                this.refresh();
            }
        }

        refresh() {
            this.contents.clear();
            if (this._typeId <= 0) return;

            const displayMode = GF.Param.GGMCompleteDisplay;
            if (displayMode === 'none') return;

            const lh = this.lineHeight();
            let y = 0;

            if (displayMode === 'overall') {
                // 只显示总体收集率
                const rate = GlossaryManager.getCompleteRate(this._typeId, null);
                const totalStr = GF.Param.GGMCompleteMsgFormat.replace('%1', rate);
                this.drawText(totalStr, 4, y + 4, this.innerWidth - 8, 'left');
            } else {
                // 分类细分模式
                const categories = GlossaryManager.getCategories(this._typeId);
                if (categories.length > 0) {
                    y += 4;
                    const rate = GlossaryManager.getCompleteRate(this._typeId, null);
                    const totalStr = GF.Param.GGMCompleteMsgFormat.replace('%1', rate);
                    this.drawText(totalStr, 4, y, this.innerWidth - 8, 'left');
                    y += lh + 4;

                    for (let i = 0; i < categories.length; i++) {
                        const cat = categories[i];
                        if (!GlossaryManager.isCategoryVisible(this._typeId, cat.id)) continue;
                        const unlocked = GlossaryManager.getUnlockedCount(this._typeId, cat.id);
                        const total = GlossaryManager.getCollectibleCount(this._typeId, cat.id);
                        const catRate = total > 0 ? Math.floor((unlocked / total) * 100) : 0;
                        const text = cat.name + ' (' + unlocked + '/' + total + ')  ' + catRate + '%';
                        this.drawText(text, 4, y, this.innerWidth - 8, 'left');
                        y += lh;
                    }
                } else {
                    // 无分类时只显示总体
                    const rate = GlossaryManager.getCompleteRate(this._typeId, null);
                    const totalStr = GF.Param.GGMCompleteMsgFormat.replace('%1', rate);
                    this.drawText(totalStr, 4, 4, this.innerWidth - 8, 'left');
                }
            }
        }
    }

    //=========================================================================
    // Window_GFGlossaryContent — 内容窗口（图片+文本+控制字符+多页）
    //=========================================================================

    class Window_GFGlossaryContent extends Window_Selectable {
        initialize() {
            this._windowSet = GF.Param.GGMContentWindowSet;
            this._typeId = 0;
            this._entryId = 0;
            this._currentPage = 0;
            this._maxPages = 0;
            this._pictureBitmap = null;
            this._extraPictures = [];
            super.initialize();
            this.processInitParam(this._windowSet);
            this._refreshArrows = function () {
                this.downArrowVisible = false;
                this.upArrowVisible = false;
                this.leftArrowVisible = this._currentPage > 0;
                this.rightArrowVisible = this._currentPage < this._maxPages - 1;
            };
        }

        setItem(typeId, entryId, pageIndex) {
            if (this._typeId !== typeId || this._entryId !== entryId || pageIndex !== undefined) {
                this._typeId = typeId;
                this._entryId = entryId;
                this._currentPage = pageIndex !== undefined ? pageIndex : 0;
                this._pictureBitmap = null;
                this._extraPictures = [];
                this.refresh();
            }
        }

        refresh() {
            this.contents.clear();
            this.contentsBack.clear();
            if (this._typeId <= 0 || this._entryId <= 0) return;

            const entry = GlossaryManager.getEntry(this._typeId, this._entryId);
            if (!entry) return;

            const isUnlocked = GlossaryManager.isUnlocked(this._typeId, this._entryId);

            this._maxPages = this._calcMaxPages(entry, isUnlocked);
            if (this._currentPage >= this._maxPages) {
                this._currentPage = Math.max(0, this._maxPages - 1);
            }
            if (this._currentPage < 0) this._currentPage = 0;

            this._refreshArrows();

            if (!isUnlocked || this._maxPages === 0) {
                this._drawLockedContent();
                return;
            }

            const visiblePages = this._getVisiblePages(entry);
            if (this._currentPage >= 0 && this._currentPage < visiblePages.length) {
                const page = visiblePages[this._currentPage];
                GlossaryManager.markAsSeen(this._typeId, this._entryId);
                GlossaryManager.setCurrentPage(this._typeId, this._entryId, this._currentPage);
                this._drawPage(page, entry);
            }
        }

        _calcMaxPages(entry, isUnlocked) {
            if (!entry || !entry.pages) return 0;
            if (!isUnlocked) return 0;
            return entry.pages.filter(p =>
                GlossaryManager.isPageVisible(this._typeId, this._entryId, p.pageIndex)
            ).length;
        }

        _getVisiblePages(entry) {
            if (!entry || !entry.pages) return [];
            return entry.pages.filter(p =>
                GlossaryManager.isPageVisible(this._typeId, this._entryId, p.pageIndex)
            );
        }

        _drawLockedContent() {
            const text = GF.Param.GGMLockedText;
            const tw = this.textWidth(text);
            this.drawText(text, (this.innerWidth - tw) / 2, (this.innerHeight - this.lineHeight()) / 2, tw, 'center');
        }

        _drawPage(page, entry) {
            if (!page) return;

            const desc = page.description || '';
            const picName = page.picture || '';
            const picPos = page.picturePosition || GF.Param.GGMPicturePosition || 'top';
            const picAlign = page.pictureAlign || GF.Param.GGMPictureAlign || 'center';
            const picPriority = page.picturePriority || GF.Param.GGMPicturePriority || 'top';
            const picScale = page.pictureScale || 1.0;
            const picX = page.pictureX || 0;
            const picY = page.pictureY || 0;
            const textY = page.textPosition || 0;
            const enemyId = page.enemyId || 0;

            let processedDesc = this._processControlChars(desc, enemyId, entry);

            if (picName) {
                this._pictureBitmap = ImageManager.loadPicture(picName);
            }

            if (this._pictureBitmap && this._pictureBitmap.isReady()) {
                this._drawPicture(this._pictureBitmap, picPos, picAlign, picPriority, picScale, picX, picY);
            }

            const extraPics = page.extraPictures || [];
            this._extraPictures = [];
            for (let i = 0; i < extraPics.length; i++) {
                const ep = extraPics[i];
                if (ep.filename) {
                    const bmp = ImageManager.loadPicture(ep.filename);
                    this._extraPictures.push({ bitmap: bmp, x: ep.x || 0, y: ep.y || 0 });
                    if (bmp.isReady()) {
                        this.contents.blt(bmp, 0, 0, bmp.width, bmp.height, ep.x || 0, ep.y || 0);
                    }
                }
            }

            if (!picName || picPriority === 'bottom') {
                this._drawTextContent(processedDesc, textY);
            }

            if (GF.Param.GGMShowPageNumber && this._maxPages > 1 && !entry.noPageNumber) {
                const pageText = (this._currentPage + 1) + '/' + this._maxPages;
                const pw = this.textWidth(pageText);
                this.drawText(pageText, (this.innerWidth - pw) / 2, this.innerHeight - this.lineHeight(), pw, 'center');
            }
        }

        _drawPicture(bitmap, picPos, picAlign, picPriority, picScale, picX, picY) {
            if (!bitmap || !bitmap.isReady()) return;

            const bmpW = bitmap.width * picScale;
            const bmpH = bitmap.height * picScale;

            let dx = 0;
            switch (picAlign) {
                case 'left': dx = 0; break;
                case 'right': dx = this.innerWidth - bmpW; break;
                case 'center': default: dx = (this.innerWidth - bmpW) / 2; break;
            }
            dx += picX;

            let dy = picY;
            switch (picPos) {
                case 'top': dy = picY; break;
                case 'bottom': dy = this.innerHeight - bmpH - picY; break;
                case 'text': default: dy = picY; break;
            }

            if (picPriority === 'bottom') {
                this.contentsBack.blt(bitmap, 0, 0, bitmap.width, bitmap.height, dx, dy, bmpW, bmpH);
            } else {
                this.contents.blt(bitmap, 0, 0, bitmap.width, bitmap.height, dx, dy, bmpW, bmpH);
            }
        }

        _drawTextContent(desc, startY) {
            if (!desc) return;
            const lh = this.lineHeight();
            const maxWidth = this.innerWidth - this.itemPadding() * 2 - 8;

            // 先按手动换行符拆分
            let lines = desc.split(/\\n/);

            // 启用自动换行时，进一步拆分超长行
            if (GF.Param.GGMAutoLineWrap) {
                const wrapped = [];
                for (const line of lines) {
                    Array.prototype.push.apply(wrapped, this._wrapLine(line, maxWidth));
                }
                lines = wrapped;
            }

            let y = startY || 0;
            for (const line of lines) {
                this.drawTextEx(line, 0, y);
                y += lh;
            }
        }

        _wrapLine(line, maxWidth) {
            if (!line) return [''];
            // 纯文本宽度未超出，直接返回
            const plain = line.replace(/\\[a-zA-Z]+\{[^}]*\}/g, '').replace(/\\[a-zA-Z]+\[[^\]]*\]/g, '');
            if (this.textWidth(plain) <= maxWidth) return [line];

            const result = [];
            let cur = '';
            let curPlain = '';

            for (let i = 0; i < line.length; i++) {
                // 跳过完整的控制符块（\xxx{...} 或 \xxx[...])
                if (line[i] === '\\' && i + 1 < line.length) {
                    const rest = line.substring(i);
                    const m = rest.match(/^\\([a-zA-Z]+)(\{[^}]*\}|\[[^\]]*\])/);
                    if (m) {
                        cur += m[0];
                        i += m[0].length - 1;
                        continue;
                    }
                }

                const nextCur = cur + line[i];
                const nextPlain = curPlain + line[i];

                if (this.textWidth(nextPlain) > maxWidth && cur.length > 0) {
                    result.push(cur);
                    cur = line[i];
                    curPlain = line[i];
                } else {
                    cur = nextCur;
                    curPlain = nextPlain;
                }
            }
            if (cur) result.push(cur);
            return result;
        }

        _processControlChars(desc, enemyId, entry) {
            if (!desc) return '';
            let text = desc;

            if (enemyId > 0 && $dataEnemies && $dataEnemies[enemyId]) {
                const enemy = $dataEnemies[enemyId];
                text = text.replace(/\\mhp\[(\d+)\]/gi, (m, d) => String(enemy.params[0]).padStart(Number(d) || 1, '0'));
                text = text.replace(/\\mmp\[(\d+)\]/gi, (m, d) => String(enemy.params[1]).padStart(Number(d) || 1, '0'));
                text = text.replace(/\\atk\[(\d+)\]/gi, (m, d) => String(enemy.params[2]).padStart(Number(d) || 1, '0'));
                text = text.replace(/\\def\[(\d+)\]/gi, (m, d) => String(enemy.params[3]).padStart(Number(d) || 1, '0'));
                text = text.replace(/\\mag\[(\d+)\]/gi, (m, d) => String(enemy.params[4]).padStart(Number(d) || 1, '0'));
                text = text.replace(/\\mdf\[(\d+)\]/gi, (m, d) => String(enemy.params[5]).padStart(Number(d) || 1, '0'));
                text = text.replace(/\\agi\[(\d+)\]/gi, (m, d) => String(enemy.params[6]).padStart(Number(d) || 1, '0'));
                text = text.replace(/\\luk\[(\d+)\]/gi, (m, d) => String(enemy.params[7]).padStart(Number(d) || 1, '0'));
                text = text.replace(/\\exp\[(\d+)\]/gi, (m, d) => String(enemy.exp).padStart(Number(d) || 1, '0'));
                text = text.replace(/\\money\[(\d+)\]/gi, (m, d) => String(enemy.gold).padStart(Number(d) || 1, '0'));
                text = text.replace(/\\drop\[(\d+)\]/gi, (m, idx) => {
                    const i = Number(idx) - 1;
                    if (i >= 0 && enemy.dropItems && enemy.dropItems[i]) {
                        const di = enemy.dropItems[i];
                        const item = di.kind === 1 ? $dataItems[di.dataId] : di.kind === 2 ? $dataWeapons[di.dataId] : $dataArmors[di.dataId];
                        return item ? item.name : '无';
                    }
                    return '无';
                });
            }

            text = text.replace(/\\v\[(\d+)\]/gi, (m, n) => String($gameVariables.value(Number(n))));
            text = text.replace(/\\s\[(\d+)\]/gi, (m, n) => $gameSwitches.value(Number(n)) ? 'ON' : 'OFF');
            text = text.replace(/\\data\[(\w+)\]/gi, (m, prop) => entry && entry[prop] !== undefined ? String(entry[prop]) : m);
            text = text.replace(/\\script\{([^}]*)\}/gi, (m, code) => {
                try { const result = eval(code); return result !== undefined ? String(result) : ''; }
                catch (e) { return m; }
            });

            return text;
        }

        cursorRight(wrap) {
            if (this._maxPages <= 1) return;
            if (this._currentPage < this._maxPages - 1) {
                this._currentPage++;
            } else if (wrap || GF.Param.GGMPageWrap) {
                this._currentPage = 0;
            }
            SoundManager.playCursor();
            this.refresh();
        }

        cursorLeft(wrap) {
            if (this._maxPages <= 1) return;
            if (this._currentPage > 0) {
                this._currentPage--;
            } else if (wrap || GF.Param.GGMPageWrap) {
                this._currentPage = this._maxPages - 1;
            }
            SoundManager.playCursor();
            this.refresh();
        }

        maxPage() { return this._maxPages; }
        currentPageIndex() { return this._currentPage; }

        processTouch() {
            Window_Selectable.prototype.processTouch.call(this);
            if (this.isOpenAndActive() && this._maxPages > 1 && TouchInput.isTriggered()) {
                const x = TouchInput.x;
                if (x > 0 && x < Graphics.width / 2) {
                    this.cursorLeft(true);
                } else if (x >= Graphics.width / 2) {
                    this.cursorRight(true);
                }
            }
        }

        isCurrentItemEnabled() { return true; }
    }

    //=========================================================================
    // Sprite_GFGlossaryCategory — 按钮式分类
    //=========================================================================

    class Sprite_GFGlossaryCategory extends Sprite_CommandWindow {
        initialize() {
            const btnSet = GF.Param.GGMCategoryButtonSet;
            this._glossaryTypeId = 0;
            // 构建贴图覆盖查找表
            this._bitmapOverrides = {};
            const overrideList = GF.Param.GGMCategoryButtonList || [];
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

        setTypeId(typeId) {
            this._glossaryTypeId = typeId;
            this.clearCommandList();
            this._commandList = [];
            this.makeCommandList();
            if (typeof this.refreshCommandVisible === 'function') {
                this.refreshCommandVisible();
            }
        }

        extractBtnParamList(bitmapOverrides) {
            if (!this._glossaryTypeId) return [];
            const categories = GlossaryManager.getCategories(this._glossaryTypeId);
            const visibleCategories = categories.filter(c =>
                GlossaryManager.isCategoryVisible(this._glossaryTypeId, c.id) &&
                (!GF.Param.GGMHideEmptyCategory || GlossaryManager.hasUnlockedEntries(this._glossaryTypeId, c.id))
            );
            const paramList = [];
            for (let i = 0; i < visibleCategories.length; i++) {
                const cat = visibleCategories[i];
                const param = {
                    symbol: cat.id,
                    bitmap: (bitmapOverrides && bitmapOverrides[cat.id]) || '',
                    name: cat.name,
                    enable: true,
                    ext: null
                };
                paramList.push(param);
            }
            return paramList;
        }

        categoryId() {
            return this.currentSymbol() || null;
        }

        currentCategoryId() {
            return this.categoryId();
        }

        // --- 兼容 Window 接口（Window_Base 的 resetInitParamData 在精灵模式下不需要） ---
        resetInitParamData() {}

        selectCategory(categoryId) {
            if (!categoryId || !this._commandList) return;
            for (let i = 0; i < this._commandList.length; i++) {
                const cmd = this._commandList[i];
                if (cmd._symbol === categoryId) {
                    this.select(i);
                    break;
                }
            }
        }

        createNameSprite() {}
        refreshNameSprite() {}
        canSelectAndOk() { return true; }

        /**
         * 条目窗口激活期间，分类按钮忽略全部键盘输入（方向键只控制条目列表光标），
         * 分类切换通过鼠标点击按钮完成。
         */
        isKeyboardBlocked() {
            return !!(this._entryWindow && this._entryWindow.active);
        }

        canCusorMove() { return !this.isKeyboardBlocked(); }
        canExCusorMove() { return !this.isKeyboardBlocked(); }
        canHandling() { return !this.isKeyboardBlocked(); }

        cursorUp() {
            const max = this._commands.length;
            if (max <= 0) return;
            this.select((this._index + max - 1) % max);
        }

        cursorDown() {
            const max = this._commands.length;
            if (max <= 0) return;
            this.select((this._index + 1) % max);
        }

        update() {
            if (!this._commands || this._commands.length === 0) {
                this._index = -1;
            }
            if (typeof Sprite_CommandWindow.prototype.update === 'function') {
                Sprite_CommandWindow.prototype.update.call(this);
            }
        }
    }

    //=========================================================================
    // Sprite_GFGlossaryList — 按钮式词典列表
    //=========================================================================

    class Sprite_GFGlossaryList extends Sprite_CommandWindow {
        initialize() {
            const btnSet = GF.Param.GGMGlossaryListButtonSet;
            this._glossaryTypeList = [];
            // 构建贴图覆盖查找表
            this._bitmapOverrides = {};
            const overrideList = GF.Param.GGMGlossaryListButtonList || [];
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

        refresh() {
            this._glossaryTypeList = GlossaryManager.getVisibleGlossaryTypes();
            this.clearCommandList();
            this._commandList = [];
            this.makeCommandList();
            if (typeof this.refreshCommandVisible === 'function') {
                this.refreshCommandVisible();
            }
        }

        extractBtnParamList(bitmapOverrides) {
            const paramList = [];
            const types = GlossaryManager.getVisibleGlossaryTypes();
            for (let i = 0; i < types.length; i++) {
                const typeId = this._glossaryTypeList[i];
                const name = GlossaryManager.getGlossaryName(typeId);
                const symbol = String(typeId);
                const param = {
                    symbol: symbol,
                    bitmap: (bitmapOverrides && bitmapOverrides[symbol]) || '',
                    name: name,
                    enable: true,
                    ext: typeId
                };
                paramList.push(param);
            }
            return paramList;
        }

        currentTypeId() {
            const symbol = this.currentSymbol();
            return symbol ? Number(symbol) : 0;
        }

        selectType(typeId) {
            const symbol = String(typeId);
            if (!this._commandList) return;
            for (let i = 0; i < this._commandList.length; i++) {
                const cmd = this._commandList[i];
                if (cmd._symbol === symbol) {
                    this.select(i);
                    break;
                }
            }
        }

        // --- 兼容 Window 接口 ---
        resetInitParamData() {}

        createNameSprite() {}
        refreshNameSprite() {}
        canSelectAndOk() { return true; }
        canCusorMove() { return true; }
        canExCusorMove() { return true; }
        canHandling() { return true; }

        cursorUp() {
            const max = this._commands.length;
            if (max <= 0) return;
            this.select((this._index + max - 1) % max);
        }

        cursorDown() {
            const max = this._commands.length;
            if (max <= 0) return;
            this.select((this._index + 1) % max);
        }

        maxItems() {
            return this._glossaryTypeList ? this._glossaryTypeList.length : 0;
        }

        update() {
            if (!this._commands || this._commands.length === 0) {
                this._index = -1;
            }
            if (typeof Sprite_CommandWindow.prototype.update === 'function') {
                Sprite_CommandWindow.prototype.update.call(this);
            }
        }
    }

    //=========================================================================
    // Scene_GFGlossary
    //=========================================================================

    class Scene_GFGlossary extends Scene_MenuBase {
        create() {
            super.create();
            this.createMainLayout(GF.Param.GGMMainLayoutFile);
            this.createHelpWindow();
            this.createGlossaryListWindow();
            this.createCategoryWindow();
            this.createEntryWindow();
            this.createContentWindow();
            this.createCompleteWindow();
            this._determineLayout();
        }

        createHelpWindow() {
            this._helpWindow = new Window_GFGlossaryHelp();
            this.addWindow(this._helpWindow);
        }

        createGlossaryListWindow() {
            const useButtonMode = GF.Param.GGMGlossaryListMode === '按钮';
            if (useButtonMode && typeof Sprite_CommandWindow !== 'undefined') {
                this._listWindow = new Sprite_GFGlossaryList();
            } else {
                if (useButtonMode) {
                    console.warn('GF_ExternalGlossary: 词典列表按钮模式需要 GF_1_CoreOfSpriteUI，已自动回退到窗口模式');
                }
                this._listWindow = new Window_GFGlossaryList();
            }
            this._listWindow.setHandler('ok', this.onListOk.bind(this));
            this._listWindow.setHandler('cancel', this.popScene.bind(this));
            this.addWindow(this._listWindow);
        }

        createCategoryWindow() {
            const useButtonMode = GF.Param.GGMCategoryMode === '按钮';
            if (useButtonMode && typeof Sprite_CommandWindow !== 'undefined') {
                this._categoryWindow = new Sprite_GFGlossaryCategory();
            } else {
                if (useButtonMode) {
                    console.warn('GF_ExternalGlossary: 按钮分类模式需要 GF_1_CoreOfSpriteUI，已自动回退到窗口模式');
                }
                this._categoryWindow = new Window_GFGlossaryCategory();
            }
            this._categoryWindow.setHandler('ok', this.onCategoryOk.bind(this));
            this._categoryWindow.setHandler('cancel', this.onCategoryCancel.bind(this));
            // 仅窗口模式下分类光标移动触发自动刷新；按钮模式不触发
            if (typeof this._categoryWindow.setCursorMoveHandler === 'function') {
                this._categoryWindow.setCursorMoveHandler(this._onCategoryCursorMove.bind(this));
            }
            this.addWindow(this._categoryWindow);
        }

        createEntryWindow() {
            this._entryWindow = new Window_GFGlossaryEntry();
            this._entryWindow.setHandler('ok', this.onEntryOk.bind(this));
            this._entryWindow.setHandler('cancel', this.onEntryCancel.bind(this));
            this._entryWindow.setCursorMoveHandler(this._onEntryCursorMove.bind(this));
            this.addWindow(this._entryWindow);
            // 按钮模式下：让分类按钮精灵感知条目窗口的激活状态。
            // 条目窗口激活期间，分类按钮忽略全部键盘输入（方向键只控制条目列表），
            // 分类切换通过鼠标点击按钮完成。
            if (GF.Param.GGMCategoryMode === '按钮' && this._categoryWindow) {
                this._categoryWindow._entryWindow = this._entryWindow;
            }
        }

        createContentWindow() {
            this._contentWindow = new Window_GFGlossaryContent();
            this._contentWindow.setHandler('cancel', this.onContentCancel.bind(this));
            this.addWindow(this._contentWindow);
        }

        createCompleteWindow() {
            this._completeWindow = new Window_GFGlossaryComplete();
            this.addWindow(this._completeWindow);
        }

        _determineLayout() {
            const allTypes = GlossaryManager.getGlossaryTypes();
            const visibleTypes = GlossaryManager.getVisibleGlossaryTypes();
            const openType = $gameSystem._glossaryOpenType || 0;
            const openCategory = $gameSystem._glossaryOpenCategory || null;
            const openEntry = $gameSystem._glossaryOpenEntry || 0;

            $gameSystem._glossaryOpenType = 0;
            $gameSystem._glossaryOpenCategory = null;
            $gameSystem._glossaryOpenEntry = 0;

            if (allTypes.length === 0) {
                this._helpWindow.setText('没有可用的词典数据。');
                this._listWindow.hide();
                this._categoryWindow.hide();
                this._entryWindow.hide();
                this._contentWindow.hide();
                this._completeWindow.hide();
                return;
            }

            if (visibleTypes.length === 0) {
                // 所有词典均无已解锁条目，显示空列表+提示，仍可取消返回
                this._showGlossaryList();
                this._helpWindow.setText('所有词典暂无已解锁的条目。');
                return;
            }

            if (openType > 0 && allTypes.includes(openType)) {
                this._setBackPicture(openType);
                this._showGlossaryBrowse(openType, openCategory, openEntry);
            } else {
                this._showGlossaryList();
            }
        }

        _showGlossaryList() {
            this._listWindow.refresh();
            this._listWindow.show();
            this._listWindow.activate();
            if (typeof this._listWindow.maxItems === 'function' && this._listWindow.maxItems() > 0) {
                this._listWindow.select(0);
            }
            this._categoryWindow.hide();
            this._entryWindow.hide();
            this._contentWindow.hide();
            this._completeWindow.hide();
            this._helpWindow.setText('');
        }

        _showGlossaryBrowse(typeId, categoryId, entryId) {
            const glossary = GlossaryManager.getGlossary(typeId);
            if (!glossary) return;

            this._currentTypeId = typeId;

            if (GlossaryManager.getGlossaryCount() > 1 && !GF.Param.GGMHideListSingleGlossary) {
                this._listWindow.refresh();
                this._listWindow.show();
                this._listWindow.selectType(typeId);
                this._listWindow.deactivate();
            } else {
                this._listWindow.hide();
            }

            if (glossary.useCategory && glossary.categories && glossary.categories.length > 0 && this._hasVisibleCategories(typeId)) {
                this._showWithCategory(typeId, categoryId, entryId);
            } else {
                this._showWithoutCategory(typeId, entryId);
            }
        }

        _hasVisibleCategories(typeId) {
            const categories = GlossaryManager.getCategories(typeId);
            const visible = categories.filter(c =>
                GlossaryManager.isCategoryVisible(typeId, c.id) &&
                (!GF.Param.GGMHideEmptyCategory || GlossaryManager.hasUnlockedEntries(typeId, c.id))
            );
            return visible.length > 0;
        }

        _showWithCategory(typeId, categoryId, entryId) {
            const useButtonMode = GF.Param.GGMCategoryMode === '按钮';
            this._categoryWindow.show();
            if (!useButtonMode) {
                this._categoryWindow.resetInitParamData();
            }
            this._categoryWindow.setTypeId(typeId);
            if (categoryId) {
                this._categoryWindow.selectCategory(categoryId);
            }
            this._categoryWindow.activate();

            const selCategoryId = this._categoryWindow.currentCategoryId();
            this._entryWindow.setFilter(typeId, selCategoryId);
            this._entryWindow.show();
            this._entryWindow.resetInitParamData();
            if (entryId > 0) {
                this._entryWindow.selectEntry(entryId);
            }
            if (useButtonMode) {
                this._entryWindow.activate();
            } else {
                this._entryWindow.deactivate();
            }

            this._contentWindow.show();
            this._contentWindow.resetInitParamData();
            const selEntryId = this._entryWindow.currentEntryId();
            if (selEntryId > 0) {
                this._contentWindow.setItem(typeId, selEntryId, 0);
            }

            this._completeWindow.show();
            this._completeWindow.resetInitParamData();
            this._completeWindow.setFilter(typeId, selCategoryId || null);
            if (GF.Param.GGMCompleteDisplay === 'none') this._completeWindow.hide();

            const glossary = GlossaryManager.getGlossary(typeId);
            this._helpWindow.setText(glossary.categoryHelp || glossary.glossaryHelp || '');
        }

        _showWithoutCategory(typeId, entryId) {
            this._categoryWindow.hide();

            this._entryWindow.setFilter(typeId, null);
            this._entryWindow.show();
            this._entryWindow.resetInitParamData();
            if (entryId > 0) {
                this._entryWindow.selectEntry(entryId);
            }
            this._entryWindow.activate();

            this._contentWindow.show();
            this._contentWindow.resetInitParamData();
            const selEntryId = this._entryWindow.currentEntryId();
            if (selEntryId > 0) {
                this._contentWindow.setItem(typeId, selEntryId, 0);
            }

            this._completeWindow.show();
            this._completeWindow.resetInitParamData();
            this._completeWindow.setFilter(typeId, null);
            if (GF.Param.GGMCompleteDisplay === 'none') this._completeWindow.hide();

            const glossary = GlossaryManager.getGlossary(typeId);
            this._helpWindow.setText(glossary.glossaryHelp || '');
        }

        onListOk() {
            const typeId = this._listWindow.currentTypeId();
            if (typeId > 0) {
                this._setBackPicture(typeId);
                this._showGlossaryBrowse(typeId, null, 0);
            }
        }

        onCategoryOk() {
            const useButtonMode = GF.Param.GGMCategoryMode === '按钮';
            if (!useButtonMode) {
                this._categoryWindow.deactivate();
            }
            const typeId = this._currentTypeId;
            const categoryId = this._categoryWindow.currentCategoryId();
            this._entryWindow.setFilter(typeId, categoryId);
            if (!useButtonMode) {
                this._entryWindow.activate();
            }
        }

        onCategoryCancel() {
            if (GlossaryManager.getGlossaryCount() > 1) {
                this._showGlossaryList();
            } else {
                this.popScene();
            }
        }

        onEntryOk() {
            this._entryWindow.deactivate();
            // 按钮模式下停用分类精灵，防止其拦截取消键
            if (GF.Param.GGMCategoryMode === '按钮') {
                this._categoryWindow.deactivate();
            }
            this._contentWindow.activate();
        }

        onEntryCancel() {
            this._entryWindow.deactivate();
            const useButtonMode = GF.Param.GGMCategoryMode === '按钮';
            if (useButtonMode) {
                // 按钮模式下，取消直接回到词典列表或退出
                if (GlossaryManager.getGlossaryCount() > 1) {
                    this._showGlossaryList();
                } else {
                    this.popScene();
                }
            } else {
                const glossary = GlossaryManager.getGlossary(this._currentTypeId);
                if (glossary && glossary.useCategory && glossary.categories && glossary.categories.length > 0) {
                    this._categoryWindow.activate();
                } else if (GlossaryManager.getGlossaryCount() > 1) {
                    this._showGlossaryList();
                } else {
                    this.popScene();
                }
            }
        }

        onContentCancel() {
            this._contentWindow.deactivate();
            // 按钮模式下恢复分类精灵的激活状态
            if (GF.Param.GGMCategoryMode === '按钮') {
                this._categoryWindow.activate();
            }
            this._entryWindow.activate();
        }

        // ---- 光标移动自动刷新 ----

        /**
         * 分类窗口光标移动时，自动刷新条目列表和内容
         */
        _onCategoryCursorMove() {
            const typeId = this._currentTypeId;
            if (!typeId) return;
            const categoryId = this._categoryWindow.currentCategoryId();
            this._entryWindow.setFilter(typeId, categoryId);
            this._completeWindow.setFilter(typeId, categoryId);
            const selEntryId = this._entryWindow.currentEntryId();
            this._contentWindow.setItem(typeId, selEntryId > 0 ? selEntryId : 0);
        }

        /**
         * 条目窗口光标移动时，自动刷新内容
         */
        _onEntryCursorMove() {
            const typeId = this._currentTypeId;
            if (!typeId) return;
            const entryId = this._entryWindow.currentEntryId();
            if (entryId > 0) {
                this._contentWindow.setItem(typeId, entryId);
            }
        }

        startAllPartInvert() {
            const delay = GF.Param.GGMPopDelay;
            if (delay === 0) return;
            this.setPopDelay(delay);
            super.startAllPartInvert();
        }

        _setBackPicture(typeId) {
            if (this._backPictureSprite) {
                this.removeChild(this._backPictureSprite);
                this._backPictureSprite = null;
            }
            const glossary = GlossaryManager.getGlossary(typeId);
            if (glossary && glossary.backPicture) {
                const bitmap = ImageManager.loadPicture(glossary.backPicture);
                const sprite = new Sprite(bitmap);
                sprite.x = 0;
                sprite.y = 0;
                sprite.opacity = glossary.backPictureOpacity !== undefined ? glossary.backPictureOpacity : 255;
                sprite.scale.x = Graphics.width / bitmap.width;
                sprite.scale.y = Graphics.height / bitmap.height;
                this._backPictureSprite = sprite;
                this.addChildAt(sprite, 0);
            }
        }
    }

    // 对话文本自动解锁 — 钩子
    if (typeof Window_Message !== 'undefined') {
        const _startMessage = Window_Message.prototype.startMessage;
        Window_Message.prototype.startMessage = function () {
            _startMessage.call(this);
            if (GF.Param.GGMDialogueAutoUnlock) {
                GlossaryManager.checkDialogueForAutoUnlock($gameMessage.allText());
            }
        };
    }

    //=========================================================================
    // Scene_GFGlossaryReading — 阅读弹窗场景（透明背景，覆盖在当前场景之上）
    //=========================================================================

    // 场景类 — 用 ES5 函数构造模式，避免 class extends 的兼容问题
    var Scene_GFGlossaryReading = function () {
        this.initialize.apply(this, arguments);
    };

    Scene_GFGlossaryReading.prototype = Object.create(Scene_Base.prototype);
    Scene_GFGlossaryReading.prototype.constructor = Scene_GFGlossaryReading;

    Scene_GFGlossaryReading.prototype.initialize = function () {
        Scene_Base.prototype.initialize.call(this);
    };

    Scene_GFGlossaryReading.prototype.create = function () {
        Scene_Base.prototype.create.call(this);
        this._closeReady = false; // 延迟一帧再接受关闭输入
        this.createDisplayBackground();
        this.createWindowLayer();
        this.createReadingWindow();
    };

    Scene_GFGlossaryReading.prototype.createDisplayBackground = function () {
        // 使用 SceneManager 保存的截图作为背景
        var bg = SceneManager._backgroundBitmap;
        if (bg) {
            var sprite = new Sprite(bg);
            sprite.x = 0;
            sprite.y = 0;
            this.addChild(sprite);
            this._bgSprite = sprite;
        }
    };

    Scene_GFGlossaryReading.prototype.createWindowLayer = function () {
        this._windowLayer = new WindowLayer();
        this._windowLayer.x = this._windowLayer.y = 0;
        this.addChild(this._windowLayer);
    };

    Scene_GFGlossaryReading.prototype.createReadingWindow = function () {
        this._readingWindow = new Window_GFGlossaryReading();
        this._readingWindow._handlers = this._readingWindow._handlers || {};
        this._readingWindow._handlers['ok'] = this.popScene.bind(this);
        this._readingWindow._handlers['cancel'] = this.popScene.bind(this);
        this._windowLayer.addChild(this._readingWindow);

        // 从暂存数据中读取要显示的条目
        var data = $gameTemp._glossaryReadingData;
        if (data && data.typeId && data.entryId) {
            this._readingWindow.setEntry(data.typeId, data.entryId);
        }
        $gameTemp._glossaryReadingData = null;
    };

    Scene_GFGlossaryReading.prototype.update = function () {
        Scene_Base.prototype.update.call(this);
        // 收起动画播放中：等待 GF 窗口核心的回调触发退出，
        // 另加一个兜底计时（600 帧 = 10 秒）防止动画回调意外未触发导致卡死。
        if (this._closing) {
            this._closeTimer++;
            if (this._closeTimer >= 600) {
                this._closing = false;
                this._doPopScene();
            }
            return;
        }
        if (!this._closeReady) {
            this._closeReady = true;
            return;
        }
        // 支持键盘（Enter/Esc）和触摸（点击/右键）关闭
        if (Input.isTriggered('ok') || Input.isTriggered('cancel') || Input.isTriggered('escape') ||
            TouchInput.isTriggered() || TouchInput.isCancelled()) {
            this.popScene();
        }
    };

    Scene_GFGlossaryReading.prototype.popScene = function () {
        if (this._closing) return; // 防止重复触发
        var w = this._readingWindow;
        if (w && w.initParamData && w.initParamData()) {
            // 使用 GF 窗口核心的收起动画：倒放窗口初始化动画（移动/透明度），
            // 动画时长由阅读弹窗窗口设置的移动时间（WindowMoving.MoveTime）决定，
            // 播放完毕后通过 processInitParamCallBack 回调退出场景。
            this._closing = true;
            this._closeTimer = 0;
            w.deactivate();
            w.processInitParamCallBack(this._doPopScene.bind(this));
            w.invertInitParamData();
        } else {
            this._doPopScene();
        }
    };

    Scene_GFGlossaryReading.prototype._doPopScene = function () {
        SceneManager.pop();
    };

    window.Scene_GFGlossary = Scene_GFGlossary;
    window.Scene_GFGlossaryReading = Scene_GFGlossaryReading;
    window.GlossaryManager = GlossaryManager;

})();
