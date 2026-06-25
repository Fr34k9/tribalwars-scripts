<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class ApiTokenManager extends Component
{
    public string $tokenName = '';
    public ?string $plainTextToken = null;

    public function createToken(): void
    {
        $this->validate(['tokenName' => 'required|string|max:255']);

        $token = auth()->user()->createToken($this->tokenName);

        $this->plainTextToken = $token->plainTextToken;
        $this->tokenName      = '';
    }

    public function revokeToken(int $tokenId): void
    {
        auth()->user()->tokens()->where('id', $tokenId)->delete();
    }

    public function dismissToken(): void
    {
        $this->plainTextToken = null;
    }

    public function render()
    {
        return view('livewire.dashboard.api-token-manager', [
            'tokens' => auth()->user()->tokens()->latest()->get(),
        ]);
    }
}
