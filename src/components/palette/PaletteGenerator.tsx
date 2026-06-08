import { useState, useMemo, useCallback } from "react";
import { usePaletteStore } from "@/stores/paletteStore";
import {
  generateRandomPalette,
  generateStylePalette,
  PALETTE_STYLES,
  type PaletteStyle,
} from "@/lib/colorUtils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shuffle,
  Palette,
  Sparkles,
  Plus,
} from "lucide-react";

type GenMode = "random" | "style";

export function PaletteGenerator() {
  const activePalette = usePaletteStore((s) => s.getActivePalette());
  const addMainColor = usePaletteStore((s) => s.addMainColor);

  const [mode, setMode] = useState<GenMode>("random");
  const [colorCount, setColorCount] = useState(3);
  const [selectedStyle, setSelectedStyle] = useState<PaletteStyle>("fantasy");
  const [generated, setGenerated] = useState<string[]>([]);

  const existingHexes = useMemo(
    () => new Set((activePalette?.colors ?? []).map((c) => c.hex.toLowerCase())),
    [activePalette]
  );

  const newColors = useMemo(
    () => generated.filter((h) => !existingHexes.has(h.toLowerCase())),
    [generated, existingHexes]
  );

  const handleGenerate = useCallback(() => {
    const colors =
      mode === "random"
        ? generateRandomPalette(colorCount)
        : generateStylePalette(selectedStyle, colorCount);
    setGenerated(colors);
  }, [mode, colorCount, selectedStyle]);

  const handleApply = useCallback(() => {
    if (!activePalette) return;
    newColors.forEach((hex) => addMainColor(activePalette.id, hex));
  }, [activePalette, newColors, addMainColor]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          Palette Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode selector */}
        <div className="flex gap-2">
          <Button
            variant={mode === "random" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setMode("random")}
          >
            <Shuffle className="mr-1 h-4 w-4" />
            Random
          </Button>
          <Button
            variant={mode === "style" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setMode("style")}
          >
            <Palette className="mr-1 h-4 w-4" />
            By Style
          </Button>
        </div>

        {/* Style selector (only in style mode) */}
        {mode === "style" && (
          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={selectedStyle} onValueChange={(v: PaletteStyle) => setSelectedStyle(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {PALETTE_STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Main color count */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <Label>Number of Main Colors</Label>
            <span className="text-xs text-muted-foreground">{colorCount}</span>
          </div>
          <Slider
            min={2}
            max={6}
            step={1}
            value={[colorCount]}
            onValueChange={(v) => setColorCount(v[0])}
          />
          <p className="text-[11px] text-muted-foreground">
            Main colors are distinct base hues — use the Shade Generator below to expand each one
          </p>
        </div>

        {/* Generate button */}
        <Button className="w-full" variant="secondary" onClick={handleGenerate}>
          <Shuffle className="mr-2 h-4 w-4" />
          Generate
        </Button>

        {/* Preview */}
        {generated.length > 0 && (
          <div className="space-y-2">
            <Label>Main Colors Preview</Label>
            <div className="flex h-12 rounded-md overflow-hidden border">
              {generated.map((hex, i) => (
                <div
                  key={i}
                  className="flex-1 flex items-center justify-center relative group"
                  style={{ backgroundColor: hex }}
                  title={hex}
                >
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-background/80 px-1 rounded transition-opacity">
                    {hex}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {generated.map((hex, i) => (
                <span
                  key={i}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted"
                >
                  {hex}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Apply button */}
        <Button
          className="w-full"
          onClick={handleApply}
          disabled={newColors.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          {newColors.length > 0
            ? `Add ${newColors.length} New Color${newColors.length !== 1 ? "s" : ""} to Palette`
            : "All colors already in palette"}
        </Button>
      </CardContent>
    </Card>
  );
}
