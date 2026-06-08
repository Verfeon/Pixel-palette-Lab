import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePaletteStore } from "@/stores/paletteStore";
import { PaletteEditor } from "@/components/palette/PaletteEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const palettes = usePaletteStore((s) => s.palettes);
  const setActivePalette = usePaletteStore((s) => s.setActivePalette);

  // Find the palette by ID and set it as active
  const palette = palettes.find((p) => p.id === id);
  const paletteId = palette?.id;

  useEffect(() => {
    if (paletteId) {
      setActivePalette(paletteId);
    }
  }, [paletteId, setActivePalette]);

  // If palette doesn't exist, show error
  if (!palette) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">Palette not found</p>
          <p className="text-sm">The palette you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <PaletteEditor />
    </div>
  );
}
