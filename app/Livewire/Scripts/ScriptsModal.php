<?php

namespace App\Livewire\Scripts;

use App\Models\Script;
use Illuminate\Support\Facades\Storage;
use Livewire\Attributes\On;
use Livewire\Component;

class ScriptsModal extends Component
{
    public $showModal;
    public $script;

    public function closeModal()
    {
        $this->showModal = false;
    }

    #[On('showDetails')]
    public function showDetails(Script $script)
    {
        $this->script = $script;
        $this->showModal = true;
    }

    public function render()
    {
        return view('livewire.scripts.scripts-modal');
    }
}
