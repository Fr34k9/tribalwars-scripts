import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
    publicDir: false,
    build: {
        outDir: 'public',
        emptyOutDir: false,
        rollupOptions: {
            input: 'resources/js/scripts/main.js',
        },
    },
    plugins: [
        monkey({
            entry: 'resources/js/scripts/main.js',
            userscript: {
                name:        'Fr34k Scripts',
                namespace:   'https://fr34k.ch',
                version:     '1.0.0',
                description: 'All Fr34k Tribal Wars scripts in one install',
                author:      'Fr34k',
                icon:        'https://www.google.com/s2/favicons?sz=64&domain=staemme.ch',
                match: [
                    '*://*.staemme.ch/game.php*',
                    '*://*.die-staemme.de/game.php*',
                    '*://*.tribalwars.net/game.php*',
                    '*://*.tribalwars.nl/game.php*',
                    '*://*.tribalwars.com.br/game.php*',
                    '*://*.tribalesguerra.com/game.php*',
                    '*://*.guerrastribales.es/game.php*',
                    '*://*.ds-ultimate.de/tools/attackPlanner/*',
                ],
                grant: 'none',
            },
            build: {
                fileName: 'js/gm/fr34k-scripts.user.js',
            },
        }),
    ],
});
