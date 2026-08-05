@echo off
chcp 65001 >nul
cd /d %~dp0

echo ============================================
echo   文本 json 编辑器 - 启动（开发模式）
echo ============================================
echo.

rem ---- 清理可能残留的旧服务进程（多次启动后 3001/5173 可能被占用）----
set FOUND=
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /c:":3001 " /c:":5173 " ^| findstr /i "LISTENING"') do (
    if not defined FOUND (
        echo [清理] 发现残留服务进程 PID=%%p，正在关闭...
        taskkill /F /PID %%p >nul 2>&1
    )
)
timeout /t 1 >nul

if not exist node_modules (
    echo 首次运行，正在安装依赖（约 1~2 分钟）...
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败，请检查网络后重试。
        pause
        exit /b 1
    )
)

echo 正在启动（浏览器将自动打开 http://localhost:5173 ）...
start "" http://localhost:5173
call npm run dev

pause
