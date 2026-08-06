<script setup>
import { ref, computed } from "vue";
import TreeNode from "./TreeNode.vue";
import { computeAppendInfo } from "../reorder.js";

const props = defineProps({
    doc: { type: Object, required: true },
    selectedPath: { type: Array, default: null },
    dragInfo: { type: Object, default: null },
    indicator: { type: Object, default: null }
});
const emit = defineEmits([
    "select", "group-select", "add-group", "add-key", "rename", "remove",
    "drag-start", "drag-over", "drop", "drag-end"
]);

const scrollEl = ref(null);

// 空白区 = 树的列表底部空白 / 空文件提示：拖到这里 = 移动到顶层末尾
const isAppendTop = computed(() =>
    !!props.indicator && props.indicator.placement === "append" && props.indicator.path.length === 0
);

function isBlankTarget(e) {
    const t = e.target;
    return t === scrollEl.value || (t.classList && t.classList.contains("tree-empty"));
}

function onScrollDragOver(e) {
    if (!isBlankTarget(e)) return;
    const info = computeAppendInfo(props.dragInfo, []); // 空白区 = 顶层末尾
    if (!info) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    emit("drag-over", info);
}

function onScrollDrop(e) {
    if (!isBlankTarget(e)) return;
    const info = computeAppendInfo(props.dragInfo, []);
    if (!info) return;
    e.preventDefault();
    emit("drop", info);
}
</script>

<template>
  <section class="key-tree">
    <div class="panel-head">
      <span>分组 / 键</span>
      <button class="icon-btn" title="新增分组" @click="emit('add-group')">＋分组</button>
    </div>
    <div
      ref="scrollEl"
      class="tree-scroll"
      :class="{ 'drop-append': isAppendTop }"
      @dragover="onScrollDragOver"
      @drop="onScrollDrop"
    >
      <TreeNode
        v-for="(v, k) in doc"
        :key="k"
        :name="k"
        :node="v"
        :path="[k]"
        :depth="0"
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
      <p v-if="Object.keys(doc).length === 0" class="tree-empty">
        （空文件，点「＋分组」开始）
      </p>
    </div>
  </section>
</template>

<style scoped>
.key-tree {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    background: var(--bg-panel);
    min-height: 0;
}
.panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
    color: var(--text-dim);
    font-size: 12px;
    flex: none;
}
.tree-scroll { flex: 1; overflow-y: auto; padding: 4px 0; }
.tree-scroll.drop-append { outline: 2px dashed var(--accent); outline-offset: -2px; }
.tree-empty { color: var(--text-dim); padding: 12px; font-size: 12px; margin: 0; }
</style>
