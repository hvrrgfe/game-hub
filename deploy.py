#!/usr/bin/env python3
"""一键部署脚本 - 将游戏中心发布到 GitHub Pages"""

import subprocess, sys, os, webbrowser, json, urllib.request, urllib.error, time

DIR = os.path.dirname(os.path.abspath(__file__))
REPO_NAME = "game-hub"

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=DIR)
    return r.stdout.strip(), r.stderr.strip(), r.returncode

print("=" * 55)
print("  🚀 游戏中心 - 一键部署到 GitHub Pages")
print("=" * 55)

# Step 1: Check gh
print("\n[1/5] 检查 GitHub CLI...")
out, err, code = run("gh --version")
if code != 0:
    print("  ❌ 未安装 GitHub CLI，请先安装:")
    print("     https://cli.github.com/")
    input("\n按 Enter 安装后继续...")
    import subprocess as sp
    sp.run(["start", "https://cli.github.com/"], shell=True)
    sys.exit(1)
print(f"  ✅ {out.split(chr(10))[0]}")

# Step 2: Auth check
print("\n[2/5] 检查 GitHub 登录状态...")
out, err, code = run("gh auth status")
if code != 0:
    print("  ⚠️  需要登录 GitHub")
    print("  正在打开浏览器进行认证...")
    run("gh auth login --web")
    # Wait for auth
    for i in range(30):
        out, _, code = run("gh auth status")
        if code == 0:
            print("  ✅ 登录成功!")
            break
        time.sleep(2)
    else:
        print("  ❌ 登录超时，请手动运行: gh auth login --web")
        sys.exit(1)
else:
    print("  ✅ 已登录")

# Step 3: Get GitHub username
print("\n[3/5] 获取用户信息...")
out, _, _ = run("gh api user --jq .login")
USERNAME = out.strip()
print(f"  👤 {USERNAME}")

# Step 4: Create repo and push
print(f"\n[4/5] 创建仓库 {USERNAME}/{REPO_NAME}...")
out, _, code = run(f"gh repo create {REPO_NAME} --public --source=. --push --description='Game Hub - 游戏中心'")
if "already exists" in out+err:
    print("  ⚠️  仓库已存在，尝试推送...")
    run(f"git remote add origin https://github.com/{USERNAME}/{REPO_NAME}.git")
    run("git push -u origin master")
elif code == 0:
    print("  ✅ 仓库创建并推送成功!")
else:
    print(f"  {out}{err}")
    # Try git push directly
    run(f"git remote add origin https://github.com/{USERNAME}/{REPO_NAME}.git")
    run("git push -u origin master")

# Step 5: Enable GitHub Pages
print(f"\n[5/5] 启用 GitHub Pages...")
api_url = f"https://api.github.com/repos/{USERNAME}/{REPO_NAME}/pages"
data = json.dumps({"source": {"branch": "master", "path": "/"}}).encode()
req = urllib.request.Request(api_url, data=data, method="POST")
req.add_header("Authorization", f"token {run('gh auth token')[0]}")
req.add_header("Content-Type", "application/json")
try:
    resp = urllib.request.urlopen(req)
    print("  ✅ Pages 已启用!")
except urllib.error.HTTPError as e:
    if e.code == 409:
        print("  ⚠️  Pages 可能已启用，尝试更新配置...")
        req2 = urllib.request.Request(api_url, data=data, method="PUT")
        req2.add_header("Authorization", f"token {run('gh auth token')[0]}")
        req2.add_header("Content-Type", "application/json")
        try:
            urllib.request.urlopen(req2)
            print("  ✅ 配置已更新!")
        except:
            print("  ⚠️  请手动在仓库 Settings > Pages 中开启")
    else:
        print(f"  ⚠️  请手动开启 Pages: Settings > Pages (选择 master branch / root)")
        webbrowser.open(f"https://github.com/{USERNAME}/{REPO_NAME}/settings/pages")

# Done
url = f"https://{USERNAME}.github.io/{REPO_NAME}/"
print(f"\n{'='*55}")
print(f"  🎉 部署完成!")
print(f"  🌐 访问地址: {url}")
print(f"\n  电脑、iPhone、iPad、安卓...任何设备都能访问!")
print(f"{'='*55}")

try:
    webbrowser.open(url)
except:
    pass
