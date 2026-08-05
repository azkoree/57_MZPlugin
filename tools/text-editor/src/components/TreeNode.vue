<script setup>
import { ref, computed } from "vue";

const props = defineProps({
    name: { type: String, required: true },
    node: { type: [String, Number, Boolean, Object, Array], required: true },
    path: { type: Array, required: true },
    depth: { type: Number, default: 0 },
    selectedPath: { type: Array, default: null }
});
const emit = defineEmits(["select", "group-select", "add-key", "rename", "remove"]);

const expanded = ref(true);
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

function toggle() {
    if (isObject.value) expanded.value = !expanded.value;
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
</script>

<template>
  <div class="tnode">
    <div
      class="tnode-row"
      :class="{ object: isObject, leaf: isLeaf, selected: isSelected }"
      :style="{ paddingLeft: (8 + depth * 16) + 'px' }"
      @click="onRowClick"
    >
      <span class="tnode-arrow" :class="{ hidden: !isObject }">{{ isObject ? (expanded ? "▾" : "▸") : "" }}</span>
      <span class="tnode-name" :class="{ empty: isLeaf && !node }">
        {{ name }}{{ isLeaf && !node ? "（空）" : "" }}
      </span>
      <span class="tnode-preview" v-if="isLeaf && node">{{ preview.slice(0, 24) }}</span>
      <span class="tnode-type" v-else-if="!isObject">{{ preview }}</span>
      <span class="tnode-actions" @click.stop>
        <button
          v-if="isObject"
          class="icon-btn"
          title="在此分组下新增键"
          @click="emit('add-key', path)"
        >＋</button>
        <button class="icon-btn" title="重命名" @click="emit('rename', path)">✎</button>
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
        @select="(p) => emit('select', p)"
        @group-select="(p) => emit('group-select', p)"
        @add-key="(p) => emit('add-key', p)"
        @rename="(p) => emit('rename', p)"
        @remove="(p) => emit('remove', p)"
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
.tnode-arrow { width: 14px; color: var(--text-dim); font-size: 11px; flex: none; }
.tnode-arrow.hidden { visibility: hidden; }
.tnode-name { white-space: nowrap; }
.tnode-name.empty { color: var(--text-dim); }
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
