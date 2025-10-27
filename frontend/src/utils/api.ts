/**
 * API utility functions for backend communication
 */

const API_BASE_URL = 'http://localhost:54782';
const REQUEST_TIMEOUT = 30000; // 30 seconds

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    message: string;
    field?: string;
  };
}

/**
 * Generic API request function with timeout and error handling
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUT
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          type: 'api_error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        },
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            type: 'timeout_error',
            message: 'Request timed out. Please check your connection and try again.',
          },
        };
      }

      return {
        success: false,
        error: {
          type: 'network_error',
          message: `Network error: ${error.message}`,
        },
      };
    }

    return {
      success: false,
      error: {
        type: 'unknown_error',
        message: 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Upload file to backend
 */
export async function uploadFile(file: File): Promise<ApiResponse<{ sessionId: string; filename: string; size: number }>> {
  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          type: 'upload_error',
          message: `Upload failed: ${response.statusText}`,
        },
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            type: 'timeout_error',
            message: 'Upload timed out. Please try again with a smaller file.',
          },
        };
      }

      return {
        success: false,
        error: {
          type: 'network_error',
          message: `Upload failed: ${error.message}`,
        },
      };
    }

    return {
      success: false,
      error: {
        type: 'unknown_error',
        message: 'Upload failed due to an unexpected error',
      },
    };
  }
}

/**
 * Get initialization data (providers and templates) in a single request
 */
export async function getInitData(): Promise<ApiResponse<{ providers: Record<string, string[]>; templates: any[] }>> {
  return apiRequest<{ providers: Record<string, string[]>; templates: any[] }>('/api/init');
}

/**
 * Get available AI providers
 */
export async function getProviders(): Promise<ApiResponse<Record<string, string[]>>> {
  return apiRequest<Record<string, string[]>>('/api/providers');
}

/**
 * Get available templates
 */
export async function getTemplates(): Promise<ApiResponse<any[]>> {
  return apiRequest<any[]>('/api/templates');
}

/**
 * Get template preview PDF
 */
export function getTemplatePreviewUrl(templateId: string): string {
  return `${API_BASE_URL}/api/templates/${templateId}/preview`;
}

/**
 * Process resume with AI
 */
export async function processResume(params: {
  sessionId: string;
  provider: string;
  model: string;
  apiKey: string;
  templateId: string;
}): Promise<ApiResponse<{ rawLatexCode: string; processedLatexCode: string | null; message: string }>> {
  // Determine timeout based on provider
  const timeout = params.provider.toLowerCase() === 'lmstudio' ? 100000 : 70000; // 100s for LMStudio, 70s for others
  
  return apiRequest<{ rawLatexCode: string; processedLatexCode: string | null; message: string }>('/api/process', {
    method: 'POST',
    body: JSON.stringify(params),
  }, timeout);
}

/**
 * Compile LaTeX code to PDF
 */
export async function compileLatex(latexCode: string): Promise<ApiResponse<{ pdfData: string; message: string }>> {
  return apiRequest<{ pdfData: string; message: string }>('/api/compile-latex', {
    method: 'POST',
    body: JSON.stringify({ latexCode }),
  });
}

/**
 * Preprocess raw LaTeX code to fix common issues
 */
export async function preprocessLatex(latexCode: string): Promise<ApiResponse<{ processedLatex: string; message: string }>> {
  return apiRequest<{ processedLatex: string; message: string }>('/api/preprocess-latex', {
    method: 'POST',
    body: JSON.stringify({ latexCode }),
  });
}

/**
 * Parse LaTeX code into structured sections
 */
export async function parseSections(latexCode: string, templateId?: string): Promise<ApiResponse<{ parsedData: any; metadata: any }>> {
  return apiRequest<{ parsedData: any; metadata: any }>('/api/parse-sections', {
    method: 'POST',
    body: JSON.stringify({ latexCode, templateId }),
  });
}

/**
 * Filter LaTeX code based on user selections
 */
export async function filterLatex(parsedData: any, selections: any): Promise<ApiResponse<{ filteredLatex: string }>> {
  return apiRequest<{ filteredLatex: string }>('/api/filter-latex', {
    method: 'POST',
    body: JSON.stringify({ parsedData, selections }),
  });
}

/**
 * Check if backend server is running
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout for health check
    });
    return response.ok;
  } catch {
    return false;
  }
}
