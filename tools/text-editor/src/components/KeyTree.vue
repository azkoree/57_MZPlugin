<script setup>
import TreeNode from "./TreeNode.vue";

defineProps({
    doc: { type: Object, required: true },
    selectedPath: { type: Array, default: null }
});
const emit = defineEmits(["select", "group-select", "add-group", "add-key", "rename", "remove"]);
</script>

<template>
  <section class="key-tree">
    <div class="panel-head">
      <span>分组 / 键</span>
      <button class="icon-btn" title="新增分组" @click="emit('add-group')">＋分组</button>
    </div>
    <div class="tree-scroll">
      <TreeNode
        v-for="(v, k) in doc"
        :key="k"
        :name="k"
        :node="v"
        :path="[k]"
        :depth="0"
        :selected-path="selectedPath"
        @select="(p) => emit('select', p)"
        @group-select="(p) => emit('group-select', p)"
        @add-key="(p) => emit('add-key', p)"
        @rename="(p) => emit('rename', p)"
        @remove="(p) => emit('remove', p)"
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
.tree-empty { color: var(--text-dim); padding: 12px; font-size: 12px; margin: 0; }
</style>
