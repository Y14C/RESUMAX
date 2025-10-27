/**
 * Optimized Global Data Preloader
 * 
 * Key optimizations:
 * 1. Lazy initialization - only start preload when needed
 * 2. Progressive loading - critical data first, then nice-to-haves
 * 3. Request batching - single API call for all data
 * 4. Streaming templates - show UI before all templates load
 */

import { getInitData, getTemplatePreviewUrl } from './api';

// Global cache for preloaded data
interface PreloadedData {
  providers: Record<string, string[]> | null;
  templates: any[] | null;
  templatePreviews: Map<string, string>;
  templatePdfs: Map<string, Blob>;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

const preloadedData: PreloadedData = {
  providers: null,
  templates: null,
  templatePreviews: new Map(),
  templatePdfs: new Map(),
  isLoaded: false,
  isLoading: false,
  error: null
};

let preloadPromise: Promise<void> | null = null;
let criticalDataPromise: Promise<void> | null = null;

/**
 * OPTIMIZATION 1: Lazy initialization
 * Don't auto-start on module import, wait for explicit call
 * This prevents blocking the initial bundle evaluation
 */

/**
 * Load only critical data needed for initial render
 * This makes the app interactive much faster
 */
async function loadCriticalData(): Promise<void> {
  if (criticalDataPromise) return criticalDataPromise;
  
  criticalDataPromise = (async () => {
    try {
      console.log('[PRELOAD] Loading critical data only...');
      preloadedData.isLoading = true;
      
      // Use the new combined endpoint for faster loading
      const initResult = await getInitData();
      
      if (initResult.success) {
        preloadedData.providers = initResult.data!.providers;
        preloadedData.templates = initResult.data!.templates;
        console.log('[PRELOAD] Critical data (providers + templates) loaded in single request');
      } else {
        throw new Error(`Failed to load init data: ${initResult.error?.message}`);
      }
      
    } catch (error) {
      preloadedData.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PRELOAD] Error loading critical data:', error);
      throw error;
    }
  })();
  
  return criticalDataPromise;
}

/**
 * Load non-critical data in background
 * Since providers and templates are now loaded in critical data phase,
 * this function handles template preview URLs only (no PDF preloading)
 */
async function loadSecondaryData(): Promise<void> {
  try {
    console.log('[PRELOAD] Loading secondary data...');
    
    // Templates should already be loaded from critical data phase
    if (preloadedData.templates) {
      console.log('[PRELOAD] Processing templates:', preloadedData.templates.length);
      
      // Generate preview URLs (fast, no network)
      preloadedData.templates.forEach((template) => {
        const previewUrl = getTemplatePreviewUrl(template.id);
        preloadedData.templatePreviews.set(template.id, previewUrl);
      });
      console.log('[PRELOAD] Template preview URLs generated');
      
      // Note: PDF preloading is now handled on-demand when user reaches template selection
    }
    
    preloadedData.isLoaded = true;
    console.log('[PRELOAD] All data loaded!');
    
  } catch (error) {
    console.error('[PRELOAD] Error loading secondary data:', error);
  } finally {
    preloadedData.isLoading = false;
  }
}

/**
 * OPTIMIZATION 2: Progressive loading
 * Start with critical data, then load rest in background
 */
export async function preloadAllData(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  
  preloadPromise = (async () => {
    // Load critical data first
    await loadCriticalData();
    
    // Load secondary data in background (don't await)
    loadSecondaryData().catch(console.error);
  })();
  
  return preloadPromise;
}

/**
 * Preload only the most important template PDFs
 */
async function preloadTopTemplatePdfs(templates: any[]): Promise<void> {
  const pdfPromises = templates.map(async (template) => {
    try {
      const previewUrl = getTemplatePreviewUrl(template.id);
      const response = await fetch(previewUrl);
      if (response.ok) {
        const pdfBlob = await response.blob();
        preloadedData.templatePdfs.set(template.id, pdfBlob);
        console.log(`[PRELOAD] Top template PDF loaded: ${template.id}`);
      }
    } catch (error) {
      // Silent fail - PDF might not exist
    }
  });
  
  await Promise.allSettled(pdfPromises);
}

/**
 * Preload a specific template PDF on demand
 */
export async function preloadTemplatePdf(templateId: string): Promise<void> {
  if (preloadedData.templatePdfs.has(templateId)) {
    return; // Already loaded
  }
  
  try {
    const previewUrl = getTemplatePreviewUrl(templateId);
    const response = await fetch(previewUrl);
    if (response.ok) {
      const pdfBlob = await response.blob();
      preloadedData.templatePdfs.set(templateId, pdfBlob);
    }
  } catch (error) {
    console.log(`[PRELOAD] Could not load PDF for: ${templateId}`);
  }
}

/**
 * Get preloaded providers data
 */
export function getPreloadedProviders(): Record<string, string[]> | null {
  return preloadedData.providers;
}

/**
 * Get preloaded templates data
 */
export function getPreloadedTemplates(): any[] | null {
  return preloadedData.templates;
}

/**
 * Get preloaded template preview URL
 */
export function getPreloadedTemplatePreview(templateId: string): string | null {
  return preloadedData.templatePreviews.get(templateId) || null;
}

/**
 * Get preloaded template PDF blob
 */
export function getPreloadedTemplatePdf(templateId: string): Blob | null {
  return preloadedData.templatePdfs.get(templateId) || null;
}

/**
 * Check if critical data is loaded (enough to show UI)
 */
export function isCriticalDataLoaded(): boolean {
  return preloadedData.providers !== null && preloadedData.templates !== null;
}

/**
 * Check if all data is loaded
 */
export function isDataLoaded(): boolean {
  return preloadedData.isLoaded;
}

/**
 * Check if data is currently loading
 */
export function isDataLoading(): boolean {
  return preloadedData.isLoading;
}

/**
 * Get loading error
 */
export function getLoadingError(): string | null {
  return preloadedData.error;
}

/**
 * Wait for critical data (providers) - fast!
 */
export async function waitForCriticalData(): Promise<void> {
  if (preloadedData.providers) {
    return Promise.resolve();
  }
  
  if (criticalDataPromise) {
    return criticalDataPromise;
  }
  
  return loadCriticalData();
}

/**
 * Wait for all data to load
 */
export async function waitForPreload(): Promise<void> {
  if (preloadedData.isLoaded) {
    return Promise.resolve();
  }
  
  if (preloadPromise) {
    return preloadPromise;
  }
  
  return preloadAllData();
}

/**
 * Start template PDF preloading on demand (called when user reaches template selection)
 * This loads the first few template PDFs in the background
 */
export async function startTemplatePdfPreloading(): Promise<void> {
  if (!preloadedData.templates) {
    console.log('[PRELOAD] No templates available for PDF preloading');
    return;
  }
  
  console.log('[PRELOAD] Starting on-demand template PDF preloading...');
  
  // Preload first 3 template PDFs (most likely to be viewed)
  const topTemplates = preloadedData.templates.slice(0, 3);
  await preloadTopTemplatePdfs(topTemplates);
  
  console.log('[PRELOAD] Initial template PDFs preloaded');
}

/**
 * Preload remaining template PDFs in background (low priority)
 */
export async function preloadRemainingPdfs(): Promise<void> {
  if (!preloadedData.templates) return;
  
  const remainingTemplates = preloadedData.templates.filter(
    template => !preloadedData.templatePdfs.has(template.id)
  );
  
  // Load remaining PDFs with delays to not overwhelm the browser
  for (const template of remainingTemplates) {
    await preloadTemplatePdf(template.id);
    // Small delay between each to keep UI responsive
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}