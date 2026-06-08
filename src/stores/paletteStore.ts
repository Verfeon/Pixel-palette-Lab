import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Palette, ColorEntry } from "@/types/palette";
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
  addColor: (paletteId: string, hex?: string) => void;
  updateColor: (paletteId: string, colorId: string, hex: string) => void;
  removeColor: (paletteId: string, colorId: string) => void;
  reorderColors: (paletteId: string, colors: ColorEntry[]) => void;

  // Helpers
  getActivePalette: () => Palette | undefined;
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

      addColor: (paletteId: string, hex?: string) => {
        set((state) => ({
          palettes: state.palettes.map((p) => {
            if (p.id !== paletteId) return p;
            // Skip if this hex already exists in the palette
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
            };
            return { ...p, colors: [...p.colors, entry], updatedAt: Date.now() };
          }),
        }));
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
            return {
              ...p,
              colors: p.colors.filter((c) => c.id !== colorId),
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

      getActivePalette: () => {
        const { palettes, activePaletteId } = get();
        return palettes.find((p) => p.id === activePaletteId);
      },
    }),
    {
      name: "pixel-palette-lab-storage",
    }
  )
);
