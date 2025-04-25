import { z } from "zod";
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
  templateId?: number;
  format: 'pdf' | 'doc' | 'docx';
  createdAt: string;
  filePath: string;
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

// Base API functions
async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(response.status, error.message);
  }
  return response.json();
}

async function get(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
  });
  return handleResponse(response);
}

async function post(path: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return handleResponse(response);
}

async function put(path: string, data: any) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

async function del(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(response);
}

// Auth endpoints
export const auth = {
  login: (credentials: { username: string; password: string }) => 
    post('/users/login', credentials),
  register: (data: { username: string; email: string; password: string }) => 
    post('/users/register', data),
  getCurrentUser: () => get('/users/me'),
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
  generate: (templateId: number, data: any) =>
    post('/generate-report', { template_id: templateId, data }),
  getAll: () => get('/reports'),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE_URL}/upload-data`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(handleResponse);
  },
  delete: async (reportId: number) => {
    // Implementation for deleting a report
    const response = await fetch(`/api/reports/${reportId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete the report');
    }
  }
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