<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            Dashboard
        </h2>
    </x-slot>

    <div class="py-10">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

            @if (session('warning'))
                <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                    {{ session('warning') }}
                </div>
            @endif

            {{-- Download --}}
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-1">Download Script</h3>
                <p class="text-sm text-gray-500 mb-4">
                    Install the script in your browser with Tampermonkey or Greasemonkey.
                    Always use the latest version from here.
                </p>
                @php $script = \App\Models\Script::first(); @endphp
                @if ($script)
                    <a href="{{ route('script.download', $script) }}"
                       class="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v8m0 0l-3-3m3 3l3-3M12 4v8" />
                        </svg>
                        Download fr34k-scripts.user.js
                        @if($script->version)
                            <span class="text-xs bg-white/20 px-2 py-0.5 rounded-full">v{{ $script->version }}</span>
                        @endif
                    </a>
                @endif
            </div>

            {{-- Subscription --}}
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Subscription</h3>
                @if ($subscription && $subscription->active())
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <div class="flex items-center gap-3">
                            <span class="inline-flex items-center bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                                Active
                            </span>
                            @if ($subscription->ends_at)
                                <span class="text-sm text-gray-500">
                                    Access until {{ $subscription->ends_at->format('M d, Y') }}
                                </span>
                            @else
                                <span class="text-sm text-gray-500">Renews automatically</span>
                            @endif
                        </div>
                        @if (! str_starts_with($subscription->stripe_id ?? '', 'manual_'))
                            <a href="{{ route('billing.portal') }}"
                               class="text-sm text-amber-600 hover:text-amber-800 font-medium underline underline-offset-2">
                                Manage billing →
                            </a>
                        @endif
                    </div>
                @else
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <span class="inline-flex items-center bg-red-100 text-red-700 text-sm font-medium px-3 py-1 rounded-full">
                            No active subscription
                        </span>
                        <a href="{{ route('subscription.plans') }}"
                           class="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition">
                            Subscribe now
                        </a>
                    </div>
                @endif
            </div>

            {{-- API Token Manager --}}
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-1">API Tokens</h3>
                <p class="text-sm text-gray-500 mb-4">
                    Generate a token and paste it into your script's settings.
                    The script will use it to authenticate against the API.
                </p>
                <livewire:dashboard.api-token-manager />
            </div>

            {{-- Usage Stats --}}
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Global Usage Stats</h3>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div class="bg-purple-50 rounded-xl p-4 text-center">
                        <div class="text-2xl font-bold text-purple-600">{{ number_format($stats['total_runs']) }}</div>
                        <div class="text-xs text-gray-500 mt-1">Total Runs</div>
                    </div>
                    <div class="bg-yellow-50 rounded-xl p-4 text-center">
                        <div class="text-2xl font-bold text-yellow-600">{{ number_format($stats['total_actions']) }}</div>
                        <div class="text-xs text-gray-500 mt-1">Total Actions</div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</x-app-layout>
