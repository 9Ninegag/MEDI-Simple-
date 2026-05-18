import { anthropic } from "@workspace/integrations-anthropic-ai";

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

interface ClaudeRawMedicine {
  name: string;
  clean_name: string;
  purpose: string;
  dosage: string;
  timing: string;
  duration: string;
  side_effects: string;
  unclear: boolean;
}

interface ClaudeRawGenericAlternative {
  brand_name: string;
  generic_name: string;
  estimated_savings: string;
}

interface ClaudeRawResponse {
  medicines: ClaudeRawMedicine[];
  warnings: string[];
  generic_alternatives: ClaudeRawGenericAlternative[];
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
  const mediaType = imageType as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: PRESCRIPTION_PROMPT,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let rawText = textBlock.text.trim();

  // Strip markdown code block if present
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let parsed: ClaudeRawResponse;
  try {
    parsed = JSON.parse(rawText) as ClaudeRawResponse;
  } catch {
    throw new Error("Could not read prescription. Please take a clearer photo in good lighting.");
  }

  // Check for error in response (Claude may return an error field)
  if (!parsed.medicines) {
    throw new Error("Could not read prescription. Please take a clearer photo in good lighting.");
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
