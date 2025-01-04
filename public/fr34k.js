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
            debug: 'color: orange; font-weight: bold;',
            error: 'color: red; font-weight: bold;',
        };
        console.log(`%c[Fr34k-${this.config.script_name}] ${message}`, styles[type] || styles.info);
    }

    // Initialization function
    initScript() {
        this.logMessage(`Script ${this.config.script_name}(${this.config.script_id}) active`, 'info');

        if (!window.location.href.includes('staemme')) {
            this.logMessage('This script can only run on Tribal Wars.', 'warn');
            return false;
        }

        if (!this.getValue('first_run')) {
            this.registerScript();
            this.saveValue('first_run', true);
        }

        this.countScriptRuns();

        return true;
    }

    finishScript(actions = 1) {
        this.countScriptActions(actions);
        this.logMessage('Script finished', 'info');
    }

    async registerScript() {
        $.ajax({
            url: this.serverUrl + 'scripts/' + this.config.script_id + '/register',
            type: 'POST',
            data: {
                player: game_data.player.name || 'Unknown',
                account_manager: game_data.features.AccountManager.active ? 1 : 0,
                premium: game_data.features.Premium.active ? 1 : 0,
                world: game_data.world || 'Unknown',
            },
            success: (response) => {
                this.logMessage('This was the first time using this script', 'debug');
            },
            error: (error) => {
                this.logMessage('Failed to register script', 'error');
            }
        });
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
                counter: counter,
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


    // Helper functions
    random = {
        delay: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        //number: (min, max) => parseInt(Math.random() * (Math.max(min, max) - Math.min(min, max)) + Math.min(min, max))
        number: (min, max) => {
            // Ensure we're working with numbers
            min = Number(min);
            max = Number(max);

            // Get a random decimal between 0 and 1
            const random = Math.random();

            // Calculate the range and add to minimum
            return random * (max - min) + min;
        }
    };

    // Sleep function (returns a promise for delays)
    async sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    botDetected() {
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
    }

    getValue(key) {
        return localStorage.getItem(this.config.script_id + '_' + key);
    }

}

// Export the utility class
if (typeof window !== 'undefined') {
    window.Fr34kUtils = Fr34kUtils;
}