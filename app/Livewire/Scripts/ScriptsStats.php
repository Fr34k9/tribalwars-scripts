<?php

namespace App\Livewire\Scripts;

use App\Models\Script;
use Livewire\Component;

class ScriptsStats extends Component
{
    public function render()
    {
        $scripts = Script::all();
        $totalScripts = $scripts->count();
        $totalDownloads = $scripts->sum('download_counter');
        $totalRuns = $scripts->sum('run_counter');
        $totalActions = $scripts->sum('action_counter');

        return view('livewire.scripts.scripts-stats', [
            'totalScripts' => $totalScripts,
            'totalDownloads' => $totalDownloads,
            'totalRuns' => $totalRuns,
            'totalActions' => $totalActions,
        ]);
    }
}
