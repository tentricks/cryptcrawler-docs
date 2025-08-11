import os
import requests
import json
from datetime import datetime
import matplotlib.pyplot as plt

OWNER = "tentricks"
REPO = "cryptcrawler"
PROJECT_TITLE = "CryptCrawler Quest Log"
SIZE_FIELD_NAME = "Size"
OUTPUT_DIR = "docs/generated/"

SIZE_POINTS = {
    "XS": 1,
    "S": 2,
    "M": 3,
    "L": 5,
    "XL": 8
}

TOKEN = os.getenv("GITHUB_TOKEN")
if not TOKEN:
    raise RuntimeError("GITHUB_TOKEN environment variable not set.")

HEADERS = {"Authorization": f"Bearer {TOKEN}"}
API_URL = "https://api.github.com/graphql"


def graphql_query(query, variables={}):
    response = requests.post(API_URL, json={"query": query, "variables": variables}, headers=HEADERS)
    response.raise_for_status()
    return response.json()


# Step 1: Get project number by title
query_project_number = """
query ($owner: String!, $repo: String!) {
  repository(owner: $owner, name: $repo) {
    projectsV2(first: 10) {
      nodes {
        number
        title
      }
    }
  }
}
"""

result = graphql_query(query_project_number, {"owner": OWNER, "repo": REPO})
projects = result["data"]["repository"]["projectsV2"]["nodes"]
project_number = next((p["number"] for p in projects if p["title"] == PROJECT_TITLE), None)

if project_number is None:
    raise RuntimeError("Project title not found.")

# Step 2: Query issues and sizes
query_issues = """
query ($owner: String!, $repo: String!, $project: Int!) {
  repository(owner: $owner, name: $repo) {
    projectV2(number: $project) {
      items(first: 100) {
        nodes {
          content {
            ... on Issue {
              number
              title
              state
            }
          }
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field {
                  ... on ProjectV2SingleSelectField {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
"""

data = graphql_query(query_issues, {"owner": OWNER, "repo": REPO, "project": project_number})
items = data["data"]["repository"]["projectV2"]["items"]["nodes"]

total_points = 0
remaining_points = 0

for item in items:
    content = item["content"]
    if content is None:
        continue

    fields = item["fieldValues"]["nodes"]
    size_value = next((f["name"] for f in fields if f.get("field", {}).get("name") == SIZE_FIELD_NAME), None)

    if size_value not in SIZE_POINTS:
        continue

    points = SIZE_POINTS[size_value]
    total_points += points
    if content["state"] == "OPEN":
        remaining_points += points

print(f"Remaining: {remaining_points} / Total: {total_points}")

# Step 3: Update JSON log
timestamp = datetime.utcnow().strftime("%Y-%m-%d")

log_path = os.path.join(OUTPUT_DIR, "burndown_log.json")
if os.path.exists(log_path):
    with open(log_path, "r") as f:
        log = json.load(f)
else:
    log = {}

log[timestamp] = {
    "remaining": remaining_points,
    "total": total_points
}

os.makedirs(OUTPUT_DIR, exist_ok=True)
with open(log_path, "w") as f:
    json.dump(log, f, indent=2)


# Step 4: Generate PNG chart
dates = sorted(log.keys())
remaining_values = [log[d]["remaining"] for d in dates]
total_values = [log[d]["total"] for d in dates]

plt.figure(figsize=(10, 6))
plt.plot(dates, total_values, label="Total", linestyle="--", color="#888")
plt.plot(dates, remaining_values, label="Remaining", marker="o", color="#0cf")
plt.title("CryptCrawler Burndown Chart")
plt.xlabel("Date")
plt.ylabel("Story Points")
plt.xticks(rotation=45)
plt.grid(True, linestyle="--", alpha=0.3)
plt.legend()
plt.tight_layout()

burndown_output_path = os.path.join(OUTPUT_DIR, "burndown.png")
plt.savefig(burndown_output_path)

print("Burndown data generated at: " + burndown_output_path)