export type ExtractDocumentParams = {
  documentId: string;
  fileUrl: string;
  mimeType: string;
};

export type ExtractionResult = {
  text: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  error?: string;
};

export interface OCRProvider {
  /**
   * Identifies the provider for logging/analytics.
   */
  readonly name: string;

  /**
   * Extracts text and layout information from a document.
   */
  extractText(params: ExtractDocumentParams): Promise<ExtractionResult>;

  /**
   * Determines if this provider can handle the given mime type.
   */
  supportsMimeType(mimeType: string): boolean;
}

// A simple factory interface for registering providers.
export interface OCRFactory {
  register(provider: OCRProvider): void;
  getProviderForMimeType(mimeType: string): OCRProvider | undefined;
}
