import { HouseData, HouseLoadSwitchState, WeatherCondition } from '../types/microgrid';

export function computeHouseLoadMetrics(loads: HouseLoadSwitchState) {
  const necessaryW = (loads.load100W ? 100 : 0) + (loads.load50W ? 50 : 0);
  const nonEssentialW = (loads.load200W ? 200 : 0) + (loads.load150W ? 150 : 0);
  const switchedLoadW = necessaryW + nonEssentialW;
  return {
    switchedLoadW,
    necessaryLoadKw: Math.round((necessaryW / 1000) * 1000) / 1000,
    nonEssentialLoadKw: Math.round((nonEssentialW / 1000) * 1000) / 1000,
  };
}

// Standard Test Conditions (STC) constants
export const P_RATED_PER_HOUSE_KW = 2.0; // 2 kW per house specification
export const TOTAL_HOUSES = 100; // 10x10 square formation
export const GRID_SIZE = 10;
export const G_STC = 1000; // W/m²
export const T_STC = 25; // °C
export const GAMMA_PMAX = -0.0038; // -0.38% / °C temperature coefficient
export const NOCT = 45; // Nominal Operating Cell Temperature in °C
export const DC_BUS_NOMINAL_VOLTAGE = 380.0; // 380V DC

/**
 * Calculates PV Cell Temperature based on ambient temp and solar irradiance
 * T_cell = T_amb + ((NOCT - 20) / 800) * G
 */
export function calculateCellTemperature(ambientTempC: number, irradianceWm2: number): number {
  if (irradianceWm2 <= 0) return ambientTempC;
  return ambientTempC + ((NOCT - 20) / 800) * irradianceWm2;
}

/**
 * Calculates raw DC power produced by a 2 kW solar system
 * P = P_rated * (G / 1000) * [1 + gamma * (T_cell - 25)]
 */
export function calculateRawSolarPowerKw(
  irradianceWm2: number,
  cellTempC: number,
  soilingFactor: number = 0.98
): number {
  if (irradianceWm2 <= 0) return 0;

  // Normalized irradiance
  const gRatio = Math.max(0, irradianceWm2 / G_STC);
  
  // Temperature derating factor
  const tempFactor = 1 + GAMMA_PMAX * (cellTempC - T_STC);
  
  // Clamped power generation (cannot generate negative power; max capped near physical rating with small cold-temp margin)
  const power = P_RATED_PER_HOUSE_KW * gRatio * Math.max(0.1, tempFactor) * soilingFactor;
  return Math.max(0, Math.min(2.15, power));
}

/**
 * Models the DC-DC Boost Converter that steps up variable PV voltage (32-45V DC)
 * to the stabilized 380V DC Bus.
 */
export function modelBoostConverter(solarPowerKw: number, cellTempC: number) {
  if (solarPowerKw <= 0.001) {
    return {
      inputVoltageV: 0,
      outputVoltageV: DC_BUS_NOMINAL_VOLTAGE,
      inputCurrentA: 0,
      outputCurrentA: 0,
      dutyCycle: 0,
      efficiency: 0,
      mpptTracking: false,
    };
  }

  // PV voltage typically decreases with increasing cell temperature (negative voltage temp coefficient)
  const inputVoltageV = Math.max(28, Math.min(48, 36.5 - 0.12 * (cellTempC - T_STC)));
  const outputVoltageV = DC_BUS_NOMINAL_VOLTAGE;
  
  // Ideal Boost Duty Cycle: D = 1 - (Vin / Vout)
  const dutyCycle = Math.max(0.75, Math.min(0.95, 1 - (inputVoltageV / outputVoltageV)));
  
  // High efficiency synchronous boost converter (~97.8% to 98.6%)
  const efficiency = 0.982;
  const netPowerKw = solarPowerKw * efficiency;
  
  const inputCurrentA = (solarPowerKw * 1000) / inputVoltageV;
  const outputCurrentA = (netPowerKw * 1000) / outputVoltageV;

  return {
    inputVoltageV: Math.round(inputVoltageV * 10) / 10,
    outputVoltageV,
    inputCurrentA: Math.round(inputCurrentA * 10) / 10,
    outputCurrentA: Math.round(outputCurrentA * 10) / 10,
    dutyCycle: Math.round(dutyCycle * 1000) / 1000,
    efficiency,
    mpptTracking: true,
  };
}

/**
 * Generates the initial 100 houses in a 10x10 square formation.
 */
export function initialize100Houses(): HouseData[] {
  const houses: HouseData[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const id = r * GRID_SIZE + c + 1;
      
      // Realistic per-house variance in tilt (26° - 34°) and soiling (0.94 - 0.99)
      const pseudoRand = Math.sin(id * 997.3) * 0.5 + 0.5;
      const tiltAngleDeg = 28 + (pseudoRand * 6);
      const soilingFactor = 0.95 + (Math.sin(id * 123.4) * 0.5 + 0.5) * 0.04;
      
      // Initialize 4 discrete switchable loads: 100W, 50W, 200W, 150W (all active = 500W)
      const initialLoads: HouseLoadSwitchState = {
        load100W: true,
        load50W: true,
        load200W: true,
        load150W: true,
      };
      const loadMetrics = computeHouseLoadMetrics(initialLoads);

      houses.push({
        id,
        row: r,
        col: c,
        name: `House #${id.toString().padStart(3, '0')}`,
        solarCapacityKw: P_RATED_PER_HOUSE_KW,
        solarOutputKw: 0,
        cellTemperatureC: 25,
        irradianceWm2: 0,
        panelEfficiency: 0,
        soilingFactor,
        tiltAngleDeg: Math.round(tiltAngleDeg * 10) / 10,
        boostConverter: {
          inputVoltageV: 0,
          outputVoltageV: DC_BUS_NOMINAL_VOLTAGE,
          inputCurrentA: 0,
          outputCurrentA: 0,
          dutyCycle: 0,
          efficiency: 0.982,
          mpptTracking: false,
        },
        loads: initialLoads,
        switchedLoadW: loadMetrics.switchedLoadW,
        necessaryLoadKw: loadMetrics.necessaryLoadKw,
        nonEssentialLoadKw: loadMetrics.nonEssentialLoadKw,
        nonEssentialActive: true,
        netPowerKw: 0,
      });
    }
  }
  return houses;
}

