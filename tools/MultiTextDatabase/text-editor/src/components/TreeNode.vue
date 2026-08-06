<script setup>
import { ref, computed, nextTick } from "vue";
import { pathId, computeDropInfo } from "../reorder.js";

const props = defineProps({
    name: { type: String, required: true },
    node: { type: [String, Number, Boolean, Object, Array], required: true },
    path: { type: Array, required: true },
    depth: { type: Number, default: 0 },
    selectedPath: { type: Array, default: null },
    dragInfo: { type: Object, default: null },   // 正在拖拽的节点 { path, kind: 'group'|'leaf' }
    indicator: { type: Object, default: null }    // 放置指示 { path, kind, placement: 'before'|'after'|'inside' }
});
const emit = defineEmits([
    "select", "group-select", "add-key", "rename", "remove",
    "drag-start", "drag-over", "drop", "drag-end"
]);

const expanded = ref(true);
const dragging = ref(false);
const isObject = computed(() =>
    props.node && typeof props.node === "object" && !Array.isArray(props.node)
);
const isLeaf = computed(() => typeof props.node === "string");
const keys = computed(() => (isObject.value ? Object.keys(props.node) : []));
const isSelected = computed(() => {
    if (!props.selectedPath) return false;
    const a = props.path, b = props.selectedPath;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
});
const preview = computed(() => {
    if (isLeaf.value) return props.node;
    if (props.node === null) return "null";
    if (Array.isArray(props.node)) return "[" + props.node.length + "] 数组（只读）";
    return "[" + typeof props.node + "] 只读";
});
// 可拖拽：分组（对象）与文本键可拖；数组/null/数字/布尔只读不可拖
const draggable = computed(() => isObject.value || isLeaf.value);
// 作为放置目标时的行类型：分组行 or 普通行
const rowKind = computed(() => (isObject.value ? "group" : "row"));

function toggle() {
    if (isObject.value) expanded.value = !expanded.value;
}

// ---------- 内联重命名（双击键名 / 点 ✎ 按钮） ----------

const editing = ref(false);
const editValue = ref("");
const editInput = ref(null);

function startEdit() {
    if (!draggable.value || editing.value) return;
    editing.value = true;
    editValue.value = props.name;
    nextTick(() => {
        const el = editInput.value;
        if (el) { el.focus(); el.select(); }
    });
}

function commitEdit() {
    if (!editing.value) return;
    editing.value = false;
    const v = editValue.value;
    if (v !== props.name) emit("rename", props.path, v);
}

function cancelEdit() {
    editing.value = false;
    editValue.value = "";
}

// 对象行点击：展开/折叠 + 通知父级激活该分组；叶子点击：选中键
function onRowClick() {
    if (isLeaf.value) {
        emit("select", props.path);
    } else {
        toggle();
        emit("group-select", props.path);
    }
}

// ---------- 拖拽 ----------

function onDragStart(e) {
    if (!draggable.value) { e.preventDefault(); return; }
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", pathId(props.path)); } catch (err) { /* 忽略 */ }
    dragging.value = true;
    emit("drag-start", { path: props.path.slice(), kind: isObject.value ? "group" : "leaf" });
}

function onDragEnd() {
    dragging.value = false;
    emit("drag-end");
}

function dropInfoAt(e) {
    if (!props.dragInfo) return null;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.5;
    return computeDropInfo(props.dragInfo, props.path, rowKind.value, ratio);
}

function onDragOver(e) {
    const info = dropInfoAt(e);
    if (!info) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    emit("drag-over", info);
}

function onDrop(e) {
    const info = dropInfoAt(e);
    if (!info) return;
    e.preventDefault();
    emit("drop", info);
}

function isIndicator(placement) {
    return !!props.indicator &&
        props.indicator.placement === placement &&
        pathId(props.indicator.path) === pathId(props.path);
}
</script>

