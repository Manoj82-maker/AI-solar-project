import React, { useState } from 'react';
import { DailySummary, HouseData, LoadKey, LoadTimer } from '../types/microgrid';
import { Home, Search, X, CheckCircle, Power, Sliders, ToggleLeft, ToggleRight, Clock, Timer, BarChart3 } from 'lucide-react';

interface NeighborhoodGridProps {
  houses: HouseData[];
  selectedHouseId: number | null;
  setSelectedHouseId: (id: number | null) => void;
  totalSolarKw: number;
  avgSolarKw: number;
  dailySummary: DailySummary;
  activeTimers: LoadTimer[];
  onApplyLoadPreset: (
    target: 'all' | 'odd' | 'even' | number,
    preset: 'all_active' | 'three_on' | 'two_on' | 'one_on' | 'all_off'
  ) => void;
  onToggleLoadSwitch: (
    target: 'all' | 'odd' | 'even' | number,
    loadKey: LoadKey,
    forceValue?: boolean
  ) => void;
  onStartLoadTimer: (
    target: 'all' | 'odd' | 'even' | number,
    loadKeys: LoadKey[],
    durationMinutes: number,
    label?: string
  ) => void;
  onCancelLoadTimer: (timerId: string, turnOffLoads?: boolean) => void;
  onOpenAnalytics: () => void;
}

const LOAD_DEFINITIONS: { key: LoadKey; watts: number; label: string; tier: string }[] = [
  { key: 'load100W', watts: 100, label: 'Load 1 · 100 W', tier: 'Tier-1 Necessary' },
  { key: 'load50W', watts: 50, label: 'Load 2 · 50 W', tier: 'Tier-1 Necessary' },
  { key: 'load200W', watts: 200, label: 'Load 3 · 200 W', tier: 'Tier-2 Non-Essential' },
  { key: 'load150W', watts: 150, label: 'Load 4 · 150 W', tier: 'Tier-2 Non-Essential' },
];

function formatDuration(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h === 0) return `${remM}m`;
  if (remM === 0) return `${h}h`;
  return `${h}h ${remM.toString().padStart(2, '0')}m`;
}

