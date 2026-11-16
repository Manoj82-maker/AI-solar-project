import React, { useState, useEffect, useCallback } from 'react';
import { HouseData, HouseLoadSwitchState, LoadKey, LoadTimer, BatteryStorageUnit, WeatherCondition, DailySummary, BMSHealthReport } from './types/microgrid';
import { 
  initialize100Houses, 
  updateHouseGeneration, 
  getSolarIrradianceForTime, 
  getAmbientTempForTime,
  computeHouseLoadMetrics
} from './utils/solarPhysics';
import { initializeBatteryStorage, stepBatterySimulation, generateLocalBMSReport } from './utils/bmsEngine';
import { calculatePowerDispatch } from './utils/powerDispatch';

// Components
import { Header } from './components/Header';
import { TelemetryRibbon } from './components/TelemetryRibbon';
import { SimulationControls } from './components/SimulationControls';
import { NeighborhoodGrid } from './components/NeighborhoodGrid';
import { DCBusSchematic } from './components/DCBusSchematic';
import { AI_BMSConsole } from './components/AI_BMSConsole';
import { EnergyAnalytics } from './components/EnergyAnalytics';
import { MathModelReference } from './components/MathModelReference';
import { StoryAndPdfHandbook } from './components/StoryAndPdfHandbook';

