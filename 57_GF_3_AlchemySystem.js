//=============================================================================
// GF Plugins
// 57_GF_3_AlchemySystem.js
//=============================================================================

var Imported = Imported || {};
Imported['57_GF_3_AlchemySystem'] = true;

var GF = GF || {};
GF.AHS = GF.AHS || {};
GF.AHS.version = 1.00;
GF.AHS.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.00]        玩法 - 合成系统
 * @author 57 & deepseek
 * @url https://afdian.net/a/ganfly
 * @orderAfter GF_1_CoreOfWindowUI
 * @base GF_1_CoreOfWindowUI
 * @orderAfter GF_0_CoreOfGame
 * @base GF_0_CoreOfGame
 * @orderAfter GF_2_CoreOfMapEvent
 * @base GF_2_CoreOfMapEvent
 *
 * @help
 * ============================================================================
 * 介绍
 * ============================================================================
 *
 * 合成系统允许玩家将收集到的材料道具合成为更高级的道具、武器或防具。
 * 本插件支持多合成菜单（如铁匠铺、炼金铺等），每个菜单的数据从
 * dataEx/Alchemy/ 目录下的独立 JSON 文件导入。
 *
 * 功能特色：
 * - 多合成菜单类型（铁匠铺/炼金铺/裁缝铺等）
 * - 外部 JSON 数据文件，无需在插件参数中编辑配方
 * - 配方分类浏览（自定义分类 / 按产出类型自动分类）
 * - 数量选择（考虑材料库存和金币上限）
 * - 合成动画与音效
 * - 可自定义的 GF 窗口 UI（尺寸、位置、动画、皮肤）
 * - 可选的装备作为材料消耗
 * - 金币窗口显示
 *
 * ============================================================================
 * 前置需求
 * ============================================================================
 *
 * 本插件是第 3 层插件，必须放在第 0、1、2 层 GF 插件的下面，
 * 所有第 4、5 层 GF 插件的上面。
 *
 * 必须前置插件：
 *  GF_0_CoreOfGame       系统 - 游戏核心（基础依赖）
 *  GF_1_CoreOfWindowUI   系统 - 窗口UI核心（窗口动画、皮肤、滚动条）
 *  GF_2_CoreOfMapEvent   系统 - 地图事件核心（可选，用于交互）
 *
 * ---- 可扩展插件列表 ----
 *
 * GF_2_CoreOfMainMenu    系统 - 主菜单核心
 *
 *     可以在主菜单设置进入合成菜单的按钮
 *     关键字：alchemy
 *     按钮名称：return '合成';
 *     是否显示按钮：return Imported['57_GF_3_AlchemySystem'];
 *     是否允许激活按钮：return true;
 *     按钮激活后效果：运行代码
 *     按钮激活运行代码：SceneManager.push(Scene_Alchemy);
 *
 * ============================================================================
 * 数据文件格式
 * ============================================================================
 *
 * 合成菜单数据保存在 dataEx/Alchemy/*.json 文件中。
 * 每个 .json 文件对应一个独立的合成菜单。
 *
 * 通过插件参数『合成数据文件列表』注册每个数据文件路径。
 *
 * 详细 JSON 结构请参考插件同级目录下的需求文档：
 *   57_GF_3_AlchemySystem_需求文档.md
 *
 * ============================================================================
 * 插件指令
 * ============================================================================
 *
 * 以下指令可在事件编辑器的「插件指令」中找到（按 @text 显示名称）。
 *
 * 打开合成菜单（OpenAlchemyMenu）
 *   - 参数「类型ID」：合成菜单类型标识（如 blacksmith、alchemy）
 *   - 留空则显示菜单选择列表
 *
 * 解锁配方（UnlockRecipe）
 *   - 参数「类型ID」：合成菜单类型标识
 *   - 参数「配方ID」：要解锁的配方 ID
 *
 * 锁定配方（LockRecipe）
 *   - 参数「类型ID」：合成菜单类型标识
 *   - 参数「配方ID」：要锁定的配方 ID
 *
 * 全部解锁（UnlockAllRecipes）
 *   - 参数「类型ID」：合成菜单类型标识
 *
 * 全部锁定（LockAllRecipes）
 *   - 参数「类型ID」：合成菜单类型标识
 *
 * 启用合成菜单（EnableAlchemyMenu）
 *   - 参数「类型ID」：合成菜单类型标识
 *
 * 禁用合成菜单（DisableAlchemyMenu）
 *   - 参数「类型ID」：合成菜单类型标识
 *
 * 刷新合成数据（ReloadAlchemyData）
 *   - 无参数
 *
 * ============================================================================
 * 脚本接口
 * ============================================================================
 *
 * AlchemyManager.open(menuType)
 *    打开指定类型的合成界面，menuType 为菜单标识字符串
 *    例：AlchemyManager.open("blacksmith")
 *
 * AlchemyManager.openMenuList()
 *    打开菜单选择列表界面
 *
 * AlchemyManager.isRecipeUnlocked(menuType, recipeId)
 *    指定菜单中的某个配方是否已解锁
 *
 * AlchemyManager.setRecipeUnlocked(menuType, recipeId, unlocked)
 *    设置配方的解锁状态
 *
 * AlchemyManager.unlockAllRecipes(menuType)
 *    解锁指定菜单的所有配方
 *
 * AlchemyManager.lockAllRecipes(menuType)
 *    锁定指定菜单的所有配方
 *
 * AlchemyManager.isMenuEnabled(menuType)
 *    指定菜单是否已启用
 *
 * AlchemyManager.setMenuEnabled(menuType, enabled)
 *    设置菜单的启用状态
 *
 * AlchemyManager.getMenuTypes()
 *    获取所有已加载的菜单类型标识数组
 *
 * AlchemyManager.getMenuData(menuType)
 *    获取指定菜单的数据对象（只读）
 *
 * AlchemyManager.getRecipe(menuType, recipeId)
 *    获取指定配方的数据对象
 *
 * AlchemyManager.canMakeRecipe(menuType, recipeId)
 *    判断当前是否满足指定配方的合成条件（材料+金币）
 *
 * AlchemyManager.getMaxMakeCount(menuType, recipeId)
 *    获取当前可合成的最大数量
 *
 * AlchemyManager.makeItem(menuType, recipeId, count)
 *    执行合成，消耗材料+金币，获得产出物品
 *    返回 boolean 表示是否成功
 *
 * AlchemyManager.reloadData()
 *    重新加载 dataEx/Alchemy/ 下的所有 JSON 文件
 *
 * ============================================================================
 * 备注标签（notetag）
 * ============================================================================
 *
 * 本插件使用外部 JSON 文件配置配方，不需要在数据备注栏中写入标签。
 * 但插件指令中使用到的开关 ID，需要确保在 RMMZ 数据库的「开关」页面中
 * 预先定义好对应的开关用途。
 *
 * ============================================================================
 * 兼容性
 * ============================================================================
 *
 * 与 GF 系列所有第 4/5 层插件兼容。
 * 合成执行时触发 gainItem / loseItem 等标准 RMMZ 接口，可被其他插件拦截。
 *
 * @command OpenAlchemyMenu
 * @text 打开合成菜单
 * @desc 打开合成界面。可指定类型ID打开特定菜单（如 blacksmith），留空显示菜单选择列表。
 *
 * @arg MenuType
 * @text 类型ID
 * @type string
 * @desc 合成菜单类型标识（如 blacksmith、alchemy）。留空则显示菜单选择列表。
 * @default
 *
 * @ --------------------------------------------------------------------------
 *
 * @command UnlockRecipe
 * @text 解锁配方
 * @desc 解锁指定菜单中的指定配方。
 *
 * @arg MenuType
 * @text 类型ID
 * @type string
 * @desc 合成菜单类型标识。
 * @default
 *
 * @arg RecipeId
 * @text 配方ID
 * @type number
 * @min 1
 * @desc 要解锁的配方ID。
 * @default 1
 *
 * @ --------------------------------------------------------------------------
 *
 * @command LockRecipe
 * @text 锁定配方
 * @desc 锁定指定菜单中的指定配方。
 *
 * @arg MenuType
 * @text 类型ID
 * @type string
 * @desc 合成菜单类型标识。
 * @default
 *
 * @arg RecipeId
 * @text 配方ID
 * @type number
 * @min 1
 * @desc 要锁定的配方ID。
 * @default 1
 *
 * @ --------------------------------------------------------------------------
 *
 * @command UnlockAllRecipes
 * @text 全部解锁
 * @desc 解锁指定菜单的所有配方。
 *
 * @arg MenuType
 * @text 类型ID
 * @type string
 * @desc 合成菜单类型标识。
 * @default
 *
 * @ --------------------------------------------------------------------------
 *
 * @command LockAllRecipes
 * @text 全部锁定
 * @desc 锁定指定菜单的所有配方。
 *
 * @arg MenuType
 * @text 类型ID
 * @type string
 * @desc 合成菜单类型标识。
 * @default
 *
 * @ --------------------------------------------------------------------------
 *
 * @command EnableAlchemyMenu
 * @text 启用合成菜单
 * @desc 启用指定合成菜单。
 *
 * @arg MenuType
 * @text 类型ID
 * @type string
 * @desc 合成菜单类型标识。
 * @default
 *
 * @ --------------------------------------------------------------------------
 *
 * @command DisableAlchemyMenu
 * @text 禁用合成菜单
 * @desc 禁用指定合成菜单。
 *
 * @arg MenuType
 * @text 类型ID
 * @type string
 * @desc 合成菜单类型标识。
 * @default
 *
 * @ --------------------------------------------------------------------------
 *
 * @command ReloadAlchemyData
 * @text 刷新合成数据
 * @desc 重新加载 dataEx/Alchemy/ 下所有 JSON 文件。
 *
 * @param GeneralSet
 * @text ── 一般设置 ──
 *
 * @param DefaultMenuType
 * @parent GeneralSet
 * @text 默认合成类型
 * @desc 主菜单打开时使用的合成菜单类型。留空则尝试打开第一个可用的菜单。
 * @default ""
 *
 * @param CommandText
 * @parent GeneralSet
 * @text 菜单文本
 * @desc 主菜单中显示的合成命令文本。
 * @default 合成
 *
 * @param EnableSwitchId
 * @parent GeneralSet
 * @text 启用开关ID
 * @type switch
 * @desc 控制合成菜单是否在主菜单显示（0=始终显示）。
 * @default 0
 *
 * @param ShowCategoryWindow
 * @parent GeneralSet
 * @text 显示分类窗口
 * @type boolean
 * @desc 是否在合成界面显示分类筛选窗口。
 * @default true
 *
 * @param ShowHelpWindow
 * @parent GeneralSet
 * @text 显示帮助窗口
 * @type boolean
 * @desc 是否在合成界面顶部显示帮助文本窗口。
 * @default true
 *
 * @param ShowGoldWindow
 * @parent GeneralSet
 * @text 显示金币窗口
 * @type boolean
 * @desc 是否在合成界面显示金币窗口。
 * @default true
 *
 * @param NotifyStyleId
 * @parent GeneralSet
 * @text 通知样式ID
 * @type number
 * @min 0
 * @desc 合成成功时推送通知的样式ID（0=不推送通知），对应GF_3_ToastSystem的样式ID。
 * @default 1
 *
 * @param TextSet
 * @text ── 用语设置 ──
 *
 * @param RequiredMaterialText
 * @parent TextSet
 * @text 必要素材文本
 * @desc 材料区域标题文本。
 * @default 必要素材：
 *
 * @param RequiredCostText
 * @parent TextSet
 * @text 必要费用文本
 * @desc 费用区域标题文本。
 * @default 必要费用：
 *
 * @param OutputText
 * @parent TextSet
 * @text 产出文本
 * @desc 产出物品区域标题文本。
 * @default 产出物品：
 *
 * @param CountText
 * @parent TextSet
 * @text 持有数文本
 * @desc 持有数量标签。
 * @default 持有数：
 *
 * @param UnknownRecipeText
 * @parent TextSet
 * @text 未解锁文本
 * @desc 未解锁配方显示文本。
 * @default ???
 *
 * @param GoldUnit
 * @parent TextSet
 * @text 金币单位
 * @desc 金币单位文本。
 * @default G
 *
 * @param MaxCountText
 * @parent TextSet
 * @text 最大可合成数文本
 * @desc 数量选择窗口中的最大可合成数提示文本。
 * @default 最大可合成数：
 *
 * @param ConfirmText
 * @parent TextSet
 * @text 确认文本
 * @desc 数量选择窗口的确认按钮文本。
 * @default 确认
 *
 * @param CancelText
 * @parent TextSet
 * @text 取消文本
 * @desc 数量选择窗口的取消按钮文本。
 * @default 取消
 *
 * @param CategoryText
 * @parent TextSet
 * @text 全部分类文本
 * @desc 分类窗口中"全部"选项的显示文本。
 * @default 全部
 *
 * @param ItemCategoryText
 * @parent TextSet
 * @text 道具分类文本
 * @desc 按产出类型自动分类时，"道具"分类的显示文本。
 * @default 道具
 *
 * @param WeaponCategoryText
 * @parent TextSet
 * @text 武器分类文本
 * @desc 按产出类型自动分类时，"武器"分类的显示文本。
 * @default 武器
 *
 * @param ArmorCategoryText
 * @parent TextSet
 * @text 防具分类文本
 * @desc 按产出类型自动分类时，"防具"分类的显示文本。
 * @default 防具
 *
 * @param KeyItemCategoryText
 * @parent TextSet
 * @text 贵重品分类文本
 * @desc 按产出类型自动分类时，"贵重品"分类的显示文本。
 * @default 贵重品
 *
 * @param NotifyText
 * @parent TextSet
 * @text 通知文本
 * @desc 合成成功时的通知文本（%1=产出名称，%2=合成数量）。
 * @default 合成%1×%2
 *
 * @param SESet
 * @text ── 音效设置 ──
 *
 * @param CraftSE
 * @parent SESet
 * @text 合成SE文件名
 * @type file
 * @dir audio/se/
 * @desc 合成时播放的 SE 文件名。
 * @default Heal5
 *
 * @param CraftSEVolume
 * @parent SESet
 * @text 合成SE音量
 * @type number
 * @min 0
 * @max 100
 * @decimals 0
 * @desc 合成 SE 的音量（0-100）。
 * @default 90
 *
 * @param CraftSEPitch
 * @parent SESet
 * @text 合成SE音高
 * @type number
 * @min 50
 * @max 150
 * @decimals 0
 * @desc 合成 SE 的音高（50-150）。
 * @default 100
 *
 * @param CraftSEPan
 * @parent SESet
 * @text 合成SE声相
 * @type number
 * @min -100
 * @max 100
 * @decimals 0
 * @desc 合成 SE 的声相（-100~100）。
 * @default 0
 *
 * @param DataFileSet
 * @text ── 数据文件列表 ──
 *
 * @param AlchemyFileList
 * @parent DataFileSet
 * @text 合成数据文件列表
 * @type struct<AlchemyFile>[]
 * @desc 注册每个合成菜单的数据文件路径（dataEx/Alchemy/ 下的相对路径）。
 * @default ["{\"menuType\":\"blacksmith\",\"file\":\"Alchemy/blacksmith.json\"}", "{\"menuType\":\"alchemy\",\"file\":\"Alchemy/alchemy.json\"}"]
 *
 * @param HelpWindowSet
 * @text ── 帮助窗口 ──
 *
 * @param HelpX
 * @parent HelpWindowSet
 * @text X坐标
 * @type number
 * @desc 窗口X坐标（像素）。
 * @default 0
 *
 * @param HelpY
 * @parent HelpWindowSet
 * @text Y坐标
 * @type number
 * @desc 窗口Y坐标（像素）。
 * @default 0
 *
 * @param HelpWidth
 * @parent HelpWindowSet
 * @text 宽度
 * @type number
 * @min 50
 * @desc 窗口宽度（像素）。
 * @default 1920
 *
 * @param HelpHeight
 * @parent HelpWindowSet
 * @text 高度
 * @type number
 * @min 50
 * @desc 窗口高度（像素）。
 * @default 80
 *
 * @param HelpFontSize
 * @parent HelpWindowSet
 * @text 字体大小
 * @type number
 * @min 1
 * @desc 窗口字体大小。
 * @default 22
 *
 * @param HelpFontFace
 * @parent HelpWindowSet
 * @text 字体名称
 * @desc 窗口字体名称，留空使用默认字体。
 * @default
 *
 * @param HelpLineHeight
 * @parent HelpWindowSet
 * @text 行高
 * @type number
 * @min 1
 * @desc 窗口行高。
 * @default 36
 *
 * @param HelpMoving
 * @parent HelpWindowSet
 * @text 窗口移动动画
 * @type struct<WindowMoving>
 * @desc 窗口入场动画。
 * @default {"MoveType":"不移动","MoveTime":"20","MoveDelay":"0","OpacityLock":"false","CoordinateType":"相对坐标","SlideX":"0","SlideY":"0","SlideAbsoluteX":"0","SlideAbsoluteY":"0"}
 *
 * @param HelpLayout
 * @parent HelpWindowSet
 * @text 窗口布局
 * @type struct<WindowLayout>
 * @desc 窗口背景与皮肤。
 * @default {"LayoutType":"默认皮肤","BackgroundFile":"","BackgroundX":"0","BackgroundY":"0"}
 *
 * @param CategoryWindowSet
 * @text ── 分类窗口 ──
 *
 * @param CategoryX
 * @parent CategoryWindowSet
 * @text X坐标
 * @type number
 * @desc 窗口X坐标（像素）。
 * @default 0
 *
 * @param CategoryY
 * @parent CategoryWindowSet
 * @text Y坐标
 * @type number
 * @desc 窗口Y坐标（像素）。
 * @default 80
 *
 * @param CategoryWidth
 * @parent CategoryWindowSet
 * @text 宽度
 * @type number
 * @min 50
 * @desc 窗口宽度（像素）。
 * @default 240
 *
 * @param CategoryHeight
 * @parent CategoryWindowSet
 * @text 高度
 * @type number
 * @min 50
 * @desc 窗口高度（像素）。
 * @default 48
 *
 * @param CategoryFontSize
 * @parent CategoryWindowSet
 * @text 字体大小
 * @type number
 * @min 1
 * @desc 窗口字体大小。
 * @default 20
 *
 * @param CategoryFontFace
 * @parent CategoryWindowSet
 * @text 字体名称
 * @desc 窗口字体名称，留空使用默认字体。
 * @default
 *
 * @param CategoryLineHeight
 * @parent CategoryWindowSet
 * @text 行高
 * @type number
 * @min 1
 * @desc 窗口行高。
 * @default 36
 *
 * @param CategoryCols
 * @parent CategoryWindowSet
 * @text 列数
 * @type number
 * @min 1
 * @desc 分类窗口的显示列数（横向排列时每行显示的类别数）。
 * @default 1
 *
 * @param CategoryMoving
 * @parent CategoryWindowSet
 * @text 窗口移动动画
 * @type struct<WindowMoving>
 * @desc 窗口入场动画。
 * @default {"MoveType":"不移动","MoveTime":"20","MoveDelay":"0","OpacityLock":"false","CoordinateType":"相对坐标","SlideX":"0","SlideY":"0","SlideAbsoluteX":"0","SlideAbsoluteY":"0"}
 *
 * @param CategoryLayout
 * @parent CategoryWindowSet
 * @text 窗口布局
 * @type struct<WindowLayout>
 * @desc 窗口背景与皮肤。
 * @default {"LayoutType":"默认皮肤","BackgroundFile":"","BackgroundX":"0","BackgroundY":"0"}
 *
 * @param RecipeListWindowSet
 * @text ── 配方列表窗口 ──
 *
 * @param RecipeListX
 * @parent RecipeListWindowSet
 * @text X坐标
 * @type number
 * @desc 窗口X坐标（像素）。
 * @default 0
 *
 * @param RecipeListY
 * @parent RecipeListWindowSet
 * @text Y坐标
 * @type number
 * @desc 窗口Y坐标（像素）。
 * @default 128
 *
 * @param RecipeListWidth
 * @parent RecipeListWindowSet
 * @text 宽度
 * @type number
 * @min 50
 * @desc 窗口宽度（像素）。
 * @default 480
 *
 * @param RecipeListHeight
 * @parent RecipeListWindowSet
 * @text 高度
 * @type number
 * @min 50
 * @desc 窗口高度（像素）。
 * @default 812
 *
 * @param RecipeListFontSize
 * @parent RecipeListWindowSet
 * @text 字体大小
 * @type number
 * @min 1
 * @desc 窗口字体大小。
 * @default 22
 *
 * @param RecipeListFontFace
 * @parent RecipeListWindowSet
 * @text 字体名称
 * @desc 窗口字体名称，留空使用默认字体。
 * @default
 *
 * @param RecipeListLineHeight
 * @parent RecipeListWindowSet
 * @text 行高
 * @type number
 * @min 1
 * @desc 窗口行高。
 * @default 36
 *
 * @param RecipeListCols
 * @parent RecipeListWindowSet
 * @text 最大列数
 * @type number
 * @min 1
 * @desc 列表最大列数。
 * @default 1
 *
 * @param RecipeListMoving
 * @parent RecipeListWindowSet
 * @text 窗口移动动画
 * @type struct<WindowMoving>
 * @desc 窗口入场动画。
 * @default {"MoveType":"不移动","MoveTime":"20","MoveDelay":"0","OpacityLock":"false","CoordinateType":"相对坐标","SlideX":"0","SlideY":"0","SlideAbsoluteX":"0","SlideAbsoluteY":"0"}
 *
 * @param RecipeListLayout
 * @parent RecipeListWindowSet
 * @text 窗口布局
 * @type struct<WindowLayout>
 * @desc 窗口背景与皮肤。
 * @default {"LayoutType":"默认皮肤","BackgroundFile":"","BackgroundX":"0","BackgroundY":"0"}
 *
 * @param RecipeDetailWindowSet
 * @text ── 配方详情窗口 ──
 *
 * @param DetailX
 * @parent RecipeDetailWindowSet
 * @text X坐标
 * @type number
 * @desc 窗口X坐标（像素）。
 * @default 480
 *
 * @param DetailY
 * @parent RecipeDetailWindowSet
 * @text Y坐标
 * @type number
 * @desc 窗口Y坐标（像素）。
 * @default 128
 *
 * @param DetailWidth
 * @parent RecipeDetailWindowSet
 * @text 宽度
 * @type number
 * @min 50
 * @desc 窗口宽度（像素）。
 * @default 720
 *
 * @param DetailHeight
 * @parent RecipeDetailWindowSet
 * @text 高度
 * @type number
 * @min 50
 * @desc 窗口高度（像素）。
 * @default 812
 *
 * @param DetailFontSize
 * @parent RecipeDetailWindowSet
 * @text 字体大小
 * @type number
 * @min 1
 * @desc 窗口字体大小。
 * @default 22
 *
 * @param DetailFontFace
 * @parent RecipeDetailWindowSet
 * @text 字体名称
 * @desc 窗口字体名称，留空使用默认字体。
 * @default
 *
 * @param DetailLineHeight
 * @parent RecipeDetailWindowSet
 * @text 行高
 * @type number
 * @min 1
 * @desc 窗口行高。
 * @default 36
 *
 * @param DetailMoving
 * @parent RecipeDetailWindowSet
 * @text 窗口移动动画
 * @type struct<WindowMoving>
 * @desc 窗口入场动画。
 * @default {"MoveType":"不移动","MoveTime":"20","MoveDelay":"0","OpacityLock":"false","CoordinateType":"相对坐标","SlideX":"0","SlideY":"0","SlideAbsoluteX":"0","SlideAbsoluteY":"0"}
 *
 * @param DetailLayout
 * @parent RecipeDetailWindowSet
 * @text 窗口布局
 * @type struct<WindowLayout>
 * @desc 窗口背景与皮肤。
 * @default {"LayoutType":"默认皮肤","BackgroundFile":"","BackgroundX":"0","BackgroundY":"0"}
 *
 * @param GoldWindowSet
 * @text ── 金币窗口 ──
 *
 * @param GoldX
 * @parent GoldWindowSet
 * @text X坐标
 * @type number
 * @desc 窗口X坐标（像素）。
 * @default 1200
 *
 * @param GoldY
 * @parent GoldWindowSet
 * @text Y坐标
 * @type number
 * @desc 窗口Y坐标（像素）。
 * @default 128
 *
 * @param GoldWidth
 * @parent GoldWindowSet
 * @text 宽度
 * @type number
 * @min 50
 * @desc 窗口宽度（像素）。
 * @default 720
 *
 * @param GoldHeight
 * @parent GoldWindowSet
 * @text 高度
 * @type number
 * @min 50
 * @desc 窗口高度（像素）。
 * @default 48
 *
 * @param GoldFontSize
 * @parent GoldWindowSet
 * @text 字体大小
 * @type number
 * @min 1
 * @desc 窗口字体大小。
 * @default 20
 *
 * @param GoldFontFace
 * @parent GoldWindowSet
 * @text 字体名称
 * @desc 窗口字体名称，留空使用默认字体。
 * @default
 *
 * @param GoldLineHeight
 * @parent GoldWindowSet
 * @text 行高
 * @type number
 * @min 1
 * @desc 窗口行高。
 * @default 36
 *
 * @param GoldMoving
 * @parent GoldWindowSet
 * @text 窗口移动动画
 * @type struct<WindowMoving>
 * @desc 窗口入场动画。
 * @default {"MoveType":"不移动","MoveTime":"20","MoveDelay":"0","OpacityLock":"false","CoordinateType":"相对坐标","SlideX":"0","SlideY":"0","SlideAbsoluteX":"0","SlideAbsoluteY":"0"}
 *
 * @param GoldLayout
 * @parent GoldWindowSet
 * @text 窗口布局
 * @type struct<WindowLayout>
 * @desc 窗口背景与皮肤。
 * @default {"LayoutType":"默认皮肤","BackgroundFile":"","BackgroundX":"0","BackgroundY":"0"}
 *
 * @param NumberInputWindowSet
 * @text ── 数量选择窗口 ──
 *
 * @param NumX
 * @parent NumberInputWindowSet
 * @text X坐标
 * @type number
 * @desc 窗口X坐标（像素）。
 * @default 440
 *
 * @param NumY
 * @parent NumberInputWindowSet
 * @text Y坐标
 * @type number
 * @desc 窗口Y坐标（像素）。
 * @default 380
 *
 * @param NumWidth
 * @parent NumberInputWindowSet
 * @text 宽度
 * @type number
 * @min 50
 * @desc 窗口宽度（像素）。
 * @default 400
 *
 * @param NumHeight
 * @parent NumberInputWindowSet
 * @text 高度
 * @type number
 * @min 50
 * @desc 窗口高度（像素）。
 * @default 240
 *
 * @param NumFontSize
 * @parent NumberInputWindowSet
 * @text 字体大小
 * @type number
 * @min 1
 * @desc 窗口字体大小。
 * @default 22
 *
 * @param NumFontFace
 * @parent NumberInputWindowSet
 * @text 字体名称
 * @desc 窗口字体名称，留空使用默认字体。
 * @default
 *
 * @param NumLineHeight
 * @parent NumberInputWindowSet
 * @text 行高
 * @type number
 * @min 1
 * @desc 窗口行高。
 * @default 36
 *
 * @param NumMoving
 * @parent NumberInputWindowSet
 * @text 窗口移动动画
 * @type struct<WindowMoving>
 * @desc 窗口入场动画。
 * @default {"MoveType":"不移动","MoveTime":"20","MoveDelay":"0","OpacityLock":"false","CoordinateType":"相对坐标","SlideX":"0","SlideY":"0","SlideAbsoluteX":"0","SlideAbsoluteY":"0"}
 *
 * @param NumLayout
 * @parent NumberInputWindowSet
 * @text 窗口布局
 * @type struct<WindowLayout>
 * @desc 窗口背景与皮肤。
 * @default {"LayoutType":"默认皮肤","BackgroundFile":"","BackgroundX":"0","BackgroundY":"0"}
 */
