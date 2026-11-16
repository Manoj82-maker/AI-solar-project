export interface HouseLoadSwitchState {
  load100W: boolean; // 100 W (Tier-1 Necessary)
  load50W: boolean;  // 50 W  (Tier-1 Necessary)
  load200W: boolean; // 200 W (Tier-2 Non-Essential)
  load150W: boolean; // 150 W (Tier-2 Non-Essential)
}

export type LoadKey = keyof HouseLoadSwitchState;

export interface HouseData {
  id: number; // 1 to 100
  row: number; // 0 to 9
  col: number; // 0 to 9
  name: string;
  solarCapacityKw: number; // 2.0 kW max
  solarOutputKw: number; // Real-time generation (0 to 2 kW)
  cellTemperatureC: number; // Panel cell temperature in °C
  irradianceWm2: number; // Local irradiance in W/m²
  panelEfficiency: number; // Instantaneous efficiency (%)
  soilingFactor: number; // 0.90 to 1.0
  tiltAngleDeg: number; // 25° to 35°
  
  // Boost Converter Data
  boostConverter: {
    inputVoltageV: number; // ~32V - 45V DC
    outputVoltageV: number; // Regulated ~380V DC Bus
    inputCurrentA: number;
    outputCurrentA: number;
    dutyCycle: number; // D = 1 - (Vin / Vout)
    efficiency: number; // ~98%
    mpptTracking: boolean;
  };

  // Four Switchable Local Loads (100W, 50W, 200W, 150W = 500W max)
  loads: HouseLoadSwitchState;
  switchedLoadW: number; // Total Watts switched ON (0 to 500 W)
  necessaryLoadKw: number; // Active Tier-1 Necessary (100W + 50W if ON)
  nonEssentialLoadKw: number; // Active Tier-2 Non-Essential (200W + 150W if ON)
  nonEssentialActive: boolean; // True if powered by governor, false if shed
  netPowerKw: number; // Positive = surplus exported to DC Bus, Negative = draw from DC Bus
}

export interface BatteryCell {
  id: number;
  voltageV: number; // nominal 3.2V (3.0V - 3.45V)
  temperatureC: number;
  internalResistanceMOhm: number;
  balancingActive: boolean;
}

export interface BatteryStorageUnit {
  capacityKwh: number; // e.g. 500 kWh central LiFePO4 bank
  storedEnergyKwh: number;
  stateOfChargePct: number; // SoC: 0 - 100%
  stateOfHealthPct: number; // SoH: 0 - 100%
  nominalVoltageV: number; // 380V DC
  currentA: number; // positive = charging, negative = discharging
  powerKw: number; // positive = charging, negative = discharging
  maxChargePowerKw: number; // e.g. 120 kW
  maxDischargePowerKw: number; // e.g. 150 kW
  averageTempC: number;
  cycleCount: number;
  cRate: number; // Current C-rate
  depthOfDischargeAvgPct: number;
  thermalRunawayRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  coolingFanPwmPct: number;
  cells: BatteryCell[];
}

export interface DCBusSystem {
  nominalVoltageV: number; // 380V DC
  actualVoltageV: number; // 378V - 382V regulated
  totalSolarInputKw: number;
  batteryFlowKw: number; // + charging, - discharging
  necessaryLoadTotalKw: number;
  nonEssentialLoadTotalKw: number;
  nonEssentialSheddingPct: number; // 0% = all on, 100% = fully shed
  gridExportKw: number; // If surplus & battery full
  gridImportKw: number; // If deficit & battery depleted
  busEfficiencyPct: number;
}

export interface WeatherCondition {
  irradianceWm2: number; // 0 to 1200 W/m²
  ambientTempC: number; // -10 to 50 °C
  cloudCoverPct: number; // 0 to 100%
  cloudSpeed: number; // drift speed
  preset: 'CLEAR_SUMMER' | 'PARTLY_CLOUDY' | 'HEAT_WAVE' | 'OVERCAST_WINTER' | 'CUSTOM';
}

export interface LoadTimer {
  id: string;
  label: string;
  target: 'all' | 'odd' | 'even' | number;
  loadKeys: LoadKey[];
  durationMinutes: number; // total timer duration in simulation minutes
  remainingMinutes: number; // remaining time in simulation minutes
  startedAtMinutes: number; // simTimeMinutes when started
}

export interface LoadEnergyBreakdown {
  load100WKwh: number;
  load50WKwh: number;
  load200WKwh: number;
  load150WKwh: number;
}

export interface DailySummary {
  totalSolarEnergyKwh: number; // Cumulative solar generated for the day
  avgSolarEnergyPerHouseKwh: number; // Cumulative solar avg per house
  peakSolarPowerKw: number;
  totalLoadEnergyKwh: number; // Cumulative total power consumed by all loads today (kWh)
  avgLoadEnergyPerHouseKwh: number; // Daily avg load consumed per house (kWh)
  peakLoadPowerKw: number; // Peak aggregate load kW
  totalNecessaryEnergyKwh: number;
  totalNonEssentialEnergyKwh: number;
  oddHomesLoadEnergyKwh: number;
  evenHomesLoadEnergyKwh: number;
  loadBreakdownKwh: LoadEnergyBreakdown;
  batteryThroughputKwh: number;
  solarToLoadEnergyKwh: number;
  solarToBatteryEnergyKwh: number;
  batteryToLoadEnergyKwh: number;
  curtailedEnergyKwh: number;
  hourlyGenerationKw: number[]; // 24 hourly solar averages
  hourlyLoadKw: number[]; // 24 hourly total loads
  hourlyNecessaryLoadKw: number[]; // 24 hourly necessary loads
  hourlyNonEssentialLoadKw: number[]; // 24 hourly non-essential loads
}

export interface BMSHealthReport {
  timestamp: string;
  healthScore: number; // 0 - 100
  estimatedLifeRemainingYears: number;
  degradationRatePerYearPct: number;
  aiDiagnostics: string[];
  recommendations: string[];
  chargePolicyAdvice: string;
  loadManagementStatus: string;
  optimalSoCWindow: { min: number; max: number };
}
