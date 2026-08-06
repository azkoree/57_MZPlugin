<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import FileSidebar from "./components/FileSidebar.vue";
import KeyTree from "./components/KeyTree.vue";
import KeyListEditor from "./components/KeyListEditor.vue";
import SaveAsDialog from "./components/SaveAsDialog.vue";
import WorkDirDialog from "./components/WorkDirDialog.vue";
import { api } from "./api";
import { LINE_BREAK_BR, LINE_BREAK_N, displayFromFile, toFileForm } from "./format";
import { moveNode } from "./reorder";

const files = ref([]);
const workRoot = ref(null);         // 当前文本库目录（绝对路径，null=未选择）
const showWorkDir = ref(false);
// 换行保存格式：br（<br>）或 n（字面 \n），localStorage 持久化
const lineBreakMode = ref(
    localStorage.getItem("gfTextEditor.lineBreak") === LINE_BREAK_N ? LINE_BREAK_N : LINE_BREAK_BR
);
function setLineBreak(mode) {
    lineBreakMode.value = mode;
    localStorage.setItem("gfTextEditor.lineBreak", mode);
}
const currentName = ref(null);      // 当前文件基名（不含 .json）
const doc = ref(null);              // 当前文件数据（纯对象，响应式）
const dirty = ref(false);           // 未保存标记
const activeGroup = ref(null);      // 当前激活分组路径，如 ["用语"]；[] = 顶层；null = 未选
const focusKey = ref(null);         // 需要跳转定位的键路径
const showSaveAs = ref(false);
const statusText = ref("就绪");
const lastSavedAt = ref(null);
const loading = ref(false);
// 拖拽排序状态：dragInfo = 正在拖拽的节点；dropIndicator = 当前放置指示
const dragInfo = ref(null);
const dropIndicator = ref(null);
let statusTimer = null;

const activeGroupLabel = computed(() =>
    activeGroup.value && activeGroup.value.length ? activeGroup.value.join(".") : ""
);

function getValueAt(path) {
    // 安全遍历：任一层缺失即返回 undefined，避免对 undefined 做下标访问崩溃
    let cur = doc.value;
    for (const k of path) {
        if (cur === null || typeof cur !== "object") return undefined;
        cur = cur[k];
    }
    return cur;
}

function setValueAt(path, value) {
    let cur = doc.value;
    for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
    cur[path[path.length - 1]] = value;
}

// 键名合法性：不能含 . / \（. 是插件引用语法的路径分隔符），首尾不允许空白
function isValidKeyName(name) {
    return /^[^.\/\\]+$/.test(name) && name.trim() === name && name.length > 0;
}

// ---------- 拖拽排序 ----------

function onDragStart(info) {
    dragInfo.value = info;
    dropIndicator.value = null;
}

function onDragOver(info) {
    // 与当前指示不同才更新，避免高频重复赋值
    if (JSON.stringify(dropIndicator.value) !== JSON.stringify(info)) dropIndicator.value = info;
}

function onDragEnd() {
    dragInfo.value = null;
    dropIndicator.value = null;
}

function onDrop(info) {
    const drag = dragInfo.value;
    dropIndicator.value = null;
    dragInfo.value = null;
    if (!drag || !info) return;
    let to;
    if (info.placement === "inside" || info.placement === "append") {
        to = { path: info.path.slice(), anchor: null, mode: "append" };
    } else {
        to = { path: info.path.slice(0, -1), anchor: info.path[info.path.length - 1], mode: info.placement };
    }
    moveNodeInDoc(drag.path, to);
}

function moveNodeInDoc(fromPath, to) {
    const res = moveNode(doc.value, fromPath, to);
    if (!res.changed) {
        if (res.reason === "duplicate-key") {
            toast(`目标分组已有同名键「${fromPath[fromPath.length - 1]}」，移动已取消`, true);
        }
        return;
    }
    if (res.doc !== doc.value) doc.value = res.doc;
    syncPathsAfterMove(fromPath, to);
    dirty.value = true;
    const label = fromPath.join(".");
    const target = to.path.length ? to.path.join(".") : "顶层";
    toast(`已移动 ${label} → ${target}`);
}