/* ---------------------------------------------------------------------------
 * struct<AlchemyFile>
 * ---------------------------------------------------------------------------
 */
/*~struct~AlchemyFile:
 *
 * @param menuType
 * @text 菜单类型标识
 * @desc 用于插件指令调用的唯一标识（如 "blacksmith"、"alchemy"）。
 * @default blacksmith
 *
 * @param file
 * @text 文件路径
 * @desc dataEx/ 目录下的相对路径（如 "Alchemy/blacksmith.json"）。
 * @default Alchemy/blacksmith.json
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
 * @desc 相对坐标以原位置为基准，负数向右，正数向左，单位像素。
 * @default 0
 * 
 * @param SlideAbsoluteY
 * @text 起点-绝对坐标Y
 * @parent StartPoint
 * @desc 相对坐标以原位置为基准，负数向上，正数向下，单位像素。
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
 * @desc 背景贴图的文件路径。
 * @default 
 *
 * @param BackgroundX
 * @text 贴图位置修正X
 * @parent Background
 * @type number
 * @desc 贴图在窗口背景位置的X轴修正偏移，负数向右移动，正数向左移动。
 * @default 0
 * 
 * @param BackgroundY
 * @text 贴图位置修正Y
 * @parent Background
 * @type number
 * @desc 贴图在窗口背景位置的Y轴修正偏移，负数向上移动，正数向下移动。
 * @default 0
 * 
 */
