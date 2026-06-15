import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ImageExtractionPanel } from "@/components/palette/ImageExtractionPanel";

export function AnalyzePage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Image Color Extraction</h1>
        <p className="text-muted-foreground">
          Upload an image to extract its dominant colors and generate a palette.
        </p>
      </div>

      <ImageExtractionPanel />
    </div>
  );
}
