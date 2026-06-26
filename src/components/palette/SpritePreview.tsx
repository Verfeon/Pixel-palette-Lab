import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePaletteStore } from "@/stores/paletteStore";
import { ALL_DEMO_SPRITES, type SpriteData } from "@/lib/demoSprites";
import {
  renderSpriteOnCanvas,
  autoMapSlots,
  getSlotColorAssignments,
  drawCheckerboard,
  type SpriteSlotMap,
} from "@/lib/spriteRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Maximize2,
  X,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PIXEL_SIZE = 12;

interface SpritePreviewProps {
  selectedPaletteId?: string | null;
  onPaletteChange?: (id: string | null) => void;
}

export function SpritePreview({ selectedPaletteId, onPaletteChange }: SpritePreviewProps) {
  const palettes = usePaletteStore((s) => s.palettes);

  const [selectedSprite, setSelectedSprite] = useState<SpriteData>(ALL_DEMO_SPRITES[0]);
  const [slotMaps, setSlotMaps] = useState<Record<string, SpriteSlotMap>>({});
  const [selectedSlotView, setSelectedSlotView] = useState<SpriteData | null>(null);
  const [largeView, setLargeView] = useState(false);

  // Find the selected palette object
  const selectedPalette = useMemo(
    () => palettes.find((p) => p.id === selectedPaletteId),
    [palettes, selectedPaletteId]
  );

  // Derive palette hexes sorted by order
  const paletteHexes = useMemo(() => {
    if (!selectedPalette) return [];
    return [...selectedPalette.colors]
      .sort((a, b) => a.order - b.order)
      .map((c) => c.hex);
  }, [selectedPalette]);

  // Auto-compute slot maps whenever palette or sprites change
  useEffect(() => {
    if (paletteHexes.length === 0) {
      setSlotMaps({});
      return;
    }

    const newMaps: Record<string, SpriteSlotMap> = {};
    for (const sprite of ALL_DEMO_SPRITES) {
      newMaps[sprite.name] = autoMapSlots(paletteHexes, sprite);
    }
    setSlotMaps(newMaps);
  }, [paletteHexes]);

  // ─── Render helpers ───────────────────────────────────────────────

  /** Render a sprite using its default colors (original). */
  const renderOriginalSprite = useCallback(
    (canvas: HTMLCanvasElement | null, sprite: SpriteData) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = sprite.width * PIXEL_SIZE;
      const h = sprite.height * PIXEL_SIZE;
      canvas.width = w;
      canvas.height = h;
      drawCheckerboard(ctx, w, h, PIXEL_SIZE);
      for (let y = 0; y < sprite.height; y++) {
        for (let x = 0; x < sprite.width; x++) {
          const slot = sprite.pixels[y * sprite.width + x];
          if (slot < 0) continue;
          ctx.fillStyle = sprite.defaultColors[slot];
          ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
      }
    },
    []
  );

  /** Render a sprite using the selected palette (falls back to defaults if none selected). */
  const renderRecoloredSprite = useCallback(
    (canvas: HTMLCanvasElement | null, sprite: SpriteData) => {
      if (!canvas) return;
      if (paletteHexes.length === 0) {
        renderOriginalSprite(canvas, sprite);
        return;
      }
      renderSpriteOnCanvas(canvas, sprite, paletteHexes, slotMaps[sprite.name], {
        pixelSize: PIXEL_SIZE,
        showCheckerboard: true,
      });
    },
    [paletteHexes, slotMaps, renderOriginalSprite]
  );

  // Slot assignments for the selected sprite
  const slotAssignments = useMemo(() => {
    if (!selectedSprite || !slotMaps[selectedSprite.name]) return [];
    return getSlotColorAssignments(selectedSprite, paletteHexes, slotMaps[selectedSprite.name]);
  }, [selectedSprite, paletteHexes, slotMaps]);

  // ─── Large view with both original and recolored ─────────────────

  const renderLargeDefault = useCallback(
    (canvas: HTMLCanvasElement | null, sprite: SpriteData) => {
      if (!canvas) return;
      const largePixelSize = PIXEL_SIZE * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = sprite.width * largePixelSize;
      const h = sprite.height * largePixelSize;
      canvas.width = w;
      canvas.height = h;
      drawCheckerboard(ctx, w, h, largePixelSize);
      for (let y = 0; y < sprite.height; y++) {
        for (let x = 0; x < sprite.width; x++) {
          const slot = sprite.pixels[y * sprite.width + x];
          if (slot < 0) continue;
          ctx.fillStyle = sprite.defaultColors[slot];
          ctx.fillRect(x * largePixelSize, y * largePixelSize, largePixelSize, largePixelSize);
        }
      }
    },
    []
  );

  const renderLargeRecolored = useCallback(
    (canvas: HTMLCanvasElement | null, sprite: SpriteData) => {
      if (!canvas) return;
      const largePixelSize = PIXEL_SIZE * 2;
      if (paletteHexes.length === 0) {
        renderLargeDefault(canvas, sprite);
        return;
      }
      renderSpriteOnCanvas(canvas, sprite, paletteHexes, slotMaps[sprite.name], {
        pixelSize: largePixelSize,
        showCheckerboard: true,
      });
    },
    [paletteHexes, slotMaps, renderLargeDefault]
  );

  // Large view canvas refs
  const largeOriginalRef = useRef<HTMLCanvasElement>(null);
  const largeRecoloredRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (largeOriginalRef.current && selectedSlotView) {
      renderLargeDefault(largeOriginalRef.current, selectedSlotView);
    }
  }, [selectedSlotView, renderLargeDefault]);

  useEffect(() => {
    if (largeRecoloredRef.current && selectedSlotView) {
      renderLargeRecolored(largeRecoloredRef.current, selectedSlotView);
    }
  }, [selectedSlotView, renderLargeRecolored]);

  const handleSpriteClick = useCallback((sprite: SpriteData) => {
    setSelectedSprite(sprite);
    setSelectedSlotView(null);
  }, []);

  const handleOpenLarge = useCallback(() => {
    setLargeView(true);
    setSelectedSlotView(selectedSprite);
  }, [selectedSprite]);

  const noPalette = paletteHexes.length === 0;

  const handlePaletteChange = useCallback((value: string) => {
    onPaletteChange?.(value === "__none__" ? null : value);
  }, [onPaletteChange]);

  return (
    <div className="space-y-4">
      {/* Palette selector */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-4">
          <Palette className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 space-y-1">
            <Label>Choose a palette</Label>
            <Select
              value={selectedPaletteId ?? "__none__"}
              onValueChange={handlePaletteChange}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select a palette" />
              </SelectTrigger>
              <SelectContent>
                {palettes.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No palettes available
                  </SelectItem>
                ) : (
                  <>
                    <SelectItem value="__none__">
                      None (show defaults)
                    </SelectItem>
                    {palettes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <div className="flex h-4 w-8 rounded overflow-hidden border">
                            {p.colors.slice(0, 4).map((c, i) => (
                              <div
                                key={i}
                                className="flex-1"
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                          <span className="truncate max-w-[10rem]">{p.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({p.colors.length})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sprite tabs */}
      <Tabs
        value={selectedSprite.name}
        onValueChange={(v) => {
          const sprite = ALL_DEMO_SPRITES.find((s) => s.name === v);
          if (sprite) handleSpriteClick(sprite);
        }}
      >
        <TabsList className="w-full flex-wrap h-auto">
          {ALL_DEMO_SPRITES.map((sprite) => (
            <TabsTrigger key={sprite.name} value={sprite.name} className="flex-1 min-w-0">
              {sprite.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {ALL_DEMO_SPRITES.map((sprite) => (
          <TabsContent key={sprite.name} value={sprite.name}>
            <div className="grid gap-6 md:grid-cols-[1fr_auto]">
              {/* Sprite canvas */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-4 w-4" />
                    {sprite.name}
                    <span className="text-xs text-muted-foreground font-normal">
                      ({sprite.width}×{sprite.height})
                    </span>
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={handleOpenLarge} title="Enlarge">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-wrap items-start justify-center gap-6 py-4">
                  {/* Original */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Original
                    </span>
                    <div className="rounded-lg border bg-muted/20 p-2">
                      <CanvasWrapper
                        sprite={sprite}
                        renderSprite={renderOriginalSprite}
                        className="mx-auto block"
                      />
                    </div>
                  </div>
                  {/* Arrow between */}
                  <div className="flex items-center self-stretch">
                    <svg
                      className="h-6 w-6 text-muted-foreground/40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </div>
                  {/* Recolored */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Recolored
                    </span>
                    <div className="rounded-lg border bg-muted/20 p-2">
                      <CanvasWrapper
                        sprite={sprite}
                        renderSprite={renderRecoloredSprite}
                        className="mx-auto block"
                      />
                    </div>
                    {noPalette && (
                      <p className="text-xs text-muted-foreground text-center">
                        No palette — showing defaults
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Slot mapping sidebar */}
              <Card className="md:w-64">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Color Mapping</CardTitle>
                </CardHeader>
                <CardContent>
                  {noPalette ? (
                    <p className="text-xs text-muted-foreground">
                      No palette loaded. Create or open a palette to see color mapping.
                    </p>
                  ) : (
                    <ScrollArea className="h-[250px] pr-3">
                      <div className="space-y-2">
                        {slotAssignments.map((assignment) => (
                          <div key={assignment.slot} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{assignment.label}</span>
                              {assignment.assignedHex ? (
                                <span className="font-mono text-[10px]">{assignment.assignedHex}</span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">unassigned</span>
                              )}
                            </div>
                            <div className="flex h-5 rounded-md overflow-hidden border">
                              <div
                                className="flex-1"
                                style={{ backgroundColor: assignment.defaultHex }}
                                title={`Default: ${assignment.defaultHex}`}
                              />
                              <div className="flex items-center justify-center px-1 text-[10px] text-muted-foreground bg-muted/30">
                                →
                              </div>
                              <div
                                className="flex-1"
                                style={{
                                  backgroundColor: assignment.assignedHex ?? "#888",
                                }}
                                title={
                                  assignment.assignedHex
                                    ? `Assigned: ${assignment.assignedHex}`
                                    : "Unassigned"
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Palette color strip */}
      {paletteHexes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Palette Colors Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-8 rounded-md overflow-hidden border">
              {paletteHexes.map((hex, i) => (
                <div
                  key={i}
                  className="flex-1 flex items-center justify-center relative group"
                  style={{ backgroundColor: hex }}
                  title={`#${i}: ${hex}`}
                >
                  <span className="text-[9px] font-mono bg-background/50 text-foreground px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-[5rem]">
                    {hex}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Large view modal */}
      {largeView && selectedSlotView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => {
            setLargeView(false);
            setSelectedSlotView(null);
          }}
        >
          <div
            className="relative rounded-xl bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-2 -top-2 z-10 rounded-full bg-background shadow-md"
              onClick={() => {
                setLargeView(false);
                setSelectedSlotView(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <h3 className="mb-4 text-lg font-bold">{selectedSlotView.name}</h3>
            <div className="flex flex-wrap items-start justify-center gap-6">
              {/* Original */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Original</span>
                <div className="rounded-lg border bg-muted/20 p-2">
                  <canvas
                    ref={largeOriginalRef}
                    className="block"
                    style={{
                      width: selectedSlotView.width * PIXEL_SIZE * 2,
                      height: selectedSlotView.height * PIXEL_SIZE * 2,
                      imageRendering: "pixelated",
                    }}
                  />
                </div>
              </div>
              {/* Arrow */}
              <div className="flex items-center self-stretch">
                <svg
                  className="h-8 w-8 text-muted-foreground/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </div>
              {/* Recolored */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Recolored</span>
                <div className="rounded-lg border bg-muted/20 p-2">
                  <canvas
                    ref={largeRecoloredRef}
                    className="block"
                    style={{
                      width: selectedSlotView.width * PIXEL_SIZE * 2,
                      height: selectedSlotView.height * PIXEL_SIZE * 2,
                      imageRendering: "pixelated",
                    }}
                  />
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Slot legend in large view */}
            <div className="flex flex-wrap gap-3 justify-center">
              {slotAssignments.map((assignment) => (
                <div key={assignment.slot} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-4 w-4 rounded border"
                    style={{
                      backgroundColor: assignment.assignedHex ?? assignment.defaultHex,
                    }}
                  />
                  <span className="text-muted-foreground">{assignment.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper component that creates a canvas and calls renderSprite in an effect.
 * This avoids inline ref callbacks and ensures proper cleanup.
 */
function CanvasWrapper({
  sprite,
  renderSprite,
  className,
}: {
  sprite: SpriteData;
  renderSprite: (canvas: HTMLCanvasElement | null, sprite: SpriteData) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    renderSprite(canvasRef.current, sprite);
  }, [sprite, renderSprite]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("image-rendering-pixelated", className)}
      style={{ width: sprite.width * PIXEL_SIZE, height: sprite.height * PIXEL_SIZE }}
    />
  );
}
