<?php

use App\Models\Script;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::post('/scripts/{script}/run', function (Script $script) {
    $player = request('player');

    Log::info('Script executed', [
        'script' => $script->title,
        'player' => $player,
    ]);
    $script->increment('run_counter');

    return response()->json([
        'message' => 'Script executed successfully',
        'count' => $script->run_counter,
    ]);
});