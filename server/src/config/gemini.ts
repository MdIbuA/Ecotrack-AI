import { GoogleGenAI } from '@google/genai';

let ai: any = null;
let isMockAI = false;

const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log('🤖 Gemini API Client Initialized Successfully');
  } catch (error) {
    console.error('⚠️ Failed to initialize Gemini client, falling back to mock mode', error);
    isMockAI = true;
  }
} else {
  console.log('🌱 No GEMINI_API_KEY found. Running AI features in MOCK Mode.');
  isMockAI = true;
}

export interface GeminiResponse {
  text: string;
}

/**
 * Helper to call Gemini model
 */
export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  imageBuffer?: Buffer,
  mimeType?: string
): Promise<GeminiResponse> {
  if (isMockAI || !ai) {
    return getMockAIResponse(prompt);
  }

  try {
    const contents: any[] = [];
    
    if (imageBuffer && mimeType) {
      contents.push({
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType
        }
      });
    }

    contents.push(prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: systemInstruction ? {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json'
      } : {
        responseMimeType: 'application/json'
      }
    });

    return { text: response.text || '' };
  } catch (error) {
    console.error('❌ Gemini execution failed. Falling back to mock responses.', error);
    return getMockAIResponse(prompt);
  }
}

/**
 * Returns mock responses mimicking Gemini response structures
 */
function getMockAIResponse(prompt: string): GeminiResponse {
  const lowercasePrompt = prompt.toLowerCase();

  if (lowercasePrompt.includes('receipt') || lowercasePrompt.includes('grocery') || lowercasePrompt.includes('items')) {
    return {
      text: JSON.stringify({
        sustainabilityScore: 78,
        totalCarbonImpact: 4.25,
        items: [
          { name: 'Organic Bananas (local)', carbonImpact: 0.2, category: 'Food', ecoRating: 'A' },
          { name: 'Red Meat (Beef)', carbonImpact: 2.8, category: 'Food', ecoRating: 'D' },
          { name: 'Plastic Bottled Soda', carbonImpact: 0.85, category: 'Waste', ecoRating: 'F' },
          { name: 'Almond Milk (Tetrapak)', carbonImpact: 0.4, category: 'Food', ecoRating: 'B' }
        ],
        tips: [
          'Substitute beef with chicken or plant-based proteins to save up to 2.0 kg CO2.',
          'Choose loose produce instead of pre-packaged fruits to reduce plastic waste.',
          'Consider tap water or reusable bottles to avoid single-use plastic carbon footprints.'
        ]
      })
    };
  }

  if (lowercasePrompt.includes('recommendation') || lowercasePrompt.includes('action') || lowercasePrompt.includes('lifestyle')) {
    return {
      text: JSON.stringify([
        {
          title: 'Unplug Standby Devices',
          description: 'Power down entertainment systems, chargers, and appliances when not in use. Many devices use "vampire power" even when turned off.',
          category: 'energy',
          impactScore: 'medium',
          difficultyScore: 'easy',
          potentialAnnualReductionKg: 150,
          estimatedSavingsUsd: 45
        },
        {
          title: 'Optimize AC Thermostat',
          description: 'Increase your air conditioner thermostat by 2 degrees in the summer. Use fans to circulate air and stay cool.',
          category: 'energy',
          impactScore: 'high',
          difficultyScore: 'easy',
          potentialAnnualReductionKg: 350,
          estimatedSavingsUsd: 110
        },
        {
          title: 'Implement Meatless Mondays',
          description: 'Swap meat-based meals with healthy plant-based alternatives just one day a week to reduce agricultural greenhouse gases.',
          category: 'food',
          impactScore: 'high',
          difficultyScore: 'medium',
          potentialAnnualReductionKg: 280,
          estimatedSavingsUsd: 120
        },
        {
          title: 'Try Carpooling or Cycling',
          description: 'For commutes under 5km, consider cycling or walking. For longer distances, team up with coworkers to carpool.',
          category: 'transportation',
          impactScore: 'high',
          difficultyScore: 'medium',
          potentialAnnualReductionKg: 900,
          estimatedSavingsUsd: 350
        },
        {
          title: 'Enhance Recycling Sorting',
          description: 'Clean and separate recyclables properly. Set up designated bins to ensure plastic, glass, and paper do not end up in landfills.',
          category: 'waste',
          impactScore: 'medium',
          difficultyScore: 'easy',
          potentialAnnualReductionKg: 80,
          estimatedSavingsUsd: 15
        }
      ])
    };
  }

  // Fallback for monthly report
  return {
    text: JSON.stringify({
      month: '2026-06',
      summary: 'You made excellent progress this month! Your total carbon emissions dropped by 12% compared to your previous baseline, mainly driven by a reduction in car travel and improved recycling habits.',
      insights: [
        'Your transportation footprint dropped by 24.5 kg CO2 due to walking/cycling more.',
        'Home energy was your highest category, representing 45% of your total footprint.',
        'Recycling rate reached 65% this month, saving approximately 8.2 kg CO2.'
      ],
      totalEmissions: 118.5,
      reductionProgress: 12
    })
  };
}

export { isMockAI };
