<?php

namespace App\Http\Controllers;

use App\Models\Script;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ScriptController extends Controller
{
    public function run(Script $script, Request $request)
    {
        $validated = $request->validate([
            'player' => 'required|string|max:255',
        ]);

        Log::info('Script executed', [
            'script' => $script->title,
            'player' => $validated['player'],
        ]);

        $script->increment('run_counter');

        return response()->json([
            'message' => 'Script executed successfully',
            'count' => $script->run_counter,
        ]);
    }

    public function action(Script $script, Request $request)
    {
        $validated = $request->validate([
            'player' => 'required|string|max:255',
            'counter' => 'nullable|integer|min:1',
        ]);

        Log::info('Script action', [
            'script' => $script->title,
            'player' => $validated['player'],
            'counter' => $validated['counter'] ?? 1,
        ]);

        $script->increment('action_counter', $validated['counter'] ?? 1);

        return response()->json([
            'message' => 'Script action recorded',
            'counter' => $script->action_counter,
        ]);
    }

    public function register(Script $script, Request $request)
    {
        $validated = $request->validate([
            'player' => 'required|string|max:255',
            'account_manager' => 'required|boolean',
            'premium' => 'required|boolean',
            'world' => 'required|string|max:100',
        ]);

        Log::info('Script registered', [
            'script' => $script->title,
            'script_id' => $script->id,
            'player' => $validated['player'],
            'world' => $validated['world'],
            'account_manager' => $validated['account_manager'],
            'premium' => $validated['premium'],
        ]);

        return response()->json([
            'message' => 'Script registered successfully',
        ]);
    }
}
