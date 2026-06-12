import { useState, useRef, useCallback } from "react";
import { usePaletteStore } from "@/stores/paletteStore";
import {
  exportJson,
  exportGpl,
  exportCssVariables,
  exportTailwindConfig,
  exportPng,
  exportAse,
} from "@/lib/exportUtils";
import { importJson, importPng, importCustomPalette, type ImportedColorEntry } from "@/lib/importUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Download,
  Upload,
  FileJson,
  ImageIcon,
  FileType,
  Palette,
  Copy,
  Check,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";

type ExportFormat = "json" | "png" | "gpl" | "css" | "tailwind" | "ase";

const EXPORT_LABELS: Record<ExportFormat, { label: string; icon: React.ReactNode }> = {
  json: { label: "JSON", icon: <FileJson className="h-4 w-4" /> },
  png: { label: "PNG", icon: <ImageIcon className="h-4 w-4" /> },
  gpl: { label: "GPL (GIMP)", icon: <FileType className="h-4 w-4" /> },
  css: { label: "CSS Variables", icon: <FileSpreadsheet className="h-4 w-4" /> },
  tailwind: { label: "Tailwind Config", icon: <FileSpreadsheet className="h-4 w-4" /> },
  ase: { label: "ASE (Advanced)", icon: <FileType className="h-4 w-4" /> },
};

