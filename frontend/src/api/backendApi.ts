import {
  DocumentFieldValue,
  GeneratedDocument,
  Template,
  TemplateVariable,
  UploadTemplateInput,
} from '../types';
import { adaptDocument, adaptTemplate, adaptTemplateListItem, adaptVariable } from './backendAdapters';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ApiErrorPayload {
  message?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || 'Ошибка API');
    this.status = status;
    this.errors = payload.errors;
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  headers.set('Accept', 'application/json');
  if (!isFormData && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  // ⚠️ УДАЛЕН Authorization заголовок

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return payload as T;
}

function normalizeArrayResponse<T>(payload: T[] | { data: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.data;
}

// ❌ УДАЛЕНЫ: login, register, logout, getCurrentUser, getUsers, updateUserRole

export async function getTemplates(): Promise<Template[]> {
  const response = await apiRequest<unknown[] | { data: unknown[] }>('/templates');
  return normalizeArrayResponse(response).map((item) => adaptTemplateListItem(item as never));
}

export async function uploadTemplate(input: UploadTemplateInput): Promise<Template> {
  const form = new FormData();
  form.append('name', input.name);
  form.append('category', input.category);
  form.append('format', input.format);
  form.append('file', input.file);
  input.tags.forEach((tag) => form.append('tags[]', tag));

  const createdTemplate = adaptTemplate(await apiRequest('/templates', {
    method: 'POST',
    body: form,
  }));

  try {
    return adaptTemplate(await apiRequest(`/templates/${createdTemplate.id}/variables/extract`, {
      method: 'POST',
    }));
  } catch {
    return createdTemplate;
  }
}

export async function uploadTemplateVersion(templateId: string, file: File): Promise<Template> {
  const form = new FormData();
  form.append('file', file);

  await apiRequest(`/templates/${templateId}/versions`, {
    method: 'POST',
    body: form,
  });

  await apiRequest(`/templates/${templateId}/variables/extract`, {
    method: 'POST',
  });

  const updatedTemplate = await apiRequest(`/templates/${templateId}`);
  
  return adaptTemplate(updatedTemplate as never);
}

export async function getTemplateVariables(templateId: string): Promise<TemplateVariable[]> {
  const template = await apiRequest<{ variables?: unknown[] }>(`/templates/${templateId}`);
  return (template.variables || []).map((variable) => adaptVariable(templateId, variable as never));
}

export async function saveTemplateVariables(
  templateId: string,
  variables: TemplateVariable[],
): Promise<TemplateVariable[]> {
  await Promise.all(
    variables.map((variable) => apiRequest(`/variables/${variable.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        label: variable.label,
        type: variable.type,
        required: variable.required,
        default_value: variable.defaultValue,
        hint: variable.hint,
        options: variable.options || null,
      }),
    })),
  );

  return getTemplateVariables(templateId);
}

export async function publishTemplate(templateId: string): Promise<Template> {
  return adaptTemplate(await apiRequest(`/templates/${templateId}/publish`, {
    method: 'POST',
  }));
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await apiRequest(`/templates/${templateId}`, {
    method: 'DELETE',
  });
}

export async function getDocuments(): Promise<GeneratedDocument[]> {
  const response = await apiRequest<unknown[] | { data: unknown[] }>('/documents');
  return normalizeArrayResponse(response).map((item) => adaptDocument(item as never));
}

export async function getDocument(documentId: string): Promise<GeneratedDocument> {
  return adaptDocument(await apiRequest(`/documents/${documentId}`));
}

export async function generateDocument(
  template: Template,
  values: Record<string, DocumentFieldValue>,
): Promise<GeneratedDocument> {
  const document = await apiRequest(`/templates/${template.id}/documents`, {
    method: 'POST',
    body: JSON.stringify({ values }),
  });
  return adaptDocument(document as never);
}

export async function downloadDocument(documentItem: GeneratedDocument, format?: 'docx' | 'pdf'): Promise<void> {
  // ⚠️ УДАЛЕН Authorization заголовок
  const response = await fetch(
    `${API_BASE_URL}/documents/${documentItem.id}/download${format ? `?format=${format}` : ''}`,
    {
      headers: {
        Accept: 'application/octet-stream',
        // ❌ Удалено: Authorization
      },
    },
  );

  if (!response.ok) {
    throw new ApiError(response.status, { message: 'Не удалось скачать документ' });
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = format === 'pdf'
    ? documentItem.fileName.replace(/\.[^.]+$/, '.pdf')
    : documentItem.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}