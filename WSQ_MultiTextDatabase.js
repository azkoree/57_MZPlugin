//=============================================================================
// 独立插件（兼容 GF 生态，可脱离 GF 文本核心运行）
// WSQ_MultiTextDatabase.js
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_MultiTextDatabase = true;

var WSQ = WSQ || {};
WSQ.MTD = WSQ.MTD || {};
WSQ.MTD.version = 1.00;
WSQ.MTD.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

/*:
 * @target MZ
 * @author WSQ
 * @plugindesc [v1.00]        文本 - 多文件文本库（剧本分卷引用）
 *
 * @help
 * ============================================================================
 * 介绍
 * ============================================================================
 * 本插件把游戏文本（剧本对话、旁白、选项、界面文案等）从事件编辑器里
 * 抽离出来，集中存放到外部 json 文件中，并在任意文本框通过占位符引用。
 *
 * 本插件受 IgnisTextDatabase 启发，并做了一些多json支持的优化。本插件启动时
 * 即加载「文本文件列表」参数列出的全部 json，并允许在引用中直接点名
 * 文件名，从而支持长篇剧本按章节/卷拆分到多个 json（如 ch01.json、
 * ch02.json …）的写法。
 *
 * 引用语法（任意文本框内）：
 *   ${文件名, 对象名.键名}
 *   例：${ch01, 旁白.序章}  →  替换为 scenario/ch01.json 中「旁白.序章」的值。
 *
 * 主要功能：
 *   - 多文件加载：启动时把参数列出的所有 json 读入内存，按文件名索引。
 *   - 点名引用：${文件名, 对象名.键名} 可指向任意文件中的任意文本。
 *   - 中文键名支持：对象名/键名可含中文，路径用 . 表示多级嵌套。
 *   - 热重载：提供「刷新文本库 / 刷新文本文件」指令，改完 json 无需重启游戏。
 *   - 缺失提示：引用不存在时显示「缺失文本」参数中的占位文本，不会崩溃。
 *   - 兼容性好：全部接入点均为 RMMZ 原版 API，不依赖 GF 文本核心，
 *     在 GF 项目与原版项目中均可运行。
 *   - 不破坏文本：替换发生在文本入库/绘制前，对齐与控制符照常处理。
 *
 * ============================================================================
 * 前置需求
 * ============================================================================
 * 本插件只需 RPG Maker MZ 原版运行环境，不依赖任何第三方核心（包括
 * GF_0_CoreOfText 文本核心），可独立运行；所有接入点均为 RMMZ 原版
 * API（Game_Message / Window_Base / Bitmap / Scene_Boot 等）。
 *
 * 层级说明：
 *   本插件只做文本替换、不提供 UI，与任何 GF 核心都无强制先后关系。
 *   建议放在所有会渲染文本的插件之下（加载越早，替换越早作用于文本
 *   测量与绘制）；纯原版项目放在插件列表任意位置即可。
 *
 * ============================================================================
 * 兼容性
 * ============================================================================
 * - 与 IgnisTextDatabase 二选一：启用本插件后应关闭/移除 IgnisTextDatabase，
 *   否则会出现重复替换或相互覆盖。
 * - 本插件只做文本替换，不新增/修改任何 UI，与 GF 任务、图鉴、成就等
 *   系统可共存；本插件不依赖 GF 文本核心，加载顺序只需保证位于会
 *   渲染文本的插件之下。
 * - 若项目同时使用其它也包裹 textSizeEx / Game_Message.add / Bitmap.drawText
 *   的插件，需手动核对包裹链顺序，确保本插件与对方逻辑都不丢失。
 *
 * ============================================================================
 * 备注（notetag）
 * ============================================================================
 * 本插件不使用数据库备注，所有配置均通过插件参数与文本 json 完成。
 *
 * ============================================================================
 * 插件指令
 * ============================================================================
 * MZ 新版插件指令（在事件里选择本插件后使用）：
 *   刷新文本库
 *       重新读取「文本文件列表」中的全部 json（改完多个文件后一次性刷新）。
 *
 *   刷新文本文件  文件名: ch01
 *       只重新读取指定的一个 json（文件名为基名，不含 .json 后缀）。
 *
 * 兼容旧版插件指令（MV 风格，事件参数写同一行）：
 *   刷新文本库
 *   刷新文本文件  文件名: ch01
 *
 * 注意：热重载指令仅开发期使用，发布版建议将参数「允许热重载」设为 false。
 *
 * ============================================================================
 * 脚本接口
 * ============================================================================
 * 读取文本：
 *   WSQ.MTD.getText("ch01", "旁白.序章")
 *       - 取得指定文本；不存在时返回 null。
 *   WSQ.MTD.getTextOr("ch01", "旁白.序章", "兜底文本")
 *       - 同上，不存在时返回兜底文本。
 *   WSQ.MTD.hasText("ch01", "旁白.序章")
 *       - 是否存在该文本，返回 true/false。
 *   WSQ.MTD.replace("文本${ch01, 旁白.序章}")
 *       - 对一段文本执行 ${...} 替换，返回替换后的字符串。
 *
 * 数据访问：
 *   WSQ.MTD.data
 *       - 全部已加载文本的对象，结构为 { ch01: {...}, ch02: {...}, ... }。
 *
 * 热重载：
 *   WSQ.MTD.reloadAll()     - 重新加载全部文件（等同「刷新文本库」指令）。
 *   WSQ.MTD.reloadFile("ch01") - 重新加载单个文件（等同「刷新文本文件」指令）。
 *
 * @command 刷新文本库
 * @text 刷新文本库
 * @desc 重新读取「文本文件列表」中的全部 json
 *
 * @command 刷新文本文件
 * @text 刷新文本文件
 * @desc 只重新读取指定的一个 json 文件
 * @arg 文件名
 * @text 文件名
 * @desc 文件基名，不含 .json 后缀
 *
 * @param 默认文件夹
 * @parent 一般设置
 * @text 默认文件夹
 * @desc 存放文本 json 的文件夹（相对于项目根目录，不含末尾 /）
 * @type text
 * @default scenario
 *
 * @param 文本文件列表
 * @parent 一般设置
 * @text 文本文件列表
 * @desc 要加载的 json 文件基名（不含 .json 后缀），启动时全部加载
 * @type text[]
 * @default ["ch01","ch02"]
 *
 * @param 缺失文本
 * @parent 一般设置
 * @text 缺失文本
 * @desc 引用不到时显示的占位文本；%1=文件名，%2=路径
 * @type text
 * @default 【文本缺失: %1.%2】
 *
 * @param 调试输出
 * @parent 一般设置
 * @text 调试输出
 * @desc 引用缺失时是否在控制台输出警告（开发期建议开启）
 * @type boolean
 * @default false
 *
 * @param 预加载模式
 * @parent 一般设置
 * @text 预加载模式
 * @desc true=进入游戏前确保全部加载完成；false=异步加载（首帧可能短暂显示缺失文本）
 * @type boolean
 * @default true
 *
 * @param 允许热重载
 * @parent 热重载设置
 * @text 允许热重载
 * @desc 是否启用「刷新文本库 / 刷新文本文件」指令（发布版建议关闭）
 * @type boolean
 * @default true
 */

