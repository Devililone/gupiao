# 股价趋势筛选工作台 - GitHub Pages 部署脚本

# 使用方法：
# 1. 在 GitHub 上创建一个新仓库（例如：stock-trend-workstation）
# 2. 将本脚本放在 stock-trend-workstation 文件夹同级目录
# 3. 修改下面的 GITHUB_USERNAME 和 REPO_NAME 为你自己的
# 4. 运行: bash deploy-to-github-pages.sh

# ========== 配置项 ==========
GITHUB_USERNAME="your-username"    # 改成你的 GitHub 用户名
REPO_NAME="stock-trend-workstation"  # 改成你的仓库名
BRANCH="gh-pages"
FOLDER="stock-trend-workstation"    # 工作台文件夹名称
# ============================

echo "=========================================="
echo "  股价趋势筛选工作台 - GitHub Pages 部署"
echo "=========================================="
echo ""

# 检查文件夹是否存在
if [ ! -d "$FOLDER" ]; then
  echo "❌ 错误：找不到 '$FOLDER' 文件夹"
  echo "请确保脚本和 $FOLDER 文件夹在同一目录下"
  exit 1
fi

# 检查 git 是否安装
if ! command -v git &> /dev/null; then
  echo "❌ 错误：未检测到 git，请先安装 git"
  exit 1
fi

echo "📁 源文件夹: $FOLDER"
echo "🔗 目标仓库: $GITHUB_USERNAME/$REPO_NAME"
echo "🌿 部署分支: $BRANCH"
echo ""

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo "📦 准备部署文件..."
cp -r "$FOLDER"/* "$TEMP_DIR"/

cd "$TEMP_DIR"

# 初始化 git
git init
git checkout -b "$BRANCH"
git add -A
git commit -m "Deploy stock-trend-workstation to GitHub Pages"

# 添加远程仓库
REMOTE_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
git remote add origin "$REMOTE_URL"

echo ""
echo "🚀 正在推送到 GitHub..."
echo "远程地址: $REMOTE_URL"
echo ""

# 强制推送到 gh-pages 分支
if git push -u origin "$BRANCH" --force; then
  echo ""
  echo "✅ 部署成功！"
  echo ""
  echo "📋 下一步操作："
  echo "1. 打开 GitHub 仓库设置: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/pages"
  echo "2. 在 'Build and deployment' 中，Source 选择 'Deploy from a branch'"
  echo "3. Branch 选择 '$BRANCH'，目录选择 '/ (root)'"
  echo "4. 点击 Save，等待 1-2 分钟"
  echo ""
  echo "🌐 部署完成后访问: https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
  echo ""
else
  echo ""
  echo "❌ 推送失败，请检查："
  echo "1. GitHub 用户名和仓库名是否正确"
  echo "2. 仓库是否已创建（需要先在 GitHub 上新建空仓库）"
  echo "3. 是否有推送权限"
  echo ""
  echo "💡 提示：如果是首次使用，请先配置 git："
  echo "   git config --global user.name '你的名字'"
  echo "   git config --global user.email '你的邮箱'"
fi

# 清理临时目录
cd ..
rm -rf "$TEMP_DIR"
