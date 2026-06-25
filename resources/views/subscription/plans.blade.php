<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Choose a Plan</h2>
    </x-slot>

    <div class="py-10">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p class="text-center text-gray-500 mb-10">Subscribe to unlock the full script bundle and your personal API token.</p>

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
                        <li class="flex gap-2"><span class="text-green-500">✓</span> Cancel anytime</li>
                    </ul>
                    <form action="{{ route('subscription.checkout') }}" method="POST" class="mt-8">
                        @csrf
                        <input type="hidden" name="price" value="{{ config('cashier.monthly_price_id') }}">
                        <button type="submit"
                                class="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition">
                            Subscribe Monthly
                        </button>
                    </form>
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
                    <form action="{{ route('subscription.checkout') }}" method="POST" class="mt-8">
                        @csrf
                        <input type="hidden" name="price" value="{{ config('cashier.yearly_price_id') }}">
                        <button type="submit"
                                class="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition">
                            Subscribe Yearly
                        </button>
                    </form>
                </div>

            </div>
        </div>
    </div>
</x-app-layout>
