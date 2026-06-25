<x-app-layout>
    <div class="py-20 text-center">
        <div class="text-5xl mb-4">😕</div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Payment cancelled</h1>
        <p class="text-gray-500 mb-8">No worries — you can subscribe whenever you're ready.</p>
        <a href="{{ route('subscription.plans') }}"
           class="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 rounded-xl transition">
            View Plans
        </a>
    </div>
</x-app-layout>