// 移动后同步激活分组 / 焦点键路径（若它们指向被移动节点或其内部）
function syncPathsAfterMove(fromPath, to) {
    const fromKey = fromPath[fromPath.length - 1];
    const newPath = to.path.concat(fromKey);
    if (activeGroup.value && isDescendantOrSelf(fromPath, activeGroup.value)) {
        activeGroup.value = newPath.concat(activeGroup.value.slice(fromPath.length));
    }
    if (focusKey.value && isDescendantOrSelf(fromPath, focusKey.value)) {
        focusKey.value = newPath.concat(focusKey.value.slice(fromPath.length));
    }
}

function toast(msg, isError = false, ms = 4000) {
    statusText.value = (isError ? "⚠ " : "") + msg;
    if (statusTimer) clearTimeout(statusTimer);
    if (!isError) statusTimer = setTimeout(() => { statusText.value = "就绪"; }, ms);
}

// 打开文件后：默认激活第一个分组
function initActiveGroup() {
    const keys = Object.keys(doc.value || {});
    if (keys.length === 0) {
        activeGroup.value = null;
    } else {
        const first = doc.value[keys[0]];
        activeGroup.value =
            typeof first === "object" && first !== null && !Array.isArray(first) ? [keys[0]] : [];
    }
    focusKey.value = null;
}

async function refreshFiles() {
    try {
        const res = await api.files();
        files.value = res.files;
    } catch (e) {
        toast("读取文件列表失败：" + e.message, true, 6000);
    }
}

// 直接设置工作根（恢复上次目录 / 对话框确定时使用）
async function setWorkRoot(dir) {
    loading.value = true;
    try {
        const res = await api.setWorkDir(dir);
        workRoot.value = res.workRoot;
        files.value = res.files;
        doc.value = null;
        currentName.value = null;
        activeGroup.value = null;
        focusKey.value = null;
        dirty.value = false;
        return true;
    } catch (e) {
        toast("设置目录失败：" + e.message, true, 6000);
        return false;
    } finally {
        loading.value = false;
    }
}

// 「设置文本库目录」对话框确定：先确认未保存修改，成功应用后才关闭弹窗
async function workDirDone(dir) {
    if (dirty.value && doc.value &&
        !confirm(`「${currentName.value}」有未保存的修改，切换目录将丢失这些修改。确定继续吗？`)) return;
    const ok = await setWorkRoot(dir);
    if (ok) showWorkDir.value = false;
}

async function openFile(name, skipConfirm = false) {
    if (!skipConfirm && dirty.value && doc.value &&
        !confirm(`「${currentName.value}」有未保存的修改，确定切换文件吗？`)) return;
    loading.value = true;
    try {
        const res = await api.readFile(name);
        // 把文件里的 <br> / 字面 \n 还原为编辑器换行
        doc.value = displayFromFile(res.data);
        currentName.value = name;
        dirty.value = false;
        lastSavedAt.value = null;
        initActiveGroup();
        localStorage.setItem("gfTextEditor.lastFile", name);
        toast(`已打开 ${name}.json`);
    } catch (e) {
        toast("打开失败：" + e.message, true, 6000);
    } finally {
        loading.value = false;
    }
}

async function save() {
    if (!doc.value || !currentName.value) return;
    loading.value = true;
    try {
        await api.saveFile(currentName.value, toFileForm(doc.value, lineBreakMode.value));
        dirty.value = false;
        lastSavedAt.value = new Date();
        toast(`已保存 ${currentName.value}.json（旧版已备份为 .bak）`);
    } catch (e) {
        toast("保存失败：" + e.message, true, 6000);
    } finally {
        loading.value = false;
    }
}

