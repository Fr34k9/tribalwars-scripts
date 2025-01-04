<?php

use App\Models\Script;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::prefix('scripts')->group(function () {
    Route::post('/{script}/run', function (Script $script) {
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

    Route::post('/{script}/action', function (Script $script) {
        $player = request('player');
        $counter = request('counter', 1);

        Log::info('Script action', [
            'script' => $script->title,
            'player' => $player,
            'counter' => $counter,
        ]);
        $script->increment('action_counter', $counter);

        return response()->json([
            'message' => 'Script action recorded',
            'counter' => $script->action_counter,
        ]);
    });

    Route::post('/{script}/register', function (Script $script) {
        $player = request('player');
        $account_manager = request('account_manager');
        $premium = request('premium');
        $world = request('world');

        Log::info('Script registered', [
            'script' => $script->title,
            'script_id' => $script->id,
            'player' => $player,
            'world' => $world,
            'account_manager' => $account_manager,
            'premium' => $premium,
        ]);

        return response()->json([
            'message' => 'Script registered successfully',
        ]);
    });
});