export const NeighborhoodGrid: React.FC<NeighborhoodGridProps> = ({
  houses,
  selectedHouseId,
  setSelectedHouseId,
  totalSolarKw,
  avgSolarKw,
  dailySummary,
  activeTimers,
  onApplyLoadPreset,
  onToggleLoadSwitch,
  onStartLoadTimer,
  onCancelLoadTimer,
  onOpenAnalytics,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'odd' | 'even' | 'surplus' | 'deficit'>('all');
  const [switchTarget, setSwitchTarget] = useState<'all' | 'odd' | 'even'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Timer builder state
  const [timerSelectedLoads, setTimerSelectedLoads] = useState<LoadKey[]>([
    'load100W',
    'load50W',
    'load200W',
    'load150W',
  ]);
  const [timerDurationMins, setTimerDurationMins] = useState<number>(120); // default 2 hours

  const selectedHouse = houses.find((h) => h.id === selectedHouseId) || null;

  // Houses matching the switchboard target group (All / Odd / Even)
  const targetHouses = houses.filter((h) => {
    if (switchTarget === 'odd') return h.id % 2 === 1;
    if (switchTarget === 'even') return h.id % 2 === 0;
    return true;
  });

  const totalSwitchedLoadKw = houses.reduce((acc, h) => acc + h.switchedLoadW, 0) / 1000;
  const targetSwitchedLoadKw = targetHouses.reduce((acc, h) => acc + h.switchedLoadW, 0) / 1000;

  const toggleTimerLoadSelection = (key: LoadKey) => {
    setTimerSelectedLoads((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Filter houses based on search and filter bar
  const filteredHouses = houses.filter((h) => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (!h.name.toLowerCase().includes(q) && !h.id.toString().includes(q)) {
        return false;
      }
    }
    if (filterMode === 'odd') return h.id % 2 === 1;
    if (filterMode === 'even') return h.id % 2 === 0;
    if (filterMode === 'surplus') return h.netPowerKw > 0;
    if (filterMode === 'deficit') return h.netPowerKw < 0;
    return true;
  });

  // Calculate grid color based on 0 - 2.0 kW solar generation
  const getCellBgColor = (powerKw: number) => {
    if (powerKw <= 0.05) return 'bg-slate-900 border-slate-800 text-slate-500';
    if (powerKw < 0.6) return 'bg-amber-950/40 border-amber-800/40 text-amber-300';
    if (powerKw < 1.2) return 'bg-amber-900/60 border-amber-600/60 text-amber-200';
    if (powerKw < 1.7) return 'bg-amber-600/30 border-amber-500/70 text-amber-100';
    return 'bg-gradient-to-br from-amber-500/30 to-cyan-500/30 border-cyan-400/80 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)]';
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      
      {/* Top Section Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Home className="w-5 h-5 text-cyan-400" />
            <span>100-House Square Formation Solar Grid (10 × 10 Matrix)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Each house has a 2.0 kW solar PV array plus four switchable loads (100W, 50W, 200W, 150W = 500W max per home).
          </p>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Find House # (1-100)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 w-44 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                filterMode === 'all' ? 'bg-slate-800 text-slate-100 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All (100)
            </button>
            <button
              onClick={() => setFilterMode('odd')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                filterMode === 'odd' ? 'bg-cyan-950 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Odd (50)
            </button>
            <button
              onClick={() => setFilterMode('even')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                filterMode === 'even' ? 'bg-indigo-950 text-indigo-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Even (50)
            </button>
            <button
              onClick={() => setFilterMode('surplus')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                filterMode === 'surplus' ? 'bg-emerald-950 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Surplus &gt; 0
            </button>
            <button
              onClick={() => setFilterMode('deficit')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                filterMode === 'deficit' ? 'bg-amber-950 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Draw &lt; 0
            </button>
          </div>
        </div>
      </div>

      {/* 100-House Master Load Switchboard + Timers + Daily Load Summary */}
      <div className="bg-[#0e1422] border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                100-House Load Switchboard & Duration Timers (100W · 50W · 200W · 150W)
              </h3>
              <p className="text-[11px] text-slate-400">
                Control All, Odd, or Even homes manually or schedule a countdown timer to keep selected loads ON for a set duration.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="text-slate-400">Live Load: </span>
              <span className="text-cyan-300 font-bold tabular-nums">{totalSwitchedLoadKw.toFixed(2)} kW</span>
              <span className="text-slate-500"> / 50.00 kW</span>
            </div>
            <button
              onClick={onOpenAnalytics}
              className="flex items-center gap-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/50 rounded-lg px-3 py-1.5 text-emerald-300 transition-colors"
              title="View full 24-hour load consumption report"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Daily Consumed: <strong className="tabular-nums">{dailySummary.totalLoadEnergyKwh.toFixed(1)} kWh</strong></span>
            </button>
          </div>
        </div>

        {/* Row 1: Manual Switches */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
          {/* Step 1: Target Group (All / Odd / Even) */}
          <div className="xl:col-span-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              1. Target Homes Scope ({targetHouses.length} Homes · {targetSwitchedLoadKw.toFixed(2)} kW ON)
            </span>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setSwitchTarget('all')}
                className={`px-2.5 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
                  switchTarget === 'all'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Homes (100)
              </button>
              <button
                onClick={() => setSwitchTarget('odd')}
                className={`px-2.5 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
                  switchTarget === 'odd'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Odd (#1,3..99)
              </button>
              <button
                onClick={() => setSwitchTarget('even')}
                className={`px-2.5 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
                  switchTarget === 'even'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Even (#2,4..100)
              </button>
            </div>
          </div>

          {/* Step 2: Load Count Presets */}
          <div className="xl:col-span-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              2. Quick Load Count Switches
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => onApplyLoadPreset(switchTarget, 'one_on')}
                className="px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium transition-colors whitespace-nowrap"
                title="Turns ON 100W load only (50W, 200W, 150W OFF)"
              >
                1 Load On (100W)
              </button>
              <button
                onClick={() => onApplyLoadPreset(switchTarget, 'two_on')}
                className="px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium transition-colors whitespace-nowrap"
                title="Turns ON 100W + 50W loads (200W, 150W OFF)"
              >
                2 Loads On (150W)
              </button>
              <button
                onClick={() => onApplyLoadPreset(switchTarget, 'three_on')}
                className="px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium transition-colors whitespace-nowrap"
                title="Turns ON 100W + 50W + 200W loads (150W OFF)"
              >
                3 Loads On (350W)
              </button>
              <button
                onClick={() => onApplyLoadPreset(switchTarget, 'all_active')}
                className="px-2.5 py-1.5 rounded-md bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-600/50 text-emerald-300 font-semibold transition-colors whitespace-nowrap"
                title="Turns ON all 4 loads (100W + 50W + 200W + 150W = 500W)"
              >
                All Loads Active (500W)
              </button>
              <button
                onClick={() => onApplyLoadPreset(switchTarget, 'all_off')}
                className="px-2.5 py-1.5 rounded-md bg-rose-950/50 hover:bg-rose-900/60 border border-rose-700/40 text-rose-300 font-medium transition-colors whitespace-nowrap"
                title="Turns OFF all 4 loads (0W)"
              >
                All Off (0W)
              </button>
            </div>
          </div>

          {/* Step 3: Individual Wattage Breakers for Target Scope */}
          <div className="xl:col-span-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              3. Individual Wattage Switches ({switchTarget.toUpperCase()})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {LOAD_DEFINITIONS.map((def) => {
                const activeCount = targetHouses.filter((h) => h.loads[def.key]).length;
                const allOn = activeCount === targetHouses.length && targetHouses.length > 0;
                const partial = activeCount > 0 && activeCount < targetHouses.length;

                return (
                  <button
                    key={def.key}
                    onClick={() => onToggleLoadSwitch(switchTarget, def.key)}
                    className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all ${
                      allOn
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200'
                        : partial
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-mono font-bold">{def.watts}W</span>
                      {allOn ? (
                        <ToggleRight className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono opacity-80 mt-0.5">
                      {activeCount}/{targetHouses.length} ON
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: Load Duration Timer Scheduler & Active Timers */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          
          {/* Timer Setup Bar */}
          <div className="xl:col-span-7 bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Keep Loads ON Timer ({switchTarget === 'all' ? 'All 100 Homes' : switchTarget === 'odd' ? 'Odd Homes' : 'Even Homes'})</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Auto-switches OFF when simulation timer expires
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Select which loads to keep ON */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-1 text-xs">
                {LOAD_DEFINITIONS.map((def) => {
                  const selected = timerSelectedLoads.includes(def.key);
                  return (
                    <button
                      key={def.key}
                      onClick={() => toggleTimerLoadSelection(def.key)}
                      className={`px-2 py-1 rounded font-mono text-[11px] transition-colors ${
                        selected
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50 font-bold'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {def.watts}W
                    </button>
                  );
                })}
              </div>

              {/* Duration presets */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-1 text-xs">
                {[30, 60, 120, 240, 480].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setTimerDurationMins(mins)}
                    className={`px-2 py-1 rounded font-mono text-[11px] transition-colors ${
                      timerDurationMins === mins
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {formatDuration(mins)}
                  </button>
                ))}
              </div>

              {/* Custom minutes input */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs font-mono">
                <input
                  type="number"
                  min={5}
                  max={1440}
                  step={15}
                  value={timerDurationMins}
                  onChange={(e) => setTimerDurationMins(Math.max(5, Math.min(1440, Number(e.target.value) || 30)))}
                  className="w-12 bg-transparent text-slate-200 focus:outline-none text-right tabular-nums"
                />
                <span className="text-slate-500 text-[10px]">min</span>
              </div>

              {/* Start Timer Button */}
              <button
                onClick={() => onStartLoadTimer(switchTarget, timerSelectedLoads, timerDurationMins)}
                disabled={timerSelectedLoads.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 rounded-md transition-colors whitespace-nowrap"
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Start Timer ({formatDuration(timerDurationMins)})</span>
              </button>
            </div>
          </div>

          {/* Active Running Timers List */}
          <div className="xl:col-span-5 bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Active Load Timers ({activeTimers.length})
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Today's Load Avg: <strong className="text-emerald-400">{dailySummary.avgLoadEnergyPerHouseKwh.toFixed(2)} kWh/home</strong>
              </span>
            </div>

            {activeTimers.length === 0 ? (
              <div className="text-[11px] text-slate-500 py-2 font-mono">
                No active timers. Select loads and duration on the left to schedule an automatic timed run.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {activeTimers.map((t) => {
                  const pct = Math.max(0, Math.min(100, (t.remainingMinutes / t.durationMinutes) * 100));
                  return (
                    <div
                      key={t.id}
                      className="bg-slate-900 border border-slate-800 rounded p-2 text-[11px] font-mono space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-200 font-semibold truncate">{t.label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-amber-300 font-bold tabular-nums">
                            {formatDuration(t.remainingMinutes)} left
                          </span>
                          <button
                            onClick={() => onCancelLoadTimer(t.id, true)}
                            className="text-rose-400 hover:text-rose-300 underline"
                            title="Stop timer and switch loads OFF"
                          >
                            Stop & Off
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Row 3: Quick Daily Load Consumption Breakdown Strip */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Daily Total Consumed: <strong className="text-emerald-300">{dailySummary.totalLoadEnergyKwh.toFixed(1)} kWh</strong>
            </span>
            <span>
              100W: <strong className="text-slate-200">{dailySummary.loadBreakdownKwh.load100WKwh.toFixed(1)} kWh</strong>
            </span>
            <span>
              50W: <strong className="text-slate-200">{dailySummary.loadBreakdownKwh.load50WKwh.toFixed(1)} kWh</strong>
            </span>
            <span>
              200W: <strong className="text-slate-200">{dailySummary.loadBreakdownKwh.load200WKwh.toFixed(1)} kWh</strong>
            </span>
            <span>
              150W: <strong className="text-slate-200">{dailySummary.loadBreakdownKwh.load150WKwh.toFixed(1)} kWh</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>Odd Homes: <strong className="text-cyan-300">{dailySummary.oddHomesLoadEnergyKwh.toFixed(1)} kWh</strong></span>
            <span>Even Homes: <strong className="text-indigo-300">{dailySummary.evenHomesLoadEnergyKwh.toFixed(1)} kWh</strong></span>
          </div>
        </div>
      </div>

      {/* Main Grid & Inspector Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* 10x10 Matrix Board */}
        <div className="xl:col-span-8 bg-[#0e1422] border border-slate-800 rounded-xl p-4 sm:p-5 overflow-x-auto">
          
          {/* Legend and Column Headers */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-500">Row 1 - 10 × Col 1 - 10</span>
              <span className="text-slate-600">·</span>
              <span>4 Breaker Bars = 100W / 50W / 200W / 150W</span>
            </div>
            {/* Color Scale Legend */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-slate-500">0 kW</span>
              <div className="w-4 h-2.5 rounded-xs bg-slate-800 border border-slate-700" />
              <div className="w-4 h-2.5 rounded-xs bg-amber-950/70 border border-amber-800/60" />
              <div className="w-4 h-2.5 rounded-xs bg-amber-800/80 border border-amber-600/80" />
              <div className="w-4 h-2.5 rounded-xs bg-amber-500/90 border border-amber-400" />
              <div className="w-4 h-2.5 rounded-xs bg-cyan-400 border border-cyan-300" />
              <span className="text-cyan-400">2.0 kW</span>
            </div>
          </div>

          {/* 10x10 Grid Formation */}
          <div className="grid grid-cols-10 gap-1.5 sm:gap-2 min-w-[580px]">
            {houses.map((house) => {
              const isSelected = selectedHouseId === house.id;
              const isHighlighted = filteredHouses.some((h) => h.id === house.id);
              const isSurplus = house.netPowerKw > 0;

              return (
                <button
                  key={house.id}
                  onClick={() => setSelectedHouseId(house.id)}
                  className={`relative flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border text-left transition-all group ${
                    isSelected
                      ? 'ring-2 ring-cyan-400 scale-[1.04] z-10'
                      : 'hover:border-cyan-500/80 hover:scale-[1.02]'
                  } ${getCellBgColor(house.solarOutputKw)} ${!isHighlighted ? 'opacity-20' : 'opacity-100'}`}
                >
                  {/* House ID & Load W */}
                  <div className="flex items-center justify-between w-full text-[10px] font-mono opacity-80 mb-0.5">
                    <span>#{house.id.toString().padStart(3, '0')}</span>
                    <span className="text-[9px] text-slate-400">
                      {house.switchedLoadW}W
                    </span>
                  </div>

                  {/* Output in kW */}
                  <div className="text-xs sm:text-sm font-bold font-mono tabular-nums leading-tight">
                    {house.solarOutputKw.toFixed(2)}
                  </div>
                  <div className="text-[9px] font-mono opacity-70">
                    kW
                  </div>

                  {/* 4-Load Mini Switch State Bars (100W, 50W, 200W, 150W) */}
                  <div className="mt-1 flex items-center gap-0.5 w-full justify-center" title={`100W:${house.loads.load100W?'ON':'OFF'} 50W:${house.loads.load50W?'ON':'OFF'} 200W:${house.loads.load200W?'ON':'OFF'} 150W:${house.loads.load150W?'ON':'OFF'}`}>
                    <span className={`h-1 w-2.5 rounded-[1px] ${house.loads.load100W ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                    <span className={`h-1 w-2.5 rounded-[1px] ${house.loads.load50W ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                    <span className={`h-1 w-2.5 rounded-[1px] ${house.loads.load200W ? (house.nonEssentialActive ? 'bg-cyan-400' : 'bg-amber-500') : 'bg-slate-700'}`} />
                    <span className={`h-1 w-2.5 rounded-[1px] ${house.loads.load150W ? (house.nonEssentialActive ? 'bg-cyan-400' : 'bg-amber-500') : 'bg-slate-700'}`} />
                  </div>

                  {/* Net power indicator */}
                  <div className="mt-0.5 flex items-center text-[9px] font-mono">
                    {isSurplus ? (
                      <span className="text-emerald-400 flex items-center">
                        +{house.netPowerKw.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center">
                        {house.netPowerKw.toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Grid Stats */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <div>
              Total 100-House Solar: <span className="text-slate-100 font-bold">{totalSolarKw.toFixed(1)} kW</span>
            </div>
            <div>
              Average per House: <span className="text-cyan-400 font-bold">{avgSolarKw.toFixed(2)} kW</span>
            </div>
            <div>
              Total Switched Load: <span className="text-emerald-400 font-bold">{totalSwitchedLoadKw.toFixed(2)} kW</span>
            </div>
          </div>
        </div>

        {/* Selected House Deep Telemetry & 4-Load Breaker Inspector */}
        <div className="xl:col-span-4 bg-[#0e1422] border border-slate-800 rounded-xl p-5 space-y-5">
          {selectedHouse ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      {selectedHouse.name} ({selectedHouse.id % 2 === 1 ? 'Odd Home' : 'Even Home'})
                    </h3>
                    <div className="text-xs font-mono text-slate-400">
                      Grid Coordinate: Row {selectedHouse.row + 1}, Col {selectedHouse.col + 1}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedHouseId(null)}
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 4-Load Individual Switch Panel for Selected House */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    4-Load Switch Panel ({selectedHouse.switchedLoadW} W / 500 W)
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <button
                      onClick={() => onApplyLoadPreset(selectedHouse.id, 'one_on')}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                    >
                      1 On
                    </button>
                    <button
                      onClick={() => onApplyLoadPreset(selectedHouse.id, 'two_on')}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                    >
                      2 On
                    </button>
                    <button
                      onClick={() => onApplyLoadPreset(selectedHouse.id, 'all_active')}
                      className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 hover:text-white"
                    >
                      All
                    </button>
                    <button
                      onClick={() => onApplyLoadPreset(selectedHouse.id, 'all_off')}
                      className="px-1.5 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 hover:text-white"
                    >
                      Off
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {LOAD_DEFINITIONS.map((def) => {
                    const isOn = selectedHouse.loads[def.key];
                    const isShedByGovernor = isOn && def.watts >= 150 && !selectedHouse.nonEssentialActive;

                    return (
                      <button
                        key={def.key}
                        onClick={() => onToggleLoadSwitch(selectedHouse.id, def.key, !isOn)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                          isOn
                            ? isShedByGovernor
                              ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                              : 'bg-slate-900 border-cyan-500/50 text-slate-100'
                            : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold font-mono flex items-center gap-1.5">
                            <Power className={`w-3 h-3 ${isOn ? 'text-cyan-400' : 'text-slate-600'}`} />
                            <span>{def.watts} W</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {isShedByGovernor ? 'Shed by Grid' : def.tier}
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isOn ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}>
                          {isOn ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick single-house timer buttons */}
                <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-amber-400" />
                    <span>House Timer:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {[60, 120, 240].map((mins) => (
                      <button
                        key={mins}
                        onClick={() =>
                          onStartLoadTimer(
                            selectedHouse.id,
                            ['load100W', 'load50W', 'load200W', 'load150W'],
                            mins
                          )
                        }
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-amber-950 border border-slate-700 hover:border-amber-600 text-amber-300 transition-colors"
                      >
                        All {formatDuration(mins)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Solar Array Specs */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Solar PV System Telemetry (2.0 kW Rated)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-slate-400 block text-[11px]">Real-time Output</span>
                    <span className="text-lg font-bold font-mono text-amber-300 tabular-nums">
                      {selectedHouse.solarOutputKw.toFixed(3)} kW
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-slate-400 block text-[11px]">Cell Temperature</span>
                    <span className="text-lg font-bold font-mono text-rose-300 tabular-nums">
                      {selectedHouse.cellTemperatureC.toFixed(1)} °C
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-slate-400 block text-[11px]">Local Irradiance</span>
                    <span className="text-base font-bold font-mono text-slate-200 tabular-nums">
                      {selectedHouse.irradianceWm2} W/m²
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-slate-400 block text-[11px]">Array Efficiency</span>
                    <span className="text-base font-bold font-mono text-slate-200 tabular-nums">
                      {selectedHouse.panelEfficiency.toFixed(1)} %
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-mono text-slate-400 flex justify-between px-1">
                  <span>Tilt: {selectedHouse.tiltAngleDeg}° South</span>
                  <span>Soiling factor: {(selectedHouse.soilingFactor * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Dedicated DC-DC Boost Converter */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                  <span>DC-DC Boost Converter</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    selectedHouse.boostConverter.mpptTracking 
                      ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60' 
                      : 'text-slate-500 bg-slate-900 border-slate-800'
                  }`}>
                    {selectedHouse.boostConverter.mpptTracking ? 'MPPT Active' : 'Standby'}
                  </span>
                </h4>
                
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">PV Input Voltage (Vin):</span>
                    <span className="text-slate-200 font-bold">{selectedHouse.boostConverter.inputVoltageV.toFixed(1)} V DC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Bus Output Voltage (Vout):</span>
                    <span className="text-cyan-400 font-bold">{selectedHouse.boostConverter.outputVoltageV.toFixed(1)} V DC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Duty Cycle (D = 1 - Vin/Vout):</span>
                    <span className="text-amber-300 font-bold">{selectedHouse.boostConverter.dutyCycle.toFixed(3)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current Step (Iin → Iout):</span>
                    <span className="text-slate-300">
                      {selectedHouse.boostConverter.inputCurrentA.toFixed(1)}A → {selectedHouse.boostConverter.outputCurrentA.toFixed(2)}A
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Conversion Efficiency:</span>
                    <span className="text-emerald-400 font-bold">{(selectedHouse.boostConverter.efficiency * 100).toFixed(1)} %</span>
                  </div>
                </div>
              </div>

              {/* Local House Loads & Net Power Summary */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Local Loads & DC Bus Balance
                </h4>
                <div className="space-y-2 text-xs">
                  {/* Necessary Load */}
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tier-1 Necessary (100W + 50W)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Always prioritized when switched ON</span>
                    </div>
                    <span className="font-mono font-bold text-slate-100 text-sm">
                      {Math.round(selectedHouse.necessaryLoadKw * 1000)} W
                    </span>
                  </div>

                  {/* Non-Essential Load */}
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${selectedHouse.nonEssentialActive ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                        <span>Tier-2 Non-Essential (200W + 150W)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {selectedHouse.nonEssentialActive ? 'Active (Powered)' : 'Shedded (Turned OFF)'}
                      </span>
                    </div>
                    <span className={`font-mono font-bold text-sm ${selectedHouse.nonEssentialActive ? 'text-slate-100' : 'text-slate-500 line-through'}`}>
                      {Math.round(selectedHouse.nonEssentialLoadKw * 1000)} W
                    </span>
                  </div>

                  {/* Net Local Balance */}
                  <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-3 mt-2">
                    <span className="text-xs font-semibold text-slate-300">Net Local Balance:</span>
                    <span className={`font-mono font-bold text-base ${
                      selectedHouse.netPowerKw > 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {selectedHouse.netPowerKw > 0 ? `+${selectedHouse.netPowerKw.toFixed(2)} kW (Surplus)` : `${selectedHouse.netPowerKw.toFixed(2)} kW (Draw)`}
                    </span>
                  </div>
                </div>
              </div>

            </>
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Home className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-300">No House Selected</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Click any of the 100 houses in the square formation matrix on the left to inspect its real-time solar generation, boost converter voltage step, and 4 load switches.
              </p>
              <button
                onClick={() => setSelectedHouseId(1)}
                className="mt-2 px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-950/50 border border-cyan-800/60 rounded-md hover:bg-cyan-900/50"
              >
                Inspect House #001
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