export function ImportExportPanel() {
  const activePalette = usePaletteStore((s) => s.getActivePalette());
  const addMainColor = usePaletteStore((s) => s.addMainColor);
  const createPalette = usePaletteStore((s) => s.createPalette);
  const replaceShades = usePaletteStore((s) => s.replaceShades);

  const [activeTab, setActiveTab] = useState<string>("export");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [exportText, setExportText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [importMode, setImportMode] = useState<"json" | "png" | "custom">("json");
  const [customText, setCustomText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [pngImporting, setPngImporting] = useState(false);
  const [pngMaxColors, setPngMaxColors] = useState(8);
  const [pngTolerance, setPngTolerance] = useState(30);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pngInputRef = useRef<HTMLInputElement>(null);

  // Re-generate when palette or format changes

  // ─── Download handler ────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!activePalette || activePalette.colors.length === 0) return;

    switch (exportFormat) {
      case "json": {
        const content = exportJson(activePalette);
        downloadText(content, `${activePalette.name}.json`, "application/json");
        break;
      }
      case "gpl": {
        const content = exportGpl(activePalette);
        downloadText(content, `${activePalette.name}.gpl`, "text/plain");
        break;
      }
      case "css": {
        const content = exportCssVariables(activePalette);
        downloadText(content, `${activePalette.name}.css`, "text/css");
        break;
      }
      case "tailwind": {
        const content = exportTailwindConfig(activePalette);
        downloadText(content, `${activePalette.name}-tailwind.js`, "text/javascript");
        break;
      }
      case "png": {
        const blob = await exportPng(activePalette);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${activePalette.name}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        break;
      }
      case "ase": {
        const blob = exportAse(activePalette);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activePalette.name}.ase`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
    }
  }, [activePalette, exportFormat]);

  // ─── Copy to clipboard ──────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (!exportText) return;
    navigator.clipboard.writeText(exportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [exportText]);

  // ─── Import handlers ────────────────────────────────────────────
  const handleJsonFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImportError(null);

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const result = importJson(ev.target?.result as string);
          applyImportedColors(result.colors, result.name);
        } catch (err) {
          setImportError(err instanceof Error ? err.message : "Failed to parse JSON");
        }
      };
      reader.onerror = () => setImportError("Failed to read file");
      reader.readAsText(file);

      // Reset input so re-selecting same file triggers onChange
      e.target.value = "";
    },
    [activePalette, addMainColor, createPalette, replaceShades]
  );

  const handlePngFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImportError(null);
      setPngImporting(true);

      try {
        const hexes = await importPng(file, pngMaxColors, pngTolerance);
        if (hexes.length === 0) {
          setImportError("No colors could be extracted from the image");
        } else {
          applyImportedFlatHexes(hexes);
        }
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Failed to extract colors");
      } finally {
        setPngImporting(false);
        e.target.value = "";
      }
    },
    [pngMaxColors, pngTolerance, activePalette, addMainColor, createPalette]
  );

  const handleCustomImport = useCallback(() => {
    if (!customText.trim()) return;
    setImportError(null);

    try {
      const hexes = importCustomPalette(customText);
      if (hexes.length === 0) {
        setImportError("No valid colors found in the text");
        return;
      }
      applyImportedFlatHexes(hexes);
      setCustomText("");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to parse colors");
    }
  }, [customText, activePalette, addMainColor, createPalette]);

  /** Import a flat list of hexes as main colors (PNG, custom palette). */
  const applyImportedFlatHexes = useCallback(
    (hexes: string[], name?: string) => {
      let paletteId = activePalette?.id;
      if (!paletteId) {
        paletteId = createPalette(name);
      }
      hexes.forEach((hex) => {
        addMainColor(paletteId!, hex);
      });
    },
    [activePalette, createPalette, addMainColor]
  );

  /**
   * Import structured colors with their shades (JSON).
   * Adds main colors first, then attaches shades by looking up
   * each main color's ID by its hex value.
   *
   * Reads fresh state from the store after adding main colors,
   * since local state hasn't re-rendered yet.
   */
  const applyImportedColors = useCallback(
    (colors: ImportedColorEntry[], name?: string) => {
      let paletteId = activePalette?.id;
      if (!paletteId) {
        paletteId = createPalette(name);
      }

      // Step 1: add all main colors
      const mainHexes = colors.map((c) => c.hex);
      mainHexes.forEach((hex) => {
        addMainColor(paletteId!, hex);
      });

      // Step 2: read fresh store state to find each main color's ID
      const state = usePaletteStore.getState();
      const updatedPalette = state.palettes.find((p) => p.id === paletteId);
      if (!updatedPalette) return;

      for (const entry of colors) {
        if (entry.shades.length === 0) continue;
        const mainColor = updatedPalette.colors.find(
          (c) => c.kind === "main" && c.hex.toLowerCase() === entry.hex.toLowerCase()
        );
        if (mainColor) {
          replaceShades(paletteId!, mainColor.id, entry.shades);
        }
      }
    },
    [activePalette, createPalette, addMainColor, replaceShades]
  );

  // Regenerate export text when format or activePalette changes
  // Using a simple approach: generate on format change button click
  const handleFormatChange = useCallback(
    (fmt: ExportFormat) => {
      setExportFormat(fmt);
      if (!activePalette) return;
      switch (fmt) {
        case "json":
          setExportText(exportJson(activePalette));
          break;
        case "gpl":
          setExportText(exportGpl(activePalette));
          break;
        case "css":
          setExportText(exportCssVariables(activePalette));
          break;
        case "tailwind":
          setExportText(exportTailwindConfig(activePalette));
          break;
        default:
          setExportText("");
          break;
      }
    },
    [activePalette]
  );

  // Generate initial preview when palette changes
  if (activePalette && !exportText && exportFormat !== "png" && exportFormat !== "ase") {
    handleFormatChange(exportFormat);
  }

  const hasColors = activePalette && activePalette.colors.length > 0;
  const isBinaryFormat = exportFormat === "png" || exportFormat === "ase";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" />
          Import / Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="export" className="flex-1">
              <Download className="mr-1 h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-1">
              <Upload className="mr-1 h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

          {/* ─── Export Tab ──────────────────────────────────────────── */}
          <TabsContent value="export" className="space-y-4">
            {/* Format selector */}
            <div className="flex flex-wrap gap-2">
              {(Object.entries(EXPORT_LABELS) as [ExportFormat, { label: string; icon: React.ReactNode }][]).map(
                ([fmt, info]) => (
                  <Button
                    key={fmt}
                    variant={exportFormat === fmt ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFormatChange(fmt)}
                    className="flex items-center gap-1"
                  >
                    {info.icon}
                    {info.label}
                  </Button>
                )
              )}
            </div>

            {/* Preview for text-based formats */}
            {!isBinaryFormat && exportText && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <ScrollArea className="h-48 w-full rounded-md border">
                  <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
                    {exportText}
                  </pre>
                </ScrollArea>
              </div>
            )}

            {/* Binary format info */}
            {isBinaryFormat && (
              <p className="text-sm text-muted-foreground text-center">
                {exportFormat === "png"
                  ? "Palette will be rendered as a PNG image with color swatches."
                  : "Adobe Swatch Exchange format (.ase) — compatible with Photoshop, Illustrator, etc."}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleDownload}
                disabled={!hasColors}
              >
                <Download className="mr-2 h-4 w-4" />
                Download {EXPORT_LABELS[exportFormat].label}
              </Button>
              {!isBinaryFormat && exportText && (
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <Check className="mr-1 h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="mr-1 h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>
          </TabsContent>

          {/* ─── Import Tab ──────────────────────────────────────────── */}
          <TabsContent value="import" className="space-y-4">
            {/* Import mode selector */}
            <div className="flex gap-2">
              <Button
                variant={importMode === "json" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setImportMode("json")}
              >
                <FileJson className="mr-1 h-4 w-4" />
                JSON
              </Button>
              <Button
                variant={importMode === "png" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setImportMode("png")}
              >
                <ImageIcon className="mr-1 h-4 w-4" />
                PNG / Image
              </Button>
              <Button
                variant={importMode === "custom" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setImportMode("custom")}
              >
                <Palette className="mr-1 h-4 w-4" />
                Custom
              </Button>
            </div>

            {/* JSON Import */}
            {importMode === "json" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Import a palette from a JSON file in Pixel Palette Lab format.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleJsonFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  Select JSON File
                </Button>
              </div>
            )}

            {/* PNG Import */}
            {importMode === "png" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Extract dominant colors from an image. The image is sampled
                  and similar colors are grouped together.
                </p>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label>Max Colors</Label>
                    <span className="text-xs text-muted-foreground">{pngMaxColors}</span>
                  </div>
                  <Slider
                    min={2}
                    max={32}
                    step={1}
                    value={[pngMaxColors]}
                    onValueChange={(v) => setPngMaxColors(v[0])}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label>Grouping Tolerance</Label>
                    <span className="text-xs text-muted-foreground">{pngTolerance}</span>
                  </div>
                  <Slider
                    min={5}
                    max={100}
                    step={5}
                    value={[pngTolerance]}
                    onValueChange={(v) => setPngTolerance(v[0])}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Lower = stricter grouping, more distinct colors
                  </p>
                </div>

                <input
                  ref={pngInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePngFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => pngInputRef.current?.click()}
                  disabled={pngImporting}
                >
                  {pngImporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="mr-2 h-4 w-4" />
                  )}
                  {pngImporting ? "Extracting..." : "Select Image"}
                </Button>
              </div>
            )}

            {/* Custom palette import */}
            {importMode === "custom" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Paste hex colors (one per line). Supports <code>#RRGGBB</code>,{" "}
                  <code>#RGB</code>, or <code>R, G, B</code> format.
                </p>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={`#ff0000\n#00ff00\n#0000ff\n255, 0, 0`}
                  className="w-full h-32 rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  spellCheck={false}
                />
                <Button
                  className="w-full"
                  onClick={handleCustomImport}
                  disabled={!customText.trim()}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Import Colors
                </Button>
              </div>
            )}

            {/* Import error */}
            {importError && (
              <p className="text-sm text-destructive">{importError}</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function downloadText(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
