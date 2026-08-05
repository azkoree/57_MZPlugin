<script setup>
import { ref, onMounted } from "vue";
import { api } from "../api";

// 设置文本库目录：可直接输入/粘贴路径，或用系统文件夹对话框浏览选择
const props = defineProps({
    currentDir: { type: String, default: null }
});
const emit = defineEmits(["close", "done"]);

const input = ref(props.currentDir || "");
const error = ref("");
const browsing = ref(false);

async function browse() {
    error.value = "";
    browsing.value = true;
    try {
        const res = await api.pickDir();
        if (res.cancelled) return; // 用户取消浏览
        input.value = res.workRoot;
    } catch (e) {
        error.value = "浏览失败：" + e.message;
    } finally {
        browsing.value = false;
    }
}

function confirm() {
    const dir = input.value.trim();
    if (!dir) { error.value = "请输入目录路径"; return; }
    emit("done", dir);
}

onMounted(() => {
    // 自动聚焦输入框，方便直接粘贴路径
    setTimeout(() => {
        const el = document.querySelector(".workdir-dialog input");
        if (el) el.focus();
    }, 50);
});
</script>

<template>
  <div class="modal-mask workdir-dialog" @click.self="emit('close')">
    <div class="modal">
      <h3>设置文本库目录</h3>
      <p class="hint">
        可直接输入 / 粘贴目录路径（如 D:\我的游戏\dataEx\Scenario），或点击「浏览…」用系统对话框选择。
      </p>
      <div class="form-row">
        <label>目录路径</label>
        <div class="dir-input-row">
          <input
            type="text"
            v-model="input"
            placeholder="例如 D:\游戏\dataEx\Scenario"
            @keyup.enter="confirm"
          />
          <button class="tool-btn" :disabled="browsing" @click="browse">
            {{ browsing ? "打开中…" : "浏览…" }}
          </button>
        </div>
      </div>
      <p v-if="error" class="form-error">⚠ {{ error }}</p>
      <div class="modal-actions">
        <button class="tool-btn" @click="emit('close')">取消</button>
        <button class="tool-btn primary" @click="confirm">确定</button>
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
    width: 520px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 18px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
}
.modal h3 { margin: 0 0 8px; font-size: 15px; }
.hint { margin: 0 0 14px; font-size: 12px; color: var(--text-dim); line-height: 1.6; }
.form-row { margin-bottom: 12px; }
.form-row label {
    display: block;
    font-size: 12px;
    color: var(--text-dim);
    margin-bottom: 6px;
}
.dir-input-row { display: flex; gap: 6px; }
.dir-input-row input {
    flex: 1;
    min-width: 0;
    font-family: Consolas, "Courier New", monospace;
    font-size: 13px;
}
.form-error { color: var(--danger); font-size: 12px; margin: 0 0 8px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
</style>
