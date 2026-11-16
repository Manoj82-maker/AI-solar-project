import React from 'react';
import { Sun, Battery, Zap, ShieldCheck, Activity, AlertTriangle } from 'lucide-react';
import { DCBusSystem, BatteryStorageUnit, DailySummary } from '../types/microgrid';

interface TelemetryRibbonProps {
  totalSolarKw: number;
  avgSolarKw: number;
  dailySummary: DailySummary;
  dcBus: DCBusSystem;
  battery: BatteryStorageUnit;
  surplusPowerKw: number;
}

export const TelemetryRibbon: React.FC<TelemetryRibbonProps> = ({
  totalSolarKw,
  avgSolarKw,
  dailySummary,
  dcBus,
  battery,
  surplusPowerKw,
}) => {
  const isBatteryCharging = battery.powerKw > 0;
  const isBatteryDischarging = battery.powerKw < 0;

  return (
    <div className="bg-[#101726] border-b border-slate-800 px-4 lg:px-8 py-3.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        
        {/* Metric 1: Real-time Total Solar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium text-slate-400">Total Solar (100 Houses)</span>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
              {totalSolarKw.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400 uppercase">kW</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            Capacity: 200.0 kW max
          </div>
        </div>

        {/* Metric 2: Average Solar Output per House */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium text-slate-400">Average / House</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-cyan-300 tabular-nums">
              {avgSolarKw.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-400 uppercase">kW / house</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            Rating: 2.00 kW rated
          </div>
        </div>

        {/* Metric 3: Daily Total & Average Generated */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium text-slate-400">Daily Total Energy</span>
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
              {dailySummary.totalSolarEnergyKwh.toFixed(0)}
            </span>
            <span className="text-xs font-mono text-slate-400 uppercase">kWh</span>
          </div>
          <div className="text-[11px] font-mono text-amber-400 mt-0.5">
            Daily Avg: {dailySummary.avgSolarEnergyPerHouseKwh.toFixed(1)} kWh/house
          </div>
        </div>

        {/* Metric 4: 380V DC Bus System */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium text-slate-400">Common DC Bus</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50">
              Regulated
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
              {dcBus.actualVoltageV.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400 uppercase">V DC</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            Boost Converter: 98.2% eff
          </div>
        </div>

        {/* Metric 5: Battery Storage Unit & Power Flow */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium text-slate-400">Battery BESS (500 kWh)</span>
            <Battery className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
              {battery.stateOfChargePct.toFixed(1)}%
            </span>
            <span className={`text-xs font-mono ${isBatteryCharging ? 'text-emerald-400' : isBatteryDischarging ? 'text-amber-400' : 'text-slate-400'}`}>
              {isBatteryCharging ? `+${battery.powerKw.toFixed(1)} kW` : isBatteryDischarging ? `${battery.powerKw.toFixed(1)} kW` : '0.0 kW'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            SoH: {battery.stateOfHealthPct.toFixed(1)}% · {battery.averageTempC.toFixed(1)}°C
          </div>
        </div>

        {/* Metric 6: 2-Tier Load Status & Daily Consumption */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium text-slate-400">Load Consumed / Day</span>
            {dcBus.nonEssentialSheddingPct > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-300 tabular-nums">
              {dailySummary.totalLoadEnergyKwh.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400 uppercase">kWh</span>
          </div>
          <div className="text-[11px] font-mono text-slate-300 mt-0.5 flex items-center justify-between">
            <span>Now: {(dcBus.necessaryLoadTotalKw + dcBus.nonEssentialLoadTotalKw).toFixed(1)} kW</span>
            <span className={dcBus.nonEssentialSheddingPct > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
              {100 - dcBus.nonEssentialSheddingPct}% T2
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