<template>
  <div class="tnode">
    <div
      class="tnode-row"
      :class="{
        object: isObject,
        leaf: isLeaf,
        selected: isSelected,
        dragging,
        'drop-before': isIndicator('before'),
        'drop-after': isIndicator('after'),
        'drop-inside': isIndicator('inside')
      }"
      :style="{ paddingLeft: (8 + depth * 16) + 'px' }"
      :draggable="draggable && !editing"
      @click="onRowClick"
      @dragstart="onDragStart"
      @dragover="onDragOver"
      @drop="onDrop"
      @dragend="onDragEnd"
    >
      <span class="tnode-arrow" :class="{ hidden: !isObject }">{{ isObject ? (expanded ? "▾" : "▸") : "" }}</span>
      <input
        v-if="editing"
        ref="editInput"
        class="tnode-edit"
        v-model="editValue"
        draggable="false"
        @keydown.enter.prevent="commitEdit"
        @keydown.esc="cancelEdit"
        @blur="commitEdit"
        @click.stop
      />
      <span
        v-else
        class="tnode-name"
        :class="{ empty: isLeaf && !node }"
        :title="draggable ? '双击重命名' : ''"
        @dblclick="startEdit"
      >
        {{ name }}{{ isLeaf && !node ? "（空）" : "" }}
      </span>
      <span class="tnode-preview" v-if="isLeaf && node">{{ preview.slice(0, 24) }}</span>
      <span class="tnode-type" v-else-if="!isObject">{{ preview }}</span>
      <span class="tnode-actions" draggable="false" @click.stop>
        <button
          v-if="isObject"
          class="icon-btn"
          title="在此分组下新增键"
          @click="emit('add-key', path)"
        >＋</button>
        <button class="icon-btn" title="重命名" @click="startEdit">✎</button>
        <button class="icon-btn danger" title="删除" @click="emit('remove', path)">✕</button>
      </span>
    </div>
    <template v-if="isObject && expanded">
      <TreeNode
        v-for="(v, k) in node"
        :key="k"
        :name="k"
        :node="v"
        :path="path.concat(k)"
        :depth="depth + 1"
        :selected-path="selectedPath"
        :drag-info="dragInfo"
        :indicator="indicator"
        @select="(p) => emit('select', p)"
        @group-select="(p) => emit('group-select', p)"
        @add-key="(p) => emit('add-key', p)"
        @rename="(p, n) => emit('rename', p, n)"
        @remove="(p) => emit('remove', p)"
        @drag-start="(p) => emit('drag-start', p)"
        @drag-over="(p) => emit('drag-over', p)"
        @drop="(p) => emit('drop', p)"
        @drag-end="() => emit('drag-end')"
      />
    </template>
  </div>
</template>

<style scoped>
.tnode-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    cursor: pointer;
    font-size: 13px;
    border-left: 2px solid transparent;
    user-select: none;
}
.tnode-row:hover { background: var(--bg-hover); }
.tnode-row.selected { background: var(--bg-active); border-left-color: var(--accent); }
/* 拖拽状态 */
.tnode-row.dragging { opacity: 0.45; }
.tnode-row.drop-before { box-shadow: inset 0 2px 0 var(--accent); }
.tnode-row.drop-after { box-shadow: inset 0 -2px 0 var(--accent); }
.tnode-row.drop-inside {
    background: var(--accent-dim);
    outline: 1px dashed var(--accent);
    outline-offset: -1px;
}
.tnode-arrow { width: 14px; color: var(--text-dim); font-size: 11px; flex: none; }
.tnode-arrow.hidden { visibility: hidden; }
.tnode-name { white-space: nowrap; }
.tnode-name.empty { color: var(--text-dim); }
.tnode-edit {
    flex: 1;
    min-width: 0;
    font-family: inherit;
    font-size: 13px;
    padding: 1px 5px;
    border: 1px solid var(--accent);
    border-radius: 3px;
    outline: none;
    color: var(--text);
    background: var(--bg-panel);
}
.tnode-preview {
    color: var(--text-dim);
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
}
.tnode-type { color: var(--text-dim); font-size: 11px; flex: 1; }
.tnode-actions { margin-left: auto; display: none; flex: none; }
.tnode-row:hover .tnode-actions { display: flex; }
</style>
