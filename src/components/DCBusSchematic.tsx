import React from 'react';
import { DCBusSystem, BatteryStorageUnit } from '../types/microgrid';
import { Sun, Zap, Battery, ShieldCheck, Power, Cpu, ArrowRight, ArrowLeft, RefreshCw, AlertTriangle, Layers } from 'lucide-react';

interface DCBusSchematicProps {
  dcBus: DCBusSystem;
  battery: BatteryStorageUnit;
  totalSolarKw: number;
  surplusPowerKw: number;
  nonEssentialCoveredPct: number;
  nonEssentialShedReason: string;
}

export const DCBusSchematic: React.FC<DCBusSchematicProps> = ({
  dcBus,
  battery,
  totalSolarKw,
  surplusPowerKw,
  nonEssentialCoveredPct,
  nonEssentialShedReason,
}) => {
  const isCharging = battery.powerKw > 0;
  const isDischarging = battery.powerKw < 0;
  const isSurplusState = totalSolarKw >= (dcBus.necessaryLoadTotalKw + dcBus.nonEssentialLoadTotalKw);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>DC Bus Architecture & Boost Converter Energy Flow</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              100 real-time solar PV outputs (2 kW each) are stepped up from ~36V DC via distributed MPPT boost converters into a common 380V DC Bus. 
              The AI dispatch governor directs surplus power to charge the 500 kWh battery, and strictly prioritizes necessary loads during solar deficits.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-slate-400">Dispatch Regime:</span>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
              isSurplusState
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                : 'bg-amber-950/80 text-amber-300 border-amber-600/50'
            }`}>
              {isSurplusState ? 'SURPLUS CHARGING' : 'PRIORITY DISPATCH (DEFICIT)'}
            </span>
          </div>
        </div>

        {/* Current State Explainer Box */}
        <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg flex items-start gap-3">
          <div className="p-1 rounded bg-slate-800 text-cyan-400 shrink-0 mt-0.5">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-semibold text-slate-200">AI Energy Governor State:</span>
            <p className="text-slate-300 font-mono">
              {nonEssentialShedReason}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Power Flow Schematic Canvas */}
      <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-6 lg:p-8 overflow-x-auto">
        <div className="min-w-[900px] flex items-center justify-between relative py-6">
          
          {/* STAGE 1: 100 SOLAR PV SYSTEMS */}
          <div className="w-64 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3 z-10">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">100 Solar PV Arrays</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">10 × 10 Grid</span>
            </div>
            
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Array Capacity:</span>
                <span className="text-slate-200 font-bold">200.0 kW Max</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Generation:</span>
                <span className="text-amber-400 font-bold text-sm tabular-nums">{totalSolarKw.toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PV Array Voltage:</span>
                <span className="text-slate-300">~34V - 42V DC</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80">
              Each system has a 2 kW max limit, derated by ambient temp & irradiance.
            </div>
          </div>

          {/* CONNECTOR 1: Flow to Boost Converter */}
          <div className="grow flex flex-col items-center justify-center px-2">
            <div className="h-0.5 w-full bg-gradient-to-r from-amber-500/80 to-cyan-500/80 relative">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-amber-300 bg-[#0b101d] px-1">
                {totalSolarKw.toFixed(1)} kW
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-cyan-400 mt-1" />
          </div>

          {/* STAGE 2: DC-DC BOOST CONVERTER STAGE */}
          <div className="w-64 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3 z-10">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">DC-DC Boost Stage</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                MPPT Active
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Voltage Step-Up:</span>
                <span className="text-slate-200 font-bold">~36V → 380V DC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duty Cycle (D):</span>
                <span className="text-cyan-300 font-bold">0.88 - 0.92</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Efficiency:</span>
                <span className="text-emerald-400 font-bold">98.2 %</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80">
              Equation: Vout = Vin / (1 - D). Maximizes power extraction at DC bus voltage.
            </div>
          </div>

          {/* CONNECTOR 2: Flow to Central DC Bus */}
          <div className="grow flex flex-col items-center justify-center px-2">
            <div className="h-0.5 w-full bg-cyan-500/80 relative">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-cyan-300 bg-[#0b101d] px-1">
                {(totalSolarKw * 0.982).toFixed(1)} kW
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-cyan-400 mt-1" />
          </div>

          {/* STAGE 3: CENTRAL 380V DC BUS (THE HUB) */}
          <div className="w-72 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500/80 rounded-xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)] space-y-4 z-20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-sm font-bold text-cyan-400 block">Common DC Bus</span>
                <span className="text-[10px] text-slate-400 font-mono">Microgrid Distribution Backbone</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                  {dcBus.actualVoltageV.toFixed(1)}
                </span>
                <span className="text-[10px] font-mono text-slate-400 block">V DC</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between bg-slate-900/90 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Total Generation In:</span>
                <span className="text-amber-400 font-bold">+{dcBus.totalSolarInputKw.toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between bg-slate-900/90 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Total Load Demand:</span>
                <span className="text-slate-200 font-bold">{(dcBus.necessaryLoadTotalKw + dcBus.nonEssentialLoadTotalKw).toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between bg-slate-900/90 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Net Surplus / Balance:</span>
                <span className={`font-bold ${surplusPowerKw > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {surplusPowerKw > 0 ? `+${surplusPowerKw.toFixed(1)} kW Surplus` : `${(totalSolarKw - (dcBus.necessaryLoadTotalKw + dcBus.nonEssentialLoadTotalKw)).toFixed(1)} kW Deficit`}
                </span>
              </div>
            </div>

            {/* Battery Bi-Directional Branch Inside DC Bus Box */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Battery className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold">Battery Branch:</span>
                </div>
                <span className={`font-mono font-bold text-xs ${
                  isCharging ? 'text-emerald-400' : isDischarging ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {isCharging ? `Charging +${battery.powerKw.toFixed(1)} kW` : isDischarging ? `Discharging ${battery.powerKw.toFixed(1)} kW` : 'Idle / Standby'}
                </span>
              </div>

              {/* Visual flow indicator */}
              <div className="flex items-center justify-center gap-2 py-1 bg-slate-950 rounded border border-slate-800/80 text-[11px] font-mono">
                {isCharging && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span>Surplus redirected to charge BESS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
                {isDischarging && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Battery feeding necessary load</span>
                  </span>
                )}
                {!isCharging && !isDischarging && (
                  <span className="text-slate-400">Balanced / Float</span>
                )}
              </div>
            </div>
          </div>

          {/* CONNECTOR 3: Flow from DC Bus to Loads */}
          <div className="grow flex flex-col items-center justify-center px-2">
            <div className="h-0.5 w-full bg-slate-700 relative">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-300 bg-[#0b101d] px-1">
                {(dcBus.necessaryLoadTotalKw + dcBus.nonEssentialLoadTotalKw).toFixed(1)} kW
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 mt-1" />
          </div>

          {/* STAGE 4: TWO-TIER PRIORITIZED LOADS */}
          <div className="w-72 space-y-3 z-10">
            
            {/* TIER 1: NECESSARY LOAD (ALWAYS ON) */}
            <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-xl p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-100">Necessary Load (Tier-1)</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                  ALWAYS ON
                </span>
              </div>

              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Aggregate Demand:</span>
                  <span className="text-slate-100 font-bold">{dcBus.necessaryLoadTotalKw.toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Service Reliability:</span>
                  <span className="text-emerald-400 font-bold">100.0% Guaranteed</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400">
                Critical circuits: Medical life-support, cooling, communication, emergency lighting. Priority #1 over battery charging.
              </div>
            </div>

            {/* TIER 2: NON-ESSENTIAL LOAD (SHEDDABLE) */}
            <div className={`bg-slate-900 border rounded-xl p-4 shadow-lg space-y-2 transition-all ${
              nonEssentialCoveredPct < 100 
                ? 'border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                : 'border-slate-800'
            }`}>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Power className={`w-4 h-4 ${nonEssentialCoveredPct > 0 ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-100">Non-Essential Load (Tier-2)</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  nonEssentialCoveredPct === 100
                    ? 'text-cyan-400 bg-cyan-950/80 border-cyan-800/60'
                    : nonEssentialCoveredPct > 0
                    ? 'text-amber-400 bg-amber-950/80 border-amber-800/60'
                    : 'text-rose-400 bg-rose-950/80 border-rose-800/60'
                }`}>
                  {nonEssentialCoveredPct}% Powered
                </span>
              </div>

              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Consumption:</span>
                  <span className="text-slate-100 font-bold">{dcBus.nonEssentialLoadTotalKw.toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shedding Rate:</span>
                  <span className={`font-bold ${dcBus.nonEssentialSheddingPct > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {dcBus.nonEssentialSheddingPct}% Shed
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400">
                Flexible circuits: EV fast chargers, climate boosters, water heaters, pool pumps. Dynamically throttled during solar deficits.
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Engineering Flow Principles & Mathematical Logic Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Principle 1: Surplus Regime */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Condition A: Solar Generation &gt; Total Load (Surplus)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            When total solar electricity generated exceeds the sum of Necessary and Non-Essential loads:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-5">
            <li><strong className="text-slate-200">100% of Necessary Loads</strong> are fully powered.</li>
            <li><strong className="text-slate-200">100% of Non-Essential Loads</strong> remain active.</li>
            <li><strong className="text-emerald-400">Surplus power is redirected to charge the Battery Storage Unit (BESS)</strong> via the DC bus up to 120 kW max charge rate.</li>
            <li>If battery reaches 100% SoC, any additional unabsorbed surplus is exported to the macrogrid or curtailed.</li>
          </ul>
        </div>

        {/* Principle 2: Deficit / Low Solar Regime */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Condition B: Solar Generation &lt; Total Load (Deficit)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            When total solar electricity is insufficient to supply both load tiers:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-5">
            <li><strong className="text-amber-300">No surplus power exists for battery charging.</strong></li>
            <li>The system <strong className="text-slate-200">strictly prioritizes supplying power to Necessary Loads</strong> over battery charging.</li>
            <li>If Solar &lt; Necessary Loads, all solar goes to Necessary Loads, and the battery discharges to cover the shortfall.</li>
            <li><strong className="text-amber-400">Non-Essential Loads are automatically turned OFF (shed)</strong> to preserve battery reserves and guarantee Necessary Loads never suffer an outage.</li>
          </ul>
        </div>

      </div>

    </div>
  );
};