//=============================================================================
// 参数读取
//=============================================================================
const WSQ_MTD_params = PluginManager.parameters(WSQ.MTD.pluginName);

WSQ.MTD.folder = String(WSQ_MTD_params["默认文件夹"] || "scenario").replace(/[\/\\]+$/g, "");
WSQ.MTD.files = (function() {
    try {
        const list = JSON.parse(WSQ_MTD_params["文本文件列表"] || "[]");
        return Array.isArray(list) ? list.map(String) : [];
    } catch (e) {
        console.warn("[WSQ_MultiTextDatabase] 参数「文本文件列表」格式错误，已按空列表处理。");
        return [];
    }
})();
WSQ.MTD.missingText = String(WSQ_MTD_params["缺失文本"] || "【文本缺失: %1.%2】");
WSQ.MTD.debugOutput = String(WSQ_MTD_params["调试输出"]) === "true";
WSQ.MTD.preload = String(WSQ_MTD_params["预加载模式"]) !== "false";
WSQ.MTD.allowReload = String(WSQ_MTD_params["允许热重载"]) !== "false";

//=============================================================================
// 数据与加载
//=============================================================================

WSQ.MTD.data = {};
WSQ.MTD._loadDone = false;
WSQ.MTD._loadFailed = [];

// ${文件名, 对象名.键名} 的非贪婪匹配，支持中文键名
WSQ.MTD._pattern = /\$\{\s*([^,]+?)\s*,\s*([^}]+?)\s*\}/g;