async function newFile() {
    if (dirty.value && doc.value &&
        !confirm(`「${currentName.value}」有未保存的修改，继续新建将丢失这些修改。确定继续吗？`)) return;
    const name = prompt("新文件名（不含 .json，仅支持字母/数字/下划线/中文）：", "ch03");
    if (!name) return;
    loading.value = true;
    try {
        await api.newFile(name);
        await refreshFiles();
        await openFile(name, true);
    } catch (e) {
        toast("新建失败：" + e.message, true);
    } finally {
        loading.value = false;
    }
}

async function renameCurrentFile() {
    if (!currentName.value) return;
    const name = prompt("新文件名（不含 .json）：", currentName.value);
    if (!name || name === currentName.value) return;
    loading.value = true;
    try {
        const res = await api.renameFile(currentName.value, name);
        await refreshFiles();
        currentName.value = res.name;
        localStorage.setItem("gfTextEditor.lastFile", res.name);
        toast(`已重命名为 ${res.name}.json`);
    } catch (e) {
        toast("重命名失败：" + e.message, true);
    } finally {
        loading.value = false;
    }
}

async function deleteCurrentFile() {
    if (!currentName.value) return;
    const name = currentName.value;
    if (!confirm(`确定删除 ${name}.json 吗？此操作不可撤销。`)) return;
    loading.value = true;
    try {
        await api.deleteFile(name);
        localStorage.removeItem("gfTextEditor.lastFile");
        await refreshFiles();
        doc.value = null;
        currentName.value = null;
        activeGroup.value = null;
        focusKey.value = null;
        dirty.value = false;
        toast(`已删除 ${name}.json`);
    } catch (e) {
        toast("删除失败：" + e.message, true);
    } finally {
        loading.value = false;
    }
}

// ---------- 树操作 ----------

// 点击叶子键：激活其分组并滚动到该键
function select(path) {
    activeGroup.value = path.slice(0, -1);
    focusKey.value = path.slice();
}

// 点击分组行：激活该分组，右侧显示其下所有键
function groupSelect(path) {
    activeGroup.value = path.slice();
    focusKey.value = null;
}

// 键卡片编辑
function updateKeyAt(path, value) {
    setValueAt(path, value);
    dirty.value = true;
}

function addGroup() {
    const name = prompt("新分组名：", "新分组");
    if (!name) return;
    if (!isValidKeyName(name)) { toast("分组名不能包含 . / \\ 字符", true); return; }
    if (Object.prototype.hasOwnProperty.call(doc.value, name)) { toast("同名分组已存在", true); return; }
    doc.value[name] = {};
    dirty.value = true;
    toast("已新增分组 " + name);
}

function addKey(path) {
    const parent = path && path.length ? getValueAt(path) : doc.value;
    if (!parent || typeof parent !== "object" || Array.isArray(parent)) return;
    const name = prompt("新键名：", "text" + (Object.keys(parent).length + 1));
    if (!name) return;
    if (!isValidKeyName(name)) { toast("键名不能包含 . / \\ 字符", true); return; }
    if (Object.prototype.hasOwnProperty.call(parent, name)) { toast("同名键已存在", true); return; }
    parent[name] = "";
    dirty.value = true;
    toast("已新增键 " + name);
}

function isDescendantOrSelf(ancestorPath, p) {
    // 逐元素比较，避免键名含 . 时 join(".") 误判
    if (ancestorPath.length > p.length) return false;
    for (let i = 0; i < ancestorPath.length; i++) {
        if (ancestorPath[i] !== p[i]) return false;
    }
    return true;
}

