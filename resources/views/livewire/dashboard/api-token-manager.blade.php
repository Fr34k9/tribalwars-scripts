<div class="space-y-6">

    {{-- New token shown once --}}
    @if ($plainTextToken)
        <div class="bg-green-50 border border-green-200 rounded-xl p-4">
            <p class="text-sm font-semibold text-green-800 mb-2">Token created — copy it now, it won't be shown again:</p>
            <div class="flex items-center gap-2">
                <code class="flex-1 bg-white border border-green-200 rounded-lg px-3 py-2 text-sm font-mono break-all text-gray-800">
                    {{ $plainTextToken }}
                </code>
                <button
                    onclick="navigator.clipboard.writeText('{{ $plainTextToken }}').then(() => this.textContent = 'Copied!')"
                    class="shrink-0 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition">
                    Copy
                </button>
            </div>
            <button wire:click="dismissToken" class="mt-3 text-xs text-green-700 underline hover:no-underline">
                I've saved it, dismiss
            </button>
        </div>
    @endif

    {{-- Existing tokens --}}
    @if ($tokens->isNotEmpty())
        <table class="w-full text-sm">
            <thead>
                <tr class="text-left text-gray-500 border-b">
                    <th class="pb-2 font-medium">Name</th>
                    <th class="pb-2 font-medium">Created</th>
                    <th class="pb-2 font-medium">Last used</th>
                    <th class="pb-2"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @foreach ($tokens as $token)
                    <tr>
                        <td class="py-3 font-medium text-gray-800">{{ $token->name }}</td>
                        <td class="py-3 text-gray-500">{{ $token->created_at->format('M d, Y') }}</td>
                        <td class="py-3 text-gray-500">{{ $token->last_used_at?->diffForHumans() ?? 'Never' }}</td>
                        <td class="py-3 text-right">
                            <button wire:click="revokeToken({{ $token->id }})"
                                    wire:confirm="Revoke this token? The Greasemonkey script will stop working."
                                    class="text-xs text-red-600 hover:text-red-800 font-medium">
                                Revoke
                            </button>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="text-sm text-gray-400">No tokens yet.</p>
    @endif

    {{-- Create form --}}
    <form wire:submit="createToken" class="flex items-center gap-3">
        <input
            wire:model="tokenName"
            type="text"
            placeholder="Token name (e.g. My laptop)"
            class="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
        />
        <button type="submit"
                class="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition">
            Generate
        </button>
    </form>
    @error('tokenName')
        <p class="text-xs text-red-600">{{ $message }}</p>
    @enderror

</div>
