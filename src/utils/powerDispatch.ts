import { HouseData, BatteryStorageUnit, DCBusSystem } from '../types/microgrid';

export interface DispatchResult {
  dcBus: DCBusSystem;
  batteryFlowKw: number; // + is charging, - is discharging
  necessaryCoveredPct: number; // Must be 100% unless extreme grid blackout
  nonEssentialCoveredPct: number; // 0% to 100%
  nonEssentialShedReason: string;
  surplusPowerKw: number;
  updatedHouses: HouseData[];
}

/**
 * Executes the 2-Tier Prioritized Microgrid Load Dispatch Strategy
 * 
 * Rules:
 * 1. Necessary Load is ALWAYS ON (Top priority #1).
 * 2. When Solar > Total Load (Necessary + Non-Essential):
 *    - Power all necessary loads.
 *    - Power all non-essential loads.
 *    - Redirect ALL surplus energy to charge the Battery Storage Unit (up to max charge rate).
 *    - If battery is at 100% SoC, export surplus or curtail.
 * 3. When Solar < Total Load:
 *    - NO SURPLUS exists for battery charging.
 *    - Prioritize supplying power to necessary loads over battery charging.
 *    - If Solar < Necessary Load:
 *      * Direct all solar to necessary loads.
 *      * Battery discharges to cover the deficit for necessary loads.
 *      * Non-essential load is SHED (turned OFF) to protect essential services and battery reserves.
 *    - If Necessary Load <= Solar < Total Load:
 *      * Direct solar to fully satisfy necessary loads.
 *      * Remaining solar feeds non-essential loads.
 *      * If battery SoC > minimum buffer (30%), battery discharges to support remaining non-essential loads.
 *      * If battery SoC <= buffer, non-essential loads are throttled/shed to protect battery health.
 */
