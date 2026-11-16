import { BatteryStorageUnit, BatteryCell, BMSHealthReport } from '../types/microgrid';

export const BATTERY_NOMINAL_CAPACITY_KWH = 500; // 500 kWh central LiFePO4 bank
export const BATTERY_NOMINAL_VOLTAGE = 380; // 380V DC
export const MAX_CHARGE_POWER_KW = 120; // 120 kW maximum charge
export const MAX_DISCHARGE_POWER_KW = 150; // 150 kW maximum discharge

/**
 * Initializes the central Battery Storage Unit with 16 monitored cell strings
 */
export function initializeBatteryStorage(): BatteryStorageUnit {
  const initialSoC = 68.0; // 68% initial charge
  const initialCapacity = BATTERY_NOMINAL_CAPACITY_KWH;
  const storedEnergyKwh = (initialSoC / 100) * initialCapacity;

  // Initialize 16 monitored cell series modules
  const cells: BatteryCell[] = [];
  for (let i = 1; i <= 16; i++) {
    // slight natural manufacturing variance (+- 0.012V)
    const variance = (Math.sin(i * 1.7) * 0.015);
    const nominalCellV = 3.25 + variance;
    cells.push({
      id: i,
      voltageV: Math.round(nominalCellV * 1000) / 1000,
      temperatureC: 24.5 + Math.abs(Math.sin(i)) * 1.5,
      internalResistanceMOhm: 0.42 + Math.abs(Math.cos(i)) * 0.05,
      balancingActive: false,
    });
  }

  return {
    capacityKwh: initialCapacity,
    storedEnergyKwh: Math.round(storedEnergyKwh * 10) / 10,
    stateOfChargePct: initialSoC,
    stateOfHealthPct: 98.4,
    nominalVoltageV: BATTERY_NOMINAL_VOLTAGE,
    currentA: 0,
    powerKw: 0,
    maxChargePowerKw: MAX_CHARGE_POWER_KW,
    maxDischargePowerKw: MAX_DISCHARGE_POWER_KW,
    averageTempC: 25.2,
    cycleCount: 142.6,
    cRate: 0,
    depthOfDischargeAvgPct: 42.0,
    thermalRunawayRisk: 'LOW',
    coolingFanPwmPct: 20,
    cells,
  };
}

/**
 * Simulates one step of battery operation with thermal, degradation, and cell balancing physics
 * @param battery Current battery state
 * @param powerFlowKw Power flow into (+ charging) or out of (- discharging) battery
 * @param dtSeconds Elapsed time in seconds for this simulation step
 * @param aiHealthModeEnabled Whether the AI BMS smart protection is active
 */
