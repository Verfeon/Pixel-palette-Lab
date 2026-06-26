import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePaletteStore } from "@/stores/paletteStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Palette } from "lucide-react";
import { SpritePreview } from "@/components/palette/SpritePreview";

export function PreviewPage() {
  const navigate = useNavigate();
  const activePaletteId = usePaletteStore((s) => s.activePaletteId);
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(activePaletteId);

  // Resolve the palette ID to use for "Open in Editor":
  // the one selected in the preview, falling back to the active store palette
  const editorPaletteId = selectedPaletteId ?? activePaletteId;

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        {editorPaletteId ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/editor/${editorPaletteId}`)}
          >
            <Palette className="mr-2 h-4 w-4" />
            Open in Editor
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <Palette className="mr-2 h-4 w-4" />
            Create a Palette
          </Button>
        )}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Real-time Sprite Preview</h1>
        <p className="text-muted-foreground">
          Preview how your palette looks on demo sprites. Colors are automatically
          mapped from your active palette to sprite regions.
        </p>
      </div>

      <SpritePreview
        selectedPaletteId={selectedPaletteId}
        onPaletteChange={setSelectedPaletteId}
      />
    </div>
  );
}
