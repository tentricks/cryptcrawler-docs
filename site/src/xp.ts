export type EventKind = "issue_closed" | "pr_merged" | "docs" | "quest";

export interface XpConfig
{
    baseXpPerStoryPoint : number;   // 25
    prMergeBonus: number;           // 0.2 -> 20%
    microCapPerDay: number;         // 60
    maxStreakMultiplier: number;    // 2.5 -> 250%
    levelA: number;                 // 100
    levelAlpha: number;             // 1.15   
};

export const DefaultXpConfig: XpConfig =
{
    baseXpPerStoryPoint: 25,
    prMergeBonus: 0.2,
    microCapPerDay: 60,
    maxStreakMultiplier: 2.5,
    levelA: 100,
    levelAlpha: 1.15
};

function streakMultiplier(streak: number, cfg = DefaultXpConfig)
{
    // Streak multiplier M
    // M(s) = 1 + 0.2 * streak^0.6
    const multiplier = 1 + 0.2 * Math.pow(Math.max(0, streak), 0.6);
    return Math.min(cfg.maxStreakMultiplier, multiplier);
}


interface XpEvent
{
    kind: EventKind;
    storyPoints?: number;
    flatXp?: number;
    closesIssue?: boolean;
}

function microXp(evt : XpEvent, multiplier : number, microXpAwardedToday : number, cfg = DefaultXpConfig)
{
    const base = Math.round((evt.flatXp ?? 10) * multiplier);
    const allowed = Math.max(0, cfg.microCapPerDay - microXpAwardedToday);
    return Math.min(base, allowed);
}

function xpForEvent(evt : XpEvent, streakDays: number, microXpAwardedToday: number, cfg = DefaultXpConfig)
{
    const multiplier = streakMultiplier(streakDays, cfg);

    // Micro-XP events
    if (evt.kind === "docs" || evt.kind === "quest")
        return microXp(evt, multiplier, microXpAwardedToday, cfg);

    // Issue/PR with story points
    const storyPoints = Math.max(0, (evt.storyPoints ?? 0));

    let bonus = 0;
    if (evt.kind === "pr_merged" && (evt.closesIssue ?? false))
        bonus += cfg.prMergeBonus;

    const raw = storyPoints * cfg.baseXpPerStoryPoint * (1 + bonus);
    return Math.round(raw * multiplier);
}

function requiredXpForLevel(level: number, cfg = DefaultXpConfig)
{
    // RequiredXP(level) = round( A * level^Alpha )
    // - where A is the base scaling factor proportional to the amount of required XP
    // - where Alpha defines how steep to requirement is in relation to the current level
    return Math.round(cfg.levelA * Math.pow(level, cfg.levelAlpha));
}

function cumulativeXpApprox(level: number, cfg = DefaultXpConfig)
{
    // Integral + small Euler–Maclaurin correction for better accuracy:
    // sum i^a ≈ ∫ x^a dx + 0.5*L^a
    const A = cfg.levelA, a = cfg.levelAlpha;
    if (level <= 0)
        return 0;

    // RequiredXP(level) = round( A * level^Alpha )
    // - where A is the base scaling factor proportional to the amount of required XP
    // - where Alpha defines how steep to requirement is in relation to the current level
    const main = (A / (a + 1)) * (Math.pow(level, a + 1) - 1);
    const em   = 0.5 * A * Math.pow(level, a);
    return main + em;
}

function levelFromTotalXpFast(totalXp: number, cfg = DefaultXpConfig)
{
    // Given the total accumulated XP,
    // - find the current level
    // - current XP into the level
    // - needed XP until the next level
    
    const A = cfg.levelA;
    const a = cfg.levelAlpha;
    
    // Invert the integral to get a starting guess near the true level.
    const L0 = Math.max(1, Math.floor(Math.pow(((totalXp * (a + 1)) / A) + 1, 1 / (a + 1))));

    // Back off a bit to be safely below, then compute an APPROX cumulative once.
    let level = Math.max(1, L0 - 3);
    let remaining = totalXp - cumulativeXpApprox(level - 1, cfg);

    // Now climb with exact per-level costs, but only a few steps.
    while (true)
    {
        const need = requiredXpForLevel(level, cfg);
        if (remaining < need)
        {
            return { level, intoLevelXP: Math.max(0, Math.floor(remaining)), levelNeed: need };
        }
        remaining -= need;
        level++;
    }
}

export function levelFromTotalXpBruteForce(totalXp: number, cfg = DefaultXpConfig)
{
    let level = 1;
    let remaining = totalXp;
    while (true)
    {
        const need = requiredXpForLevel(level, cfg);
        if (remaining < need)
            return { level, intoLevelXP: remaining, levelNeed: need };

        remaining -= need;
        level++;
    }
}

export function levelFromTotalXp(totalXp: number, cfg = DefaultXpConfig)
{
    if (cfg.levelAlpha > 0.5)
        return levelFromTotalXpFast(totalXp, cfg);
    else
        return levelFromTotalXpBruteForce(totalXp, cfg);
}
