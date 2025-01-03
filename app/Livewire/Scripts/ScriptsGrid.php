<?php

namespace App\Livewire\Scripts;

use App\Models\Script;
use Livewire\Component;

class ScriptsGrid extends Component
{
    public $scripts;

    public function mount()
    {
        $this->scripts = Script::all();
    }

    public function render()
    {
        return view('livewire.scripts.scripts-grid');
    }
}
