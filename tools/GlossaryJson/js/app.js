//=============================================================================
// app.js — 用语词典编辑器 · 入口与协调
//=============================================================================

(() => {
  "use strict";

  document.addEventListener('DOMContentLoaded', () => {

    // ======================================================================
    // 文件导入
    // ======================================================================

    async function handleImportFiles(fileList) {
      const files = Array.from(fileList).filter(f =>
        f.name.toLowerCase().endsWith('.json')
      );

      if (files.length === 0) {
        UI.setStatus('请选择 .json 文件', true);
        return;
      }

      let success = 0;
      let errors = [];

      for (const file of files) {
        try {
          const text = await readFileAsText(file);
          const err = Store.importJSON(file.name, text);
          if (err) {
            errors.push(err);
          } else {
            success++;
          }
        } catch (e) {
          errors.push(`「${file.name}」读取失败：${e.message}`);
        }
      }

      // 刷新
      refreshAll();

      const detail = `成功导入 ${success} 个词典`;
      const errMsg = errors.length > 0 ? `，${errors.length} 个失败` : '';
      UI.setStatus(detail + errMsg);
      if (errors.length > 0) {
        console.warn('导入错误：', errors);
      }

      // 自动选中第一个
      const all = Store.getAll();
      if (success > 0 && all.length > 0) {
        UI.selectDict(all[0].data.glossaryType);
      }
    }

    function readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file, 'UTF-8');
      });
    }

    // ======================================================================
    // 导出
    // ======================================================================

    function handleExportSingle(typeId) {
      try {
        const json = Store.exportGlossary(typeId);
        if (!json) { UI.setStatus('未找到该词典数据', true); return; }

        const g = Store.getGlossary(typeId);
        const filename = g ? `${g.commandName || 'glossary'}_${typeId}.json` : `glossary_${typeId}.json`;

        downloadBlob(
          new Blob([json], { type: 'application/json' }),
          filename
        );
        UI.setStatus(`已导出「${filename}」`);
      } catch (e) {
        UI.setStatus('导出失败：' + e.message, true);
      }
    }

    async function handleExportAll() {
      try {
        const blob = await Store.exportAllAsZip();
        const ts = new Date().toISOString().slice(0, 10);
        downloadBlob(blob, `glossaries_${ts}.zip`);
        UI.setStatus('全部词典已导出为 ZIP');
      } catch (e) {
        UI.setStatus('导出失败：' + e.message, true);
      }
    }

    function downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // ======================================================================
    // 刷新
    // ======================================================================

    function refreshAll() {
      const all = Store.getAll();
      UI.renderTree(all);

      const counts = Store.count();
      if (counts.glossaries === 0) {
        UI.showEmpty();
      }
    }

    // ======================================================================
    // 加载示例（自动加载同目录下的示例文件）
    // ======================================================================

    async function tryLoadSamples() {
      // 尝试加载 Glossary/ 下的示例文件
      // 因为浏览器安全策略，不能自动读本地文件，所以只提示
      const all = Store.getAll();
      if (all.length === 0) {
        // 不做自动加载，让用户手动导入
      }
    }

    // ======================================================================
    // 初始化 UI
    // ======================================================================

    UI.init({
      onImportFiles: handleImportFiles,
      onExportSingle: handleExportSingle,
      onExportAll: handleExportAll,
      onRefreshTree: refreshAll,

      onAddEntry(typeId) {
        const entry = Store.addEntry(typeId, {
          name: '新条目',
          iconIndex: 0,
          color: '#888888',
          categoryId: '',
          order: 0,
          unlockCondition: { type: 'auto', switchId: 0, variableId: 0, variableValue: 1, script: '', notifySwitchId: 0, notifyVariableId: 0 },
          seenCondition: { switchId: 0, setWhenOpened: false },
          textColorSwitch: { switchId: 0, color: 0 },
          noCollect: false,
          noPageNumber: false,
        });
        if (entry === false) { UI.setStatus('新增条目失败', true); return; }
        refreshAll();
        UI.selectEntry(typeId, entry);
        UI.setStatus(`已新增条目 #${entry}`);
      },

      onDeleteEntry(typeId, entryId) {
        Store.removeEntry(typeId, entryId);
        refreshAll();
        // 自动选中同词典下其他条目或词典本身
        const g = Store.getGlossary(typeId);
        if (g && g.entries.length > 0) {
          UI.selectEntry(typeId, g.entries[0].id);
        } else {
          UI.selectDict(typeId);
        }
        UI.setStatus(`已删除条目 #${entryId}`);
      },

      onNewGlossary(typeId, name, useCategory) {
        // 检查 typeId 是否已存在
        if (Store.getGlossary(typeId)) {
          UI.setStatus(`词典 ID ${typeId} 已被占用`, true);
          return;
        }
        const glossary = {
          glossaryType: typeId,
          commandName: name,
          useCategory: useCategory,
          commandSwitchId: 0,
          backPicture: '',
          backPictureOpacity: 180,
          glossaryHelp: '',
          categoryHelp: '',
          categories: [],
          entries: [],
        };
        Store.importJSON(`${name}.json`, JSON.stringify(glossary));
        refreshAll();
        UI.selectDict(typeId);
        UI.setStatus(`已创建词典「${name}」`);
      },
    });

    // ======================================================================
    // 自动加载 localStorage 草稿
    // ======================================================================

    tryLoadSamples();

    UI.setStatus('就绪 — 点击「导入」选择词典 JSON 文件');
  });
})();