WSQ.MTD.loadFile = function(fileName) {
    return new Promise(function(resolve) {
        const url = WSQ.MTD.folder + "/" + fileName + ".json";
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.overrideMimeType("application/json; charset=utf-8");
        xhr.onload = function() {
            if (xhr.status === 200 || xhr.status === 0) {
                try {
                    WSQ.MTD.data[fileName] = JSON.parse(xhr.responseText);
                    WSQ.MTD._loadFailed = WSQ.MTD._loadFailed.filter(function(name) {
                        return name !== fileName;
                    });
                    resolve(true);
                } catch (e) {
                    console.error("[WSQ_MultiTextDatabase] json 解析失败：" + url, e);
                    WSQ.MTD._fail(fileName);
                    resolve(false);
                }
            } else {
                console.error("[WSQ_MultiTextDatabase] 加载失败：" + url + "（HTTP " + xhr.status + "）");
                WSQ.MTD._fail(fileName);
                resolve(false);
            }
        };
        xhr.onerror = function() {
            console.error("[WSQ_MultiTextDatabase] 加载失败（网络错误）：" + url);
            WSQ.MTD._fail(fileName);
            resolve(false);
        };
        xhr.send();
    });
};

WSQ.MTD._fail = function(fileName) {
    delete WSQ.MTD.data[fileName];
    if (WSQ.MTD._loadFailed.indexOf(fileName) === -1) {
        WSQ.MTD._loadFailed.push(fileName);
    }
};

WSQ.MTD.loadAll = function() {
    WSQ.MTD._loadDone = false;
    const jobs = WSQ.MTD.files.slice().map(function(fileName) {
        return WSQ.MTD.loadFile(fileName);
    });
    return Promise.all(jobs).then(function() {
        WSQ.MTD._loadDone = true;
        if (WSQ.MTD._loadFailed.length > 0) {
            console.warn(
                "[WSQ_MultiTextDatabase] 以下文件加载失败，相关引用将显示缺失文本：" +
                WSQ.MTD._loadFailed.join(", ")
            );
        }
        return true;
    });
};

WSQ.MTD.reloadAll = function() {
    return WSQ.MTD.loadAll();
};

WSQ.MTD.reloadFile = function(fileName) {
    fileName = String(fileName || "").trim();
    if (!fileName) return Promise.resolve(false);
    delete WSQ.MTD.data[fileName];
    return WSQ.MTD.loadFile(fileName);
};

WSQ.MTD.isReady = function() {
    if (!WSQ.MTD.preload) return true;
    return WSQ.MTD._loadDone;
};

//=============================================================================
// 文本读取与替换
//=============================================================================

WSQ.MTD._getByPath = function(obj, path) {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length; i++) {
        if (current === null || typeof current !== "object") return null;
        current = current[keys[i]];
    }
    return typeof current === "string" ? current : null;
};

WSQ.MTD.getText = function(fileName, path) {
    const file = WSQ.MTD.data[String(fileName)];
    if (file === undefined || typeof file !== "object") return null;
    return WSQ.MTD._getByPath(file, String(path));
};

WSQ.MTD.getTextOr = function(fileName, path, fallback) {
    const text = WSQ.MTD.getText(fileName, path);
    return text !== null ? text : fallback;
};

WSQ.MTD.hasText = function(fileName, path) {
    return WSQ.MTD.getText(fileName, path) !== null;
};

WSQ.MTD._missing = function(fileName, path) {
    return WSQ.MTD.missingText.replace(/%1/g, fileName).replace(/%2/g, path);
};

WSQ.MTD.replace = function(text) {
    if (typeof text !== "string") return text;
    if (text.indexOf("${") === -1) return text;
    return text.replace(WSQ.MTD._pattern, function(match, fileName, path) {
        const file = fileName.trim();
        const keyPath = path.trim();
        const value = WSQ.MTD.getText(file, keyPath);
        if (value !== null) return value;
        if (WSQ.MTD.debugOutput) {
            console.warn("[WSQ_MultiTextDatabase] 文本缺失：" + file + "." + keyPath);
        }
        return WSQ.MTD._missing(file, keyPath);
    });
};

