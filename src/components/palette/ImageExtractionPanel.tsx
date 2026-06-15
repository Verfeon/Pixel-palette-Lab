import { useState, useRef, useCallback, useEffect } from "react";
import { usePaletteStore } from "@/stores/paletteStore";
import { extractColorsFromImage } from "@/lib/extractColors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ImageUp,
  Loader2,
  Palette,
  Plus,
  RefreshCw,
  Upload,
} from "lucide-react";

export function ImageExtractionPanel() {
  const activePalette = usePaletteStore((s) => s.getActivePalette());
  const activePaletteId = usePaletteStore((s) => s.activePaletteId);
  const addMainColor = usePaletteStore((s) => s.addMainColor);
  const createPalette = usePaletteStore((s) => s.createPalette);
  const setActivePalette = usePaletteStore((s) => s.setActivePalette);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentFileRef = useRef<File | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Parameters
  const [maxColors, setMaxColors] = useState(8);
  const [tolerance, setTolerance] = useState(20);
  const [autoReduce, setAutoReduce] = useState(true);

  // ─── Image upload ──────────────────────────────────────────────
  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setError(null);
    setFileName(file.name);
    currentFileRef.current = file;

    // Create preview URL
    const url = URL.createObjectURL(file);

    // Revoke previous URL
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(url);

    // Clear previous results
    setExtractedColors([]);

    // Auto-extract
    await performExtract(file);
  }, [imageUrl]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // ─── Color extraction ──────────────────────────────────────────
  const performExtract = useCallback(
    async (file: File) => {
      setIsExtracting(true);
      setError(null);

      try {
        const colors = await extractColorsFromImage(file, maxColors, tolerance, autoReduce);
        setExtractedColors(colors);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to extract colors.");
      } finally {
        setIsExtracting(false);
      }
    },
    [maxColors, tolerance, autoReduce]
  );

  const handleReextract = useCallback(async () => {
    const file = currentFileRef.current;
    if (file) {
      await performExtract(file);
    } else {
      fileInputRef.current?.click();
    }
  }, [performExtract]);

  // ─── Success notification ────────────────────────────────────
  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }, []);

  // ─── Add colors to palette ─────────────────────────────────────
  const handleAddToPalette = useCallback(() => {
    if (extractedColors.length === 0) return;

    let targetId = activePaletteId;
    let created = false;

    // Create a new palette if none is active or the current one already has colors
    if (!targetId || (activePalette && activePalette.colors.length > 0)) {
      targetId = createPalette(`Extracted - ${fileName ?? "Image"}`);
      setActivePalette(targetId);
      created = true;
    }

    // Add each extracted color as a main color
    for (const hex of extractedColors) {
      addMainColor(targetId, hex);
    }

    if (created) {
      showSuccess(`Created new palette with ${extractedColors.length} colors`);
    }
  }, [extractedColors, activePaletteId, activePalette, fileName, createPalette, setActivePalette, addMainColor, showSuccess]);

  const handleCreateNewPalette = useCallback(() => {
    if (extractedColors.length === 0) return;
    const id = createPalette(`Extracted - ${fileName ?? "Image"}`);
    setActivePalette(id);
    for (const hex of extractedColors) {
      addMainColor(id, hex);
    }
    showSuccess(`Created new palette with ${extractedColors.length} colors`);
  }, [extractedColors, fileName, createPalette, setActivePalette, addMainColor, showSuccess]);

  // ─── Draw palette preview on canvas ────────────────────────────
  const palettePreviewRef = useRef<HTMLCanvasElement>(null);

  const drawPalettePreview = useCallback(() => {
    const canvas = palettePreviewRef.current;
    if (!canvas || extractedColors.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const count = extractedColors.length;
    const swatchWidth = canvas.width / count;
    const swatchHeight = canvas.height;

    for (let i = 0; i < count; i++) {
      ctx.fillStyle = extractedColors[i];
      ctx.fillRect(i * swatchWidth, 0, swatchWidth, swatchHeight);
    }
  }, [extractedColors]);

  // Trigger canvas draw when colors change
  useEffect(() => {
    drawPalettePreview();
  }, [extractedColors, drawPalettePreview]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageUp className="h-4 w-4" />
          Extract Colors from Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-8 transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {imageUrl ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={imageUrl}
                alt={fileName ?? "Preview"}
                className="max-h-40 max-w-full rounded object-contain"
              />
              <p className="text-xs text-muted-foreground">
                {fileName} — Click or drop to change
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-muted-foreground">
                Drop an image here or click to browse
              </p>
              <p className="text-xs text-muted-foreground/60">
                PNG, JPG, GIF, WebP — up to 200px for analysis
              </p>
            </div>
          )}
        </div>

        {/* Parameters */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-colors" className="text-xs">
                Max Colors: {maxColors}
              </Label>
            </div>
            <Slider
              id="max-colors"
              min={2}
              max={32}
              step={1}
              value={[maxColors]}
              onValueChange={([v]) => setMaxColors(v)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="tolerance" className="text-xs">
                Grouping Tolerance: {tolerance}
              </Label>
            </div>
            <Slider
              id="tolerance"
              min={0}
              max={100}
              step={1}
              value={[tolerance]}
              onValueChange={([v]) => setTolerance(v)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoReduce(!autoReduce)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                autoReduce
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              Auto-reduce similar colors
            </button>
          </div>
        </div>

        {/* Action buttons */}
        {imageUrl && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReextract}
              disabled={isExtracting}
            >
              {isExtracting ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-3 w-3" />
              )}
              Extract
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {successMsg && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{successMsg}</p>
        )}

        {/* Loading */}
        {isExtracting && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Extracting colors...
          </div>
        )}

        {/* Extracted colors */}
        {extractedColors.length > 0 && !isExtracting && (
          <>
            <Separator />

            {/* Color palette preview (canvas) */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Extracted Colors ({extractedColors.length})
              </Label>

              {/* Canvas preview */}
              <canvas
                ref={palettePreviewRef}
                width={300}
                height={24}
                className="w-full rounded-md"
                style={{ imageRendering: "pixelated" }}
              />

              {/* Color grid */}
              <ScrollArea className="max-h-40">
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                  {extractedColors.map((hex, i) => (
                    <div
                      key={`${hex}-${i}`}
                      className="group flex flex-col items-center gap-1 rounded-md p-1.5 transition-colors hover:bg-muted"
                    >
                      <div
                        className="h-8 w-full rounded border"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {hex}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleAddToPalette}>
                <Plus className="mr-1 h-3 w-3" />
                {activePalette && activePalette.colors.length > 0
                  ? "New Palette from Colors"
                  : activePalette
                    ? `Add to ${activePalette.name}`
                    : "Create Palette"}
              </Button>
              {activePalette && activePalette.colors.length === 0 && (
                <Button size="sm" variant="outline" onClick={handleCreateNewPalette}>
                  <Palette className="mr-1 h-3 w-3" />
                  New Palette instead
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
