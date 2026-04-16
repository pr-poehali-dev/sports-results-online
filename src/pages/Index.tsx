import { useState } from "react";
import Icon from "@/components/ui/icon";

type Tab = "results" | "schedule" | "stats" | "tournaments" | "ratings" | "favorites" | "profile";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "results", label: "Результаты", icon: "Activity" },
  { id: "schedule", label: "Расписание", icon: "Calendar" },
  { id: "stats", label: "Статистика", icon: "BarChart3" },
  { id: "tournaments", label: "Турниры", icon: "Trophy" },
  { id: "ratings", label: "Рейтинги", icon: "TrendingUp" },
  { id: "favorites", label: "Избранное", icon: "Star" },
  { id: "profile", label: "Профиль", icon: "User" },
];

const MATCHES = [
  { id: 1, home: "ЦСКА", away: "Спартак", scoreHome: 2, scoreAway: 1, status: "live", time: "67'", sport: "⚽", league: "РПЛ" },
  { id: 2, home: "Динамо", away: "Зенит", scoreHome: 0, scoreAway: 3, status: "live", time: "45+2'", sport: "⚽", league: "РПЛ" },
  { id: 3, home: "Локо", away: "Краснодар", scoreHome: 1, scoreAway: 1, status: "finished", time: "ФТ", sport: "⚽", league: "РПЛ" },
  { id: 4, home: "УНИКС", away: "ЦСКА Баскет", scoreHome: 78, scoreAway: 82, status: "live", time: "Q3 7:24", sport: "🏀", league: "VTB" },
  { id: 5, home: "СКА", away: "ЦСКА Хоккей", scoreHome: 2, scoreAway: 2, status: "live", time: "П3 12:08", sport: "🏒", league: "КХЛ" },
];

const SCHEDULE_MATCHES = [
  { id: 1, home: "Рубин", away: "Факел", time: "16:00", date: "Сегодня", sport: "⚽", league: "РПЛ" },
  { id: 2, home: "Сочи", away: "Ростов", time: "19:00", date: "Сегодня", sport: "⚽", league: "РПЛ" },
  { id: 3, home: "Металлург", away: "Авангард", time: "20:30", date: "Сегодня", sport: "🏒", league: "КХЛ" },
  { id: 4, home: "ЦСКА", away: "Динамо", time: "12:00", date: "Завтра", sport: "⚽", league: "РПЛ" },
  { id: 5, home: "Химки", away: "УНИКС", time: "15:00", date: "Завтра", sport: "🏀", league: "VTB" },
  { id: 6, home: "Зенит", away: "Спартак", time: "18:00", date: "18 апр", sport: "⚽", league: "РПЛ" },
];

const TOURNAMENTS = [
  { name: "Российская Премьер-Лига", sport: "⚽", teams: 16, stage: "27 тур", leader: "Зенит" },
  { name: "КХЛ — Плей-офф", sport: "🏒", teams: 8, stage: "Финал", leader: "СКА" },
  { name: "Лига ВТБ", sport: "🏀", teams: 12, stage: "1/2 финала", leader: "ЦСКА" },
  { name: "Лига Чемпионов УЕФА", sport: "⚽", teams: 32, stage: "Полуфинал", leader: "Реал Мадрид" },
];

const RATINGS = [
  { pos: 1, team: "Зенит", pts: 58, w: 18, d: 4, l: 4, diff: "+28", change: "up" },
  { pos: 2, team: "ЦСКА", pts: 52, w: 16, d: 4, l: 6, diff: "+19", change: "same" },
  { pos: 3, team: "Краснодар", pts: 48, w: 14, d: 6, l: 6, diff: "+14", change: "up" },
  { pos: 4, team: "Локо", pts: 45, w: 13, d: 6, l: 7, diff: "+10", change: "down" },
  { pos: 5, team: "Спартак", pts: 42, w: 12, d: 6, l: 8, diff: "+5", change: "down" },
  { pos: 6, team: "Динамо", pts: 39, w: 11, d: 6, l: 9, diff: "+2", change: "up" },
  { pos: 7, team: "Рубин", pts: 34, w: 9, d: 7, l: 10, diff: "-3", change: "same" },
  { pos: 8, team: "Ростов", pts: 31, w: 8, d: 7, l: 11, diff: "-8", change: "down" },
];

