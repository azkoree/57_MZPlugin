//=============================================================================
// SVBattlerAdvance.js
//=============================================================================

var Imported = Imported || {};
Imported.SVBattlerAdvance = true;

var GF = GF || {};
GF.ADSV = GF.ADSV || {};
GF.ADSV.version = 1.00;
GF.ADSV.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.00]  战斗 - 独立多帧精灵图SV战斗
 * @author 
 * @url 
 * @orderAfter GF_2_CoreOfBattle
 * @orderAfter GF_2_CoreOfEnemy
 * @orderAfter GF_3_ActSeqSystem
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 *
 * 用多张独立的一行多帧精灵图，来代替原版SV单张拼合图。
 * 支持每动作不同的帧数、帧速和播放模式。
 *
 * ============================================================================
 *  素材规格
 * ============================================================================
 *
 * 为每个角色在 img/sv_actors 下建立文件夹，取名 Actor_id（id=数据库id）
 * 例如 1号角色 → img/sv_actors/Actor_1/
 *
 * 为每个敌人SV图在 img/sv_actors 下建立文件夹，取名为SV贴图名称
 * （即 <Sideview Battler: x> 中的 x）。例如 SV贴图名为 Dragon
 * → img/sv_actors/Dragon/
 * 同时，也要在img/sv_actors下随便放一张与SV贴图同名的图，否则无法读取，例如：
 * → img/sv_actors/Dragon.png
 *
 * 每个动作对应一张单行多帧PNG图，以动作名命名。例如：
 *   img/sv_actors/Actor_1/walk.png
 *   img/sv_actors/Actor_1/thrust.png
 *
 * ============================================================================
 *  备注 - 角色/敌人
 * ============================================================================
 *
 *   <adsv>
 *    motion_framecount_speed_play;
 *    motion_framecount_speed_play
 *   </adsv>
 *
 * - motion:     动作名（walk, wait, chant, guard, damage, evade, thrust,
 *               swing, missile, skill, spell, item, escape, victory,
 *               dying, abnormal, sleep, dead，以及额外自定义动作名）
 * - framecount: 该图帧数（如3, 4, 6等）
 * - speed:      帧速，每帧间隔的帧数（如8, 12）
 * - play:       播放方式（repeat / once / pingpong）
 *
 * 例如: walk_4_12_repeat;
 *
 * ============================================================================
 *  额外动作
 * ============================================================================
 *
 * 可在下方插件参数中设定额外动作名。在角色备注中配置后，
 * 即可在GF行动序列中通过脚本命令调用：
 *
 *   user.forceMotion('动作名');
 *
 * ============================================================================
 *  兼容性
 * ============================================================================
 *
 * 兼容 GF 系列插件（GF_2_CoreOfBattle、GF_2_CoreOfEnemy、GF_3_ActSeqSystem）。
 * 建议放在 GF_3_ActSeqSystem 之后。
 *
 * ============================================================================
 *
 * @param ExtraMotions
 * @text 额外动作列表
 * @type string[]
 * @desc 每行输入一个额外动作名（不可与原生18个动作名重复）。配置后可在行动序列中通过脚本命令调用。
 * @default []
 *
 * @param DefaultSpeed
 * @text 默认帧速
 * @type number
 * @desc 未在备注中指定speed时使用的默认帧速
 * @default 12
 * @min 1
 *
 * @param DefaultPlay
 * @text 默认播放模式
 * @type select
 * @option repeat
 * @value repeat
 * @option once
 * @value once
 * @option pingpong
 * @value pingpong
 * @desc 未在备注中指定play时使用的默认播放模式
 * @default repeat
 *
 */

//=============================================================================
// 参数初始化
//=============================================================================

GF.ADSV.Parameters = PluginManager.parameters(GF.ADSV.pluginName);

GF.ADSV.extraMotions = (function() {
    const raw = GF.ADSV.Parameters["ExtraMotions"] || "";
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
})();

GF.ADSV.defaultSpeed = Number(GF.ADSV.Parameters["DefaultSpeed"]) || 12;
GF.ADSV.defaultPlay = String(GF.ADSV.Parameters["DefaultPlay"]) || "repeat";

