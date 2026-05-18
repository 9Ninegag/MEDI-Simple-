import React from "react";
import { useLocation } from "wouter";
import { ArrowLeft, AlertTriangle, Pill, Clock, AlertCircle, Leaf, ShieldAlert } from "lucide-react";
import { usePrescription } from "@/lib/prescription-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

export default function ResultPage() {
  const [, setLocation] = useLocation();
  const { analysisResult, selectedLanguage } = usePrescription();

  // If no result is present, redirect to scan page
  if (!analysisResult) {
    setLocation("/");
    return null;
  }

  const {
    medicines,
    warnings,
    genericAlternatives,
    hindiSummary,
    tamilSummary,
    kannadaSummary,
    teluguSummary,
    doctorNotes,
  } = analysisResult;

  const hasWarnings = warnings && warnings.length > 0;
  
  const getLanguageSummary = () => {
    switch (selectedLanguage.toLowerCase()) {
      case "hindi": return hindiSummary;
      case "tamil": return tamilSummary;
      case "kannada": return kannadaSummary;
      case "telugu": return teluguSummary;
      default: return null;
    }
  };

  const localizedSummary = getLanguageSummary();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-lg">Prescription Details</h1>
          <p className="text-xs text-muted-foreground">Clear and simple breakdown</p>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-2xl mx-auto mt-4">
        
        {/* Interaction Warnings */}
        {hasWarnings && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground p-4 rounded-xl flex items-start gap-3" data-testid="alert-warnings">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">Important Interactions</h3>
              <ul className="list-disc pl-4 space-y-1 text-sm text-destructive/90">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Medicines List */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Your Medicines
          </h2>
          
          <div className="grid gap-4">
            {medicines.map((med, idx) => (
              <Card key={idx} className="border-border shadow-sm overflow-hidden" data-testid={`card-medicine-${idx}`}>
                <div className="bg-primary/5 p-4 border-b border-border flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-primary">{med.cleanName}</h3>
                    <p className="text-sm text-muted-foreground font-medium">As written: {med.name}</p>
                  </div>
                  {med.unclear && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 shrink-0 text-xs">
                      Unclear writing
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Purpose</p>
                      <p className="text-sm font-medium">{med.purpose}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Dosage</p>
                      <p className="text-sm font-medium">{med.dosage}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{med.timing}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Take for {med.duration}</p>
                    </div>
                  </div>

                  {med.sideEffects && (
                    <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2 mt-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground"><strong>Side effects:</strong> {med.sideEffects}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Generic Alternatives */}
        {genericAlternatives && genericAlternatives.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-600" />
              Save Money (Generic Options)
            </h2>
            <div className="grid gap-3">
              {genericAlternatives.map((alt, idx) => (
                <div key={idx} className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between" data-testid={`card-generic-${idx}`}>
                  <div>
                    <p className="text-xs text-emerald-700 font-medium">Instead of {alt.brandName}</p>
                    <p className="font-bold text-emerald-900">{alt.genericName}</p>
                  </div>
                  <Badge className="bg-emerald-600 hover:bg-emerald-700">
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
            <h2 className="font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Doctor's Additional Notes
            </h2>
            <p className="text-sm text-muted-foreground">{doctorNotes}</p>
          </section>
        )}

        {/* Localized Summary */}
        {localizedSummary && (
          <Accordion type="single" collapsible className="w-full" data-testid="accordion-language">
            <AccordionItem value="summary" className="border-border">
              <AccordionTrigger className="text-left font-semibold py-4 hover:no-underline hover:text-primary">
                Read summary in your language
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg border border-border">
                {localizedSummary}
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