export function stepBatterySimulation(
  battery: BatteryStorageUnit,
  powerFlowKw: number,
  dtSeconds: number,
  aiHealthModeEnabled: boolean = true
): BatteryStorageUnit {
  const dtHours = dtSeconds / 3600;
  
  // Apply AI health protection constraints if active
  let effectivePowerKw = powerFlowKw;

  if (aiHealthModeEnabled) {
    // 1. Adaptive C-Rate capping when near 100% or high temp
    if (effectivePowerKw > 0 && battery.stateOfChargePct > 90) {
      // Taper charge current to prevent lithium plating and cathode degradation
      const taperFactor = Math.max(0.2, (100 - battery.stateOfChargePct) / 10);
      effectivePowerKw = Math.min(effectivePowerKw, battery.maxChargePowerKw * taperFactor);
    }

    // 2. Thermal throttling if battery temperature rises above 42°C
    if (battery.averageTempC > 42) {
      effectivePowerKw = effectivePowerKw * 0.7; // 30% reduction to prevent heat buildup
    }

    // 3. Prevent deep discharge past 10%
    if (effectivePowerKw < 0 && battery.stateOfChargePct <= 10.0) {
      effectivePowerKw = 0; // Cutoff discharge to protect cell life
    }
  }

  // Energy integration (Coulomb counting with 96% round-trip coulombic efficiency)
  const efficiency = effectivePowerKw > 0 ? 0.96 : 0.98;
  const deltaEnergyKwh = effectivePowerKw * dtHours * efficiency;
  
  let newStoredEnergy = battery.storedEnergyKwh + deltaEnergyKwh;
  newStoredEnergy = Math.max(0, Math.min(battery.capacityKwh, newStoredEnergy));
  
  const newSoC = Math.max(0, Math.min(100, (newStoredEnergy / battery.capacityKwh) * 100));

  // Dynamic Pack Voltage calculation based on LiFePO4 open circuit voltage (OCV) curve
  // Nominal 380V: Flat plateau around 3.2V per cell (360V - 390V), drops steeply below 15% and rises sharply above 90%
  let packVoltage = 370 + (newSoC / 100) * 20;
  if (newSoC < 15) packVoltage -= (15 - newSoC) * 2.5;
  if (newSoC > 90) packVoltage += (newSoC - 90) * 1.8;

  // Current A = (Power in Watts) / Voltage
  const currentA = (effectivePowerKw * 1000) / packVoltage;
  const cRate = Math.abs(effectivePowerKw) / battery.capacityKwh;

  // Temperature dynamics: Joule heating (I^2 * R) vs Ambient cooling
  const ambientTempC = 25.0;
  const totalRInternal = 0.045; // ~45 mOhm pack resistance
  const heatGeneratedWatts = Math.pow(currentA, 2) * totalRInternal;
  
  // Cooling Fan PWM adjustment
  let coolingFanPwmPct = 15;
  if (battery.averageTempC > 32) coolingFanPwmPct = 40;
  if (battery.averageTempC > 38) coolingFanPwmPct = 75;
  if (battery.averageTempC > 45) coolingFanPwmPct = 100;

  // Thermal dissipation factor
  const coolingRate = (coolingFanPwmPct / 100) * 0.002 * (battery.averageTempC - ambientTempC);
  const heatingRate = (heatGeneratedWatts / 100000) * 0.01;
  const newTemp = Math.max(ambientTempC, battery.averageTempC + (heatingRate - coolingRate) * (dtSeconds / 60));

  // Thermal runaway risk
  let thermalRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (newTemp >= 36) thermalRisk = 'MODERATE';
  if (newTemp >= 46) thermalRisk = 'HIGH';
  if (newTemp >= 55) thermalRisk = 'CRITICAL';

  // State of Health (SoH) wear model:
  // Degradation depends on throughput, temperature stress, and C-rate
  const cycleIncrement = Math.abs(effectivePowerKw * dtHours) / (2 * battery.capacityKwh);
  const tempStressFactor = newTemp > 35 ? 1 + (newTemp - 35) * 0.08 : 1.0;
  const cRateStressFactor = cRate > 0.5 ? 1 + (cRate - 0.5) * 1.5 : 1.0;
  const degradationPerCycle = 0.00008 * tempStressFactor * cRateStressFactor;
  const newSoH = Math.max(70, battery.stateOfHealthPct - (cycleIncrement * degradationPerCycle * 100));

  // Cell string monitoring and active balancing
  const baseCellV = packVoltage / 16;
  const cellDeltaThreshold = 0.020; // 20 mV threshold for balancing
  
  const updatedCells = battery.cells.map((cell) => {
    // slight natural variance
    const drift = Math.sin(cell.id * 3.3 + newSoC * 0.05) * 0.012;
    let cellV = baseCellV + drift;
    
    // Check if cell is higher than median -> balance it
    const shouldBalance = aiHealthModeEnabled && Math.abs(cellV - baseCellV) > cellDeltaThreshold;
    if (shouldBalance) {
      // active cell balancing bleeding current/transfer
      cellV = cellV - (cellV > baseCellV ? 0.002 : -0.002);
    }

    return {
      ...cell,
      voltageV: Math.round(cellV * 1000) / 1000,
      temperatureC: Math.round((newTemp + (cell.id % 4 === 0 ? 1.2 : -0.8)) * 10) / 10,
      balancingActive: shouldBalance,
    };
  });

  return {
    ...battery,
    storedEnergyKwh: Math.round(newStoredEnergy * 10) / 10,
    stateOfChargePct: Math.round(newSoC * 10) / 10,
    stateOfHealthPct: Math.round(newSoH * 100) / 100,
    nominalVoltageV: Math.round(packVoltage * 10) / 10,
    currentA: Math.round(currentA * 10) / 10,
    powerKw: Math.round(effectivePowerKw * 10) / 10,
    averageTempC: Math.round(newTemp * 10) / 10,
    cycleCount: Math.round((battery.cycleCount + cycleIncrement) * 100) / 100,
    cRate: Math.round(cRate * 100) / 100,
    thermalRunawayRisk: thermalRisk,
    coolingFanPwmPct,
    cells: updatedCells,
  };
}

/**
 * Generate a deterministic AI BMS Health & Diagnostic report
 * (used when offline or as instant fallback)
 */
export function generateLocalBMSReport(battery: BatteryStorageUnit): BMSHealthReport {
  const maxCellV = Math.max(...battery.cells.map(c => c.voltageV));
  const minCellV = Math.min(...battery.cells.map(c => c.voltageV));
  const deltaV = Math.round((maxCellV - minCellV) * 1000); // mV

  const diagnostics: string[] = [
    `Current State of Health: ${battery.stateOfHealthPct}% (LiFePO4 chemistry nominal)`,
    `Cell Voltage Spread: Δ${deltaV} mV across 16 series modules (${deltaV < 25 ? 'Excellent Balance' : 'Active Balancing Engaged'})`,
    `Thermal Envelope: ${battery.averageTempC}°C (Cooling fans at ${battery.coolingFanPwmPct}% PWM, Risk: ${battery.thermalRunawayRisk})`,
    `C-Rate Stress: Current C-Rate is ${battery.cRate}C (${battery.cRate < 0.3 ? 'Gentle' : 'Moderate stress'})`,
  ];

  const recommendations: string[] = [
    'Maintain daily cycle depth within 20% - 85% SoC to prolong cell longevity beyond 4,500 equivalent full cycles.',
    'During midday solar peak, adaptive C-rate charge tapering prevents localized lithium plating on anode surfaces.',
    'Ensure non-essential loads are throttled during solar deficits so battery reserves protect necessary loads.',
  ];

  return {
    timestamp: new Date().toLocaleTimeString(),
    healthScore: Math.round(battery.stateOfHealthPct),
    estimatedLifeRemainingYears: Math.round((battery.stateOfHealthPct - 70) / 2.2 * 10) / 10,
    degradationRatePerYearPct: 1.85,
    aiDiagnostics: diagnostics,
    recommendations,
    chargePolicyAdvice: 'Adaptive CC-CV with dynamic thermal-compensation and MPPT boost sync active.',
    loadManagementStatus: 'Necessary Loads (Tier-1) permanently protected; Non-Essential Loads (Tier-2) shed dynamically during generation deficits.',
    optimalSoCWindow: { min: 20, max: 85 },
  };
}
