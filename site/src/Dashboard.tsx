import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Flame,
    Swords,
    Trophy,
    Bolt,
    Search,
    PlusCircle,
    CheckCircle2,
    Clock3,
    Milestone,
    ListTodo,
    TrendingUp,
    Activity
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    BarChart,
    Bar
} from "recharts";
import { levelFromTotalXp } from "./xp";

// NOTE: This is a standalone draft UI meant for quick iteration.
// - Uses Tailwind classes for styling
// - No external design system to keep it portable
// - Replace mock data with real data sources later
// - Allman style braces per user preference

// ---------------------------
// Helpers
// ---------------------------
function cls(...xs)
{
    return xs.filter(Boolean).join(" ");
}

// ---------------------------
// Mock Data
// ---------------------------
const MOCK_PROJECTS = [
    { id: "cryptcrawler", name: "CryptCrawler", color: "from-purple-500 to-violet-600" },
    { id: "sandbox", name: "Sandbox", color: "from-emerald-500 to-teal-600" },
    { id: "crownless", name: "Crownless", color: "from-amber-500 to-orange-600" }
];

const MOCK_ACTIVITY = [
    { id: 1, type: "commit", title: "Refactor: extract burndown calc", when: "2h ago", xp: 12 },
    { id: 2, type: "issue_closed", title: "Close: #42 quest progress chart", when: "5h ago", xp: 25 },
    { id: 3, type: "docs", title: "Update: docs/roadmap", when: "1d ago", xp: 8 },
    { id: 4, type: "release", title: "Tagged v0.3.1", when: "2d ago", xp: 50 }
];

const XP_SERIES = [
    { day: "Mon", xp: 30, issues: 1 },
    { day: "Tue", xp: 60, issues: 2 },
    { day: "Wed", xp: 10, issues: 0 },
    { day: "Thu", xp: 80, issues: 3 },
    { day: "Fri", xp: 35, issues: 1 },
    { day: "Sat", xp: 120, issues: 4 },
    { day: "Sun", xp: 90, issues: 2 }
];

const MOCK_QUESTS = [
    { id: "q1", title: "Ship sprint notes to docs site", reward: 15, eta: "Today" },
    { id: "q2", title: "Close 3 small issues", reward: 20, eta: "Today" },
    { id: "q3", title: "Prototype XP pipeline from GitHub", reward: 30, eta: "This week" }
];

const MOCK_MILESTONES = [
    { id: "m1", title: "MVP Docs Dashboard", progress: 65, icon: Milestone },
    { id: "m2", title: "Burndown v2 GraphQL", progress: 40, icon: TrendingUp },
    { id: "m3", title: "Public Demo", progress: 15, icon: Trophy }
];

// ---------------------------
// Main Component
// ---------------------------
const BURNDOWN_URL = (import.meta as any).env?.VITE_BURNDOWN_URL ?? "/generated/burndown.png"; // configurable via env, defaults to /generated/burndown.png

