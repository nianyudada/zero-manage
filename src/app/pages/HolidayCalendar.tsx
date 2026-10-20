import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ── Holiday/workday data ──────────────────────────────────────
type DayMark = { type: 'holiday' | 'workday'; name: string };

const MARK: Record<string, DayMark> = {
  // ── 2024 ──────────────────────────────────────────────────
  '2024-01-01': { type: 'holiday', name: '元旦' },
  '2024-02-04': { type: 'workday', name: '调休' },
  '2024-02-10': { type: 'holiday', name: '春节' },
  '2024-02-11': { type: 'holiday', name: '春节' },
  '2024-02-12': { type: 'holiday', name: '春节' },
  '2024-02-13': { type: 'holiday', name: '春节' },
  '2024-02-14': { type: 'holiday', name: '春节' },
  '2024-02-15': { type: 'holiday', name: '春节' },
  '2024-02-16': { type: 'holiday', name: '春节' },
  '2024-02-17': { type: 'holiday', name: '春节' },
  '2024-02-18': { type: 'workday', name: '调休' },
  '2024-04-04': { type: 'holiday', name: '清明节' },
  '2024-04-05': { type: 'holiday', name: '清明节' },
  '2024-04-06': { type: 'holiday', name: '清明节' },
  '2024-04-28': { type: 'workday', name: '调休' },
  '2024-05-01': { type: 'holiday', name: '劳动节' },
  '2024-05-02': { type: 'holiday', name: '劳动节' },
  '2024-05-03': { type: 'holiday', name: '劳动节' },
  '2024-05-04': { type: 'holiday', name: '劳动节' },
  '2024-05-05': { type: 'holiday', name: '劳动节' },
  '2024-05-11': { type: 'workday', name: '调休' },
  '2024-06-08': { type: 'workday', name: '调休' },
  '2024-06-10': { type: 'holiday', name: '端午节' },
  '2024-06-11': { type: 'holiday', name: '端午节' },
  '2024-06-12': { type: 'holiday', name: '端午节' },
  '2024-09-14': { type: 'workday', name: '调休' },
  '2024-09-15': { type: 'holiday', name: '中秋节' },
  '2024-09-16': { type: 'holiday', name: '中秋节' },
  '2024-09-17': { type: 'holiday', name: '中秋节' },
  '2024-09-29': { type: 'workday', name: '调休' },
  '2024-10-01': { type: 'holiday', name: '国庆节' },
  '2024-10-02': { type: 'holiday', name: '国庆节' },
  '2024-10-03': { type: 'holiday', name: '国庆节' },
  '2024-10-04': { type: 'holiday', name: '国庆节' },
  '2024-10-05': { type: 'holiday', name: '国庆节' },
  '2024-10-06': { type: 'holiday', name: '国庆节' },
  '2024-10-07': { type: 'holiday', name: '国庆节' },
  '2024-10-12': { type: 'workday', name: '调休' },
  // ── 2025 ──────────────────────────────────────────────────
  '2025-01-01': { type: 'holiday', name: '元旦' },
  '2025-01-26': { type: 'workday', name: '调休' },
  '2025-01-28': { type: 'holiday', name: '春节' },
  '2025-01-29': { type: 'holiday', name: '春节' },
  '2025-01-30': { type: 'holiday', name: '春节' },
  '2025-01-31': { type: 'holiday', name: '春节' },
  '2025-02-01': { type: 'holiday', name: '春节' },
  '2025-02-02': { type: 'holiday', name: '春节' },
  '2025-02-03': { type: 'holiday', name: '春节' },
  '2025-02-04': { type: 'holiday', name: '春节' },
  '2025-02-08': { type: 'workday', name: '调休' },
  '2025-04-04': { type: 'holiday', name: '清明节' },
  '2025-04-05': { type: 'holiday', name: '清明节' },
  '2025-04-06': { type: 'holiday', name: '清明节' },
  '2025-04-27': { type: 'workday', name: '调休' },
  '2025-05-01': { type: 'holiday', name: '劳动节' },
  '2025-05-02': { type: 'holiday', name: '劳动节' },
  '2025-05-03': { type: 'holiday', name: '劳动节' },
  '2025-05-04': { type: 'holiday', name: '劳动节' },
  '2025-05-05': { type: 'holiday', name: '劳动节' },
  '2025-05-10': { type: 'workday', name: '调休' },
  '2025-05-31': { type: 'holiday', name: '端午节' },
  '2025-06-01': { type: 'holiday', name: '端午节' },
  '2025-06-02': { type: 'holiday', name: '端午节' },
  '2025-09-28': { type: 'workday', name: '调休' },
  '2025-10-01': { type: 'holiday', name: '国庆节' },
  '2025-10-02': { type: 'holiday', name: '国庆节' },
  '2025-10-03': { type: 'holiday', name: '国庆节' },
  '2025-10-04': { type: 'holiday', name: '国庆节' },
  '2025-10-05': { type: 'holiday', name: '国庆节' },
  '2025-10-06': { type: 'holiday', name: '中秋节' },
  '2025-10-07': { type: 'holiday', name: '国庆节' },
  '2025-10-11': { type: 'workday', name: '调休' },
  // ── 2026 ──────────────────────────────────────────────────
  '2026-01-01': { type: 'holiday', name: '元旦' },
  '2026-01-02': { type: 'holiday', name: '元旦' },
  '2026-01-03': { type: 'holiday', name: '元旦' },
  '2026-02-14': { type: 'workday', name: '调休' },
  '2026-02-17': { type: 'holiday', name: '春节' },
  '2026-02-18': { type: 'holiday', name: '春节' },
  '2026-02-19': { type: 'holiday', name: '春节' },
  '2026-02-20': { type: 'holiday', name: '春节' },
  '2026-02-21': { type: 'holiday', name: '春节' },
  '2026-02-22': { type: 'holiday', name: '春节' },
  '2026-02-23': { type: 'holiday', name: '春节' },
  '2026-02-28': { type: 'workday', name: '调休' },
  '2026-04-04': { type: 'holiday', name: '清明节' },
  '2026-04-05': { type: 'holiday', name: '清明节' },
  '2026-04-06': { type: 'holiday', name: '清明节' },
  '2026-04-26': { type: 'workday', name: '调休' },
  '2026-05-01': { type: 'holiday', name: '劳动节' },
  '2026-05-02': { type: 'holiday', name: '劳动节' },
  '2026-05-03': { type: 'holiday', name: '劳动节' },
  '2026-05-04': { type: 'holiday', name: '劳动节' },
  '2026-05-05': { type: 'holiday', name: '劳动节' },
  '2026-05-09': { type: 'workday', name: '调休' },
  '2026-06-19': { type: 'holiday', name: '端午节' },
  '2026-06-20': { type: 'holiday', name: '端午节' },
  '2026-06-21': { type: 'holiday', name: '端午节' },
  '2026-09-25': { type: 'holiday', name: '中秋节' },
  '2026-09-26': { type: 'holiday', name: '中秋节' },
  '2026-09-27': { type: 'holiday', name: '中秋节' },
  '2026-10-01': { type: 'holiday', name: '国庆节' },
  '2026-10-02': { type: 'holiday', name: '国庆节' },
  '2026-10-03': { type: 'holiday', name: '国庆节' },
  '2026-10-04': { type: 'holiday', name: '国庆节' },
  '2026-10-05': { type: 'holiday', name: '国庆节' },
  '2026-10-06': { type: 'holiday', name: '国庆节' },
  '2026-10-07': { type: 'holiday', name: '国庆节' },
  '2026-10-10': { type: 'workday', name: '调休' },
  // ── 2027 ──────────────────────────────────────────────────
  '2027-01-01': { type: 'holiday', name: '元旦' },
  '2027-01-02': { type: 'holiday', name: '元旦' },
  '2027-01-03': { type: 'holiday', name: '元旦' },
  '2027-01-30': { type: 'workday', name: '调休' },
  '2027-02-06': { type: 'holiday', name: '春节' },
  '2027-02-07': { type: 'holiday', name: '春节' },
  '2027-02-08': { type: 'holiday', name: '春节' },
  '2027-02-09': { type: 'holiday', name: '春节' },
  '2027-02-10': { type: 'holiday', name: '春节' },
  '2027-02-11': { type: 'holiday', name: '春节' },
  '2027-02-12': { type: 'holiday', name: '春节' },
  '2027-02-20': { type: 'workday', name: '调休' },
  '2027-04-05': { type: 'holiday', name: '清明节' },
  '2027-04-06': { type: 'holiday', name: '清明节' },
  '2027-04-07': { type: 'holiday', name: '清明节' },
  '2027-04-25': { type: 'workday', name: '调休' },
  '2027-05-01': { type: 'holiday', name: '劳动节' },
  '2027-05-02': { type: 'holiday', name: '劳动节' },
  '2027-05-03': { type: 'holiday', name: '劳动节' },
  '2027-05-04': { type: 'holiday', name: '劳动节' },
  '2027-05-05': { type: 'holiday', name: '劳动节' },
  '2027-05-08': { type: 'workday', name: '调休' },
  '2027-06-09': { type: 'holiday', name: '端午节' },
  '2027-06-10': { type: 'holiday', name: '端午节' },
  '2027-06-11': { type: 'holiday', name: '端午节' },
  '2027-10-01': { type: 'holiday', name: '国庆节' },
  '2027-10-02': { type: 'holiday', name: '国庆节' },
  '2027-10-03': { type: 'holiday', name: '国庆节' },
  '2027-10-04': { type: 'holiday', name: '国庆节' },
  '2027-10-05': { type: 'holiday', name: '国庆节' },
  '2027-10-06': { type: 'holiday', name: '国庆节' },
  '2027-10-07': { type: 'holiday', name: '国庆节' },
  '2027-10-09': { type: 'workday', name: '调休' },
  '2027-10-15': { type: 'holiday', name: '中秋节' },
  '2027-10-16': { type: 'holiday', name: '中秋节' },
  '2027-10-17': { type: 'holiday', name: '中秋节' },
};

