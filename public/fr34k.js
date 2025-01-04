class Fr34kUtils {
    constructor(config) {
        this.serverUrl = 'https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/api/';
        this.config = config;

        if (!this.initScript()) {
            return;
        }

        // check config
        if (!this.checkConfig()) {
            return;
        }
    }

    // Check config
    checkConfig() {
        let requiredFields = ['script_id', 'script_name'];

        for (let field of requiredFields) {
            if (!this.config[field]) {
                this.logMessage(`Missing config field: ${field}`, 'error');
                return false;
            }
        }

        return true;
    }

    // Log function
    logMessage(message, type = 'info') {
        const styles = {
            info: 'color: blue; font-weight: bold;',
            warn: 'color: orange; font-weight: bold;',
            error: 'color: red; font-weight: bold;',
        };
        console.log(`%c[Fr34k-${this.config.script_name}] ${message}`, styles[type] || styles.info);
    }

    // Initialization function
    initScript() {
        this.logMessage(`${this.config.script_id} v${this.config.version} initialized`, 'info');

        if (!window.location.href.includes('staemme')) {
            this.logMessage('This script can only run on Tribal Wars.', 'warn');
            return false;
        }

        this.countScriptRuns();

        return true;
    }

    async countScriptRuns() {
        $.ajax({
            url: this.serverUrl + 'scripts/' + this.config.script_id + '/run',
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

    async countScriptActions(counter) {
        $.ajax({
            url: this.serverUrl + 'scripts/' + this.config.script_id + '/action',
            type: 'POST',
            data: {
                count: counter,
                player: game_data.player.name
            },
            success: (response) => {
                this.logMessage(`Total script actions: ${response.count}`, 'info');
            },
            error: (error) => {
                this.logMessage('Failed to get total script actions', 'error');
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

    detectBot() {
        let detected = false;
        if ($('#botprotection_quest').length > 0) {
            detected = true;
        }

        if ($('#bot_check').length > 0) {
            detected = true;
        }

        if ($('#popup_box_bot_protection').length > 0) {
            detected = true;
        }

        if (detected) {
            this.logMessage('Bot detected', 'warn');
            return true;
        }

        return false;
    }

    saveValue(key, value) {
        localStorage.setItem(this.config.script_id + '_' + key, value);
        if (this.config.debug) {
            this.logMessage(`Saved value: ${key} = ${value}`);
        }
    }

    getValue(key) {
        if (this.config.debug) {
            this.logMessage(`Getting value: ${key} = ${localStorage.getItem(this.config.script_id + '_' + key)}`);
        }
        return localStorage.getItem(this.config.script_id + '_' + key);
    }

}

// Export the utility class
if (typeof window !== 'undefined') {
    window.Fr34kUtils = Fr34kUtils;
}