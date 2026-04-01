import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// DEVGROWTH — Interactive Mobile Prototype v2
// Aesthetic: "Terminal Luxury"
// Refined teal accent · Custom SVG icons · Real skill tree
// ─────────────────────────────────────────────

const SCREENS = {
  ONBOARD_1: "onboard_1",
  ONBOARD_2: "onboard_2",
  ONBOARD_3: "onboard_3",
  TODAY: "today",
  ENTRY: "entry",
  REVIEW: "review",
  REVIEW_SCORE: "review_score",
  JOURNEY: "journey",
  SKILLS: "skills",
  LIBRARY: "library",
  PROFILE: "profile",
  PAYWALL: "paywall",
};

const TAB_SCREENS = [SCREENS.TODAY, SCREENS.JOURNEY, SCREENS.SKILLS, SCREENS.LIBRARY];

const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

const styleEl = document.createElement("style");
styleEl.textContent = `
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulseGlow { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
  @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
  @keyframes streakPulse { 0%, 100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.05); filter: brightness(1.2); } }
  @keyframes nodeGlow { 0%, 100% { box-shadow: 0 0 8px var(--glow-color); } 50% { box-shadow: 0 0 16px var(--glow-color); } }
  @keyframes ringReveal { from { stroke-dashoffset: 440; } to { stroke-dashoffset: var(--target-offset); } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 0; height: 0; }
  input, textarea { font-family: 'DM Sans', sans-serif; }
`;
document.head.appendChild(styleEl);

// ─── Color Palette (Teal accent) ───
const C = {
  bg: "#080B11",
  bgGrad: "linear-gradient(180deg, #080B11 0%, #0D1117 100%)",
  surface: "#111820",
  surfaceRaised: "#161D28",
  surfaceHover: "#1C2433",
  border: "#1E2736",
  borderLight: "#263042",
  text: "#E2E8F0",
  textSoft: "#94A3B8",
  textMuted: "#64748B",
  textDim: "#475569",
  // Primary: Electric Teal
  teal: "#2DD4BF",
  tealBright: "#5EEAD4",
  tealDim: "#0F766E",
  tealGlow: "rgba(45, 212, 191, 0.08)",
  tealGlow2: "rgba(45, 212, 191, 0.15)",
  // Amber: Streaks
  amber: "#FBBF24",
  amberDim: "#92400E",
  amberGlow: "rgba(251, 191, 36, 0.1)",
  // Blue: AI
  blue: "#38BDF8",
  blueDim: "#0C4A6E",
  blueGlow: "rgba(56, 189, 248, 0.08)",
  // Purple: Mastery
  purple: "#A78BFA",
  purpleDim: "#4C1D95",
  purpleGlow: "rgba(167, 139, 250, 0.08)",
  // Rose: Alerts / low
  rose: "#FB7185",
  roseGlow: "rgba(251, 113, 133, 0.1)",
};

const mono = "'JetBrains Mono', monospace";
const sans = "'DM Sans', sans-serif";
const anim = (delay = 0) => ({ animation: `fadeUp 0.5s ease ${delay}s both` });
const gridBg = `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23ffffff' stroke-opacity='0.025' stroke-width='0.5'/%3E%3C/svg%3E")`;

// ─────────────────────────────────────────────
// CUSTOM SVG ICONS (no emoji)
// ─────────────────────────────────────────────
const Icons = {
  // App logo
  logo: (sz = 32, clr = C.teal) => (
    <svg width={sz} height={sz} viewBox="0 0 32 32" fill="none">
      <path d="M8 8h4v4H8zM14 8h4v4h-4zM20 8h4v4h-4zM8 14h4v4H8zM20 14h4v4h-4zM8 20h4v4H8zM14 20h4v4h-4zM20 20h4v4h-4z" fill={clr} opacity="0.3"/>
      <path d="M14 14h4v4h-4z" fill={clr}/>
      <path d="M6 6l20 0v20H6z" stroke={clr} strokeWidth="1.5" fill="none" rx="2"/>
    </svg>
  ),
  // Tab icons
  tabToday: (sz = 22, clr = C.textDim) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3"/><line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="9" y1="2" x2="9" y2="6"/><line x1="15" y1="2" x2="15" y2="6"/>
      <circle cx="12" cy="15" r="1.5" fill={clr} stroke="none"/>
    </svg>
  ),
  tabJourney: (sz = 22, clr = C.textDim) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 20V4M12 4l-5 5M12 4l5 5"/><circle cx="12" cy="20" r="1.5" fill={clr} stroke="none"/>
    </svg>
  ),
  tabSkills: (sz = 22, clr = C.textDim) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2L3 7l9 5 9-5-9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/>
    </svg>
  ),
  tabLibrary: (sz = 22, clr = C.textDim) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      <line x1="9" y1="7" x2="16" y2="7"/><line x1="9" y1="11" x2="14" y2="11"/>
    </svg>
  ),
  // Content icons
  fire: (sz = 20, clr = C.amber) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8 7 4 10 4 14a8 8 0 0016 0c0-4-4-7-8-12z" fill={clr} opacity="0.2" stroke={clr} strokeWidth="1.5"/>
      <path d="M12 9c-2 3-4 4.5-4 7a4 4 0 008 0c0-2.5-2-4-4-7z" fill={clr} opacity="0.5"/>
    </svg>
  ),
  check: (sz = 12, clr = C.teal) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (sz = 10, clr = C.rose) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  plus: (sz = 18, clr = C.bg) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  arrowLeft: (sz = 16, clr = "currentColor") => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round">
      <path d="M19 12H5M5 12l6-6M5 12l6 6"/>
    </svg>
  ),
  arrowUp: (sz = 10, clr = C.bg) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="3" strokeLinecap="round">
      <path d="M12 20V4M12 4l-5 5M12 4l5 5"/>
    </svg>
  ),
  chat: (sz = 16, clr = C.blue) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
    </svg>
  ),
  bookmark: (sz = 16, clr = C.amber) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill={clr} stroke={clr} strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
  ),
  star: (sz = 20, clr = C.amber) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill={clr} opacity="0.9">
      <polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5"/>
    </svg>
  ),
  zap: (sz = 20, clr = C.teal) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  trophy: (sz = 20, clr = C.amber) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 9H4a2 2 0 01-2-2V5h4M18 9h2a2 2 0 002-2V5h-4"/>
      <path d="M6 5h12v5a6 6 0 01-12 0V5z"/><path d="M12 16v3M8 22h8M8 19h8"/>
    </svg>
  ),
  target: (sz = 20, clr = C.blue) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  book: (sz = 16, clr = C.purple) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  ),
  film: (sz = 16, clr = C.purple) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
      <line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/>
      <line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/>
    </svg>
  ),
  fileText: (sz = 16, clr = C.blue) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  code: (sz = 16, clr = C.teal) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  graduation: (sz = 16, clr = C.purple) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <path d="M22 10l-10-6L2 10l10 6 10-6z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  // Skill branch icons
  branchLang: (sz = 14, clr = C.blue) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  branchFramework: (sz = 14, clr = C.purple) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  branchDevops: (sz = 14, clr = C.teal) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  branchDB: (sz = 14, clr = C.amber) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  lock: (sz = 14, clr = C.rose) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  pencil: (sz = 20, clr = C.text) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
  ),
  shield: (sz = 20, clr = C.purple) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  seed: (sz = 20, clr = C.teal) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 22V12M12 12C12 7 7 2 2 2c0 5 5 10 10 10zM12 12c0-5 5-10 10-10 0 5-5 10-10 10z"/>
    </svg>
  ),
  diamond: (sz = 20, clr = C.blue) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 3 18 3 22 9 12 22 2 9"/>
    </svg>
  ),
};


// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function DevGrowthPrototype() {
  const [screen, setScreen] = useState(SCREENS.ONBOARD_1);
  const [screenKey, setScreenKey] = useState(0);
  const navigate = useCallback((s) => { setScreen(s); setScreenKey(k => k + 1); }, []);
  const isTabScreen = TAB_SCREENS.includes(screen);
  const activeTab = TAB_SCREENS.indexOf(screen);

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh",
      background: "#04060A", backgroundImage: gridBg, fontFamily: sans, padding: "20px 20px 80px",
    }}>
      <div style={{
        width: 390, height: 844, background: C.bg, borderRadius: 44,
        border: `1px solid ${C.border}`, overflow: "hidden", position: "relative",
        boxShadow: `0 0 0 1px ${C.border}, 0 25px 80px rgba(0,0,0,0.6), 0 0 120px rgba(45, 212, 191, 0.03)`,
      }}>
        {/* Status Bar */}
        <div style={{
          height: 54, display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          padding: "0 28px 8px", fontSize: 13, fontWeight: 600, fontFamily: mono,
          color: C.textSoft, letterSpacing: "-0.02em", position: "relative", zIndex: 10,
        }}>
          <span>9:41</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 16, height: 10, border: `1.5px solid ${C.textSoft}`, borderRadius: 2, position: "relative" }}>
              <div style={{ position: "absolute", top: 1.5, left: 1.5, right: 3, bottom: 1.5, background: C.textSoft, borderRadius: 0.5 }}/>
              <div style={{ position: "absolute", right: -3, top: 3, width: 1.5, height: 4, background: C.textSoft, borderRadius: "0 1px 1px 0" }}/>
            </div>
          </div>
        </div>

        <div key={screenKey} style={{
          height: isTabScreen ? "calc(100% - 54px - 72px)" : "calc(100% - 54px)",
          overflowY: "auto", overflowX: "hidden", position: "relative",
        }}>
          {screen === SCREENS.ONBOARD_1 && <Onboard1 navigate={navigate} />}
          {screen === SCREENS.ONBOARD_2 && <Onboard2 navigate={navigate} />}
          {screen === SCREENS.ONBOARD_3 && <Onboard3 navigate={navigate} />}
          {screen === SCREENS.TODAY && <TodayScreen navigate={navigate} />}
          {screen === SCREENS.ENTRY && <EntryScreen navigate={navigate} />}
          {screen === SCREENS.REVIEW && <ReviewScreen navigate={navigate} />}
          {screen === SCREENS.REVIEW_SCORE && <ReviewScoreScreen navigate={navigate} />}
          {screen === SCREENS.JOURNEY && <JourneyScreen navigate={navigate} />}
          {screen === SCREENS.SKILLS && <SkillsScreen navigate={navigate} />}
          {screen === SCREENS.LIBRARY && <LibraryScreen navigate={navigate} />}
          {screen === SCREENS.PROFILE && <ProfileScreen navigate={navigate} />}
          {screen === SCREENS.PAYWALL && <PaywallScreen navigate={navigate} />}
        </div>

        {isTabScreen && <TabBar activeTab={activeTab} navigate={navigate} />}
      </div>

      {/* Screen Nav */}
      <div style={{
        position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", maxWidth: 620, zIndex: 100,
      }}>
        {Object.entries({
          "Onboarding": SCREENS.ONBOARD_1, "Today": SCREENS.TODAY, "New Entry": SCREENS.ENTRY,
          "AI Review": SCREENS.REVIEW, "Score": SCREENS.REVIEW_SCORE, "Journey": SCREENS.JOURNEY,
          "Skills": SCREENS.SKILLS, "Library": SCREENS.LIBRARY, "Profile": SCREENS.PROFILE, "Paywall": SCREENS.PAYWALL,
        }).map(([label, s]) => (
          <button key={s} onClick={() => navigate(s)} style={{
            padding: "5px 10px", fontSize: 10, fontFamily: mono, fontWeight: 500,
            background: screen === s ? C.teal : C.surface, color: screen === s ? C.bg : C.textMuted,
            border: `1px solid ${screen === s ? C.teal : C.border}`, borderRadius: 6, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

// ─── TAB BAR ───
function TabBar({ activeTab, navigate }) {
  const tabs = [
    { label: "Today", screen: SCREENS.TODAY, icon: Icons.tabToday },
    { label: "Journey", screen: SCREENS.JOURNEY, icon: Icons.tabJourney },
    { label: "Skills", screen: SCREENS.SKILLS, icon: Icons.tabSkills },
    { label: "Library", screen: SCREENS.LIBRARY, icon: Icons.tabLibrary },
  ];
  return (
    <div style={{ height: 72, display: "flex", alignItems: "flex-start", paddingTop: 10, background: C.surface, borderTop: `1px solid ${C.border}` }}>
      {tabs.map((tab, i) => {
        const active = i === activeTab;
        return (
          <button key={tab.label} onClick={() => navigate(tab.screen)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 4, background: "none", border: "none", cursor: "pointer", position: "relative",
          }}>
            {active && <div style={{ position: "absolute", top: -10, width: 20, height: 2, background: C.teal, borderRadius: 1, boxShadow: `0 0 8px ${C.teal}` }}/>}
            {tab.icon(22, active ? C.teal : C.textDim)}
            <span style={{ fontSize: 10, fontFamily: mono, fontWeight: 500, color: active ? C.teal : C.textDim, letterSpacing: "0.05em", textTransform: "uppercase" }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── SHARED COMPONENTS ───
function ScreenHeader({ title, subtitle, right }) {
  return (
    <div style={{ padding: "4px 24px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, fontFamily: mono, color: C.textMuted, marginTop: 2 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function Card({ children, style, glow }) {
  return (
    <div style={{
      background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20,
      position: "relative", overflow: "hidden",
      ...(glow ? { boxShadow: `0 0 30px ${glow}`, borderColor: glow.replace("0.08", "0.2").replace("0.1", "0.25") } : {}),
      ...style,
    }}>{children}</div>
  );
}

function Badge({ text, color = C.teal }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 8px", fontSize: 10,
      fontFamily: mono, fontWeight: 600, color, background: color + "18", borderRadius: 6,
      letterSpacing: "0.04em", textTransform: "uppercase",
    }}>{text}</span>
  );
}

function ProgressBar({ value, max, color = C.teal, height = 4 }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ width: "100%", height, background: C.border, borderRadius: height, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`,
        borderRadius: height, transition: "width 1s ease", boxShadow: `0 0 8px ${color}40`,
      }}/>
    </div>
  );
}

function BackButton({ onClick, label = "Back" }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
      cursor: "pointer", color: C.textMuted, fontSize: 13, fontFamily: mono, padding: "8px 24px",
    }}>{Icons.arrowLeft(16, C.textMuted)} {label}</button>
  );
}

function AvatarButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, ${C.tealDim}, ${C.purpleDim})`,
      border: `1.5px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, color: C.teal, fontWeight: 700, fontFamily: mono,
    }}>D</button>
  );
}

// ─────────────────────────────────────────────
// ONBOARDING
// ─────────────────────────────────────────────
function Onboard1({ navigate }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 32, background: C.bgGrad, backgroundImage: gridBg, position: "relative" }}>
      <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${C.tealGlow2} 0%, transparent 70%)`, animation: "float 4s ease-in-out infinite" }}/>
      <div style={{ ...anim(0.1), textAlign: "center", marginBottom: 40 }}>
        <div style={{
          width: 80, height: 80, margin: "0 auto 24px", borderRadius: 20,
          background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceRaised})`,
          border: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 40px ${C.tealGlow}`, position: "relative",
        }}>
          {Icons.logo(40, C.teal)}
          <div style={{
            position: "absolute", bottom: -3, right: -3, width: 20, height: 20, borderRadius: 6,
            background: C.teal, display: "flex", alignItems: "center", justifyContent: "center",
          }}>{Icons.arrowUp(10, C.bg)}</div>
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1 }}>DevGrowth</h1>
        <p style={{ fontSize: 13, fontFamily: mono, color: C.textMuted, marginTop: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>review your moves. level up.</p>
      </div>
      <div style={anim(0.3)}>
        <p style={{ fontSize: 16, color: C.textSoft, lineHeight: 1.6, textAlign: "center", maxWidth: 280, margin: "0 auto 40px" }}>
          A chess engine for your coding day. Log what you built, let AI review your moves, and watch your skills level up.
        </p>
      </div>
      <div style={{ ...anim(0.5), display: "flex", flexDirection: "column", gap: 12 }}>
        <button onClick={() => navigate(SCREENS.ONBOARD_2)} style={{
          width: "100%", padding: "16px", background: C.teal, color: C.bg, border: "none",
          borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 20px ${C.teal}30`,
        }}>Start your first review →</button>
        <p style={{ textAlign: "center", fontSize: 11, fontFamily: mono, color: C.textDim }}>14-day full access · no card required</p>
      </div>
    </div>
  );
}

function Onboard2({ navigate }) {
  const steps = [
    { icon: () => Icons.pencil(22, C.text), label: "Log your day", desc: "2 min structured entry", color: C.text },
    { icon: () => Icons.chat(22, C.blue), label: "AI reviews your moves", desc: "Contextual follow-up questions", color: C.blue },
    { icon: () => Icons.zap(22, C.teal), label: "Skills level up", desc: "XP based on reflection depth", color: C.teal },
    { icon: () => Icons.book(22, C.purple), label: "Study recommendations", desc: "Curated resources for your gaps", color: C.purple },
  ];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: 32, paddingTop: 20 }}>
      <p style={{ fontSize: 11, fontFamily: mono, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, ...anim(0) }}>How it works</p>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 40, ...anim(0.05) }}>
        Your daily game review,<br/><span style={{ color: C.teal }}>in 5 minutes</span>
      </h2>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", ...anim(0.1 + i * 0.08) }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>{step.icon()}</div>
            <div style={{ paddingTop: 2 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: step.color }}>{step.label}</p>
              <p style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => navigate(SCREENS.ONBOARD_3)} style={{
        width: "100%", padding: "16px", background: C.teal, color: C.bg, border: "none",
        borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 32, ...anim(0.5),
      }}>Next →</button>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: C.textDim }}/><div style={{ width: 20, height: 6, borderRadius: 3, background: C.teal }}/><div style={{ width: 6, height: 6, borderRadius: 3, background: C.textDim }}/>
      </div>
    </div>
  );
}

function Onboard3({ navigate }) {
  const [selected, setSelected] = useState([]);
  const skills = ["JavaScript", "Python", "React", "Node.js", "SQL", "Docker", "TypeScript", "Git", "CSS", "AWS", "Go", "Rust"];
  const toggle = (s) => setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: 32, paddingTop: 20 }}>
      <p style={{ fontSize: 11, fontFamily: mono, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, ...anim(0) }}>Personalize</p>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 8, ...anim(0.05) }}>
        What are you<br/><span style={{ color: C.purple }}>working with?</span>
      </h2>
      <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 32, ...anim(0.1) }}>Pick a few. We'll track these from day one.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, ...anim(0.15) }}>
        {skills.map((s) => {
          const active = selected.includes(s);
          return (<button key={s} onClick={() => toggle(s)} style={{
            padding: "9px 16px", fontSize: 13, fontFamily: mono, fontWeight: 500,
            color: active ? C.bg : C.textSoft, background: active ? C.teal : C.surface,
            border: `1px solid ${active ? C.teal : C.border}`, borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
          }}>{s}</button>);
        })}
      </div>
      <div style={{ flex: 1 }}/>
      <button onClick={() => navigate(SCREENS.TODAY)} style={{
        width: "100%", padding: "16px", background: selected.length > 0 ? C.teal : C.surfaceRaised,
        color: selected.length > 0 ? C.bg : C.textDim, border: `1px solid ${selected.length > 0 ? C.teal : C.border}`,
        borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.3s", ...anim(0.3),
      }}>{selected.length > 0 ? `Let's go (${selected.length} skills) →` : "Select at least one"}</button>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: C.textDim }}/><div style={{ width: 6, height: 6, borderRadius: 3, background: C.textDim }}/><div style={{ width: 20, height: 6, borderRadius: 3, background: C.teal }}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TODAY
// ─────────────────────────────────────────────
function TodayScreen({ navigate }) {
  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "4px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={anim(0)}>
          <p style={{ fontSize: 12, fontFamily: mono, color: C.textDim, letterSpacing: "0.06em", textTransform: "uppercase" }}>Monday, Mar 30</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", marginTop: 2 }}>Good evening</h1>
        </div>
        <div style={anim(0.05)}><AvatarButton onClick={() => navigate(SCREENS.PROFILE)} /></div>
      </div>

      {/* Streak */}
      <div style={{ padding: "16px 24px", ...anim(0.08) }}>
        <Card glow={C.amberGlow}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", animation: "streakPulse 2s ease infinite" }}>{Icons.fire(28, C.amber)}</span>
                <span style={{ fontSize: 28, fontWeight: 700, fontFamily: mono, color: C.amber }}>12</span>
                <span style={{ fontSize: 13, color: C.textMuted, fontFamily: mono }}>day streak</span>
              </div>
              <p style={{ fontSize: 12, color: C.textDim, marginTop: 6, fontFamily: mono }}>Longest: 18 days · 1 save left</p>
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <div key={i} style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: i < 5 ? C.amber + "30" : "transparent",
                  border: `1px solid ${i < 5 ? C.amber + "40" : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontFamily: mono, color: i < 5 ? C.amber : C.textDim, fontWeight: 600,
                }}>{i < 5 ? Icons.check(8, C.amber) : d}</div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* CTA */}
      <div style={{ padding: "0 24px 16px", ...anim(0.15) }}>
        <button onClick={() => navigate(SCREENS.ENTRY)} style={{
          width: "100%", padding: "20px 24px", background: `linear-gradient(135deg, ${C.teal}15, ${C.teal}08)`,
          border: `1px solid ${C.teal}30`, borderRadius: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left",
        }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.teal }}>Start today's review</p>
            <p style={{ fontSize: 12, fontFamily: mono, color: C.textMuted, marginTop: 4 }}>~5 min · Log → AI Review → XP</p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {Icons.plus(18, C.bg)}
          </div>
        </button>
      </div>

      {/* Stats */}
      <div style={{ padding: "0 24px 16px", display: "flex", gap: 10, ...anim(0.2) }}>
        <Card style={{ flex: 1, padding: 16 }}>
          <p style={{ fontSize: 10, fontFamily: mono, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Level</p>
          <p style={{ fontSize: 24, fontWeight: 700, fontFamily: mono, color: C.text, marginTop: 4 }}>14</p>
          <p style={{ fontSize: 11, color: C.purple, fontFamily: mono, marginTop: 2 }}>Journeyman</p>
          <div style={{ marginTop: 8 }}><ProgressBar value={340} max={500} color={C.purple} /></div>
          <p style={{ fontSize: 10, fontFamily: mono, color: C.textDim, marginTop: 4 }}>160 XP to Lv.15</p>
        </Card>
        <Card style={{ flex: 1, padding: 16 }}>
          <p style={{ fontSize: 10, fontFamily: mono, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Review Avg</p>
          <p style={{ fontSize: 24, fontWeight: 700, fontFamily: mono, color: C.blue, marginTop: 4 }}>3.7</p>
          <p style={{ fontSize: 11, color: C.textMuted, fontFamily: mono, marginTop: 2 }}>out of 5.0</p>
          <div style={{ marginTop: 8 }}><ProgressBar value={3.7} max={5} color={C.blue} /></div>
          <p style={{ fontSize: 10, fontFamily: mono, color: C.teal, marginTop: 4 }}>↑ 0.4 this week</p>
        </Card>
      </div>

      {/* Yesterday */}
      <div style={{ padding: "0 24px", ...anim(0.25) }}>
        <p style={{ fontSize: 11, fontFamily: mono, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Yesterday's Review</p>
        <Card style={{ padding: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Fixed N+1 query in orders API</p>
          <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>Refactored with eager loading. Response time: 2.3s → 180ms.</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            <Badge text="SQL" color={C.blue} /><Badge text="Performance" color={C.teal} /><Badge text="Rails" color={C.purple} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 11, fontFamily: mono, color: C.textDim }}>Review: <span style={{ color: C.blue, fontWeight: 600 }}>4.2</span></span>
            <span style={{ fontSize: 11, fontFamily: mono, color: C.textDim }}>XP: <span style={{ color: C.teal, fontWeight: 600 }}>+85</span></span>
            <span style={{ fontSize: 11, fontFamily: mono, color: C.textDim }}>Conf: <span style={{ color: C.amber, fontWeight: 600 }}>4/5</span></span>
          </div>
        </Card>
      </div>

      {/* Fastest Growing */}
      <div style={{ padding: "20px 24px 0", ...anim(0.3) }}>
        <p style={{ fontSize: 11, fontFamily: mono, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Fastest Growing</p>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { name: "React", level: 5, xp: 78, color: C.blue },
            { name: "SQL", level: 4, xp: 45, color: C.teal },
            { name: "Docker", level: 2, xp: 62, color: C.purple },
          ].map((skill, i) => (
            <Card key={i} style={{ flex: 1, padding: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, fontFamily: mono, color: skill.color }}>{skill.name}</p>
              <p style={{ fontSize: 18, fontWeight: 700, fontFamily: mono, color: C.text, marginTop: 4 }}>Lv.{skill.level}</p>
              <div style={{ marginTop: 8 }}><ProgressBar value={skill.xp} max={100} color={skill.color} height={3} /></div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ENTRY
// ─────────────────────────────────────────────
function EntryScreen({ navigate }) {
  const [confidence, setConfidence] = useState(3);
  const [mood, setMood] = useState(2);
  const moodIcons = [
    { icon: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, label: "Rough" },
    { icon: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, label: "Meh" },
    { icon: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, label: "Good" },
    { icon: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 3 4 3 4-3 4-3"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, label: "Great" },
    { icon: () => Icons.zap(22, "currentColor"), label: "Flow" },
  ];
  const inputStyle = { width: "100%", padding: 14, fontSize: 14, color: C.text, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, resize: "vertical", outline: "none", lineHeight: 1.6 };

  return (
    <div style={{ padding: "0 0 32px" }}>
      <BackButton onClick={() => navigate(SCREENS.TODAY)} />
      <ScreenHeader title="Today's Entry" subtitle="mar 30 · day 12 of streak" />
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={anim(0.05)}>
          <label style={{ fontSize: 12, fontFamily: mono, color: C.textMuted, display: "block", marginBottom: 8 }}>What did you work on today?</label>
          <textarea style={{ ...inputStyle, minHeight: 80 }} defaultValue="Implemented user authentication with JWT tokens. Set up middleware for protected routes. Wrote unit tests for the auth controller." />
        </div>
        <div style={anim(0.1)}>
          <label style={{ fontSize: 12, fontFamily: mono, color: C.textMuted, display: "block", marginBottom: 8 }}>Hardest problem you faced?</label>
          <textarea style={{ ...inputStyle, minHeight: 60 }} defaultValue="Token refresh logic was causing infinite redirect loops when the access token expired mid-request." />
        </div>
        <div style={anim(0.15)}>
          <label style={{ fontSize: 12, fontFamily: mono, color: C.textMuted, display: "block", marginBottom: 8 }}>How did you solve it?</label>
          <textarea style={{ ...inputStyle, minHeight: 60 }} defaultValue="Added an Axios interceptor that queues requests while refreshing, then retries them with the new token." />
        </div>
        <div style={anim(0.2)}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontFamily: mono, color: C.textMuted }}>Confidence today</label>
            <span style={{ fontSize: 14, fontFamily: mono, fontWeight: 700, color: confidence <= 2 ? C.rose : confidence >= 4 ? C.teal : C.amber }}>{confidence}/5</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3,4,5].map(n => {
              const clr = confidence <= 2 ? C.rose : confidence >= 4 ? C.teal : C.amber;
              return (<button key={n} onClick={() => setConfidence(n)} style={{
                flex: 1, height: 40, borderRadius: 10, border: `1.5px solid ${n <= confidence ? clr + "50" : C.border}`,
                background: n <= confidence ? clr + "18" : C.surface, cursor: "pointer", fontSize: 13, fontFamily: mono,
                fontWeight: 600, color: n <= confidence ? clr : C.textDim, transition: "all 0.15s",
              }}>{n}</button>);
            })}
          </div>
        </div>
        <div style={anim(0.25)}>
          <label style={{ fontSize: 12, fontFamily: mono, color: C.textMuted, display: "block", marginBottom: 10 }}>Mood check</label>
          <div style={{ display: "flex", gap: 6 }}>
            {moodIcons.map((m, i) => (
              <button key={i} onClick={() => setMood(i)} style={{
                flex: 1, height: 52, borderRadius: 12, border: `1.5px solid ${i === mood ? C.teal + "50" : C.border}`,
                background: i === mood ? C.tealGlow : C.surface, cursor: "pointer", transition: "all 0.15s",
                color: i === mood ? C.teal : C.textDim, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 2, transform: i === mood ? "scale(1.05)" : "scale(1)",
              }}>
                {m.icon()}
                <span style={{ fontSize: 8, fontFamily: mono, fontWeight: 500 }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => navigate(SCREENS.REVIEW)} style={{
          width: "100%", padding: "16px", background: C.teal, color: C.bg, border: "none",
          borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer",
          boxShadow: `0 4px 20px ${C.teal}30`, marginTop: 8, ...anim(0.3),
        }}>Submit → Start AI Review</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AI REVIEW
// ─────────────────────────────────────────────
function ReviewScreen({ navigate }) {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(true);
  useEffect(() => { const t = setTimeout(() => setTyping(false), 1500); return () => clearTimeout(t); }, [step]);

  const aiMessages = [
    { q: "You used an Axios interceptor to queue requests during token refresh — smart pattern. But what happens if the refresh token itself is expired or revoked? How does your current implementation handle that edge case?", tags: ["JWT", "Auth", "Error Handling"] },
    { q: "You mentioned writing unit tests for the auth controller. What's your testing strategy — are you mocking the token service, or testing against a real auth flow? What tradeoffs did you consider?", tags: ["Testing", "Architecture"] },
    { q: "Looking at your confidence (3/5): you solved the problem, but something still feels uncertain. If you had to pinpoint the one thing about auth flows you're least confident in, what would it be?", tags: ["Self-awareness", "Auth"] },
  ];

  return (
    <div style={{ padding: "0 0 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <BackButton onClick={() => navigate(SCREENS.ENTRY)} label="Entry" />
      <div style={{ padding: "0 24px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.blue}30, ${C.purple}30)`,
            border: `1px solid ${C.blue}30`, display: "flex", alignItems: "center", justifyContent: "center",
          }}>{Icons.chat(16, C.blue)}</div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>AI Review</h2>
            <p style={{ fontSize: 11, fontFamily: mono, color: C.textMuted }}>{step + 1} of {aiMessages.length} · analyzing your moves</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
          {aiMessages.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? C.blue : C.border, transition: "background 0.3s" }}/>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px" }}>
        <div style={{ ...anim(0.1), marginBottom: 20 }}>
          <div style={{ padding: 16, background: `linear-gradient(135deg, ${C.blue}08, ${C.purple}05)`, border: `1px solid ${C.blue}20`, borderRadius: 16, borderTopLeftRadius: 4 }}>
            <p style={{ fontSize: 14, color: C.text, lineHeight: 1.65 }}>
              {typing ? (
                <span style={{ display: "inline-flex", gap: 4 }}>
                  {[0, 0.2, 0.4].map(d => <span key={d} style={{ width: 6, height: 6, borderRadius: 3, background: C.blue, animation: `pulseGlow 1s ease ${d}s infinite` }}/>)}
                </span>
              ) : aiMessages[step].q}
            </p>
            {!typing && <div style={{ display: "flex", gap: 5, marginTop: 10 }}>{aiMessages[step].tags.map(t => <Badge key={t} text={t} color={C.blue} />)}</div>}
          </div>
        </div>
        {!typing && (
          <div style={anim(0.2)}>
            <textarea placeholder="Type your reflection..." style={{
              width: "100%", minHeight: 100, padding: 14, fontSize: 14, color: C.text, background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 14, borderTopRightRadius: 4, resize: "vertical", outline: "none", lineHeight: 1.6,
            }} defaultValue={step === 0 ? "Honestly, I didn't think about the revoked refresh token case. Right now it would just loop. I should add a check that catches the 401 on the refresh call itself and redirects to login. Need to look into refresh token rotation too." : ""} />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              {step < aiMessages.length - 1 ? (
                <button onClick={() => { setStep(s => s + 1); setTyping(true); }} style={{ flex: 1, padding: 14, background: C.teal, color: C.bg, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Submit → Next Question</button>
              ) : (
                <button onClick={() => navigate(SCREENS.REVIEW_SCORE)} style={{ flex: 1, padding: 14, background: C.teal, color: C.bg, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Complete Review →</button>
              )}
              <button onClick={() => navigate(SCREENS.REVIEW_SCORE)} style={{ padding: "14px 18px", background: C.surface, color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, fontFamily: mono, cursor: "pointer" }}>Skip</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// REVIEW SCORE
// ─────────────────────────────────────────────
function ReviewScoreScreen({ navigate }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setTimeout(() => setRevealed(true), 600); }, []);

  const targetScore = 3.7;
  const pct = targetScore / 5;
  const circumference = 2 * Math.PI * 70;
  const offset = circumference * (1 - pct);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "0 24px 32px" }}>
      <BackButton onClick={() => navigate(SCREENS.REVIEW)} label="Review" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, textAlign: "center" }}>
        {/* SVG Score Ring */}
        <div style={{ width: 160, height: 160, position: "relative" }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke={C.border} strokeWidth="6"/>
            <circle cx="80" cy="80" r="70" fill="none" stroke={C.blue} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={revealed ? offset : circumference}
              style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)", transform: "rotate(-90deg)", transformOrigin: "center" }}/>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 42, fontWeight: 700, fontFamily: mono, color: C.blue }}>{revealed ? "3.7" : "—"}</span>
            <span style={{ fontSize: 11, fontFamily: mono, color: C.textMuted }}>review rating</span>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 300, ...anim(0.4) }}>
          {[
            { label: "Depth", score: 4.0, color: C.teal },
            { label: "Self-awareness", score: 3.5, color: C.blue },
            { label: "Actionability", score: 3.5, color: C.purple },
          ].map((dim, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontFamily: mono, color: C.textMuted, width: 110, textAlign: "right" }}>{dim.label}</span>
              <div style={{ flex: 1 }}><ProgressBar value={dim.score} max={5} color={dim.color} height={6} /></div>
              <span style={{ fontSize: 13, fontFamily: mono, fontWeight: 600, color: dim.color, width: 30 }}>{dim.score}</span>
            </div>
          ))}
        </div>

        <Card style={{ width: "100%", ...anim(0.5) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 11, fontFamily: mono, color: C.textDim, textTransform: "uppercase" }}>XP Earned</p>
              <p style={{ fontSize: 28, fontWeight: 700, fontFamily: mono, color: C.teal, marginTop: 4 }}>+75</p>
            </div>
            <div style={{ textAlign: "right", fontSize: 11, fontFamily: mono, color: C.textDim }}>
              <p>Entry: +10</p><p>Follow-ups: +45</p><p>Depth bonus: +20</p>
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["JWT +25xp", "Auth +20xp", "Testing +15xp", "Error Handling +15xp"].map((s, i) => <Badge key={i} text={s} color={C.teal} />)}
          </div>
        </Card>
      </div>
      <button onClick={() => navigate(SCREENS.TODAY)} style={{
        width: "100%", padding: 16, background: C.teal, color: C.bg, border: "none",
        borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 20px ${C.teal}30`, ...anim(0.6),
      }}>Done — Back to Today</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// JOURNEY
// ─────────────────────────────────────────────
function JourneyScreen({ navigate }) {
  const entries = [
    { date: "Mar 30", title: "JWT auth + token refresh", confidence: 3, score: 3.7, xp: 75, skills: ["JWT", "Auth", "Testing"] },
    { date: "Mar 29", title: "Fixed N+1 query in orders API", confidence: 4, score: 4.2, xp: 85, skills: ["SQL", "Performance"] },
    { date: "Mar 28", title: "Docker compose for dev env", confidence: 2, score: 3.1, xp: 55, skills: ["Docker", "DevOps"] },
    { date: "Mar 27", title: "React form validation patterns", confidence: 4, score: 3.9, xp: 70, skills: ["React", "Forms"] },
    { date: "Mar 26", title: "Debugging CORS in Express", confidence: 3, score: 3.4, xp: 60, skills: ["Node.js", "HTTP"] },
  ];
  return (
    <div style={{ padding: "0 0 24px" }}>
      <ScreenHeader title="Journey" subtitle={`${entries.length} entries · 12 day streak`} right={<AvatarButton onClick={() => navigate(SCREENS.PROFILE)} />} />
      <div style={{ padding: "0 24px 16px", ...anim(0.05) }}>
        <Card style={{ padding: 16 }}>
          <p style={{ fontSize: 10, fontFamily: mono, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Confidence Trend (7 days)</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 50 }}>
            {[2, 3, 3, 4, 2, 4, 3].map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${(v / 5) * 100}%`, background: `linear-gradient(180deg, ${v >= 4 ? C.teal : v <= 2 ? C.rose : C.amber}80, ${v >= 4 ? C.teal : v <= 2 ? C.rose : C.amber}20)`, borderRadius: 4 }}/>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 9, fontFamily: mono, color: C.textDim }}>Mon</span><span style={{ fontSize: 9, fontFamily: mono, color: C.textDim }}>Sun</span>
          </div>
        </Card>
      </div>
      <div style={{ padding: "0 24px" }}>
        {entries.map((entry, i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "16px 0", borderBottom: i < entries.length - 1 ? `1px solid ${C.border}` : "none", ...anim(0.08 + i * 0.04) }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: entry.score >= 4 ? C.teal : entry.score >= 3.5 ? C.blue : C.amber, boxShadow: `0 0 8px ${(entry.score >= 4 ? C.teal : entry.score >= 3.5 ? C.blue : C.amber)}40` }}/>
              {i < entries.length - 1 && <div style={{ width: 1, flex: 1, background: C.border, marginTop: 4 }}/>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{entry.title}</p>
                  <p style={{ fontSize: 11, fontFamily: mono, color: C.textDim, marginTop: 3 }}>{entry.date}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 14, fontFamily: mono, fontWeight: 700, color: C.blue }}>{entry.score}</span>
                  <p style={{ fontSize: 10, fontFamily: mono, color: C.teal }}>+{entry.xp}xp</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>{entry.skills.map(s => <Badge key={s} text={s} color={C.textMuted} />)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SKILLS SCREEN — Full interactive tree
// ─────────────────────────────────────────────
function SkillsScreen({ navigate }) {
  const [expandedBranch, setExpandedBranch] = useState(0);

  const branches = [
    { name: "Languages", color: C.blue, icon: Icons.branchLang, skills: [
      { name: "JavaScript", level: 6, xp: 72, maxLevel: 10 },
      { name: "TypeScript", level: 3, xp: 45, maxLevel: 10 },
      { name: "Python", level: 2, xp: 30, maxLevel: 10 },
    ]},
    { name: "Frameworks", color: C.purple, icon: Icons.branchFramework, skills: [
      { name: "React", level: 5, xp: 78, maxLevel: 10 },
      { name: "Node.js", level: 4, xp: 55, maxLevel: 10 },
      { name: "Express", level: 3, xp: 40, maxLevel: 10 },
    ]},
    { name: "DevOps", color: C.teal, icon: Icons.branchDevops, skills: [
      { name: "Docker", level: 2, xp: 62, maxLevel: 10 },
      { name: "Git", level: 5, xp: 88, maxLevel: 10 },
      { name: "CI/CD", level: 1, xp: 20, maxLevel: 10 },
    ]},
    { name: "Databases", color: C.amber, icon: Icons.branchDB, skills: [
      { name: "SQL", level: 4, xp: 45, maxLevel: 10 },
      { name: "PostgreSQL", level: 3, xp: 33, maxLevel: 10 },
    ]},
  ];

  const totalSkills = branches.reduce((a, b) => a + b.skills.length, 0);

  // Level dots component
  const LevelDots = ({ level, maxLevel, color }) => (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: maxLevel }).map((_, i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: 3,
          background: i < level ? color : C.border,
          boxShadow: i < level ? `0 0 4px ${color}40` : "none",
          transition: "all 0.3s",
        }}/>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "0 0 24px" }}>
      <ScreenHeader title="Skills" subtitle={`${totalSkills} skills · 4 branches`} right={<AvatarButton onClick={() => navigate(SCREENS.PROFILE)} />} />

      {/* Tree Visualization — SVG circuit/constellation */}
      <div style={{ padding: "0 24px 16px", ...anim(0.05) }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ height: 220, position: "relative", background: `radial-gradient(ellipse at center, ${C.surfaceRaised} 0%, ${C.bg} 100%)`, backgroundImage: gridBg }}>
            <svg width="100%" height="100%" viewBox="0 0 342 220" fill="none">
              {/* Connection lines from center to branches */}
              {branches.map((branch, i) => {
                const positions = [{ x: 80, y: 55 }, { x: 262, y: 55 }, { x: 80, y: 165 }, { x: 262, y: 165 }];
                const pos = positions[i];
                return (
                  <g key={`line-${i}`}>
                    <line x1="171" y1="110" x2={pos.x} y2={pos.y} stroke={branch.color} strokeOpacity={expandedBranch === i ? "0.4" : "0.12"} strokeWidth="1" strokeDasharray={expandedBranch === i ? "none" : "4 4"} style={{ transition: "all 0.3s" }}/>
                    {/* Skill sub-nodes */}
                    {branch.skills.map((skill, si) => {
                      const angle = (si / branch.skills.length) * Math.PI * 0.6 - Math.PI * 0.3;
                      const dist = 28 + si * 4;
                      const sx = pos.x + Math.cos(angle + (i < 2 ? Math.PI * 0.1 : -Math.PI * 0.1)) * dist;
                      const sy = pos.y + Math.sin(angle) * dist;
                      return (
                        <g key={`skill-${i}-${si}`}>
                          <line x1={pos.x} y1={pos.y} x2={sx} y2={sy} stroke={branch.color} strokeOpacity={expandedBranch === i ? "0.25" : "0.06"} strokeWidth="0.5" style={{ transition: "all 0.3s" }}/>
                          <circle cx={sx} cy={sy} r={3 + skill.level * 0.5} fill={branch.color} opacity={expandedBranch === i ? 0.6 : 0.15} style={{ transition: "all 0.3s" }}/>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>

            {/* Center node */}
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              width: 48, height: 48, borderRadius: "50%", background: C.surfaceRaised,
              border: `2px solid ${C.teal}60`, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 24px ${C.tealGlow2}`, zIndex: 2,
            }}>
              <span style={{ fontSize: 12, fontFamily: mono, fontWeight: 700, color: C.teal }}>L14</span>
            </div>

            {/* Branch nodes */}
            {branches.map((branch, i) => {
              const positions = [
                { top: "15%", left: "18%" }, { top: "15%", left: "70%" },
                { top: "65%", left: "18%" }, { top: "65%", left: "70%" },
              ];
              const pos = positions[i];
              const isActive = expandedBranch === i;
              return (
                <button key={`node-${i}`} onClick={() => setExpandedBranch(i)} style={{
                  position: "absolute", ...pos, transform: "translate(-50%, -50%)", zIndex: 1,
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: isActive ? branch.color + "30" : branch.color + "15",
                    border: `1.5px solid ${isActive ? branch.color + "70" : branch.color + "30"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: isActive ? `0 0 16px ${branch.color}30` : "none",
                    transition: "all 0.3s",
                  }}>
                    {branch.icon(14, branch.color)}
                  </div>
                  <p style={{
                    fontSize: 9, fontFamily: mono, color: isActive ? branch.color : C.textDim,
                    textAlign: "center", marginTop: 4, whiteSpace: "nowrap", fontWeight: isActive ? 600 : 400,
                    transition: "all 0.3s",
                  }}>{branch.name}</p>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Expanded branch detail */}
      {branches.map((branch, bi) => bi === expandedBranch && (
        <div key={bi} style={{ padding: "0 24px", ...anim(0) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: branch.color + "18", border: `1px solid ${branch.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {branch.icon(14, branch.color)}
            </div>
            <span style={{ fontSize: 14, fontFamily: mono, fontWeight: 600, color: branch.color }}>{branch.name}</span>
            <span style={{ fontSize: 11, fontFamily: mono, color: C.textDim }}>{branch.skills.length} skills</span>
          </div>

          {branch.skills.map((skill, si) => (
            <div key={si} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 8,
              ...anim(0.05 + si * 0.05),
            }}>
              {/* Level ring */}
              <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke={C.border} strokeWidth="3"/>
                  <circle cx="22" cy="22" r="18" fill="none" stroke={branch.color} strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={2 * Math.PI * 18 * (1 - skill.level / skill.maxLevel)}
                    style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }}/>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, fontFamily: mono, fontWeight: 700, color: branch.color }}>{skill.level}</span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{skill.name}</span>
                  <span style={{ fontSize: 10, fontFamily: mono, color: C.textDim }}>{skill.xp}% to Lv.{skill.level + 1}</span>
                </div>
                <LevelDots level={skill.level} maxLevel={skill.maxLevel} color={branch.color} />
                <div style={{ marginTop: 8 }}>
                  <ProgressBar value={skill.xp} max={100} color={branch.color} height={3} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Other branches collapsed */}
      <div style={{ padding: "16px 24px 0" }}>
        <p style={{ fontSize: 10, fontFamily: mono, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Other branches</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {branches.filter((_, i) => i !== expandedBranch).map((branch, i) => (
            <button key={i} onClick={() => setExpandedBranch(branches.indexOf(branch))} style={{
              flex: 1, minWidth: 90, padding: "12px 10px", background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 12, cursor: "pointer", textAlign: "center", transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{branch.icon(14, branch.color)}</div>
              <p style={{ fontSize: 11, fontFamily: mono, fontWeight: 600, color: branch.color }}>{branch.name}</p>
              <p style={{ fontSize: 10, fontFamily: mono, color: C.textDim, marginTop: 2 }}>{branch.skills.length} skills</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LIBRARY
// ─────────────────────────────────────────────
function LibraryScreen({ navigate }) {
  const recommended = [
    { title: "Understanding JWT Security Best Practices", type: "Article", level: "Intermediate", skill: "Auth", source: "Auth0 Blog", match: 94, icon: Icons.fileText },
    { title: "Refresh Token Rotation Explained", type: "Video", level: "Intermediate", skill: "JWT", source: "Fireship", match: 91, icon: Icons.film },
  ];
  const resources = [
    { title: "PostgreSQL Performance Tuning", type: "Course", source: "Pluralsight", level: "Intermediate", saved: true, icon: Icons.graduation },
    { title: "Docker Networking Deep Dive", type: "Article", source: "Docker Docs", level: "Beginner", icon: Icons.fileText },
    { title: "React Testing Library Cookbook", type: "Guide", source: "Kent C. Dodds", level: "Intermediate", icon: Icons.book },
    { title: "System Design Primer", type: "Repo", source: "GitHub", level: "Advanced", icon: Icons.code },
  ];
  return (
    <div style={{ padding: "0 0 24px" }}>
      <ScreenHeader title="Library" subtitle="ai-curated · 24 resources" right={<AvatarButton onClick={() => navigate(SCREENS.PROFILE)} />} />
      <div style={{ padding: "0 24px 20px", ...anim(0.05) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          {Icons.chat(14, C.blue)}
          <span style={{ fontSize: 11, fontFamily: mono, color: C.blue, letterSpacing: "0.06em", textTransform: "uppercase" }}>Based on today's review</span>
        </div>
        {recommended.map((r, i) => (
          <Card key={i} glow={C.blueGlow} style={{ marginBottom: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, marginRight: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{r.title}</p>
                <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{r.source}</p>
              </div>
              <Badge text={`${r.match}%`} color={C.blue} />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <Badge text={r.type} color={C.textMuted} /><Badge text={r.level} color={C.purple} /><Badge text={r.skill} color={C.teal} />
            </div>
          </Card>
        ))}
      </div>
      <div style={{ padding: "0 24px" }}>
        <p style={{ fontSize: 11, fontFamily: mono, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Your Library</p>
        {resources.map((r, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 0",
            borderBottom: i < resources.length - 1 ? `1px solid ${C.border}` : "none", ...anim(0.1 + i * 0.04),
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {r.icon(18, C.textMuted)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{r.title}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontFamily: mono, color: C.textDim }}>{r.source}</span>
                <span style={{ fontSize: 11, fontFamily: mono, color: C.textDim }}>·</span>
                <span style={{ fontSize: 11, fontFamily: mono, color: C.purple }}>{r.level}</span>
              </div>
            </div>
            {r.saved && Icons.bookmark(16, C.amber)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────
function ProfileScreen({ navigate }) {
  const badges = [
    { icon: () => Icons.fire(24, C.amber), label: "7-Day Streak", earned: true },
    { icon: () => Icons.target(24, C.blue), label: "First 4.0 Review", earned: true },
    { icon: () => Icons.seed(24, C.teal), label: "10 Skills", earned: true },
    { icon: () => Icons.star(24, C.amber), label: "30-Day Streak", earned: false },
    { icon: () => Icons.diamond(24, C.blue), label: "Level 10 Skill", earned: false },
  ];

  return (
    <div style={{ padding: "0 0 32px" }}>
      <BackButton onClick={() => navigate(SCREENS.TODAY)} />
      <div style={{ padding: "0 24px 24px", textAlign: "center", ...anim(0.05) }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg, ${C.tealDim}, ${C.purpleDim})`,
          border: `2px solid ${C.teal}40`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 30px ${C.tealGlow}`,
        }}>{Icons.shield(28, C.teal)}</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Developer</h2>
        <p style={{ fontSize: 13, fontFamily: mono, color: C.purple, marginTop: 4 }}>Journeyman Developer</p>
      </div>
      <div style={{ padding: "0 24px 20px", ...anim(0.1) }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontFamily: mono, color: C.textMuted }}>Level 14</span>
            <span style={{ fontSize: 12, fontFamily: mono, color: C.textMuted }}>Level 15</span>
          </div>
          <ProgressBar value={340} max={500} color={C.purple} height={8} />
          <p style={{ fontSize: 11, fontFamily: mono, color: C.textDim, textAlign: "center", marginTop: 8 }}>160 XP to next level · 2,340 total XP</p>
        </Card>
      </div>
      <div style={{ padding: "0 24px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, ...anim(0.15) }}>
        {[
          { label: "Entries", value: "42", icon: () => Icons.pencil(20, C.textSoft) },
          { label: "Skills", value: "11", icon: () => Icons.zap(20, C.textSoft) },
          { label: "Best Streak", value: "18d", icon: () => Icons.fire(20, C.textSoft) },
          { label: "Resources", value: "8", icon: () => Icons.book(20, C.textSoft) },
        ].map((stat, i) => (
          <Card key={i} style={{ padding: 14, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>{stat.icon()}</div>
            <p style={{ fontSize: 22, fontWeight: 700, fontFamily: mono, color: C.text, marginTop: 6 }}>{stat.value}</p>
            <p style={{ fontSize: 10, fontFamily: mono, color: C.textDim, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
          </Card>
        ))}
      </div>
      <div style={{ padding: "0 24px 20px", ...anim(0.2) }}>
        <Card>
          <p style={{ fontSize: 10, fontFamily: mono, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Review Quality (4 weeks)</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
            {[2.1,2.5,2.8,3.0,2.9,3.2,3.1,3.4,3.3,3.5,3.6,3.4,3.7,3.8,3.5,3.7,3.9,3.7,4.0,3.8,4.1,3.9,4.0,4.2,3.7].map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${((v - 1.5) / 3.5) * 100}%`, background: `linear-gradient(180deg, ${C.blue}, ${C.blue}40)`, borderRadius: 2, minHeight: 2 }}/>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 10, fontFamily: mono, color: C.textDim }}>Week 1: 2.1</span>
            <span style={{ fontSize: 10, fontFamily: mono, color: C.teal }}>This week: 3.9 ↑</span>
          </div>
        </Card>
      </div>
      <div style={{ padding: "0 24px", ...anim(0.25) }}>
        <p style={{ fontSize: 11, fontFamily: mono, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Achievements</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {badges.map((badge, i) => (
            <div key={i} style={{ width: 60, textAlign: "center", opacity: badge.earned ? 1 : 0.3 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: badge.earned ? C.surface : C.bg,
                border: `1px solid ${badge.earned ? C.borderLight : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px",
              }}>{badge.icon()}</div>
              <p style={{ fontSize: 9, fontFamily: mono, color: badge.earned ? C.textMuted : C.textDim, lineHeight: 1.3 }}>{badge.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "24px 24px 0", ...anim(0.3) }}>
        <button onClick={() => navigate(SCREENS.PAYWALL)} style={{
          width: "100%", padding: 14, background: `linear-gradient(135deg, ${C.teal}15, ${C.teal}08)`,
          border: `1px solid ${C.teal}30`, borderRadius: 14, cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: C.teal,
        }}>Day 12 of 14 — See Pro plans</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAYWALL
// ─────────────────────────────────────────────
function PaywallScreen({ navigate }) {
  const [annual, setAnnual] = useState(true);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: `linear-gradient(180deg, ${C.teal}08 0%, transparent 100%)`, pointerEvents: "none" }}/>
      <BackButton onClick={() => navigate(SCREENS.TODAY)} />
      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 32, ...anim(0.05) }}>
          <Badge text="Your trial ends in 2 days" color={C.amber} />
          <h2 style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", marginTop: 16, lineHeight: 1.2 }}>
            Keep the engine<br/><span style={{ color: C.teal }}>running</span>
          </h2>
        </div>
        <Card glow={C.tealGlow} style={{ marginBottom: 20, ...anim(0.1) }}>
          <p style={{ fontSize: 11, fontFamily: mono, color: C.teal, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>What AI did for you in 12 days</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[{ value: "11", label: "Skills identified" }, { value: "28", label: "Follow-up Qs" }, { value: "2.1 → 3.9", label: "Review quality" }, { value: "+2,340", label: "XP earned" }].map((s, i) => (
              <div key={i}>
                <p style={{ fontSize: 20, fontWeight: 700, fontFamily: mono, color: C.text }}>{s.value}</p>
                <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ marginBottom: 24, ...anim(0.15) }}>
          <p style={{ fontSize: 12, fontFamily: mono, color: C.textDim, marginBottom: 10 }}>Without Pro, you lose:</p>
          {["AI follow-up questions", "Auto skill extraction & leveling", "Reflection quality scoring", "AI resource recommendations", "Monthly growth summaries"].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0" }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: C.rose + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {Icons.x(10, C.rose)}
              </div>
              <span style={{ fontSize: 13, color: C.textSoft }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, ...anim(0.2) }}>
          <div style={{ display: "flex", background: C.surface, borderRadius: 10, padding: 3, border: `1px solid ${C.border}` }}>
            {["Annual", "Monthly"].map((label, i) => {
              const isActive = i === 0 ? annual : !annual;
              return (<button key={label} onClick={() => setAnnual(i === 0)} style={{
                padding: "8px 20px", fontSize: 12, fontFamily: mono, fontWeight: 600,
                background: isActive ? (i === 0 ? C.teal : C.surfaceRaised) : "transparent",
                color: isActive ? (i === 0 ? C.bg : C.text) : C.textMuted,
                border: "none", borderRadius: 8, cursor: "pointer", transition: "all 0.2s",
              }}>{label}</button>);
            })}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, ...anim(0.25) }}>
          <Card style={{ padding: 16, opacity: 0.7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Lifetime</p><p style={{ fontSize: 11, color: C.textDim }}>Pay once, grow forever</p></div>
              <p style={{ fontSize: 20, fontWeight: 700, fontFamily: mono, color: C.text }}>$149.99</p>
            </div>
          </Card>
          <Card glow={C.tealGlow} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{annual ? "Annual" : "Monthly"}</p>
                  {annual && <Badge text="Save 40%" color={C.teal} />}
                </div>
                <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{annual ? "$4.17/mo billed yearly" : "Cancel anytime"}</p>
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, fontFamily: mono, color: C.teal }}>
                {annual ? "$49.99" : "$6.99"}<span style={{ fontSize: 12, fontWeight: 400, color: C.textMuted }}>{annual ? "/yr" : "/mo"}</span>
              </p>
            </div>
          </Card>
          <button style={{
            width: "100%", padding: 16, background: C.teal, color: C.bg, border: "none",
            borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 20px ${C.teal}30`, marginTop: 4,
          }}>Start Pro — Keep Growing</button>
          <button onClick={() => navigate(SCREENS.TODAY)} style={{
            width: "100%", padding: 12, background: "transparent", color: C.textDim,
            border: "none", fontSize: 13, fontFamily: mono, cursor: "pointer",
          }}>Continue with free tier</button>
        </div>
      </div>
    </div>
  );
}