const STATS = [
  { name: "Артём Дзюба", team: "Зенит", stat: 18, label: "голов", sport: "⚽" },
  { name: "Квинси Промес", team: "Спартак", stat: 14, label: "голов", sport: "⚽" },
  { name: "Иван Игнатьев", team: "Краснодар", stat: 12, label: "голов", sport: "⚽" },
  { name: "Никита Нестеров", team: "ЦСКА Хоккей", stat: 24, label: "очков", sport: "🏒" },
  { name: "Алексей Швед", team: "Химки", stat: 22, label: "очков", sport: "🏀" },
];

const FAVORITES = [
  { id: 1, name: "Зенит", type: "Команда", sport: "⚽", nextMatch: "vs Спартак · 18 апр · 18:00" },
  { id: 2, name: "ЦСКА Хоккей", type: "Команда", sport: "🏒", nextMatch: "vs СКА · Сегодня · П3 идёт" },
  { id: 3, name: "КХЛ Финал", type: "Серия", sport: "🏒", nextMatch: "Игра 5 · 20 апр" },
];

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 text-xs font-display font-semibold text-red-500">
      <span className="live-dot" />
      LIVE
    </span>
  );
}

function MatchCard({ match, delay }: { match: typeof MATCHES[0]; delay: number }) {
  return (
    <div
      className="card-sport p-4 cursor-pointer animate-fade-in"
      style={{ animationDelay: `${delay * 0.07}s`, opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-white/40 font-body">
          <span>{match.sport}</span>
          <span>{match.league}</span>
          {match.status === "live" && <LiveBadge />}
          {match.status === "finished" && <span className="text-white/30">Завершён</span>}
        </div>
        <span className="text-xs text-white/40 font-display">{match.time}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-display font-semibold text-white text-lg">{match.home}</p>
        </div>
        <div className="flex items-center gap-3 mx-4">
          <span className={`font-display font-bold text-2xl ${match.status === "live" ? "text-white" : "text-white/60"}`}>
            {match.scoreHome}
          </span>
          <span className="text-white/20 font-display text-xl">:</span>
          <span className={`font-display font-bold text-2xl ${match.status === "live" ? "text-white" : "text-white/60"}`}>
            {match.scoreAway}
          </span>
        </div>
        <div className="flex-1 text-right">
          <p className="font-display font-semibold text-white text-lg">{match.away}</p>
        </div>
      </div>
    </div>
  );
}

function ResultsTab() {
  const live = MATCHES.filter(m => m.status === "live");
  const finished = MATCHES.filter(m => m.status === "finished");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <LiveBadge />
          <h2 className="font-display text-xl font-bold text-white">Сейчас играют</h2>
          <span className="text-xs bg-red-600 text-white px-2 py-0.5 font-display font-semibold">{live.length}</span>
        </div>
        <div className="space-y-2">
          {live.map((m, i) => <MatchCard key={m.id} match={m} delay={i} />)}
        </div>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-white/50 mb-3 uppercase tracking-wider">Завершённые</h2>
        <div className="space-y-2">
          {finished.map((m, i) => <MatchCard key={m.id} match={m} delay={i} />)}
        </div>
      </div>
    </div>
  );
}

function ScheduleTab() {
  const grouped: Record<string, typeof SCHEDULE_MATCHES> = {};
  SCHEDULE_MATCHES.forEach(m => {
    if (!grouped[m.date]) grouped[m.date] = [];
    grouped[m.date].push(m);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {Object.entries(grouped).map(([date, matches], gi) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-display font-semibold text-red-500 text-sm uppercase tracking-widest">{date}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="space-y-2">
            {matches.map((m, i) => (
              <div
                key={m.id}
                className="card-sport p-4 flex items-center justify-between cursor-pointer animate-fade-in"
                style={{ animationDelay: `${(gi * 3 + i) * 0.06}s`, opacity: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[48px]">
                    <p className="font-display font-bold text-white text-lg leading-none">{m.time}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div>
                    <p className="font-display font-semibold text-white">
                      {m.home} <span className="text-white/30 font-normal">vs</span> {m.away}
                    </p>
                    <p className="text-xs text-white/40 font-body">{m.sport} {m.league}</p>
                  </div>
                </div>
                <button className="text-xs font-display font-semibold text-red-500 border border-red-500/40 px-3 py-1 hover:bg-red-500 hover:text-white transition-all">
                  + СЛЕЖУ
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsTab() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { val: "2 847", label: "Матчей" },
          { val: "98%", label: "Актуально" },
          { val: "14", label: "Лиг" },
        ].map((s, i) => (
          <div key={i} className="card-sport p-4 text-center">
            <p className="font-display font-bold text-3xl neon-text">{s.val}</p>
            <p className="text-xs text-white/40 font-body mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="font-display text-xl font-bold text-white mb-4 uppercase">Лучшие игроки</h2>
        <div className="space-y-2">
          {STATS.map((s, i) => (
            <div
              key={i}
              className="card-sport p-4 flex items-center gap-4 animate-fade-in"
              style={{ animationDelay: `${i * 0.07}s`, opacity: 0 }}
            >
              <span className="font-display font-bold text-2xl text-white/20 min-w-[32px]">{i + 1}</span>
              <span className="text-2xl">{s.sport}</span>
              <div className="flex-1">
                <p className="font-display font-semibold text-white">{s.name}</p>
                <p className="text-xs text-white/40 font-body">{s.team}</p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-2xl text-white">{s.stat}</p>
                <p className="text-xs text-white/40 font-body">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TournamentsTab() {
  return (
    <div className="animate-fade-in space-y-3">
      <h2 className="font-display text-xl font-bold text-white uppercase mb-4">Активные турниры</h2>
      {TOURNAMENTS.map((t, i) => (
        <div
          key={i}
          className="card-sport p-5 cursor-pointer animate-fade-in"
          style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{t.sport}</span>
              <div>
                <p className="font-display font-bold text-white text-lg uppercase">{t.name}</p>
                <p className="text-xs text-white/40 font-body">{t.teams} команд · {t.stage}</p>
              </div>
            </div>
            <Icon name="ChevronRight" size={20} className="text-white/20" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className="text-xs text-white/40 font-body uppercase tracking-wider">Лидер</span>
            <span className="font-display font-semibold text-red-400">{t.leader}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RatingsTab() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-white uppercase">РПЛ · 2025/26</h2>
        <span className="text-xs text-red-500 font-display font-semibold border border-red-500/30 px-2 py-1">27 ТУР</span>
      </div>
      <div className="card-sport overflow-hidden">
        <div className="grid grid-cols-[28px_1fr_44px_28px_28px_28px_44px_32px] gap-1 px-4 py-2 border-b border-white/5">
          {["#", "Команда", "О", "В", "Н", "П", "+/-", ""].map((h, i) => (
            <span key={i} className="text-[10px] text-white/30 font-display font-semibold uppercase text-center first:text-left">{h}</span>
          ))}
        </div>
        {RATINGS.map((r, i) => (
          <div
            key={r.pos}
            className={`grid grid-cols-[28px_1fr_44px_28px_28px_28px_44px_32px] gap-1 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer animate-fade-in ${i < 3 ? "border-l-2 border-l-red-600" : ""}`}
            style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
          >
            <span className="font-display font-semibold text-white/50 text-sm">{r.pos}</span>
            <span className="font-display font-semibold text-white truncate">{r.team}</span>
            <span className="font-display font-bold text-white text-center">{r.pts}</span>
            <span className="text-white/50 text-sm text-center font-body">{r.w}</span>
            <span className="text-white/50 text-sm text-center font-body">{r.d}</span>
            <span className="text-white/50 text-sm text-center font-body">{r.l}</span>
            <span className={`text-sm text-center font-display font-semibold ${r.diff.startsWith("+") ? "text-green-400" : r.diff.startsWith("-") ? "text-red-400" : "text-white/40"}`}>
              {r.diff}
            </span>
            <span className="text-center text-xs">
              {r.change === "up" && <span className="text-green-400">▲</span>}
              {r.change === "down" && <span className="text-red-400">▼</span>}
              {r.change === "same" && <span className="text-white/20">—</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FavoritesTab() {
  const [notified, setNotified] = useState<number[]>([1, 2]);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-white uppercase">Избранное</h2>
        <button className="text-xs font-display font-semibold text-red-500 flex items-center gap-1">
          <Icon name="Plus" size={14} />
          ДОБАВИТЬ
        </button>
      </div>
      <div className="card-sport p-4 border border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <Icon name="Bell" size={18} className="text-yellow-400 mt-0.5" />
          <div>
            <p className="font-display font-semibold text-white text-sm">Push-уведомления активны</p>
            <p className="text-xs text-white/40 font-body mt-1">Оповещения о начале матчей, голах и финальных свистках</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {FAVORITES.map((f, i) => (
          <div
            key={f.id}
            className="card-sport p-4 flex items-center justify-between animate-fade-in"
            style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{f.sport}</span>
              <div>
                <p className="font-display font-bold text-white">{f.name}</p>
                <p className="text-xs text-white/40 font-body">{f.type} · {f.nextMatch}</p>
              </div>
            </div>
            <button
              onClick={() => setNotified(n => n.includes(f.id) ? n.filter(x => x !== f.id) : [...n, f.id])}
              className={`p-2 transition-all ${notified.includes(f.id) ? "text-yellow-400" : "text-white/20 hover:text-white/60"}`}
            >
              <Icon name={notified.includes(f.id) ? "Bell" : "BellOff"} size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="card-sport p-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-red-600 flex items-center justify-center font-display font-bold text-2xl text-white shrink-0">
          АС
        </div>
        <div>
          <p className="font-display font-bold text-white text-xl">Алексей Смирнов</p>
          <p className="text-white/40 font-body text-sm">Болельщик с 2021 года</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 font-display font-semibold border border-red-600/30">PRO</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { val: "47", label: "Матчей просмотрено" },
          { val: "12", label: "В избранном" },
          { val: "3", label: "Лиги" },
        ].map((s, i) => (
          <div key={i} className="card-sport p-4 text-center">
            <p className="font-display font-bold text-2xl text-white">{s.val}</p>
            <p className="text-xs text-white/40 font-body mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {[
          { icon: "Bell", label: "Push-уведомления", desc: "Включены" },
          { icon: "Heart", label: "Любимые команды", desc: "3 команды" },
          { icon: "Globe", label: "Регион", desc: "Россия" },
          { icon: "Settings", label: "Настройки", desc: "" },
          { icon: "HelpCircle", label: "Поддержка", desc: "" },
        ].map((item, i) => (
          <div
            key={i}
            className="card-sport p-4 flex items-center justify-between cursor-pointer animate-fade-in"
            style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}
          >
            <div className="flex items-center gap-3">
              <Icon name={item.icon} fallback="CircleAlert" size={18} className="text-red-500" />
              <span className="font-body text-white">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.desc && <span className="text-xs text-white/30 font-body">{item.desc}</span>}
              <Icon name="ChevronRight" size={16} className="text-white/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("results");

  const renderContent = () => {
    switch (activeTab) {
      case "results": return <ResultsTab />;
      case "schedule": return <ScheduleTab />;
      case "stats": return <StatsTab />;
      case "tournaments": return <TournamentsTab />;
      case "ratings": return <RatingsTab />;
      case "favorites": return <FavoritesTab />;
      case "profile": return <ProfileTab />;
    }
  };

  const liveCount = MATCHES.filter(m => m.status === "live").length;

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b border-white/10"
        style={{ background: "rgba(13,13,13,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 flex items-center justify-center">
              <Icon name="Zap" size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-xl tracking-wider">
              SPORT<span className="text-red-500">ZONE</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {liveCount > 0 && (
              <div className="flex items-center gap-2 border border-red-600/40 px-3 py-1">
                <span className="live-dot" />
                <span className="font-display font-semibold text-red-500 text-xs">{liveCount} LIVE</span>
              </div>
            )}
            <button className="relative p-2 text-white/50 hover:text-white transition-colors">
              <Icon name="Bell" size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="p-2 text-white/50 hover:text-white transition-colors">
              <Icon name="Search" size={20} />
            </button>
          </div>
        </div>

        {/* Sport filter */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {["Все", "⚽ Футбол", "🏒 Хоккей", "🏀 Баскет", "🎾 Теннис"].map((s, i) => (
            <button
              key={i}
              className={`text-xs font-display font-semibold px-3 py-1.5 whitespace-nowrap transition-all ${
                i === 0
                  ? "bg-red-600 text-white"
                  : "text-white/40 hover:text-white border border-white/10 hover:border-white/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {renderContent()}
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
        style={{ background: "rgba(13,13,13,0.98)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-2xl mx-auto flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition-all ${
                activeTab === tab.id ? "text-red-500" : "text-white/25 hover:text-white/60"
              }`}
            >
              <Icon name={tab.icon} fallback="Activity" size={18} />
              <span className="text-[9px] font-display font-semibold uppercase tracking-wide leading-none">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-red-500" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}