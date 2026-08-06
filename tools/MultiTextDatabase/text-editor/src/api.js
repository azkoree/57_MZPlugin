// 后端接口封装（统一处理 { ok } 响应与错误抛出；带超时防挂起）

async function request(url, options, timeoutMs = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        let body = null;
        try {
            body = await res.json();
        } catch (e) {
            body = null;
        }
        if (!res.ok || !body || body.ok !== true) {
            const msg = body && body.error ? body.error : "请求失败（HTTP " + res.status + "）";
            throw new Error(msg);
        }
        return body;
    } catch (e) {
        if (e.name === "AbortError") throw new Error("请求超时，请重试");
        throw e;
    } finally {
        clearTimeout(timer);
    }
}

function jsonBody(data) {
    return {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    };
}

export const api = {
    status: () => request("/api/status"),
    // 目录选择会等待用户操作系统对话框，给较长超时（5 分钟）
    pickDir: () => request("/api/pick-dir", { method: "POST" }, 300000),
    setWorkDir: (dir) => request("/api/workdir", jsonBody({ dir })),
    files: () => request("/api/files"),
    readFile: (name) => request("/api/file?name=" + encodeURIComponent(name)),
    saveFile: (name, data) => request("/api/file", jsonBody({ name, data })),
    newFile: (name) => request("/api/file/new", jsonBody({ name })),
    renameFile: (oldName, newName) => request("/api/file/rename", jsonBody({ oldName, newName })),
    deleteFile: (name) => request("/api/file?name=" + encodeURIComponent(name), { method: "DELETE" }),
    saveAs: (name, data) => request("/api/save-as", jsonBody({ name, data }))
};
