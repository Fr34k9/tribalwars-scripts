<div>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        @foreach($scripts as $script)
        <div 
            class="transition-shadow duration-300 bg-white rounded-lg shadow-lg cursor-pointer hover:shadow-xl"
            wire:click="$dispatch('showDetails', { script: {{ $script->id }} })"
        >
            <div class="p-6">
                <h3 class="mb-2 text-xl font-semibold text-gray-800">{{ $script->title }}</h3>
                <p class="text-gray-600">{{ $script->short_description }}</p>
                <div class="flex justify-between mt-4 text-sm text-gray-500">
                    <span>Downloads: {{ $script->download_counter ?? 0 }}</span>
                    <span>Runs: {{ $script->run_counter ?? 0 }}</span>
                </div>
            </div>
        </div>
        @endforeach
    </div>

    @livewire('scripts.scripts-modal')
</div>