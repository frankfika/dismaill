#!/bin/bash
# NovaMail (Dismail) 本地运行脚本
# 用法: ./run-local.sh [dev|build|test]

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
TAURI_DIR="$PROJECT_DIR/src-tauri"

color() {
  case $1 in
    red)    echo -e "\033[31m$2\033[0m" ;;
    green)  echo -e "\033[32m$2\033[0m" ;;
    yellow) echo -e "\033[33m$2\033[0m" ;;
    blue)   echo -e "\033[34m$2\033[0m" ;;
    *)      echo "$2" ;;
  esac
}

check_deps() {
  color blue "🔍 检查依赖..."
  
  if ! command -v node &> /dev/null; then
    color red "❌ Node.js 未安装。请安装 Node.js 18+"
    exit 1
  fi
  color green "✅ Node.js: $(node --version)"
  
  if ! command -v npm &> /dev/null; then
    color red "❌ npm 未安装"
    exit 1
  fi
  
  if ! command -v cargo &> /dev/null; then
    color yellow "⚠️  Rust/Cargo 未安装。Tauri 桌面应用无法编译。"
    color yellow "   安装命令: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    color yellow "   如果只运行前端，可以跳过 Rust 安装。"
    HAS_CARGO=false
  else
    color green "✅ Cargo: $(cargo --version)"
    HAS_CARGO=true
  fi
}

install_deps() {
  color blue "📦 安装前端依赖..."
  cd "$PROJECT_DIR"
  if [ ! -d "node_modules" ]; then
    npm install
  else
    color yellow "   node_modules 已存在，跳过安装"
  fi
}

run_dev() {
  color blue "🚀 启动开发模式..."
  cd "$PROJECT_DIR"
  
  if [ "$HAS_CARGO" = true ]; then
    color green "✅ 检测到 Cargo，启动完整 Tauri 桌面应用..."
    color yellow "   前端: http://localhost:5173"
    color yellow "   按 Ctrl+C 停止"
    npm run tauri:dev
  else
    color yellow "⚠️  未检测到 Cargo，仅启动前端开发服务器..."
    color yellow "   注意: 邮件/AI/聊天功能需要 Tauri 后端，前端单独运行会报错"
    color yellow "   前端: http://localhost:5173"
    color yellow "   按 Ctrl+C 停止"
    npm run dev
  fi
}

run_build() {
  color blue "🔨 构建项目..."
  cd "$PROJECT_DIR"
  
  color blue "   构建前端..."
  npm run build
  
  if [ "$HAS_CARGO" = true ]; then
    color blue "   构建 Tauri 桌面应用..."
    npm run tauri:build
    color green "✅ 构建完成! 应用位于:"
    find "$TAURI_DIR/target/release/bundle" -name "*.app" -o -name "*.dmg" -o -name "*.exe" 2>/dev/null | head -5
  else
    color yellow "⚠️  跳过 Tauri 构建（未安装 Rust）"
    color green "✅ 前端构建完成: $PROJECT_DIR/dist/"
  fi
}

run_test() {
  color blue "🧪 运行测试..."
  cd "$PROJECT_DIR"
  
  color blue "   前端单元测试..."
  npm test
  
  if [ "$HAS_CARGO" = true ]; then
    color blue "   Rust 后端测试..."
    cd "$TAURI_DIR" && cargo test
  fi
}

run_preview() {
  color blue "👁️  预览前端构建产物..."
  cd "$PROJECT_DIR"
  if [ ! -d "dist" ]; then
    color yellow "   dist 目录不存在，先构建前端..."
    npm run build
  fi
  color yellow "   预览地址: http://localhost:4173"
  color yellow "   按 Ctrl+C 停止"
  npm run preview
}

# ── 主入口 ──
case "${1:-dev}" in
  dev)
    check_deps
    install_deps
    run_dev
    ;;
  build)
    check_deps
    install_deps
    run_build
    ;;
  test)
    check_deps
    install_deps
    run_test
    ;;
  preview)
    check_deps
    install_deps
    run_preview
    ;;
  *)
    echo "用法: $0 [dev|build|test|preview]"
    echo ""
    echo "  dev     - 启动开发服务器（默认）"
    echo "  build   - 构建项目"
    echo "  test    - 运行所有测试"
    echo "  preview - 预览构建产物"
    exit 1
    ;;
esac
