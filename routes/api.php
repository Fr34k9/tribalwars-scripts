<?php

use App\Http\Controllers\DsAttackController;
use App\Http\Controllers\ScriptController;
use App\Http\Middleware\EnsureSubscribed;
use Illuminate\Support\Facades\Route;

Route::prefix('ds')->group(function () {
    Route::post('/tribe-full-defense-overview', [DsAttackController::class, 'store']);
});

Route::prefix('scripts')->middleware(['auth:sanctum', EnsureSubscribed::class])->group(function () {
    Route::post('/{slug}/run', [ScriptController::class, 'run']);
    Route::post('/{slug}/action', [ScriptController::class, 'action']);
    Route::post('/{slug}/register', [ScriptController::class, 'register']);
});
