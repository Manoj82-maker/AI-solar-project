import React from 'react';
import { BatteryStorageUnit, BMSHealthReport } from '../types/microgrid';
import { Battery, BatteryCharging, ShieldCheck, Thermometer, Cpu, Activity, AlertTriangle, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface AI_BMSConsoleProps {
  battery: BatteryStorageUnit;
  bmsReport: BMSHealthReport | null;
  onRunAiDiagnostic: () => void;
  isAiDiagnosing: boolean;
  aiHealthProtectionActive: boolean;
  setAiHealthProtectionActive: (val: boolean) => void;
}

export const AI_BMSConsole: React.FC<AI_BMSConsoleProps> = ({
  battery,
  bmsReport,
  onRunAiDiagnostic,
  isAiDiagnosing,
  aiHealthProtectionActive,
  setAiHealthProtectionActive,
}) => {
  const isCharging = battery.powerKw > 0;
  const isDischarging = battery.powerKw < 0;

  // Calculate cell voltage spread delta
  const maxCellV = Math.max(...battery.cells.map(c => c.voltageV));
  const minCellV = Math.min(...battery.cells.map(c => c.voltageV));
  const deltaV = Math.round((maxCellV - minCellV) * 1000); // in mV

  return (
    <div className="p-4 lg:p-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <span>AI Battery Management System (BMS) & Health Optimization</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Intelligent electrochemistry supervision managing thermal limits, cell balancing, dynamic C-rate throttling, and cycle degradation prevention for the 500 kWh LiFePO4 battery storage bank.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAiHealthProtectionActive(!aiHealthProtectionActive)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-colors ${
              aiHealthProtectionActive
                ? 'bg-teal-950/70 border-teal-500/50 text-teal-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>AI Health Guard: {aiHealthProtectionActive ? 'ENABLED' : 'DISABLED'}</span>
          </button>

          <button
            onClick={onRunAiDiagnostic}
            disabled={isAiDiagnosing}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 disabled:opacity-50 rounded-lg shadow transition-all"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiDiagnosing ? 'animate-spin' : ''}`} />
            <span>{isAiDiagnosing ? 'Scanning Health...' : 'Run Deep AI Scan'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Key Telemetry Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Panel 1: State of Charge (SoC) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">State of Charge (SoC)</span>
            <Battery className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-100 tabular-nums">
              {battery.stateOfChargePct.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-slate-400">
              {battery.storedEnergyKwh.toFixed(1)} / {battery.capacityKwh} kWh
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                battery.stateOfChargePct > 50
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                  : battery.stateOfChargePct > 20
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-500 to-red-400'
              }`}
              style={{ width: `${Math.max(2, Math.min(100, battery.stateOfChargePct))}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Optimal Window: 20% - 85%</span>
            <span className="text-cyan-400">
              {battery.stateOfChargePct >= 85 ? 'High Float' : battery.stateOfChargePct <= 20 ? 'Reserve Guard' : 'Nominal'}
            </span>
          </div>
        </div>

        {/* Panel 2: State of Health (SoH) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">State of Health (SoH)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-emerald-300 tabular-nums">
              {battery.stateOfHealthPct.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-slate-400">
              {battery.cycleCount.toFixed(1)} Cycles
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${battery.stateOfHealthPct}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Degradation: -0.008% / cycle</span>
            <span className="text-emerald-400">Pristine Grade</span>
          </div>
        </div>

        {/* Panel 3: Power Flow & C-Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Power Flow & C-Rate</span>
            <BatteryCharging className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-3xl font-bold font-mono tabular-nums ${
              isCharging ? 'text-emerald-400' : isDischarging ? 'text-amber-400' : 'text-slate-300'
            }`}>
              {isCharging ? `+${battery.powerKw.toFixed(1)}` : `${battery.powerKw.toFixed(1)}`}
            </span>
            <span className="text-xs font-mono text-slate-400 uppercase">kW</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block">Current C-Rate</span>
              <span className="font-bold text-slate-200">{battery.cRate.toFixed(2)} C</span>
            </div>
            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block">Pack Current</span>
              <span className="font-bold text-slate-200">{battery.currentA.toFixed(1)} A</span>
            </div>
          </div>
        </div>

        {/* Panel 4: Thermal & Cooling Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Thermal Envelope</span>
            <Thermometer className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-100 tabular-nums">
              {battery.averageTempC.toFixed(1)}°C
            </span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              battery.thermalRunawayRisk === 'LOW'
                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
                : battery.thermalRunawayRisk === 'MODERATE'
                ? 'text-amber-400 bg-amber-950/60 border-amber-800/60'
                : 'text-rose-400 bg-rose-950/60 border-rose-800/60'
            }`}>
              Risk: {battery.thermalRunawayRisk}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block">Fan Speed (PWM)</span>
              <span className="font-bold text-cyan-400">{battery.coolingFanPwmPct}%</span>
            </div>
            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block">Pack Voltage</span>
              <span className="font-bold text-slate-200">{battery.nominalVoltageV.toFixed(1)} V</span>
            </div>
          </div>
        </div>

      </div>

      {/* 16-Cell Series String Voltage & Active Balancing Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>16-Cell Series Module String Voltage & Active Balancing</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Individual voltage monitoring across 16 series LiFePO4 cells (3.20V nominal). Active balancing bleeding triggers when cell delta &gt; 20 mV.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Voltage Delta (ΔV): </span>
              <span className={`font-bold ${deltaV > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {deltaV} mV
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Balancing: <span className="text-cyan-400 font-bold">{battery.cells.filter(c => c.balancingActive).length} Cells Active</span>
            </div>
          </div>
        </div>

        {/* Cell Voltage Bars */}
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-2">
          {battery.cells.map((cell) => {
            const heightPct = Math.max(10, Math.min(100, ((cell.voltageV - 2.8) / (3.6 - 2.8)) * 100));

            return (
              <div
                key={cell.id}
                className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                  cell.balancingActive
                    ? 'bg-cyan-950/40 border-cyan-500/70 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400 mb-1">
                  C{cell.id.toString().padStart(2, '0')}
                </div>

                {/* Vertical mini bar */}
                <div className="w-full bg-slate-900 rounded h-16 relative overflow-hidden flex items-end">
                  <div
                    className={`w-full transition-all duration-300 ${
                      cell.balancingActive ? 'bg-cyan-400' : 'bg-emerald-500'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>

                <div className="text-[11px] font-mono font-bold text-slate-200 mt-1.5 tabular-nums">
                  {cell.voltageV.toFixed(3)}
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  {cell.temperatureC.toFixed(0)}°C
                </div>

                {cell.balancingActive && (
                  <div className="mt-1 text-[8px] font-mono text-cyan-300 uppercase tracking-tighter">
                    Bleed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep AI Diagnostic Report Card */}
      {bmsReport && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-teal-500/30 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Gemini AI Battery Diagnostic & Lifespan Report</span>
                  <span className="text-[10px] font-mono text-teal-400 bg-teal-950/60 border border-teal-800/60 rounded px-1.5 py-0.2">
                    Verified Analysis
                  </span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Generated at {bmsReport.timestamp} · Target Chemistry: LiFePO4 500 kWh Pack
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">AI Health Score</span>
                <span className="text-xl font-bold font-mono text-teal-300">{bmsReport.healthScore}/100</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Life Expectancy</span>
                <span className="text-xl font-bold font-mono text-slate-100">~{bmsReport.estimatedLifeRemainingYears} yrs</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Diagnostics */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-300 uppercase text-[11px] tracking-wider">
                System Diagnostics & Stress Factors
              </h4>
              <ul className="space-y-1.5">
                {bmsReport.aiDiagnostics.map((diag, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>{diag}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-300 uppercase text-[11px] tracking-wider">
                Engineering Health Actions & Recommendations
              </h4>
              <ul className="space-y-1.5">
                {bmsReport.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800/60">
                    <span className="font-mono text-teal-400 shrink-0">#{idx + 1}</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Policy Statement */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <div>
              <span className="text-slate-300 font-semibold">Charging Policy: </span>
              <span>{bmsReport.chargePolicyAdvice}</span>
            </div>
            <div>
              <span className="text-teal-400 font-semibold">Priority Strategy: </span>
              <span>{bmsReport.loadManagementStatus}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