//=============================================================================
// Plugin Parameters
//=============================================================================

GF.AHS.param = GF.AHS.param || {};

(() => {
    const params = PluginManager.parameters(GF.AHS.pluginName);

    // 一般设置
    GF.AHS.param.DefaultMenuType = String(params['DefaultMenuType'] || '');
    GF.AHS.param.CommandText = String(params['CommandText'] || '合成');
    GF.AHS.param.EnableSwitchId = Number(params['EnableSwitchId'] || 0);
    GF.AHS.param.ShowCategoryWindow = params['ShowCategoryWindow'] === 'true';
    GF.AHS.param.ShowHelpWindow = params['ShowHelpWindow'] !== 'false';
    GF.AHS.param.ShowGoldWindow = params['ShowGoldWindow'] === 'true';
    GF.AHS.param.NotifyStyleId = Math.max(0, Number(params['NotifyStyleId'] || 1));

    // 用语设置
    GF.AHS.param.RequiredMaterialText = String(params['RequiredMaterialText'] || '必要素材：');
    GF.AHS.param.RequiredCostText = String(params['RequiredCostText'] || '必要费用：');
    GF.AHS.param.OutputText = String(params['OutputText'] || '产出物品：');
    GF.AHS.param.CountText = String(params['CountText'] || '持有数：');
    GF.AHS.param.UnknownRecipeText = String(params['UnknownRecipeText'] || '???');
    GF.AHS.param.GoldUnit = String(params['GoldUnit'] || 'G');
    GF.AHS.param.MaxCountText = String(params['MaxCountText'] || '最大可合成数：');
    GF.AHS.param.ConfirmText = String(params['ConfirmText'] || '确认');
    GF.AHS.param.CancelText = String(params['CancelText'] || '取消');
    GF.AHS.param.CategoryText = String(params['CategoryText'] || '全部');
    GF.AHS.param.ItemCategoryText = String(params['ItemCategoryText'] || '道具');
    GF.AHS.param.WeaponCategoryText = String(params['WeaponCategoryText'] || '武器');
    GF.AHS.param.ArmorCategoryText = String(params['ArmorCategoryText'] || '防具');
    GF.AHS.param.KeyItemCategoryText = String(params['KeyItemCategoryText'] || '贵重品');
    GF.AHS.param.NotifyText = String(params['NotifyText'] || '合成%1×%2');

    // 音效设置
    GF.AHS.param.CraftSE = {
        name: String(params['CraftSE'] || 'Heal5'),
        volume: Number(params['CraftSEVolume'] || 90),
        pitch: Number(params['CraftSEPitch'] || 100),
        pan: Number(params['CraftSEPan'] || 0)
    };

    // 数据文件列表
    const rawFileList = params['AlchemyFileList'] || '[]';
    const parsedFileList = JSON.parse(rawFileList);
    GF.AHS.param.AlchemyFileList = parsedFileList.map(entry => {
        // struct 数组的每个元素是 JSON 字符串，需要再解析
        const obj = typeof entry === 'string' ? JSON.parse(entry) : entry;
        return {
            menuType: String(obj.menuType || ''),
            file: String(obj.file || '')
        };
    });

    // 窗口设置——帮助窗口
    const helpRaw = {
        WindowX: Number(params['HelpX'] || 0),
        WindowY: Number(params['HelpY'] || 0),
        WindowWidth: Number(params['HelpWidth'] || 1920),
        WindowHeight: Number(params['HelpHeight'] || 80),
        WindowFontSize: Number(params['HelpFontSize'] || 22),
        WindowFontFace: String(params['HelpFontFace'] || ''),
        WindowLineHeight: Number(params['HelpLineHeight'] || 36),
        WindowMoving: params['HelpMoving'] || '{}',
        WindowLayout: params['HelpLayout'] || '{}'
    };
    GF.AHS.param.HelpWindowSet = DataManager.setupWindowInitParam(helpRaw);

    // 分类窗口
    const catRaw = {
        WindowX: Number(params['CategoryX'] || 0),
        WindowY: Number(params['CategoryY'] || 80),
        WindowWidth: Number(params['CategoryWidth'] || 240),
        WindowHeight: Number(params['CategoryHeight'] || 48),
        WindowFontSize: Number(params['CategoryFontSize'] || 20),
        WindowFontFace: String(params['CategoryFontFace'] || ''),
        WindowLineHeight: Number(params['CategoryLineHeight'] || 36),
        WindowMoving: params['CategoryMoving'] || '{}',
        WindowLayout: params['CategoryLayout'] || '{}'
    };
    GF.AHS.param.CategoryWindowSet = DataManager.setupWindowInitParam(catRaw);
    GF.AHS.param.CategoryCols = Math.max(1, Number(params['CategoryCols'] || 1));

    // 配方列表窗口
    const listRaw = {
        WindowX: Number(params['RecipeListX'] || 0),
        WindowY: Number(params['RecipeListY'] || 128),
        WindowWidth: Number(params['RecipeListWidth'] || 480),
        WindowHeight: Number(params['RecipeListHeight'] || 812),
        WindowFontSize: Number(params['RecipeListFontSize'] || 22),
        WindowFontFace: String(params['RecipeListFontFace'] || ''),
        WindowLineHeight: Number(params['RecipeListLineHeight'] || 36),
        WindowMoving: params['RecipeListMoving'] || '{}',
        WindowLayout: params['RecipeListLayout'] || '{}'
    };
    GF.AHS.param.RecipeListWindowSet = DataManager.setupWindowInitParam(listRaw);
    GF.AHS.param.RecipeListCols = Math.max(1, Number(params['RecipeListCols'] || 1));

    // 配方详情窗口
    const detailRaw = {
        WindowX: Number(params['DetailX'] || 480),
        WindowY: Number(params['DetailY'] || 128),
        WindowWidth: Number(params['DetailWidth'] || 720),
        WindowHeight: Number(params['DetailHeight'] || 812),
        WindowFontSize: Number(params['DetailFontSize'] || 22),
        WindowFontFace: String(params['DetailFontFace'] || ''),
        WindowLineHeight: Number(params['DetailLineHeight'] || 36),
        WindowMoving: params['DetailMoving'] || '{}',
        WindowLayout: params['DetailLayout'] || '{}'
    };
    GF.AHS.param.RecipeDetailWindowSet = DataManager.setupWindowInitParam(detailRaw);

    // 金币窗口
    const goldRaw = {
        WindowX: Number(params['GoldX'] || 1200),
        WindowY: Number(params['GoldY'] || 128),
        WindowWidth: Number(params['GoldWidth'] || 720),
        WindowHeight: Number(params['GoldHeight'] || 48),
        WindowFontSize: Number(params['GoldFontSize'] || 20),
        WindowFontFace: String(params['GoldFontFace'] || ''),
        WindowLineHeight: Number(params['GoldLineHeight'] || 36),
        WindowMoving: params['GoldMoving'] || '{}',
        WindowLayout: params['GoldLayout'] || '{}'
    };
    GF.AHS.param.GoldWindowSet = DataManager.setupWindowInitParam(goldRaw);

    // 数量选择窗口
    const numRaw = {
        WindowX: Number(params['NumX'] || 440),
        WindowY: Number(params['NumY'] || 380),
        WindowWidth: Number(params['NumWidth'] || 400),
        WindowHeight: Number(params['NumHeight'] || 240),
        WindowFontSize: Number(params['NumFontSize'] || 22),
        WindowFontFace: String(params['NumFontFace'] || ''),
        WindowLineHeight: Number(params['NumLineHeight'] || 36),
        WindowMoving: params['NumMoving'] || '{}',
        WindowLayout: params['NumLayout'] || '{}'
    };
    GF.AHS.param.NumberInputWindowSet = DataManager.setupWindowInitParam(numRaw);
})();

