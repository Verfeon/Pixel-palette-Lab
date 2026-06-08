import { hexToRgb, hexToHsl, formatRgb, formatHsl } from "@/lib/colorUtils";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  hex: string;
  onDelete: () => void;
  onChange: (hex: string) => void;
  onDragStart?: () => void;
  isDragging?: boolean;
}

export function ColorSwatch({ hex, onDelete, onChange, onDragStart, isDragging }: ColorSwatchProps) {
  const rgb = hexToRgb(hex);
  const hsl = hexToHsl(hex);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-md",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Drag handle */}
      {onDragStart && (
        <button
          className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
          onMouseDown={onDragStart}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Color preview */}
      <div
        className="h-10 w-10 shrink-0 rounded-md border"
        style={{ backgroundColor: hex }}
        title={hex}
      />

      {/* Hex input */}
      <div className="flex-1 min-w-0">
        <label className="text-xs font-medium text-muted-foreground">HEX</label>
        <input
          className="w-full bg-transparent font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring rounded px-1"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          maxLength={7}
        />
      </div>

      {/* RGB display */}
      <div className="hidden sm:block min-w-0 flex-1">
        <label className="text-xs font-medium text-muted-foreground">RGB</label>
        <p className="font-mono text-sm text-muted-foreground truncate">
          {rgb ? formatRgb(rgb) : "—"}
        </p>
      </div>

      {/* HSL display */}
      <div className="hidden md:block min-w-0 flex-1">
        <label className="text-xs font-medium text-muted-foreground">HSL</label>
        <p className="font-mono text-sm text-muted-foreground truncate">
          {hsl ? formatHsl(hsl) : "—"}
        </p>
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
