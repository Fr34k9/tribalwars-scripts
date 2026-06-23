export class Fr34kUtils {

    constructor(config) {
        this.serverUrl = 'https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/api/';
        this.config = config;

        if (!this.checkConfig()) return;
        this.initScript();
    }

    checkConfig() {
        if (!this.config.script_name) {
            this.logMessage('Missing config field: script_name', 'error');
            return false;
        }
        return true;
    }

    uiMessage(message, visibleTime = 60) {
        UI.InfoMessage(message, visibleTime, true);
    }

    logMessage(message, type = 'info') {
        const styles = {
            info:  'color: blue; font-weight: bold;',
            debug: 'color: orange; font-weight: bold;',
            error: 'color: red; font-weight: bold;',
            warn:  'color: orange; font-weight: bold;',
        };
        console.log(`%c[Fr34k-${this.config.script_name}] ${message}`, styles[type] || styles.info);
    }

    initScript() {
        this.logMessage(`Script ${this.config.script_name} active`, 'info');

        if (!this.getValue('first_run')) {
            this.registerScript();
        }

        this.countScriptRuns();
    }

    finishScript(actions = 1) {
        if (actions > 0) this.countScriptActions(actions);
        this.logMessage('Script finished', 'info');
    }

    async registerScript() {
        $.ajax({
            url: this.serverUrl + 'scripts/' + this.config.script_name + '/register',
            type: 'POST',
            data: {
                player: game_data.player.name || 'Unknown',
                account_manager: game_data.features.AccountManager.active ? 1 : 0,
                premium: game_data.features.Premium.active ? 1 : 0,
                world: game_data.world || 'Unknown',
            },
            success: () => {
                this.logMessage('First run registered', 'debug');
                this.saveValue('first_run', true);
            },
            error: () => this.logMessage('Failed to register script', 'error'),
        });
    }

    async countScriptRuns() {
        $.ajax({
            url: this.serverUrl + 'scripts/' + this.config.script_name + '/run',
            type: 'POST',
            data: { player: game_data.player.name },
            success: (response) => this.logMessage(`Total runs: ${response.count}`, 'info'),
            error: () => this.logMessage('Failed to count run', 'error'),
        });
    }

    async countScriptActions(counter) {
        $.ajax({
            url: this.serverUrl + 'scripts/' + this.config.script_name + '/action',
            type: 'POST',
            data: { counter, player: game_data.player.name },
            success: (response) => this.logMessage(`Total actions: ${response.counter}`, 'info'),
            error: () => this.logMessage('Failed to count actions', 'error'),
        });
    }

    random = {
        delay:  (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        number: (min, max) => Math.random() * (Number(max) - Number(min)) + Number(min),
    };

    unitPopulationCost = {
        spear: 1, sword: 1, axe: 1, archer: 1, spy: 2,
        light: 4, marcher: 5, heavy: 6, ram: 5, catapult: 8,
        knight: 10, snob: 100,
    };

    sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    botDetected() {
        const detected = ['#botprotection_quest', '#bot_check', '#popup_box_bot_protection']
            .some(sel => $(sel).length > 0);
        if (detected) this.logMessage('Bot detected', 'warn');
        return detected;
    }

    // localStorage prefixed by script_name to avoid key collisions between features
    saveValue(key, value) {
        localStorage.setItem(this.config.script_name + '_' + key, value);
    }

    getValue(key) {
        return localStorage.getItem(this.config.script_name + '_' + key);
    }

    getParameterByName(key) {
        return new URL(window.location.href).searchParams.get(key);
    }
}