export function calculatePowerDispatch(
  houses: HouseData[],
  totalSolarKw: number,
  battery: BatteryStorageUnit,
  allowBatterySupportNonEssential: boolean = true
): DispatchResult {
  // Aggregate loads
  let necessaryLoadTotalKw = 0;
  let rawNonEssentialLoadTotalKw = 0;

  houses.forEach((h) => {
    necessaryLoadTotalKw += h.necessaryLoadKw;
    rawNonEssentialLoadTotalKw += h.nonEssentialLoadKw;
  });

  const totalDemandKw = necessaryLoadTotalKw + rawNonEssentialLoadTotalKw;
  
  let batteryFlowKw = 0; // + charging, - discharging
  let gridExportKw = 0;
  let gridImportKw = 0;
  let nonEssentialCoveredPct = 100;
  let nonEssentialShedReason = 'Operating normally - ample solar surplus';
  let surplusPowerKw = 0;

  const maxChargeRate = battery.maxChargePowerKw;
  const maxDischargeRate = battery.maxDischargePowerKw;
  const isBatteryFull = battery.stateOfChargePct >= 99.5;
  const isBatteryDepleted = battery.stateOfChargePct <= 6.0;

  if (totalSolarKw >= totalDemandKw) {
    // ==========================================
    // CASE 1: FULL SURPLUS GENERATION
    // ==========================================
    surplusPowerKw = totalSolarKw - totalDemandKw;
    nonEssentialCoveredPct = 100;
    nonEssentialShedReason = 'All loads active. Surplus directed to Battery Storage Unit.';

    if (!isBatteryFull) {
      // Direct surplus into battery
      const chargeRate = Math.min(surplusPowerKw, maxChargeRate);
      batteryFlowKw = chargeRate; // Positive = Charging
      
      const unabsorbedSurplus = surplusPowerKw - chargeRate;
      if (unabsorbedSurplus > 0) {
        gridExportKw = unabsorbedSurplus; // export remainder to macrogrid
      }
    } else {
      // Battery is full, export all surplus
      batteryFlowKw = 0;
      gridExportKw = surplusPowerKw;
      nonEssentialShedReason = 'All loads active. Battery 100% full; exporting surplus to grid.';
    }

  } else if (totalSolarKw >= necessaryLoadTotalKw && totalSolarKw < totalDemandKw) {
    // ==========================================
    // CASE 2: PARTIAL SOLAR (Covers Necessary, Deficit in Non-Essential)
    // ==========================================
    // "When there is not surplus it should prioritize supplying power to necessary loads over battery charging"
    // No surplus exists to charge battery!
    const availableForNonEssential = totalSolarKw - necessaryLoadTotalKw;
    const nonEssentialDeficit = rawNonEssentialLoadTotalKw - availableForNonEssential;
    surplusPowerKw = 0;

    // Check if battery can and should support non-essential load
    const safeBufferSoCPct = 30; // Protect reserve for critical loads & battery health
    if (rawNonEssentialLoadTotalKw <= 0.0001) {
      nonEssentialCoveredPct = 100;
      batteryFlowKw = 0;
      nonEssentialShedReason = 'Non-essential loads switched OFF by user; solar fully covers active necessary loads.';
    } else if (allowBatterySupportNonEssential && battery.stateOfChargePct > safeBufferSoCPct && !isBatteryDepleted) {
      // Battery discharges to bridge the non-essential deficit
      const dischargeTarget = Math.min(nonEssentialDeficit, maxDischargeRate);
      batteryFlowKw = -dischargeTarget; // Negative = Discharging
      
      const coveredKw = availableForNonEssential + dischargeTarget;
      nonEssentialCoveredPct = Math.min(100, Math.round((coveredKw / rawNonEssentialLoadTotalKw) * 100));
      nonEssentialShedReason = `Solar prioritizing necessary loads. Battery discharging ${dischargeTarget.toFixed(1)} kW to support non-essential loads.`;
    } else {
      // Shed non-essential load to protect battery health and preserve reserve
      const coveredKw = availableForNonEssential;
      nonEssentialCoveredPct = Math.min(100, Math.round((coveredKw / rawNonEssentialLoadTotalKw) * 100));
      batteryFlowKw = 0; // Strictly preserve battery
      nonEssentialShedReason = `Solar deficit detected. Non-essential loads throttled to ${nonEssentialCoveredPct}% to prioritize necessary loads and protect battery health.`;
    }

  } else {
    // ==========================================
    // CASE 3: DEFICIT SOLAR (Solar < Necessary Loads)
    // ==========================================
    // Solar cannot even cover all necessary loads!
    // 100% of solar immediately directed to necessary loads.
    // Zero surplus, zero battery charging.
    // Non-essential load is SHED (turned OFF) immediately.
    surplusPowerKw = 0;
    nonEssentialCoveredPct = 0;
    
    const necessaryDeficit = necessaryLoadTotalKw - totalSolarKw;
    
    if (!isBatteryDepleted) {
      // Battery discharges to supply remaining balance for necessary loads
      const dischargeKw = Math.min(necessaryDeficit, maxDischargeRate);
      batteryFlowKw = -dischargeKw;
      
      const remainingShortfall = necessaryDeficit - dischargeKw;
      if (remainingShortfall > 0) {
        gridImportKw = remainingShortfall; // Emergency grid fail-safe
      }
      nonEssentialShedReason = 'CRITICAL DEFICIT: Non-essential loads SHED. Battery discharging to power necessary loads (ALWAYS ON).';
    } else {
      // Battery depleted! Emergency grid backup for necessary loads
      batteryFlowKw = 0;
      gridImportKw = necessaryDeficit;
      nonEssentialShedReason = 'EMERGENCY: Battery reserves exhausted. Grid backup engaged to keep necessary loads ALWAYS ON.';
    }
  }

  // Calculate actual non-essential load total after shedding
  const actualNonEssentialLoadTotalKw = (rawNonEssentialLoadTotalKw * nonEssentialCoveredPct) / 100;
  const nonEssentialSheddingPct = 100 - nonEssentialCoveredPct;

  // Update house individual statuses
  const updatedHouses = houses.map((house) => {
    const isShed = nonEssentialCoveredPct < 20;
    return {
      ...house,
      nonEssentialActive: !isShed,
    };
  });

  const dcBus: DCBusSystem = {
    nominalVoltageV: 380.0,
    actualVoltageV: Math.round((380.0 + (batteryFlowKw > 0 ? 1.5 : -1.8)) * 10) / 10,
    totalSolarInputKw: Math.round(totalSolarKw * 100) / 100,
    batteryFlowKw: Math.round(batteryFlowKw * 100) / 100,
    necessaryLoadTotalKw: Math.round(necessaryLoadTotalKw * 100) / 100,
    nonEssentialLoadTotalKw: Math.round(actualNonEssentialLoadTotalKw * 100) / 100,
    nonEssentialSheddingPct: Math.round(nonEssentialSheddingPct),
    gridExportKw: Math.round(gridExportKw * 100) / 100,
    gridImportKw: Math.round(gridImportKw * 100) / 100,
    busEfficiencyPct: 98.8,
  };

  return {
    dcBus,
    batteryFlowKw: Math.round(batteryFlowKw * 100) / 100,
    necessaryCoveredPct: 100, // Always 100% maintained via solar + battery + grid backup
    nonEssentialCoveredPct,
    nonEssentialShedReason,
    surplusPowerKw: Math.round(surplusPowerKw * 100) / 100,
    updatedHouses,
  };
}
