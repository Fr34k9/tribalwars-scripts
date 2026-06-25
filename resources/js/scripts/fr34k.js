export class Fr34kUtils {

    constructor(config) {
        this.serverUrl = 'https://tribalwars-scripts.fr34k.ch/api/';
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

    // --- API token helpers (shared key, not per-script) ---
    getToken()   { return localStorage.getItem('fr34k_api_token'); }
    saveToken(t) { localStorage.setItem('fr34k_api_token', t.trim()); }
    clearToken() { localStorage.removeItem('fr34k_api_token'); }
    authHeaders() { return { Authorization: 'Bearer ' + this.getToken() }; }

    showTokenSetup(prefill = '') {
        if (document.getElementById('fr34k-token-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'fr34k-token-modal';
        modal.style.cssText = [
            'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
            'background:rgba(0,0,0,0.65)', 'z-index:99999',
            'display:flex', 'align-items:center', 'justify-content:center',
        ].join(';');
        modal.innerHTML = `
            <div style="background:#f4e9c9;border:2px solid #7d510f;border-radius:6px;padding:24px;max-width:440px;width:90%;font-family:sans-serif;box-shadow:0 4px 24px rgba(0,0,0,0.4)">
                <h3 style="margin:0 0 8px;color:#4a2f07;font-size:16px">⚔️ Fr34k Scripts — API Token required</h3>
                <p style="margin:0 0 14px;color:#5a3a0a;font-size:13px">
                    To use Fr34k Scripts you need an active subscription and an API token.<br>
                    Get yours at <a href="https://tribalwars-scripts.fr34k.ch/dashboard" target="_blank" style="color:#7d510f;font-weight:bold">fr34k.ch/dashboard</a>.
                </p>
                <input id="fr34k-token-input" type="password" placeholder="Paste your API token here…"
                    style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #a07840;border-radius:4px;font-size:13px;background:#fffdf5;color:#333;margin-bottom:10px"
                    value="${prefill}" />
                <div style="display:flex;gap:8px">
                    <button id="fr34k-token-save"
                        style="flex:1;padding:8px 0;background:#7d510f;color:#fff;border:none;border-radius:4px;font-size:13px;cursor:pointer;font-weight:bold">
                        Save &amp; continue
                    </button>
                    <button id="fr34k-token-clear"
                        style="padding:8px 12px;background:#c0392b;color:#fff;border:none;border-radius:4px;font-size:13px;cursor:pointer"
                        title="Remove saved token">✕</button>
                </div>
                <p id="fr34k-token-error" style="color:#c0392b;font-size:12px;margin:8px 0 0;display:none"></p>
            </div>`;
        document.body.appendChild(modal);

        const input = document.getElementById('fr34k-token-input');
        const error = document.getElementById('fr34k-token-error');

        document.getElementById('fr34k-token-save').addEventListener('click', () => {
            const val = input.value.trim();
            if (!val) { error.textContent = 'Please paste your token first.'; error.style.display = 'block'; return; }
            this.saveToken(val);
            modal.remove();
            location.reload();
        });

        document.getElementById('fr34k-token-clear').addEventListener('click', () => {
            this.clearToken();
            input.value = '';
            error.textContent = 'Token cleared. Paste a new one to continue.';
            error.style.display = 'block';
        });
    }

    // Call from any feature's settings menu to let users update their token
    showTokenSettings() {
        document.getElementById('fr34k-token-modal')?.remove();
        this.showTokenSetup(this.getToken() || '');
    }

    // --- Script lifecycle ---

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
            headers: this.authHeaders(),
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
            statusCode: {
                401: () => { this.clearToken(); this.showTokenSetup(); },
                403: () => this.uiMessage('Fr34k Scripts: subscription expired. Visit fr34k.ch to renew.', 120),
            },
            error: (xhr) => { if (xhr.status !== 401 && xhr.status !== 403) this.logMessage('Failed to register script', 'error'); },
        });
    }

    async countScriptRuns() {
        $.ajax({
            url: this.serverUrl + 'scripts/' + this.config.script_name + '/run',
            type: 'POST',
            headers: this.authHeaders(),
            data: { player: game_data.player.name },
            success: (response) => this.logMessage(`Total runs: ${response.count}`, 'info'),
            statusCode: {
                401: () => { this.clearToken(); this.showTokenSetup(); },
                403: () => this.uiMessage('Fr34k Scripts: subscription expired. Visit fr34k.ch to renew.', 120),
            },
            error: (xhr) => { if (xhr.status !== 401 && xhr.status !== 403) this.logMessage('Failed to count run', 'error'); },
        });
    }

    async countScriptActions(counter) {
        $.ajax({
            url: this.serverUrl + 'scripts/' + this.config.script_name + '/action',
            type: 'POST',
            headers: this.authHeaders(),
            data: { counter, player: game_data.player.name },
            success: (response) => this.logMessage(`Total actions: ${response.counter}`, 'info'),
            statusCode: {
                401: () => { this.clearToken(); this.showTokenSetup(); },
                403: () => this.uiMessage('Fr34k Scripts: subscription expired. Visit fr34k.ch to renew.', 120),
            },
            error: (xhr) => { if (xhr.status !== 401 && xhr.status !== 403) this.logMessage('Failed to count actions', 'error'); },
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
