# 🎮 游戏中心 - Game Hub

🌐 **在线地址：https://hvrrgfe.github.io/game-hub/**

> 任何设备（电脑、iPhone、iPad、安卓）都能访问，电脑关机也不影响。

---

## 📂 项目结构

```
games_web/
├── index.html              ← 游戏大厅（添加新游戏改这里）
├── style.css               ← 大厅样式
├── server.py               ← 本地测试服务器
├── deploy.py               ← 一键部署脚本
├── .nojekyll               ← GitHub Pages 配置
└── games/
    ├── plane_battle/       ← 飞机大战（已上线）
    │   ├── index.html
    │   └── game.js
    └── _template/          ← 新游戏模板
```

---

## 🚀 本地测试

```powershell
cd "C:\Users\User\Desktop\a new\games_web"
python server.py
```

浏览器打开 http://localhost:8000

---

## 🎯 添加新游戏

1. 复制 `games/_template` 重命名为你的游戏名
2. 在 `games/你的游戏名/` 下开发游戏
3. 在 `index.html`（大厅文件）中加一个 `.game-card` 链接

---

## 📦 重新部署（更新代码后）

```powershell
cd "C:\Users\User\Desktop\a new\games_web"
git add -A
git commit -m "更新内容"
git push origin master
```

等 1-2 分钟 GitHub Pages 自动更新。

---

## 🎮 目前游戏

| 游戏 | 说明 |
|---|---|
| ✈️ 飞机大战 | 经典街机射击游戏，控制战机消灭敌人 |
| 🦖 恐龙跑跑 | 经典跑步跳跃游戏，越过障碍物跑向更远！ |
| 🔨 打地鼠 | 30秒限时挑战，看你能打中多少只地鼠！ |
