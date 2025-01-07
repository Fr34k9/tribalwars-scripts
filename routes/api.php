<?php

use App\Http\Controllers\ScriptController;
use Illuminate\Support\Facades\Route;

Route::prefix('scripts')->group(function () {
    Route::post('/{script}/run', [ScriptController::class, 'run']);
    Route::post('/{script}/action', [ScriptController::class, 'action']);
    Route::post('/{script}/register', [ScriptController::class, 'register']);
});