function renameAt(path, newName) {
    const oldName = path[path.length - 1];
    // 内联编辑直接传入新名；无参时保留 prompt 兜底（兼容其它入口）
    if (newName === undefined || newName === null) {
        newName = prompt("新名称：", oldName);
    }
    if (!newName || newName === oldName) return;
    if (!isValidKeyName(newName)) { toast("名称不能包含 . / \\ 字符", true); return; }
    const parent = path.length > 1 ? getValueAt(path.slice(0, -1)) : doc.value;
    if (Object.prototype.hasOwnProperty.call(parent, newName)) { toast("同名键已存在", true); return; }
    const value = parent[oldName];
    delete parent[oldName];
    parent[newName] = value;
    // 同步前缀：激活分组 / 焦点键是该节点本身或其后代时
    if (activeGroup.value && isDescendantOrSelf(path, activeGroup.value)) {
        activeGroup.value = path.slice(0, -1).concat(newName, activeGroup.value.slice(path.length));
    }
    if (focusKey.value && isDescendantOrSelf(path, focusKey.value)) {
        focusKey.value = path.slice(0, -1).concat(newName, focusKey.value.slice(path.length));
    }
    dirty.value = true;
    toast(`已重命名 ${path.join(".")} → ${path.slice(0, -1).concat(newName).join(".")}`);
}

function removeAt(path) {
    const label = path.join(".");
    if (!confirm(`确定删除「${label}」吗？游戏内引用 ${label} 的文本将显示缺失。`)) return;
    const parent = path.length > 1 ? getValueAt(path.slice(0, -1)) : doc.value;
    delete parent[path[path.length - 1]];
    if (activeGroup.value && isDescendantOrSelf(path, activeGroup.value)) activeGroup.value = null;
    if (focusKey.value && isDescendantOrSelf(path, focusKey.value)) focusKey.value = null;
    dirty.value = true;
    toast(`已删除 ${label}`);
}

// 另存为成功后切换到副本文件（后续 Ctrl+S 保存到新文件，避免误覆盖原文件）
function saveAsDone(info) {
    showSaveAs.value = false;
    currentName.value = info.name;
    dirty.value = false;
    localStorage.setItem("gfTextEditor.lastFile", info.name);
    refreshFiles();
    toast(`已另存为 ${info.name}.json，现正编辑副本`);
}

// ---------- 快捷键与生命周期 ----------

function onKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "s") {
        e.preventDefault();
        save();
    }
}

onMounted(async () => {
    window.addEventListener("keydown", onKeydown);
    let initOk = false;
    try {
        const st = await api.status();
        workRoot.value = st.workRoot;
        files.value = st.files;
        initOk = true;
    } catch (e) {
        toast("初始化失败：" + e.message, true, 6000);
    }
    if (!initOk) return;
    // 恢复上次选择的目录（服务端重启后会回到默认，这里重新设置）
    const lastDir = localStorage.getItem("gfTextEditor.lastDir");
    if (lastDir !== null) {
        await setWorkRoot(lastDir);
    }
    const last = localStorage.getItem("gfTextEditor.lastFile");
    if (last && files.value.indexOf(last) !== -1) {
        openFile(last, true);
    }
});

onBeforeUnmount(() => {
    window.removeEventListener("keydown", onKeydown);
    if (statusTimer) clearTimeout(statusTimer);
});
</script>

