import React from 'react';
import { DailySummary, DCBusSystem, HouseData, LoadTimer } from '../types/microgrid';
import { BarChart3, TrendingUp, Zap, Sun, Battery, ShieldCheck, Download, Award, Power, RotateCcw, Clock } from 'lucide-react';

interface EnergyAnalyticsProps {
  dailySummary: DailySummary;
  houses: HouseData[];
  dcBus: DCBusSystem;
  activeTimers: LoadTimer[];
  totalSolarKw: number;
  avgSolarKw: number;
  onExportCsv: () => void;
  onResetDailySummary: () => void;
}

export const EnergyAnalytics: React.FC<EnergyAnalyticsProps> = ({
  dailySummary,
  houses,
  dcBus,
  activeTimers,
  totalSolarKw,
  avgSolarKw,
  onExportCsv,
  onResetDailySummary,
}) => {
  // Max scale for hourly charts
  const maxGenKw = Math.max(55, ...dailySummary.hourlyGenerationKw, ...dailySummary.hourlyLoadKw);

  // Instantaneous per-load calculations
  const count100W = houses.filter((h) => h.loads.load100W).length;
  const count50W = houses.filter((h) => h.loads.load50W).length;
  const count200W = houses.filter((h) => h.loads.load200W && h.nonEssentialActive).length;
  const count150W = houses.filter((h) => h.loads.load150W && h.nonEssentialActive).length;

  const live100W_Kw = count100W * 0.1;
  const live50W_Kw = count50W * 0.05;
  const live200W_Kw = count200W * 0.2;
  const live150W_Kw = count150W * 0.15;
  const liveTotalLoadKw = live100W_Kw + live50W_Kw + live200W_Kw + live150W_Kw;

  const totalLoadKwh = dailySummary.totalLoadEnergyKwh;

  const loadRows = [
    {
      name: 'Load 1 · 100 W',
      watts: 100,
      tier: 'Tier-1 Necessary (Always ON)',
      activeHomes: count100W,
      liveKw: live100W_Kw,
      dailyKwh: dailySummary.loadBreakdownKwh.load100WKwh,
      projected24hKwh: live100W_Kw * 24,
      accent: 'text-emerald-300',
    },
    {
      name: 'Load 2 · 50 W',
      watts: 50,
      tier: 'Tier-1 Necessary (Always ON)',
      activeHomes: count50W,
      liveKw: live50W_Kw,
      dailyKwh: dailySummary.loadBreakdownKwh.load50WKwh,
      projected24hKwh: live50W_Kw * 24,
      accent: 'text-emerald-300',
    },
    {
      name: 'Load 3 · 200 W',
      watts: 200,
      tier: 'Tier-2 Non-Essential',
      activeHomes: count200W,
      liveKw: live200W_Kw,
      dailyKwh: dailySummary.loadBreakdownKwh.load200WKwh,
      projected24hKwh: live200W_Kw * 24,
      accent: 'text-cyan-300',
    },
    {
      name: 'Load 4 · 150 W',
      watts: 150,
      tier: 'Tier-2 Non-Essential',
      activeHomes: count150W,
      liveKw: live150W_Kw,
      dailyKwh: dailySummary.loadBreakdownKwh.load150WKwh,
      projected24hKwh: live150W_Kw * 24,
      accent: 'text-cyan-300',
    },
  ];

  const handleDownloadLoadReportCsv = () => {
    const headers = [
      'Load_Name',
      'Rating_Watts',
      'Priority_Tier',
      'Active_Houses_Count',
      'Live_Power_kW',
      'Daily_Energy_Consumed_kWh',
      'Share_Of_Total_Pct',
      'Projected_24h_at_Current_State_kWh',
    ];
    const rows = loadRows.map((r) => [
      `"${r.name}"`,
      r.watts,
      `"${r.tier}"`,
      r.activeHomes,
      r.liveKw.toFixed(2),
      r.dailyKwh.toFixed(2),
      totalLoadKwh > 0 ? ((r.dailyKwh / totalLoadKwh) * 100).toFixed(1) : '0.0',
      r.projected24hKwh.toFixed(2),
    ]);
    rows.push([
      '"TOTAL ALL 4 LOADS (100 HOMES)"',
      500,
      '"Combined"',
      100,
      liveTotalLoadKw.toFixed(2),
      totalLoadKwh.toFixed(2),
      '100.0',
      (liveTotalLoadKw * 24).toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'SolarGrid_100_Daily_Load_Consumption.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>24-Hour Energy Analytics & Daily Load Power Consumption</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Tracks total solar electricity generated and total daily power consumed across all four loads (100W, 50W, 200W, 150W) in all 100 homes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onResetDailySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            title="Reset clock to 00:00 and clear today's cumulative counters"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Day (00:00)</span>
          </button>
          <button
            onClick={handleDownloadLoadReportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Load Report CSV</span>
          </button>
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Full Grid CSV</span>
          </button>
        </div>
      </div>

      {/* Section 1: Daily Load Power Consumption KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Load KPI 1: Total Daily Power Consumed by All Loads */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Load Consumed (Today)</span>
            <Power className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-emerald-300 tabular-nums">
              {totalLoadKwh.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">kWh / day</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Live Rate: {liveTotalLoadKw.toFixed(2)} kW · 24h Proj: {(liveTotalLoadKw * 24).toFixed(0)} kWh
          </div>
        </div>

        {/* Load KPI 2: Daily Avg Load Consumed per House */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Daily Load Avg / House</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-cyan-300 tabular-nums">
              {dailySummary.avgLoadEnergyPerHouseKwh.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-400">kWh / house</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Max Possible: 12.00 kWh/house/day (500W×24h)
          </div>
        </div>

        {/* Load KPI 3: Odd vs Even Homes Load Consumed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Odd vs Even Homes (Today)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between font-mono pt-1">
            <div>
              <span className="text-[10px] text-slate-400 block">Odd Homes (50)</span>
              <span className="text-lg font-bold text-cyan-300 tabular-nums">
                {dailySummary.oddHomesLoadEnergyKwh.toFixed(1)} kWh
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Even Homes (50)</span>
              <span className="text-lg font-bold text-indigo-300 tabular-nums">
                {dailySummary.evenHomesLoadEnergyKwh.toFixed(1)} kWh
              </span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Active Timers Running: {activeTimers.length}
          </div>
        </div>

        {/* Load KPI 4: Total Daily Solar Generation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Daily Solar Produced</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-amber-300 tabular-nums">
              {dailySummary.totalSolarEnergyKwh.toFixed(0)}
            </span>
            <span className="text-xs font-mono text-slate-400">kWh / day</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Solar Avg: {dailySummary.avgSolarEnergyPerHouseKwh.toFixed(1)} kWh/house · Now: {totalSolarKw.toFixed(1)} kW
          </div>
        </div>

      </div>

      {/* Section 2: Per-Load Daily Power Consumption Table (100W, 50W, 200W, 150W) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Power className="w-4 h-4 text-emerald-400" />
              <span>Daily Power Consumed by Each Load Type (100W · 50W · 200W · 150W)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed energy accounting across all 100 houses showing cumulative kWh consumed today and 24-hour projection at current switch states.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Peak Load Today: <strong className="text-slate-100">{dailySummary.peakLoadPowerKw.toFixed(1)} kW</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Load Component</th>
                <th className="py-2.5 px-3 font-semibold">Priority Tier</th>
                <th className="py-2.5 px-3 font-semibold text-right">Active Homes</th>
                <th className="py-2.5 px-3 font-semibold text-right">Live Power Now</th>
                <th className="py-2.5 px-3 font-semibold text-right">Consumed Today (kWh)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Share (%)</th>
                <th className="py-2.5 px-3 font-semibold text-right">24h Projection (kWh)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loadRows.map((row) => {
                const sharePct = totalLoadKwh > 0 ? (row.dailyKwh / totalLoadKwh) * 100 : 0;
                return (
                  <tr key={row.name} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-slate-100">{row.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{row.tier}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{row.activeHomes} / 100</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{row.liveKw.toFixed(2)} kW</td>
                    <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${row.accent}`}>
                      {row.dailyKwh.toFixed(2)} kWh
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{sharePct.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">
                      {row.projected24hKwh.toFixed(1)} kWh
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-700 bg-slate-950/70 text-slate-100 font-bold">
                <td className="py-3 px-3">TOTAL ALL LOADS (100 HOMES)</td>
                <td className="py-3 px-3 text-slate-400 font-normal">500 W max / house</td>
                <td className="py-3 px-3 text-right">100 Houses</td>
                <td className="py-3 px-3 text-right text-cyan-300 tabular-nums">{liveTotalLoadKw.toFixed(2)} kW</td>
                <td className="py-3 px-3 text-right text-emerald-300 tabular-nums">{totalLoadKwh.toFixed(2)} kWh</td>
                <td className="py-3 px-3 text-right">100.0%</td>
                <td className="py-3 px-3 text-right text-amber-300 tabular-nums">{(liveTotalLoadKw * 24).toFixed(1)} kWh</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Section 3: 24-Hour Diurnal Generation vs Load Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>24-Hour Hourly Profile (Solar Generation vs Load Demand)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizes hourly solar PV generation alongside total active load consumption (Tier-1 Necessary + Tier-2 Non-Essential).
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-400" />
              <span className="text-slate-300">Solar Generation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-cyan-400" />
              <span className="text-slate-300">Total Load Demand</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-400" />
              <span className="text-slate-300">Necessary Baseline</span>
            </div>
          </div>
        </div>

        {/* 24-Hour Bar Chart Visualization */}
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-24 gap-1 h-56 items-end border-b border-slate-800 pb-2 px-1">
            {dailySummary.hourlyGenerationKw.map((genKw, hour) => {
              const solarHeightPct = Math.min(100, (genKw / maxGenKw) * 100);
              const totalLoadKw = dailySummary.hourlyLoadKw[hour] || 0;
              const necLoadKw = dailySummary.hourlyNecessaryLoadKw[hour] || 0;
              const loadHeightPct = Math.min(100, (totalLoadKw / maxGenKw) * 100);
              const necHeightPct = Math.min(100, (necLoadKw / maxGenKw) * 100);

              return (
                <div key={hour} className="flex flex-col items-center h-full justify-end group relative">
                  
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-950 border border-slate-700 rounded p-1.5 text-[10px] font-mono text-slate-200 z-20 pointer-events-none whitespace-nowrap shadow-xl">
                    <div className="font-bold text-amber-300">{hour.toString().padStart(2, '0')}:00</div>
                    <div>Solar: {genKw.toFixed(1)} kW</div>
                    <div className="text-cyan-300">Total Load: {totalLoadKw.toFixed(1)} kW</div>
                    <div className="text-emerald-300">Necessary: {necLoadKw.toFixed(1)} kW</div>
                  </div>

                  {/* Paired Solar & Load Bars */}
                  <div className="w-full flex items-end justify-center gap-0.5 h-full relative">
                    <div
                      className="w-1/2 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-xs transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${solarHeightPct}%` }}
                    />
                    <div
                      className="w-1/2 bg-gradient-to-t from-cyan-700 to-cyan-400 rounded-t-xs transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${loadHeightPct}%` }}
                    />
                    {necHeightPct > 0 && (
                      <div
                        className="absolute w-full border-t border-dashed border-emerald-400 z-10 pointer-events-none"
                        style={{ bottom: `${necHeightPct}%` }}
                      />
                    )}
                  </div>

                  {/* Hour label */}
                  <span className="text-[9px] font-mono text-slate-500 mt-1">
                    {hour % 3 === 0 ? `${hour}h` : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-2 px-1">
            <span>00:00 (Midnight)</span>
            <span>06:00 (Sunrise)</span>
            <span className="text-amber-400 font-bold">12:00 (Noon Solar Peak)</span>
            <span>18:30 (Sunset)</span>
            <span>23:59 (Night)</span>
          </div>
        </div>
      </div>

      {/* Section 4: Energy Balance Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-100">
          Daily Microgrid Energy Balance & Load Prioritization Ledger
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3 font-semibold">Energy Category</th>
                <th className="py-2 px-3 font-semibold text-right">Cumulative Amount</th>
                <th className="py-2 px-3 font-semibold text-right">% of Total Solar</th>
                <th className="py-2 px-3 font-semibold">Priority & Dispatch Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 px-3 flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-100 font-semibold">Total Solar Electricity Generated</span>
                </td>
                <td className="py-2.5 px-3 text-right text-amber-300 font-bold">{dailySummary.totalSolarEnergyKwh.toFixed(1)} kWh</td>
                <td className="py-2.5 px-3 text-right">100.0%</td>
                <td className="py-2.5 px-3 text-slate-400">100 houses × 2 kW maximum capacity (Peak: {dailySummary.peakSolarPowerKw.toFixed(1)} kW)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Consumed by Necessary Loads (100W + 50W)</span>
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">{dailySummary.totalNecessaryEnergyKwh.toFixed(1)} kWh</td>
                <td className="py-2.5 px-3 text-right">
                  {dailySummary.totalSolarEnergyKwh > 0 ? ((dailySummary.totalNecessaryEnergyKwh / dailySummary.totalSolarEnergyKwh) * 100).toFixed(1) : 0}%
                </td>
                <td className="py-2.5 px-3 text-emerald-400">Priority #1 (ALWAYS ON - never interrupted)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Consumed by Non-Essential Loads (200W + 150W)</span>
                </td>
                <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">{dailySummary.totalNonEssentialEnergyKwh.toFixed(1)} kWh</td>
                <td className="py-2.5 px-3 text-right">
                  {dailySummary.totalSolarEnergyKwh > 0 ? ((dailySummary.totalNonEssentialEnergyKwh / dailySummary.totalSolarEnergyKwh) * 100).toFixed(1) : 0}%
                </td>
                <td className="py-2.5 px-3 text-slate-400">Switchable & sheddable when solar is insufficient (Now: {dcBus.nonEssentialLoadTotalKw.toFixed(1)} kW)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 flex items-center gap-2">
                  <Battery className="w-3.5 h-3.5 text-teal-400" />
                  <span>Surplus Redirected to Battery</span>
                </td>
                <td className="py-2.5 px-3 text-right text-teal-300 font-bold">{dailySummary.solarToBatteryEnergyKwh.toFixed(1)} kWh</td>
                <td className="py-2.5 px-3 text-right">
                  {dailySummary.totalSolarEnergyKwh > 0 ? ((dailySummary.solarToBatteryEnergyKwh / dailySummary.totalSolarEnergyKwh) * 100).toFixed(1) : 0}%
                </td>
                <td className="py-2.5 px-3 text-slate-400">Charges 500 kWh BESS with surplus energy (Throughput: {dailySummary.batteryThroughputKwh.toFixed(1)} kWh)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
