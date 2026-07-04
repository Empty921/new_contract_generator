export type TemplateStatus = 'draft' | 'published' | 'archived';
export type TemplateFormat = 'docx' | 'pdf';

// ❌ УДАЛЕНЫ: UserRole, AuthCredentials, RegisterInput
// ❌ УДАЛЕН интерфейс User (если он был, его нет в этом файле — хорошо)

export type VariableType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'boolean'
  | 'table';

export type TableRowValue = Record<string, string>;
export type DocumentFieldValue = string | boolean | TableRowValue[];

export interface TableOptions {
  columns: string[];
}

export interface Template {
  id: string;
  name: string;
  category: string;
  tags: string[];
  format: TemplateFormat;
  status: TemplateStatus;
  version: number;
  createdAt: string;
  variableCount: number;
}

export interface TemplateVariable {
  id: string;
  templateId: string;
  name: string;
  label: string;
  type: VariableType;
  required: boolean;
  defaultValue: string;
  hint: string;
  options?: string[] | TableOptions;
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  templateName: string;
  // author: string; // ⚠️ УЖЕ ЗАКОММЕНТИРОВАНО (оставляем так)
  createdAt: string;
  format: TemplateFormat | 'pdf';
  fileName: string;
  values: Record<string, DocumentFieldValue>;
}

export interface UploadTemplateInput {
  name: string;
  category: string;
  tags: string[];
  format: TemplateFormat;
  file: File;
}

// ❌ УДАЛЕНЫ:
// export interface AuthCredentials { ... }
// export interface RegisterInput { ... }