// ---------------------------
export default function GamifiedTrackerDashboard()
{
    const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);
    const [query, setQuery] = useState("");
    const [quests, setQuests] = useState(MOCK_QUESTS.map(q => ({ ...q, done: false })));
    const [streak, setStreak] = useState<number>(5); // days in a row
    const totalXP = useMemo(() => 2480, []);

    const lv = useMemo(() => levelFromTotalXp(totalXP), [totalXP]);
    const xpProgressPct = Math.max(0, Math.min(100, Math.round((lv.intoLevelXP / lv.levelNeed) * 100)));
    const xpToNext = lv.levelNeed - lv.intoLevelXP;

    function toggleQuest(id: string)
    {
        setQuests(prev => prev.map(q => q.id === id ? { ...q, done: !q.done } : q));
    }

    const filteredActivity = useMemo(() =>
    {
        if (!query.trim()) return MOCK_ACTIVITY;
        return MOCK_ACTIVITY.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));
    }, [query]);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            {/* Header */}
            <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60 border-b border-zinc-800">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-4">
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 shadow-lg shadow-fuchsia-900/40">
                            <Swords className="h-5 w-5" />
                        </span>
                        <div>
                            <div className="text-sm text-zinc-400">Project</div>
                            <div className="font-semibold">{activeProject.name}</div>
                        </div>
                    </motion.div>

                    <div className="ml-auto w-full sm:w-96">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Search activity, quests, milestones..."
                            />
                        </div>
                        
                        
                    </div>
                </div>
            </header>

            {/* Hero / XP and Streak */}
            <section className="mx-auto max-w-7xl px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className={cls(
                            "relative overflow-hidden rounded-2xl border border-zinc-800 p-5",
                            "bg-gradient-to-br",
                            activeProject.color
                        )}
                    >
                        <div className="relative z-10 flex items-center gap-3">
                            <Flame className="h-5 w-5" />
                            <div className="text-sm/5">Level</div>
                            <div className="font-bold text-lg">{lv.level}</div>
                            <div className="ml-auto text-sm/5">{xpToNext} XP to next</div>
                        </div>
                        <div className="relative z-10 mt-3 h-3 w-full rounded-full bg-white/20">
                            <div className="h-3 rounded-full bg-white" style={{ width: `${xpProgressPct}%` }} />
                        </div>
                        <div className="relative z-10 mt-2 text-xs/4 opacity-90">{lv.intoLevelXP} / {lv.levelNeed} XP</div>
                        <div className="absolute -right-8 -bottom-10 opacity-20 scale-[160%]">
                            <Trophy className="h-24 w-24" />
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="rounded-2xl border border-zinc-800 p-5 bg-zinc-900/40"
                    >
                        <div className="flex items-center gap-2">
                            <Bolt className="h-5 w-5 text-amber-400" />
                            <div className="font-semibold">Hype / Combo</div>
                            <span className="ml-auto text-xs text-zinc-400">Daily streak</span>
                        </div>
                        <div className="mt-2 flex items-end gap-3">
                            <div className="text-4xl font-black tracking-tight">{streak}×</div>
                            <button
                                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-xs"
                                onClick={() => setStreak(s => Math.max(0, s + 1))}
                            >
                                <PlusCircle className="h-4 w-4" /> Nudge
                            </button>
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-zinc-800">
                            <div className="h-2 rounded-full bg-amber-400" style={{ width: `${Math.min(100, streak * 12.5)}%` }} />
                        </div>
                        <div className="mt-2 text-xs text-zinc-400">Keep a streak to boost XP gains.</div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="rounded-2xl border border-zinc-800 p-5 bg-zinc-900/40"
                    >
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-sky-400" />
                            <div className="font-semibold">Velocity</div>
                            <span className="ml-auto text-xs text-zinc-400">XP & Issues (7d)</span>
                        </div>
                        <div className="mt-3 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={XP_SERIES} margin={{ top: 5, right: 12, left: -16, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12 }} labelStyle={{ color: "#e4e4e7" }} />
                                    <Line type="monotone" dataKey="xp" stroke="#a78bfa" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="issues" stroke="#34d399" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Milestones */}
            <section className="mx-auto max-w-7xl px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {MOCK_MILESTONES.map((m, idx) =>
                    {
                        const Icon = m.icon;
                        return (
                            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }}
                                className="rounded-2xl border border-zinc-800 p-5 bg-zinc-900/40"
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-indigo-400" />
                                    <div className="font-semibold">{m.title}</div>
                                    <span className="ml-auto text-xs text-zinc-400">Milestone</span>
                                </div>
                                <div className="mt-3 h-2 w-full rounded-full bg-zinc-800">
                                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${m.progress}%` }} />
                                </div>
                                <div className="mt-2 text-xs text-zinc-400">{m.progress}% complete</div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Quests + Activity */}
            {/* Burndown (image) */}
            <section className="mx-auto max-w-7xl px-4 py-6">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-5 w-5 text-rose-400" />
                        <div className="font-semibold">Story Points Burndown</div>
                        <span className="ml-auto text-xs text-zinc-400">from CI</span>
                    </div>
                    <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
                        <img src={BURNDOWN_URL} alt="Story points burndown" className="w-full h-auto" />
                    </div>
                </div>
            </section>

            {/* Quests + Activity */}
            <section className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Quests */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                    <div className="p-5 border-b border-zinc-800 flex items-center gap-3">
                        <ListTodo className="h-5 w-5 text-emerald-400" />
                        <div className="font-semibold">Daily Quests</div>
                        <span className="ml-auto text-xs text-zinc-400">Auto-resets 00:00</span>
                    </div>
                    <ul className="divide-y divide-zinc-800">
                        {quests.map(q => (
                            <li key={q.id} className="px-5 py-4 flex items-center gap-3">
                                <button
                                    className={cls(
                                        "h-5 w-5 rounded-md border flex items-center justify-center",
                                        q.done ? "bg-emerald-500 border-emerald-500" : "border-zinc-700"
                                    )}
                                    onClick={() => toggleQuest(q.id)}
                                >
                                    {q.done ? <CheckCircle2 className="h-4 w-4 text-white" /> : null}
                                </button>
                                <div className={cls("text-sm", q.done ? "line-through text-zinc-500" : "")}>{q.title}</div>
                                <span className="ml-auto text-xs text-zinc-400">{q.eta}</span>
                                <span className="ml-3 inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-2 py-1 text-xs">
                                    <Bolt className="h-3 w-3" /> +{q.reward} XP
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="p-5 border-t border-zinc-800 text-xs text-zinc-400">
                        Tip: Mark all quests done for a small streak bonus.
                    </div>
                </motion.div>

                {/* Activity Feed */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
                    <div className="p-5 border-b border-zinc-800 flex items-center gap-3">
                        <Clock3 className="h-5 w-5 text-pink-400" />
                        <div className="font-semibold">Recent Activity</div>
                    </div>
                    <ul className="divide-y divide-zinc-800">
                        {filteredActivity.map(a => (
                            <li key={a.id} className="px-5 py-4">
                                <div className="text-sm font-medium">{a.title}</div>
                                <div className="mt-0.5 text-xs text-zinc-400 flex items-center gap-2">
                                    <span>{a.when}</span>
                                    <span className="inline-flex items-center gap-1">
                                        <Bolt className="h-3 w-3" /> +{a.xp} XP
                                    </span>
                                </div>
                            </li>
                        ))}
                        {filteredActivity.length === 0 && (
                            <li className="px-5 py-6 text-sm text-zinc-400">No matching activity.</li>
                        )}
                    </ul>
                </motion.div>
            </section>

            {/* Backlog / Kanban (Preview) */}
            <section className="mx-auto max-w-7xl px-4 pb-10">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <Swords className="h-5 w-5 text-fuchsia-400" />
                        <div className="font-semibold">Quest Log (Backlog Preview)</div>
                        <span className="ml-auto text-xs text-zinc-400">Drag-and-drop TODO (future)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { title: "To Do", hint: "Gather materials", items: ["Connect GitHub GraphQL", "XP mapping rules", "Design settings pane"] },
                            { title: "Doing", hint: "Craft the blade", items: ["Dashboard layout polish", "Activity filter bar"] },
                            { title: "Done", hint: "Claim rewards", items: ["Burndown image pipeline", "Docs site domain"] }
                        ].map((col) => (
                            <div key={col.title} className="rounded-xl border border-zinc-800 bg-zinc-950/60">
                                <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                                    <span className="text-xs text-zinc-400">{col.hint}</span>
                                    <div className="ml-auto font-semibold">{col.title}</div>
                                </div>
                                <ul className="p-3 space-y-2">
                                    {col.items.map(it => (
                                        <li key={it} className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm">
                                            {it}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                    <span>© {new Date().getFullYear()} Project Tracker</span>
                    <span className="mx-2">•</span>
                    <a className="underline underline-offset-4" href="#" onClick={(e) => e.preventDefault()}>Settings</a>
                    <span className="mx-2">•</span>
                    <a className="underline underline-offset-4" href="#" onClick={(e) => e.preventDefault()}>About</a>
                </div>
            </footer>
        </div>
    );
}
