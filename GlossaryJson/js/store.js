//=============================================================================
// store.js — 用语词典编辑器 · 数据层
//=============================================================================

const Store = (() => {
  "use strict";

  /** @type {{ filename: string, data: object }[]} */
  let _glossaries = [];

  // ======================================================================
  // 内部工具
  // ======================================================================

  function _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function _findGlossary(typeId) {
    return _glossaries.find(g => g.data.glossaryType === typeId) || null;
  }

  function _findGlossaryIdx(typeId) {
    return _glossaries.findIndex(g => g.data.glossaryType === typeId);
  }

  function _nextId(entries) {
    if (!entries || entries.length === 0) return 1;
    return Math.max(...entries.map(e => e.id || 0)) + 1;
  }

  // ======================================================================
  // 导入
  // ======================================================================

  /**
   * 导入多个 JSON 文件。
   * @param {File[]} files
   * @returns {{ success: number, skipped: number, errors: string[] }}
   */
  function importFiles(files) {
    const errors = [];
    let success = 0;
    let skipped = 0;

    // 同步读取：先全部读完再处理
    const results = [];
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.json')) {
        skipped++;
        continue;
      }
      try {
        // 用同步 XHR 方式读取（在 FileReader 回调中处理太麻烦）
        // 实际用 Promise
        results.push({ file, done: false });
      } catch (e) {
        errors.push(`${file.name}: ${e.message}`);
      }
    }

    // 返回 results 让调用方处理异步
    return results.length;
  }

  /**
   * 解析并添加一个 JSON 内容。
   * @param {string} filename
   * @param {string} jsonText
   * @returns {string|null} 错误消息或 null
   */
  function importJSON(filename, jsonText) {
    try {
      const data = JSON.parse(jsonText);

      // 验证必要字段
      if (typeof data.glossaryType !== 'number' || data.glossaryType < 1) {
        return `「${filename}」缺少有效的 glossaryType（正整数）`;
      }
      if (!data.commandName) {
        return `「${filename}」缺少 commandName（词典名称）`;
      }

      // 检查类型是否已存在
      const existing = _glossaries.find(g => g.data.glossaryType === data.glossaryType);
      if (existing) {
        return `「${filename}」的 glossaryType=${data.glossaryType} 与「${existing.filename}」冲突，已跳过`;
      }

      // 确保结构完整
      data.useCategory = data.useCategory || false;
      data.commandSwitchId = data.commandSwitchId || 0;
      data.backPicture = data.backPicture || '';
      data.backPictureOpacity = data.backPictureOpacity ?? 180;
      data.glossaryHelp = data.glossaryHelp || '';
      data.categoryHelp = data.categoryHelp || '';
      data.categories = Array.isArray(data.categories) ? data.categories : [];
      data.entries = Array.isArray(data.entries) ? data.entries : [];

      // 为每个条目补充默认字段
      data.entries.forEach(e => {
        e.iconIndex = e.iconIndex || 0;
        e.color = e.color || '#888888';
        e.categoryId = e.categoryId || '';
        e.order = e.order ?? 0;
        if (!e.unlockCondition) {
          e.unlockCondition = { type: 'auto', switchId: 0, variableId: 0, variableValue: 1, script: '', notifySwitchId: 0, notifyVariableId: 0 };
        }
        if (!e.seenCondition) {
          e.seenCondition = { switchId: 0, setWhenOpened: false };
        }
        if (!e.textColorSwitch) {
          e.textColorSwitch = { switchId: 0, color: 0 };
        }
        e.noCollect = e.noCollect || false;
        e.noPageNumber = e.noPageNumber || false;
        e.pages = Array.isArray(e.pages) ? e.pages : [{ pageIndex: 1, description: '', picture: '', picturePosition: 'top', pictureAlign: 'center', picturePriority: 'top', pictureScale: 1.0, pictureX: 0, pictureY: 0, textPosition: 0, enemyId: 0, showSwitchId: 0, extraPictures: [] }];
      });

      _glossaries.push({ filename, data: _deepClone(data) });
      return null; // 成功
    } catch (e) {
      return `「${filename}」JSON 解析失败：${e.message}`;
    }
  }

  // ======================================================================
  // 查询
  // ======================================================================

  function getAll() {
    return _deepClone(_glossaries);
  }

  function getGlossary(typeId) {
    const g = _findGlossary(typeId);
    return g ? _deepClone(g.data) : null;
  }

  function getEntry(typeId, entryId) {
    const g = _findGlossary(typeId);
    if (!g) return null;
    const e = g.data.entries.find(en => en.id === entryId);
    return e ? _deepClone(e) : null;
  }

  function getEntriesByCategory(typeId, categoryId) {
    const g = _findGlossary(typeId);
    if (!g) return [];
    return g.data.entries.filter(e => e.categoryId === categoryId).map(e => _deepClone(e));
  }

  function getUncategorizedEntries(typeId) {
    const g = _findGlossary(typeId);
    if (!g) return [];
    return g.data.entries.filter(e => !e.categoryId).map(e => _deepClone(e));
  }

  function count() {
    let total = 0;
    _glossaries.forEach(g => total += g.data.entries.length);
    return { glossaries: _glossaries.length, entries: total };
  }

  // ======================================================================
  // 词典 CRUD
  // ======================================================================

  function updateGlossary(typeId, updates) {
    const idx = _findGlossaryIdx(typeId);
    if (idx === -1) return false;
    const d = _glossaries[idx].data;
    // 只允许更新特定字段
    if (typeof updates.commandName === 'string') d.commandName = updates.commandName;
    if (typeof updates.useCategory === 'boolean') d.useCategory = updates.useCategory;
    if (typeof updates.commandSwitchId === 'number') d.commandSwitchId = updates.commandSwitchId;
    if (typeof updates.backPicture === 'string') d.backPicture = updates.backPicture;
    if (typeof updates.backPictureOpacity === 'number') d.backPictureOpacity = updates.backPictureOpacity;
    if (typeof updates.glossaryHelp === 'string') d.glossaryHelp = updates.glossaryHelp;
    if (typeof updates.categoryHelp === 'string') d.categoryHelp = updates.categoryHelp;
    return true;
  }

  function removeGlossary(typeId) {
    const idx = _findGlossaryIdx(typeId);
    if (idx === -1) return false;
    _glossaries.splice(idx, 1);
    return true;
  }

  // ======================================================================
  // 分类 CRUD
  // ======================================================================

  function getCategories(typeId) {
    const g = _findGlossary(typeId);
    return g ? _deepClone(g.data.categories) : [];
  }

  function setCategories(typeId, cats) {
    const g = _findGlossary(typeId);
    if (!g) return false;
    g.data.categories = _deepClone(cats);
    return true;
  }

  function addCategory(typeId, cat) {
    const g = _findGlossary(typeId);
    if (!g) return false;
    if (!cat.id || !cat.name) return false;
    cat.iconIndex = cat.iconIndex || 0;
    cat.order = cat.order ?? 0;
    cat.condition = cat.condition || { switchId: 0, script: '' };
    g.data.categories.push(_deepClone(cat));
    return true;
  }

  function removeCategory(typeId, catId) {
    const g = _findGlossary(typeId);
    if (!g) return false;
    const idx = g.data.categories.findIndex(c => c.id === catId);
    if (idx === -1) return false;
    g.data.categories.splice(idx, 1);
    // 清理引用了此分类的条目
    g.data.entries.forEach(e => {
      if (e.categoryId === catId) e.categoryId = '';
    });
    return true;
  }

  // ======================================================================
  // 条目 CRUD
  // ======================================================================

  function addEntry(typeId, entry) {
    const g = _findGlossary(typeId);
    if (!g) return false;
    entry.id = _nextId(g.data.entries);
    entry.pages = entry.pages || [{ pageIndex: 1, description: '', picture: '', picturePosition: 'top', pictureAlign: 'center', picturePriority: 'top', pictureScale: 1.0, pictureX: 0, pictureY: 0, textPosition: 0, enemyId: 0, showSwitchId: 0, extraPictures: [] }];
    g.data.entries.push(_deepClone(entry));
    return entry.id;
  }

  function updateEntry(typeId, entryId, updates) {
    const g = _findGlossary(typeId);
    if (!g) return false;
    const e = g.data.entries.find(en => en.id === entryId);
    if (!e) return false;
    Object.assign(e, _deepClone(updates));
    return true;
  }

  function removeEntry(typeId, entryId) {
    const g = _findGlossary(typeId);
    if (!g) return false;
    const idx = g.data.entries.findIndex(e => e.id === entryId);
    if (idx === -1) return false;
    g.data.entries.splice(idx, 1);
    return true;
  }

  // ======================================================================
  // 导出
  // ======================================================================

  function exportGlossary(typeId) {
    const g = _findGlossary(typeId);
    if (!g) return null;
    return JSON.stringify(_deepClone(g.data), null, 2) + '\n';
  }

  async function exportAllAsZip() {
    if (_glossaries.length === 0) throw new Error('没有数据可导出');

    const JSZipLib = (typeof window !== 'undefined' && window.JSZip) || (typeof globalThis !== 'undefined' && globalThis.JSZip);
    if (!JSZipLib) throw new Error('JSZip 库未加载，请刷新页面重试');

    const zip = new JSZipLib();

    _glossaries.forEach(g => {
      const name = g.filename || `glossary_${g.data.glossaryType}.json`;
      const content = JSON.stringify(_deepClone(g.data), null, 2) + '\n';
      zip.file(name, content);
    });

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    return blob;
  }

  // ======================================================================
  // 重置 / 调试
  // ======================================================================

  function reset() {
    _glossaries = [];
  }

  function debug() {
    return _glossaries.map(g => ({
      filename: g.filename,
      type: g.data.glossaryType,
      name: g.data.commandName,
      entries: g.data.entries.length,
      categories: g.data.categories.length,
    }));
  }

  // ======================================================================
  // 公开 API
  // ======================================================================

  return {
    importJSON,
    getAll,
    getGlossary,
    getEntry,
    getEntriesByCategory,
    getUncategorizedEntries,
    count,

    updateGlossary,
    removeGlossary,

    getCategories,
    setCategories,
    addCategory,
    removeCategory,

    addEntry,
    updateEntry,
    removeEntry,

    exportGlossary,
    exportAllAsZip,

    reset,
    debug,
  };
})();
