<?php

namespace App\Http\Controllers;

use App\Models\Script;

class HomeController extends Controller
{
    public function index()
    {
        $stats = [
            'total_scripts'   => Script::count(),
            'total_downloads' => Script::sum('download_counter'),
            'total_runs'      => Script::sum('run_counter'),
            'total_actions'   => Script::sum('action_counter'),
        ];

        return view('home', compact('stats'));
    }
}