// 在通知系统的场景样式映射中注册 Scene_Alchemy，
// 使通知样式不受 Scene_MenuBase 通用绑定（样式2）的覆盖
(() => {
    if (typeof GF !== 'undefined' && GF.Param && GF.Param.TSMToastSceneSet) {
        GF.Param.TSMToastSceneSet['Scene_Alchemy'] = GF.AHS.param.NotifyStyleId;
    }
})();

//=============================================================================
// Global Data
//=============================================================================

var $dataAlchemyMenus = {};
var $dataAlchemyMenuList = [];

//=============================================================================
// DataManager – load data via sync XHR
//=============================================================================

GF.AHS.DataManager_loadDatabase = DataManager.loadDatabase;
DataManager.loadDatabase = function() {
    GF.AHS.DataManager_loadDatabase.call(this);
    AlchemyManager.reloadData();
};

//=============================================================================
// AlchemyManager
//=============================================================================

var AlchemyManager = AlchemyManager || {};

// --- 合成场景 ---

AlchemyManager._currentMenuType = null;
AlchemyManager._currentScene = null;

AlchemyManager.open = function(menuType) {
    if ($dataAlchemyMenus[menuType]) {
        this._currentMenuType = menuType;
        SceneManager.push(Scene_Alchemy);
    }
};

AlchemyManager.openMenuList = function() {
    SceneManager.push(Scene_AlchemyMenuList);
};

// --- 数据访问 ---

AlchemyManager.getMenuTypes = function() {
    return Object.keys($dataAlchemyMenus);
};

AlchemyManager.getMenuData = function(menuType) {
    return $dataAlchemyMenus[menuType] || null;
};

AlchemyManager.getRecipe = function(menuType, recipeId) {
    const menu = $dataAlchemyMenus[menuType];
    if (!menu || !menu.recipes) return null;
    for (let i = 0; i < menu.recipes.length; i++) {
        if (menu.recipes[i].id === recipeId) return menu.recipes[i];
    }
    return null;
};

AlchemyManager.getEnabledMenuTypes = function() {
    const types = this.getMenuTypes();
    const result = [];
    for (let i = 0; i < types.length; i++) {
        if (this.isMenuEnabled(types[i])) {
            result.push(types[i]);
        }
    }
    return result;
};

AlchemyManager.getFirstEnabledMenuType = function() {
    const types = this.getEnabledMenuTypes();
    return types.length > 0 ? types[0] : null;
};

// --- 配方解锁状态 ---

AlchemyManager.isRecipeUnlocked = function(menuType, recipeId) {
    return $gameSystem.isAlchemyRecipeUnlocked(menuType, recipeId);
};

AlchemyManager.setRecipeUnlocked = function(menuType, recipeId, unlocked) {
    $gameSystem.setAlchemyRecipeUnlocked(menuType, recipeId, unlocked);
};

AlchemyManager.unlockAllRecipes = function(menuType) {
    const menu = $dataAlchemyMenus[menuType];
    if (!menu || !menu.recipes) return;
    for (let i = 0; i < menu.recipes.length; i++) {
        $gameSystem.setAlchemyRecipeUnlocked(menuType, menu.recipes[i].id, true);
    }
};

AlchemyManager.lockAllRecipes = function(menuType) {
    const menu = $dataAlchemyMenus[menuType];
    if (!menu || !menu.recipes) return;
    for (let i = 0; i < menu.recipes.length; i++) {
        $gameSystem.setAlchemyRecipeUnlocked(menuType, menu.recipes[i].id, false);
    }
};

AlchemyManager.isRecipeVisible = function(menuType, recipe) {
    if (!recipe) return false;
    if (recipe.unlockSwitchId && recipe.unlockSwitchId > 0) {
        if (!$gameSwitches.value(recipe.unlockSwitchId)) return false;
    }
    return this.isRecipeUnlocked(menuType, recipe.id);
};

// --- 菜单启用状态 ---

AlchemyManager.isMenuEnabled = function(menuType) {
    const menu = $dataAlchemyMenus[menuType];
    if (!menu) return false;
    if (menu.enableSwitchId && menu.enableSwitchId > 0) {
        if (!$gameSwitches.value(menu.enableSwitchId)) return false;
    }
    return $gameSystem.isAlchemyMenuEnabled(menuType);
};

AlchemyManager.setMenuEnabled = function(menuType, enabled) {
    $gameSystem.setAlchemyMenuEnabled(menuType, enabled);
};

// --- 条件判断 ---

AlchemyManager.canMakeRecipe = function(menuType, recipeId) {
    const recipe = this.getRecipe(menuType, recipeId);
    if (!recipe) return false;
    if (!this.isRecipeVisible(menuType, recipe)) return false;
    // 检查材料
    if (recipe.material) {
        for (let i = 0; i < recipe.material.length; i++) {
            const mat = recipe.material[i];
            const count = AlchemyManager._itemCount(mat.type, mat.id);
            if (count < mat.count) return false;
        }
    }
    // 检查金币
    if (recipe.price && recipe.price > 0) {
        if ($gameParty.gold() < recipe.price) return false;
    }
    return true;
};

