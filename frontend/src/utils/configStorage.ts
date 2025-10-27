/**
 * Configuration storage utility for persisting user settings
 * Uses backend API to save/retrieve configuration from .env file
 */

export interface UserConfig {
  selectedProvider: string;
  selectedModel: string;
  apiKey: string;
}

export interface ConfigResponse {
  success: boolean;
  config?: UserConfig;
  isComplete?: boolean;
  message?: string;
  error?: {
    type: string;
    message: string;
    field?: string;
  };
}

const API_BASE_URL = 'http://localhost:54782';

/**
 * Save user configuration to .env file via backend API
 */
export async function saveConfig(config: UserConfig): Promise<ConfigResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/save-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: config.selectedProvider,
        model: config.selectedModel,
        apiKey: config.apiKey
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('[CONFIG] Configuration saved successfully');
    } else {
      console.error('[CONFIG] Failed to save configuration:', result.error?.message);
    }
    
    return result;
  } catch (error) {
    console.error('[CONFIG] Failed to save configuration:', error);
    return {
      success: false,
      error: {
        type: 'network_error',
        message: 'Failed to connect to backend server'
      }
    };
  }
}

/**
 * Load user configuration from .env file via backend API
 */
export async function loadConfig(): Promise<ConfigResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/load-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('[CONFIG] Configuration loaded successfully');
      // Convert backend format to frontend format
      if (result.config) {
        result.config = {
          selectedProvider: result.config.provider,
          selectedModel: result.config.model,
          apiKey: result.config.apiKey
        };
      }
    } else {
      console.error('[CONFIG] Failed to load configuration:', result.error?.message);
    }
    
    return result;
  } catch (error) {
    console.error('[CONFIG] Failed to load configuration:', error);
    return {
      success: false,
      error: {
        type: 'network_error',
        message: 'Failed to connect to backend server'
      }
    };
  }
}

/**
 * Clear user configuration (not implemented for .env - would require backend endpoint)
 */
export function clearConfig(): void {
  console.warn('[CONFIG] Clear configuration not implemented for .env storage');
}

/**
 * Check if configuration exists (not implemented for .env - would require backend endpoint)
 */
export function hasConfig(): boolean {
  console.warn('[CONFIG] Has configuration check not implemented for .env storage');
  return false;
}