//=============================================================================
// 额外动作注入
//=============================================================================

(function() {
    const extraMotions = GF.ADSV.extraMotions;
    const nativeMotions = [
        "walk", "wait", "chant", "guard", "damage", "evade",
        "thrust", "swing", "missile", "skill", "spell", "item",
        "escape", "victory", "dying", "abnormal", "sleep", "dead"
    ];

    // 找到目前 MOTIONS 中的最大 index
    let maxIndex = 0;
    for (const key in Sprite_Actor.MOTIONS) {
        if (Sprite_Actor.MOTIONS[key].index > maxIndex) {
            maxIndex = Sprite_Actor.MOTIONS[key].index;
        }
    }

    for (let i = 0; i < extraMotions.length; i++) {
        const name = extraMotions[i].trim();
        if (!name) continue;
        if (nativeMotions.includes(name)) {
            console.warn("[ADSV] 额外动作名 '" + name + "' 与原生动作名冲突，已跳过。");
            continue;
        }
        if (Sprite_Actor.MOTIONS[name]) {
            console.warn("[ADSV] 额外动作名 '" + name + "' 已存在，已跳过。");
            continue;
        }
        maxIndex++;
        Sprite_Actor.MOTIONS[name] = { index: maxIndex, loop: true };
    }
})();

//=============================================================================
// 备注解析
//=============================================================================

// 解析 <adsv> 标签块
function parseAdsvNotetag(note) {
    const config = {};
    const match = note.match(/<adsv>([\s\S]*?)<\/adsv>/i);
    if (!match) return null;

    const lines = match[1].split(/[\r\n]+/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === ';') continue;

        // 去掉末尾分号
        const content = trimmed.endsWith(';') ? trimmed.slice(0, -1) : trimmed;

        // 格式: motion_framecount_speed_play
        const parts = content.split('_');
        if (parts.length !== 4) {
            console.warn("[ADSV] 无法解析的条目: " + trimmed);
            continue;
        }

        const motion = parts[0].trim();
        const framecount = parseInt(parts[1], 10);
        const speed = parseInt(parts[2], 10);
        const play = parts[3].trim().toLowerCase();

        if (isNaN(framecount) || framecount <= 0) {
            console.warn("[ADSV] 帧数无效: " + trimmed);
            continue;
        }
        if (isNaN(speed) || speed <= 0) {
            console.warn("[ADSV] 帧速无效: " + trimmed);
            continue;
        }
        if (!["repeat", "once", "pingpong"].includes(play)) {
            console.warn("[ADSV] 播放模式无效（应为 repeat/once/pingpong）: " + trimmed);
            continue;
        }

        config[motion] = {
            framecount: framecount,
            speed: speed,
            play: play
        };
    }

    return Object.keys(config).length > 0 ? config : null;
}

//=============================================================================
// Game_Actor / Game_Enemy 扩展
//=============================================================================

// 角色备注解析
const _SV_Game_Actor_setup = Game_Actor.prototype.setup;
Game_Actor.prototype.setup = function(actorId) {
    _SV_Game_Actor_setup.call(this, actorId);
    this._adsvConfig = null;
    const actor = $dataActors[actorId];
    if (actor && actor.note) {
        this._adsvConfig = parseAdsvNotetag(actor.note);
    }
};

Game_Actor.prototype.adsvConfig = function() {
    return this._adsvConfig;
};

Game_Actor.prototype.hasAdsv = function() {
    return !!this._adsvConfig;
};

// 敌人备注解析
const _SV_Game_Enemy_setup = Game_Enemy.prototype.setup;
Game_Enemy.prototype.setup = function(enemyId, x, y) {
    // 必须在原生 setup 之前解析，因为 GF 的 transform() 会在内部提前挂精灵
    this._adsvConfig = null;
    const enemy = $dataEnemies[enemyId];
    if (enemy && enemy.note) {
        this._adsvConfig = parseAdsvNotetag(enemy.note);
    }
    _SV_Game_Enemy_setup.call(this, enemyId, x, y);
};