AlchemyManager.getMaxMakeCount = function(menuType, recipeId) {
    const recipe = this.getRecipe(menuType, recipeId);
    if (!recipe) return 0;
    if (!this.isRecipeVisible(menuType, recipe)) return 0;

    let maxByMaterial = Infinity;
    if (recipe.material) {
        for (let i = 0; i < recipe.material.length; i++) {
            const mat = recipe.material[i];
            const count = AlchemyManager._itemCount(mat.type, mat.id);
            const canMake = Math.floor(count / mat.count);
            if (canMake < maxByMaterial) maxByMaterial = canMake;
        }
    }

    let maxByGold = Infinity;
    if (recipe.price && recipe.price > 0) {
        maxByGold = Math.floor($gameParty.gold() / recipe.price);
    }

    const max = Math.min(maxByMaterial, maxByGold);
    return Math.max(0, max);
};

AlchemyManager._itemCount = function(type, id) {
    switch (type) {
        case 'item':
            return $gameParty.numItems($dataItems[id]);
        case 'weapon':
            return $gameParty.numItems($dataWeapons[id]);
        case 'armor':
            return $gameParty.numItems($dataArmors[id]);
        default:
            return 0;
    }
};

AlchemyManager._dataItem = function(type, id) {
    switch (type) {
        case 'item': return $dataItems[id];
        case 'weapon': return $dataWeapons[id];
        case 'armor': return $dataArmors[id];
        default: return null;
    }
};

// --- 合成执行 ---

AlchemyManager.makeItem = function(menuType, recipeId, count) {
    const recipe = this.getRecipe(menuType, recipeId);
    if (!recipe || count <= 0) return false;

    const maxCount = this.getMaxMakeCount(menuType, recipeId);
    if (count > maxCount) return false;

    // 消耗材料
    if (recipe.material) {
        for (let i = 0; i < recipe.material.length; i++) {
            const mat = recipe.material[i];
            const item = AlchemyManager._dataItem(mat.type, mat.id);
            if (item) {
                $gameParty.loseItem(item, mat.count * count);
            }
        }
    }

    // 消耗金币
    if (recipe.price && recipe.price > 0) {
        $gameParty.loseGold(recipe.price * count);
    }

    // 获得产出
    const target = recipe.target;
    const targetItem = AlchemyManager._dataItem(target.type, target.id);
    if (targetItem) {
        $gameParty.gainItem(targetItem, count);
    }

    // 播放音效
    const se = recipe.se || GF.AHS.param.CraftSE;
    if (se && se.name) {
        AudioManager.playSe(se);
    }

    // 推送合成成功通知
    if (GF.AHS.param.NotifyStyleId > 0 && targetItem) {
        const name = targetItem.name;
        const fmt = GF.AHS.param.NotifyText;
        const notifyText = fmt.replace('%1', name).replace('%2', String(count));
        if (typeof ToastManager !== 'undefined' && ToastManager.addTextWithStyle) {
            ToastManager.addTextWithStyle(notifyText, GF.AHS.param.NotifyStyleId);
        } else if (typeof ToastManager !== 'undefined' && ToastManager.addText) {
            ToastManager.addText(notifyText);
        }
    }

    return true;
};

// --- 数据刷新 ---

AlchemyManager.reloadData = function() {
    const fileList = GF.AHS.param.AlchemyFileList;
    for (let i = 0; i < fileList.length; i++) {
        const entry = fileList[i];
        AlchemyManager._loadSingleFile(entry.menuType, entry.file);
    }
    if (AlchemyManager._currentScene && AlchemyManager._currentScene.refresh) {
        AlchemyManager._currentScene.refresh();
    }
};

AlchemyManager._loadSingleFile = function(menuType, filePath) {
    if (!filePath) return;
    const xhr = new XMLHttpRequest();
    const url = "dataEx/" + filePath;
    xhr.open("GET", url, false);
    xhr.overrideMimeType("application/json");
    try {
        xhr.send();
        if (xhr.status >= 200 && xhr.status < 400) {
            const data = JSON.parse(xhr.responseText);
            if (data && data.menuType) {
                $dataAlchemyMenus[data.menuType] = AlchemyManager._normalizeMenuData(data);
            }
        }
    } catch (e) {
        console.warn('GF_AlchemySystem: 加载失败 ' + filePath, e);
    }
};

AlchemyManager._normalizeMenuData = function(data) {
    // 设置字段默认值
    data.menuName = data.menuName || '';
    data.menuIcon = data.menuIcon || 0;
    data.enableSwitchId = data.enableSwitchId || 0;
    data.enableItemCategory = data.enableItemCategory !== false;
    data.enableWeaponCategory = data.enableWeaponCategory !== false;
    data.enableArmorCategory = data.enableArmorCategory !== false;
    data.enableKeyItemCategory = !!data.enableKeyItemCategory;
    data.maxMaterials = data.maxMaterials || 3;
    data.enableIncludeEquipItem = !!data.enableIncludeEquipItem;
    data.maxMakeItem = data.maxMakeItem || 999;
    data.menuHelpText = data.menuHelpText || '';
    data.categories = data.categories || [];
    data.recipes = data.recipes || [];
    // 初始化配方默认值
    for (let i = 0; i < data.recipes.length; i++) {
        const r = data.recipes[i];
        r.id = r.id || (i + 1);
        r.material = r.material || [];
        r.price = r.price || 0;
        r.unlockSwitchId = r.unlockSwitchId || 0;
    }
    return data;
};

AlchemyManager.getCategories = function(menuType) {
    const menu = $dataAlchemyMenus[menuType];
    if (!menu) return [];
    if (menu.categories && menu.categories.length > 0) {
        return menu.categories;
    }
    // 自动分类
    const cats = [];
    if (menu.enableItemCategory) {
        cats.push({ id: 'item', name: GF.AHS.param.ItemCategoryText, iconIndex: 0, order: 1, isAuto: true });
    }
    if (menu.enableWeaponCategory) {
        cats.push({ id: 'weapon', name: GF.AHS.param.WeaponCategoryText, iconIndex: 0, order: 2, isAuto: true });
    }
    if (menu.enableArmorCategory) {
        cats.push({ id: 'armor', name: GF.AHS.param.ArmorCategoryText, iconIndex: 0, order: 3, isAuto: true });
    }
    if (menu.enableKeyItemCategory) {
        cats.push({ id: 'keyItem', name: GF.AHS.param.KeyItemCategoryText, iconIndex: 0, order: 4, isAuto: true });
    }
    // 添加"全部"
    cats.unshift({ id: 'all', name: GF.AHS.param.CategoryText, iconIndex: 0, order: 0, isAuto: true });
    return cats;
};

AlchemyManager.getRecipesByCategory = function(menuType, categoryId) {
    const menu = $dataAlchemyMenus[menuType];
    if (!menu || !menu.recipes) return [];
    if (!categoryId || categoryId === 'all') return menu.recipes;
    const isAutoCat = categoryId === 'item' || categoryId === 'weapon' || categoryId === 'armor' || categoryId === 'keyItem';
    if (isAutoCat) {
        const rmmzType = categoryId === 'keyItem' ? 'item' : categoryId;
        return menu.recipes.filter(r => r.target && r.target.type === rmmzType &&
            (categoryId !== 'keyItem' || $dataItems[r.target.id] && $dataItems[r.target.id].itypeId === 3));
    }
    // 自定义分类
    return menu.recipes.filter(r => r.categoryId === categoryId);
};

AlchemyManager.getRecipeName = function(menuType, recipe) {
    if (!this.isRecipeVisible(menuType, recipe)) {
        return GF.AHS.param.UnknownRecipeText;
    }
    if (recipe.name) return recipe.name;
    const targetItem = this._dataItem(recipe.target.type, recipe.target.id);
    return targetItem ? targetItem.name : '';
};

AlchemyManager.getRecipeIcon = function(menuType, recipe) {
    if (!this.isRecipeVisible(menuType, recipe)) return 0;
    if (recipe.iconIndex && recipe.iconIndex > 0) return recipe.iconIndex;
    const targetItem = this._dataItem(recipe.target.type, recipe.target.id);
    return targetItem ? targetItem.iconIndex : 0;
};

AlchemyManager.getRecipeDescription = function(menuType, recipe) {
    if (!this.isRecipeVisible(menuType, recipe)) return '';
    if (recipe.description) return recipe.description;
    const targetItem = this._dataItem(recipe.target.type, recipe.target.id);
    return targetItem ? targetItem.description : '';
};

//=============================================================================
// Game_System
//=============================================================================

GF.AHS.Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
    GF.AHS.Game_System_initialize.call(this);
    this._alchemyRecipeUnlocked = {};
    this._alchemyMenuEnabled = {};
};

Game_System.prototype.isAlchemyRecipeUnlocked = function(menuType, recipeId) {
    if (!this._alchemyRecipeUnlocked) this._alchemyRecipeUnlocked = {};
    const key = menuType + '_' + recipeId;
    if (this._alchemyRecipeUnlocked[key] === undefined) {
        // 默认根据解锁开关
        const recipe = AlchemyManager.getRecipe(menuType, recipeId);
        if (recipe && recipe.unlockSwitchId && recipe.unlockSwitchId > 0) {
            this._alchemyRecipeUnlocked[key] = $gameSwitches.value(recipe.unlockSwitchId);
        } else {
            this._alchemyRecipeUnlocked[key] = true;
        }
    }
    return !!this._alchemyRecipeUnlocked[key];
};

Game_System.prototype.setAlchemyRecipeUnlocked = function(menuType, recipeId, unlocked) {
    if (!this._alchemyRecipeUnlocked) this._alchemyRecipeUnlocked = {};
    const key = menuType + '_' + recipeId;
    this._alchemyRecipeUnlocked[key] = unlocked;
};

Game_System.prototype.isAlchemyMenuEnabled = function(menuType) {
    if (!this._alchemyMenuEnabled) this._alchemyMenuEnabled = {};
    if (this._alchemyMenuEnabled[menuType] === undefined) {
        this._alchemyMenuEnabled[menuType] = true;
    }
    return !!this._alchemyMenuEnabled[menuType];
};

Game_System.prototype.setAlchemyMenuEnabled = function(menuType, enabled) {
    if (!this._alchemyMenuEnabled) this._alchemyMenuEnabled = {};
    this._alchemyMenuEnabled[menuType] = enabled;
};

//=============================================================================
// DataManager – save/load hooks
//=============================================================================

GF.AHS.DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
    GF.AHS.DataManager_extractSaveContents.call(this, contents);
    if ($gameSystem._alchemyRecipeUnlocked === undefined) {
        $gameSystem._alchemyRecipeUnlocked = {};
    }
    if ($gameSystem._alchemyMenuEnabled === undefined) {
        $gameSystem._alchemyMenuEnabled = {};
    }
};


// Window_AlchemyHelp
//=============================================================================

function Window_AlchemyHelp() {
    this.initialize.apply(this, arguments);
}

Window_AlchemyHelp.prototype = Object.create(Window_Base.prototype);
Window_AlchemyHelp.prototype.constructor = Window_AlchemyHelp;

