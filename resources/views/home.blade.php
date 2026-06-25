<x-app-layout>
    {{-- Hero --}}
    <div class="relative bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-300 text-white">
        <div class="max-w-6xl mx-auto px-6 py-24 text-center">
            <h1 class="text-5xl font-extrabold tracking-tight mb-4 drop-shadow">
                Tribal Wars Scripts
            </h1>
            <p class="text-xl text-amber-100 max-w-2xl mx-auto mb-8">
                A powerful Greasemonkey script suite that supercharges your Tribal Wars gameplay —
                farm management, attack planning, tribe overview, and more, all in one bundle.
            </p>
            @auth
                <a href="{{ route('dashboard') }}"
                   class="inline-block bg-white text-amber-600 font-semibold px-8 py-3 rounded-full shadow hover:bg-amber-50 transition">
                    Go to Dashboard
                </a>
            @else
                <div class="flex justify-center gap-4">
                    <a href="{{ route('register') }}"
                       class="inline-block bg-white text-amber-600 font-semibold px-8 py-3 rounded-full shadow hover:bg-amber-50 transition">
                        Get Started
                    </a>
                    <a href="{{ route('login') }}"
                       class="inline-block border-2 border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-white/10 transition">
                        Log In
                    </a>
                </div>
            @endauth
        </div>
    </div>

    {{-- Stats --}}
    <div class="bg-white border-b">
        <div class="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
                <div class="text-3xl font-bold text-amber-500">{{ number_format($stats['total_scripts']) }}</div>
                <div class="text-sm text-gray-500 mt-1">Script modules</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-green-500">{{ number_format($stats['total_downloads']) }}</div>
                <div class="text-sm text-gray-500 mt-1">Downloads</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-purple-500">{{ number_format($stats['total_runs']) }}</div>
                <div class="text-sm text-gray-500 mt-1">Script runs</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-blue-500">{{ number_format($stats['total_actions']) }}</div>
                <div class="text-sm text-gray-500 mt-1">Actions performed</div>
            </div>
        </div>
    </div>

    {{-- Features --}}
    <div class="bg-gray-50 py-20">
        <div class="max-w-6xl mx-auto px-6">
            <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">What's included</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @foreach ([
                    ['icon' => '⚔️', 'title' => 'Attack Planner', 'desc' => 'Plan and coordinate mass attacks with precision timing across your tribe.'],
                    ['icon' => '🏰', 'title' => 'Baba Wall Clearer', 'desc' => 'Automatically clear walls from incoming noble trains.'],
                    ['icon' => '🌾', 'title' => 'Farm God Addon', 'desc' => 'Advanced farm management to maximise your resource income.'],
                    ['icon' => '📅', 'title' => 'Looter of the Day', 'desc' => 'Track and rank your tribe\'s top farmers in real time.'],
                    ['icon' => '🔍', 'title' => 'New Baba Finder', 'desc' => 'Detect and highlight newly barbarian-converted villages on the map.'],
                    ['icon' => '📊', 'title' => 'Nice Overview', 'desc' => 'A polished building overview with color-coded completion status.'],
                    ['icon' => '✏️', 'title' => 'Rename Attacks', 'desc' => 'Bulk-rename incoming attacks for faster reading and coordination.'],
                    ['icon' => '🛡️', 'title' => 'Tribe Full Defense', 'desc' => 'Full tribe defense overview grouped by attacker and village.'],
                    ['icon' => '👥', 'title' => 'Tribe Member Overview', 'desc' => 'Instant snapshot of all tribe members, points, and villages.'],
                    ['icon' => '🪖', 'title' => 'Tribe Member Troops', 'desc' => 'See which troops each member has stationed in their villages.'],
                    ['icon' => '✅', 'title' => 'Tribe Status Checker', 'desc' => 'Verify tribe readiness and flag inactive members quickly.'],
                    ['icon' => '⏱️', 'title' => 'Ultra Timing', 'desc' => 'Millisecond-precise attack timing for coordinated conquests.'],
                    ['icon' => '🌍', 'title' => 'Farmgod Addon Enter', 'desc' => 'Keyboard shortcuts for Farmgod to speed up your daily farming routine.'],
                ] as $feature)
                    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex gap-4">
                        <div class="text-3xl">{{ $feature['icon'] }}</div>
                        <div>
                            <h3 class="font-semibold text-gray-800">{{ $feature['title'] }}</h3>
                            <p class="text-sm text-gray-500 mt-1">{{ $feature['desc'] }}</p>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    {{-- Pricing --}}
    <div class="bg-white py-20" id="pricing">
        <div class="max-w-4xl mx-auto px-6">
            <h2 class="text-3xl font-bold text-center text-gray-800 mb-4">Simple pricing</h2>
            <p class="text-center text-gray-500 mb-12">Full access to all scripts. Cancel anytime.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

                {{-- Monthly --}}
                <div class="border-2 border-gray-200 rounded-2xl p-8 flex flex-col">
                    <div class="text-lg font-semibold text-gray-700">Monthly</div>
                    <div class="mt-4 flex items-baseline gap-1">
                        <span class="text-4xl font-extrabold text-gray-900">€4.99</span>
                        <span class="text-gray-500">/ month</span>
                    </div>
                    <ul class="mt-6 space-y-3 text-sm text-gray-600 flex-1">
                        <li class="flex gap-2"><span class="text-green-500">✓</span> All 13 script modules</li>
                        <li class="flex gap-2"><span class="text-green-500">✓</span> Instant download access</li>
                        <li class="flex gap-2"><span class="text-green-500">✓</span> API token for plugin auth</li>
                        <li class="flex gap-2"><span class="text-green-500">✓</span> New features as they ship</li>
                        <li class="flex gap-2"><span class="text-green-500">✓</span> Cancel anytime</li>
                    </ul>
                    <a href="{{ auth()->check() ? route('subscription.plans') : route('register') }}"
                       class="mt-8 block text-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition">
                        Get started
                    </a>
                </div>

                {{-- Yearly --}}
                <div class="border-2 border-amber-400 rounded-2xl p-8 flex flex-col relative">
                    <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                        BEST VALUE
                    </div>
                    <div class="text-lg font-semibold text-gray-700">Yearly</div>
                    <div class="mt-4 flex items-baseline gap-1">
                        <span class="text-4xl font-extrabold text-gray-900">€39.99</span>
                        <span class="text-gray-500">/ year</span>
                    </div>
                    <p class="text-xs text-amber-600 font-medium mt-1">Save ~33% vs monthly</p>
                    <ul class="mt-6 space-y-3 text-sm text-gray-600 flex-1">
                        <li class="flex gap-2"><span class="text-green-500">✓</span> Everything in Monthly</li>
                        <li class="flex gap-2"><span class="text-green-500">✓</span> Priority support</li>
                        <li class="flex gap-2"><span class="text-green-500">✓</span> Early access to new scripts</li>
                    </ul>
                    <a href="{{ auth()->check() ? route('subscription.plans') : route('register') }}"
                       class="mt-8 block text-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition">
                        Get started
                    </a>
                </div>

            </div>
        </div>
    </div>

    {{-- Footer --}}
    <footer class="bg-gray-800 text-gray-400 py-8 text-center text-sm">
        <p>&copy; {{ date('Y') }} fr34k.ch — Tribal Wars Scripts. All rights reserved.</p>
        <p class="mt-1">Not affiliated with Innogames or the official Tribal Wars game.</p>
    </footer>
</x-app-layout>
