<?php

use App\Models\Script;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $scripts = Script::all();
    $totalScripts = $scripts->count();
    $totalDownloads = $scripts->sum('download_counter');
    $totalRuns = $scripts->sum('run_counter');

    return view('welcome', compact('scripts', 'totalScripts', 'totalDownloads', 'totalRuns'));
});