export default function App() {
  // Navigation & Inspection State
  const [activeTab, setActiveTab] = useState<string>('grid');
  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(1);

  // Time & Simulation Playback
  const [simTimeMinutes, setSimTimeMinutes] = useState<number>(11 * 60 + 30); // 11:30 AM
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(5); // 5x speed default
  const [autoSunTrajectory, setAutoSunTrajectory] = useState<boolean>(true);

  // Weather & Environmental State
  const [weather, setWeather] = useState<WeatherCondition>({
    irradianceWm2: 850,
    ambientTempC: 27,
    cloudCoverPct: 10,
    cloudSpeed: 1,
    preset: 'CLEAR_SUMMER',
  });

  // Physical Microgrid States
  const [houses, setHouses] = useState<HouseData[]>(() => initialize100Houses());
  const [battery, setBattery] = useState<BatteryStorageUnit>(() => initializeBatteryStorage());
  const [aiHealthProtectionActive, setAiHealthProtectionActive] = useState<boolean>(true);

  // Telemetry Aggregates
  const [totalSolarKw, setTotalSolarKw] = useState<number>(0);
  const [avgSolarKw, setAvgSolarKw] = useState<number>(0);
  const [surplusPowerKw, setSurplusPowerKw] = useState<number>(0);
  const [nonEssentialCoveredPct, setNonEssentialCoveredPct] = useState<number>(100);
  const [nonEssentialShedReason, setNonEssentialShedReason] = useState<string>('Nominal operation');

  const [dcBus, setDcBus] = useState({
    nominalVoltageV: 380,
    actualVoltageV: 380,
    totalSolarInputKw: 0,
    batteryFlowKw: 0,
    necessaryLoadTotalKw: 15,
    nonEssentialLoadTotalKw: 35,
    nonEssentialSheddingPct: 0,
    gridExportKw: 0,
    gridImportKw: 0,
    busEfficiencyPct: 98.8,
  });

  // Load Timers State
  const [activeTimers, setActiveTimers] = useState<LoadTimer[]>([]);

  const createInitialDailySummary = useCallback((zeroed: boolean = false): DailySummary => {
    if (zeroed) {
      return {
        totalSolarEnergyKwh: 0,
        avgSolarEnergyPerHouseKwh: 0,
        peakSolarPowerKw: 0,
        totalLoadEnergyKwh: 0,
        avgLoadEnergyPerHouseKwh: 0,
        peakLoadPowerKw: 0,
        totalNecessaryEnergyKwh: 0,
        totalNonEssentialEnergyKwh: 0,
        oddHomesLoadEnergyKwh: 0,
        evenHomesLoadEnergyKwh: 0,
        loadBreakdownKwh: {
          load100WKwh: 0,
          load50WKwh: 0,
          load200WKwh: 0,
          load150WKwh: 0,
        },
        batteryThroughputKwh: 0,
        solarToLoadEnergyKwh: 0,
        solarToBatteryEnergyKwh: 0,
        batteryToLoadEnergyKwh: 0,
        curtailedEnergyKwh: 0,
        hourlyGenerationKw: Array(24).fill(0),
        hourlyLoadKw: Array(24).fill(0),
        hourlyNecessaryLoadKw: Array(24).fill(0),
        hourlyNonEssentialLoadKw: Array(24).fill(0),
      };
    }

    // Seed initial realistic daily curve up to 11:30 AM matching 500W/house (15kW Necessary + 35kW Non-Essential)
    const hourlyGen = Array(24).fill(0).map((_, h) => {
      if (h < 6 || h > 11) return 0;
      const irr = getSolarIrradianceForTime(h + 0.5);
      return Math.round((irr / 1000) * 165 * 10) / 10;
    });

    const hourlyNecessary = Array(24).fill(0).map((_, h) => (h <= 11 ? 15.0 : 0)); // 100W + 50W = 15 kW across 100 houses
    const hourlyNonEssential = Array(24).fill(0).map((_, h) => {
      if (h > 11) return 0;
      // Overnight shed/idle partial, morning active ramp
      return h >= 7 ? 35.0 : 12.0;
    });
    const hourlyLoad = hourlyNecessary.map((nec, h) => nec + hourlyNonEssential[h]);

    // Integrate hours 0..10 + half of hour 11
    const totalSolarKwh = hourlyGen.reduce((acc, v, h) => acc + (h === 11 ? v * 0.5 : v), 0);
    const totalNecKwh = 15.0 * 11.5; // 172.5 kWh (115 kWh from 100W, 57.5 kWh from 50W)
    const load100WKwh = 10.0 * 11.5;
    const load50WKwh = 5.0 * 11.5;

    // Non-essential: hours 0..6 (7h at 12kW = 84 kWh) + hours 7..11.5 (4.5h at 35kW = 157.5 kWh) = 241.5 kWh
    const totalNonEssKwh = 7 * 12.0 + 4.5 * 35.0; // 241.5 kWh (4/7 from 200W, 3/7 from 150W)
    const load200WKwh = Math.round(totalNonEssKwh * (200 / 350) * 10) / 10;
    const load150WKwh = Math.round((totalNonEssKwh - load200WKwh) * 10) / 10;
    const totalLoadKwh = Math.round((totalNecKwh + totalNonEssKwh) * 10) / 10;

    return {
      totalSolarEnergyKwh: Math.round(totalSolarKwh * 10) / 10,
      avgSolarEnergyPerHouseKwh: Math.round((totalSolarKwh / 100) * 100) / 100,
      peakSolarPowerKw: Math.max(...hourlyGen, 148.2),
      totalLoadEnergyKwh: totalLoadKwh,
      avgLoadEnergyPerHouseKwh: Math.round((totalLoadKwh / 100) * 100) / 100,
      peakLoadPowerKw: 50.0,
      totalNecessaryEnergyKwh: totalNecKwh,
      totalNonEssentialEnergyKwh: totalNonEssKwh,
      oddHomesLoadEnergyKwh: Math.round((totalLoadKwh / 2) * 10) / 10,
      evenHomesLoadEnergyKwh: Math.round((totalLoadKwh / 2) * 10) / 10,
      loadBreakdownKwh: {
        load100WKwh,
        load50WKwh,
        load200WKwh,
        load150WKwh,
      },
      batteryThroughputKwh: 195.4,
      solarToLoadEnergyKwh: 265.0,
      solarToBatteryEnergyKwh: 142.0,
      batteryToLoadEnergyKwh: 112.0,
      curtailedEnergyKwh: 0,
      hourlyGenerationKw: hourlyGen,
      hourlyLoadKw: hourlyLoad,
      hourlyNecessaryLoadKw: hourlyNecessary,
      hourlyNonEssentialLoadKw: hourlyNonEssential,
    };
  }, []);

  // Cumulative Daily Metrics
  const [dailySummary, setDailySummary] = useState<DailySummary>(() => createInitialDailySummary(false));

  // AI Diagnostic State
  const [bmsReport, setBmsReport] = useState<BMSHealthReport | null>(() => generateLocalBMSReport(battery));
  const [isAiDiagnosing, setIsAiDiagnosing] = useState<boolean>(false);

  // Time formatter
  const hours = Math.floor(simTimeMinutes / 60);
  const minutes = Math.floor(simTimeMinutes % 60);
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Reset Daily Counters function
  const handleResetDailySummary = useCallback(() => {
    setSimTimeMinutes(0); // Start fresh day at 00:00
    setDailySummary(createInitialDailySummary(true));
  }, [createInitialDailySummary]);

  // Reset function
  const handleResetSimulation = useCallback(() => {
    setSimTimeMinutes(8 * 60); // 08:00 AM
    setIsPlaying(false);
    setActiveTimers([]);
    setBattery(initializeBatteryStorage());
    setDailySummary(createInitialDailySummary(true));
    setWeather({
      irradianceWm2: 600,
      ambientTempC: 22,
      cloudCoverPct: 0,
      cloudSpeed: 1,
      preset: 'CLEAR_SUMMER',
    });
  }, [createInitialDailySummary]);

  // Run AI Health Scan
  const handleRunAiDiagnostic = async () => {
    setIsAiDiagnosing(true);
    try {
      const response = await fetch('/api/bms/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stateOfChargePct: battery.stateOfChargePct,
          stateOfHealthPct: battery.stateOfHealthPct,
          averageTempC: battery.averageTempC,
          cRate: battery.cRate,
          powerKw: battery.powerKw,
          cycleCount: battery.cycleCount,
          thermalRunawayRisk: battery.thermalRunawayRisk,
          coolingFanPwmPct: battery.coolingFanPwmPct,
          cells: battery.cells,
          totalSolarKw,
          necessaryLoadTotalKw: dcBus.necessaryLoadTotalKw,
          nonEssentialLoadTotalKw: dcBus.nonEssentialLoadTotalKw,
          surplusPowerKw,
          irradianceWm2: weather.irradianceWm2,
          ambientTempC: weather.ambientTempC,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch AI diagnostic');
      const data = await response.json();
      
      setBmsReport({
        timestamp: new Date().toLocaleTimeString(),
        healthScore: data.healthScore ?? 98,
        estimatedLifeRemainingYears: data.estimatedLifeRemainingYears ?? 8.5,
        degradationRatePerYearPct: data.degradationRatePerYearPct ?? 1.8,
        aiDiagnostics: data.aiDiagnostics ?? [
          'Nominal cell impedance and capacity retention across all 16 strings.',
        ],
        recommendations: data.recommendations ?? [
          'Continue adaptive charge tapering during peak irradiance.',
        ],
        chargePolicyAdvice: data.chargePolicyAdvice ?? 'Dynamic CC-CV with MPPT boost synchronization.',
        loadManagementStatus: data.loadManagementStatus ?? 'Necessary Loads 100% prioritized.',
        optimalSoCWindow: data.optimalSoCWindow ?? { min: 20, max: 85 },
      });
    } catch (err) {
      console.warn('AI Advisor fetch failed, applying deterministic expert report:', err);
      setBmsReport(generateLocalBMSReport(battery));
    } finally {
      setIsAiDiagnosing(false);
    }
  };

  // Helper to check if a house matches target filter
  const matchesTarget = (houseId: number, target: 'all' | 'odd' | 'even' | number) => {
    if (target === 'all') return true;
    if (target === 'odd') return houseId % 2 === 1;
    if (target === 'even') return houseId % 2 === 0;
    return houseId === target;
  };

  // Apply 4-load preset (All Active, 3 Loads, 2 Loads, 1 Load, All Off) to All / Odd / Even / Single House
  const handleApplyLoadPreset = useCallback(
    (target: 'all' | 'odd' | 'even' | number, preset: 'all_active' | 'three_on' | 'two_on' | 'one_on' | 'all_off') => {
      const presetMap: Record<typeof preset, HouseLoadSwitchState> = {
        all_active: { load100W: true, load50W: true, load200W: true, load150W: true },
        three_on: { load100W: true, load50W: true, load200W: true, load150W: false },
        two_on: { load100W: true, load50W: true, load200W: false, load150W: false },
        one_on: { load100W: true, load50W: false, load200W: false, load150W: false },
        all_off: { load100W: false, load50W: false, load200W: false, load150W: false },
      };

      const nextSwitchState = presetMap[preset];

      setHouses((prevHouses) => {
        const nextHouses = prevHouses.map((h) => {
          if (!matchesTarget(h.id, target)) return h;
          const loadMetrics = computeHouseLoadMetrics(nextSwitchState);
          const activeLoadKw = loadMetrics.necessaryLoadKw + (h.nonEssentialActive ? loadMetrics.nonEssentialLoadKw : 0);
          return {
            ...h,
            loads: { ...nextSwitchState },
            switchedLoadW: loadMetrics.switchedLoadW,
            necessaryLoadKw: loadMetrics.necessaryLoadKw,
            nonEssentialLoadKw: loadMetrics.nonEssentialLoadKw,
            netPowerKw: Math.round((h.solarOutputKw - activeLoadKw) * 1000) / 1000,
          };
        });
        const dispatch = calculatePowerDispatch(nextHouses, totalSolarKw, battery, true);
        setDcBus(dispatch.dcBus);
        setSurplusPowerKw(dispatch.surplusPowerKw);
        setNonEssentialCoveredPct(dispatch.nonEssentialCoveredPct);
        setNonEssentialShedReason(dispatch.nonEssentialShedReason);
        return dispatch.updatedHouses;
      });
    },
    [totalSolarKw, battery]
  );

  // Toggle a specific wattage load (100W, 50W, 200W, or 150W) for All / Odd / Even / Single House
  const handleToggleLoadSwitch = useCallback(
    (target: 'all' | 'odd' | 'even' | number, loadKey: LoadKey, forceValue?: boolean) => {
      setHouses((prevHouses) => {
        // Determine target toggle state if forceValue not specified
        const matchingHouses = prevHouses.filter((h) => matchesTarget(h.id, target));
        const allCurrentlyOn = matchingHouses.length > 0 && matchingHouses.every((h) => h.loads[loadKey]);
        const nextVal = forceValue !== undefined ? forceValue : !allCurrentlyOn;

        const nextHouses = prevHouses.map((h) => {
          if (!matchesTarget(h.id, target)) return h;
          const nextLoads: HouseLoadSwitchState = {
            ...h.loads,
            [loadKey]: nextVal,
          };
          const loadMetrics = computeHouseLoadMetrics(nextLoads);
          const activeLoadKw = loadMetrics.necessaryLoadKw + (h.nonEssentialActive ? loadMetrics.nonEssentialLoadKw : 0);
          return {
            ...h,
            loads: nextLoads,
            switchedLoadW: loadMetrics.switchedLoadW,
            necessaryLoadKw: loadMetrics.necessaryLoadKw,
            nonEssentialLoadKw: loadMetrics.nonEssentialLoadKw,
            netPowerKw: Math.round((h.solarOutputKw - activeLoadKw) * 1000) / 1000,
          };
        });
        const dispatch = calculatePowerDispatch(nextHouses, totalSolarKw, battery, true);
        setDcBus(dispatch.dcBus);
        setSurplusPowerKw(dispatch.surplusPowerKw);
        setNonEssentialCoveredPct(dispatch.nonEssentialCoveredPct);
        setNonEssentialShedReason(dispatch.nonEssentialShedReason);
        return dispatch.updatedHouses;
      });
    },
    [totalSolarKw, battery]
  );

  // Start a Load Timer (turns selected loads ON immediately and keeps them ON for durationMinutes)
  const handleStartLoadTimer = useCallback(
    (
      target: 'all' | 'odd' | 'even' | number,
      loadKeys: LoadKey[],
      durationMinutes: number,
      label?: string
    ) => {
      if (loadKeys.length === 0 || durationMinutes <= 0) return;

      const targetLabel =
        target === 'all'
          ? 'All 100 Homes'
          : target === 'odd'
          ? 'Odd Homes (50)'
          : target === 'even'
          ? 'Even Homes (50)'
          : `House #${target.toString().padStart(3, '0')}`;

      const timerLabel = label || `${targetLabel} (${loadKeys.map((k) => k.replace('load', '')).join('+')})`;

      const newTimer: LoadTimer = {
        id: `tmr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: timerLabel,
        target,
        loadKeys,
        durationMinutes,
        remainingMinutes: durationMinutes,
        startedAtMinutes: simTimeMinutes,
      };

      // Turn ON those loads immediately
      setHouses((prevHouses) => {
        const nextHouses = prevHouses.map((h) => {
          if (!matchesTarget(h.id, target)) return h;
          const nextLoads: HouseLoadSwitchState = { ...h.loads };
          loadKeys.forEach((k) => {
            nextLoads[k] = true;
          });
          const loadMetrics = computeHouseLoadMetrics(nextLoads);
          const activeLoadKw = loadMetrics.necessaryLoadKw + (h.nonEssentialActive ? loadMetrics.nonEssentialLoadKw : 0);
          return {
            ...h,
            loads: nextLoads,
            switchedLoadW: loadMetrics.switchedLoadW,
            necessaryLoadKw: loadMetrics.necessaryLoadKw,
            nonEssentialLoadKw: loadMetrics.nonEssentialLoadKw,
            netPowerKw: Math.round((h.solarOutputKw - activeLoadKw) * 1000) / 1000,
          };
        });
        const dispatch = calculatePowerDispatch(nextHouses, totalSolarKw, battery, true);
        setDcBus(dispatch.dcBus);
        setSurplusPowerKw(dispatch.surplusPowerKw);
        setNonEssentialCoveredPct(dispatch.nonEssentialCoveredPct);
        setNonEssentialShedReason(dispatch.nonEssentialShedReason);
        return dispatch.updatedHouses;
      });

      setActiveTimers((prev) => [...prev, newTimer]);
      setIsPlaying(true); // Ensure simulation clock runs so countdown advances
    },
    [simTimeMinutes, totalSolarKw, battery]
  );

  // Cancel or immediately end a Load Timer
  const handleCancelLoadTimer = useCallback(
    (timerId: string, turnOffLoads: boolean = true) => {
      const targetTimer = activeTimers.find((t) => t.id === timerId);
      const remainingTimers = activeTimers.filter((t) => t.id !== timerId);
      setActiveTimers(remainingTimers);

      if (turnOffLoads && targetTimer) {
        setHouses((prevHouses) => {
          const nextHouses = prevHouses.map((h) => {
            if (!matchesTarget(h.id, targetTimer.target)) return h;
            const nextLoads: HouseLoadSwitchState = { ...h.loads };
            targetTimer.loadKeys.forEach((k) => {
              // Keep ON only if another remaining active timer covers this house & key
              const heldByOther = remainingTimers.some(
                (ot) => matchesTarget(h.id, ot.target) && ot.loadKeys.includes(k)
              );
              if (!heldByOther) {
                nextLoads[k] = false;
              }
            });
            const loadMetrics = computeHouseLoadMetrics(nextLoads);
            const activeLoadKw = loadMetrics.necessaryLoadKw + (h.nonEssentialActive ? loadMetrics.nonEssentialLoadKw : 0);
            return {
              ...h,
              loads: nextLoads,
              switchedLoadW: loadMetrics.switchedLoadW,
              necessaryLoadKw: loadMetrics.necessaryLoadKw,
              nonEssentialLoadKw: loadMetrics.nonEssentialLoadKw,
              netPowerKw: Math.round((h.solarOutputKw - activeLoadKw) * 1000) / 1000,
            };
          });
          const dispatch = calculatePowerDispatch(nextHouses, totalSolarKw, battery, true);
          setDcBus(dispatch.dcBus);
          setSurplusPowerKw(dispatch.surplusPowerKw);
          setNonEssentialCoveredPct(dispatch.nonEssentialCoveredPct);
          setNonEssentialShedReason(dispatch.nonEssentialShedReason);
          return dispatch.updatedHouses;
        });
      }
    },
    [activeTimers, totalSolarKw, battery]
  );

  // CSV Telemetry Exporter
  const handleExportCsv = () => {
    const headers = [
      'House_ID',
      'Name',
      'Grid_Row',
      'Grid_Col',
      'Solar_Output_kW',
      'Solar_Rating_kW',
      'Cell_Temp_C',
      'Local_Irradiance_Wm2',
      'Panel_Efficiency_Pct',
      'Boost_Vin_V',
      'Boost_Vout_V',
      'Boost_Duty_Cycle',
      'Load_100W_Switch',
      'Load_50W_Switch',
      'Load_200W_Switch',
      'Load_150W_Switch',
      'Total_Switched_Load_W',
      'Necessary_Load_kW',
      'Non_Essential_Load_kW',
      'Non_Essential_Status',
      'Net_Power_kW',
    ];

    const rows = houses.map((h) => [
      h.id,
      `"${h.name}"`,
      h.row + 1,
      h.col + 1,
      h.solarOutputKw.toFixed(3),
      h.solarCapacityKw.toFixed(1),
      h.cellTemperatureC.toFixed(1),
      h.irradianceWm2,
      h.panelEfficiency.toFixed(1),
      h.boostConverter.inputVoltageV.toFixed(1),
      h.boostConverter.outputVoltageV.toFixed(1),
      h.boostConverter.dutyCycle.toFixed(3),
      h.loads.load100W ? 'ON' : 'OFF',
      h.loads.load50W ? 'ON' : 'OFF',
      h.loads.load200W ? 'ON' : 'OFF',
      h.loads.load150W ? 'ON' : 'OFF',
      h.switchedLoadW,
      h.necessaryLoadKw.toFixed(3),
      h.nonEssentialLoadKw.toFixed(3),
      h.nonEssentialActive ? 'ACTIVE' : 'SHED',
      h.netPowerKw.toFixed(3),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SolarGrid_100_Telemetry_${timeString.replace(':', '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Main Simulation Loop Hook
  useEffect(() => {
    const intervalMs = 600; // updates every 600ms
    const timer = setInterval(() => {
      const dtSimMinutes = isPlaying ? simSpeed * 2 : 0;

      // 1. Update Simulation Clock if playing
      let currentMinutes = simTimeMinutes;
      let crossedMidnight = false;
      if (isPlaying) {
        const rawNext = simTimeMinutes + dtSimMinutes;
        crossedMidnight = rawNext >= 1440;
        currentMinutes = rawNext % 1440;
        setSimTimeMinutes(currentMinutes);
      }

      const decimalHour = currentMinutes / 60;

      // 2. Step Active Load Timers & collect expired timers
      let workingHouses = houses;
      if (isPlaying && activeTimers.length > 0) {
        const nextTimers: LoadTimer[] = [];
        const expiredTimers: LoadTimer[] = [];

        activeTimers.forEach((t) => {
          const nextRem = t.remainingMinutes - dtSimMinutes;
          if (nextRem <= 0) {
            expiredTimers.push(t);
          } else {
            nextTimers.push({ ...t, remainingMinutes: nextRem });
          }
        });

        if (expiredTimers.length > 0) {
          workingHouses = houses.map((h) => {
            const nextLoads: HouseLoadSwitchState = { ...h.loads };
            let changed = false;

            expiredTimers.forEach((exp) => {
              if (!matchesTarget(h.id, exp.target)) return;
              exp.loadKeys.forEach((k) => {
                const heldByOther = nextTimers.some(
                  (ot) => matchesTarget(h.id, ot.target) && ot.loadKeys.includes(k)
                );
                if (!heldByOther && nextLoads[k]) {
                  nextLoads[k] = false;
                  changed = true;
                }
              });
            });

            if (!changed) return h;
            const loadMetrics = computeHouseLoadMetrics(nextLoads);
            return {
              ...h,
              loads: nextLoads,
              switchedLoadW: loadMetrics.switchedLoadW,
              necessaryLoadKw: loadMetrics.necessaryLoadKw,
              nonEssentialLoadKw: loadMetrics.nonEssentialLoadKw,
            };
          });
        }
        setActiveTimers(nextTimers);
      }

      // 3. Compute Auto Sun Trajectory if enabled
      let effectiveWeather = { ...weather };
      if (autoSunTrajectory) {
        const computedIrradiance = getSolarIrradianceForTime(decimalHour);
        const computedTemp = getAmbientTempForTime(decimalHour);
        effectiveWeather = {
          ...weather,
          irradianceWm2: computedIrradiance,
          ambientTempC: computedTemp,
        };
        setWeather(effectiveWeather);
      }

      // 4. Update 100 Houses with PV physics & DC-DC Boost model
      const { updatedHouses, totalSolarKw: newTotalSolar, avgSolarKw: newAvgSolar } = updateHouseGeneration(
        workingHouses,
        effectiveWeather,
        currentMinutes
      );

      // 5. Execute 2-Tier Load Priority Dispatch Governor
      const dispatch = calculatePowerDispatch(
        updatedHouses,
        newTotalSolar,
        battery,
        true // allow battery to support non-essential if SoC > buffer
      );

      // 6. Step Battery Simulation aligned with sim clock
      const dtSeconds = dtSimMinutes * 60;
      const updatedBattery = dtSeconds > 0
        ? stepBatterySimulation(battery, dispatch.batteryFlowKw, dtSeconds, aiHealthProtectionActive)
        : battery;

      // 7. Update Cumulative Energy & Daily Load Consumption Metrics
      const dtHours = dtSimMinutes / 60;
      if (dtHours > 0) {
        const deltaSolarKwh = newTotalSolar * dtHours;
        const deltaNecessaryKwh = dispatch.dcBus.necessaryLoadTotalKw * dtHours;
        const deltaNonEssentialKwh = dispatch.dcBus.nonEssentialLoadTotalKw * dtHours;
        const deltaTotalLoadKwh = deltaNecessaryKwh + deltaNonEssentialKwh;
        const deltaBatteryKwh = Math.abs(dispatch.batteryFlowKw) * dtHours;

        // Exact per-load & odd/even active kW calculation
        const nonEssScale = dispatch.nonEssentialCoveredPct / 100;
        let p100W_kw = 0;
        let p50W_kw = 0;
        let p200W_kw = 0;
        let p150W_kw = 0;
        let pOdd_kw = 0;
        let pEven_kw = 0;

        dispatch.updatedHouses.forEach((h) => {
          const h100 = h.loads.load100W ? 0.1 : 0;
          const h50 = h.loads.load50W ? 0.05 : 0;
          const h200 = h.loads.load200W ? 0.2 * nonEssScale : 0;
          const h150 = h.loads.load150W ? 0.15 * nonEssScale : 0;
          p100W_kw += h100;
          p50W_kw += h50;
          p200W_kw += h200;
          p150W_kw += h150;
          const hTotal = h100 + h50 + h200 + h150;
          if (h.id % 2 === 1) pOdd_kw += hTotal;
          else pEven_kw += hTotal;
        });

        const currentTotalLoadKw = dispatch.dcBus.necessaryLoadTotalKw + dispatch.dcBus.nonEssentialLoadTotalKw;

        setDailySummary((prev) => {
          const base = crossedMidnight ? createInitialDailySummary(true) : prev;
          const currentHourInt = Math.floor(decimalHour);
          const newHourlyGen = [...base.hourlyGenerationKw];
          const newHourlyLoad = [...base.hourlyLoadKw];
          const newHourlyNec = [...base.hourlyNecessaryLoadKw];
          const newHourlyNonEss = [...base.hourlyNonEssentialLoadKw];

          newHourlyGen[currentHourInt] = Math.round(newTotalSolar * 10) / 10;
          newHourlyLoad[currentHourInt] = Math.round(currentTotalLoadKw * 10) / 10;
          newHourlyNec[currentHourInt] = Math.round(dispatch.dcBus.necessaryLoadTotalKw * 10) / 10;
          newHourlyNonEss[currentHourInt] = Math.round(dispatch.dcBus.nonEssentialLoadTotalKw * 10) / 10;

          const newTotalSolarKwh = base.totalSolarEnergyKwh + deltaSolarKwh;
          const newTotalLoadKwh = base.totalLoadEnergyKwh + deltaTotalLoadKwh;

          return {
            ...base,
            totalSolarEnergyKwh: Math.round(newTotalSolarKwh * 10) / 10,
            avgSolarEnergyPerHouseKwh: Math.round((newTotalSolarKwh / 100) * 100) / 100,
            peakSolarPowerKw: Math.max(base.peakSolarPowerKw, newTotalSolar),
            totalLoadEnergyKwh: Math.round(newTotalLoadKwh * 10) / 10,
            avgLoadEnergyPerHouseKwh: Math.round((newTotalLoadKwh / 100) * 100) / 100,
            peakLoadPowerKw: Math.max(base.peakLoadPowerKw, currentTotalLoadKw),
            totalNecessaryEnergyKwh: Math.round((base.totalNecessaryEnergyKwh + deltaNecessaryKwh) * 10) / 10,
            totalNonEssentialEnergyKwh: Math.round((base.totalNonEssentialEnergyKwh + deltaNonEssentialKwh) * 10) / 10,
            oddHomesLoadEnergyKwh: Math.round((base.oddHomesLoadEnergyKwh + pOdd_kw * dtHours) * 10) / 10,
            evenHomesLoadEnergyKwh: Math.round((base.evenHomesLoadEnergyKwh + pEven_kw * dtHours) * 10) / 10,
            loadBreakdownKwh: {
              load100WKwh: Math.round((base.loadBreakdownKwh.load100WKwh + p100W_kw * dtHours) * 100) / 100,
              load50WKwh: Math.round((base.loadBreakdownKwh.load50WKwh + p50W_kw * dtHours) * 100) / 100,
              load200WKwh: Math.round((base.loadBreakdownKwh.load200WKwh + p200W_kw * dtHours) * 100) / 100,
              load150WKwh: Math.round((base.loadBreakdownKwh.load150WKwh + p150W_kw * dtHours) * 100) / 100,
            },
            batteryThroughputKwh: Math.round((base.batteryThroughputKwh + deltaBatteryKwh) * 10) / 10,
            solarToBatteryEnergyKwh:
              dispatch.batteryFlowKw > 0
                ? Math.round((base.solarToBatteryEnergyKwh + deltaBatteryKwh) * 10) / 10
                : base.solarToBatteryEnergyKwh,
            hourlyGenerationKw: newHourlyGen,
            hourlyLoadKw: newHourlyLoad,
            hourlyNecessaryLoadKw: newHourlyNec,
            hourlyNonEssentialLoadKw: newHourlyNonEss,
          };
        });
      }

      // Update states
      setHouses(dispatch.updatedHouses);
      setBattery(updatedBattery);
      setTotalSolarKw(newTotalSolar);
      setAvgSolarKw(newAvgSolar);
      setDcBus(dispatch.dcBus);
      setSurplusPowerKw(dispatch.surplusPowerKw);
      setNonEssentialCoveredPct(dispatch.nonEssentialCoveredPct);
      setNonEssentialShedReason(dispatch.nonEssentialShedReason);

    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    simTimeMinutes,
    isPlaying,
    simSpeed,
    autoSunTrajectory,
    weather,
    houses,
    battery,
    aiHealthProtectionActive,
    activeTimers,
    createInitialDailySummary,
  ]);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans">
      
      {/* 1. Header (Top Bar Contract) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunAiDiagnostic={handleRunAiDiagnostic}
        isAiDiagnosing={isAiDiagnosing}
        onExportCsv={handleExportCsv}
        timeString={timeString}
      />

      {/* 2. Telemetry Ribbon (Real-time Totals, Averages, Daily kWh, DC Bus & Battery) */}
      <TelemetryRibbon
        totalSolarKw={totalSolarKw}
        avgSolarKw={avgSolarKw}
        dailySummary={dailySummary}
        dcBus={dcBus}
        battery={battery}
        surplusPowerKw={surplusPowerKw}
      />

      {/* 3. Interactive Simulation Controls (Time, Sun, Temperature, Clouds, Speed) */}
      <SimulationControls
        simTimeMinutes={simTimeMinutes}
        setSimTimeMinutes={setSimTimeMinutes}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        simSpeed={simSpeed}
        setSimSpeed={setSimSpeed}
        weather={weather}
        setWeather={setWeather}
        autoSunTrajectory={autoSunTrajectory}
        setAutoSunTrajectory={setAutoSunTrajectory}
        aiHealthProtectionActive={aiHealthProtectionActive}
        setAiHealthProtectionActive={setAiHealthProtectionActive}
        onResetSimulation={handleResetSimulation}
      />

      {/* 4. Main Body: Switchable Viewports */}
      <main className="grow">
        {activeTab === 'grid' && (
          <NeighborhoodGrid
            houses={houses}
            selectedHouseId={selectedHouseId}
            setSelectedHouseId={setSelectedHouseId}
            totalSolarKw={totalSolarKw}
            avgSolarKw={avgSolarKw}
            dailySummary={dailySummary}
            activeTimers={activeTimers}
            onApplyLoadPreset={handleApplyLoadPreset}
            onToggleLoadSwitch={handleToggleLoadSwitch}
            onStartLoadTimer={handleStartLoadTimer}
            onCancelLoadTimer={handleCancelLoadTimer}
            onOpenAnalytics={() => setActiveTab('analytics')}
          />
        )}

        {activeTab === 'schematic' && (
          <DCBusSchematic
            dcBus={dcBus}
            battery={battery}
            totalSolarKw={totalSolarKw}
            surplusPowerKw={surplusPowerKw}
            nonEssentialCoveredPct={nonEssentialCoveredPct}
            nonEssentialShedReason={nonEssentialShedReason}
          />
        )}

        {activeTab === 'bms' && (
          <AI_BMSConsole
            battery={battery}
            bmsReport={bmsReport}
            onRunAiDiagnostic={handleRunAiDiagnostic}
            isAiDiagnosing={isAiDiagnosing}
            aiHealthProtectionActive={aiHealthProtectionActive}
            setAiHealthProtectionActive={setAiHealthProtectionActive}
          />
        )}

        {activeTab === 'analytics' && (
          <EnergyAnalytics
            dailySummary={dailySummary}
            houses={houses}
            dcBus={dcBus}
            activeTimers={activeTimers}
            totalSolarKw={totalSolarKw}
            avgSolarKw={avgSolarKw}
            onExportCsv={handleExportCsv}
            onResetDailySummary={handleResetDailySummary}
          />
        )}

        {activeTab === 'physics' && (
          <MathModelReference />
        )}

        {activeTab === 'story' && (
          <StoryAndPdfHandbook />
        )}
      </main>

      {/* 5. Clean Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0f19] px-4 lg:px-8 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">SolarGrid-100 Microgrid Engine</span>
          <span>·</span>
          <span>100 Houses × 2.0 kW PV Formation</span>
          <span>·</span>
          <span>380V DC Bus Synchronized</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Two-Tier Priority Dispatch: Tier-1 Necessary (ALWAYS ON) · Tier-2 Non-Essential (Sheddable)
        </div>
      </footer>

    </div>
  );
}
