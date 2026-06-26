import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";
import { EditorPage } from "@/pages/EditorPage";
import { AnalyzePage } from "@/pages/AnalyzePage";
import { PreviewPage } from "@/pages/PreviewPage";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/editor/:id" element={<EditorPage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/preview" element={<PreviewPage />} />
          </Routes>
        </div>
      </TooltipProvider>
    </BrowserRouter>
  );
}
