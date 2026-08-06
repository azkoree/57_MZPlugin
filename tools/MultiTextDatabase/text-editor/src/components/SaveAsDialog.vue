<script setup>
import { ref } from "vue";
import { api } from "../api";

// 另存为：直接保存到当前文本库目录，仅需输入新文件名
const props = defineProps({
    data: { type: Object, required: true },
    defaultName: { type: String, default: "" }
});
const emit = defineEmits(["close", "done"]);

const name = ref(props.defaultName.replace(/\.json$/i, "") + "_副本");
const saving = ref(false);
const error = ref("");

async function doSaveAs() {
    error.value = "";
    if (!name.value.trim()) { error.value = "请输入文件名"; return; }
    saving.value = true;
    try {
        const info = await api.saveAs(name.value.trim(), props.data);
        emit("done", info);
    } catch (e) {
        error.value = e.message;
    } finally {
        saving.value = false;
    }
}
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal">
      <h3>另存为</h3>
      <p class="hint">将保存到当前文本库目录（与已打开文件同一目录）。</p>
      <div class="form-row">
        <label>文件名（不含 .json）</label>
        <input type="text" v-model="name" @keyup.enter="doSaveAs" />
      </div>
      <p v-if="error" class="form-error">⚠ {{ error }}</p>
      <div class="modal-actions">
        <button class="tool-btn" @click="emit('close')">取消</button>
        <button class="tool-btn primary" :disabled="saving" @click="doSaveAs">
          {{ saving ? "保存中…" : "保存" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-mask {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}
.modal {
    width: 420px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 18px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
}
.modal h3 { margin: 0 0 8px; font-size: 15px; }
.hint { margin: 0 0 14px; font-size: 12px; color: var(--text-dim); }
.form-row { margin-bottom: 12px; }
.form-row label {
    display: block;
    font-size: 12px;
    color: var(--text-dim);
    margin-bottom: 6px;
}
.form-row input { width: 100%; }
.form-error { color: var(--danger); font-size: 12px; margin: 0 0 8px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
</style>
