//=============================================================================
// ui.js — 用语词典编辑器 · UI 渲染与交互
//=============================================================================

const UI = (() => {
  "use strict";

  // ======================================================================
  // DOM 缓存
  // ======================================================================
  let $ = {};

  function cache() {
    $ = {
      sidebar:         byId('sidebar'),
      treeContainer:   byId('tree-container'),
      treeEmpty:       byId('tree-empty'),
      glossaryCount:   byId('glossary-count'),
      contentPanel:    byId('content-panel'),
      emptyState:      byId('empty-state'),
      dictView:        byId('dict-view'),
      entryView:       byId('entry-view'),
      statusBar:       byId('status-bar'),
      importInput:     byId('import-input'),
      btnImport:       byId('btn-import'),
      btnEmptyImport:  byId('btn-empty-import'),
      btnNewGlossary:  byId('btn-new-glossary'),
      btnEmptyNew:     byId('btn-empty-new'),
      btnExport:       byId('btn-export'),
      btnExportAll:    byId('btn-export-all'),
      btnSidebarAdd:   byId('btn-sidebar-add'),
      btnSidebarDel:   byId('btn-sidebar-del'),
      sidebarActions:  byId('sidebar-actions'),
      modalOverlay:    byId('modal-overlay'),
      modalConfirm:    byId('btn-modal-confirm'),
      modalCancel:     byId('btn-modal-cancel'),
      dropOverlay:     byId('drop-overlay'),
    };
  }

  function byId(id) { return document.getElementById(id); }

  // ======================================================================
  // 状态
  // ======================================================================
  let _selectedTypeId = null;   // 当前选中的词典 type
  let _selectedEntryId = null;  // 当前选中的条目 id
  let _selectedMode = null;     // 'dict' | 'entry'
  let _currentPage = 0;         // 当前查看的页面索引

  // ======================================================================
  // 状态栏
  // ======================================================================
  function setStatus(msg, isError) {
    $.statusBar.textContent = msg;
    $.statusBar.className = 'status-bar' + (isError ? ' error' : '');
    if (isError) setTimeout(() => { $.statusBar.className = 'status-bar'; }, 4000);
  }

  // ======================================================================
  // 换行符转换（\n ↔ 真实换行）
  // ======================================================================

  /**
   * 将存储格式的 \n（反斜杠+n）转为 textarea 中真实的换行符。
   */
  function _displayText(str) {
    if (!str) return '';
    return str.replace(/\\n/g, '\n');
  }

  /**
   * 将 textarea 中的真实换行符转为存储格式的 \n（反斜杠+n）。
   */
  function _storeText(str) {
    if (!str) return '';
    return str.replace(/\n/g, '\\n');
  }

  // ======================================================================
  // 渲染树
  // ======================================================================
  function renderTree(glossaries) {
    const container = $.treeContainer;

    if (!glossaries || glossaries.length === 0) {
      container.innerHTML = `
        <div class="tree-empty">
          <div class="tree-empty-icon">📖</div>
          <div>尚未导入词典</div>
          <div class="tree-empty-hint">点击上方「导入」选择 JSON 文件</div>
        </div>`;
      $.glossaryCount.textContent = '0';
      $.sidebarActions.classList.add('hidden');
      return;
    }

    $.glossaryCount.textContent = String(glossaries.length);
    $.sidebarActions.classList.remove('hidden');

    const frag = document.createDocumentFragment();

    glossaries.forEach(g => {
      const d = g.data;
      const typeId = d.glossaryType;
      const isDictSelected = _selectedMode === 'dict' && _selectedTypeId === typeId;

      // ---- 词典节点 ----
      const dictNode = document.createElement('div');
      dictNode.className = 'tree-node dict' + (isDictSelected ? ' selected' : '');
      dictNode.dataset.type = 'dict';
      dictNode.dataset.typeId = typeId;

      const hasChildren = d.entries.length > 0;
      const toggle = document.createElement('span');
      toggle.className = 'tree-toggle' + (hasChildren ? ' open' : '');
      toggle.textContent = hasChildren ? '▶' : '';
      dictNode.appendChild(toggle);

      const icon = document.createElement('span');
      icon.className = 'dict-icon';
      icon.textContent = '📖';
      dictNode.appendChild(icon);

      const name = document.createElement('span');
      name.className = 'dict-name';
      name.textContent = d.commandName || `词典 ${typeId}`;
      dictNode.appendChild(name);

      const count = document.createElement('span');
      count.className = 'dict-count';
      count.textContent = `${d.entries.length} 条`;
      dictNode.appendChild(count);

      dictNode.addEventListener('click', e => {
        e.stopPropagation();
        selectDict(typeId);
      });

      frag.appendChild(dictNode);

      // ---- 子节点容器 ----
      const children = document.createElement('div');
      children.className = 'tree-children' + (hasChildren ? '' : ' collapsed');

      if (hasChildren) {
        // 分类 → 条目 或 直接条目
        if (d.useCategory && d.categories.length > 0) {
          d.categories.forEach(cat => {
            const catEntries = d.entries.filter(en => String(en.categoryId) === String(cat.id));
            if (catEntries.length === 0) return;

            const catNode = document.createElement('div');
            catNode.className = 'tree-node cat';
            const catBadge = document.createElement('span');
            catBadge.className = 'cat-badge';
            catBadge.textContent = cat.name;
            catNode.appendChild(catBadge);
            catNode.style.cursor = 'default';
            children.appendChild(catNode);

            catEntries.forEach(en => {
              children.appendChild(_buildEntryNode(en, typeId));
            });
          });

          // 未分类条目
          const uncat = d.entries.filter(en => !en.categoryId || !d.categories.some(c => String(c.id) === String(en.categoryId)));
          if (uncat.length > 0) {
            const sep = document.createElement('div');
            sep.className = 'tree-node cat';
            const badge = document.createElement('span');
            badge.className = 'cat-badge';
            badge.textContent = '未分类';
            sep.appendChild(badge);
            children.appendChild(sep);

            uncat.forEach(en => children.appendChild(_buildEntryNode(en, typeId)));
          }
        } else {
          d.entries.forEach(en => children.appendChild(_buildEntryNode(en, typeId)));
        }
      }

      frag.appendChild(children);

      // 默认展开当前选中的词典
      if (isDictSelected) {
        children.classList.remove('collapsed');
      }
    });

    container.innerHTML = '';
    container.appendChild(frag);

    // 展开选中词典的子节点
    if (_selectedTypeId !== null) {
      const allNodes = container.querySelectorAll('.tree-node.dict');
      allNodes.forEach(n => {
        if (parseInt(n.dataset.typeId) === _selectedTypeId) {
          const next = n.nextElementSibling;
          if (next && next.classList.contains('tree-children')) {
            next.classList.remove('collapsed');
            n.querySelector('.tree-toggle')?.classList.add('open');
          }
        }
      });
    }
  }

  function _buildEntryNode(en, typeId) {
    const node = document.createElement('div');
    node.className = 'tree-node entry';
    node.dataset.type = 'entry';
    node.dataset.typeId = typeId;
    node.dataset.entryId = en.id;

    const isSelected = _selectedMode === 'entry' && _selectedTypeId === typeId && _selectedEntryId === en.id;
    if (isSelected) node.classList.add('selected');

    const dot = document.createElement('span');
    dot.className = 'entry-dot';
    dot.style.background = en.color || '#888';
    node.appendChild(dot);

    const name = document.createElement('span');
    name.className = 'entry-name';
    name.textContent = en.name || `(ID:${en.id})`;
    node.appendChild(name);

    const idSpan = document.createElement('span');
    idSpan.className = 'entry-id';
    idSpan.textContent = `#${en.id}`;
    node.appendChild(idSpan);

    node.addEventListener('click', e => {
      e.stopPropagation();
      selectEntry(typeId, en.id);
    });

    return node;
  }

  // ======================================================================
  // 选中逻辑
  // ======================================================================

  function selectDict(typeId) {
    const g = Store.getGlossary(typeId);
    if (!g) return;

    _selectedMode = 'dict';
    _selectedTypeId = typeId;
    _selectedEntryId = null;

    // 更新树选中状态
    _updateTreeSelection();

    // 显示词典编辑视图
    showDictView(g);
  }

  function selectEntry(typeId, entryId) {
    const e = Store.getEntry(typeId, entryId);
    if (!e) return;

    _selectedMode = 'entry';
    _selectedTypeId = typeId;
    _selectedEntryId = entryId;
    _currentPage = 0;

    _updateTreeSelection();
    showEntryView(e, typeId);
  }

  function _updateTreeSelection() {
    $.treeContainer.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    if (_selectedMode === 'dict') {
      const node = $.treeContainer.querySelector(`.tree-node.dict[data-type-id="${_selectedTypeId}"]`);
      if (node) node.classList.add('selected');
    } else if (_selectedMode === 'entry') {
      const node = $.treeContainer.querySelector(`.tree-node.entry[data-type-id="${_selectedTypeId}"][data-entry-id="${_selectedEntryId}"]`);
      if (node) node.classList.add('selected');
    }
  }

  // ======================================================================
  // 显示词典视图
  // ======================================================================

  function showDictView(data) {
    $.emptyState.classList.add('hidden');
    $.entryView.classList.add('hidden');
    $.dictView.classList.remove('hidden');

    byId('dict-type').value = data.glossaryType;
    byId('dict-name').value = data.commandName || '';
    byId('dict-use-category').checked = !!data.useCategory;
    byId('dict-switch').value = data.commandSwitchId || 0;
    byId('dict-bgpic').value = data.backPicture || '';
    byId('dict-bgopacity').value = data.backPictureOpacity ?? 180;
    byId('dict-help').value = _displayText(data.glossaryHelp || '');
    byId('dict-cat-help').value = _displayText(data.categoryHelp || '');

    // 渲染分类列表
    renderCategoryList(data.categories || []);
  }

  function renderCategoryList(categories) {
    const container = byId('category-list');
    if (!categories || categories.length === 0) {
      container.innerHTML = '<p class="field-hint" style="padding:8px 0">暂无分类，点击上方按钮添加。</p>';
      return;
    }

    const frag = document.createDocumentFragment();
    categories.forEach((cat, idx) => {
      const div = document.createElement('div');
      div.className = 'cat-item';

      const fields = document.createElement('div');
      fields.className = 'cat-fields';

      const inpId = document.createElement('input');
      inpId.type = 'text'; inpId.placeholder = 'id'; inpId.value = cat.id;
      inpId.dataset.idx = idx; inpId.dataset.field = 'id';

      const inpName = document.createElement('input');
      inpName.type = 'text'; inpName.placeholder = '名称'; inpName.value = cat.name;
      inpName.dataset.idx = idx; inpName.dataset.field = 'name';

      const inpIcon = document.createElement('input');
      inpIcon.type = 'number'; inpIcon.placeholder = '图标'; inpIcon.value = cat.iconIndex || 0;
      inpIcon.dataset.idx = idx; inpIcon.dataset.field = 'iconIndex';

      const inpOrder = document.createElement('input');
      inpOrder.type = 'number'; inpOrder.placeholder = '排序'; inpOrder.value = cat.order ?? 0;
      inpOrder.dataset.idx = idx; inpOrder.dataset.field = 'order';

      fields.appendChild(inpId);
      fields.appendChild(inpName);
      fields.appendChild(inpIcon);
      fields.appendChild(inpOrder);
      div.appendChild(fields);

      const rmBtn = document.createElement('button');
      rmBtn.className = 'btn-remove-cat';
      rmBtn.textContent = '✕';
      rmBtn.title = '删除此分类';
      rmBtn.addEventListener('click', () => {
        if (!confirm(`确定删除分类「${cat.name}」吗？引用的条目将变为未分类。`)) return;
        Store.removeCategory(_selectedTypeId, cat.id);
        const g = Store.getGlossary(_selectedTypeId);
        if (g) showDictView(g);
        setStatus(`已删除分类「${cat.name}」`);
      });
      div.appendChild(rmBtn);

      frag.appendChild(div);

      // 实时更新
      [inpId, inpName, inpIcon, inpOrder].forEach(inp => {
        inp.addEventListener('change', () => {
          _saveCategoriesFromDOM();
        });
      });
    });

    container.innerHTML = '';
    container.appendChild(frag);
  }

  function _saveCategoriesFromDOM() {
    const container = byId('category-list');
    const items = container.querySelectorAll('.cat-item');
    const cats = [];
    items.forEach(item => {
      const inputs = item.querySelectorAll('input');
      if (inputs.length >= 4) {
        cats.push({
          id: inputs[0].value,
          name: inputs[1].value,
          iconIndex: parseInt(inputs[2].value) || 0,
          order: parseInt(inputs[3].value) || 0,
          condition: { switchId: 0, script: '' }
        });
      }
    });
    Store.setCategories(_selectedTypeId, cats);
  }

  // ======================================================================
  // 显示条目视图
  // ======================================================================

  function showEntryView(entry, typeId) {
    $.emptyState.classList.add('hidden');
    $.dictView.classList.add('hidden');
    $.entryView.classList.remove('hidden');

    // ---- 配置选项卡 ----
    byId('entry-id').value = entry.id;
    byId('entry-name').value = entry.name || '';
    byId('entry-icon').value = entry.iconIndex || 0;
    byId('entry-color').value = entry.color || '#888888';
    byId('entry-color-picker').value = entry.color || '#888888';
    byId('entry-order').value = entry.order ?? 0;

    // 分类下拉
    const catSelect = byId('entry-category');
    const g = Store.getGlossary(typeId);
    const cats = g ? (g.categories || []) : [];
    catSelect.innerHTML = '<option value="">(无分类)</option>';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.id})`;
      if (String(c.id) === String(entry.categoryId)) opt.selected = true;
      catSelect.appendChild(opt);
    });

    // 解锁条件
    const uc = entry.unlockCondition || {};
    byId('entry-uc-type').value = uc.type || 'auto';
    byId('entry-uc-switch').value = uc.switchId || 0;
    byId('entry-uc-var').value = uc.variableId || 0;
    byId('entry-uc-varval').value = uc.variableValue ?? 1;
    byId('entry-uc-script').value = uc.script || '';
    byId('entry-uc-notif-switch').value = uc.notifySwitchId || 0;
    byId('entry-uc-notif-var').value = uc.notifyVariableId || 0;

    // 可见条件
    const sc = entry.seenCondition || {};
    byId('entry-sc-switch').value = sc.switchId || 0;
    byId('entry-sc-setwhen').checked = !!sc.setWhenOpened;

    // 文字颜色开关
    const tcs = entry.textColorSwitch || {};
    byId('entry-tcs-switch').value = tcs.switchId || 0;
    byId('entry-tcs-color').value = tcs.color || 0;

    // 其他
    byId('entry-no-collect').checked = !!entry.noCollect;
    byId('entry-no-pagenum').checked = !!entry.noPageNumber;

    // ---- 页面内容选项卡 ----
    renderPageContent(entry);
  }

  // ======================================================================
  // 页面内容渲染
  // ======================================================================

  function renderPageContent(entry) {
    const pages = entry.pages || [];
    if (_currentPage >= pages.length) _currentPage = 0;
    if (_currentPage < 0) _currentPage = 0;

    const hasPages = pages.length > 0;
    byId('page-indicator').textContent = hasPages ? `${_currentPage + 1} / ${pages.length}` : '0 / 0';

    if (!hasPages) {
      byId('page-description').value = '';
      byId('page-picture').value = '';
      byId('page-picpos').value = 'top';
      byId('page-picalign').value = 'center';
      byId('page-picpri').value = 'top';
      byId('page-scale').value = '1.0';
      byId('page-picx').value = '0';
      byId('page-picy').value = '0';
      byId('page-texty').value = '0';
      byId('page-enemy').value = '0';
      byId('page-showsw').value = '0';
      renderExtraPics([]);
      return;
    }

    const page = pages[_currentPage];
    byId('page-description').value = _displayText(page.description || '');
    byId('page-picture').value = page.picture || '';
    byId('page-picpos').value = page.picturePosition || 'top';
    byId('page-picalign').value = page.pictureAlign || 'center';
    byId('page-picpri').value = page.picturePriority || 'top';
    byId('page-scale').value = page.pictureScale ?? 1.0;
    byId('page-picx').value = page.pictureX || 0;
    byId('page-picy').value = page.pictureY || 0;
    byId('page-texty').value = page.textPosition || 0;
    byId('page-enemy').value = page.enemyId || 0;
    byId('page-showsw').value = page.showSwitchId || 0;

    renderExtraPics(page.extraPictures || []);
  }

  function renderExtraPics(extras) {
    const container = byId('extra-pics');
    // 保留 header 行
    container.innerHTML = `<div class="extra-pic-row header-row"><span>文件名</span><span>X</span><span>Y</span><span></span></div>`;

    extras.forEach((ep, idx) => {
      const row = document.createElement('div');
      row.className = 'extra-pic-row';

      const inpF = document.createElement('input');
      inpF.type = 'text'; inpF.placeholder = '文件名'; inpF.value = ep.filename || '';
      inpF.dataset.idx = idx; inpF.dataset.field = 'filename';

      const inpX = document.createElement('input');
      inpX.type = 'number'; inpX.placeholder = 'X'; inpX.value = ep.x ?? 0;
      inpX.dataset.idx = idx; inpX.dataset.field = 'x';

      const inpY = document.createElement('input');
      inpY.type = 'number'; inpY.placeholder = 'Y'; inpY.value = ep.y ?? 0;
      inpY.dataset.idx = idx; inpY.dataset.field = 'y';

      const rmBtn = document.createElement('button');
      rmBtn.className = 'btn-remove-epic';
      rmBtn.textContent = '✕';
      rmBtn.addEventListener('click', () => {
        row.remove();
        _saveExtraPics();
      });

      row.appendChild(inpF);
      row.appendChild(inpX);
      row.appendChild(inpY);
      row.appendChild(rmBtn);
      container.appendChild(row);
    });
  }

  function _readExtraPics() {
    const container = byId('extra-pics');
    const rows = container.querySelectorAll('.extra-pic-row:not(.header-row)');
    const result = [];
    rows.forEach(row => {
      const inputs = row.querySelectorAll('input');
      if (inputs.length >= 3) {
        const name = inputs[0].value.trim();
        if (name) {
          result.push({
            filename: name,
            x: parseInt(inputs[1].value) || 0,
            y: parseInt(inputs[2].value) || 0
          });
        }
      }
    });
    return result;
  }

  function _saveExtraPics() {
    const extras = _readExtraPics();
    const entry = Store.getEntry(_selectedTypeId, _selectedEntryId);
    if (!entry || !entry.pages || _currentPage >= entry.pages.length) return;
    entry.pages[_currentPage].extraPictures = extras;
    Store.updateEntry(_selectedTypeId, _selectedEntryId, { pages: entry.pages });
  }

  // ======================================================================
  // 读取条目表单数据
  // ======================================================================

  function _readEntryConfig() {
    return {
      id: parseInt(byId('entry-id').value) || 0,
      name: byId('entry-name').value.trim(),
      iconIndex: parseInt(byId('entry-icon').value) || 0,
      color: byId('entry-color').value.trim() || '#888888',
      categoryId: byId('entry-category').value,
      order: parseInt(byId('entry-order').value) || 0,
      unlockCondition: {
        type: byId('entry-uc-type').value,
        switchId: parseInt(byId('entry-uc-switch').value) || 0,
        variableId: parseInt(byId('entry-uc-var').value) || 0,
        variableValue: parseInt(byId('entry-uc-varval').value) || 1,
        script: byId('entry-uc-script').value,
        notifySwitchId: parseInt(byId('entry-uc-notif-switch').value) || 0,
        notifyVariableId: parseInt(byId('entry-uc-notif-var').value) || 0,
      },
      seenCondition: {
        switchId: parseInt(byId('entry-sc-switch').value) || 0,
        setWhenOpened: byId('entry-sc-setwhen').checked,
      },
      textColorSwitch: {
        switchId: parseInt(byId('entry-tcs-switch').value) || 0,
        color: parseInt(byId('entry-tcs-color').value) || 0,
      },
      noCollect: byId('entry-no-collect').checked,
      noPageNumber: byId('entry-no-pagenum').checked,
    };
  }

  function _readPageData() {
    return {
      pageIndex: _currentPage + 1,
      description: _storeText(byId('page-description').value),
      picture: byId('page-picture').value.trim(),
      picturePosition: byId('page-picpos').value,
      pictureAlign: byId('page-picalign').value,
      picturePriority: byId('page-picpri').value,
      pictureScale: parseFloat(byId('page-scale').value) || 1.0,
      pictureX: parseInt(byId('page-picx').value) || 0,
      pictureY: parseInt(byId('page-picy').value) || 0,
      textPosition: parseInt(byId('page-texty').value) || 0,
      enemyId: parseInt(byId('page-enemy').value) || 0,
      showSwitchId: parseInt(byId('page-showsw').value) || 0,
      extraPictures: _readExtraPics(),
    };
  }

  // ======================================================================
  // 工具栏 / 空状态
  // ======================================================================

  function showEmpty() {
    $.emptyState.classList.remove('hidden');
    $.dictView.classList.add('hidden');
    $.entryView.classList.add('hidden');
    _selectedMode = null;
    _selectedTypeId = null;
    _selectedEntryId = null;
  }

  // ======================================================================
  // 事件绑定
  // ======================================================================

  let _callbacks = {};

  function init(callbacks) {
    _callbacks = callbacks;
    cache();

    // ---- 导入 ----
    $.btnImport.addEventListener('click', () => $.importInput.click());
    $.btnEmptyImport.addEventListener('click', () => $.importInput.click());
    $.importInput.addEventListener('change', e => {
      if (e.target.files.length > 0) {
        _callbacks.onImportFiles(e.target.files);
        e.target.value = '';
      }
    });

    // ---- 新建词典 ----
    function openNewGlossaryModal() {
      byId('modal-glossary-type').value = 1;
      byId('modal-glossary-name').value = '';
      byId('modal-use-category').checked = false;
      $.modalOverlay.classList.remove('hidden');
      setTimeout(() => byId('modal-glossary-name').focus(), 100);
    }
    function closeModal() { $.modalOverlay.classList.add('hidden'); }
    $.btnNewGlossary.addEventListener('click', openNewGlossaryModal);
    $.btnEmptyNew.addEventListener('click', openNewGlossaryModal);
    $.modalCancel.addEventListener('click', closeModal);
    $.modalOverlay.addEventListener('click', e => { if (e.target === $.modalOverlay) closeModal(); });
    $.modalConfirm.addEventListener('click', () => {
      const typeId = parseInt(byId('modal-glossary-type').value) || 0;
      const name = byId('modal-glossary-name').value.trim();
      const useCat = byId('modal-use-category').checked;
      if (typeId < 1) { setStatus('词典 ID 必须大于 0', true); return; }
      if (!name) { setStatus('词典名称不能为空', true); return; }
      closeModal();
      _callbacks.onNewGlossary(typeId, name, useCat);
    });
    // Enter 键提交
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !$.modalOverlay.classList.contains('hidden')) {
        $.modalConfirm.click();
      }
      if (e.key === 'Escape') closeModal();
    });

    // ---- 导出 ----
    $.btnExport.addEventListener('click', () => {
      if (_selectedTypeId === null) { setStatus('请先选择要导出的词典', true); return; }
      _callbacks.onExportSingle(_selectedTypeId);
    });

    $.btnExportAll.addEventListener('click', () => _callbacks.onExportAll());

    // ---- 侧栏新增/删除条目 ----
    $.btnSidebarAdd.addEventListener('click', () => {
      if (_selectedTypeId === null) { setStatus('请先选择一个词典', true); return; }
      _callbacks.onAddEntry(_selectedTypeId);
    });
    $.btnSidebarDel.addEventListener('click', () => {
      if (_selectedMode !== 'entry' || _selectedEntryId === null) {
        setStatus('请先选择一个条目', true); return;
      }
      if (!confirm(`确定删除条目 #${_selectedEntryId} 吗？`)) return;
      _callbacks.onDeleteEntry(_selectedTypeId, _selectedEntryId);
    });

    // ---- 拖拽导入 ----
    setupDragDrop();

    // ---- Tab 切换 ----
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const parent = btn.closest('section');
        if (!parent) return;
        parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        parent.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pane = parent.querySelector('#' + btn.dataset.tab);
        if (pane) pane.classList.add('active');
      });
    });

    // ---- 颜色联动 ----
    const colorPicker = byId('entry-color-picker');
    const colorText = byId('entry-color');
    if (colorPicker && colorText) {
      colorPicker.addEventListener('input', () => { colorText.value = colorPicker.value; });
      colorText.addEventListener('input', () => {
        if (/^#[0-9a-f]{6}$/i.test(colorText.value)) colorPicker.value = colorText.value;
      });
    }

    // ---- 保存词典 ----
    byId('btn-save-dict').addEventListener('click', () => {
      _saveCategoriesFromDOM();
      const data = {
        commandName: byId('dict-name').value.trim(),
        useCategory: byId('dict-use-category').checked,
        commandSwitchId: parseInt(byId('dict-switch').value) || 0,
        backPicture: byId('dict-bgpic').value.trim(),
        backPictureOpacity: parseInt(byId('dict-bgopacity').value) ?? 180,
        glossaryHelp: _storeText(byId('dict-help').value),
        categoryHelp: _storeText(byId('dict-cat-help').value),
      };
      if (!data.commandName) { setStatus('词典名称不能为空', true); return; }
      Store.updateGlossary(_selectedTypeId, data);
      setStatus('词典已保存');
      _callbacks.onRefreshTree();
    });

    // ---- 添加分类 ----
    byId('btn-add-cat').addEventListener('click', () => {
      const name = prompt('分类名称：');
      if (!name) return;
      const id = prompt('分类 ID（英文/数字，唯一标识）：', name.toLowerCase().replace(/\s+/g, '_'));
      if (!id) return;
      Store.addCategory(_selectedTypeId, { id, name, iconIndex: 0, order: 0 });
      const g = Store.getGlossary(_selectedTypeId);
      if (g) showDictView(g);
      setStatus(`已添加分类「${name}」`);
    });

    // ---- 保存条目 ----
    byId('btn-save-entry').addEventListener('click', () => {
      const config = _readEntryConfig();
      if (!config.name) { setStatus('条目名称不能为空', true); return; }

      // 如果有页面数据未保存，先保存页面
      _saveCurrentPageIfNeeded();

      Store.updateEntry(_selectedTypeId, _selectedEntryId, config);
      setStatus('条目已保存');
      _callbacks.onRefreshTree();
    });

    // ---- 删除条目 ----
    byId('btn-delete-entry').addEventListener('click', () => {
      if (!confirm('确定要删除此条目吗？')) return;
      Store.removeEntry(_selectedTypeId, _selectedEntryId);
      setStatus('条目已删除');
      _callbacks.onRefreshTree();
      // 尝试选中同词典下一个条目
      const g = Store.getGlossary(_selectedTypeId);
      if (g && g.entries.length > 0) {
        selectEntry(_selectedTypeId, g.entries[0].id);
      } else {
        selectDict(_selectedTypeId);
      }
    });

    // ---- 页面导航 ----
    byId('page-prev').addEventListener('click', () => {
      _saveCurrentPageIfNeeded();
      if (_currentPage > 0) _currentPage--;
      else return;
      _reloadPage();
    });
    byId('page-next').addEventListener('click', () => {
      _saveCurrentPageIfNeeded();
      const g = Store.getEntry(_selectedTypeId, _selectedEntryId);
      if (g && _currentPage < (g.pages || []).length - 1) _currentPage++;
      else return;
      _reloadPage();
    });
    byId('page-add').addEventListener('click', () => {
      const entry = Store.getEntry(_selectedTypeId, _selectedEntryId);
      if (!entry) return;
      const pages = entry.pages || [];
      const newPage = {
        pageIndex: pages.length + 1,
        description: '',
        picture: '', picturePosition: 'top', pictureAlign: 'center', picturePriority: 'top',
        pictureScale: 1.0, pictureX: 0, pictureY: 0, textPosition: 0,
        enemyId: 0, showSwitchId: 0, extraPictures: []
      };
      pages.push(newPage);
      Store.updateEntry(_selectedTypeId, _selectedEntryId, { pages });
      _currentPage = pages.length - 1;
      _reloadPage();
      setStatus(`已新增第 ${_currentPage + 1} 页`);
    });
    byId('page-delete').addEventListener('click', () => {
      const entry = Store.getEntry(_selectedTypeId, _selectedEntryId);
      if (!entry || !entry.pages || entry.pages.length <= 1) {
        setStatus('至少保留一页，无法删除', true); return;
      }
      if (!confirm('确定删除当前页面吗？')) return;
      const pages = entry.pages.filter((_, i) => i !== _currentPage);
      pages.forEach((p, i) => p.pageIndex = i + 1);
      Store.updateEntry(_selectedTypeId, _selectedEntryId, { pages });
      if (_currentPage >= pages.length) _currentPage = pages.length - 1;
      _reloadPage();
      setStatus('页面已删除');
    });

    // ---- 保存页面 ----
    byId('btn-save-page').addEventListener('click', () => {
      _saveCurrentPage();
      setStatus('当前页已保存');
    });
    byId('btn-save-all-pages').addEventListener('click', () => {
      _saveCurrentPage();
      // 保存全部页面需要通过 store 更新
      setStatus('页面已保存');
    });

    // ---- 控制字符 ----
    document.querySelectorAll('.ctrl-btn[data-code]').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        const ta = byId('page-description');
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const before = ta.value.substring(0, start);
        const after = ta.value.substring(end);
        ta.value = before + code + after;
        const pos = start + code.length;
        ta.selectionStart = pos;
        ta.selectionEnd = pos;
        ta.focus();
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    // ---- 添加附加图片 ----
    byId('btn-add-extra').addEventListener('click', () => {
      const extras = _readExtraPics();
      extras.push({ filename: '', x: 0, y: 0 });
      renderExtraPics(extras);
    });

    // ---- 快捷键 ----
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const saveBtn = document.querySelector('.form-actions .btn-primary:not(:disabled)');
        if (saveBtn) saveBtn.click();
      }
    });

    setStatus('就绪');
  }

  function _saveCurrentPage() {
    const pageData = _readPageData();
    const entry = Store.getEntry(_selectedTypeId, _selectedEntryId);
    if (!entry) return;
    const pages = entry.pages || [];
    if (_currentPage < pages.length) {
      pages[_currentPage] = pageData;
      // 重组 pageIndex
      pages.forEach((p, i) => p.pageIndex = i + 1);
      Store.updateEntry(_selectedTypeId, _selectedEntryId, { pages });
    }
  }

  function _saveCurrentPageIfNeeded() {
    _saveCurrentPage();
  }

  function _reloadPage() {
    const entry = Store.getEntry(_selectedTypeId, _selectedEntryId);
    if (entry) renderPageContent(entry);
  }

  // ======================================================================
  // 拖拽导入
  // ======================================================================

  function setupDragDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
      document.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); });
    });
    document.addEventListener('dragenter', e => {
      if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        $.dropOverlay.classList.add('active');
      }
    });
    document.addEventListener('dragleave', e => {
      if (e.relatedTarget === null || e.relatedTarget === document.body) {
        $.dropOverlay.classList.remove('active');
      }
    });
    document.addEventListener('drop', e => {
      $.dropOverlay.classList.remove('active');
      if (e.dataTransfer.files.length > 0) {
        _callbacks.onImportFiles(e.dataTransfer.files);
      }
    });
  }

  // ======================================================================
  // 公开 API
  // ======================================================================

  return {
    init,
    renderTree,
    showEmpty,
    selectDict,
    selectEntry,
    showEntryView,
    setStatus,
    getSelectedTypeId: () => _selectedTypeId,
    getSelectedEntryId: () => _selectedEntryId,
  };
})();
