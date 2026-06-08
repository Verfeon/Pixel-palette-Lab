import { useState, useCallback } from "react";
import { usePaletteStore } from "@/stores/paletteStore";
import { ColorSwatch } from "@/components/palette/ColorSwatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Palette, Trash2, RotateCcw } from "lucide-react";
import { ShadeGenerator } from "@/components/palette/ShadeGenerator";
import { isValidHex, normalizeHex } from "@/lib/colorUtils";
import { cn } from "@/lib/utils";

export function PaletteEditor() {
  const activePalette = usePaletteStore((s) => s.getActivePalette());
  const addColor = usePaletteStore((s) => s.addColor);
  const updateColor = usePaletteStore((s) => s.updateColor);
  const removeColor = usePaletteStore((s) => s.removeColor);
  const renamePalette = usePaletteStore((s) => s.renamePalette);
  const deletePalette = usePaletteStore((s) => s.deletePalette);
  const createPalette = usePaletteStore((s) => s.createPalette);
  const palettes = usePaletteStore((s) => s.palettes);
  const activePaletteId = usePaletteStore((s) => s.activePaletteId);
  const setActivePalette = usePaletteStore((s) => s.setActivePalette);

  const [paletteName, setPaletteName] = useState(activePalette?.name ?? "");

  // Sync local name when active palette changes
  if (activePalette && activePalette.name !== paletteName) {
    setPaletteName(activePalette.name);
  }

  const handleNameChange = useCallback(
    (name: string) => {
      setPaletteName(name);
      if (activePaletteId) {
        renamePalette(activePaletteId, name);
      }
    },
    [activePaletteId, renamePalette]
  );

  const handleColorChange = useCallback(
    (colorId: string, hex: string) => {
      if (!activePaletteId) return;
      // Only update if valid hex (allow in-progress typing)
      if (isValidHex(hex) || hex.length <= 7) {
        // Normalize only on valid complete hex
        const finalHex = isValidHex(hex) ? normalizeHex(hex) : hex;
        updateColor(activePaletteId, colorId, finalHex);
      }
    },
    [activePaletteId, updateColor]
  );

  const handleAddColor = useCallback(() => {
    if (activePaletteId) {
      addColor(activePaletteId);
    }
  }, [activePaletteId, addColor]);

  const handleDeletePalette = useCallback(() => {
    if (activePaletteId) {
      deletePalette(activePaletteId);
    }
  }, [activePaletteId, deletePalette]);

  const handleCreatePalette = useCallback(() => {
    createPalette();
  }, [createPalette]);

  const sortedColors = activePalette
    ? [...activePalette.colors].sort((a, b) => a.order - b.order)
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header / Palette tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Palette className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Palette Editor</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCreatePalette}>
            <Plus className="mr-1 h-4 w-4" />
            New Palette
          </Button>
          {activePaletteId && (
            <Button variant="destructive" size="sm" onClick={handleDeletePalette}>
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Palette tabs */}
      {palettes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {palettes.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePalette(p.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                p.id === activePaletteId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {p.name}
              <span className="ml-1.5 text-xs opacity-60">({p.colors.length})</span>
            </button>
          ))}
        </div>
      )}

      {!activePalette ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Palette className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="mb-4 text-lg text-muted-foreground">No palette yet</p>
            <Button onClick={handleCreatePalette}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Palette
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Palette name */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Palette Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={paletteName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Untitled Palette"
                className="text-lg font-semibold"
              />
            </CardContent>
          </Card>

          {/* Color list */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">
                Colors ({sortedColors.length})
              </CardTitle>
              <Button size="sm" onClick={handleAddColor}>
                <Plus className="mr-1 h-4 w-4" />
                Add Color
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedColors.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                  <RotateCcw className="h-8 w-8" />
                  <p>No colors yet. Click "Add Color" to get started.</p>
                </div>
              ) : (
                sortedColors.map((color) => (
                  <ColorSwatch
                    key={color.id}
                    hex={color.hex}
                    onDelete={() => removeColor(activePalette.id, color.id)}
                    onChange={(hex) => handleColorChange(color.id, hex)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Color count info */}
          <p className="text-center text-xs text-muted-foreground">
            {sortedColors.length} color{sortedColors.length !== 1 ? "s" : ""} · Click HEX to edit · Hover to reveal delete
          </p>

          {/* Shade Generator */}
          <ShadeGenerator />
        </>
      )}
    </div>
  );
}