<template>
  <div class="app">
    <header class="toolbar">
      <div class="brand">文本 json 编辑器</div>
      <div class="toolbar-group">
        <span class="lb-label" title="保存时换行的表示方式">换行:</span>
        <span class="lb-switch">
          <button
            :class="{ on: lineBreakMode === LINE_BREAK_BR }"
            title="换行保存为 &lt;br&gt;（RMMZ 控制符）"
            @click="setLineBreak(LINE_BREAK_BR)"
          >&lt;br&gt;</button>
          <button
            :class="{ on: lineBreakMode === LINE_BREAK_N }"
            title="换行保存为 \n（字面转义序列）"
            @click="setLineBreak(LINE_BREAK_N)"
          >\n</button>
        </span>
        <span class="current-file" :class="{ dirty: dirty }">
          {{ currentName ? currentName + ".json" : "（未打开文件）" }}
          <span v-if="dirty" class="dirty-dot" title="有未保存的修改">●</span>
        </span>
        <button class="tool-btn primary" :disabled="!doc || loading" @click="save">保存 (Ctrl+S)</button>
        <button class="tool-btn" :disabled="!doc" @click="showSaveAs = true">另存为</button>
        <button class="tool-btn" :disabled="!currentName || loading" @click="renameCurrentFile">重命名</button>
        <button class="tool-btn danger" :disabled="!currentName || loading" @click="deleteCurrentFile">删除文件</button>
      </div>
    </header>

    <main class="main">
      <FileSidebar
        :files="files"
        :work-root="workRoot"
        :current="currentName"
        :dirty="dirty"
        :loading="loading"
        @open="openFile"
        @new="newFile"
        @refresh="refreshFiles"
        @choose-dir="showWorkDir = true"
      />

      <KeyTree
        v-if="doc"
        :key="currentName"
        :doc="doc"
        :selected-path="focusKey"
        :drag-info="dragInfo"
        :indicator="dropIndicator"
        @select="select"
        @group-select="groupSelect"
        @add-group="addGroup"
        @add-key="addKey"
        @rename="renameAt"
        @remove="removeAt"
        @drag-start="onDragStart"
        @drag-over="onDragOver"
        @drop="onDrop"
        @drag-end="onDragEnd"
      />
      <div v-else class="placeholder">
        <p>{{ workRoot ? "← 在左侧选择一个文本文件，或点击「＋」新建" : "点击「📁 选择目录」指定文本库位置" }}</p>
      </div>

      <KeyListEditor
        v-if="doc"
        :key="currentName + '|' + activeGroupLabel"
        :file-name="currentName"
        :doc="doc"
        :group-path="activeGroup"
        :focus-key="focusKey"
        :drag-info="dragInfo"
        :indicator="dropIndicator"
        @update-key="updateKeyAt"
        @notify="toast"
        @rename="renameAt"
        @drag-start="onDragStart"
        @drag-over="onDragOver"
        @drop="onDrop"
        @drag-end="onDragEnd"
      />
    </main>

    <footer class="statusbar">
      <span class="status-msg">{{ statusText }}</span>
      <span class="status-right">
        <template v-if="lastSavedAt">上次保存 {{ lastSavedAt.toLocaleTimeString() }}</template>
        <template v-if="activeGroupLabel"> | 分组：{{ activeGroupLabel }}</template>
      </span>
    </footer>

    <SaveAsDialog
      v-if="showSaveAs"
      :data="doc ? toFileForm(doc, lineBreakMode) : null"
      :default-name="currentName || '新文本'"
      @close="showSaveAs = false"
      @done="saveAsDone"
    />

    <WorkDirDialog
      v-if="showWorkDir"
      :current-dir="workRoot"
      @close="showWorkDir = false"
      @done="workDirDone"
    />
  </div>
</template>

<style scoped>
.app {
    display: grid;
    grid-template-rows: 48px 1fr 30px;
    height: 100%;
}
.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border);
}
.brand { font-size: 15px; font-weight: 600; color: var(--accent); }
.toolbar-group { display: flex; align-items: center; gap: 8px; }
.lb-label { font-size: 12px; color: var(--text-dim); }
.lb-switch {
    display: inline-flex;
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
}
.lb-switch button {
    border: none;
    border-radius: 0;
    padding: 3px 10px;
    font-size: 12px;
    background: var(--bg-hover);
}
.lb-switch button.on {
    background: var(--accent);
    color: #fff;
    font-weight: 600;
}
.current-file { font-size: 13px; color: var(--text-dim); margin-right: 6px; }
.current-file.dirty { color: var(--warn); }
.dirty-dot { color: var(--warn); }
.main {
    display: grid;
    grid-template-columns: 190px 240px 1fr;
    min-height: 0;
}
.placeholder {
    grid-column: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
}
.statusbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    font-size: 12px;
    color: var(--text-dim);
    background: var(--bg-panel);
    border-top: 1px solid var(--border);
}
.status-msg { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-right { flex: none; }
</style>