// ── Helpers ───────────────────────────────────────────────────
function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

// 0=Mon … 6=Sun  (Monday-first week)
function firstWeekdayOf(y: number, m: number) {
  const d = new Date(y, m, 1).getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

const TODAY = new Date();
const TODAY_KEY = dateKey(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());

const WEEK_HEADERS = ['一', '二', '三', '四', '五', '六', '日'];
const MONTH_NAMES  = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const YEARS = [2024, 2025, 2026, 2027];

// ── Cell ─────────────────────────────────────────────────────
function CalCell({ y, m, d }: { y: number; m: number; d: number }) {
  const key   = dateKey(y, m, d);
  const mark  = MARK[key];
  const dow   = new Date(y, m, d).getDay(); // 0=Sun, 6=Sat
  const isWkd = dow === 0 || dow === 6;
  const isToday = key === TODAY_KEY;

  const isHoliday  = mark?.type === 'holiday';
  const isWorkday  = mark?.type === 'workday';
  // A weekend that's a makeup workday should appear as a work cell
  const isRestDay  = isHoliday || (isWkd && !isWorkday);

  let bg   = '#ffffff';
  let fg   = '#1e293b';
  let ring = false;

  if (isHoliday)       { bg = '#fff1f2'; fg = '#dc2626'; }
  else if (isWorkday)  { bg = '#fffbeb'; fg = '#d97706'; }
  else if (isWkd)      { bg = '#f8fafc'; fg = '#94a3b8'; }

  if (isToday) { ring = true; }

  return (
    <div
      className="relative flex flex-col items-start p-2 select-none transition-colors hover:brightness-[0.97]"
      style={{
        background: bg,
        border: ring ? '2px solid #2563eb' : '1px solid #f1f5f9',
        borderRadius: 8,
        minHeight: 76,
      }}
    >
      {/* Today dot */}
      {isToday && (
        <span
          className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full"
          style={{ background: '#2563eb' }}
        />
      )}

      {/* 休 / 班 badge */}
      {(isHoliday || isWorkday) && (
        <span
          className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1 py-px rounded"
          style={
            isHoliday
              ? { background: '#fecaca', color: '#b91c1c' }
              : { background: '#fde68a', color: '#92400e' }
          }
        >
          {isHoliday ? '休' : '班'}
        </span>
      )}

      {/* Date number */}
      <span
        className="text-sm font-semibold leading-none mt-0.5"
        style={{ color: isToday ? '#2563eb' : fg, fontVariantNumeric: 'tabular-nums' }}
      >
        {d}
      </span>

      {/* Holiday name */}
      {mark && (
        <span
          className="mt-1.5 text-[10px] leading-tight font-medium line-clamp-2 max-w-full"
          style={{ color: isHoliday ? '#ef4444' : '#b45309' }}
        >
          {mark.name}
        </span>
      )}

      {/* 今 label for today */}
      {isToday && (
        <span className="mt-auto text-[9px] font-semibold" style={{ color: '#2563eb' }}>今</span>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function HolidayCalendar() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const days       = daysInMonth(year, month);
  const startCol   = firstWeekdayOf(year, month); // 0=Mon
  const totalCells = Math.ceil((days + startCol) / 7) * 7;

  // Stats for current month
  const monthHolidays = Array.from({ length: days }, (_, i) => i + 1)
    .map(d => MARK[dateKey(year, month, d)]);
  const holidayCount  = monthHolidays.filter(m => m?.type === 'holiday').length;
  const workdayCount  = monthHolidays.filter(m => m?.type === 'workday').length;

  // Upcoming holidays in current year (from today if same year)
  const yearEvents = Object.entries(MARK)
    .filter(([k, v]) => k.startsWith(`${year}-`) && v.type === 'holiday')
    .reduce<{ name: string; start: string; end: string }[]>((acc, [k, v]) => {
      const last = acc[acc.length - 1];
      if (last && last.name === v.name && last.end >= k.slice(0, 7)) {
        // possibly consecutive — check
        const prev = last.end;
        const prevDate = new Date(prev);
        prevDate.setDate(prevDate.getDate() + 1);
        const nextExpected = prevDate.toISOString().slice(0, 10);
        if (nextExpected === k) { last.end = k; return acc; }
      }
      acc.push({ name: v.name, start: k, end: k });
      return acc;
    }, []);

  // dedupe by name + start
  const uniqueEvents = yearEvents.filter((e, i, arr) =>
    arr.findIndex(x => x.name === e.name && x.start.slice(0, 7) === e.start.slice(0, 7)) === i
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            节假日情况
          </h1>
          <p className="text-sm text-gray-500">法定节假日、调休工作日与补休安排</p>
        </div>

        {/* Year events summary */}
        <div className="flex flex-wrap gap-2">
          {uniqueEvents.slice(0, 6).map((e, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-full font-medium border"
              style={{
                background: e.start <= new Date().toISOString().slice(0,10) ? '#f1f5f9' : '#fef2f2',
                color:      e.start <= new Date().toISOString().slice(0,10) ? '#64748b' : '#dc2626',
                borderColor:e.start <= new Date().toISOString().slice(0,10) ? '#e2e8f0' : '#fecaca',
              }}
            >
              {e.name} · {e.start.slice(5).replace('-', '/')}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        {/* ── Calendar card ───────────────────────────────── */}
        <Card className="flex-1 overflow-hidden min-w-0">
          {/* Month nav */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: '#f1f5f9' }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg text-gray-500 hover:text-gray-900"
              onClick={prevMonth}
              disabled={year === YEARS[0] && month === 0}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="flex items-center gap-3">
              {/* Year select */}
              <Select
                value={String(year)}
                onValueChange={(v) => setYear(Number(v))}
              >
                <SelectTrigger
                  className="h-8 w-24 text-sm border-none shadow-none bg-gray-50 hover:bg-gray-100 font-semibold"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (
                    <SelectItem key={y} value={String(y)}>{y} 年</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Month pills */}
              <div className="flex gap-1">
                {MONTH_NAMES.map((name, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMonth(idx)}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                    style={
                      idx === month
                        ? { background: '#2563eb', color: '#fff' }
                        : { background: 'transparent', color: '#64748b' }
                    }
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg text-gray-500 hover:text-gray-900"
              onClick={nextMonth}
              disabled={year === YEARS[YEARS.length - 1] && month === 11}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Week headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: '#f1f5f9' }}>
            {WEEK_HEADERS.map((h, i) => (
              <div
                key={h}
                className="py-2 text-center text-xs font-semibold"
                style={{ color: i >= 5 ? '#94a3b8' : '#64748b', background: '#fafafa' }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1 p-3">
            {Array.from({ length: totalCells }).map((_, idx) => {
              const dayNum = idx - startCol + 1;
              if (dayNum < 1 || dayNum > days) {
                return <div key={idx} className="rounded-lg" style={{ minHeight: 76, background: '#f9fafb' }} />;
              }
              return <CalCell key={idx} y={year} m={month} d={dayNum} />;
            })}
          </div>

          {/* Month footer */}
          <div
            className="px-5 py-3 border-t flex items-center justify-between"
            style={{ borderColor: '#f1f5f9', background: '#fafafa' }}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full" style={{ background: '#f87171' }} />
                本月假期 <strong className="text-gray-800 ml-0.5">{holidayCount}</strong> 天
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full" style={{ background: '#fbbf24' }} />
                调休工作日 <strong className="text-gray-800 ml-0.5">{workdayCount}</strong> 天
              </span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3">
              {[
                { label: '法定节假日', badge: '休', bg: '#fecaca', fg: '#b91c1c', cell: '#fff1f2' },
                { label: '调休工作日', badge: '班', bg: '#fde68a', fg: '#92400e', cell: '#fffbeb' },
                { label: '周末',       badge: null, bg: null,     fg: null,      cell: '#f8fafc' },
                { label: '今日',       badge: null, bg: '#2563eb', fg: '#fff',   cell: null },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  {item.badge ? (
                    <span
                      className="text-[9px] font-bold px-1 py-px rounded"
                      style={{ background: item.bg!, color: item.fg! }}
                    >
                      {item.badge}
                    </span>
                  ) : item.bg ? (
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.bg }} />
                  ) : (
                    <span className="w-3 h-3 rounded border" style={{ background: item.cell!, borderColor: '#e2e8f0' }} />
                  )}
                  <span className="text-xs text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ── Side panel: full-year timeline ─────────────── */}
        <div className="w-56 flex-shrink-0">
          <Card className="overflow-hidden">
            <div
              className="px-4 py-3 border-b text-sm font-semibold text-gray-800"
              style={{ borderColor: '#f1f5f9' }}
            >
              {year} 年节假日
            </div>
            <div className="py-2 overflow-y-auto" style={{ maxHeight: 520 }}>
              {(() => {
                // Build year-level holiday list
                const items: { name: string; dateRange: string; days: number; passed: boolean }[] = [];
                const today = new Date().toISOString().slice(0, 10);

                // Group consecutive holiday days by name+period
                const groups: Record<string, { dates: string[] }> = {};
                Object.entries(MARK)
                  .filter(([k, v]) => k.startsWith(`${year}-`) && v.type === 'holiday')
                  .sort(([a], [b]) => a.localeCompare(b))
                  .forEach(([k, v]) => {
                    const gKey = `${v.name}-${k.slice(5, 7)}`;
                    if (!groups[gKey]) groups[gKey] = { dates: [] };
                    groups[gKey].dates.push(k);
                  });

                Object.entries(groups).forEach(([, g]) => {
                  const start = g.dates[0];
                  const end   = g.dates[g.dates.length - 1];
                  const name  = MARK[start].name;
                  const dateRange = start === end
                    ? start.slice(5).replace('-', '月') + '日'
                    : `${start.slice(5).replace('-', '月')}日—${end.slice(5).replace('-', '月')}日`;
                  items.push({ name, dateRange, days: g.dates.length, passed: end < today });
                });

                // Also add workdays
                const workdays = Object.entries(MARK)
                  .filter(([k, v]) => k.startsWith(`${year}-`) && v.type === 'workday')
                  .sort(([a], [b]) => a.localeCompare(b));

                return (
                  <div className="divide-y divide-gray-50">
                    <div className="px-4 pt-1 pb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">节假日</p>
                      {items.map((item, i) => (
                        <div key={i} className="flex items-start justify-between py-2">
                          <div>
                            <p
                              className="text-xs font-medium"
                              style={{ color: item.passed ? '#94a3b8' : '#1e293b' }}
                            >
                              {item.name}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>
                              {item.dateRange}
                            </p>
                          </div>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 mt-0.5"
                            style={
                              item.passed
                                ? { background: '#f1f5f9', color: '#94a3b8' }
                                : { background: '#fef2f2', color: '#dc2626' }
                            }
                          >
                            {item.days}天
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="px-4 pt-2 pb-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">调休工作日</p>
                      {workdays.map(([k], i) => (
                        <div key={i} className="flex items-center justify-between py-1.5">
                          <p
                            className="text-xs"
                            style={{ color: k < today ? '#94a3b8' : '#92400e' }}
                          >
                            {k.slice(5).replace('-', '月')}日
                          </p>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                            style={
                              k < today
                                ? { background: '#f1f5f9', color: '#94a3b8' }
                                : { background: '#fde68a', color: '#92400e' }
                            }
                          >
                            班
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
