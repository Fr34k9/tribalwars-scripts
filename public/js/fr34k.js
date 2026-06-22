class Fr34kUtils {

    constructor(config) {
        this.serverUrl = 'https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/api/';
        this.config = config;

        if (!this.initScript()) {
            return;
        }

        if (!this.checkConfig()) {
            return;
        }
    }

    checkConfig() {
        let requiredFields = ['script_slug', 'script_name'];

        for (let field of requiredFields) {
            if (!this.config[field]) {
                this.logMessage(`Missing config field: ${field}`, 'error');
                return false;
            }
        }

        return true;
    }

    uiMessage(message, visibleTime = 60) {
        UI.InfoMessage(message, visibleTime, true);
    }

    logMessage(message, type = 'info') {
        const styles = {
            info: 'color: blue; font-weight: bold;',
            debug: 'color: orange; font-weight: bold;',
            error: 'color: red; font-weight: bold;',
        };
        console.log(`%c[Fr34k-${this.config.script_name}] ${message}`, styles[type] || styles.info);
    }

    initScript() {
        this.logMessage(`Script ${this.config.script_name} (${this.config.script_slug}) active`, 'info');

        if (!window.location.href.includes('staemme')) {
            this.logMessage('This script can only run on Tribal Wars.', 'warn');
            return false;
        }

        if (!this.getValue('first_run')) {
            this.registerScript();
        }

        this.countScriptRuns();

        return true;
    }

    finishScript(actions = 1) {
        if (actions > 0) {
            this.countScriptActions(actions);
        }
        this.logMessage('Script finished', 'info');
    }

    async registerScript() {
        $.ajax({
            url: this.serverUrl + 'scripts/' + this.config.script_slug + '/register',
            type: 'POST',
            data: {
                player: game_data.player.name || 'Unknown',
                account_manager: game_data.features.AccountManager.active ? 1 : 0,
                premium: game_data.features.Premium.active ? 1 : 0,
                world: game_data.world || 'Unknown',
            },
            success: (response) => {
                this.logMessage('This was the first time using this script', 'debug');
                this.saveValue('first_run', true);
            },
            error: (error) => {
                this.logMessage('Failed to register script', 'error');
            }
        });
    }

    async countScriptRuns() {
        $.ajax({
            url: this.serverUrl + 'scripts/' + this.config.script_slug + '/run',
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
            url: this.serverUrl + 'scripts/' + this.config.script_slug + '/action',
            type: 'POST',
            data: {
                counter: counter,
                player: game_data.player.name
            },
            success: (response) => {
                this.logMessage(`Total script actions: ${response.counter}`, 'info');
            },
            error: (error) => {
                this.logMessage('Failed to get total script actions', 'error');
            }
        });
    }

    random = {
        delay: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        number: (min, max) => {
            min = Number(min);
            max = Number(max);
            return Math.random() * (max - min) + min;
        }
    };

    unitPopulationCost = {
        spear: 1,
        sword: 1,
        axe: 1,
        archer: 1,
        spy: 2,
        light: 4,
        marcher: 5,
        heavy: 6,
        ram: 5,
        catapult: 8,
        knight: 10,
        snob: 100
    };

    async sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    botDetected() {
        let detected = false;
        if ($('#botprotection_quest').length > 0) detected = true;
        if ($('#bot_check').length > 0) detected = true;
        if ($('#popup_box_bot_protection').length > 0) detected = true;

        if (detected) {
            this.logMessage('Bot detected', 'warn');
            return true;
        }

        return false;
    }

    // localStorage helpers — prefixed by script_slug to avoid collisions between scripts
    saveValue(key, value) {
        localStorage.setItem(this.config.script_slug + '_' + key, value);
    }

    getValue(key) {
        return localStorage.getItem(this.config.script_slug + '_' + key);
    }

    getParameterByName(key) {
        return new URL(window.location.href).searchParams.get(key);
    }

}

if (typeof window !== 'undefined') {
    window.Fr34kUtils = Fr34kUtils;
}
