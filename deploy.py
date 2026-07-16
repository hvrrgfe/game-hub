#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""\u4e00\u952e\u90e8\u7f72 - \u53d1\u5e03\u6e38\u620f\u4e2d\u5fc3\u5230 GitHub Pages"""

import subprocess, sys, os, webbrowser, json, urllib.request, urllib.error, time

DIR = os.path.dirname(os.path.abspath(__file__))
REPO_NAME = "game-hub"

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=DIR)
    return r.stdout.strip(), r.stderr.strip(), r.returncode

def run_interactive(cmd):
    r = subprocess.run(cmd, shell=True, cwd=DIR)
    return r.returncode

print("=" * 58)
print("  \U0001f680 \u6e38\u620f\u4e2d\u5fc3 - \u4e00\u952e\u90e8\u7f72\u5230 GitHub Pages")
print("=" * 58)
print()
print("  \u4f60\u9700\u8981: GitHub \u8d26\u53f7")
print("  \u6709\u4e24\u79cd\u65b9\u5f0f\u53ef\u4ee5\u767b\u5f55\uff0c\u4efb\u9009\u4e00\u79cd:")
print()

# === Step 1: Install check ===
print("-" * 58)
print("  \u6b65\u9aa4 1/4: \u68c0\u67e5 GitHub CLI...")
out, err, code = run("gh --version")
if code != 0:
    print("  \u274c \u672a\u5b89\u88c5 GitHub CLI")
    print()
    print("  \u8bf7\u6253\u5f00 https://cli.github.com/ \u4e0b\u8f7d\u5b89\u88c5")
    print("  \u6216\u8fd0\u884c: winget install --id GitHub.cli")
    input("\n  \u6309 Enter \u9000\u51fa...")
    sys.exit(1)
print(f"  \u2705 {out}")

# === Step 2: Auth ===
print()
print("-" * 58)
print("  \u6b65\u9aa4 2/4: GitHub \u767b\u5f55")
print()
print("  \u4f60\u53ef\u4ee5\u7528\u4ee5\u4e0b\u4e24\u79cd\u65b9\u5f0f\u4e4b\u4e00:")
print()
print("  [1] \u8bbe\u5907\u9a8c\u8bc1\uff08\u63a8\u8350\uff09")
print("      \u8fd0\u884c: gh auth login --web")
print("      \u4f1a\u663e\u793a\u4e00\u4e2a\u9a8c\u8bc1\u7801\uff0c\u7528\u624b\u673a\u6216\u7535\u8111\u6253\u5f00")
print("      https://github.com/login/device \u8f93\u5165\u8be5\u7801\u5373\u53ef")
print()
print("  [2] \u4e2a\u4eba\u8bbf\u95ee\u4ee4\u724c (PAT)")
print("      1. \u6253\u5f00 https://github.com/settings/tokens/new")
print("      2. \u52fe\u9009 repo \u6743\u9650\uff0c\u751f\u6210\u4ee4\u724c")
print("      3. \u590d\u5236\u4ee4\u724c\uff0c\u8fd0\u884c:")
print("         echo \u4f60\u7684\u4ee4\u724c | gh auth login --with-token")
print()

choice = input("  \u8bf7\u9009\u62e9\u65b9\u5f0f (1/2) \u6216\u76f4\u63a5\u6309 Enter \u7ee7\u7eed: ")

out, err, code = run("gh auth status")
if code != 0:
    if choice == "2":
        print("\n  \u8bf7\u8fd0\u884c\u4ee5\u4e0b\u547d\u4ee4\u767b\u5f55:")
        print("  echo \u4f60\u7684\u4ee4\u724c | gh auth login --with-token")
        input("\n  \u767b\u5f55\u5b8c\u6210\u540e\u6309 Enter \u7ee7\u7eed...")
    else:
        print("\n  \u6b63\u5728\u542f\u52a8\u767b\u5f55...")
        print("  \u8bf7\u5728\u5f39\u51fa\u7684\u6d4f\u89c8\u5668\u4e2d\u9a8c\u8bc1")
        print("  \u6216\u8005\u770b\u7ec8\u7aef\u4e2d\u663e\u793a\u7684\u9a8c\u8bc1\u7801\uff0c")
        print("  \u7528\u624b\u673a\u6253\u5f00 https://github.com/login/device \u8f93\u5165")
        print()
        run_interactive("gh auth login --web")
        print()

    out, err, code = run("gh auth status")
    if code != 0:
        print("  \u274c \u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5")
        print("  \u624b\u52a8\u8fd0\u884c: gh auth login --web")
        input()
        sys.exit(1)

print("  \u2705 \u5df2\u767b\u5f55")

# === Step 3: Create repo ===
print()
print("-" * 58)
print("  \u6b65\u9aa4 3/4: \u521b\u5efa\u4ed3\u5e93\u5e76\u63a8\u9001...")
out, _, _ = run("gh api user --jq .login")
USERNAME = out.strip()
print(f"  \u7528\u6237: {USERNAME}")

out, err, code = run(f"gh repo create {REPO_NAME} --public --source=. --push --description='Game Hub - \u6e38\u620f\u4e2d\u5fc3'")
if "already exists" in out+err or code != 0:
    print("  \u4ed3\u5e93\u5df2\u5b58\u5728\uff0c\u66f4\u65b0\u4ee3\u7801...")
    run(f"git remote add origin https://github.com/{USERNAME}/{REPO_NAME}.git 2>nul")
    out2, err2, code2 = run("git push -u origin master")
    if code2 != 0:
        print(f"  \u274c {err2}")
        input()
        sys.exit(1)
print("  \u2705 \u4ee3\u7801\u5df2\u63a8\u9001!")

# === Step 4: Enable Pages ===
print()
print("-" * 58)
print("  \u6b65\u9aa4 4/4: \u542f\u7528 GitHub Pages...")
token = run("gh auth token")[0]
api_url = f"https://api.github.com/repos/{USERNAME}/{REPO_NAME}/pages"
data = json.dumps({"source": {"branch": "master", "path": "/"}}).encode()
req = urllib.request.Request(api_url, data=data, method="POST")
req.add_header("Authorization", f"Bearer {token}")
req.add_header("Content-Type", "application/json")
req.add_header("Accept", "application/vnd.github+json")
try:
    urllib.request.urlopen(req)
    print("  \u2705 Pages \u5df2\u542f\u7528!")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    if "already" in body.lower():
        print("  \u2705 Pages \u5df2\u542f\u7528")
    else:
        print(f"  \u26a0\ufe0f API \u9519\u8bef, \u8bf7\u624b\u52a8\u542f\u7528:")
        print(f"  https://github.com/{USERNAME}/{REPO_NAME}/settings/pages")
        webbrowser.open(f"https://github.com/{USERNAME}/{REPO_NAME}/settings/pages")
        print("  \u9009 Branch: master, / (root), \u70b9 Save")

# === Done ===
url = f"https://{USERNAME}.github.io/{REPO_NAME}/"
print()
print("=" * 58)
print(f"  \U0001f389 \u90e8\u7f72\u5b8c\u6210!")
print(f"  \u7b49 1-2 \u5206\u949f\u540e\uff0c\u6253\u5f00:")
print(f"  \U0001f310 {url}")
print()
print(f"  \u4efb\u4f55\u8bbe\u5907\u90fd\u80fd\u8bbf\u95ee\uff0c\u7535\u8111\u5173\u673a\u4e5f\u4e0d\u5f71\u54cd")
print("=" * 58)
try: webbrowser.open(url)
except: pass
input("\n\u6309 Enter \u9000\u51fa...")
