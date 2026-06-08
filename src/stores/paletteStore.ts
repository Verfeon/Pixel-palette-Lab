import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Palette, ColorEntry, ColorKind } from "@/types/palette";
import { generateColorId, randomHex } from "@/lib/colorUtils";

interface PaletteState {
  palettes: Palette[];
  activePaletteId: string | null;

  // Palette CRUD
  createPalette: (name?: string) => string;
  deletePalette: (id: string) => void;
  renamePalette: (id: string, name: string) => void;
  setActivePalette: (id: string | null) => void;

  // Color CRUD
  addColor: (paletteId: string, hex?: string, kind?: ColorKind, mainColorId?: string | null) => void;
  addMainColor: (paletteId: string, hex?: string) => void;
  updateColor: (paletteId: string, colorId: string, hex: string) => void;
  removeColor: (paletteId: string, colorId: string) => void;
  reorderColors: (paletteId: string, colors: ColorEntry[]) => void;
  replaceShades: (paletteId: string, mainColorId: string, shadeHexes: string[]) => void;

  // Helpers
  getActivePalette: () => Palette | undefined;
  getMainColors: (paletteId: string) => ColorEntry[];
  getShadesForMain: (paletteId: string, mainColorId: string) => ColorEntry[];
}

function createDefaultPalette(name?: string): Palette {
  const now = Date.now();
  const id = `pal_${now.toString(36)}`;
  return {
    id,
    name: name ?? `Palette ${now.toString(36).slice(-4)}`,
    colors: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const usePaletteStore = create<PaletteState>()(
  persist(
    (set, get) => ({
      palettes: [],
      activePaletteId: null,

      createPalette: (name?: string) => {
        const palette = createDefaultPalette(name);
        set((state) => ({
          palettes: [...state.palettes, palette],
          activePaletteId: palette.id,
        }));
        return palette.id;
      },

      deletePalette: (id: string) => {
        set((state) => {
          const filtered = state.palettes.filter((p) => p.id !== id);
          const newActive =
            state.activePaletteId === id
              ? filtered.length > 0
                ? filtered[filtered.length - 1].id
                : null
              : state.activePaletteId;
          return { palettes: filtered, activePaletteId: newActive };
        });
      },

      renamePalette: (id: string, name: string) => {
        set((state) => ({
          palettes: state.palettes.map((p) =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p
          ),
        }));
      },

      setActivePalette: (id: string | null) => {
        set({ activePaletteId: id });
      },

      addColor: (paletteId: string, hex?: string, kind: ColorKind = "shade", mainColorId: string | null = null) => {
        set((state) => ({
          palettes: state.palettes.map((p) => {
            if (p.id !== paletteId) return p;
            if (hex && p.colors.some((c) => c.hex.toLowerCase() === hex.toLowerCase())) {
              return p;
            }
            const maxOrder = p.colors.reduce(
              (max, c) => Math.max(max, c.order),
              -1
            );
            const entry: ColorEntry = {
              id: generateColorId(),
              hex: hex ?? randomHex(),
              order: maxOrder + 1,
              kind,
              mainColorId,
            };
            return { ...p, colors: [...p.colors, entry], updatedAt: Date.now() };
          }),
        }));
      },

      addMainColor: (paletteId: string, hex?: string) => {
        get().addColor(paletteId, hex, "main", null);
      },

      updateColor: (paletteId: string, colorId: string, hex: string) => {
        set((state) => ({
          palettes: state.palettes.map((p) => {
            if (p.id !== paletteId) return p;
            return {
              ...p,
              colors: p.colors.map((c) =>
                c.id === colorId ? { ...c, hex } : c
              ),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      removeColor: (paletteId: string, colorId: string) => {
        set((state) => ({
          palettes: state.palettes.map((p) => {
            if (p.id !== paletteId) return p;
            // Also remove any shades belonging to this color
            return {
              ...p,
              colors: p.colors.filter(
                (c) => c.id !== colorId && c.mainColorId !== colorId
              ),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      reorderColors: (paletteId: string, colors: ColorEntry[]) => {
        set((state) => ({
          palettes: state.palettes.map((p) => {
            if (p.id !== paletteId) return p;
            return {
              ...p,
              colors: colors.map((c, i) => ({ ...c, order: i })),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      replaceShades: (paletteId: string, mainColorId: string, shadeHexes: string[]) => {
        set((state) => ({
          palettes: state.palettes.map((p) => {
            if (p.id !== paletteId) return p;
            // Remove existing shades for this main color
            const withoutOldShades = p.colors.filter(
              (c) => c.mainColorId !== mainColorId
            );
            // Find the main color's current order
            const mainColor = withoutOldShades.find((c) => c.id === mainColorId);
            if (!mainColor) return p;
            // Add new shades after the main color
            const newShades: ColorEntry[] = shadeHexes
              .filter(
                (hex) =>
                  !withoutOldShades.some(
                    (c) => c.hex.toLowerCase() === hex.toLowerCase()
                  )
              )
              .map((hex, i) => ({
                id: generateColorId(),
                hex,
                order: mainColor.order + 1 + i,
                kind: "shade" as const,
                mainColorId,
              }));
            return {
              ...p,
              colors: [...withoutOldShades, ...newShades].map((c, i) => ({
                ...c,
                order: i,
              })),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      getActivePalette: () => {
        const { palettes, activePaletteId } = get();
        return palettes.find((p) => p.id === activePaletteId);
      },

      getMainColors: (paletteId: string) => {
        const palette = get().palettes.find((p) => p.id === paletteId);
        return palette
          ? palette.colors.filter((c) => c.kind === "main").sort((a, b) => a.order - b.order)
          : [];
      },

      getShadesForMain: (paletteId: string, mainColorId: string) => {
        const palette = get().palettes.find((p) => p.id === paletteId);
        return palette
          ? palette.colors
              .filter((c) => c.mainColorId === mainColorId)
              .sort((a, b) => a.order - b.order)
          : [];
      },
    }),
    {
      name: "pixel-palette-lab-storage",
    }
  )
);
