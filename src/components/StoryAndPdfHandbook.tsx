import React from 'react';
import { Printer, BookOpen, Sun, Zap, Layers, Cpu, ShieldCheck, Sparkles } from 'lucide-react';

export const StoryAndPdfHandbook: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Action Bar (Hidden when printing to PDF) */}
      <div className="print:hidden bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>The Microgrid Story & Complete Engineering Handbook</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full narrative explanation with every mathematical equation, physics law, and engineering concept.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 rounded-lg shadow transition-all whitespace-nowrap cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Save / Print as PDF</span>
        </button>
      </div>

      {/* Printable Document Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-10 text-slate-200 space-y-8 print:bg-white print:text-black print:border-none print:p-0 print:m-0">
        
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 print:border-slate-300">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-400 print:text-blue-700 mb-2">
            <span>SOLARGRID-100 ENGINEERING MONOGRAPH</span>
            <span>TECHNICAL SPECIFICATION & NARRATIVE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 print:text-black tracking-tight">
            The Journey of a Photon in "Suryanagar": A 100-House Solar Microgrid Story
          </h1>
          <p className="text-sm text-slate-400 print:text-slate-600 mt-2 leading-relaxed">
            A comprehensive, story-driven technical exploration of photovoltaic physics, synchronous DC-DC boost converters, 380V DC Bus regulation, AI battery management, and two-tier priority load dispatching.
          </p>
        </div>

        {/* Chapter 1 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-amber-400 print:text-amber-700 font-bold text-base">
            <Sun className="w-5 h-5" />
            <h2>Chapter 1: The Awakening of the 100 Houses (Photovoltaic Physics)</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
            Imagine a modern township named <strong>Suryanagar</strong>. In this town, 100 identical houses are built in a perfect <strong>square formation (a 10 × 10 grid)</strong>. 
            On the rooftop of each house sits a dedicated photovoltaic solar system with a maximum rated capacity of <strong>2.0 kW (2000 Watts)</strong>. Together, when the sun is at its zenith, this community can theoretically generate up to <strong>200 kW</strong> of clean power.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
            As the sun rises, photons stream through the vacuum of space and strike the semiconductor silicon solar panels. But how much electricity is actually produced? It is not a fixed number; it is governed by two physical variables: <strong>Solar Irradiance (G in W/m²)</strong> and <strong>Surrounding Temperature (T_amb in °C)</strong>.
          </p>

          <div className="bg-slate-950 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-lg p-4 font-mono text-xs space-y-2 text-slate-300 print:text-slate-900">
            <div className="text-cyan-400 print:text-blue-700 font-bold">// 1. Cell Temperature Calculation (NOCT Formula)</div>
            <div className="text-sm font-bold text-amber-300 print:text-amber-800">
              T_cell = T_amb + [(NOCT - 20) / 800] × G
            </div>
            <p className="text-[11px] text-slate-400 print:text-slate-600">
              Where NOCT (Nominal Operating Cell Temperature) is typically 45°C. When irradiance G = 1000 W/m² and ambient temperature is 30°C, the dark silicon panels heat up to:
              <br />
              T_cell = 30 + [(45 - 20) / 800] × 1000 = 30 + 31.25 = 61.25°C!
            </p>
            <div className="pt-2 border-t border-slate-800 print:border-slate-300 text-cyan-400 print:text-blue-700 font-bold">
              // 2. Real-Time Solar Electricity Output Equation
            </div>
            <div className="text-sm font-bold text-amber-300 print:text-amber-800">
              P_solar(G, T) = P_rated × (G / G_STC) × [1 + γ_Pmax × (T_cell - 25)] × η_dirt
            </div>
            <p className="text-[11px] text-slate-400 print:text-slate-600">
              Here, P_rated = 2.0 kW, G_STC = 1000 W/m², γ_Pmax = -0.0038 / °C (-0.38% per °C temperature coefficient for silicon cells), and η_dirt ≈ 0.98.
              Notice that as the panel gets hotter (T_cell &gt; 25°C), internal resistance increases, and power drops by 0.38% per degree Celsius!
            </p>
          </div>
        </section>

        {/* Chapter 2 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 print:text-cyan-700 font-bold text-base">
            <Zap className="w-5 h-5" />
            <h2>Chapter 2: The Boost Converter – The Voltage Elevator</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
            The electricity coming out of the rooftop panels has a low, fluctuating voltage—typically between <strong>32V and 45V DC</strong>. If we tried to send 2000 Watts through cables across the neighborhood at 36 Volts, the current would be enormous (I = P / V = 2000 / 36 ≈ 55.5 Amperes per house!). Heavy current would burn through the copper wires due to resistive heating losses (P_loss = I² × R).
          </p>
          <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
            To solve this, each house has a <strong>DC-DC Boost Converter</strong> equipped with Maximum Power Point Tracking (MPPT). The boost converter acts like an electrical elevator: it rapidly pulses a high-speed semiconductor switch (MOSFET) and an inductor to step the voltage up from ~36V DC all the way to a regulated <strong>380V DC</strong>!
          </p>

          <div className="bg-slate-950 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-lg p-4 font-mono text-xs space-y-2 text-slate-300 print:text-slate-900">
            <div className="text-cyan-400 print:text-blue-700 font-bold">// Boost Converter Transfer Function</div>
            <div className="text-sm font-bold text-cyan-300 print:text-cyan-800">
              V_out = V_in / (1 - D)  ⟹  D = 1 - (V_in / V_out)
            </div>
            <p className="text-[11px] text-slate-400 print:text-slate-600">
              For V_in = 36V and V_out = 380V, the duty cycle D = 1 - (36 / 380) ≈ 0.905 (90.5%).
              The output current is reduced from 55A down to just I_out = (P × η_boost) / 380 ≈ 5.1A, reducing line transmission power losses by more than 99%!
            </p>
          </div>
        </section>

        {/* Chapter 3 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 print:text-emerald-700 font-bold text-base">
            <Layers className="w-5 h-5" />
            <h2>Chapter 3: The Common 380V DC Bus – The Grand Energy Highway</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
            All 100 boost converters feed their stepped-up electricity into a single shared backbone: the <strong>380V DC Bus</strong>. 
            Unlike conventional alternating current (AC) grids that require frequency synchronization (50Hz / 60Hz) and reactive power compensation, a DC bus eliminates reactive losses and provides a clean, unified node where generation, battery storage, and loads meet.
          </p>
          <div className="bg-slate-950 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-lg p-4 font-mono text-xs text-slate-300 print:text-slate-900">
            <div className="text-emerald-400 print:text-emerald-800 font-bold">// Kirchhoff's Power Balance Law at the DC Bus:</div>
            <div className="text-sm font-bold text-slate-100 print:text-black mt-1">
              ∑ P_solar_boost = P_battery_flow + P_necessary_load + P_non_essential_load + P_grid_export
            </div>
          </div>
        </section>

        {/* Chapter 4 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-teal-400 print:text-teal-700 font-bold text-base">
            <Cpu className="w-5 h-5" />
            <h2>Chapter 4: The 500 kWh Guardian & The AI Battery Management Brain</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
            Connected to the DC bus is a central <strong>500 kWh Lithium Iron Phosphate (LiFePO4) Battery Storage Unit (BESS)</strong>. 
            Batteries are delicate electrochemical systems. If charged too quickly in the cold, lithium plates onto the anode. If allowed to overheat, electrolyte degrades and thermal runaway can occur. If individual cells in the series string drift apart in voltage, the weakest cell fails first.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
            To prevent this, our system introduces an <strong>AI Battery Management System (BMS)</strong> integrated with Gemini 3.8 Flash and deterministic physical supervision:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-slate-950 print:bg-slate-100 p-3 rounded-lg border border-slate-800 print:border-slate-300 space-y-1">
              <span className="font-bold text-teal-400 print:text-teal-800">1. Coulomb Counting & SoC:</span>
              <p className="text-[11px] text-slate-400 print:text-slate-700">
                SoC(t) = SoC(0) + (1 / C_nom) × ∫ η_coulomb × I(t) dt. Tracks exact charge integration.
              </p>
            </div>
            <div className="bg-slate-950 print:bg-slate-100 p-3 rounded-lg border border-slate-800 print:border-slate-300 space-y-1">
              <span className="font-bold text-teal-400 print:text-teal-800">2. Arrhenius SoH Degradation:</span>
              <p className="text-[11px] text-slate-400 print:text-slate-700">
                Rate_fade = A × exp(-E_a / (R × T)) × (C_rate)^β × (DoD)^γ. Models thermal and cycle aging.
              </p>
            </div>
            <div className="bg-slate-950 print:bg-slate-100 p-3 rounded-lg border border-slate-800 print:border-slate-300 space-y-1">
              <span className="font-bold text-teal-400 print:text-teal-800">3. Active 16-Cell Balancing:</span>
              <p className="text-[11px] text-slate-400 print:text-slate-700">
                Measures ΔV = V_max - V_min. When ΔV &gt; 20 mV, active bleeding circuits equalize the cells.
              </p>
            </div>
            <div className="bg-slate-950 print:bg-slate-100 p-3 rounded-lg border border-slate-800 print:border-slate-300 space-y-1">
              <span className="font-bold text-teal-400 print:text-teal-800">4. Thermal Runaway Guard:</span>
              <p className="text-[11px] text-slate-400 print:text-slate-700">
                P_heat = I² × R_int. Modulates cooling fans PWM from 15% to 100% and throttles current if T &gt; 38°C.
              </p>
            </div>
          </div>
        </section>

        {/* Chapter 5 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-rose-400 print:text-rose-700 font-bold text-base">
            <ShieldCheck className="w-5 h-5" />
            <h2>Chapter 5: The Two-Tier Load Priority – The Core Law of Survival</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
            Electricity consumption in the 100 houses is strictly divided into two distinct components:
          </p>
          <ul className="text-xs sm:text-sm text-slate-300 print:text-slate-800 space-y-1.5 list-disc pl-5">
            <li>
              <strong>Tier-1: Necessary Load (ALWAYS ON)</strong>: Medical life-support devices, refrigerators preserving insulin and food, security communications, and water filtration. Total baseline across 100 houses ≈ 45 kW. <em>This load must never experience an interruption.</em>
            </li>
            <li>
              <strong>Tier-2: Non-Essential Load (Flexible / Sheddable)</strong>: Electric vehicle (EV) charging stations, secondary air conditioning, pool water circulation, and decorative lighting. Total demand ≈ 65 kW.
            </li>
          </ul>

          <div className="bg-slate-950 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-lg p-4 font-mono text-xs space-y-3 text-slate-300 print:text-slate-900">
            <div className="font-bold text-emerald-400 print:text-emerald-800">// SCENARIO A: SURPLUS GENERATION (P_solar ≥ Necessary + Non-Essential)</div>
            <p className="text-[11px] text-slate-300 print:text-slate-700">
              When the sun shines brightly at noon and P_solar = 160 kW while total demand is 45 + 65 = 110 kW:
              <br />
              1. 100% of Necessary Loads are powered.
              <br />
              2. 100% of Non-Essential Loads are powered.
              <br />
              3. The remaining <strong>50 kW surplus is redirected to charge the Battery Storage Unit</strong> via the DC bus!
            </p>

            <div className="pt-2 border-t border-slate-800 print:border-slate-300 font-bold text-amber-400 print:text-amber-800">
              // SCENARIO B: DEFICIT GENERATION (P_solar &lt; Necessary + Non-Essential)
            </div>
            <p className="text-[11px] text-slate-300 print:text-slate-700">
              When clouds drift in or late afternoon arrives and P_solar = 35 kW:
              <br />
              1. <strong>NO SURPLUS exists! Therefore, ZERO power is diverted to charge the battery.</strong>
              <br />
              2. The system <strong>strictly prioritizes supplying power to Necessary Loads over battery charging</strong>.
              <br />
              3. All 35 kW of solar is routed directly to the Necessary Load (45 kW).
              <br />
              4. The battery discharges 10 kW to bridge the remainder for the Necessary Load.
              <br />
              5. <strong>Non-Essential Loads are immediately SHUT OFF (shed)</strong> so the battery does not get drained and critical services are 100% protected!
            </p>
          </div>
        </section>

        {/* Chapter 6 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-yellow-400 print:text-yellow-700 font-bold text-base">
            <Sparkles className="w-5 h-5" />
            <h2>Chapter 6: The Daily Reckoning – Measurement & Daily Averaging</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
            At the close of each day, the supervisory management system performs the mathematical accounting to evaluate community productivity:
          </p>

          <div className="bg-slate-950 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-lg p-4 font-mono text-xs space-y-2 text-slate-300 print:text-slate-900">
            <div>
              <span className="text-slate-400 print:text-slate-600 block">Total Daily Generation Integral:</span>
              <span className="text-sm font-bold text-amber-300 print:text-amber-800">
                E_total_day = ∫(t=0 to 24) P_total(t) dt  [kWh/day]
              </span>
            </div>
            <div className="pt-1">
              <span className="text-slate-400 print:text-slate-600 block">Average Daily Generation per House:</span>
              <span className="text-sm font-bold text-cyan-300 print:text-cyan-800">
                E_avg_house_day = E_total_day / 100  [kWh/house/day]
              </span>
            </div>
            <p className="text-[11px] text-slate-400 print:text-slate-600 pt-1">
              On a clear summer day, E_total_day ≈ 1050 kWh, meaning each house produces an average of <strong>10.5 kWh of electricity per day</strong>, with peak instantaneous community generation reaching up to <strong>170 kW</strong>!
            </p>
          </div>
        </section>

        {/* Summary Table */}
        <div className="pt-4 border-t border-slate-800 print:border-slate-300">
          <h3 className="text-sm font-bold text-slate-100 print:text-black mb-3">
            Mathematical & Engineering Summary Table
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border border-slate-800 print:border-slate-300">
              <thead className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-700">
                <tr>
                  <th className="p-2 border border-slate-800 print:border-slate-300">Subsystem</th>
                  <th className="p-2 border border-slate-800 print:border-slate-300">Governing Equation</th>
                  <th className="p-2 border border-slate-800 print:border-slate-300">Key Parameters</th>
                  <th className="p-2 border border-slate-800 print:border-slate-300">Engineering Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-300 text-slate-300 print:text-slate-800">
                <tr>
                  <td className="p-2 border border-slate-800 print:border-slate-300 font-bold">100 Solar Arrays</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">P(G,T) = P_r × (G / 1000) × [1 + γ(T_c - 25)]</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">P_r = 2.0 kW, γ = -0.38% / °C</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">Models real-time irradiance and thermal derating</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-800 print:border-slate-300 font-bold">Boost Converter</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">V_out = V_in / (1 - D)</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">V_out = 380V, D ≈ 0.905</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">Steps up PV voltage and reduces I²R line losses by &gt;99%</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-800 print:border-slate-300 font-bold">Common DC Bus</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">∑ P_in = ∑ P_out</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">Regulated 380V DC</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">Central transmission node uniting PV, battery & loads</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-800 print:border-slate-300 font-bold">AI BMS Engine</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">Arrhenius & Coulomb counting</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">500 kWh, 16 cells, ΔV ≤ 20 mV</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">Cell balancing, thermal runaway guard, cycle longevity</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-800 print:border-slate-300 font-bold">Priority Governor</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">Surplus ⟹ Battery; Deficit ⟹ Necessary Load</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">Necessary 45 kW, Non-Essential 65 kW</td>
                  <td className="p-2 border border-slate-800 print:border-slate-300">Guarantees critical life loads never experience blackout</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