/**
 * Updates the 100 houses in real-time based on the weather conditions, cloud drift,
 * temperature, and irradiance.
 */
export function updateHouseGeneration(
  houses: HouseData[],
  weather: WeatherCondition,
  simTimeMinutes: number, // 0 to 1439 (24 hours in minutes)
  nonEssentialGlobalOverride?: boolean // if specified, forces all non-essential loads on/off
): { updatedHouses: HouseData[]; totalSolarKw: number; avgSolarKw: number } {
  let totalSolarKw = 0;

  // Cloud position simulation moving across 10x10 grid over time
  const cloudOffset = (simTimeMinutes * 0.05) % 15;

  const updatedHouses = houses.map((house) => {
    // Spatial cloud coverage variation across the 10x10 matrix
    const spatialX = house.col;
    const spatialY = house.row;
    
    // Wave function for micro-shading variations across rows/cols
    const cloudNoise = Math.sin((spatialX - cloudOffset) * 0.6) * Math.cos(spatialY * 0.8);
    const localCloudDamping = weather.cloudCoverPct > 0 
      ? Math.max(0.15, 1 - (weather.cloudCoverPct / 100) * (0.6 + 0.4 * Math.max(0, cloudNoise)))
      : 1.0;

    // Local irradiance
    const localIrradiance = Math.round(weather.irradianceWm2 * localCloudDamping);
    
    // Cell temperature calculation
    const cellTempC = calculateCellTemperature(weather.ambientTempC, localIrradiance);
    
    // Raw generation
    const rawPower = calculateRawSolarPowerKw(localIrradiance, cellTempC, house.soilingFactor);
    
    // Boost converter simulation
    const boost = modelBoostConverter(rawPower, cellTempC);
    const netSolarOutputKw = rawPower * boost.efficiency;
    
    // Instantaneous module efficiency (Power / (Area * Irradiance))
    // Standard 2 kW array occupies ~10 m²
    const panelEff = localIrradiance > 50 
      ? Math.min(22.5, ((netSolarOutputKw * 1000) / (10 * localIrradiance)) * 100) 
      : 0;

    const nonEssentialActive = nonEssentialGlobalOverride !== undefined 
      ? nonEssentialGlobalOverride 
      : house.nonEssentialActive;

    const loadMetrics = computeHouseLoadMetrics(house.loads);
    const currentTotalLoad = loadMetrics.necessaryLoadKw + (nonEssentialActive ? loadMetrics.nonEssentialLoadKw : 0);
    const netLocalPower = netSolarOutputKw - currentTotalLoad;

    totalSolarKw += netSolarOutputKw;

    return {
      ...house,
      irradianceWm2: localIrradiance,
      cellTemperatureC: Math.round(cellTempC * 10) / 10,
      solarOutputKw: Math.round(netSolarOutputKw * 1000) / 1000,
      panelEfficiency: Math.round(panelEff * 10) / 10,
      boostConverter: boost,
      switchedLoadW: loadMetrics.switchedLoadW,
      necessaryLoadKw: loadMetrics.necessaryLoadKw,
      nonEssentialLoadKw: loadMetrics.nonEssentialLoadKw,
      nonEssentialActive,
      netPowerKw: Math.round(netLocalPower * 1000) / 1000,
    };
  });

  const avgSolarKw = updatedHouses.length > 0 ? totalSolarKw / updatedHouses.length : 0;

  return {
    updatedHouses,
    totalSolarKw: Math.round(totalSolarKw * 100) / 100,
    avgSolarKw: Math.round(avgSolarKw * 1000) / 1000,
  };
}

/**
 * Sun Irradiance diurnal trajectory curve based on time of day (0-24 hrs)
 */
export function getSolarIrradianceForTime(hourDecimal: number, maxPeakWm2: number = 980): number {
  // Sun rises ~06:00, peaks at 12:30, sets ~18:45
  const sunrise = 6.0;
  const sunset = 18.75;
  
  if (hourDecimal < sunrise || hourDecimal > sunset) {
    return 0; // Night
  }
  
  // Sine curve during daylight
  const dayLength = sunset - sunrise;
  const elapsed = hourDecimal - sunrise;
  const sunAngle = (elapsed / dayLength) * Math.PI;
  const irradiance = Math.sin(sunAngle) * maxPeakWm2;
  
  return Math.max(0, Math.round(irradiance));
}

/**
 * Ambient Temperature diurnal trajectory based on time of day
 */
export function getAmbientTempForTime(hourDecimal: number, minTemp: number = 18, maxTemp: number = 34): number {
  // Coldest at dawn (~05:30), hottest in mid afternoon (~14:30)
  const peakTime = 14.5;
  const angle = ((hourDecimal - peakTime) / 24) * 2 * Math.PI;
  const avgTemp = (minTemp + maxTemp) / 2;
  const amplitude = (maxTemp - minTemp) / 2;
  const temp = avgTemp + amplitude * Math.cos(angle);
  return Math.round(temp * 10) / 10;
}