//=============================================================================
// 文本管线接入（全部使用 RMMZ 原版 API，无需 GF 文本核心）
//=============================================================================

// 消息框文本：在入库时替换，之后控制符照常处理
const WSQ_MTD_GameMessage_add = Game_Message.prototype.add;
Game_Message.prototype.add = function(text) {
    return WSQ_MTD_GameMessage_add.call(this, WSQ.MTD.replace(text));
};

// 窗口文本测量：保证换行/宽度计算使用替换后的文本
const WSQ_MTD_WindowBase_textSizeEx = Window_Base.prototype.textSizeEx;
Window_Base.prototype.textSizeEx = function(text) {
    return WSQ_MTD_WindowBase_textSizeEx.call(this, WSQ.MTD.replace(text));
};

// 若其它插件（如 GF_0_CoreOfText）给 Sprite 增加了文本测量方法，一并包裹
if (Sprite.prototype.textSizeEx) {
    const WSQ_MTD_Sprite_textSizeEx = Sprite.prototype.textSizeEx;
    Sprite.prototype.textSizeEx = function(text) {
        return WSQ_MTD_Sprite_textSizeEx.call(this, WSQ.MTD.replace(text));
    };
}

// 位图直绘：覆盖选项、名字框、滚动文字等所有最终走 drawText 的文本
const WSQ_MTD_Bitmap_drawText = Bitmap.prototype.drawText;
Bitmap.prototype.drawText = function(text, x, y, maxWidth, lineHeight, align) {
    return WSQ_MTD_Bitmap_drawText.call(
        this, WSQ.MTD.replace(text), x, y, maxWidth, lineHeight, align
    );
};

//=============================================================================
// 预加载模式：进入标题/地图前确保文本全部就绪
//=============================================================================
const WSQ_MTD_SceneBoot_isReady = Scene_Boot.prototype.isReady;
Scene_Boot.prototype.isReady = function() {
    if (!WSQ.MTD.isReady()) return false;
    return WSQ_MTD_SceneBoot_isReady.call(this);
};

//=============================================================================
// 插件指令
//=============================================================================

WSQ.MTD._extractFileName = function(args) {
    if (typeof args === "string") {
        const m = args.match(/文件名\s*[:：]\s*([A-Za-z0-9_]+)/);
        return m ? m[1] : args.trim();
    }
    if (args && typeof args === "object") {
        const raw = args["文件名"] !== undefined
            ? args["文件名"]
            : (args.fileName !== undefined ? args.fileName : args.file);
        return String(raw || "").trim();
    }
    return "";
};

PluginManager.registerCommand(WSQ.MTD.pluginName, "刷新文本库", function() {
    if (!WSQ.MTD.allowReload) return;
    WSQ.MTD.reloadAll().then(function() {
        console.log("[WSQ_MultiTextDatabase] 已刷新全部文本库。");
    });
});

PluginManager.registerCommand(WSQ.MTD.pluginName, "刷新文本文件", function(args) {
    if (!WSQ.MTD.allowReload) return;
    const fileName = WSQ.MTD._extractFileName(args);
    if (!fileName) {
        console.warn("[WSQ_MultiTextDatabase] 未识别到文件名，指令格式：刷新文本文件  文件名: ch01");
        return;
    }
    WSQ.MTD.reloadFile(fileName).then(function() {
        console.log("[WSQ_MultiTextDatabase] 已刷新文件：" + fileName);
    });
});

// 兼容旧版插件指令（MV 风格，走 Game_Interpreter.pluginCommand）
const WSQ_MTD_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    WSQ_MTD_pluginCommand.call(this, command, args);
    if (!WSQ.MTD.allowReload) return;
    if (command === "刷新文本库") {
        WSQ.MTD.reloadAll();
    } else if (command === "刷新文本文件") {
        const fileName = WSQ.MTD._extractFileName((args || []).join(" "));
        if (fileName) WSQ.MTD.reloadFile(fileName);
    }
};

//=============================================================================
// 启动时加载
//=============================================================================
WSQ.MTD.loadAll();
