import { FormEvent, useEffect, useMemo, useState } from 'react';
import footerImage from './bg-image.jpg';
import {
  ApiError,
  deleteTemplate,
  downloadDocument,
  generateDocument,
  getDocument,
  getDocuments,
  getTemplateVariables,
  getTemplates,
  saveTemplateVariables,
  uploadTemplate,
  publishTemplate,   
  uploadTemplateVersion,
} from './api/backendApi';
import {
  DocumentFieldValue,
  GeneratedDocument,
  TableRowValue,
  Template,
  TemplateVariable,
  VariableType,
} from './types';
import { formatDate, formatDateTime, formatLabels, parseTags, statusLabels, variableTypeLabels } from './utils';

type Page = 'home' | 'templates' | 'upload' | 'variables' | 'create' | 'history';

const emptyFilters = {
  search: '',
  category: 'all',
  status: 'all',
};

// ===== HOME PAGE COMPONENT =====
function HomePage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <div className="home-page">
      {/* ФОН НА ВСЮ СТРАНИЦУ */}
      <div className="home-bg"></div>
      
      <div className="home-hero">
        <span className="hero-icon"></span>
        <h1>Шаблонизатор договоров</h1>
        <p>Создавайте, управляйте и генерируйте документы быстро и просто</p>
      </div>
      
      <div className="home-grid">
        <button className="home-card" onClick={() => onNavigate('templates')}>
          <span className="home-icon">📋</span>
          <h2>Шаблоны</h2>
          <p>Просмотр и управление шаблонами</p>
        </button>
        
        <button className="home-card" onClick={() => onNavigate('upload')}>
          <span className="home-icon">📤</span>
          <h2>Загрузка</h2>
          <p>Загрузить новый шаблон</p>
        </button>
        
        <button className="home-card" onClick={() => onNavigate('create')}>
          <span className="home-icon">✏️</span>
          <h2>Создать документ</h2>
          <p>Сгенерировать новый документ</p>
        </button>
        
        <button className="home-card" onClick={() => onNavigate('history')}>
          <span className="home-icon">📜</span>
          <h2>История</h2>
          <p>Просмотр созданных документов</p>
        </button>
      </div>

      {/* ===== КАРТИНКА ВНИЗУ ПО ЦЕНТРУ ===== */}
      <div className="home-footer-image">
        <img src={footerImage} alt="footer decoration" />
      </div>
    </div>
  );
}

