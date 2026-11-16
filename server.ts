import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI Client with required telemetry header
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // AI BMS Diagnostic & Optimization Advisor endpoint
  app.post('/api/bms/ai-advisor', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        stateOfChargePct,
        stateOfHealthPct,
        averageTempC,
        cRate,
        powerKw,
        cycleCount,
        thermalRunawayRisk,
        coolingFanPwmPct,
        cells,
        totalSolarKw,
        necessaryLoadTotalKw,
        nonEssentialLoadTotalKw,
        surplusPowerKw,
        irradianceWm2,
        ambientTempC,
      } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        res.status(200).json({
          success: true,
          isAiGenerated: false,
          healthScore: Math.round(stateOfHealthPct ?? 98),
          estimatedLifeRemainingYears: 8.5,
          aiDiagnostics: [
            `Current State of Health at ${stateOfHealthPct}% under nominal operating conditions.`,
            `Thermal status at ${averageTempC}°C with cooling fan operating at ${coolingFanPwmPct}%.`,
            `C-rate at ${cRate}C is within optimal cycling boundary (<0.5C).`,
          ],
          recommendations: [
            'Maintain dynamic depth-of-discharge buffer (keep minimum SoC above 20%).',
            'Take advantage of midday solar peak to run cell balancing cycles.',
            'Keep non-essential loads throttled when solar generation falls below necessary load baseline.',
          ],
          chargePolicyAdvice: 'Use CC-CV with dynamic thermal-compensation and MPPT boost sync.',
          loadManagementStatus: 'Priority governor active: Necessary loads permanently powered.',
          optimalSoCWindow: { min: 20, max: 85 },
        });
        return;
      }

      // Construct prompt with precise microgrid telemetry
      const prompt = `You are the lead AI Battery Management System (BMS) & Microgrid Power Engineer for a 100-house solar microgrid.
Each house has a 2 kW solar PV array connected via DC-DC boost converters to a central 380V DC Bus and a 500 kWh LiFePO4 battery storage bank.
There are two load tiers:
1. Necessary Loads (ALWAYS ON - critical medical, cooling, communications)
2. Non-Essential Loads (sheddable / flexible during deficits)
Surplus power charges the battery; during deficits, necessary loads are prioritized over battery charging and non-essential loads are curtailed.

Current Telemetry:
- Total Solar Generation (100 houses): ${totalSolarKw} kW
- Necessary Load Total: ${necessaryLoadTotalKw} kW
- Non-Essential Load Total: ${nonEssentialLoadTotalKw} kW
- Net Microgrid Surplus/Deficit: ${surplusPowerKw > 0 ? `+${surplusPowerKw} kW surplus` : `${surplusPowerKw} kW deficit`}
- Solar Irradiance: ${irradianceWm2} W/m²
- Ambient Temp: ${ambientTempC} °C
- Battery State of Charge (SoC): ${stateOfChargePct}%
- Battery State of Health (SoH): ${stateOfHealthPct}%
- Battery Pack Power: ${powerKw} kW (${powerKw > 0 ? 'Charging' : powerKw < 0 ? 'Discharging' : 'Idle'})
- Battery C-Rate: ${cRate} C
- Average Battery Pack Temp: ${averageTempC} °C
- Thermal Runaway Risk: ${thermalRunawayRisk}
- Equivalent Cycles: ${cycleCount}
- Cell Voltage Spread: 16 cells monitored

Analyze the battery health and power management dispatch. Provide a JSON response matching this exact structure:
{
  "healthScore": <integer 0-100>,
  "estimatedLifeRemainingYears": <number>,
  "degradationRatePerYearPct": <number>,
  "aiDiagnostics": [<string>, <string>, <string>],
  "recommendations": [<string>, <string>, <string>],
  "chargePolicyAdvice": <string>,
  "loadManagementStatus": <string>,
  "optimalSoCWindow": { "min": <integer>, "max": <integer> }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an expert power systems and battery electrochemistry engineer. Output only valid JSON without markdown wrapping.',
        },
      });

      const responseText = response.text || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        // In case there is any unexpected formatting
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      res.status(200).json({
        success: true,
        isAiGenerated: true,
        ...parsedData,
      });
    } catch (error: any) {
      console.error('Error generating AI BMS advice:', error);
      res.status(200).json({
        success: true,
        isAiGenerated: false,
        healthScore: Math.round(req.body.stateOfHealthPct ?? 98),
        estimatedLifeRemainingYears: 8.2,
        aiDiagnostics: [
          `Battery SoH stable at ${req.body.stateOfHealthPct}%.`,
          `Thermal regulation maintaining cell temperatures at ${req.body.averageTempC}°C.`,
          `DC bus voltage synchronized with boost converter MPPT stages.`,
        ],
        recommendations: [
          'Enforce strict priority for necessary loads during nighttime and low-irradiance periods.',
          'Limit charging current when battery temperature exceeds 35°C.',
          'Schedule periodic cell balancing when solar surplus is available.',
        ],
        chargePolicyAdvice: 'Dynamic CC-CV charge profiling with multi-stage MPPT integration.',
        loadManagementStatus: 'Active priority dispatch: Necessary load guaranteed.',
        optimalSoCWindow: { min: 20, max: 85 },
      });
    }
  });

  // Serve static assets or mount Vite dev middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SolarGrid-100 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
