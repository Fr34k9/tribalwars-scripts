<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Laravel</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        @vite(['resources/css/app.css', 'resources/js/app.js'])
        @livewireStyles
    </head>
    <body class="bg-gray-100">
        <div class="p-2 md:p-10">
            <div class="mb-8 text-center">
                <h1 class="text-2xl font-bold">Scripts Overview by Fr34k (Beta)</h1>
            </div>
            @livewire('scripts.scripts-stats')
            @livewire('scripts.scripts-grid')
        </div>
        @livewireScripts
    </body>
</html>
