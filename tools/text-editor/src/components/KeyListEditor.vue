<script setup>
import { ref, computed, watch, nextTick } from "vue";

// 键卡片列表：显示当前分组下所有键，每个键一张卡片（标题可点击复制占位符 + 约4行输入框）
const props = defineProps({
    fileName: { type: String, default: "" },
    doc: { type: Object, required: true },
    groupPath: { type: Array, default: null },   // 当前分组路径，如 ["用语"]；空数组 = 顶层
    focusKey: { type: Array, default: null }     // 需要滚动定位的键路径
});
const emit = defineEmits(["update-key", "notify"]);

const listEl = ref(null);

// 当前分组对象（groupPath 为空数组时即文档顶层）
const group = computed(() => {
    if (props.groupPath === null || props.groupPath === undefined) return null;
    if (props.groupPath.length === 0) return props.doc;
    let cur = props.doc;
    for (const k of props.groupPath) {
        if (cur === null || typeof cur !== "object") return null;
        cur = cur[k];
    }
    return cur;
});

const groupLabel = computed(() =>
    props.groupPath ? props.groupPath.join(".") : ""
);

// 分组下的键条目：字符串键可编辑，其余只读
const entries = computed(() => {
    if (!group.value || typeof group.value !== "object" || Array.isArray(group.value)) return [];
    return Object.keys(group.value).map((k) => {
        const v = group.value[k];
        return {
            key: k,
            value: v,
            isText: typeof v === "string",
            path: (props.groupPath || []).concat(k),
            label: (groupLabel.value ? groupLabel.value + "." : "") + k,
            placeholder: "${" + props.fileName + ", " +
                (groupLabel.value ? groupLabel.value + "." : "") + k + "}"
        };
    });
});

function onInput(entry, e) {
    emit("update-key", entry.path, e.target.value);
}

async function copyPlaceholder(entry) {
    try {
        await navigator.clipboard.writeText(entry.placeholder);
        emit("notify", "已复制 " + entry.placeholder);
    } catch (err) {
        emit("notify", "复制失败：" + err.message, true);
    }
}

// 焦点跳转：focusKey 变化时滚动到对应卡片（遍历比较，避免键名含特殊字符时选择器报错）
watch(
    () => props.focusKey,
    (path) => {
        if (!path) return;
        nextTick(() => {
            const cards = listEl.value ? listEl.value.querySelectorAll(".key-card") : [];
            let target = null;
            for (const c of cards) {
                if (c.dataset.keyPath === path.join("|")) { target = c; break; }
            }
            if (target) target.scrollIntoView({ block: "center", behavior: "smooth" });
        });
    },
    { immediate: true }
);
</script>

<template>
  <section class="key-list-editor">
    <div class="panel-head editor-head">
      <span class="key-path">
        {{ groupLabel ? "分组 " + groupLabel : "顶层键" }}
      </span>
      <span class="key-meta">{{ entries.length }} 个键 · 点击标题复制引用</span>
    </div>
    <div ref="listEl" class="card-scroll">
      <p v-if="group === null" class="list-empty">
        ← 在左侧树中点击一个分组，此处显示该分组下的所有键
      </p>
      <p v-else-if="entries.length === 0" class="list-empty">
        （该分组暂无内容，可在左侧树点「＋」新增键）
      </p>
      <div
        v-for="entry in entries"
        v-else
        :key="entry.key"
        class="key-card"
        :data-key-path="entry.path.join('|')"
      >
        <div class="card-head">
          <button
            class="card-title"
            :title="'点击复制：' + entry.placeholder"
            @click="copyPlaceholder(entry)"
          >
            {{ entry.label }}
            <span class="copy-hint">点击复制</span>
          </button>
          <span class="card-meta">
            {{ entry.isText ? entry.value.length + " 字" : "只读" }}
          </span>
        </div>
        <textarea
          v-if="entry.isText"
          class="card-input"
          :value="entry.value"
          rows="4"
          spellcheck="false"
          placeholder="在此输入文本…&#10;回车即换行，保存时按顶栏所选格式（&lt;br&gt; 或 \n）写入；也支持 \c[色号] 等 RMMZ 控制符"
          @input="onInput(entry, $event)"
        ></textarea>
        <div v-else class="card-readonly">
          {{ typeof entry.value === "object" && entry.value !== null ? "子分组 / 数组（在左侧树中管理）" : String(entry.value) }}
          <span class="copy-hint">（只读，点击标题仍可复制引用）</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.key-list-editor {
    display: flex;
    flex-direction: column;
    min-height: 0;
}
.panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    color: var(--text-dim);
    font-size: 12px;
    flex: none;
}
.key-path {
    font-size: 13px;
    color: var(--accent);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.key-meta { color: var(--text-dim); font-size: 11px; flex: none; }
.card-scroll { flex: 1; overflow-y: auto; padding: 10px 12px 20px; }
.list-empty { color: var(--text-dim); text-align: center; margin-top: 40px; font-size: 13px; }
.key-card {
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: 6px;
    margin-bottom: 12px;
    overflow: hidden;
}
.key-card:hover { border-color: var(--accent); }
.card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-hover);
}
.card-title {
    flex: 1;
    min-width: 0;
    text-align: left;
    background: transparent;
    border: none;
    padding: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.card-title:hover { color: var(--accent); }
.copy-hint {
    font-size: 11px;
    font-weight: 400;
    color: var(--text-dim);
    margin-left: 6px;
}
.card-title:hover .copy-hint { color: var(--accent); }
.card-meta { flex: none; font-size: 11px; color: var(--text-dim); }
.card-input {
    display: block;
    width: 100%;
    border: none;
    border-radius: 0;
    resize: vertical;
    background: var(--bg-panel);
    color: var(--text);
    font-family: Consolas, "Courier New", monospace;
    font-size: 13px;
    line-height: 1.6;
    padding: 8px 10px;
    outline: none;
}
.card-input:focus { background: #fff; }
.card-readonly {
    padding: 8px 10px;
    font-size: 12px;
    color: var(--text-dim);
}
</style>