Game_Enemy.prototype.adsvConfig = function() {
    return this._adsvConfig;
};

Game_Enemy.prototype.hasAdsv = function() {
    return !!this._adsvConfig;
};

//=============================================================================
// 辅助函数
//=============================================================================

// 获取指定动作的配置
GF.ADSV.getMotionConfig = function(battler, motionType) {
    const config = battler.adsvConfig ? battler.adsvConfig() : null;
    if (!config) return null;
    return config[motionType] || null;
};

// 获取运动图的文件夹路径和文件名
GF.ADSV.getMotionImageFolder = function(battler) {
    if (battler.isActor()) {
        return 'img/sv_actors/Actor_' + battler.actorId() + '/';
    } else if (battler.isEnemy()) {
        const svName = battler.svBattlerName ? battler.svBattlerName() : '';
        if (svName) {
            return 'img/sv_actors/' + svName + '/';
        }
        return 'img/sv_actors/Enemy_' + battler._enemyId + '/';
    }
    return '';
};

// 加载指定动作的图片
GF.ADSV.loadMotionBitmap = function(battler, motionType) {
    const folder = GF.ADSV.getMotionImageFolder(battler);
    if (!folder) {
        return ImageManager.loadEmptyBitmap ?
            ImageManager.loadEmptyBitmap() :
            new Bitmap(1, 1);
    }
    return ImageManager.loadBitmap(folder, motionType);
};

// 预加载该 battler 所有已配置动作的图片
GF.ADSV.preloadMotionBitmaps = function(battler) {
    if (!battler || !battler.hasAdsv || !battler.hasAdsv()) return;
    const config = battler.adsvConfig();
    if (!config) return;
    const folder = GF.ADSV.getMotionImageFolder(battler);
    if (!folder) return;
    for (const motionName in config) {
        ImageManager.loadBitmap(folder, motionName);
    }
};

//=============================================================================
// Sprite_Battler 共享逻辑
//=============================================================================

// 获取 Sprite 当前所属的 battler（兼容 actor 和 enemy）
GF.ADSV.getSpriteBattler = function(sprite) {
    if (sprite._actor) return sprite._actor;
    if (sprite._enemy) return sprite._enemy;
    return null;
};

// 检查 sprite 是否应该启用 ADSV 渲染
GF.ADSV.isAdsvActive = function(sprite) {
    const battler = GF.ADSV.getSpriteBattler(sprite);
    if (!battler || !battler.hasAdsv || !battler.hasAdsv()) return false;

    // 对于敌人，还需要检查是否处于 SV 模式
    if (battler.isEnemy && battler.isEnemy()) {
        if (!sprite._svMode) return false;
    }

    return true;
};

// 获取 sprite 当前运动名（通过 _motion.index 反查）
GF.ADSV.getSpriteMotionName = function(sprite) {
    // 优先使用缓存的名称
    if (sprite._adsvMotionName) return sprite._adsvMotionName;

    if (!sprite._motion) return null;

    // 从 Sprite_Actor.MOTIONS 中反查
    const index = sprite._motion.index;
    for (const key in Sprite_Actor.MOTIONS) {
        if (Sprite_Actor.MOTIONS[key].index === index) {
            return key;
        }
    }
    return null;
};

// 获取当前运动的配置
GF.ADSV.getCurrentMotionConfig = function(sprite) {
    const battler = GF.ADSV.getSpriteBattler(sprite);
    if (!battler) return null;

    const motionName = GF.ADSV.getSpriteMotionName(sprite);
    if (!motionName) return null;

    return GF.ADSV.getMotionConfig(battler, motionName);
};

