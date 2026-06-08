import { useState, useCallback } from "react";
import { hexToRgb, hexToHsl, rgbToHex, hslToHex } from "@/lib/colorUtils";
import type { ColorKind } from "@/types/palette";
import type { RgbColor, HslColor } from "@/lib/colorUtils";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  hex: string;
  onDelete: () => void;
  onChange: (hex: string) => void;
  onDragStart?: () => void;
  isDragging?: boolean;
  kind?: ColorKind;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, isNaN(val) ? min : val));
}

export function ColorSwatch({ hex, onDelete, onChange, onDragStart, isDragging, kind = "shade" }: ColorSwatchProps) {
  const rgb = hexToRgb(hex);
  const hsl = hexToHsl(hex);

  // Track which hex value the local state is synchronized to
  const [syncedHex, setSyncedHex] = useState(hex);
  const [r, setR] = useState(rgb?.r ?? 0);
  const [g, setG] = useState(rgb?.g ?? 0);
  const [b, setB] = useState(rgb?.b ?? 0);
  const [h, setH] = useState(hsl?.h ?? 0);
  const [s, setS] = useState(hsl?.s ?? 0);
  const [l, setL] = useState(hsl?.l ?? 0);

  // Derive values from hex for display; sync local state on external changes
  if (hex !== syncedHex) {
    setSyncedHex(hex);
    if (rgb) { setR(rgb.r); setG(rgb.g); setB(rgb.b); }
    if (hsl) { setH(hsl.h); setS(hsl.s); setL(hsl.l); }
  }

  const handleRgbChange = useCallback((channel: "r" | "g" | "b", value: number) => {
    const upd = { r, g, b };
    upd[channel] = clamp(value, 0, 255);
    const updatedRgb: RgbColor = { r: upd.r, g: upd.g, b: upd.b };
    if (channel === "r") setR(upd.r);
    else if (channel === "g") setG(upd.g);
    else setB(upd.b);
    onChange(rgbToHex(updatedRgb.r, updatedRgb.g, updatedRgb.b));
  }, [r, g, b, onChange]);

  const handleHslChange = useCallback((channel: "h" | "s" | "l", value: number) => {
    const upd = { h, s, l };
    if (channel === "h") upd.h = clamp(value, 0, 360);
    else if (channel === "s") upd.s = clamp(value, 0, 100);
    else upd.l = clamp(value, 0, 100);
    const updatedHsl: HslColor = { h: upd.h, s: upd.s, l: upd.l };
    if (channel === "h") setH(upd.h);
    else if (channel === "s") setS(upd.s);
    else setL(upd.l);
    onChange(hslToHex(updatedHsl.h, updatedHsl.s, updatedHsl.l));
  }, [h, s, l, onChange]);

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg border p-3 transition-all hover:shadow-md flex-wrap",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Drag handle */}
      {onDragStart && (
        <button
          className="cursor-grab text-muted-foreground hover:text-foreground touch-none shrink-0"
          onMouseDown={onDragStart}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Color preview */}
      <div className="relative h-10 w-10 shrink-0">
        <div
          className="h-full w-full rounded-md border"
          style={{ backgroundColor: hex }}
          title={hex}
        />
        {kind === "main" && (
          <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold px-1 rounded leading-tight">
            M
          </span>
        )}
      </div>

      {/* HEX input */}
      <div className="flex-1 min-w-0 text-center">
        <label className="text-[10px] font-medium text-muted-foreground">HEX</label>
        <input
          className="w-full bg-transparent font-mono text-xs text-center focus:outline-none focus:ring-1 focus:ring-ring rounded px-1"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          maxLength={7}
        />
      </div>

      {/* RGB inputs */}
      <div className="hidden sm:block flex-1 min-w-0 text-center">
        <label className="text-[10px] font-medium text-muted-foreground">RGB</label>
        <div className="flex gap-0.5 items-center justify-center">
          <input
            className="w-10 bg-transparent font-mono text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring rounded"
            type="number"
            min={0}
            max={255}
            value={r}
            onChange={(e) => handleRgbChange("r", Number(e.target.value))}
          />
          <span className="text-[10px] text-muted-foreground shrink-0">·</span>
          <input
            className="w-10 bg-transparent font-mono text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring rounded"
            type="number"
            min={0}
            max={255}
            value={g}
            onChange={(e) => handleRgbChange("g", Number(e.target.value))}
          />
          <span className="text-[10px] text-muted-foreground shrink-0">·</span>
          <input
            className="w-10 bg-transparent font-mono text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring rounded"
            type="number"
            min={0}
            max={255}
            value={b}
            onChange={(e) => handleRgbChange("b", Number(e.target.value))}
          />
        </div>
      </div>

      {/* HSL inputs */}
      <div className="hidden md:block flex-1 min-w-0 text-center">
        <label className="text-[10px] font-medium text-muted-foreground">HSL</label>
        <div className="flex gap-0.5 items-center justify-center">
          <input
            className="w-10 bg-transparent font-mono text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring rounded"
            type="number"
            min={0}
            max={360}
            value={h}
            onChange={(e) => handleHslChange("h", Number(e.target.value))}
          />
          <span className="text-[10px] text-muted-foreground shrink-0">·</span>
          <input
            className="w-9 bg-transparent font-mono text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring rounded"
            type="number"
            min={0}
            max={100}
            value={s}
            onChange={(e) => handleHslChange("s", Number(e.target.value))}
          />
          <span className="text-[10px] text-muted-foreground shrink-0">·</span>
          <input
            className="w-9 bg-transparent font-mono text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring rounded"
            type="number"
            min={0}
            max={100}
            value={l}
            onChange={(e) => handleHslChange("l", Number(e.target.value))}
          />
        </div>
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Delete color"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
