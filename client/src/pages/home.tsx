import { useState } from "react";
import AppHeader from "@/components/app-header";
import ApiKeyConfig from "@/components/api-key-config";
import EnhancedDocumentInput from "@/components/enhanced-document-input";
import DocumentTypeSelector from "@/components/document-type-selector";
import GenerationControls from "@/components/generation-controls";
import HistorySidebar from "@/components/history-sidebar";
import PreviewModal from "@/components/preview-modal";
import TemplateSelector, { type Template } from "@/components/template-selector";
import type { DocumentType } from "@shared/schema";

export default function Home() {
  const [demand, setDemand] = useState("");
  const [selectedType, setSelectedType] = useState<DocumentType | "">("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const handleUseTemplate = () => {
    setShowTemplateSelector(true);
  };

  const handleSelectTemplate = (template: Template) => {
    // Apply template content to demand
    setDemand(template.content);
    setShowTemplateSelector(false);
  };

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <ApiKeyConfig />
            
            <EnhancedDocumentInput 
              demand={demand}
              setDemand={setDemand}
              title={title}
              setTitle={setTitle}
              onUseTemplate={handleUseTemplate}
              selectedType={selectedType}
              tags={tags}
              setTags={setTags}
            />
            
            <DocumentTypeSelector 
              selectedType={selectedType}
              onTypeSelect={setSelectedType}
            />
            
            <GenerationControls 
              demand={demand}
              selectedType={selectedType}
              title={title}
              tags={tags}
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
      </main>

      <PreviewModal 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        content={previewContent}
        demand={demand}
        selectedType={selectedType}
        title={title}
        tags={tags}
      />

      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleSelectTemplate}
        documentType={selectedType}
      />
    </div>
  );
}