// 处理运动切换：加载对应图片
GF.ADSV.handleMotionChange = function(sprite, motionType) {
    const battler = GF.ADSV.getSpriteBattler(sprite);
    if (!battler || !battler.hasAdsv || !battler.hasAdsv()) return;

    // 对于敌人，检查SV模式
    if (battler.isEnemy && battler.isEnemy()) {
        if (!sprite._svMode) return;
    }

    // 同动作不重复加载
    if (sprite._adsvMotionName === motionType) return;

    // 首次触发：预加载该 battler 所有已配置动作的图片
    if (!sprite._adsvPreloaded) {
        sprite._adsvPreloaded = true;
        GF.ADSV.preloadMotionBitmaps(battler);
    }

    // 检查该动作是否有配置
    const config = GF.ADSV.getMotionConfig(battler, motionType);
    if (!config) return; // 未配置的动作，不动图片

    // 记录运动名
    sprite._adsvMotionName = motionType;

    // 加载对应图片
    const mainSprite = sprite._mainSprite || (sprite.mainSprite && sprite.mainSprite());
    if (mainSprite) {
        const bitmap = GF.ADSV.loadMotionBitmap(battler, motionType);
        mainSprite.bitmap = bitmap;
        // 兼容 GF: 设 smooth
        if (bitmap) bitmap.smooth = true;
        // 立即裁切到第0帧，消除 bitmap 赋值到 updateFrame 之间的闪图间隙
        if (bitmap && bitmap.isReady()) {
            const cw = bitmap.width / config.framecount;
            mainSprite.setFrame(0, 0, cw, bitmap.height);
            sprite.setFrame(0, 0, cw, bitmap.height);
        }
    }

    // 重置 pingpong 方向
    sprite._pingpongDir = 1;

    // 敌人SV图镜像处理：敌人应面向左
    if (battler.isEnemy && battler.isEnemy() && sprite.scale && sprite.scale.x > 0) {
        sprite.scale.x *= -1;
        if (sprite._stateIconSprite) sprite._stateIconSprite.scale.x *= -1;
        if (sprite._stateSprite) sprite._stateSprite.scale.x *= -1;
        if (sprite._nameSprite) sprite._nameSprite.scale.x *= -1;
    }
};

//=============================================================================
// Sprite_Actor 覆盖
//=============================================================================

// 保存当前实现（可能是 GF 覆盖后的）
const _Sprite_Actor_updateBitmap = Sprite_Actor.prototype.updateBitmap;
const _Sprite_Actor_updateFrame = Sprite_Actor.prototype.updateFrame;
const _Sprite_Actor_updateMotionCount = Sprite_Actor.prototype.updateMotionCount;
const _Sprite_Actor_startMotion = Sprite_Actor.prototype.startMotion;
const _Sprite_Actor_forceMotion = Sprite_Actor.prototype.forceMotion;
const _Sprite_Actor_motionSpeed = Sprite_Actor.prototype.motionSpeed;

// updateBitmap: 跳过 ADSV 角色，但主动触发 ADSV 图片加载
Sprite_Actor.prototype.updateBitmap = function() {
    if (GF.ADSV.isAdsvActive(this)) {
        // 主动触发 ADSV 动作图片加载（一致性考虑，与 Sprite_Enemy 同理）
        if (!this._adsvMotionName) {
            const motionName = GF.ADSV.getSpriteMotionName(this);
            if (motionName) {
                GF.ADSV.handleMotionChange(this, motionName);
            }
        }
        return;
    }
    _Sprite_Actor_updateBitmap.call(this);
};

// updateFrame: 自定义单行多帧切分
Sprite_Actor.prototype.updateFrame = function() {
    if (!GF.ADSV.isAdsvActive(this)) {
        _Sprite_Actor_updateFrame.call(this);
        return;
    }

    Sprite_Battler.prototype.updateFrame.call(this);

    const bitmap = this._mainSprite.bitmap;
    if (!bitmap || !bitmap.isReady()) return;

    const config = GF.ADSV.getCurrentMotionConfig(this);
    if (!config) return;

    const framecount = config.framecount;
    const cw = bitmap.width / framecount;
    const ch = bitmap.height;
    const cx = this._pattern * cw;

    this._mainSprite.setFrame(cx, 0, cw, ch);
    this.setFrame(0, 0, cw, ch);
};

