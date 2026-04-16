import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const RU_MATCHES_URL = "https://functions.poehali.dev/ad1fe600-20e4-4356-95ea-5a86680cd130";

type Tab = "results" | "schedule" | "stats" | "tournaments" | "ratings" | "favorites" | "profile";
type SportFilter = "all" | "football" | "hockey" | "basketball" | "volleyball";

interface Match {
  id: string | number;
  home: string;
  away: string;
  scoreHome: number | null;
  scoreAway: number | null;
  status: "live" | "scheduled" | "finished" | "postponed";
  time: string;
  date: string;
  league: string;
  sport: string;
  utcDate: string;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "results", label: "Результаты", icon: "Activity" },
  { id: "schedule", label: "Расписание", icon: "Calendar" },
  { id: "stats", label: "Статистика", icon: "BarChart3" },
  { id: "tournaments", label: "Турниры", icon: "Trophy" },
  { id: "ratings", label: "Рейтинги", icon: "TrendingUp" },
  { id: "favorites", label: "Избранное", icon: "Star" },
  { id: "profile", label: "Профиль", icon: "User" },
];

const TOURNAMENTS = [
  { name: "АПЛ — Премьер-лига", sport: "⚽", teams: 20, stage: "34 тур", leader: "Арсенал" },
  { name: "Лига Чемпионов УЕФА", sport: "⚽", teams: 32, stage: "Полуфинал", leader: "Реал Мадрид" },
  { name: "Ла Лига", sport: "⚽", teams: 20, stage: "33 тур", leader: "Барселона" },
  { name: "Серия А", sport: "⚽", teams: 20, stage: "34 тур", leader: "Интер" },
];

const RATINGS = [
  { pos: 1, team: "Арсенал", pts: 76, w: 23, d: 7, l: 3, diff: "+48", change: "up" },
  { pos: 2, team: "Ливерпуль", pts: 71, w: 22, d: 5, l: 6, diff: "+39", change: "same" },
  { pos: 3, team: "Ман Сити", pts: 68, w: 21, d: 5, l: 7, diff: "+33", change: "up" },
  { pos: 4, team: "Челси", pts: 63, w: 19, d: 6, l: 8, diff: "+18", change: "down" },
  { pos: 5, team: "Тоттенхэм", pts: 58, w: 17, d: 7, l: 9, diff: "+12", change: "down" },
  { pos: 6, team: "Ман Юнайтед", pts: 54, w: 16, d: 6, l: 11, diff: "+5", change: "up" },
  { pos: 7, team: "Ньюкасл", pts: 49, w: 14, d: 7, l: 12, diff: "-2", change: "same" },
  { pos: 8, team: "Астон Вилла", pts: 47, w: 13, d: 8, l: 12, diff: "-5", change: "down" },
];

const STATS = [
  { name: "Эрлинг Холанд", team: "Ман Сити", stat: 26, label: "голов", sport: "⚽" },
  { name: "Коул Палмер", team: "Челси", stat: 21, label: "голов", sport: "⚽" },
  { name: "Мохамед Салах", team: "Ливерпуль", stat: 19, label: "голов", sport: "⚽" },
  { name: "Букайо Сака", team: "Арсенал", stat: 17, label: "голов", sport: "⚽" },
  { name: "Олли Уоткинс", team: "Астон Вилла", stat: 15, label: "голов", sport: "⚽" },
];

const FAVORITES = [
  { id: 1, name: "Арсенал", type: "Команда", sport: "⚽", nextMatch: "vs Ман Сити · скоро" },
  { id: 2, name: "Лига Чемпионов", type: "Турнир", sport: "⚽", nextMatch: "Полуфинал · 29 апр" },
  { id: 3, name: "Реал Мадрид", type: "Команда", sport: "⚽", nextMatch: "vs Барселона · Эль-Класико" },
];

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 text-xs font-display font-semibold text-red-500">
      <span className="live-dot" />
      LIVE
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="card-sport p-4 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-3 w-20 bg-white/10 rounded" />
        <div className="h-3 w-10 bg-white/10 rounded" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-white/10 rounded" />
        <div className="flex gap-3 mx-4">
          <div className="h-7 w-6 bg-white/10 rounded" />
          <div className="h-7 w-6 bg-white/10 rounded" />
        </div>
        <div className="h-5 w-24 bg-white/10 rounded ml-auto" />
      </div>
    </div>
  );
}

