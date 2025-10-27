export interface Template {
  id: string;
  name: string;
  description: string;
  previewPdf: string; // Path to PDF preview file
  format: 'pdf' | 'latex';
  category: string;
}

export interface TemplateSelectionState {
  selectedProvider: string;
  selectedModel: string;
  apiKey: string;
  uploadSessionId: string;
  selectedTemplate: Template | null;
}
