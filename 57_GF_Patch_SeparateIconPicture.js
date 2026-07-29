//=============================================================================
// GF Patch Plugins
// 57_GF_Patch_SeparateIconPicture.js
//=============================================================================

var Imported = Imported || {};
Imported['57_GF_Patch_SeparateIconPicture'] = true;

var GF = GF || {};
GF.Patch = GF.Patch || {};
GF.Patch.SeparateIconPicture = { version: 1.00 };

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.00]  修补 - 分离列表图标与信息窗大图片
 * @author gt50 (patch by user)
 * 
 * @orderAfter GF_1_CoreOfWindowUI
 * @orderAfter GF_2_CoreOfItemEquip
 * @orderAfter GF_2_CoreOfSkillElement
 * @orderAfter GF_3_ItemInfoWindow
 * @base GF_1_CoreOfWindowUI
 * @base GF_3_ItemInfoWindow
 *
 * @help
 * ============================================================================
 *   介绍
 * ============================================================================
 * 
 * GF 系列插件中，当物品/技能通过备注指定了大图片（<图片: xx> 或
 * <Picture: xx>）后，Window_Base.drawItemIcon 会统一将其绘制在
 * 所有调用方中——包括物品列表、技能列表、鼠标悬浮预览等地方。
 * 
 * 这意味着大图片被缩小显示在列表格子中，而不是使用数据库设定的小图标。
 * 
 * 本插件将两者分离：
 * 
 *   • 物品列表 / 技能列表 → 始终显示数据库小图标（iconIndex）
 *   • 道具信息窗口 → 有 <图片: xx> 时显示大图片，否则显示小图标
 *   • 鼠标悬浮预览 → 始终显示数据库小图标
 * 
 * ============================================================================
 *   使用方法
 * ============================================================================
 * 
 * 将本插件放在以下插件的下方（按此顺序）：
 * 
 *   GF_1_CoreOfWindowUI    （提供图片查询 API）
 *   GF_2_CoreOfItemEquip   （物品列表-大图标绘制模式）
 *   GF_2_CoreOfSkillElement（技能列表-大图标绘制模式）
 *   GF_3_ItemInfoWindow    （道具信息窗口）
 * 
 * 无需任何参数设置。
 * 
 * ============================================================================
 *   原理说明
 * ============================================================================
 * 
 * GF_1_CoreOfWindowUI 覆盖了 Window_Base.prototype.drawItemIcon，
 * 使其在 itemHasPictureImage() 为 true 时直接绘制大图片（缩放至格子尺寸），
 * 而非数据库小图标。这导致所有调用 drawItemIcon 的地方都受影响。
 * 
 * 本插件：
 * 
 *   1. 还原 Window_Base.prototype.drawItemIcon，使其永远绘制
 *      item.iconIndex（数据库小图标）。
 * 
 *   2. 覆盖 Window_ObjInfoBase.prototype.drawItemIcon（道具/技能
 *      信息窗口），在 ShowBigIcon 且 item 有图片时绘制大图片。
 * 
 *   3. 覆盖 Sprite_CusorItem.prototype.refresh（鼠标悬浮预览），
 *      强制使用 item.iconIndex。
 * 
 * ============================================================================
 *   更新日志
 * ============================================================================
 * 
 * [v1.00] 初始版本
 *
 */
//=============================================================================

//=============================================================================
// 依赖检查
//=============================================================================

if (!Imported.GF_1_CoreOfWindowUI) {
    alert("错误: 未找到前置插件 GF_1_CoreOfWindowUI。\n请确保 57_GF_Patch_SeparateIconPicture.js 放在 GF_1_CoreOfWindowUI 下方。");
}
if (!Imported.GF_3_ItemInfoWindow) {
    alert("错误: 未找到前置插件 GF_3_ItemInfoWindow。\n请确保 57_GF_Patch_SeparateIconPicture.js 放在 GF_3_ItemInfoWindow 下方。");
}

//=============================================================================
// 1. Window_Base.prototype.drawItemIcon
//    — 始终绘制数据库小图标，忽略 pictureImg
//=============================================================================

GF.Patch.SeparateIconPicture.Window_Base_drawItemIcon = Window_Base.prototype.drawItemIcon;
Window_Base.prototype.drawItemIcon = function (item, rect) {
    if (!item) return;
    const { x, y, width, height } = rect;
    this.drawIcon(item.iconIndex, x, y, width, height, true);
    this.drawOverlayItemIcon(item, rect);
};

//=============================================================================
// 2. Window_ObjInfoBase.prototype.drawItemIcon（信息窗口）
//    — 有 pictureImg 时绘制大图片，否则回退为小图标
//=============================================================================

GF.Patch.SeparateIconPicture.Window_ObjInfoBase_drawItemIcon = Window_ObjInfoBase.prototype.drawItemIcon;
Window_ObjInfoBase.prototype.drawItemIcon = function () {
    const item = this._item;
    // 仅在 "显示大图标" 模式且 item 有图片时拦截
    if (item && this._windowSet && this._windowSet.ShowBigIcon && ImageManager.itemHasPictureImage(item)) {
        const x = this.itemPadding();
        const ww = this.lineHeight() * 3;
        const rect = new Rectangle(x, x, ww, ww);
        const bitmap = ImageManager.getItemPictureImage(item);
        this.drawBitmap(bitmap, rect);
        if (this._windowSet.BigIconFrame) {
            this.drawItemCellGrid(item, rect);
        }
        return this.titleHeight();
    }
    // 无图片时回退原逻辑（绘制数据库小图标或文本格式图标）
    return GF.Patch.SeparateIconPicture.Window_ObjInfoBase_drawItemIcon.call(this);
};

//=============================================================================
// 3. Sprite_CusorItem.prototype.refresh（鼠标悬浮预览）
//    — 强制使用 item.iconIndex，忽略 pictureImg
//=============================================================================

if (typeof Sprite_CusorItem !== 'undefined') {
    GF.Patch.SeparateIconPicture.Sprite_CusorItem_refresh = Sprite_CusorItem.prototype.refresh;
    Sprite_CusorItem.prototype.refresh = function () {
        const item = this._item;
        this.bitmap.clear();
        if (!item) return;
        const dx = 1;
        const dy = 1;
        const dw = this.bitmap.width - 2;
        const dh = this.bitmap.height - 2;
        this.bitmap.fillRect(dx, dy, dw, dh, 'rgba(0,0,0,0.7)');
        this.bitmap.drawIcon(item.iconIndex, dx, dy, dw, dh);
        const rect = new Rectangle(dx, dy, dw, dh);
        this.drawItemCellGrid(item, rect);
    };
}
