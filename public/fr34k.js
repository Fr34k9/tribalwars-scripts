class Fr34kUtils {
    constructor(config) {
        this.serverUrl = 'https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/api/scripts/';
        this.config = config;
    }

    // Log function
    logMessage(message, type = 'info') {
        const styles = {
            info: 'color: blue; font-weight: bold;',
            warn: 'color: orange; font-weight: bold;',
            error: 'color: red; font-weight: bold;',
        };
        console.log(`%c[${this.config.script_id}] ${message}`, styles[type] || styles.info);
    }

    // Initialization function
    initScript() {
        this.logMessage(`${this.config.script_id} v${this.config.version} initialized`, 'info');

        if (!window.location.href.includes('staemme')) {
            this.logMessage('This script can only run on Tribal Wars.', 'warn');
            return false;
        }

        Fr34kUtils.countScriptRuns();

        return true;
    }

    async countScriptRuns() {
        $.ajax({
            url: this.serverUrl + this.config.script_id + '/count',
            type: 'POST',
            data: {
                player: game_data.player.name
            },
            success: (response) => {
                this.logMessage(`Total script runs: ${response.count}`, 'info');
            },
            error: (error) => {
                this.logMessage('Failed to get total script runs', 'error');
            }
        });
    }

    specialAlert() {
        alert('This is a special alert!');
    }

    // Sleep function (returns a promise for delays)
    async sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    // Example bot detection placeholder
    detectBot() {
        this.logMessage('Checking for bot-like behavior...', 'info');
        // Add bot detection logic here
        return false;
    }
}

// Export the utility class
if (typeof window !== 'undefined') {
    window.Fr34kUtils = Fr34kUtils;
}