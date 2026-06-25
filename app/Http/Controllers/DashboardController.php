<?php

namespace App\Http\Controllers;

use App\Models\Script;

class DashboardController extends Controller
{
    public function index()
    {
        $user         = auth()->user();
        $subscription = $user->subscription();
        $tokens       = $user->tokens()->latest()->get();

        $stats = [
            'total_runs'    => Script::sum('run_counter'),
            'total_actions' => Script::sum('action_counter'),
        ];

        return view('dashboard', compact('user', 'subscription', 'tokens', 'stats'));
    }
}
