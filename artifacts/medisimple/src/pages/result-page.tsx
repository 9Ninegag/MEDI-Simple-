import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, AlertTriangle, Pill, Clock, AlertCircle, Leaf, ShieldAlert, Info } from "lucide-react";
import type { MedicineInfo, GenericAlternative, FdaInteraction } from "@workspace/api-client-react";
import { usePrescription } from "@/lib/prescription-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

export default function ResultPage() {
  const [, setLocation] = useLocation();
  const { analysisResult, selectedLanguage } = usePrescription();

  useEffect(() => {
    if (!analysisResult) {
      setLocation("/");
    }
  }, [analysisResult, setLocation]);

  if (!analysisResult) return null;

  const {
    medicines,
    warnings,
    genericAlternatives,
    hindiSummary,
    tamilSummary,
    kannadaSummary,
    teluguSummary,
    doctorNotes,
    fdaData,
  } = analysisResult;

  const hasWarnings = warnings && warnings.length > 0;

  // Collect any extra FDA-found warnings/interactions not already in warnings
  const fdaWarnings: string[] = [];
  if (fdaData) {
    for (const fda of fdaData as FdaInteraction[]) {
      for (const w of fda.warnings ?? []) {
        fdaWarnings.push(`${fda.medicineName}: ${w}`);
      }
    }
  }

  const getLanguageSummary = () => {
    switch (selectedLanguage.toLowerCase()) {
      case "hindi": return { label: "Hindi / हिंदी", text: hindiSummary };
      case "tamil": return { label: "Tamil / தமிழ்", text: tamilSummary };
      case "kannada": return { label: "Kannada / ಕನ್ನಡ", text: kannadaSummary };
      case "telugu": return { label: "Telugu / తెలుగు", text: teluguSummary };
      default: return null;
    }
  };

  const localizedSummary = getLanguageSummary();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-lg">Prescription Details</h1>
          <p className="text-xs text-muted-foreground">
            {medicines.length} medicine{medicines.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-2xl mx-auto mt-4">

        {/* Drug Interaction Warnings */}
        {hasWarnings && (
          <div
            className="bg-destructive/10 border border-destructive/30 p-4 rounded-xl flex items-start gap-3"
            data-testid="alert-warnings"
          >
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">Drug Interaction Warning</h3>
              <ul className="list-disc pl-4 space-y-1 text-sm text-destructive/90">
                {(warnings as string[]).map((w: string, idx: number) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* FDA Warnings (if any extra ones) */}
        {fdaWarnings.length > 0 && (
          <div
            className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3"
            data-testid="alert-fda-warnings"
          >
            <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 mb-1">Additional Safety Information</h3>
              <ul className="list-disc pl-4 space-y-1 text-sm text-amber-700">
                {fdaWarnings.slice(0, 5).map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Medicines */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Your Medicines
          </h2>

          {medicines.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
              <p className="font-medium">No medicines could be read from this image.</p>
              <p className="text-sm mt-1">Please try again with a clearer, well-lit photo.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {(medicines as MedicineInfo[]).map((med: MedicineInfo, idx: number) => (
                <Card
                  key={idx}
                  className="border-border shadow-sm overflow-hidden"
                  data-testid={`card-medicine-${idx}`}
                >
                  <div className="bg-primary/5 p-4 border-b border-border flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-primary">{med.cleanName}</h3>
                      {med.name !== med.cleanName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Written as: <span className="italic">{med.name}</span>
                        </p>
                      )}
                    </div>
                    {med.unclear && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200 shrink-0 text-xs"
                      >
                        Unclear handwriting
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Purpose</p>
                        <p className="text-sm">{med.purpose}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Dosage</p>
                        <p className="text-sm font-medium">{med.dosage}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{med.timing}</p>
                        {med.duration && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Duration: {med.duration}
                          </p>
                        )}
                      </div>
                    </div>

                    {med.sideEffects && (
                      <div className="bg-muted/40 p-3 rounded-lg flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">Side effects:</strong> {med.sideEffects}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Generic Alternatives */}
        {genericAlternatives && genericAlternatives.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-600" />
              Save Money — Generic Options
            </h2>
            <p className="text-sm text-muted-foreground">
              Ask your pharmacist for these equally effective generic medicines.
            </p>
            <div className="grid gap-3">
              {(genericAlternatives as GenericAlternative[]).map((alt: GenericAlternative, idx: number) => (
                <div
                  key={idx}
                  className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between gap-4"
                  data-testid={`card-generic-${idx}`}
                >
                  <div>
                    <p className="text-xs text-emerald-700 font-medium mb-0.5">Instead of {alt.brandName}</p>
                    <p className="font-bold text-emerald-900">{alt.genericName}</p>
                  </div>
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                    Save {alt.estimatedSavings}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Doctor's Notes */}
        {doctorNotes && (
          <section className="bg-card border border-border rounded-xl p-4 space-y-2">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Doctor's Additional Instructions
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{doctorNotes}</p>
          </section>
        )}

        {/* Localized Summary */}
        {localizedSummary?.text && (
          <Accordion type="single" collapsible className="w-full" data-testid="accordion-language">
            <AccordionItem value="summary" className="border border-border rounded-xl px-4">
              <AccordionTrigger className="text-left font-semibold py-4 hover:no-underline hover:text-primary">
                Read full summary in {localizedSummary.label}
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <p className="text-base leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg">
                  {localizedSummary.text}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

      </main>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-2xl mx-auto">
          <Button
            className="w-full h-12 text-lg rounded-xl shadow-lg"
            onClick={() => setLocation("/")}
            data-testid="button-scan-another"
          >
            Scan Another Prescription
          </Button>
        </div>
      </div>
    </div>
  );
}
