import os
import shutil
import subprocess
import tempfile

SOURCE_BRANCH = "master"
DEPLOY_BRANCH = "deploy"
DEPLOY_REMOTE = "origin"
COMMIT_MESSAGE = "chore: sync docs from master to deploy"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO_URL = f"https://x-access-token:{GITHUB_TOKEN}@github.com/tentricks/cryptcrawler-docs.git"

# Paths
CURRENT_DIR = os.getcwd()
DOCS_SOURCE = os.path.join(CURRENT_DIR, "docs")

# 1. Create temp folder
with tempfile.TemporaryDirectory() as temp_dir:
    print(f"Cloning {DEPLOY_BRANCH} branch into temp folder...")
    subprocess.run(
        ["git", "clone", "--depth", "1", "--branch", DEPLOY_BRANCH, GITHUB_REPO_URL, temp_dir],
        check=True
    )

    deploy_docs_path = os.path.join(temp_dir, "docs")

    # 2. Clear old docs
    if os.path.exists(deploy_docs_path):
        shutil.rmtree(deploy_docs_path)
    os.makedirs(deploy_docs_path, exist_ok=True)

    # 3. Copy new docs
    print("Copying docs/ into deploy branch...")
    for item in os.listdir(DOCS_SOURCE):
        s = os.path.join(DOCS_SOURCE, item)
        d = os.path.join(deploy_docs_path, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        else:
            shutil.copy2(s, d)

    # 4. Commit and push
    print("Committing and pushing to deploy branch...")
    subprocess.run(["git", "config", "user.name", "github-actions"], cwd=temp_dir)
    subprocess.run(["git", "config", "user.email", "actions@github.com"], cwd=temp_dir)
    subprocess.run(["git", "add", "docs/"], cwd=temp_dir)
    result = subprocess.run(
        ["git", "commit", "-m", COMMIT_MESSAGE],
        cwd=temp_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    if "nothing to commit" in result.stdout.lower() + result.stderr.lower():
        print("No changes to commit — skipping push.")
    else:
        subprocess.run(["git", "push", DEPLOY_REMOTE, DEPLOY_BRANCH], cwd=temp_dir, check=True)

print("Sync complete.")
