import { z } from "zod";
import { FormattingPreset } from '../types/formatting';
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000') + '/api';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Template {
  id: number;
  name: string;
  content: string;
  sections: Array<{
    title: string;
    prompt: string;
    headingLevel: number;
  }>;
  createdAt: string;
}

export interface Report {
  id: number;
  title: string;
  template_id?: number;
  format: 'pdf' | 'doc' | 'docx';
  status: 'pending' | 'generating' | 'completed' | 'error';
  file_path: string;
  created_at: string;
  sections?: Array<{
    title: string;
    prompt: string;
    heading_level: number;
  }>;
}
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

// Validation schemas
const userSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6)
});

const templateSchema = z.object({
  name: z.string().min(1),
  content: z.string()
});

const reportSchema = z.object({
  title: z.string(),
  templateId: z.number().optional(),
  format: z.enum(['pdf', 'doc', 'docx'])
});

// Error handling
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': token }),
    ...options.headers,
  });

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new ApiError(401, "Unauthorized");
    }

    return handleResponse(response);
  } catch (error) {
    console.error('Request error:', error);
    throw error;
  }
}

// Base API functions
async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(response.status, error.message);
  }
  return response.json();
}

async function get(path: string) {
  return fetchWithAuth(path);
}

async function post(path: string, data?: any) {
  return fetchWithAuth(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

async function put(path: string, data: any) {
  return fetchWithAuth(path, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async function del(path: string) {
  return fetchWithAuth(path, {
    method: 'DELETE',
  });
}

// Auth endpoints
export const auth = {
  login: async (credentials: { username: string; password: string }) => {
    try {
      const validatedCredentials = loginSchema.parse(credentials);
      const response = await post('/users/login', validatedCredentials);
      
      if (response && response.access_token) {
        const token = `${response.token_type} ${response.access_token}`;
        localStorage.setItem('token', token);
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: (data: { username: string; email: string; password: string }) => 
    post('/users/register', data),

  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new ApiError(401, "No authentication token found");
    }
    return get('/users/me');
  },

  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  }
};

// Templates endpoints
export const templates = {
  create: (data: { name: string; content: string }) =>
    post('/templates/create_template', data),
  getAll: () => get('/templates'),
  getById: (id: number) => get(`/templates/${id}`),
  update: (id: number, data: { name?: string; content?: string }) =>
    put(`/templates/${id}`, data),
  delete: (id: number) => del(`/templates/${id}`),
};

// Reports endpoints
export const reports = {
  generate: async (data: {
    title: string;
    template_id?: number | null;
    format: string;
    sections: Array<{
      title: string;
      prompt: string;
      heading_level: number;
    }>;
    formatting_preset_id?: number | null; 

  }) => {
    return post('/generate-report', data);
  },
  
  getById: (reportId: number) => get(`/reports/${reportId}`),
  getAll: () => get('/reports'),
  
  download: async (reportId: number, filename: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/reports/download/${filename}`, {
      headers: {
        ...(token && { 'Authorization': token }),
      },
    });
    if (!response.ok) {
      throw new Error('Failed to download file');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  
  delete: (reportId: number) => del(`/reports/${reportId}`),
};


// GigaChat endpoints
export const gigachat = {
  generateText: (prompt: string) =>
    post('/gigachat/generate-text', { prompt }),

  generateTextWithParams: (
    prompt: string,
    params?: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      n?: number;
    }
  ) => post('/gigachat/generate-text-with-params', { prompt, ...params }),

  generateLongText: (
    prompt: string,
    params?: {
      chunk_size?: number;
    }
  ) => post('/gigachat/generate-long-text', { prompt, ...params }),
};


export const formattingApi = {
  getAllPresets: () => get('/formatting/presets'),
  
  getPresetById: (id: number) => get(`/formatting/presets/${id}`),
  
  createPreset: (preset: FormattingPreset) => post('/formatting/presets', preset),
  
  updatePreset: (id: number, preset: FormattingPreset) => put(`/formatting/presets/${id}`, preset),
  
  deletePreset: (id: number) => del(`/formatting/presets/${id}`),
  
  getDefaultPresets: () => get('/formatting/presets/defaults'),
  
  setDefaultPreset: (id: number) => post(`/formatting/presets/${id}/default`)
};