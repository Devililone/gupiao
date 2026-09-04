# 股价趋势筛选工作台 - GitHub Pages 部署指南

## 🚀 快速部署（3 分钟搞定）

### 第一步：在 GitHub 上创建仓库

1. 打开 https://github.com/new
2. 仓库名填：`stock-trend-workstation`（可以自定义）
3. 选择 **Public**（公开仓库才能用免费 Pages）
4. 点击 **Create repository**
5. 不用勾选任何初始化选项，直接创建空仓库

### 第二步：运行部署脚本

打开终端，进入工作台所在目录，执行：

```bash
# 进入脚本所在目录
cd /path/to/stock-trend-workstation

# 修改脚本中的用户名和仓库名
# 用编辑器打开 deploy-to-github-pages.sh，把这两行改成你自己的：
#   GITHUB_USERNAME="your-username"
#   REPO_NAME="stock-trend-workstation"

# 给脚本执行权限
chmod +x deploy-to-github-pages.sh

# 运行部署脚本
./deploy-to-github-pages.sh
```

### 第三步：开启 GitHub Pages

1. 打开你的仓库页面：`https://github.com/你的用户名/stock-trend-workstation/settings/pages`
2. 在 **Build and deployment** 区域：
   - **Source** 选 `Deploy from a branch`
   - **Branch** 选 `gh-pages`，目录选 `/ (root)`
3. 点击 **Save**
4. 等待 1-2 分钟，页面顶部会显示你的网站链接

### 🎉 访问你的工作台

部署成功后，访问地址为：
```
https://你的用户名.github.io/stock-trend-workstation/
```

把这个链接发给朋友，他们就能直接打开使用了！

---

## 📦 手动部署步骤（不使用脚本）

如果你不想用脚本，也可以手动操作：

```bash
# 1. 进入工作台目录
cd stock-trend-workstation

# 2. 初始化 git
git init
git checkout -b gh-pages
git add -A
git commit -m "Initial deployment"

# 3. 添加远程仓库（替换成你自己的）
git remote add origin https://github.com/你的用户名/stock-trend-workstation.git

# 4. 推送到 GitHub
git push -u origin gh-pages --force
```

然后按上面的第三步开启 Pages 即可。

---

## 🔄 更新内容后重新部署

修改了文件后，重新运行脚本即可更新：

```bash
./deploy-to-github-pages.sh
```

GitHub Pages 会自动更新，通常 30 秒内生效。

---

## ⚙️ 自定义域名（可选）

如果你有自己的域名：

1. 在仓库根目录创建 `CNAME` 文件，内容为你的域名（如 `stock.example.com`）
2. 在你的域名 DNS 解析中添加一条 CNAME 记录，指向 `你的用户名.github.io`
3. 在 GitHub Pages 设置中填写自定义域名

---

## 💡 注意事项

- 免费 GitHub Pages 仅支持公开仓库
- 私有仓库需要 GitHub Pro 才能使用 Pages
- 部署后如果页面是 404，等 1-2 分钟再试（首次部署需要时间）
- 数据是静态的，每天需要手动更新后重新部署
