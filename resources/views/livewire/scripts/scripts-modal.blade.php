<div>
    <!-- Modal -->
    @if($showModal)
    <div 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500 bg-opacity-75"
        wire:click.self="closeModal"
    >
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex items-start justify-between mb-4">
                    <h2 class="text-2xl font-bold text-gray-800">{{ $script->title }}</h2>
                    <button 
                        wire:click="closeModal"
                        class="text-gray-500 hover:text-gray-700"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <div class="mb-4">
                    <img src="{{ Storage::url($script->image) }}" alt="{{ $script->title }}" class="object-cover w-full h-64 rounded-lg">
                </div>

                <div class="mb-4">
                    <h3 class="mb-2 text-lg font-semibold text-gray-700">Description</h3>
                    <p class="text-gray-600">{{ $script->short_description }}</p>
                </div>

                <div class="mb-6">
                    <h3 class="mb-2 text-lg font-semibold text-gray-700">Detailed Information</h3>
                    <div class="prose max-w-none">
                        {{ $script->long_description }}
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-500">
                        <span class="mr-4">Downloads: {{ $script->download_counter ?? 0 }}</span>
                        <span class="mr-4">Runs: {{ $script->run_counter ?? 0 }}</span>
                        <span>Actions: {{ $script->action_counter ?? 0 }}</span>
                    </div>
                    <a 
                        href="{{ route('script.download', $script) }}"
                        class="inline-flex items-center px-4 py-2 text-white transition bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        Install Script
                    </a>
                </div>
            </div>
        </div>
    </div>
    @endif
</div>
