import React from 'react';
import { Sun, BatteryCharging, ShieldAlert, Cpu, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRunAiDiagnostic: () => void;
  isAiDiagnosing: boolean;
  onExportCsv: () => void;
  timeString: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRunAiDiagnostic,
  isAiDiagnosing,
  onExportCsv,
  timeString,
}) => {
  const tabs = [
    { id: 'grid', label: '100-House Grid View' },
    { id: 'schematic', label: 'DC Bus & Boost Schematic' },
    { id: 'bms', label: 'AI Battery Management (BMS)' },
    { id: 'analytics', label: '24-Hour Energy Analytics' },
    { id: 'physics', label: 'Photovoltaic & Electrical Model' },
    { id: 'story', label: 'Engineering Story & PDF Handbook' },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0d131f] px-4 lg:px-8 py-3.5 sticky top-0 z-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Zone: 1-line text element */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight whitespace-nowrap">
              SolarGrid-100
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block whitespace-nowrap">
              100-House Microgrid & AI Battery Management System
            </p>
          </div>
          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />
          <div className="text-xs font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/60 rounded px-2 py-0.5 whitespace-nowrap">
            {timeString}
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Export */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onExportCsv}
            title="Export 100-house telemetry to CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={onRunAiDiagnostic}
            disabled={isAiDiagnosing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 disabled:opacity-50 rounded-md shadow transition-all whitespace-nowrap"
          >
            <Cpu className={`w-3.5 h-3.5 ${isAiDiagnosing ? 'animate-spin' : ''}`} />
            <span>{isAiDiagnosing ? 'AI Analyzing...' : 'Run AI Health Scan'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
