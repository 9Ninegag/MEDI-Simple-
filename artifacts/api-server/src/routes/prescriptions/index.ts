import { Router, type IRouter } from "express";
import { analyzePrescriptionImage } from "../../lib/gemini-prescription";
import { getFdaDataForMedicines } from "../../lib/fda-service";
import { AnalyzePrescriptionBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/prescriptions/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzePrescriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { imageBase64, imageType, language } = parsed.data;

  if (!imageBase64 || !imageType) {
    res.status(400).json({ error: "imageBase64 and imageType are required" });
    return;
  }

  req.log.info({ language, imageType }, "Analyzing prescription");

  try {
    const prescription = await analyzePrescriptionImage(imageBase64, imageType);

    // Fetch FDA data for all medicines in parallel
    const medicineNames = prescription.medicines.map((m) => m.cleanName);
    const fdaData = await getFdaDataForMedicines(medicineNames);

    req.log.info(
      { medicineCount: prescription.medicines.length },
      "Prescription analyzed successfully"
    );

    res.json({
      ...prescription,
      fdaData,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Could not read prescription. Please take a clearer photo in good lighting.";

    req.log.error({ err }, "Prescription analysis failed");
    res.status(500).json({ error: message });
  }
});

export default router;
