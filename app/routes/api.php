<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VariableController;
use Illuminate\Support\Facades\Route;

// ❌ УДАЛЯЕМ регистрацию и логин (они больше не нужны)
// Route::middleware('throttle:10,1')->group(function () {
//     Route::post('/register', [AuthController::class, 'register']);
//     Route::post('/login', [AuthController::class, 'login']);
// });

// ❌ УДАЛЯЕМ middleware('auth:sanctum') — больше не нужно проверять авторизацию

// Шаблоны (доступны всем)
Route::get('/templates', [TemplateController::class, 'index']);
Route::get('/templates/{template}', [TemplateController::class, 'show']);

// Управление шаблонами (теперь доступно всем)
Route::post('/templates', [TemplateController::class, 'store']);
Route::put('/templates/{template}', [TemplateController::class, 'update']);
Route::post('/templates/{template}/versions', [TemplateController::class, 'storeVersion']);
Route::post('/templates/{template}/variables/extract', [TemplateController::class, 'extractVariables']);
Route::post('/templates/{template}/publish', [TemplateController::class, 'publish']);
Route::delete('/templates/{template}', [TemplateController::class, 'destroy']);

// Переменные (доступны всем)
Route::post('/templates/{template}/variables', [VariableController::class, 'store']);
Route::put('/variables/{variable}', [VariableController::class, 'update']);
Route::delete('/variables/{variable}', [VariableController::class, 'destroy']);

// Документы (доступны всем)
Route::post('/templates/{template}/documents', [DocumentController::class, 'store']);
Route::get('/documents', [DocumentController::class, 'index']);
Route::get('/documents/{document}', [DocumentController::class, 'show']);
Route::get('/documents/{document}/download', [DocumentController::class, 'download']);

// ❌ УДАЛЯЕМ маршруты для пользователей (они больше не нужны)
// Route::get('/users', [UserController::class, 'index']);
// Route::put('/users/{user}', [UserController::class, 'update']);
// Route::delete('/users/{user}', [UserController::class, 'destroy']);

// ❌ УДАЛЯЕМ маршруты авторизации:
// Route::post('/logout', [AuthController::class, 'logout']);
// Route::get('/me', [AuthController::class, 'me']);