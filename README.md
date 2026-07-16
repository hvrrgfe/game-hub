# 🎮 游戏中心 - 部署指南

## 把游戏发布到 GitHub Pages（永久在线）

### 方法一：一键部署（推荐）

#### 1️⃣ 获取 GitHub Token

1. 打开：https://github.com/settings/tokens/new?scopes=repo&description=game-hub-deploy
2. 页面拉到最底部，点击 **Generate token**
3. 复制生成的 token（类似 `ghp_xxxxxxxxxxxxxxxxxxxx`）

#### 2️⃣ 登录 GitHub CLI

打开终端，运行：

```powershell
cd "C:\Users\User\Desktop\a new\games_web"
echo 你的token | gh auth login --with-token
```

（把 "你的token" 换成刚才复制的 token）

#### 3️⃣ 一键部署

```powershell
python deploy.py
```

脚本会自动创建仓库、推送代码、开启 Pages。

---

### 方法二：纯手动部署

如果不想装 GitHub CLI，也可以手动操作：

**① 创建 GitHub 仓库**
- 打开 https://github.com/new
- 仓库名填 `game-hub`
- 选 **Public**
- 点 **Create repository**

**② 推送代码**
在新建的仓库页面会显示命令，复制运行：

```powershell
cd "C:\Users\User\Desktop\a new\games_web"
git remote add origin https://github.com/你的用户名/game-hub.git
git branch -M master
git push -u origin master
```

**③ 开启 Pages**
- 到仓库的 **Settings → Pages**
- Branch 选 `master`，目录选 `/ (root)`
- 点 **Save**

**④ 访问**
等 1-2 分钟，打开：
`https://你的用户名.github.io/game-hub/`

---

### 本地测试（无需部署）

如果只是想本地先看看效果：

```powershell
cd "C:\Users\User\Desktop\a new\games_web"
python server.py
```

浏览器打开 http://localhost:8000

---

### 添加新游戏

1. 复制 `games/_template` 重命名为新游戏名
2. 修改里面的 `index.html` 开发游戏
3. 在 `index.html`（大厅）加一个卡片链接
