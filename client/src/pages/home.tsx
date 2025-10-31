
import { useState, lazy, Suspense } from "react";
import AppHeader from "@/components/app-header";
import type { DocumentType } from "@shared/schema";

// Lazy load components that are likely large
const ApiKeyConfig = lazy(() => import("@/components/api-key-config"));
const DocumentInput = lazy(() => import("@/components/document-input"));
const DocumentTypeSelector = lazy(() => import("@/components/document-type-selector"));
const GenerationControls = lazy(() => import("@/components/generation-controls"));
const HistorySidebar = lazy(() => import("@/components/history-sidebar"));
const PreviewModal = lazy(() => import("@/components/preview-modal"));

export default function Home() {
  const [demand, setDemand] = useState("");
  const [selectedType, setSelectedType] = useState<DocumentType | "">("");
  const [title, setTitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Suspense fallback={<div>Loading...</div>}>
              <ApiKeyConfig />

              <DocumentInput
                demand={demand}
                setDemand={setDemand}
                title={title}
                setTitle={setTitle}
              />

              <DocumentTypeSelector
                selectedType={selectedType}
                onTypeSelect={setSelectedType}
              />

              <GenerationControls
                demand={demand}
                selectedType={selectedType}
                title={title}
                onPreview={(content) => {
                  setPreviewContent(content);
                  setShowPreview(true);
                }}
              />
            </Suspense>
          </div>

          <div className="lg:col-span-1">
            <Suspense fallback={<div>Loading...</div>}>
              <HistorySidebar />
            </Suspense>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {showPreview && (
          <PreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            content={previewContent}
            demand={demand}
            selectedType={selectedType}
            title={title}
          />
        )}
      </Suspense>
    </div>
  );
}
