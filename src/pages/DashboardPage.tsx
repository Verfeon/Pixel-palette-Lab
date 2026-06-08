import { useNavigate } from "react-router-dom";
import { usePaletteStore } from "@/stores/paletteStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Palette, ExternalLink, Trash2 } from "lucide-react";

export function DashboardPage() {
  const navigate = useNavigate();
  const palettes = usePaletteStore((s) => s.palettes);
  const createPalette = usePaletteStore((s) => s.createPalette);
  const deletePalette = usePaletteStore((s) => s.deletePalette);
  const setActivePalette = usePaletteStore((s) => s.setActivePalette);

  const handleCreate = () => {
    const id = createPalette();
    setActivePalette(id);
    navigate(`/editor/${id}`);
  };

  const handleOpen = (id: string) => {
    setActivePalette(id);
    navigate(`/editor/${id}`);
  };

  const sorted = [...palettes].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pixel Palette Lab</h1>
          <p className="text-muted-foreground">
            Create, analyze, and export color palettes for pixel art
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Palette
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Palette className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="mb-2 text-lg font-medium">No palettes yet</p>
            <p className="mb-6 text-sm text-muted-foreground">
              Create your first color palette to get started
            </p>
            <Button size="lg" onClick={handleCreate}>
              <Plus className="mr-2 h-5 w-5" />
              Create Palette
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((p) => (
            <Card key={p.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {p.colors.length} color{p.colors.length !== 1 ? "s" : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Color strip preview */}
                <div className="mb-3 flex h-8 rounded-md overflow-hidden">
                  {p.colors.length > 0 ? (
                    [...p.colors]
                      .sort((a, b) => a.order - b.order)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="flex-1"
                          style={{ backgroundColor: c.hex }}
                          title={c.hex}
                        />
                      ))
                  ) : (
                    <div className="flex-1 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpen(p.id)}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePalette(p.id)}
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
