import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Sun, Thermometer, Cloud, Sliders, ToggleLeft, ToggleRight } from 'lucide-react';
import { WeatherCondition } from '../types/microgrid';

interface SimulationControlsProps {
  simTimeMinutes: number;
  setSimTimeMinutes: (mins: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  simSpeed: number;
  setSimSpeed: (speed: number) => void;
  weather: WeatherCondition;
  setWeather: React.Dispatch<React.SetStateAction<WeatherCondition>>;
  autoSunTrajectory: boolean;
  setAutoSunTrajectory: (val: boolean) => void;
  aiHealthProtectionActive: boolean;
  setAiHealthProtectionActive: (val: boolean) => void;
  onResetSimulation: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  simTimeMinutes,
  setSimTimeMinutes,
  isPlaying,
  setIsPlaying,
  simSpeed,
  setSimSpeed,
  weather,
  setWeather,
  autoSunTrajectory,
  setAutoSunTrajectory,
  aiHealthProtectionActive,
  setAiHealthProtectionActive,
  onResetSimulation,
}) => {
  const hours = Math.floor(simTimeMinutes / 60);
  const minutes = Math.floor(simTimeMinutes % 60);
  const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const applyPreset = (preset: WeatherCondition['preset']) => {
    setAutoSunTrajectory(false);
    switch (preset) {
      case 'CLEAR_SUMMER':
        setWeather({
          irradianceWm2: 1000,
          ambientTempC: 28,
          cloudCoverPct: 0,
          cloudSpeed: 1,
          preset: 'CLEAR_SUMMER',
        });
        setSimTimeMinutes(12 * 60); // 12:00
        break;
      case 'HEAT_WAVE':
        setWeather({
          irradianceWm2: 1080,
          ambientTempC: 43,
          cloudCoverPct: 5,
          cloudSpeed: 1,
          preset: 'HEAT_WAVE',
        });
        setSimTimeMinutes(13 * 60); // 13:00
        break;
      case 'PARTLY_CLOUDY':
        setWeather({
          irradianceWm2: 650,
          ambientTempC: 25,
          cloudCoverPct: 50,
          cloudSpeed: 2,
          preset: 'PARTLY_CLOUDY',
        });
        setSimTimeMinutes(11 * 60);
        break;
      case 'OVERCAST_WINTER':
        setWeather({
          irradianceWm2: 180,
          ambientTempC: 8,
          cloudCoverPct: 85,
          cloudSpeed: 1,
          preset: 'OVERCAST_WINTER',
        });
        setSimTimeMinutes(14 * 60);
        break;
    }
  };

  return (
    <div className="bg-[#0e1422] border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Left: Time Scrubber & Playback Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-md p-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 text-slate-200 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
              title={isPlaying ? 'Pause Simulation' : 'Start Simulation'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={onResetSimulation}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Reset to 08:00 AM"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-1 text-xs">
            {[1, 5, 20, 60].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed)}
                className={`px-2 py-0.5 rounded font-mono transition-colors ${
                  simSpeed === speed
                    ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Time Scrubber */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 grow sm:grow-0">
            <span className="text-xs font-mono font-bold text-slate-200 min-w-12">
              {timeFormatted}
            </span>
            <input
              type="range"
              min="0"
              max="1439"
              step="5"
              value={simTimeMinutes}
              onChange={(e) => setSimTimeMinutes(Number(e.target.value))}
              className="w-28 sm:w-36 accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Auto Sun Trajectory Toggle */}
          <button
            onClick={() => setAutoSunTrajectory(!autoSunTrajectory)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
              autoSunTrajectory
                ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
            title="Automatically compute sun position, irradiance, and temperature based on clock time"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Diurnal Sun Track: {autoSunTrajectory ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Center/Right: Physics Inputs (Irradiance & Temperature sliders) */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Irradiance */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400">Irradiance:</span>
            <input
              type="range"
              min="0"
              max="1200"
              step="10"
              disabled={autoSunTrajectory}
              value={weather.irradianceWm2}
              onChange={(e) => {
                setWeather((w) => ({ ...w, irradianceWm2: Number(e.target.value), preset: 'CUSTOM' }));
              }}
              className="w-20 accent-amber-400 cursor-pointer disabled:opacity-40"
            />
            <span className="font-mono text-slate-200 w-16 text-right tabular-nums">
              {weather.irradianceWm2} W/m²
            </span>
          </div>

          {/* Ambient Temperature */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5">
            <Thermometer className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-slate-400">Temp:</span>
            <input
              type="range"
              min="-10"
              max="50"
              step="1"
              disabled={autoSunTrajectory}
              value={weather.ambientTempC}
              onChange={(e) => {
                setWeather((w) => ({ ...w, ambientTempC: Number(e.target.value), preset: 'CUSTOM' }));
              }}
              className="w-16 accent-rose-400 cursor-pointer disabled:opacity-40"
            />
            <span className="font-mono text-slate-200 w-11 text-right tabular-nums">
              {weather.ambientTempC}°C
            </span>
          </div>

          {/* Cloud Cover */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5">
            <Cloud className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Clouds:</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={weather.cloudCoverPct}
              onChange={(e) => {
                setWeather((w) => ({ ...w, cloudCoverPct: Number(e.target.value), preset: 'CUSTOM' }));
              }}
              className="w-16 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-slate-200 w-8 text-right tabular-nums">
              {weather.cloudCoverPct}%
            </span>
          </div>

          {/* Presets Segmented Bar */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-1">
            <button
              onClick={() => applyPreset('CLEAR_SUMMER')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                weather.preset === 'CLEAR_SUMMER' ? 'bg-amber-950 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Summer Peak
            </button>
            <button
              onClick={() => applyPreset('HEAT_WAVE')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                weather.preset === 'HEAT_WAVE' ? 'bg-rose-950 text-rose-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Heat Wave
            </button>
            <button
              onClick={() => applyPreset('PARTLY_CLOUDY')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                weather.preset === 'PARTLY_CLOUDY' ? 'bg-cyan-950 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Drifting Clouds
            </button>
            <button
              onClick={() => applyPreset('OVERCAST_WINTER')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                weather.preset === 'OVERCAST_WINTER' ? 'bg-slate-800 text-slate-200 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overcast
            </button>
          </div>

          {/* AI Battery Protection Switch */}
          <button
            onClick={() => setAiHealthProtectionActive(!aiHealthProtectionActive)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
              aiHealthProtectionActive
                ? 'bg-teal-950/60 border-teal-500/40 text-teal-300 font-medium'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Enable AI BMS adaptive C-rate limiting, thermal throttling, and cell balancing"
          >
            <span>AI BMS Guard:</span>
            <span className="font-mono">{aiHealthProtectionActive ? 'ACTIVE' : 'OFF'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
