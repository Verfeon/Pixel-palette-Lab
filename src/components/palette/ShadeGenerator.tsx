import { useState, useMemo, useCallback } from "react";
import { usePaletteStore } from "@/stores/paletteStore";
import {
  generateShades,
  getDefaultShadeParams,
  type ShadeParams,
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
import { WandSparkles, Plus } from "lucide-react";

export function ShadeGenerator() {
  const activePalette = usePaletteStore((s) => s.getActivePalette());
  const activePaletteId = usePaletteStore((s) => s.activePaletteId);
  const replaceShades = usePaletteStore((s) => s.replaceShades);

  const [baseColorId, setBaseColorId] = useState<string>("");
  const [params, setParams] = useState<ShadeParams>(getDefaultShadeParams());

  // Derive main colors and shades reactively from the store
  const mainColors = useMemo(
    () =>
      activePalette
        ? activePalette.colors
            .filter((c) => c.kind === "main")
            .sort((a, b) => a.order - b.order)
        : [],
    [activePalette]
  );

  const existingShades = useMemo(
    () =>
      activePalette && baseColorId
        ? activePalette.colors
            .filter((c) => c.mainColorId === baseColorId)
            .sort((a, b) => a.order - b.order)
        : [],
    [activePalette, baseColorId]
  );

  // Auto-select first main color if none selected
  if (!baseColorId && mainColors.length > 0) {
    setBaseColorId(mainColors[0].id);
  }

  const baseHex = useMemo(
    () => mainColors.find((c) => c.id === baseColorId)?.hex ?? "",
    [baseColorId, mainColors]
  );

  const shades = useMemo(
    () => (baseHex ? generateShades(baseHex, params) : []),
    [baseHex, params]
  );

  const handleApply = useCallback(() => {
    if (!activePaletteId || !baseColorId) return;
    const shadeHexes = shades
      .filter((_s, i) => i !== params.shadowCount) // skip base color itself
      .map((s) => s.hex);
    replaceShades(activePaletteId, baseColorId, shadeHexes);
  }, [activePaletteId, baseColorId, shades, params.shadowCount, replaceShades]);

  const handleShadowCountChange = useCallback((value: number[]) => {
    setParams((prev) => ({ ...prev, shadowCount: value[0] }));
  }, []);

  const handleHighlightCountChange = useCallback((value: number[]) => {
    setParams((prev) => ({ ...prev, highlightCount: value[0] }));
  }, []);

  const handleIntensityChange = useCallback((value: number[]) => {
    setParams((prev) => ({ ...prev, intensity: value[0] }));
  }, []);

  const handleShadowTempChange = useCallback((value: number[]) => {
    setParams((prev) => ({ ...prev, shadowTemperature: value[0] }));
  }, []);

  const handleHighlightTempChange = useCallback((value: number[]) => {
    setParams((prev) => ({ ...prev, highlightTemperature: value[0] }));
  }, []);

  if (mainColors.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
          <WandSparkles className="h-8 w-8" />
          <p className="text-sm">Add main colors first to generate shades</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <WandSparkles className="h-4 w-4" />
          Shade Generator
        </CardTitle>
        {baseColorId && existingShades.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {existingShades.length} shade{existingShades.length !== 1 ? "s" : ""}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base color selector — only main colors */}
        <div className="space-y-2">
          <Label>Base Color (Main)</Label>
          <Select value={baseColorId} onValueChange={setBaseColorId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a main color" />
            </SelectTrigger>
            <SelectContent>
              {mainColors.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded border"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="font-mono text-xs">{c.hex}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Base color preview */}
        {baseHex && (
          <div className="flex items-center gap-3 rounded-md border p-3">
            <div
              className="h-8 w-8 rounded-md border"
              style={{ backgroundColor: baseHex }}
            />
            <span className="font-mono text-sm">{baseHex}</span>
            <span className="text-xs text-muted-foreground">(base)</span>
          </div>
        )}

        {/* Existing shades preview */}
        {existingShades.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Current shades (will be replaced)
            </Label>
            <div className="flex h-6 rounded overflow-hidden border">
              {existingShades.map((s) => (
                <div
                  key={s.id}
                  className="flex-1"
                  style={{ backgroundColor: s.hex }}
                  title={s.hex}
                />
              ))}
            </div>
          </div>
        )}

        {/* Parameters */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label>Shadows</Label>
              <span className="text-xs text-muted-foreground">{params.shadowCount}</span>
            </div>
            <Slider
              min={1}
              max={8}
              step={1}
              value={[params.shadowCount]}
              onValueChange={handleShadowCountChange}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <Label>Highlights</Label>
              <span className="text-xs text-muted-foreground">{params.highlightCount}</span>
            </div>
            <Slider
              min={1}
              max={8}
              step={1}
              value={[params.highlightCount]}
              onValueChange={handleHighlightCountChange}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <Label>Intensity</Label>
              <span className="text-xs text-muted-foreground">{params.intensity.toFixed(1)}</span>
            </div>
            <Slider
              min={0.1}
              max={2.0}
              step={0.1}
              value={[params.intensity]}
              onValueChange={handleIntensityChange}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <Label>Shadow Temperature</Label>
              <span className="text-xs text-muted-foreground">
                {params.shadowTemperature < 0 ? "Cool" : params.shadowTemperature > 0 ? "Warm" : "Neutral"}
              </span>
            </div>
            <Slider
              min={-1}
              max={1}
              step={0.1}
              value={[params.shadowTemperature]}
              onValueChange={handleShadowTempChange}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <Label>Highlight Temperature</Label>
              <span className="text-xs text-muted-foreground">
                {params.highlightTemperature < 0 ? "Cool" : params.highlightTemperature > 0 ? "Warm" : "Neutral"}
              </span>
            </div>
            <Slider
              min={-1}
              max={1}
              step={0.1}
              value={[params.highlightTemperature]}
              onValueChange={handleHighlightTempChange}
            />
          </div>
        </div>

        {/* Preview */}
        {shades.length > 0 && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex h-10 rounded-md overflow-hidden border">
              {shades.map((s, i) => (
                <div
                  key={i}
                  className="flex-1 flex items-center justify-center relative group"
                  style={{ backgroundColor: s.hex }}
                  title={`${s.label}: ${s.hex}`}
                >
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-background/80 px-1 rounded transition-opacity">
                    {s.hex}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex text-[10px] text-muted-foreground">
              {shades.map((s, i) => (
                <div key={i} className="flex-1 text-center truncate">
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apply button — replaces shades for this main color */}
        <Button className="w-full" onClick={handleApply}>
          <Plus className="mr-2 h-4 w-4" />
          {existingShades.length > 0
            ? `Replace ${existingShades.length} Shade${existingShades.length !== 1 ? "s" : ""}`
            : `Generate ${shades.length - 1} Shade${shades.length - 1 !== 1 ? "s" : ""}`}
        </Button>
        {existingShades.length > 0 && (
          <p className="text-center text-[11px] text-muted-foreground">
            Previous shades for this main color will be replaced
          </p>
        )}
      </CardContent>
    </Card>
  );
}
