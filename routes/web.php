<?php

use App\Models\Script;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    $scripts = Script::all();
    $totalScripts = $scripts->count();
    $totalDownloads = $scripts->sum('download_counter');
    $totalRuns = $scripts->sum('run_counter');

    return view('index', compact('scripts', 'totalScripts', 'totalDownloads', 'totalRuns'));
})->name('home');

Route::get('/scripts/{script}/download', function (Script $script) {
    $script->increment('download_counter');

    return response()->download(storage_path('app/public/' . $script->file));
})->name('script.download');

Route::prefix('api')->group(function () {
    Route::post('/scripts/{script}/run', function (Script $script) {
        $player = request('player');

        Log::info('Script executed', [
            'script' => $script->title,
            'player' => $player,
        ]);
        $script->increment('run_counter');

        return response()->json([
            'message' => 'Script executed successfully',
        ]);
    });
});