// updateMotionCount: 三种播放模式
Sprite_Actor.prototype.updateMotionCount = function() {
    if (!GF.ADSV.isAdsvActive(this)) {
        _Sprite_Actor_updateMotionCount.call(this);
        return;
    }

    if (!this._motion) return;

    const config = GF.ADSV.getCurrentMotionConfig(this);
    if (!config) return;

    const speed = config.speed || GF.ADSV.defaultSpeed;
    const framecount = config.framecount;
    const play = config.play || GF.ADSV.defaultPlay;

    if (++this._motionCount >= speed) {
        if (play === 'repeat') {
            this._pattern = (this._pattern + 1) % framecount;
        } else if (play === 'once') {
            if (this._pattern < framecount - 1) {
                this._pattern++;
            }
        } else if (play === 'pingpong') {
            if (this._pingpongDir === undefined) this._pingpongDir = 1;
            this._pattern += this._pingpongDir;
            if (this._pattern >= framecount - 1) {
                this._pingpongDir = -1;
            } else if (this._pattern <= 0) {
                this._pingpongDir = 1;
            }
        }
        this._motionCount = 0;
    }
};

// motionSpeed: 返回当前运动的速度
Sprite_Actor.prototype.motionSpeed = function() {
    if (GF.ADSV.isAdsvActive(this)) {
        const config = GF.ADSV.getCurrentMotionConfig(this);
        if (config) return config.speed || GF.ADSV.defaultSpeed;
    }
    return _Sprite_Actor_motionSpeed.call(this);
};

// startMotion: 运动切换时加载对应图片
Sprite_Actor.prototype.startMotion = function(motionType) {
    _Sprite_Actor_startMotion.call(this, motionType);
    GF.ADSV.handleMotionChange(this, motionType);
};

// forceMotion: 运动切换时加载对应图片（仅 GF 定义，需兼容原生）
if (_Sprite_Actor_forceMotion) {
    Sprite_Actor.prototype.forceMotion = function(motionType) {
        _Sprite_Actor_forceMotion.call(this, motionType);
        GF.ADSV.handleMotionChange(this, motionType);
    };
} else {
    // 原生 MZ 不存在 forceMotion，以 startMotion 代替
    Sprite_Actor.prototype.forceMotion = function(motionType) {
        _Sprite_Actor_startMotion.call(this, motionType);
        GF.ADSV.handleMotionChange(this, motionType);
    };
}

//=============================================================================
// Sprite_Enemy 覆盖
//=============================================================================

// 保存当前实现（可能是 GF 覆盖后的）
const _Sprite_Enemy_updateBitmap = Sprite_Enemy.prototype.updateBitmap;
const _Sprite_Enemy_updateFrame = Sprite_Enemy.prototype.updateFrame;
const _Sprite_Enemy_updateMotionCount = Sprite_Enemy.prototype.updateMotionCount;
const _Sprite_Enemy_startMotion = Sprite_Enemy.prototype.startMotion;
const _Sprite_Enemy_forceMotion = Sprite_Enemy.prototype.forceMotion;
const _Sprite_Enemy_motionSpeed = Sprite_Enemy.prototype.motionSpeed;

// updateBitmap: 跳过 ADSV 敌人，但主动触发 ADSV 图片加载
Sprite_Enemy.prototype.updateBitmap = function() {
    if (GF.ADSV.isAdsvActive(this)) {
        // 主动触发 ADSV 动作图片加载
        // 在 updateBitmap 阶段（比 updateMotion→startMotion 早一帧）启动异步加载，
        // 从而缩小或消除敌人因图片异步加载而延迟闪现的时间窗口
        if (!this._adsvMotionName) {
            const motionName = GF.ADSV.getSpriteMotionName(this);
            if (motionName) {
                GF.ADSV.handleMotionChange(this, motionName);
            } else if (this._enemy) {
                // _motion 尚未设置（updateMotion 还没执行），直接从 battler 获取待机动作
                const idleMotion = this._enemy.idleMotion();
                if (idleMotion) {
                    GF.ADSV.handleMotionChange(this, idleMotion);
                }
            }
        }
        return;
    }
    _Sprite_Enemy_updateBitmap.call(this);
};

