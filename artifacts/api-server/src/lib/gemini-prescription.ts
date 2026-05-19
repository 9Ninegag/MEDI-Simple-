import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PRESCRIPTION_PROMPT = `You are MediSimple, a medical prescription assistant designed for patients in rural India who struggle to understand doctor's prescriptions.

Analyze this prescription image carefully and return ONLY a valid JSON object (no markdown, no explanation outside JSON) with this exact structure:

{
  "medicines": [
    {
      "name": "medicine name as written",
      "clean_name": "corrected medicine name",
      "purpose": "what this medicine treats, in simple English",
      "dosage": "exact dosage e.g. 500mg",
      "timing": "when to take e.g. 1 tablet after each meal, 3 times a day",
      "duration": "for how many days",
      "side_effects": "2-3 common side effects in simple words",
      "unclear": false
    }
  ],
  "warnings": ["list any dangerous combinations between medicines found"],
  "generic_alternatives": [
    {
      "brand_name": "original medicine",
      "generic_name": "cheaper generic equivalent",
      "estimated_savings": "approximate % or rupee savings"
    }
  ],
  "hindi_summary": "full explanation of all medicines in Hindi in simple language",
  "tamil_summary": "full explanation in Tamil",
  "kannada_summary": "full explanation in Kannada",
  "telugu_summary": "full explanation in Telugu",
  "doctor_notes": "any other instructions visible on prescription"
}

Rules:
- If a medicine name is unclear due to bad handwriting, set unclear: true and make your best guess for clean_name
- Never invent medicine names — only extract what you can see
- Keep all explanations at a 10th grade reading level
- For timing, always convert medical shorthand: OD=once daily, BD=twice daily, TDS=three times daily, QID=four times daily, AC=before meals, PC=after meals
- Return ONLY the JSON, nothing else`;

interface GeminiRawMedicine {
  name: string;
  clean_name: string;
  purpose: string;
  dosage: string;
  timing: string;
  duration: string;
  side_effects: string;
  unclear: boolean;
}

interface GeminiRawGenericAlternative {
  brand_name: string;
  generic_name: string;
  estimated_savings: string;
}

interface GeminiRawResponse {
  medicines: GeminiRawMedicine[];
  warnings: string[];
  generic_alternatives: GeminiRawGenericAlternative[];
  hindi_summary: string;
  tamil_summary: string;
  kannada_summary: string;
  telugu_summary: string;
  doctor_notes: string;
}

export interface ParsedPrescription {
  medicines: Array<{
    name: string;
    cleanName: string;
    purpose: string;
    dosage: string;
    timing: string;
    duration: string;
    sideEffects: string;
    unclear: boolean;
  }>;
  warnings: string[];
  genericAlternatives: Array<{
    brandName: string;
    genericName: string;
    estimatedSavings: string;
  }>;
  hindiSummary: string;
  tamilSummary: string;
  kannadaSummary: string;
  teluguSummary: string;
  doctorNotes: string;
}

export async function analyzePrescriptionImage(
  imageBase64: string,
  imageType: string
): Promise<ParsedPrescription> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType: imageType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
      },
    },
    PRESCRIPTION_PROMPT,
  ]);

  let rawText = result.response.text().trim();

  // Strip markdown code block if present
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let parsed: GeminiRawResponse;
  try {
    parsed = JSON.parse(rawText) as GeminiRawResponse;
  } catch {
    throw new Error(
      "Could not read prescription. Please take a clearer photo in good lighting."
    );
  }

  if (!parsed.medicines) {
    throw new Error(
      "Could not read prescription. Please take a clearer photo in good lighting."
    );
  }

  return {
    medicines: (parsed.medicines || []).map((m) => ({
      name: m.name,
      cleanName: m.clean_name,
      purpose: m.purpose,
      dosage: m.dosage,
      timing: m.timing,
      duration: m.duration,
      sideEffects: m.side_effects,
      unclear: m.unclear,
    })),
    warnings: parsed.warnings || [],
    genericAlternatives: (parsed.generic_alternatives || []).map((g) => ({
      brandName: g.brand_name,
      genericName: g.generic_name,
      estimatedSavings: g.estimated_savings,
    })),
    hindiSummary: parsed.hindi_summary || "",
    tamilSummary: parsed.tamil_summary || "",
    kannadaSummary: parsed.kannada_summary || "",
    teluguSummary: parsed.telugu_summary || "",
    doctorNotes: parsed.doctor_notes || "",
  };
}
