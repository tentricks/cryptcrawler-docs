# scripts/generate_xp.py
import os, json, datetime, requests
from collections import defaultdict
from zoneinfo import ZoneInfo

OWNER = "tentricks"
REPO  = "cryptcrawler"
API   = "https://api.github.com/graphql"
TOKEN = os.environ["GITHUB_TOKEN"]

def q(query, variables):
    r = requests.post(API, json={"query": query, "variables": variables},
                      headers={"Authorization": f"Bearer {TOKEN}"})
    r.raise_for_status()
    return r.json()["data"]

def load_cfg(path="docs/generated/xp.config.json"):
    with open(path, "r") as f: return json.load(f)

def streak_multiplier(s, max_mult):
    # 1 + 0.2 * s^0.6, capped
    import math
    return min(max_mult, 1 + 0.2 * (s ** 0.6))

def xp_for_event(kind, sp, assignees, pr_closes, mult, cfg, micro_acc):
    if kind in ("docs", "quest"):
        base = round(cfg["docFlatXp"] * mult)
        allowed = max(0, cfg["microCapPerDay"] - micro_acc[0])
        g = min(base, allowed); micro_acc[0] += g; return g
    bonus = cfg["prMergeBonus"] if (kind=="pr_merged" and pr_closes) else 0.0
    per_sp = cfg["baseXpPerStoryPoint"] * (1.0 + bonus)
    return round((sp / max(1, assignees)) * per_sp * mult)

def required_xp(level, cfg):
    return round(cfg["levelA"] * (level ** cfg["levelAlpha"]))

def level_from_total(total, cfg):
    level, rem = 1, total
    while True:
        need = required_xp(level, cfg)
        if rem < need:
            return {"level": level, "intoLevelXP": rem, "levelNeed": need}
        rem -= need; level += 1

def main():
    cfg = load_cfg()
    tz  = ZoneInfo(cfg.get("timezone","UTC"))

    # 1) Resolve project number, fetch items (issues + fields + PRs as needed)
    #    (reuse your burndown GraphQL shape; add closedAt/mergedAt and assignees)
    #    For brevity, assume we produced a list of events:
    #    events = [{"date": "YYYY-MM-DD", "kind":"issue_closed","sp":3,"assignees":1,"pr_closes":False}, ...]
    events = []  # TODO: fill from GraphQL

    # 2) Aggregate by day
    by_day = defaultdict(list)
    for e in events:
        by_day[e["date"]].append(e)

    # 3) Walk days in order, compute streak + daily XP
    days = sorted(by_day.keys())
    streak = 0
    daily = {}
    ledger = []
    total = 0

    # micro “docs/chore” cap is per-day
    for d in days:
        micro_acc = [0]  # mutable box
        # streak counts days with any qualifying event
        had_event = len(by_day[d]) > 0
        streak = (streak + 1) if had_event else 0
        mult = streak_multiplier(streak, cfg["maxStreakMultiplier"])

        day_xp = 0
        for ev in by_day[d]:
            g = xp_for_event(ev["kind"], ev.get("sp",0), ev.get("assignees",1),
                             ev.get("pr_closes",False), mult, cfg, micro_acc)
            day_xp += g
            ledger.append({**ev, "xp": g})
        total += day_xp
        daily[d] = {"xp": day_xp, "streak": streak, "events": len(by_day[d])}

    # 4) Totals for bar
    lvl = level_from_total(total, cfg)

    os.makedirs("docs/generated", exist_ok=True)
    with open("docs/generated/xp_daily.json","w") as f: json.dump(daily, f, indent=2)
    with open("docs/generated/xp_total.json","w") as f: json.dump({"totalXp": total, **lvl}, f, indent=2)
    with open("docs/generated/xp_ledger.json","w") as f: json.dump(ledger, f, indent=2)

if __name__ == "__main__":
    main()