function MatchCard({ match, delay }: { match: Match; delay: number }) {
  const showScore = match.status === "live" || match.status === "finished";
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
          {match.status === "postponed" && <span className="text-yellow-500/60">Перенесён</span>}
        </div>
        <span className="text-xs text-white/40 font-display">{match.time}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-display font-semibold text-white text-lg leading-tight">{match.home}</p>
        </div>
        <div className="flex items-center gap-3 mx-4">
          {showScore ? (
            <>
              <span className={`font-display font-bold text-2xl ${match.status === "live" ? "text-white" : "text-white/60"}`}>
                {match.scoreHome ?? "–"}
              </span>
              <span className="text-white/20 font-display text-xl">:</span>
              <span className={`font-display font-bold text-2xl ${match.status === "live" ? "text-white" : "text-white/60"}`}>
                {match.scoreAway ?? "–"}
              </span>
            </>
          ) : (
            <span className="font-display font-bold text-xl text-white/30">{match.time || "—"}</span>
          )}
        </div>
        <div className="flex-1 text-right">
          <p className="font-display font-semibold text-white text-lg leading-tight">{match.away}</p>
        </div>
      </div>
    </div>
  );
}

function ResultsTab({ matches, loading, error }: { matches: Match[]; loading: boolean; error: string | null }) {
  const live = matches.filter(m => m.status === "live");
  const scheduled = matches.filter(m => m.status === "scheduled");
  const finished = matches.filter(m => m.status === "finished");

  return (
    <div className="space-y-6 animate-fade-in">
      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {error && !loading && (
        <div className="card-sport p-4 border border-red-500/20">
          <p className="text-white/50 font-body text-sm">{error}</p>
        </div>
      )}
      {!loading && !error && (
        <>
          {live.length > 0 && (
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
          )}
          {scheduled.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-white/50 mb-3 uppercase tracking-wider">Предстоящие</h2>
              <div className="space-y-2">
                {scheduled.map((m, i) => <MatchCard key={m.id} match={m} delay={i} />)}
              </div>
            </div>
          )}
          {finished.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-white/50 mb-3 uppercase tracking-wider">Завершённые</h2>
              <div className="space-y-2">
                {finished.map((m, i) => <MatchCard key={m.id} match={m} delay={i} />)}
              </div>
            </div>
          )}
          {matches.length === 0 && (
            <div className="text-center py-16">
              <p className="font-display text-4xl text-white/10 mb-3">🏆</p>
              <p className="font-display font-semibold text-white/30 uppercase tracking-wider">Событий нет</p>
              <p className="text-white/20 font-body text-sm mt-2">Попробуй обновить</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ScheduleTab({ matches, loading }: { matches: Match[]; loading: boolean }) {
  const scheduled = matches.filter(m => m.status === "scheduled");
  const grouped: Record<string, Match[]> = {};
  scheduled.forEach(m => {
    if (!grouped[m.date]) grouped[m.date] = [];
    grouped[m.date].push(m);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {loading && (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div>
      )}
      {!loading && Object.keys(grouped).length === 0 && (
        <div className="text-center py-16">
          <p className="font-display text-4xl text-white/10 mb-3">📅</p>
          <p className="font-display font-semibold text-white/30 uppercase tracking-wider">Нет запланированных матчей</p>
        </div>
      )}
      {!loading && Object.entries(grouped).map(([date, dayMatches], gi) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-display font-semibold text-red-500 text-sm uppercase tracking-widest">{date}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="space-y-2">
            {dayMatches.map((m, i) => (
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

function StatsTab({ matches }: { matches: Match[] }) {
  const totalToday = matches.length;
  const liveNow = matches.filter(m => m.status === "live").length;
  const leagueCount = new Set(matches.map(m => m.league)).size;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { val: totalToday || "—", label: "Матчей сегодня" },
          { val: liveNow || "—", label: "LIVE сейчас" },
          { val: leagueCount || "7", label: "Лиг" },
        ].map((s, i) => (
          <div key={i} className="card-sport p-4 text-center">
            <p className="font-display font-bold text-3xl neon-text">{s.val}</p>
            <p className="text-xs text-white/40 font-body mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="font-display text-xl font-bold text-white mb-4 uppercase">Топ бомбардиры АПЛ</h2>
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
        <h2 className="font-display text-xl font-bold text-white uppercase">АПЛ · 2024/25</h2>
        <span className="text-xs text-red-500 font-display font-semibold border border-red-500/30 px-2 py-1">34 ТУР</span>
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
            <p className="text-xs text-white/40 font-body mt-1">Оповещения о начале матчей, голах и результатах</p>
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

const SPORT_FILTERS: { id: SportFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "football", label: "⚽ Футбол" },
  { id: "hockey", label: "🏒 Хоккей" },
  { id: "basketball", label: "🏀 Баскет" },
  { id: "volleyball", label: "🏐 Волейбол" },
];

const SPORT_EMOJI_MAP: Record<string, SportFilter> = {
  "⚽": "football",
  "🏒": "hockey",
  "🏀": "basketball",
  "🏐": "volleyball",
};

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("results");
  const [sportFilter, setSportFilter] = useState<SportFilter>("all");
  const [ruMatches, setRuMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(RU_MATCHES_URL).then(r => r.json());
      if (!res.error) {
        setRuMatches(res.matches || []);
      }
      setLastUpdated(new Date());
    } catch {
      setError("Не удалось загрузить данные. Проверь соединение.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 60_000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  // "Все" — только live и scheduled, сортировка по времени начала
  // Остальные фильтры — все статусы по виду спорта
  const filteredMatches = ruMatches.filter(m => {
    if (sportFilter === "all") return m.status === "live" || m.status === "scheduled";
    return SPORT_EMOJI_MAP[m.sport] === sportFilter;
  }).sort((a, b) => {
    if (sportFilter === "all") {
      const order = { live: 0, scheduled: 1, finished: 2, postponed: 3 };
      const os = order[a.status] - order[b.status];
      if (os !== 0) return os;
      return a.utcDate.localeCompare(b.utcDate);
    }
    const order = { live: 0, scheduled: 1, finished: 2, postponed: 3 };
    const os = order[a.status] - order[b.status];
    if (os !== 0) return os;
    return a.utcDate.localeCompare(b.utcDate);
  });

  const liveCount = ruMatches.filter(m => m.status === "live").length;

  const renderContent = () => {
    switch (activeTab) {
      case "results": return <ResultsTab matches={filteredMatches} loading={loading} error={error} />;
      case "schedule": return <ScheduleTab matches={filteredMatches} loading={loading} />;
      case "stats": return <StatsTab matches={ruMatches} />;
      case "tournaments": return <TournamentsTab />;
      case "ratings": return <RatingsTab />;
      case "favorites": return <FavoritesTab />;
      case "profile": return <ProfileTab />;
    }
  };

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
            <button
              onClick={() => { setLoading(true); fetchMatches(); }}
              className="p-2 text-white/50 hover:text-white transition-colors"
              title="Обновить"
            >
              <Icon name={loading ? "Loader" : "RefreshCw"} size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button className="p-2 text-white/50 hover:text-white transition-colors">
              <Icon name="Search" size={20} />
            </button>
          </div>
        </div>

        {/* Last updated + sport filter */}
        <div className="max-w-2xl mx-auto px-4 pb-2">
          {lastUpdated && (
            <p className="text-[10px] text-white/20 font-body mb-2">
              Обновлено: {lastUpdated.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          <div className="flex gap-2 overflow-x-auto">
            {SPORT_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSportFilter(f.id)}
                className={`text-xs font-display font-semibold px-3 py-1.5 whitespace-nowrap transition-all ${
                  sportFilter === f.id
                    ? f.id === "ru" ? "bg-white text-black" : "bg-red-600 text-white"
                    : "text-white/40 hover:text-white border border-white/10 hover:border-white/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
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