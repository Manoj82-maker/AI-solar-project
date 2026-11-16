import React from 'react';
import { BookOpen, Cpu, Zap, Sun, ShieldCheck, Check, Layers } from 'lucide-react';

export const MathModelReference: React.FC = () => {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      
      {/* Overview Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2.5 text-cyan-400">
          <BookOpen className="w-5 h-5" />
          <h2 className="text-lg font-bold text-slate-100">
            System Design Specification & Mathematical Modeling Reference
          </h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Comprehensive engineering architecture for a 100-house microgrid arranged in a 10×10 square formation. 
          Covers photovoltaic cell physics, DC-DC boost converter MPPT tracking, 380V DC Bus regulation, AI Battery Management System (BMS) health optimization, and two-tier priority load dispatch.
        </p>
      </div>

      {/* Section 1: Photovoltaic Generation & Temperature Model */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-400" />
          <span>1. Photovoltaic Generation & Temperature Physics</span>
        </h3>
        
        <p className="text-xs text-slate-300 leading-relaxed">
          Each house is equipped with a solar array rated at a maximum capacity of <span className="font-mono text-amber-300 font-bold">2.0 kW (2000 W)</span> under Standard Test Conditions (STC: 1000 W/m², 25°C). Generation varies continuously with solar irradiance <span className="font-mono text-cyan-300">G</span> (W/m²) and cell operating temperature <span className="font-mono text-rose-300">T_cell</span> (°C).
        </p>

        {/* Math equations block */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-3 text-slate-300">
          <div>
            <span className="text-slate-500 block mb-1">Cell Temperature Equation (NOCT Model):</span>
            <code className="text-cyan-300 font-bold block text-sm">
              T_cell = T_amb + [(NOCT - 20) / 800] × G
            </code>
            <span className="text-[11px] text-slate-400">Where NOCT = 45°C (Nominal Operating Cell Temperature), T_amb = surrounding ambient temperature, G = irradiance in W/m².</span>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-slate-500 block mb-1">Photovoltaic Output Power Equation:</span>
            <code className="text-amber-300 font-bold block text-sm">
              P_solar,i(G, T) = P_rated × (G_i / 1000) × [1 + γ_Pmax × (T_cell,i - 25)] × η_dirt,i
            </code>
            <span className="text-[11px] text-slate-400">
              Where P_rated = 2.0 kW, γ_Pmax = -0.0038 / °C (-0.38% / °C temperature coefficient for silicon cells), η_dirt = soiling factor (0.95 - 0.99).
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Real-time Measurement & Daily Averaging */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>2. Grid Measurement & Daily Averaging Metrics</span>
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed">
          The supervisory system measures instantaneous electrical output from each of the 100 houses (<span className="font-mono text-slate-200">i = 1 ... 100</span>) and integrates total and average energy produced across a 24-hour diurnal cycle.
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-3 text-slate-300">
          <div>
            <span className="text-slate-500 block mb-1">Instantaneous Total Solar Power (kW):</span>
            <code className="text-cyan-300 font-bold block text-sm">
              P_total(t) = ∑(i=1 to 100) P_solar,i(t)
            </code>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-slate-500 block mb-1">Instantaneous Average Power per House (kW/house):</span>
            <code className="text-amber-300 font-bold block text-sm">
              P_avg(t) = P_total(t) / 100
            </code>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-slate-500 block mb-1">Total Daily Electricity Produced (kWh/day):</span>
            <code className="text-emerald-300 font-bold block text-sm">
              E_total,day = ∫(0 to 24) P_total(t) dt
            </code>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-slate-500 block mb-1">Daily Average Electricity Produced per House (kWh/house/day):</span>
            <code className="text-yellow-300 font-bold block text-sm">
              E_avg,house,day = E_total,day / 100
            </code>
          </div>
        </div>
      </div>

      {/* Section 3: Boost Converter & DC Bus System */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span>3. DC-DC Boost Converter & 380V DC Bus System</span>
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed">
          The low variable DC output of each PV array (~32V to 45V DC depending on irradiance and temperature) cannot be efficiently distributed directly across 100 homes due to resistive $I^2R$ line losses. A dedicated high-frequency synchronous DC-DC boost converter with Maximum Power Point Tracking (MPPT) steps up the voltage to a common 380V DC Bus.
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-3 text-slate-300">
          <div>
            <span className="text-slate-500 block mb-1">Boost Converter Voltage Relationship:</span>
            <code className="text-cyan-300 font-bold block text-sm">
              V_out = V_in / (1 - D)  ⟹  D = 1 - (V_in / V_out)
            </code>
            <span className="text-[11px] text-slate-400">
              Where V_out = 380V DC, V_in ≈ 36V DC, resulting in a nominal PWM duty cycle D ≈ 0.905 (90.5%).
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-slate-500 block mb-1">Kirchhoff's Power Law on Central DC Bus:</span>
            <code className="text-emerald-300 font-bold block text-sm">
              ∑ P_solar_boost = P_battery_charge + P_necessary_load + P_non_essential_load + P_grid_export
            </code>
          </div>
        </div>
      </div>

      {/* Section 4: AI Battery Management System (BMS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-teal-400" />
          <span>4. AI Battery Management System (BMS) Health Supervision</span>
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed">
          The 500 kWh central Lithium Iron Phosphate (LiFePO4) battery storage bank is supervised by an AI BMS system powered by Gemini 3.8 Flash and deterministic electrochemistry equations. The AI model manages:
        </p>

        <ul className="text-xs text-slate-300 space-y-2 list-disc pl-5">
          <li>
            <strong className="text-slate-100">Adaptive C-Rate Limiter:</strong> Tapers charge current when State of Charge exceeds 90% or cell temperature rises above 38°C to prevent lithium plating and dendrite growth.
          </li>
          <li>
            <strong className="text-slate-100">Arrhenius Cycle Degradation Model:</strong> Calculates real-time State of Health (SoH) wear factoring in depth-of-discharge (DoD), temperature excursions, and high-current cycling stresses.
          </li>
          <li>
            <strong className="text-slate-100">Active String Cell Balancing:</strong> Measures voltage spread across 16 monitored series cell strings. Activates charge-redistribution bleeding circuits whenever cell voltage delta ΔV &gt; 20 mV.
          </li>
          <li>
            <strong className="text-slate-100">Thermal Runaway Guard:</strong> Modulates cooling fan PWM from 15% up to 100%, and throttles battery power if temperatures approach 45°C.
          </li>
        </ul>
      </div>

      {/* Section 5: Two-Tier Load Prioritization Algorithm */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>5. Two-Tier Load Prioritization & Energy Dispatch Algorithm</span>
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed">
          The microgrid divides load demand into two distinct components:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded-lg border border-emerald-500/40 space-y-2">
            <span className="text-emerald-400 font-bold block text-sm">Tier-1: Necessary Load (ALWAYS ON)</span>
            <p className="text-slate-300">
              Critical life-support, medical equipment, refrigeration, emergency communication, and water pumps. Guaranteed 100% continuous power. Top priority over battery charging during solar deficits.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <span className="text-cyan-400 font-bold block text-sm">Tier-2: Non-Essential Load (Flexible / Sheddable)</span>
            <p className="text-slate-300">
              Electric vehicle (EV) charging stations, luxury HVAC boosters, swimming pool pumps, and secondary water heaters. Dynamically throttled or shut OFF when solar generation is insufficient.
            </p>
          </div>
        </div>

        {/* Dispatch Pseudo-code */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-1 text-slate-300">
          <div className="text-slate-500">// AI Energy Dispatch Logic Execution</div>
          <div>if (P_solar &gt;= P_necessary + P_non_essential) &#123;</div>
          <div className="pl-4 text-emerald-400">Power_Necessary = 100%; Power_Non_Essential = 100%;</div>
          <div className="pl-4 text-cyan-300">Surplus = P_solar - (P_necessary + P_non_essential);</div>
          <div className="pl-4 text-cyan-300">P_battery_charge = min(Surplus, Max_Charge_Rate); // Redirect surplus to BESS</div>
          <div>&#125; else if (P_solar &gt;= P_necessary) &#123;</div>
          <div className="pl-4 text-emerald-400">Power_Necessary = 100%; // Solar fully powers necessary loads</div>
          <div className="pl-4 text-amber-300">P_battery_charge = 0; // No surplus! Do not charge battery</div>
          <div className="pl-4 text-slate-300">Remaining_Solar = P_solar - P_necessary;</div>
          <div className="pl-4 text-slate-300">if (Battery_SoC &gt; 30% &amp;&amp; Allow_Battery_Support) &#123;</div>
          <div className="pl-8 text-amber-400">Battery_Discharge to support Non_Essential;</div>
          <div className="pl-4">&#125; else &#123;</div>
          <div className="pl-8 text-rose-400">Shed_Non_Essential_Loads(); // Protect battery health &amp; necessary reserve</div>
          <div className="pl-4">&#125;</div>
          <div>&#125; else &#123;</div>
          <div className="pl-4 text-rose-400">// Solar &lt; Necessary Load: CRITICAL DEFICIT</div>
          <div className="pl-4 text-emerald-400">Direct 100% of Solar to Necessary Load;</div>
          <div className="pl-4 text-amber-400">Battery_Discharge = P_necessary - P_solar; // Supply remaining necessary balance</div>
          <div className="pl-4 text-rose-400">Power_Non_Essential = 0%; // 100% Shed (Turned OFF)</div>
          <div>&#125;</div>
        </div>
      </div>

    </div>
  );
};