Window_AlchemyHelp.prototype.initialize = function() {
    const ws = GF.AHS.param.HelpWindowSet;
    Window_Base.prototype.initialize.call(this, new Rectangle(ws.x, ws.y, ws.width, ws.height));
    this.processInitParam(ws);
    this._text = '';
};

Window_AlchemyHelp.prototype.setText = function(text) {
    if (this._text !== text) {
        this._text = text;
        this.refresh();
    }
};

Window_AlchemyHelp.prototype.refresh = function() {
    this.contents.clear();
    if (this._text) {
        this.drawText(this._text, 0, 0, this.contents.width, 'left');
    }
};

//=============================================================================
// Window_AlchemyGold
//=============================================================================

function Window_AlchemyGold() {
    this.initialize.apply(this, arguments);
}

Window_AlchemyGold.prototype = Object.create(Window_Base.prototype);
Window_AlchemyGold.prototype.constructor = Window_AlchemyGold;

Window_AlchemyGold.prototype.initialize = function() {
    const ws = GF.AHS.param.GoldWindowSet;
    Window_Base.prototype.initialize.call(this, new Rectangle(ws.x, ws.y, ws.width, ws.height));
    this.processInitParam(ws);
    this.refresh();
};



Window_AlchemyGold.prototype.refresh = function() {
    this.contents.clear();
    const gold = $gameParty.gold();
    const goldSet = (typeof GF !== 'undefined' && GF.Param && GF.Param.COGGoldSet) ? GF.Param.COGGoldSet : null;
    const unit = goldSet ? goldSet.GoldText : GF.AHS.param.GoldUnit;
    const iconIndex = goldSet ? goldSet.GoldIcon : 0;
    const unitWidth = Math.min(80, this.textWidth(unit));
    const cx = (iconIndex > 0) ? ImageManager.iconWidth : unitWidth;
    const text = String(gold);
    // 左侧货币名称
    this.resetTextColor();
    this.drawText(unit, 0, 0, this.contents.width, 'left');
    // 右侧图标 + 数值
    this.drawText(text, 0, 0, this.contents.width - cx - 4, 'right');
    if (iconIndex > 0) {
        this.drawIcon(iconIndex, this.contents.width - ImageManager.iconWidth, 2);
    }
    this.resetFontSettings();
};

//=============================================================================
// Window_AlchemyCategory
//=============================================================================

function Window_AlchemyCategory() {
    this.initialize.apply(this, arguments);
}

Window_AlchemyCategory.prototype = Object.create(Window_Selectable.prototype);
Window_AlchemyCategory.prototype.constructor = Window_AlchemyCategory;

Window_AlchemyCategory.prototype.initialize = function() {
    const ws = GF.AHS.param.CategoryWindowSet;
    Window_Selectable.prototype.initialize.call(this, ws.x, ws.y, ws.width, ws.height);
    this.processInitParam(ws);
    this._categories = [];
    this._menuType = null;
    this._maxCols = this._categories.length || 1;
    this.refresh();
};

Window_AlchemyCategory.prototype.setMenuType = function(menuType) {
    this._menuType = menuType;
    this._categories = AlchemyManager.getCategories(menuType);
    this._maxCols = this._categories.length || 1;
    this.refresh();
    this.select(0);
};

Window_AlchemyCategory.prototype.maxCols = function() {
    return GF.AHS.param.CategoryCols;
};

Window_AlchemyCategory.prototype.maxItems = function() {
    return this._categories.length;
};

Window_AlchemyCategory.prototype.itemHeight = function() {
    return this.lineHeight();
};

Window_AlchemyCategory.prototype.drawItem = function(index) {
    const rect = this.itemRect(index);
    const cat = this._categories[index];
    if (!cat) return;
    const text = cat.name;
    this.drawText(text, rect.x, rect.y, rect.width, 'center');
};

Window_AlchemyCategory.prototype.categoryId = function() {
    const index = this.index();
    if (index >= 0 && index < this._categories.length) {
        return this._categories[index].id;
    }
    return 'all';
};

Window_AlchemyCategory.prototype.setRecipeListWindow = function(recipeListWindow) {
    this._recipeListWindow = recipeListWindow;
};

Window_AlchemyCategory.prototype.updateHelp = function() {
    // 光标移动到不同分类时自动刷新配方列表
    if (this._recipeListWindow) {
        this._recipeListWindow.setCategory(this.categoryId());
        // 同步刷新详情和金币
        if (this._recipeListWindow._detailWindow) {
            this._recipeListWindow._detailWindow.setRecipe(this._recipeListWindow.recipe());
        }
        const scene = AlchemyManager._currentScene;
        if (scene && scene.updateGoldWindow) {
            scene.updateGoldWindow();
        }
    }
};

Window_AlchemyCategory.prototype.callUpdateHelp = function() {
    this.updateHelp();
};

// 确保 select 也触发刷新（兼容性保障）
Window_AlchemyCategory.prototype.smoothSelect = function(index) {
    Window_Selectable.prototype.smoothSelect.call(this, index);
    this.updateHelp();
};

//=============================================================================
// Window_AlchemyRecipeList
//=============================================================================

function Window_AlchemyRecipeList() {
    this.initialize.apply(this, arguments);
}

Window_AlchemyRecipeList.prototype = Object.create(Window_Selectable.prototype);
Window_AlchemyRecipeList.prototype.constructor = Window_AlchemyRecipeList;

Window_AlchemyRecipeList.prototype.initialize = function() {
    const ws = GF.AHS.param.RecipeListWindowSet;
    Window_Selectable.prototype.initialize.call(this, ws.x, ws.y, ws.width, ws.height);
    this.processInitParam(ws);
    this._menuType = null;
    this._recipes = [];
    this._maxCols = GF.AHS.param.RecipeListCols;
    this._helpWindow = null;
    this._detailWindow = null;
    this.refresh();
};

Window_AlchemyRecipeList.prototype.setHelpWindow = function(helpWindow) {
    this._helpWindow = helpWindow;
};

Window_AlchemyRecipeList.prototype.setMenuType = function(menuType) {
    this._menuType = menuType;
    this.refresh();
};

Window_AlchemyRecipeList.prototype.setCategory = function(categoryId) {
    if (!this._menuType) return;
    this._recipes = AlchemyManager.getRecipesByCategory(this._menuType, categoryId);
    this.refresh();
    this.select(0);
};

Window_AlchemyRecipeList.prototype.isCurrentItemEnabled = function() {
    const recipe = this.recipe();
    if (!recipe) return false;
    return AlchemyManager.isRecipeVisible(this._menuType, recipe) && AlchemyManager.canMakeRecipe(this._menuType, recipe.id);
};

Window_AlchemyRecipeList.prototype.maxCols = function() {
    return this._maxCols || 1;
};

Window_AlchemyRecipeList.prototype.maxItems = function() {
    return this._recipes.length;
};

Window_AlchemyRecipeList.prototype.drawItem = function(index) {
    const rect = this.itemRect(index);
    const recipe = this._recipes[index];
    if (!recipe) return;
    const menuType = this._menuType;
    const visible = AlchemyManager.isRecipeVisible(menuType, recipe);
    const name = AlchemyManager.getRecipeName(menuType, recipe);
    const icon = AlchemyManager.getRecipeIcon(menuType, recipe);
    const canMake = AlchemyManager.canMakeRecipe(menuType, recipe.id);

    if (icon > 0) {
        this.drawIcon(icon, rect.x, rect.y);
    }
    const textX = rect.x + (icon > 0 ? ImageManager.iconWidth + 4 : 0);

    if (!visible) {
        this.changeTextColor(ColorManager.textColor(8)); // gray
    } else if (!canMake) {
        this.changeTextColor(ColorManager.textColor(7)); // red-ish
    } else {
        this.changeTextColor(ColorManager.normalColor());
    }
    this.drawText(name, textX, rect.y, rect.width - textX + rect.x, 'left');
};

Window_AlchemyRecipeList.prototype.recipe = function() {
    const index = this.index();
    if (index >= 0 && index < this._recipes.length) {
        return this._recipes[index];
    }
    return null;
};

Window_AlchemyRecipeList.prototype.recipeId = function() {
    const r = this.recipe();
    return r ? r.id : null;
};

Window_AlchemyRecipeList.prototype.callUpdateHelp = function() {
    if (this.active) {
        this.updateHelp();
    }
};

Window_AlchemyRecipeList.prototype.updateHelp = function() {
    const recipe = this.recipe();
    if (this._helpWindow && this._menuType) {
        const text = recipe ? AlchemyManager.getRecipeDescription(this._menuType, recipe) : '';
        this._helpWindow.setText(text);
    }
    if (this._detailWindow) {
        this._detailWindow.setRecipe(recipe);
    }
    const scene = AlchemyManager._currentScene;
    if (scene && scene.updateGoldWindow) {
        scene.updateGoldWindow();
    }
};

Window_AlchemyRecipeList.prototype.setDetailWindow = function(detailWindow) {
    this._detailWindow = detailWindow;
};

//=============================================================================
// Window_AlchemyRecipeDetail
//=============================================================================

function Window_AlchemyRecipeDetail() {
    this.initialize.apply(this, arguments);
}

Window_AlchemyRecipeDetail.prototype = Object.create(Window_Base.prototype);
Window_AlchemyRecipeDetail.prototype.constructor = Window_AlchemyRecipeDetail;

Window_AlchemyRecipeDetail.prototype.initialize = function() {
    const ws = GF.AHS.param.RecipeDetailWindowSet;
    Window_Base.prototype.initialize.call(this, new Rectangle(ws.x, ws.y, ws.width, ws.height));
    this.processInitParam(ws);
    this._menuType = null;
    this._recipe = null;
    this.refresh();
};

Window_AlchemyRecipeDetail.prototype.setMenuType = function(menuType) {
    this._menuType = menuType;
};

Window_AlchemyRecipeDetail.prototype.setRecipe = function(recipe) {
    this._recipe = recipe;
    this.refresh();
};

