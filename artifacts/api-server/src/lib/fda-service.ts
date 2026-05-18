import { logger } from "./logger";

const FDA_BASE_URL = "https://api.fda.gov/drug/label.json";

interface FdaLabelResult {
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
  };
  warnings?: string[];
  drug_interactions?: string[];
  adverse_reactions?: string[];
}

interface FdaApiResponse {
  results?: FdaLabelResult[];
  error?: {
    code: string;
    message: string;
  };
}

export interface FdaDrugData {
  medicineName: string;
  warnings: string[];
  interactions: string[];
}

function truncate(text: string, maxLength = 200): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export async function getFdaDrugData(medicineName: string): Promise<FdaDrugData> {
  const emptyResult: FdaDrugData = {
    medicineName,
    warnings: [],
    interactions: [],
  };

  try {
    const encodedName = encodeURIComponent(medicineName);
    const url = `${FDA_BASE_URL}?search=openfda.brand_name:"${encodedName}"&limit=1`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // Many Indian brand names won't be in FDA DB — that's expected
      return emptyResult;
    }

    const data = (await response.json()) as FdaApiResponse;

    if (!data.results || data.results.length === 0) {
      return emptyResult;
    }

    const result = data.results[0];

    const warnings = (result.warnings || [])
      .flatMap((w) => w.split(/\n+/).filter(Boolean))
      .slice(0, 3)
      .map((w) => truncate(w));

    const interactions = (result.drug_interactions || [])
      .flatMap((i) => i.split(/\n+/).filter(Boolean))
      .slice(0, 3)
      .map((i) => truncate(i));

    return {
      medicineName,
      warnings,
      interactions,
    };
  } catch (err) {
    logger.warn({ err, medicineName }, "FDA lookup failed, returning empty");
    return emptyResult;
  }
}

export async function getFdaDataForMedicines(
  medicineNames: string[]
): Promise<FdaDrugData[]> {
  const results = await Promise.allSettled(
    medicineNames.map((name) => getFdaDrugData(name))
  );

  return results.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    return { medicineName: medicineNames[i], warnings: [], interactions: [] };
  });
}