// updateFrame: 自定义单行多帧切分
Sprite_Enemy.prototype.updateFrame = function() {
    if (!GF.ADSV.isAdsvActive(this)) {
        _Sprite_Enemy_updateFrame.call(this);
        return;
    }

    Sprite_Battler.prototype.updateFrame.call(this);

    const bitmap = this._mainSprite.bitmap;
    if (!bitmap || !bitmap.isReady()) return;

    const config = GF.ADSV.getCurrentMotionConfig(this);
    if (!config) return;

    const framecount = config.framecount;
    const cw = bitmap.width / framecount;
    const ch = bitmap.height;
    const cx = this._pattern * cw;

    this._mainSprite.setFrame(cx, 0, cw, ch);

    // 兼容 GF 敌人的点击区域和阴影
    if (this.setMainEnemyFrame) this.setMainEnemyFrame(cw, ch);
    if (this.setSVShadow) this.setSVShadow();

    this.setFrame(0, 0, cw, ch);
};

// updateMotionCount: 三种播放模式
Sprite_Enemy.prototype.updateMotionCount = function() {
    if (!GF.ADSV.isAdsvActive(this)) {
        _Sprite_Enemy_updateMotionCount.call(this);
        return;
    }

    if (!this._motion) return;

    const config = GF.ADSV.getCurrentMotionConfig(this);
    if (!config) return;

    const speed = config.speed || GF.ADSV.defaultSpeed;
    const framecount = config.framecount;
    const play = config.play || GF.ADSV.defaultPlay;

    if (++this._motionCount >= speed) {
        if (play === 'repeat') {
            this._pattern = (this._pattern + 1) % framecount;
        } else if (play === 'once') {
            if (this._pattern < framecount - 1) {
                this._pattern++;
            }
        } else if (play === 'pingpong') {
            if (this._pingpongDir === undefined) this._pingpongDir = 1;
            this._pattern += this._pingpongDir;
            if (this._pattern >= framecount - 1) {
                this._pingpongDir = -1;
            } else if (this._pattern <= 0) {
                this._pingpongDir = 1;
            }
        }
        this._motionCount = 0;
    }
};

// motionSpeed: 返回当前运动的速度
Sprite_Enemy.prototype.motionSpeed = function() {
    if (GF.ADSV.isAdsvActive(this)) {
        const config = GF.ADSV.getCurrentMotionConfig(this);
        if (config) return config.speed || GF.ADSV.defaultSpeed;
    }
    return _Sprite_Enemy_motionSpeed.call(this);
};

// startMotion: 运动切换时加载对应图片
Sprite_Enemy.prototype.startMotion = function(motionType) {
    _Sprite_Enemy_startMotion.call(this, motionType);
    GF.ADSV.handleMotionChange(this, motionType);
};

// forceMotion: 运动切换时加载对应图片
if (_Sprite_Enemy_forceMotion) {
    Sprite_Enemy.prototype.forceMotion = function(motionType) {
        _Sprite_Enemy_forceMotion.call(this, motionType);
        GF.ADSV.handleMotionChange(this, motionType);
    };
} else {
    Sprite_Enemy.prototype.forceMotion = function(motionType) {
        _Sprite_Enemy_startMotion.call(this, motionType);
        GF.ADSV.handleMotionChange(this, motionType);
    };
}

//=============================================================================
// 行动序列脚本调用辅助
//=============================================================================

// 提供一个安全的 forceMotion 调用，便于在行动序列脚本中使用
GF.ADSV.callMotion = function(battler, motionType) {
    if (!battler) return;
    if (typeof battler.forceMotion === 'function') {
        battler.forceMotion(motionType);
    }
};

//=============================================================================
// 初始化信息
//=============================================================================

console.log("[ADSV] SVBattlerAdvance v" + GF.ADSV.version + " 已加载。");
if (GF.ADSV.extraMotions.length > 0) {
    console.log("[ADSV] 额外动作: " + GF.ADSV.extraMotions.join(", "));
}
