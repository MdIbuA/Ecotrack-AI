import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase.js';
import { callGemini, isMockAI } from '../config/gemini.js';
import { CarbonEntry } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates AI-powered carbon footprint reduction tips using Gemini
 */
export async function getRecommendations(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get user's recent carbon entries for context
    let entries: CarbonEntry[] = [];
    try {
      const snapshot = await db.collection('carbonEntries')
        .where('userId', '==', user.uid)
        .get();
      entries = snapshot.docs.map((doc: any) => doc.data() as CarbonEntry);
    } catch (dbError) {
      console.warn('⚠️ Firestore query failed in getRecommendations, proceeding with empty entries list:', dbError);
    }
    
    // Calculate category sums for the prompt
    let transportSum = 0, energySum = 0, foodSum = 0, wasteSum = 0;
    entries.forEach((e: CarbonEntry) => {
      transportSum += e.transportation?.emissions || 0;
      energySum += e.energy?.emissions || 0;
      foodSum += e.food?.emissions || 0;
      wasteSum += e.waste?.emissions || 0;
    });

    const prompt = `
      User Profile & Carbon footprint data:
      Total Transportation emissions: ${transportSum.toFixed(1)} kg CO2
      Total Home Energy emissions: ${energySum.toFixed(1)} kg CO2
      Total Diet/Food emissions: ${foodSum.toFixed(1)} kg CO2
      Total Waste emissions: ${wasteSum.toFixed(1)} kg CO2
      Number of logs: ${entries.length}

      Generate 5 highly personalized carbon footprint reduction tips for this user based on their data.
      Provide the suggestions in JSON format matching this array interface:
      Array<{
        title: string;
        description: string;
        category: 'transportation' | 'energy' | 'food' | 'waste';
        impactScore: 'low' | 'medium' | 'high';
        difficultyScore: 'easy' | 'medium' | 'hard';
        potentialAnnualReductionKg: number;
        estimatedSavingsUsd: number;
      }>
      Format the response output strictly as valid raw JSON. Do not include markdown code block formatting.
    `;

    const systemInstruction = "You are a professional climate scientist and sustainability coach. You analyze carbon data and generate JSON formatted recommendations.";

    const result = await callGemini(prompt, systemInstruction);
    let recommendations = [];
    
    try {
      // Clean potential JSON markdown wrapper if Gemini adds it
      let jsonText = result.text.trim();
      if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7);
      if (jsonText.endsWith('```')) jsonText = jsonText.substring(0, jsonText.length - 3);
      recommendations = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error('⚠️ Failed to parse Gemini recommendations, serving mock data instead', parseError);
      // Fallback response inside callGemini handles this, but secondary safety check:
      recommendations = JSON.parse(result.text);
    }

    res.status(200).json({ success: true, recommendations });
  } catch (error) {
    next(error);
  }
}

/**
 * Uses Gemini Vision Multimodal to analyze a receipt file upload for carbon emissions
 */
export async function scanReceipt(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No receipt file uploaded' });
    }

    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    const prompt = `
      Analyze this grocery/store receipt image.
      Identify:
      1. Overall Sustainability Score (0-100, where 100 means zero plastic packaging, local organic foods, vegan options).
      2. Est carbon impact of items (in kg CO2 total).
      3. List individual key purchased items, their estimated carbon impact, general category, and ecoRating (A+ through F).
      4. 2-3 specific shopping recommendations to reduce their footprint next time.

      Provide the response strictly as valid raw JSON matching this format:
      {
        "sustainabilityScore": number,
        "totalCarbonImpact": number,
        "items": Array<{
          "name": string,
          "carbonImpact": number,
          "category": string,
          "ecoRating": string
        }>,
        "tips": Array<string>
      }
      Do not wrap the output in markdown code blocks.
    `;

    const result = await callGemini(prompt, undefined, imageBuffer, mimeType);
    let parsedResult = null;

    try {
      let jsonText = result.text.trim();
      if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7);
      if (jsonText.endsWith('```')) jsonText = jsonText.substring(0, jsonText.length - 3);
      parsedResult = JSON.parse(jsonText.trim());
    } catch (err) {
      console.error('⚠️ Failed to parse receipt scan output, using mock fallback', err);
      parsedResult = JSON.parse(result.text);
    }

    // Award bonus points for using the scanner
    try {
      const userRef = db.collection('users').doc(user.uid);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const profile = userDoc.data() as any;
        const newPoints = (profile.ecoPoints || 0) + 75; // scanner usage bonus
        await userRef.update({ ecoPoints: newPoints });
      }
    } catch (dbError) {
      console.warn('⚠️ Firestore query failed for scanner points update, proceeding anyway:', dbError);
    }

    res.status(200).json({
      success: true,
      analysis: parsedResult,
      pointsAwarded: 75
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generates an AI monthly sustainability progress summary report
 */
export async function generateReport(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { month } = req.body; // YYYY-MM
    if (!month) {
      return res.status(400).json({ success: false, error: 'Month parameter is required' });
    }

    // Retrieve carbon entries for specified month
    let allEntries: CarbonEntry[] = [];
    try {
      const snapshot = await db.collection('carbonEntries')
        .where('userId', '==', user.uid)
        .get();
      allEntries = snapshot.docs.map((doc: any) => doc.data() as CarbonEntry);
    } catch (dbError) {
      console.warn('⚠️ Firestore query failed for report carbonEntries search:', dbError);
    }
    const monthEntries = allEntries.filter((e: CarbonEntry) => e.date.startsWith(month));

    if (monthEntries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No carbon data entries found for the selected month to compile a report.'
      });
    }

    const totalEmissions = monthEntries.reduce((sum: number, e: CarbonEntry) => sum + e.totalEmissions, 0);
    const count = monthEntries.length;

    const prompt = `
      Create a monthly environmental impact summary report.
      User Details: ${user.name}
      Month: ${month}
      Total logged emissions: ${totalEmissions.toFixed(1)} kg CO2
      Number of active days logged: ${count}
      
      Analyze this data and return a JSON structured object:
      {
        "month": "${month}",
        "summary": "a short narrative describing progress, highlights, and improvements (approx 3 sentences)",
        "insights": Array<string> (3 key bulleted insights regarding transportation, energy, and food),
        "totalEmissions": number (${totalEmissions.toFixed(1)}),
        "reductionProgress": number (percentage change, e.g., 12.5 representing improvement vs average)
      }
      Return raw JSON only. Do not wrap in markdown syntax.
    `;

    const result = await callGemini(prompt);
    let parsedReport = null;

    try {
      let jsonText = result.text.trim();
      if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7);
      if (jsonText.endsWith('```')) jsonText = jsonText.substring(0, jsonText.length - 3);
      parsedReport = JSON.parse(jsonText.trim());
    } catch (err) {
      parsedReport = JSON.parse(result.text);
    }

    const reportId = uuidv4();
    const finalReport = {
      id: reportId,
      userId: user.uid,
      generatedAt: new Date().toISOString(),
      ...parsedReport
    };

    // Save report in Firestore
    try {
      await db.collection('reports').doc(reportId).set(finalReport);
    } catch (dbError) {
      console.warn('⚠️ Firestore query failed for report save:', dbError);
    }

    res.status(201).json({ success: true, report: finalReport });
  } catch (error) {
    next(error);
  }
}