Window_AlchemyRecipeDetail.prototype.refresh = function() {
    this.contents.clear();
    if (!this._recipe || !this._menuType) return;

    const recipe = this._recipe;
    const menuType = this._menuType;
    const visible = AlchemyManager.isRecipeVisible(menuType, recipe);

    let y = 0;
    const lh = this.lineHeight();
    const ws = this.contentsWidth();
    const textIndent = 0;

    // 产出物品标题
    if (visible) {
        const outputName = AlchemyManager.getRecipeName(menuType, recipe);
        const outputIcon = AlchemyManager.getRecipeIcon(menuType, recipe);
        if (outputIcon > 0) {
            this.drawIcon(outputIcon, textIndent, y);
        }
        this.changeTextColor(ColorManager.normalColor());
        this.drawText(outputName, textIndent + (outputIcon > 0 ? ImageManager.iconWidth + 4 : 0), y, ws, 'left');
    } else {
        this.changeTextColor(ColorManager.textColor(8));
        this.drawText(GF.AHS.param.UnknownRecipeText, textIndent, y, ws, 'left');
    }
    y += lh;

    // 分割线
    y += 4;

    if (!visible) return;

    // 必要素材
    this.changeTextColor(this.systemColor());
    this.drawText(GF.AHS.param.RequiredMaterialText, textIndent, y, ws, 'left');
    y += lh;

    this.changeTextColor(ColorManager.normalColor());
    if (recipe.material) {
        for (let i = 0; i < recipe.material.length; i++) {
            const mat = recipe.material[i];
            const item = AlchemyManager._dataItem(mat.type, mat.id);
            if (!item) continue;
            const have = AlchemyManager._itemCount(mat.type, mat.id);
            const need = mat.count;
            const color = have >= need ? ColorManager.normalColor() : ColorManager.textColor(7);
            this.changeTextColor(color);
            const iconIndex = item.iconIndex || 0;
            if (iconIndex > 0) {
                this.drawIcon(iconIndex, textIndent, y);
            }
            const iconOffset = iconIndex > 0 ? ImageManager.iconWidth + 4 : 0;
            const matText = item.name + ' x' + need + '  (' + have + '/' + need + ')';
            this.drawText(matText, textIndent + iconOffset, y, ws - iconOffset, 'left');
            y += lh;
        }
    }

    // 必要费用
    if (recipe.price && recipe.price > 0) {
        y += 4;
        this.changeTextColor(this.systemColor());
        this.drawText(GF.AHS.param.RequiredCostText, textIndent, y, ws, 'left');
        y += lh;
        this.changeTextColor(ColorManager.normalColor());
        const goldText = recipe.price + ' ' + GF.AHS.param.GoldUnit;
        this.drawText(goldText, textIndent, y, ws, 'left');
        y += lh;
    }

    // 描述
    const desc = AlchemyManager.getRecipeDescription(menuType, recipe);
    if (desc) {
        y += 4;
        this.changeTextColor(ColorManager.textColor(8));
        this.drawText(desc, textIndent, y, ws, 'left');
    }
};

//=============================================================================
// Window_AlchemyNumberInput
//=============================================================================

function Window_AlchemyNumberInput() {
    this.initialize.apply(this, arguments);
}

Window_AlchemyNumberInput.prototype = Object.create(Window_Selectable.prototype);
Window_AlchemyNumberInput.prototype.constructor = Window_AlchemyNumberInput;

Window_AlchemyNumberInput.prototype.initialize = function() {
    const ws = GF.AHS.param.NumberInputWindowSet;
    Window_Selectable.prototype.initialize.call(this, new Rectangle(ws.x, ws.y, ws.width, ws.height));
    this.processInitParam(ws);
    this._menuType = null;
    this._recipe = null;
    this._maxCount = 0;
    this._number = 1;
    this._callback = null;
    this._cancelCallback = null;
    this.createButtons();
    this.select(0);
    this._canRepeat = false;
    this.hide();
};

Window_AlchemyNumberInput.prototype.setup = function(menuType, recipe, callback, cancelCallback) {
    this._menuType = menuType;
    this._recipe = recipe;
    this._maxCount = AlchemyManager.getMaxMakeCount(menuType, recipe.id);
    this._number = this._maxCount > 0 ? 1 : 0;
    this._callback = callback;
    this._cancelCallback = cancelCallback;
    this.placeButtons();
    this.refresh();
    this.show();
    this.activate();
    this.select(0);
    this.open();
};

Window_AlchemyNumberInput.prototype.isScrollEnabled = function() {
    return false;
};

Window_AlchemyNumberInput.prototype.maxItems = function() {
    return 1;
};

Window_AlchemyNumberInput.prototype.maxCols = function() {
    return 1;
};

// --- 按钮 ---

Window_AlchemyNumberInput.prototype.createButtons = function() {
    this._buttons = [];
    if (ConfigManager.touchUI) {
        for (const type of ["down2", "down", "up", "up2", "ok"]) {
            const button = new Sprite_Button(type);
            this._buttons.push(button);
            this.addInnerChild(button);
        }
        const cancelBtn = new Sprite_Button("cancel");
        this._buttons.push(cancelBtn);
        this.addInnerChild(cancelBtn);

        this._buttons[0].setClickHandler(this.onButtonDown2.bind(this));
        this._buttons[1].setClickHandler(this.onButtonDown.bind(this));
        this._buttons[2].setClickHandler(this.onButtonUp.bind(this));
        this._buttons[3].setClickHandler(this.onButtonUp2.bind(this));
        this._buttons[4].setClickHandler(this.onButtonOk.bind(this));
        this._buttons[5].setClickHandler(this.onButtonCancel.bind(this));
    }
};

Window_AlchemyNumberInput.prototype.placeButtons = function() {
    const sp = this.buttonSpacing();
    const totalWidth = this.totalButtonWidth();
    let x = (this.innerWidth - totalWidth) / 2;
    for (const button of this._buttons) {
        button.x = x;
        button.y = this.buttonY();
        x += button.width + sp;
    }
};

Window_AlchemyNumberInput.prototype.totalButtonWidth = function() {
    const sp = this.buttonSpacing();
    return this._buttons.reduce((r, button) => r + button.width + sp, -sp);
};

Window_AlchemyNumberInput.prototype.buttonSpacing = function() {
    return 4;
};

Window_AlchemyNumberInput.prototype.buttonY = function() {
    return Math.floor(this.innerHeight - this.lineHeight() * 1.5);
};

// --- 布局 ---

Window_AlchemyNumberInput.prototype.itemNameY = function() {
    return Math.floor(this.lineHeight() * 0.5);
};

Window_AlchemyNumberInput.prototype.numberY = function() {
    return Math.floor(this.itemNameY() + this.lineHeight() * 1.5);
};

Window_AlchemyNumberInput.prototype.maxCountY = function() {
    return Math.floor(this.numberY() + this.lineHeight());
};

Window_AlchemyNumberInput.prototype.cursorWidth = function() {
    const padding = this.itemPadding();
    const digitWidth = this.textWidth("0");
    return Math.max(4, this.maxDigits()) * digitWidth + padding * 2;
};

Window_AlchemyNumberInput.prototype.cursorX = function() {
    const padding = this.itemPadding();
    const sign = "\u00d7";
    const signWidth = this.textWidth(sign);
    return this.innerWidth - this.cursorWidth() - signWidth - padding * 3;
};

Window_AlchemyNumberInput.prototype.maxDigits = function() {
    return 3;
};

// --- 刷新 ---

Window_AlchemyNumberInput.prototype.refresh = function() {
    Window_Selectable.prototype.refresh.call(this);
    if (!this._recipe) return;
    this.drawItemBackground(0);
    this.drawCurrentItemName();
    this.drawMultiplicationSign();
    this.drawNumber();
    this.drawMaxCount();
};

Window_AlchemyNumberInput.prototype.drawCurrentItemName = function() {
    const padding = this.itemPadding();
    const x = padding * 2;
    const y = this.itemNameY();
    const width = this.cursorX() - padding * 3;
    const name = AlchemyManager.getRecipeName(this._menuType, this._recipe);
    this.resetTextColor();
    this.drawText(name, x, y, width, 'left');
};

Window_AlchemyNumberInput.prototype.drawMultiplicationSign = function() {
    const sign = "\u00d7";
    const width = this.textWidth(sign);
    const x = this.cursorX() - width;
    const y = this.itemNameY();
    this.resetTextColor();
    this.drawText(sign, x, y, width);
};

Window_AlchemyNumberInput.prototype.drawNumber = function() {
    const x = this.cursorX();
    const y = this.itemNameY();
    const width = this.cursorWidth() - this.itemPadding();
    this.resetTextColor();
    this.drawText(String(this._number), x, y, width, "right");
};

Window_AlchemyNumberInput.prototype.drawMaxCount = function() {
    const padding = this.itemPadding();
    const y = this.maxCountY();
    this.changeTextColor(ColorManager.textColor(8));
    this.drawText(GF.AHS.param.MaxCountText + this._maxCount, padding, y, this.innerWidth - padding * 2, 'center');
    this.resetTextColor();
};

// --- 光标 ---

Window_AlchemyNumberInput.prototype.itemRect = function() {
    const rect = new Rectangle();
    rect.x = this.cursorX();
    rect.y = this.itemNameY();
    rect.width = this.cursorWidth();
    rect.height = this.lineHeight();
    return rect;
};

Window_AlchemyNumberInput.prototype.isTouchOkEnabled = function() {
    return false;
};

// --- 输入处理 ---

Window_AlchemyNumberInput.prototype.update = function() {
    Window_Selectable.prototype.update.call(this);
    if (this.isOpenAndActive()) {
        this.processNumberChange();
    }
};

Window_AlchemyNumberInput.prototype.processNumberChange = function() {
    if (Input.isRepeated("right") || Input.isRepeated("up")) {
        this.changeNumber(1);
    }
    if (Input.isRepeated("left") || Input.isRepeated("down")) {
        this.changeNumber(-1);
    }
    if (Input.isTriggered("pagedown") || Input.isRepeated("pagedown")) {
        this.changeNumber(-10);
    }
    if (Input.isTriggered("pageup") || Input.isRepeated("pageup")) {
        this.changeNumber(10);
    }
};

Window_AlchemyNumberInput.prototype.changeNumber = function(amount) {
    const lastNumber = this._number;
    this._number = (this._number + amount).clamp(1, this._maxCount);
    if (this._number !== lastNumber) {
        this.playCursorSound();
        this.refresh();
    }
};

Window_AlchemyNumberInput.prototype.playOkSound = function() {
    // 合成本身会播放音效
};

Window_AlchemyNumberInput.prototype.processOk = function() {
    if (this.isOpenAndActive() && this._callback) {
        this.deactivate();
        this.hide();
        SoundManager.playOk();
        this._callback(this._number);
    }
};

Window_AlchemyNumberInput.prototype.processCancel = function() {
    if (this.isOpenAndActive() && this._cancelCallback) {
        this.deactivate();
        this.hide();
        SoundManager.playCancel();
        this._cancelCallback();
    }
};

// --- 按钮回调 ---

Window_AlchemyNumberInput.prototype.onButtonUp = function() {
    this.changeNumber(1);
};

Window_AlchemyNumberInput.prototype.onButtonUp2 = function() {
    this.changeNumber(10);
};

Window_AlchemyNumberInput.prototype.onButtonDown = function() {
    this.changeNumber(-1);
};