export function App() {
  const [page, setPage] = useState<Page>('home');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [prefillValues, setPrefillValues] = useState<Record<string, DocumentFieldValue> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || templates[0];

  const reload = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [nextTemplates, nextDocuments] = await Promise.all([getTemplates(), getDocuments()]);
      setTemplates(nextTemplates);
      setDocuments(nextDocuments);
      setSelectedTemplateId((current) => (
        nextTemplates.some((template) => template.id === current) ? current : nextTemplates[0]?.id || ''
      ));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="app-shell">
      {/* ===== НАВБАР СВЕРХУ — ПОЛУПРОЗРАЧНЫЕ КНОПКИ ===== */}
      <nav className="top-nav">

        <div className="top-nav-links">
          <button 
            className={page === 'home' ? 'active nav-link' : 'nav-link'} 
            onClick={() => setPage('home')}
          >
            <span className="nav-icon"></span> Главная
          </button>
          <button 
            className={page === 'templates' ? 'active nav-link' : 'nav-link'} 
            onClick={() => setPage('templates')}
          >
            <span className="nav-icon"></span> Шаблоны
          </button>
          <button 
            className={page === 'upload' ? 'active nav-link' : 'nav-link'} 
            onClick={() => setPage('upload')}
          >
            <span className="nav-icon"></span> Загрузка
          </button>
          <button 
            className={page === 'create' ? 'active nav-link' : 'nav-link'} 
            onClick={() => {
              setPrefillValues(null);
              setPage('create');
            }}
          >
            <span className="nav-icon"></span> Создание
          </button>
          <button 
            className={page === 'history' ? 'active nav-link' : 'nav-link'} 
            onClick={() => setPage('history')}
          >
            <span className="nav-icon"></span> История
          </button>
        </div>
      </nav>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{getPageTitle(page)}</h1>
          </div>
          <div className="topbar-actions">
            {/* Селект уже в навбаре, но можно оставить и здесь если нужно */}
          </div>
        </header>

        {notice && <div className="notice">{notice}</div>}
        {error && <div className="error-banner">{error}</div>}

        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {page === 'home' && (
              <HomePage onNavigate={setPage} />
            )}
            {page === 'templates' && (
              <TemplatesPage
                templates={templates}
                onConfigure={(id) => {
                  setSelectedTemplateId(id);
                  setPrefillValues(null);
                  setPage('variables');
                }}
                onCreate={(id) => {
                  setSelectedTemplateId(id);
                  setPrefillValues(null);
                  setPage('create');
                }}
                onDelete={async (id) => {
                  await deleteTemplate(id);
                  setPrefillValues(null);
                  await reload();
                  showNotice('Шаблон удалён');
                }}
              />
            )}
            {page === 'upload' && (
              <UploadPage
                onUploaded={async (template) => {
                  await reload();
                  setSelectedTemplateId(template.id);
                  setPage('variables');
                  showNotice('Шаблон добавлен, переменные распознаны');
                }}
              />
            )}
            {page === 'variables' && (
              selectedTemplate ? (
                <VariablesPage
                  template={selectedTemplate}
                  onSaved={async (message = 'Настройки переменных сохранены') => {
                    showNotice(message);
                    await reload();
                  }}
                  onVersionUploaded={async () => {
                    await reload();
                  }}
                />
              ) : (
                <section className="content-stack">
                  <EmptyState text="Сначала загрузите шаблон, чтобы настроить переменные" />
                </section>
              )
            )}
            {page === 'create' && (
              selectedTemplate ? (
                <CreateDocumentPage
                  template={selectedTemplate}
                  initialValues={prefillValues}
                  onGenerated={async () => {
                    setPrefillValues(null);
                    await reload();
                    showNotice('Документ добавлен в историю');
                  }}
                />
              ) : (
                <section className="content-stack">
                  <EmptyState text="Нет доступных шаблонов для создания документа" />
                </section>
              )
            )}
            {page === 'history' && (
              <HistoryPage
                documents={documents}
                onRepeat={async (document) => {
                  const detailedDocument = await getDocument(document.id);
                  setSelectedTemplateId(detailedDocument.templateId || document.templateId);
                  setPrefillValues(detailedDocument.values);
                  setPage('create');
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function getPageTitle(page: Page) {
  const titles: Record<Page, string> = {
    home: 'Главная',
    templates: 'Каталог шаблонов',
    upload: 'Загрузка шаблона',
    variables: 'Настройка переменных',
    create: 'Создание документа',
    history: 'История документов',
  };
  return titles[page];
}

function LoadingState() {
  return (
    <section className="state">
      <div className="spinner" />
      <p>Загрузка данных...</p>
    </section>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const firstFieldError = error.errors ? Object.values(error.errors)[0]?.[0] : '';
    return firstFieldError || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Неизвестная ошибка';
}

function TemplatesPage({
  templates,
  onConfigure,
  onCreate,
  onDelete,
}: {
  templates: Template[];
  onConfigure: (id: string) => void;
  onCreate: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [filters, setFilters] = useState(emptyFilters);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const categories = Array.from(new Set(templates.map((template) => template.category)));

  const filteredTemplates = templates.filter((template) => {
    const bySearch = template.name.toLowerCase().includes(filters.search.toLowerCase());
    const byCategory = filters.category === 'all' || template.category === filters.category;
    const byStatus = filters.status === 'all' || template.status === filters.status;
    return bySearch && byCategory && byStatus;
  });

  return (
    <section className="content-stack">
      <div className="toolbar">
        <input
          placeholder="Поиск ☺"
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
      </div>
      {error && <div className="error-banner">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Формат</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.map((template) => (
              <tr key={template.id}>
                <td>
                  <strong>{template.name}</strong>
                  <span className="muted">{template.tags.join(', ')}</span>
                </td>
                <td>{template.category}</td>
                <td><span className="pill">{formatLabels[template.format]}</span></td>
                <td><span className={`status ${template.status}`}>{statusLabels[template.status]}</span></td>
                <td className="actions">
                  <button className="secondary" onClick={() => onConfigure(template.id)}>Настроить</button>
                  <button disabled={template.status !== 'published'} onClick={() => onCreate(template.id)}>Создать</button>
                  <button
                    className="danger"
                    disabled={deletingId === template.id}
                    onClick={async () => {
                      const confirmed = window.confirm(
                        `Удалить шаблон "${template.name}"? Связанные версии и документы тоже будут удалены.`,
                      );
                      if (!confirmed) return;

                      setDeletingId(template.id);
                      setError('');
                      try {
                        await onDelete(template.id);
                      } catch (requestError) {
                        setError(getErrorMessage(requestError));
                      } finally {
                        setDeletingId('');
                      }
                    }}
                  >
                    {deletingId === template.id ? 'Удаление...' : 'Удалить'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTemplates.length === 0 && <EmptyState text="Шаблоны по таким фильтрам не найдены" />}
    </section>
  );
}

function UploadPage({ onUploaded }: { onUploaded: (template: Template) => void | Promise<void> }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Договоры');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const canSubmit = name.trim() && file;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !file) return;
    setIsSubmitting(true);
    setError('');
    try {
      const format = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx';
      const template = await uploadTemplate({ name, category, tags: parseTags(tags), format, file });
      await onUploaded(template);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-column" onSubmit={submit}>
      <label>
        Название шаблона
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Например: Договор аренды" />
      </label>
      <label>
        Категория
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option>Договоры</option>
          <option>Акты</option>
          <option>Соглашения</option>
        </select>
      </label>
      <label>
        Теги
        <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="через запятую" />
      </label>
      <label className="file-input">
        Файл шаблона
        <input
          type="file"
          accept=".docx,.pdf"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        <span>{file?.name || 'Выберите DOCX или PDF'}</span>
      </label>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-actions">
        <button disabled={!canSubmit || isSubmitting}>{isSubmitting ? 'Загрузка...' : 'Загрузить шаблон'}</button>
      </div>
    </form>
  );
}

function VariablesPage({ 
  template, 
  onSaved,
  onVersionUploaded
}: { 
  template: Template; 
  onSaved: (message?: string) => void | Promise<void>;
  onVersionUploaded?: () => void | Promise<void>;
}) {
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [error, setError] = useState('');

  // 🔥 Храним строку для опций в отдельном состоянии
  const [optionsStrings, setOptionsStrings] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsLoading(true);
    setError('');
    getTemplateVariables(template.id)
      .then((items) => {
        setVariables(items);
        // 🔥 Инициализируем строки опций из существующих данных
        const initialOptions: Record<string, string> = {};
        items.forEach((v) => {
          if (v.type === 'select' && Array.isArray(v.options)) {
            initialOptions[v.id] = v.options.join(', ');
          }
        });
        setOptionsStrings(initialOptions);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setIsLoading(false));
  }, [template.id]);

  const updateVariable = (id: string, patch: Partial<TemplateVariable>) => {
    setVariables((current) => current.map((variable) => (variable.id === id ? { ...variable, ...patch } : variable)));
  };

  // 🔥 Обновление опций
  const updateOptions = (id: string, value: string) => {
    setOptionsStrings((prev) => ({ ...prev, [id]: value }));
    // Разбиваем строку на массив и сохраняем в переменную
    const options = value.split(',').map(s => s.trim()).filter(Boolean);
    updateVariable(id, { options: options.length > 0 ? options : undefined });
  };

  const save = async () => {
    setIsSaving(true);
    setError('');
    try {
      await saveTemplateVariables(template.id, variables);
      await onSaved();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const publish = async () => {
    setIsPublishing(true);
    setError('');
    try {
      await publishTemplate(template.id);
      await onSaved('Шаблон опубликован');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsPublishing(false);
    }
  };

  const uploadVersion = async () => {
    if (!versionFile) return;
    setIsUploadingVersion(true);
    setError('');
    try {
      await uploadTemplateVersion(template.id, versionFile);
      const items = await getTemplateVariables(template.id);
      setVariables(items);
      setVersionFile(null);
      
      if (onVersionUploaded) {
        await onVersionUploaded();
      }
      
      await onSaved('Новая версия шаблона загружена, переменные обновлены');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsUploadingVersion(false);
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <section className="content-stack">
      <div className="summary-band">
        <div>
          <span className="muted">Шаблон</span>
          <strong>{template.name}</strong>
        </div>
        <div>
          <span className="muted">Найдено переменных</span>
          <strong>{variables.length}</strong>
        </div>
      </div>
      <div className="version-upload">
        <label className="file-input">
          Новая версия шаблона
          <input
            type="file"
            accept=".docx,.pdf"
            onChange={(event) => setVersionFile(event.target.files?.[0] || null)}
          />
          <span>{versionFile?.name || 'Выберите DOCX или PDF'}</span>
        </label>
        <button className="secondary" onClick={uploadVersion} disabled={!versionFile || isUploadingVersion}>
          {isUploadingVersion ? 'Загрузка...' : 'Загрузить версию'}
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}

      <div className="variable-list">
        {variables.map((variable) => (
          <article className="variable-row" key={variable.id}>
            <div className="variable-code">{`{{${variable.name}}}`}</div>
            
            <label>
              Подпись
              <input value={variable.label} onChange={(event) => updateVariable(variable.id, { label: event.target.value })} />
            </label>
            
            <label>
              Тип
              <select
                value={variable.type}
                onChange={(event) => updateVariable(variable.id, { type: event.target.value as VariableType })}
              >
                {Object.entries(variableTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            {/* 🔥 ПОЛЕ ДЛЯ ОПЦИЙ С ОТДЕЛЬНЫМ СОСТОЯНИЕМ */}
            {variable.type === 'select' && (
              <label className="full-width">
                Опции (через запятую)
                <input
                  value={optionsStrings[variable.id] || ''}
                  onChange={(event) => updateOptions(variable.id, event.target.value)}
                  placeholder="Красный, Синий, Зеленый"
                />
                <span className="hint">Введите значения через запятую</span>
              </label>
            )}

            <label>
              Значение по умолчанию
              <input
                value={variable.defaultValue}
                onChange={(event) => updateVariable(variable.id, { defaultValue: event.target.value })}
              />
            </label>

            <label>
              Подсказка
              <input value={variable.hint} onChange={(event) => updateVariable(variable.id, { hint: event.target.value })} />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={variable.required}
                onChange={(event) => updateVariable(variable.id, { required: event.target.checked })}
              />
              Обязательное
            </label>
          </article>
        ))}
      </div>

      <div className="form-actions">
        <button onClick={save} disabled={isSaving}>{isSaving ? 'Сохранение...' : 'Сохранить настройки'}</button>
        <button className="secondary" onClick={publish} disabled={isPublishing || template.status === 'published'}>
          {template.status === 'published' ? 'Уже опубликован' : isPublishing ? 'Публикация...' : 'Опубликовать'}
        </button>
      </div>
    </section>
  );
}
function CreateDocumentPage({
  template,
  initialValues,
  onGenerated,
}: {
  template: Template;
  initialValues: Record<string, DocumentFieldValue> | null;
  onGenerated: () => void | Promise<void>;
}) {
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [values, setValues] = useState<Record<string, DocumentFieldValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [format, setFormat] = useState<'docx' | 'pdf'>(template.format);
  const [preview, setPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setApiError('');
    setFormat(template.format);
    setPreview(false);

    if (template.status !== 'published') {
      setVariables([]);
      setValues({});
      setErrors({});
      return;
    }

    getTemplateVariables(template.id)
      .then((items) => {
        setVariables(items);
        const defaultValues = Object.fromEntries(
          items.map((item) => [item.name, getInitialFieldValue(item)]),
        );
        setValues({ ...defaultValues, ...(initialValues || {}) });
        setErrors({});
      })
      .catch((requestError) => setApiError(getErrorMessage(requestError)));
  }, [template.id, template.format, template.status, initialValues]);

  if (template.status !== 'published') {
    return (
      <section className="content-stack">
        <div className="summary-band">
          <div>
            <span className="muted">Выбранный шаблон</span>
            <strong>{template.name}</strong>
          </div>
          <div>
            <span className="muted">Статус</span>
            <strong>{statusLabels[template.status]}</strong>
          </div>
        </div>
        <EmptyState text="Документ можно создать только по опубликованному шаблону. Откройте переменные, настройте поля и нажмите 'Опубликовать'." />
      </section>
    );
  }

  const validationErrors = () => {
    const nextErrors: Record<string, string> = {};
    variables.forEach((variable) => {
      const value = values[variable.name];
      if (
        variable.required
        && (value === ''
          || value === false
          || value === undefined
          || (Array.isArray(value) && value.length === 0))
      ) {
        nextErrors[variable.name] = 'Заполните обязательное поле';
      }
      if ((variable.type === 'number' || variable.type === 'currency') && value && Number.isNaN(Number(value))) {
        nextErrors[variable.name] = 'Введите число';
      }
    });
    return nextErrors;
  };

  const submit = async () => {
    const nextErrors = validationErrors();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setIsSubmitting(true);
    setApiError('');
    try {
      const generatedDocument = await generateDocument(template, values);
      await downloadDocument(generatedDocument, format);
      await onGenerated();
    } catch (requestError) {
      setApiError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="split-view">
      <div className="content-stack" style={{ maxWidth: '900px' }}>
        <div className="summary-band">
          <div>
            <span className="muted">Выбранный шаблон</span>
            <strong>{template.name}</strong>
          </div>
          <label>
            Формат результата
            <select value={format} onChange={(event) => setFormat(event.target.value as 'docx' | 'pdf')}>
              {template.format === 'docx' && <option value="docx">DOCX</option>}
              <option value="pdf">PDF</option>
            </select>
          </label>
        </div>
        {apiError && <div className="error-banner">{apiError}</div>}

        {/* ===== ПОЛЯ В СТОЛБИК ===== */}
        <div className="form-column">
          {variables.map((variable) => (
            <DynamicField
              key={variable.id}
              variable={variable}
              value={values[variable.name]}
              error={errors[variable.name]}
              onChange={(value) => setValues((current) => ({ ...current, [variable.name]: value }))}
            />
          ))}
          {variables.length === 0 && (
            <div className="form-empty">
              <EmptyState text="У шаблона нет распознанных переменных. Проверьте разметку шаблона или запустите распознавание после загрузки." />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button className="secondary" onClick={() => setPreview((current) => !current)}>
            {preview ? 'Скрыть предпросмотр' : 'Показать предпросмотр'}
          </button>
          <button onClick={submit} disabled={isSubmitting}>{isSubmitting ? 'Генерация...' : 'Сгенерировать документ'}</button>
        </div>
      </div>

      <aside className="preview-panel">
        <h2>Предпросмотр данных</h2>
        {preview ? (
          <dl>
            {variables.map((variable) => (
              <div key={variable.id}>
                <dt>{variable.label}</dt>
                <dd>{formatPreviewValue(values[variable.name])}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState text="Откройте предпросмотр, чтобы проверить значения перед генерацией" />
        )}
      </aside>
    </section>
  );
}

function getInitialFieldValue(variable: TemplateVariable): DocumentFieldValue {
  if (variable.type === 'boolean') {
    return variable.defaultValue === 'true';
  }

  if (variable.type === 'table') {
    return [];
  }

  return variable.defaultValue;
}

function formatPreviewValue(value: DocumentFieldValue | undefined): string {
  if (Array.isArray(value)) {
    return value.length > 0 ? `${value.length} строк(и)` : 'Не заполнено';
  }

  if (value === true) return 'Да';
  if (value === false) return 'Нет';
  return value || 'Не заполнено';
}

function DynamicField({
  variable,
  value,
  error,
  onChange,
}: {
  variable: TemplateVariable;
  value: DocumentFieldValue | undefined;
  error?: string;
  onChange: (value: DocumentFieldValue) => void;
}) {
  const selectOptions = Array.isArray(variable.options) ? variable.options : [];

  return (
    <div className={error ? 'field has-error' : 'field'}>
      <span className="field-label">{variable.label}</span>
      {variable.type === 'textarea' && (
        <textarea value={String(value || '')} onChange={(event) => onChange(event.target.value)} />
      )}
      {variable.type === 'select' && (
        <select value={String(value || '')} onChange={(event) => onChange(event.target.value)}>
          <option value="">Выберите значение</option>
          {selectOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      )}
      {variable.type === 'boolean' && (
        <span className="inline-control">
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
          Да
        </span>
      )}
      {variable.type === 'table' && (
        <TableField
          variable={variable}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      )}
      {!['textarea', 'select', 'boolean', 'table'].includes(variable.type) && (
        <input
          type={variable.type === 'date' ? 'date' : variable.type === 'number' || variable.type === 'currency' ? 'number' : 'text'}
          value={String(value || '')}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {variable.hint && <span className="hint">{variable.hint}</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
}

function TableField({
  variable,
  value,
  onChange,
}: {
  variable: TemplateVariable;
  value: TableRowValue[];
  onChange: (value: TableRowValue[]) => void;
}) {
  const columns = !Array.isArray(variable.options) && variable.options?.columns?.length
    ? variable.options.columns
    : ['Наименование', 'Кол-во', 'Цена'];

  const addRow = () => {
    onChange([...value, Object.fromEntries(columns.map((column) => [column, '']))]);
  };

  const updateCell = (rowIndex: number, column: string, nextValue: string) => {
    onChange(
      value.map((row, index) => (index === rowIndex ? { ...row, [column]: nextValue } : row)),
    );
  };

  const removeRow = (rowIndex: number) => {
    onChange(value.filter((_, index) => index !== rowIndex));
  };

  return (
    <div className="table-field">
      {value.length > 0 && (
        <div className="table-field-head" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr)) 90px` }}>
          {columns.map((column) => <span key={column}>{column}</span>)}
          <span />
        </div>
      )}
      {value.map((row, rowIndex) => (
        <div className="table-field-row" key={rowIndex} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr)) 90px` }}>
          {columns.map((column) => (
            <input
              key={column}
              value={row[column] || ''}
              onChange={(event) => updateCell(rowIndex, column, event.target.value)}
              placeholder={column}
            />
          ))}
          <button className="secondary" type="button" onClick={() => removeRow(rowIndex)}>Удалить</button>
        </div>
      ))}
      <button className="secondary" type="button" onClick={addRow}>Добавить строку</button>
    </div>
  );
}

function HistoryPage({
  documents,
  onRepeat,
}: {
  documents: GeneratedDocument[];
  onRepeat: (document: GeneratedDocument) => void | Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [repeatingId, setRepeatingId] = useState('');
  const filteredDocuments = useMemo(
    () => documents.filter((document) => document.templateName.toLowerCase().includes(query.toLowerCase())),
    [documents, query],
  );

  const download = async (document: GeneratedDocument, format?: 'docx' | 'pdf') => {
    setError('');
    try {
      await downloadDocument(document, format);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <section className="content-stack">
      <div className="toolbar">
        <input placeholder="Поиск ☺" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="document-grid">
        {filteredDocuments.map((document) => (
          <article className="document-card" key={document.id}>
            <div>
              <span className="pill">{document.format.toUpperCase()}</span>
              <h2>{document.fileName}</h2>
              <p>{document.templateName}</p>
            </div>
            <dl>
              <div>
                <dt>Создан</dt>
                <dd>{formatDateTime(document.createdAt)}</dd>
              </div>
            </dl>
            <div className="actions">
              <button
                className="secondary"
                disabled={repeatingId === document.id}
                onClick={async () => {
                  setRepeatingId(document.id);
                  setError('');
                  try {
                    await onRepeat(document);
                  } catch (requestError) {
                    setError(getErrorMessage(requestError));
                  } finally {
                    setRepeatingId('');
                  }
                }}
              >
                {repeatingId === document.id ? 'Открытие...' : 'Повторить'}
              </button>
              <button onClick={() => download(document)}>Скачать</button>
              {document.format === 'docx' && (
                <button className="secondary" onClick={() => download(document, 'pdf')}>PDF</button>
              )}
            </div>
          </article>
        ))}
      </div>
      {filteredDocuments.length === 0 && <EmptyState text="Документы пока не созданы" />}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <strong>Нет данных</strong>
      <span>{text}</span>
    </div>
  );
}