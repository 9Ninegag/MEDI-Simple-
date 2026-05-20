import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Camera, Upload, X } from "lucide-react";
import { useAnalyzePrescription } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePrescription } from "@/lib/prescription-context";
import { compressImage } from "@/lib/compress-image";

export default function ScanPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setSelectedLanguage: setGlobalLang, setAnalysisResult } = usePrescription();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [language, setLanguage] = useState("english");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const analyzeMutation = useAnalyzePrescription();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (JPG, PNG, HEIC).",
        variant: "destructive",
      });
      return;
    }

    setIsCompressing(true);
    try {
      const { base64, mimeType: compressedMime } = await compressImage(file);
      // Show original image preview (nicer looking)
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);

      setBase64Data(base64);
      setMimeType(compressedMime);
    } catch {
      toast({
        title: "Could not load image",
        description: "Please try a different photo.",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleClearImage = () => {
    setPreviewUrl(null);
    setBase64Data(null);
    setMimeType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleAnalyze = () => {
    if (!base64Data || !mimeType) return;

    setGlobalLang(language);

    analyzeMutation.mutate(
      {
        data: {
          imageBase64: base64Data,
          imageType: mimeType,
          language: language,
        },
      },
      {
        onSuccess: (data) => {
          setAnalysisResult(data);
          setLocation("/results");
        },
        onError: (err) => {
          const message =
            err?.data && typeof err.data === "object" && "error" in err.data
              ? String((err.data as { error: string }).error)
              : "We couldn't read this prescription. Please try a clearer photo in good lighting.";
          toast({
            title: "Analysis Failed",
            description: message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const isLoading = isCompressing || analyzeMutation.isPending;
  const loadingMessage = isCompressing
    ? "Preparing image..."
    : "Reading your prescription...";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center p-4">
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-semibold text-primary mb-2">{loadingMessage}</h2>
          <p className="text-muted-foreground">This will just take a moment.</p>
        </div>
      )}

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary tracking-tight">MediSimple</h1>
          <p className="text-muted-foreground">Understand your doctor's handwritten notes clearly and safely.</p>
        </div>

        <Card className="border-none shadow-md overflow-hidden bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Upload Prescription</CardTitle>
            <CardDescription>Take a photo or upload an existing image</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!previewUrl ? (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center gap-3 border-dashed hover:border-primary hover:text-primary transition-colors"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isLoading}
                  data-testid="button-camera"
                >
                  <Camera className="h-8 w-8" />
                  <span>Take Photo</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center gap-3 border-dashed hover:border-primary hover:text-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  data-testid="button-upload"
                >
                  <Upload className="h-8 w-8" />
                  <span>Upload Image</span>
                </Button>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-border bg-black/5 aspect-[3/4] sm:aspect-[4/3] flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Prescription preview"
                  className="max-h-full object-contain"
                  data-testid="img-preview"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                  onClick={handleClearImage}
                  disabled={isLoading}
                  data-testid="button-clear-image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium">Explain to me in:</label>
              <Select value={language} onValueChange={setLanguage} disabled={isLoading}>
                <SelectTrigger data-testid="select-language">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">Hindi / हिंदी</SelectItem>
                  <SelectItem value="tamil">Tamil / தமிழ்</SelectItem>
                  <SelectItem value="kannada">Kannada / ಕನ್ನಡ</SelectItem>
                  <SelectItem value="telugu">Telugu / తెలుగు</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full text-lg h-12 rounded-xl font-medium"
              disabled={!base64Data || isLoading}
              onClick={handleAnalyze}
              data-testid="button-analyze"
            >
              {analyzeMutation.isPending ? "Analyzing..." : "Analyze Prescription"}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground px-4">
          By continuing, you agree to our terms. This is an AI tool and should not replace professional medical advice.
        </div>
      </div>
    </div>
  );
}
