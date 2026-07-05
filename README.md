# Contract Template Engine / Шаблонизатор договоров

Веб-приложение для создания, управления и генерации документов на основе шаблонов DOCX и PDF. Позволяет загрузить шаблон договора, настроить переменные-плейсхолдеры, а затем быстро сгенерировать готовый документ с подставленными значениями.

## Возможности

- загрузка шаблонов DOCX и PDF
- автоматическое распознавание переменных (плейсхолдеров {...})
- настройка переменных: подпись, тип, обязательность, подсказка, значение по умолчанию
- типы переменных: текст, многострочный текст, число, сумма, дата, выбор из списка, логический, таблица
- публикация шаблонов
- генерация документа по опубликованному шаблону
- предпросмотр введённых данных перед генерацией
- скачивание готового документа (DOCX или PDF)
- конвертация DOCX в PDF
- загрузка новой версии шаблона
- история созданных документов
- повторное создание документа с прежними значениями
- удаление шаблонов
- Swagger-документация API

## Технологии

Backend — Laravel 13, PHP 8.4. База данных — PostgreSQL 15. Frontend — React 18, TypeScript, Vite 6. Контейнеризация — Docker, Docker Compose. Аутентификация — Laravel Sanctum (токены).

## Требования к системе

Для запуска проекта нужны три программы.

Docker Desktop — скачайте с сайта docker.com/products/docker-desktop, установите, перезагрузите компьютер, запустите. Проверьте в PowerShell командами docker --version и docker compose version.

Node.js — скачайте LTS-версию с сайта nodejs.org, установите. Проверьте командами node --version и npm --version.

Git — скачайте с сайта git-scm.com/downloads, установите. Проверьте командой git --version. Git нужен только для клонирования репозитория, можно скачать ZIP-архив напрямую.

## Быстрый старт

Скачайте проект командой git clone https://github.com/Empty921/new_contract_generator.git и перейдите в папку new_contract_generator.

Запустите backend. Перейдите в папку app и выполните docker compose up -d. Первый запуск займёт 5-10 минут — Docker скачает образы, установит зависимости, выполнит миграции базы данных и запустит сервер. Проверьте командой docker ps — должны быть контейнеры docs-app и docs-db. Backend будет доступен по адресу http://localhost:8000, Swagger-документация по адресу http://localhost:8000/api-docs.

Запустите frontend. Откройте новый терминал PowerShell, перейдите в папку frontend и выполните npm.cmd install, затем npm.cmd run dev. Frontend будет доступен по адресу http://127.0.0.1:5173.

## Структура проекта

Папка app — Laravel backend. Содержит контроллеры, модели, сервисы, конфигурацию, миграции базы данных, маршруты API, docker-compose.yml и Dockerfile.

Папка frontend — React frontend. Содержит исходный код и конфигурацию Vite.

Папка test-templates — тестовые шаблоны для проверки.

Файл README.md — эта инструкция.

## Основные команды Docker

Запустить backend — docker compose up -d. Остановить backend — docker compose down. Пересобрать контейнеры — docker compose up -d --build. Посмотреть логи app — docker compose logs -f app. Посмотреть логи db — docker compose logs -f db. Зайти в контейнер — docker exec -it docs-app bash.

Команда для запуска в контейнере (Если будет ошиибка): docker exec docs-app bash -c "cd /var/www/app && php artisan serve --host=0.0.0.0 --port=8000" 
После включайте frontend
## Возможные проблемы

Если frontend не подключается к API — убедитесь что backend запущен (docker ps). Если ошибка CORS — перезапустите frontend.

Если ошибка Class Sanctum not found — зайдите в контейнер (docker exec -it docs-app bash) и выполните composer install в папке /var/www/app.

Если ошибка No application encryption key — зайдите в контейнер и выполните php artisan key:generate.

Если открывается страница Laravel вместо приложения — откройте http://127.0.0.1:5173 (фронтенд), а не http://localhost:8000 (бэкенд).
