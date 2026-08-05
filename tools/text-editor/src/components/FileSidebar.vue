<script setup>
import { computed } from "vue";

const props = defineProps({
    files: { type: Array, required: true },
    workRoot: { type: String, default: null },
    current: { type: String, default: null },
    dirty: { type: Boolean, default: false },
    loading: { type: Boolean, default: false }
});
const emit = defineEmits(["open", "new", "refresh", "choose-dir"]);

// 目录条显示最后一段（长路径截断），悬停显示完整路径
const workRootShort = computed(() => {
    if (!props.workRoot) return "未选择目录";
    const parts = props.workRoot.split(/[\\/]/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : props.workRoot;
});
</script>

<template>
  <aside class="file-sidebar">
    <div
      class="workdir-bar"
      :class="{ empty: !workRoot }"
      :title="workRoot || '点击选择文本库目录'"
      @click="emit('choose-dir')"
    >
      <span class="workdir-label">📁</span>
      <span class="workdir-path">{{ workRootShort }}</span>
      <span class="workdir-change">选择目录</span>
    </div>
    <div class="panel-head">
      <span>文本文件</span>
      <span class="head-actions">
        <button class="icon-btn" title="刷新文件列表" @click="emit('refresh')">⟳</button>
        <button class="icon-btn" title="新建文件" @click="emit('new')">＋</button>
      </span>
    </div>
    <ul class="file-list">
      <li
        v-for="f in files"
        :key="f"
        class="file-item"
        :class="{ active: f === current }"
        @click="emit('open', f)"
      >
        <span class="file-name">
          {{ f }}<span v-if="f === current && dirty" class="dirty-dot">●</span>
        </span>
        <span class="file-ext">.json</span>
      </li>
      <li v-if="files.length === 0 && !loading" class="file-empty">
        （当前目录下没有 json 文件，点 ＋ 新建）
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.file-sidebar {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    background: var(--bg);
    min-height: 0;
}
.workdir-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    cursor: pointer;
    border-bottom: 1px solid var(--border);
    background: var(--bg-hover);
    font-size: 12px;
}
.workdir-bar:hover { background: var(--bg-active); }
.workdir-label { flex: none; }
.workdir-path {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--accent);
}
.workdir-bar.empty .workdir-path { color: var(--warn); }
.workdir-change { flex: none; color: var(--text-dim); font-size: 11px; }
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
.head-actions { display: flex; gap: 2px; }
.file-list {
    list-style: none;
    margin: 0;
    padding: 4px 0;
    overflow-y: auto;
    flex: 1;
}
.file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px 6px 12px;
    cursor: pointer;
    font-size: 13px;
}
.file-item:hover { background: var(--bg-hover); }
.file-item.active { background: var(--bg-active); color: var(--text); font-weight: 600; }
.file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-ext { color: var(--text-dim); font-size: 11px; }
.file-empty { padding: 12px; color: var(--text-dim); font-size: 12px; }
.dirty-dot { color: var(--warn); margin-left: 4px; }
</style>
