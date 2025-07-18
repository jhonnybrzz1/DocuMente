import { useState } from "react";
import AppHeader from "@/components/app-header";
import ApiKeyConfig from "@/components/api-key-config";
import DocumentInput from "@/components/document-input";
import DocumentTypeSelector from "@/components/document-type-selector";
import GenerationControls from "@/components/generation-controls";
import HistorySidebar from "@/components/history-sidebar";
import PreviewModal from "@/components/preview-modal";
import type { DocumentType } from "@shared/schema";

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
          </div>
          
          <div className="lg:col-span-1">
            <HistorySidebar />
          </div>
        </div>
      </div>

      <PreviewModal 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        content={previewContent}
        demand={demand}
        selectedType={selectedType}
        title={title}
      />
    </div>
  );
}