Window_AlchemyNumberInput.prototype.onButtonDown2 = function() {
    this.changeNumber(-10);
};

Window_AlchemyNumberInput.prototype.onButtonOk = function() {
    this.processOk();
};

Window_AlchemyNumberInput.prototype.buttonCancel = function() {
    this.processCancel();
};

Window_AlchemyNumberInput.prototype.close = function() {
    this.deactivate();
    this.hide();
};

//=============================================================================
// Scene_AlchemyMenuList
//=============================================================================

function Scene_AlchemyMenuList() {
    this.initialize.apply(this, arguments);
}

Scene_AlchemyMenuList.prototype = Object.create(Scene_MenuBase.prototype);
Scene_AlchemyMenuList.prototype.constructor = Scene_AlchemyMenuList;

Scene_AlchemyMenuList.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_AlchemyMenuList.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this._helpWindow = new Window_AlchemyHelp();
    this._helpWindow.setText('请选择要使用的合成设施。');
    this.addWindow(this._helpWindow);
    this._menuListWindow = new Window_AlchemyMenuList();
    this._menuListWindow.setHandler('ok', this.onMenuOk.bind(this));
    this._menuListWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._menuListWindow);
};

Scene_AlchemyMenuList.prototype.start = function() {
    Scene_MenuBase.prototype.start.call(this);
    this._menuListWindow.activate();
};

Scene_AlchemyMenuList.prototype.onMenuOk = function() {
    const type = this._menuListWindow.selectedMenuType();
    if (type) {
        AlchemyManager.open(type);
    }
};

//=============================================================================
// Window_AlchemyMenuList
//=============================================================================

function Window_AlchemyMenuList() {
    this.initialize.apply(this, arguments);
}

Window_AlchemyMenuList.prototype = Object.create(Window_Selectable.prototype);
Window_AlchemyMenuList.prototype.constructor = Window_AlchemyMenuList;

Window_AlchemyMenuList.prototype.initialize = function() {
    const w = Graphics.boxWidth;
    const h = Graphics.boxHeight - 80;
    Window_Selectable.prototype.initialize.call(this, 0, 80, w, h);
    this._menuTypes = [];
    this.refresh();
};

Window_AlchemyMenuList.prototype.refresh = function() {
    this._menuTypes = AlchemyManager.getEnabledMenuTypes();
    Window_Selectable.prototype.refresh.call(this);
};

Window_AlchemyMenuList.prototype.maxItems = function() {
    return this._menuTypes.length;
};

Window_AlchemyMenuList.prototype.drawItem = function(index) {
    const rect = this.itemRect(index);
    const type = this._menuTypes[index];
    const menu = AlchemyManager.getMenuData(type);
    if (!menu) return;
    const name = menu.menuName || type;
    const icon = menu.menuIcon || 0;
    if (icon > 0) {
        this.drawIcon(icon, rect.x, rect.y);
    }
    this.drawText(name, rect.x + (icon > 0 ? ImageManager.iconWidth + 4 : 0), rect.y, rect.width, 'left');
};

Window_AlchemyMenuList.prototype.selectedMenuType = function() {
    const index = this.index();
    if (index >= 0 && index < this._menuTypes.length) {
        return this._menuTypes[index];
    }
    return null;
};

//=============================================================================
// Scene_Alchemy
//=============================================================================

function Scene_Alchemy() {
    this.initialize.apply(this, arguments);
}

Scene_Alchemy.prototype = Object.create(Scene_MenuBase.prototype);
Scene_Alchemy.prototype.constructor = Scene_Alchemy;

Scene_Alchemy.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_Alchemy.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    AlchemyManager._currentScene = this;

    this._menuType = AlchemyManager._currentMenuType;
    const menuData = AlchemyManager.getMenuData(this._menuType);

    // 帮助窗口（可选）
    if (GF.AHS.param.ShowHelpWindow) {
        this._helpWindow = new Window_AlchemyHelp();
        this._helpWindow.setText(menuData ? menuData.menuHelpText : '');
        this.addWindow(this._helpWindow);
    } else {
        this._helpWindow = null;
    }

    // 分类窗口
    this._categoryWindow = new Window_AlchemyCategory();
    this._categoryWindow.setMenuType(this._menuType);
    this._categoryWindow.setHandler('ok', this.onCategoryOk.bind(this));
    this._categoryWindow.setHandler('cancel', this.onCategoryCancel.bind(this));
    this.addWindow(this._categoryWindow);

    // 配方列表窗口
    this._recipeListWindow = new Window_AlchemyRecipeList();
    this._recipeListWindow.setMenuType(this._menuType);
    this._recipeListWindow.setCategory(this._categoryWindow.categoryId());
    this._recipeListWindow.setHandler('ok', this.onRecipeOk.bind(this));
    this._recipeListWindow.setHandler('cancel', this.onRecipeListCancel.bind(this));
    this._recipeListWindow.setHelpWindow(this._helpWindow);
    this._recipeListWindow.setDetailWindow(this._detailWindow);
    this.addWindow(this._recipeListWindow);
    this._categoryWindow.setRecipeListWindow(this._recipeListWindow);

    // 配方详情窗口
    try {
        this._detailWindow = new Window_AlchemyRecipeDetail();
        if (this._detailWindow) {
            this._detailWindow.setMenuType(this._menuType);
            this._detailWindow.setRecipe(this._recipeListWindow.recipe());
            this.addWindow(this._detailWindow);
        }
    } catch (e) {
        console.error('GF_AlchemySystem: 创建详情窗口失败', e);
    }

    // 金币窗口（可选）
    if (GF.AHS.param.ShowGoldWindow) {
        try {
            this._goldWindow = new Window_AlchemyGold();
            this.addWindow(this._goldWindow);
        } catch (e) {
            console.error('GF_AlchemySystem: 创建金币窗口失败', e);
        }
    }

    // 数量选择窗口（初始隐藏）
    try {
        this._numberInputWindow = new Window_AlchemyNumberInput();
        this.addWindow(this._numberInputWindow);
    } catch (e) {
        console.error('GF_AlchemySystem: 创建数量选择窗口失败', e);
    }

    this.updateGoldWindow();
};

Scene_Alchemy.prototype.start = function() {
    Scene_MenuBase.prototype.start.call(this);
    this._categoryWindow.activate();
};

Scene_Alchemy.prototype.onCategoryOk = function() {
    this._recipeListWindow.setCategory(this._categoryWindow.categoryId());
    this._recipeListWindow.activate();
    this._recipeListWindow.select(0);
    if (this._detailWindow) {
        this._detailWindow.setRecipe(this._recipeListWindow.recipe());
    }
    this.updateGoldWindow();
};

Scene_Alchemy.prototype.onCategoryCancel = function() {
    this.popScene();
};

Scene_Alchemy.prototype.onRecipeListCancel = function() {
    this._categoryWindow.activate();
};

Scene_Alchemy.prototype.onRecipeOk = function() {
    const recipe = this._recipeListWindow.recipe();
    if (!recipe) return;
    if (!AlchemyManager.isRecipeVisible(this._menuType, recipe)) {
        SoundManager.playBuzzer();
        return;
    }
    const maxCount = AlchemyManager.getMaxMakeCount(this._menuType, recipe.id);
    if (maxCount <= 0) {
        SoundManager.playBuzzer();
        return;
    }
    if (!this._numberInputWindow) {
        console.warn('GF_AlchemySystem: 数量选择窗口未创建');
        SoundManager.playBuzzer();
        return;
    }
    // 打开数量选择
    this._recipeListWindow.deactivate();
    if (this._categoryWindow) this._categoryWindow.deactivate();
    this._numberInputWindow.setup(this._menuType, recipe,
        this.onConfirmCraft.bind(this),
        this.onCancelCraft.bind(this)
    );
};

Scene_Alchemy.prototype.onConfirmCraft = function(count) {
    this._numberInputWindow.close();
    const recipe = this._recipeListWindow.recipe();
    if (!recipe) return;
    AlchemyManager.makeItem(this._menuType, recipe.id, count);
    this._recipeListWindow.refresh();
    if (this._detailWindow) this._detailWindow.refresh();
    this.updateGoldWindow();
    this._recipeListWindow.activate();
};

Scene_Alchemy.prototype.onCancelCraft = function() {
    this._numberInputWindow.close();
    this._recipeListWindow.activate();
};

Scene_Alchemy.prototype.updateGoldWindow = function() {
    if (this._goldWindow) {
        this._goldWindow.refresh();
    }
};

Scene_Alchemy.prototype.refresh = function() {
    if (this._recipeListWindow) this._recipeListWindow.refresh();
    if (this._detailWindow) this._detailWindow.refresh();
    this.updateGoldWindow();
};

//=============================================================================
// Plugin Commands
//=============================================================================

//=============================================================================
// PluginManager – Plugin Commands
//=============================================================================

PluginManager.registerCommand(GF.AHS.pluginName, 'OpenAlchemyMenu', args => {
    const menuType = String(args.MenuType || '');
    if (menuType) {
        AlchemyManager.open(menuType);
    } else {
        AlchemyManager.openMenuList();
    }
});

PluginManager.registerCommand(GF.AHS.pluginName, 'UnlockRecipe', args => {
    const menuType = String(args.MenuType || '');
    const recipeId = Number(args.RecipeId || 0);
    if (menuType && recipeId > 0) AlchemyManager.setRecipeUnlocked(menuType, recipeId, true);
});

PluginManager.registerCommand(GF.AHS.pluginName, 'LockRecipe', args => {
    const menuType = String(args.MenuType || '');
    const recipeId = Number(args.RecipeId || 0);
    if (menuType && recipeId > 0) AlchemyManager.setRecipeUnlocked(menuType, recipeId, false);
});

PluginManager.registerCommand(GF.AHS.pluginName, 'UnlockAllRecipes', args => {
    const menuType = String(args.MenuType || '');
    if (menuType) AlchemyManager.unlockAllRecipes(menuType);
});

PluginManager.registerCommand(GF.AHS.pluginName, 'LockAllRecipes', args => {
    const menuType = String(args.MenuType || '');
    if (menuType) AlchemyManager.lockAllRecipes(menuType);
});

PluginManager.registerCommand(GF.AHS.pluginName, 'EnableAlchemyMenu', args => {
    const menuType = String(args.MenuType || '');
    if (menuType) AlchemyManager.setMenuEnabled(menuType, true);
});

PluginManager.registerCommand(GF.AHS.pluginName, 'DisableAlchemyMenu', args => {
    const menuType = String(args.MenuType || '');
    if (menuType) AlchemyManager.setMenuEnabled(menuType, false);
});

PluginManager.registerCommand(GF.AHS.pluginName, 'ReloadAlchemyData', args => {
    AlchemyManager.reloadData();
});
