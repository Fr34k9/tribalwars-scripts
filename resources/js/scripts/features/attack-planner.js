import { Fr34kUtils } from '../fr34k.js';

export function run() {
    const utils = new Fr34kUtils({ script_name: 'attack_planner' });

    const DEFAULT_UNIT_SPEEDS = {
        spear: 18, sword: 22, axe: 18, archer: 18,
        spy: 9, light: 10, marcher: 10, heavy: 11,
        ram: 30, catapult: 30, knight: 10, snob: 35, militia: 18,
    };

    const POP_COST = {
        spear: 1, sword: 1, axe: 1, archer: 1, spy: 2,
        light: 4, marcher: 5, heavy: 6, ram: 5, catapult: 8,
        knight: 10, snob: 100, militia: 1,
    };

    const OFF_BOMB_MIN   = { axe: 500, light: 200, ram: 30 };  // catapult is optional top-up only
    const OFF_BOMB_MAX   = 1000;
    const OFF_BOMB_TOPUP = ['axe', 'light', 'marcher', 'heavy', 'catapult'];

    const OFF_MIN_AXE   = 5000;
    const OFF_MIN_LIGHT = 2000;
    const OFF_MIN_RAM   = 250;

    const NOBLE_MIN_LIGHT   = 100;  // each noble must have at least this many lights
    const NOBLE_SLOTS       = 4;    // always try to send 4 nobles per target
    const NOBLE_DELAY_MIN   = 10;   // ms between noble arrivals (min)
    const NOBLE_DELAY_MAX   = 100;  // ms between noble arrivals (max)
    const HEAVY_BEFORE_MIN  = 10000;   // 10 sec before first noble
    const HEAVY_BEFORE_MAX  = 60000;   // 60 sec before first noble

    const OFF_UNITS = ['axe', 'light', 'marcher', 'heavy', 'ram'];
    const ALL_UNITS = (game_data.units && game_data.units.length)
        ? game_data.units
        : ['spear','sword','axe','archer','spy','light','marcher','heavy','ram','catapult','knight','snob'];

    const NOBLE_FOLLOW_LIGHT = 20;  // lights sent with noble #2+

    const UNIT_DISPLAY_ORDER = ['snob','ram','axe','light','marcher','heavy','spy','spear','sword','archer','catapult','militia','knight'];
    const ATTACK_TYPE_LEAD   = { noble: 'snob', off: 'ram', 'off-bomb': 'axe', fake: 'spy' };
    const WB_ATTACK_TYPE     = { noble: 11, off: 4, 'off-bomb': 4, fake: 14 };

    const SETTING_KEYS = ['sendNobles','sendOffs','sendOffBombs','sendFakes','maxAttacksTo','maxAttacksFrom',
        'fakeUnits','fakesFromAtt','sendFrom','targetMode','targetInput','timeframes',
        'focusEnabled','focusCoords','focusRadius'];

    let worldSpeed = 1;
    let unitSpeeds = { ...DEFAULT_UNIT_SPEEDS };
    let _worldConfigFetched = false;
    let ownVillages = [];
    let plan = [];
    let _worldVillagesCache = null;
    let _playerDataCache    = null;
    let _autoSaveTimer      = null;
    let _loadedTargets    = [];
    let _loadedTimeframes = [];
    let _loadedSettings   = null;

    injectStyles();
    injectWidget();
    restoreSettings();
    bindEvents();

    const savedPlan = loadSavedPlan();
    if (savedPlan && savedPlan.length) {
        plan = savedPlan;
        renderPlanTable(plan);
        $('#ap-plan-table-wrap').show();
        const n = plan.filter(a => a.type==='noble').length;
        const o = plan.filter(a => a.type==='off').length;
        const b = plan.filter(a => a.type==='off-bomb').length;
        const f = plan.filter(a => a.type==='fake').length;
        setStatus(`Restored: ${plan.length} attacks — ${n} noble, ${o} off, ${b} off-bomb, ${f} fake.`);
    }

    // ========== STYLES ==========

    function injectStyles() {
        $('<style>').text(`
            #ap-widget { margin-top:10px; font-size:12px; color:#1a0a00; }
            /* ── Section boxes ── */
            .ap-section { border:1px solid #c8b57a; background:#f9f4e8; margin-bottom:6px; }
            .ap-section-head { display:flex; align-items:center; justify-content:space-between;
                padding:4px 8px; background:#e8d9b0; cursor:pointer; user-select:none;
                font-weight:bold; font-size:12px; color:#3a2800; border-bottom:1px solid #c8b57a; }
            .ap-section-head:hover { background:#ddd0a0; }
            .ap-section-body { padding:8px; }
            /* ── Compact settings grid ── */
            .ap-settings-grid { display:grid; grid-template-columns:max-content 1fr max-content 1fr; gap:4px 12px; align-items:center; }
            .ap-settings-grid label.ap-lbl { font-weight:bold; white-space:nowrap; font-size:11px; color:#4a3000; }
            .ap-settings-grid select, .ap-settings-grid input[type="number"],
            .ap-settings-grid input[type="text"], .ap-settings-grid input[type="datetime-local"] { font-size:11px; padding:1px 3px; }
            .ap-settings-grid .ap-span2 { grid-column: span 3; }
            #ap-timeframes .ap-tf-row { display:flex; align-items:center; gap:6px; margin-bottom:3px; flex-wrap:wrap; }
            /* ── Toolbar ── */
            .ap-toolbar { display:flex; align-items:center; gap:6px; flex-wrap:wrap; padding:6px 8px;
                background:#f0e8d0; border-bottom:1px solid #c8b57a; }
            .ap-toolbar .ap-troops-status { font-size:11px; color:#5a4020; flex:1; }
            /* ── Buttons ── */
            .ap-btn { display:inline-flex; align-items:center; gap:3px; padding:3px 8px;
                border:1px solid #a08050; background:#e8d4a0; color:#2a1800; font-size:11px;
                cursor:pointer; border-radius:2px; text-decoration:none; }
            .ap-btn:hover { background:#d4bc80; border-color:#806030; }
            .ap-btn:disabled { opacity:0.5; cursor:default; }
            .ap-btn-primary { background:#c8a840; border-color:#806020; font-weight:bold; }
            .ap-btn-primary:hover { background:#b09030; }
            .ap-btn-danger  { background:#e0c0b0; border-color:#a07060; color:#600; }
            .ap-btn-danger:hover { background:#d0a898; }
            /* ── Unit icons ── */
            .ap-unit-icon { width:20px; height:20px; vertical-align:middle; }
            .ap-fake-unit-label { display:inline-flex; align-items:center; gap:2px; margin-right:6px; cursor:pointer; }
            /* ── Assignment tables ── */
            .ap-assign-table { width:100%; border-collapse:collapse; font-size:11px; margin-bottom:8px; }
            .ap-assign-table th { background:#ddd0a0; padding:3px 6px; border:1px solid #c8b57a; text-align:left; font-size:11px; }
            .ap-assign-table td { padding:3px 6px; border:1px solid #ddd0b0; vertical-align:middle; background:#faf6ee; }
            .ap-assign-table tr:nth-child(even) td { background:#f2ead8; }
            .ap-assign-section-head { font-weight:bold; font-size:11px; color:#4a3000; margin:8px 0 4px 0; display:flex; align-items:center; gap:6px; }
            /* ── Plan table ── */
            #ap-plan-table-wrap { max-height:600px; overflow-y:auto; }
            #ap-plan-table { width:100%; border-collapse:collapse; font-size:11px; }
            #ap-plan-table th { background:#ddd0a0; padding:3px 6px; border:1px solid #c8b57a; text-align:center; font-weight:bold; }
            #ap-plan-table td { padding:3px 6px; border:1px solid #ddd0b0; text-align:center; background:#faf6ee; }
            #ap-plan-table tr:nth-child(even) td { background:#f2ead8; }
            #ap-plan-table .ap-target-header td { background:#ddd0a0; font-weight:bold; text-align:left; color:#2a1800; padding:4px 8px; border-top:2px solid #c8b57a; }
            .ap-badge { display:inline-block; padding:1px 5px; border-radius:2px; font-size:10px; font-weight:bold; }
            .ap-badge-noble    { background:#e8d080; color:#3a2800; border:1px solid #b09020; }
            .ap-badge-off      { background:#e0b0a0; color:#4a0000; border:1px solid #a06050; }
            .ap-badge-off-bomb { background:#e8c8a0; color:#3a1800; border:1px solid #a07040; }
            .ap-badge-fake     { background:#d8d8d0; color:#333; border:1px solid #aaa; }
            .ap-arrival-input  { font-family:monospace; font-size:11px; width:175px; padding:1px 3px; }
            #ap-plan-actions { display:flex; gap:6px; padding:6px 8px; border-top:1px solid #c8b57a; background:#f0e8d0; }
            /* ── Status bar ── */
            #ap-status { font-size:11px; color:#5a4020; padding:2px 8px; }
            #ap-save-indicator { font-size:10px; color:#888; margin-left:8px; }
            /* ── Modal ── */
            #ap-modal-overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; }
            #ap-modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#f9f4e8; border:1px solid #c8b57a; padding:16px; width:720px; max-height:80vh; overflow-y:auto; z-index:10000; }
            #ap-export-text { width:100%; height:260px; font-family:monospace; font-size:10px; }
        `).appendTo('head');
    }

    // ========== WIDGET HTML ==========

    function unitIcon(u, size=18) {
        return `<img src="/graphic/unit/unit_${u}.png" class="ap-unit-icon" style="width:${size}px;height:${size}px;" title="${u}" onerror="this.style.display='none'">`;
    }

    function injectWidget() {
        const tomorrow    = new Date(Date.now() + 86400000);
        const defaultFrom = formatDatetimeLocal(tomorrow);
        const defaultTo   = formatDatetimeLocal(new Date(tomorrow.getTime() + 3600000));

        const fakeUnitCheckboxes = ALL_UNITS.filter(u => u !== 'militia').map(u => {
            const checked = ['spear','sword','spy','catapult'].includes(u) ? ' checked' : '';
            return `<label class="ap-fake-unit-label" title="${u}"><input type="checkbox" class="ap-fake-unit-cb" value="${u}"${checked}>${unitIcon(u)}</label>`;
        }).join('');

        const widget = `
        <div id="ap-widget">

            <!-- ── Settings (collapsible, closed by default) ── -->
            <div class="ap-section">
                <div class="ap-section-head" id="ap-settings-toggle">
                    <span>⚙ Settings<span id="ap-save-indicator"></span></span>
                    <span id="ap-settings-arrow" style="font-size:10px;">▶</span>
                </div>
                <div id="ap-settings-content" style="display:none;">
                    <div class="ap-section-body">
                        <div class="ap-settings-grid">
                            <label class="ap-lbl">${unitIcon(game_data.units?.includes('snob')?'snob':'snob')} Nobles</label>
                            <select id="ap-nobles"><option value="1">Yes</option><option value="0">No</option></select>
                            <label class="ap-lbl">${unitIcon('axe')} Full Offs</label>
                            <div><select id="ap-offs"><option value="1">Yes</option><option value="0">No</option></select>
                                <small style="color:#888;"> ≥${OFF_MIN_AXE}${unitIcon('axe',14)} ≥${OFF_MIN_LIGHT}${unitIcon('light',14)} ≥${OFF_MIN_RAM}${unitIcon('ram',14)}</small></div>

                            <label class="ap-lbl">${unitIcon('ram')} Off-Bombs</label>
                            <div><select id="ap-off-bombs"><option value="1">Yes</option><option value="0">No</option></select>
                                <small style="color:#888;"> ≤${OFF_BOMB_MAX} units, min 500${unitIcon('axe',14)}200${unitIcon('light',14)}30${unitIcon('ram',14)}</small></div>
                            <label class="ap-lbl">${unitIcon('spy')} Fakes</label>
                            <select id="ap-fakes"><option value="1">Yes</option><option value="0">No</option></select>

                            <label class="ap-lbl">Fakes from off villages?</label>
                            <select id="ap-fakes-from-att"><option value="0">No</option><option value="1">Yes</option></select>
                            <label class="ap-lbl">Fake units</label>
                            <div>${fakeUnitCheckboxes} <small style="color:#888;">(1% village pts ÷ pop cost)</small></div>

                            <label class="ap-lbl">Max attacks to target</label>
                            <input type="number" id="ap-max-attacks-to" value="10" min="1" max="100" style="width:55px;">
                            <label class="ap-lbl">Max attacks from village</label>
                            <input type="number" id="ap-max-attacks-from" value="5" min="1" max="100" style="width:55px;">

                            <label class="ap-lbl">📅 Send from</label>
                            <div class="ap-span2"><input type="datetime-local" id="ap-send-from" step="1">
                                <small style="color:#888;"> earliest any attack may be sent</small></div>

                            <label class="ap-lbl">🕐 Arrival windows</label>
                            <div class="ap-span2">
                                <div id="ap-timeframes"></div>
                                <button id="ap-add-tf" class="ap-btn" style="margin-top:3px;">＋ Add window</button>
                            </div>

                        </div>
                        <div style="padding:4px 0 2px;">
                            <button id="ap-reset-settings-btn" class="ap-btn ap-btn-danger" style="font-size:11px;">↺ Reset Settings</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── Targets ── -->
            <div class="ap-section">
                <div class="ap-section-head" id="ap-targets-toggle">
                    <span>🎯 Targets</span>
                    <span id="ap-targets-arrow" style="font-size:10px;">▼</span>
                </div>
                <div id="ap-targets-content">
                    <div class="ap-section-body" style="padding-bottom:6px;">
                        <label style="margin-right:14px;font-size:11px;"><input type="radio" name="ap-target-mode" value="coords" checked> Coordinates <small style="color:#888;">(one per line, e.g. 500|500)</small></label>
                        <label style="font-size:11px;"><input type="radio" name="ap-target-mode" value="players"> Player names</label>
                        <textarea id="ap-targets-input" style="width:100%;height:80px;margin-top:5px;font-family:monospace;font-size:11px;box-sizing:border-box;border:1px solid #c8b57a;padding:4px;"
                            placeholder="500|500&#10;501|502"></textarea>
                        <div style="margin-top:6px;">
                            <label style="font-size:11px;font-weight:bold;">🎯 Off-focus area &nbsp;</label>
                            <label style="font-size:11px;"><input type="checkbox" id="ap-focus-enabled"> Enable</label>
                            &nbsp;Center: <input type="text" id="ap-focus-coords" placeholder="500|500" style="width:65px;font-family:monospace;font-size:11px;">
                            &nbsp;Radius: <input type="number" id="ap-focus-radius" value="5" min="1" max="500" style="width:50px;font-size:11px;"> fields
                            <small style="color:#888;"> — offs/nobles prioritise focus; fakes fill non-focus</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── Toolbar ── -->
            <div class="ap-toolbar">
                <span class="ap-troops-status" id="ap-troops-status">No troops loaded</span>
                <button id="ap-load-btn" class="ap-btn ap-btn-primary">⚔ Load Troops</button>
                <button id="ap-plan-btn" class="ap-btn ap-btn-primary">📋 Plan Attack</button>
                <button id="ap-reset-btn" class="ap-btn ap-btn-danger">↺ Clear Targets</button>
                <span id="ap-status"></span>
            </div>

            <!-- ── Assignment panel (shown after Plan click) ── -->
            <div id="ap-assign-panel" style="display:none;">
                <div class="ap-section">
                    <div class="ap-section-head">
                        <span>👑 Noble assignments</span>
                    </div>
                    <div class="ap-section-body" id="ap-assign-nobles-wrap"></div>
                </div>
                <div class="ap-section">
                    <div class="ap-section-head">
                        <span>🗡 Off assignments</span>
                    </div>
                    <div class="ap-section-body" id="ap-assign-offs-wrap"></div>
                </div>
                <div class="ap-toolbar">
                    <button id="ap-compute-btn" class="ap-btn ap-btn-primary">▶ Compute Plan</button>
                    <span id="ap-assign-status" style="font-size:11px;color:#5a4020;"></span>
                </div>
            </div>

            <!-- ── Plan table ── -->
            <div id="ap-plan-table-wrap" style="display:none;">
                <div class="ap-section">
                    <div class="ap-section-head">📊 Attack Plan</div>
                    <div id="ap-plan-table-wrap-inner">
                        <table id="ap-plan-table">
                            <thead><tr>
                                <th>#</th><th>Type</th><th>From</th>
                                <th style="text-align:left;">Units</th><th>Send at</th>
                                <th>Arrives at</th><th></th>
                            </tr></thead>
                            <tbody id="ap-plan-tbody"></tbody>
                        </table>
                    </div>
                </div>
                <div id="ap-plan-actions">
                    <button id="ap-export-btn" class="ap-btn">📥 Export to Workbench</button>
                    <button id="ap-clear-plan-btn" class="ap-btn ap-btn-danger">🗑 Clear Plan</button>
                </div>
            </div>
        </div>

        <div id="ap-modal-overlay">
            <div id="ap-modal">
                <div style="font-weight:bold;margin-bottom:6px;">📥 DS Workbench import format</div>
                <small style="color:#666;">One attack per line. Paste into DS Workbench → attack plan import.</small>
                <textarea id="ap-export-text" readonly style="margin-top:6px;"></textarea>
                <div style="margin-top:8px;display:flex;gap:6px;">
                    <button id="ap-copy-btn" class="ap-btn ap-btn-primary">Copy to Clipboard</button>
                    <button id="ap-close-modal" class="ap-btn">Close</button>
                </div>
            </div>
        </div>
        `;

        $('#map_legend').after(widget);
        addTimeframeRow(defaultFrom, defaultTo);
    }

    function addTimeframeRow(fromVal, toVal) {
        const rowId = 'ap-tf-' + Date.now();
        const row = `<div class="ap-tf-row" id="${rowId}">
            <span style="font-size:12px;">From:</span>
            <input type="datetime-local" class="ap-tf-from" value="${fromVal||''}" step="1">
            <span style="font-size:12px;">To:</span>
            <input type="datetime-local" class="ap-tf-to" value="${toVal||''}" step="1">
            <button class="btn ap-remove-tf" style="font-size:11px;">&#10005;</button>
        </div>`;
        $('#ap-timeframes').append(row);
        $(`#${rowId} .ap-remove-tf`).on('click', () => { $(`#${rowId}`).remove(); scheduleAutoSave(); });
    }

    // ========== EVENTS ==========

    function bindEvents() {
        $('#ap-settings-toggle').on('click', () => {
            $('#ap-settings-content').toggle();
            $('#ap-settings-arrow').text($('#ap-settings-content').is(':visible') ? '▼' : '▶');
        });
        $('#ap-targets-toggle').on('click', () => {
            $('#ap-targets-content').toggle();
            $('#ap-targets-arrow').text($('#ap-targets-content').is(':visible') ? '▼' : '▶');
        });
        $('#ap-add-tf').on('click', () => {
            const n = new Date();
            addTimeframeRow(formatDatetimeLocal(new Date(n.getTime()+86400000)), formatDatetimeLocal(new Date(n.getTime()+90000000)));
            scheduleAutoSave();
        });
        $('#ap-widget').on('change input', 'input, select, textarea', scheduleAutoSave);
        $('#ap-load-btn').on('click', onLoadTroops);
        $('#ap-plan-btn').on('click', onPlan);
        $('#ap-compute-btn').on('click', onComputePlan);
        $('#ap-reset-btn').on('click', onResetTargets);
        $('#ap-reset-settings-btn').on('click', onResetSettings);
        $('#ap-clear-plan-btn').on('click', () => {
            plan = []; utils.saveValue('savedPlan', '');
            $('#ap-plan-table-wrap').hide(); setStatus('Plan cleared.');
        });
        $('#ap-export-btn').on('click', () => {
            $('#ap-export-text').val(plan.map(buildWorkbenchLine).join('\n'));
            $('#ap-modal-overlay').show();
        });
        $('#ap-copy-btn').on('click', () => {
            const ta = document.getElementById('ap-export-text');
            ta.select(); ta.setSelectionRange(0, 99999); document.execCommand('copy'); utils.uiMessage('Copied!', 3);
        });
        $('#ap-close-modal').on('click', () => $('#ap-modal-overlay').hide());
        $('#ap-modal-overlay').on('click', e => { if ($(e.target).is('#ap-modal-overlay')) $('#ap-modal-overlay').hide(); });

        $('#ap-plan-tbody').on('change', '.ap-arrival-input', function() {
            const idx        = parseInt($(this).data('idx'));
            const newArrival = new Date($(this).val());
            if (isNaN(newArrival.getTime()) || idx < 0 || idx >= plan.length) return;
            plan[idx].arrivalTime = newArrival;
            plan[idx].sendTime    = new Date(newArrival.getTime() - plan[idx].travelMs);
            $(this).closest('tr').find(`[data-send-idx="${idx}"]`).text(formatSendTime(plan[idx].sendTime));
            $(this).closest('tr').find(`[data-attack-idx="${idx}"]`).attr('href', buildAttackUrl(plan[idx]));
            savePlan(plan);
        });
    }

    function scheduleAutoSave() {
        clearTimeout(_autoSaveTimer);
        _autoSaveTimer = setTimeout(() => {
            saveSettings();
            $('#ap-save-indicator').text('✓ saved').show().delay(1500).fadeOut();
        }, 500);
    }

    // ========== LOAD PHASE ==========

    async function onLoadTroops() {
        $('#ap-load-btn').prop('disabled', true).text('Loading...');
        try {
            setStatus('Fetching world config...');
            await fetchWorldConfig();

            setStatus('Fetching own village troops...');
            ownVillages = await fetchOwnVillages();
            if (!ownVillages.length) { setStatus('No own villages found — see browser console (F12).'); return; }

            setStatus(`Troops loaded: ${ownVillages.length} villages.`);
            $('#ap-troops-status').text(`${ownVillages.length} villages loaded`);
            utils.saveValue('cachedTroops', JSON.stringify(ownVillages.map(v => ({ id: v.id, name: v.name, x: v.x, y: v.y, troops: v.troops, points: v.points, isOffensive: v.isOffensive }))));
        } catch (err) {
            setStatus('Error loading troops: ' + err.message); console.error(err);
        } finally {
            $('#ap-load-btn').prop('disabled', false).text('⚔ Load Troops');
        }
    }

    async function onPlan() {
        if (!ownVillages.length) {
            const cached = utils.getValue('cachedTroops');
            if (cached) {
                try { ownVillages = JSON.parse(cached); } catch(e) {}
            }
            if (!ownVillages.length) { setStatus('Load troops first.'); return; }
        }

        $('#ap-plan-btn').prop('disabled', true).text('Planning...');
        $('#ap-assign-panel').hide();

        try {
            setStatus('Resolving targets...');
            _loadedTargets = await resolveTargets();
            if (!_loadedTargets.length) { setStatus('No targets found. Check your input.'); return; }

            _loadedTimeframes = getTimeframes();
            if (!_loadedTimeframes.length) { setStatus('Add at least one valid future timeframe.'); return; }

            _loadedSettings = getSettings();
            setStatus(`${ownVillages.length} villages, ${_loadedTargets.length} targets.`);

            showAssignmentPanel(ownVillages, _loadedTargets, _loadedSettings);
            $('#ap-assign-panel').show();
        } catch (err) {
            setStatus('Error: ' + err.message); console.error(err);
        } finally {
            $('#ap-plan-btn').prop('disabled', false).text('📋 Plan Attack');
        }
    }

    // ========== ASSIGNMENT PANEL ==========

    // Returns true if village can reach target within at least one loaded timeframe (respects sendFrom)
    function canReach(village, target, unitList) {
        const tms        = calcTravelMs(village, target, unitList);
        const sendFromMs = (_loadedSettings && _loadedSettings.sendFromMs) || 0;
        const base       = Math.max(Date.now() + 1000, sendFromMs);
        return (_loadedTimeframes || []).some(tf => (base + tms) < tf.to.getTime());
    }

    function showAssignmentPanel(villages, targets, settings) {
        const nobleVillages = villages.filter(v => (v.troops.snob || 0) >= 1);
        const offVillages   = villages.filter(v => v.isOffensive);

        // ---- Noble assignment: one row per OWN VILLAGE, one dropdown → all snobs in that village attack that target ----
        let nHtml = '';
        if (settings.sendNobles) {
            if (nobleVillages.length) {
                const NOBLE_UNITS = ['snob', 'light'];
                // Pre-select: prefer reachable focus targets, then reachable nearest, fall back to nearest
                const getPreselect = (v) => {
                    const reachable = targets.filter(t => canReach(v, t, NOBLE_UNITS));
                    const pool      = settings.focusEnabled
                        ? reachable.filter(t => targetInFocus(t, settings))
                        : reachable;
                    const sorted = (pool.length ? pool : reachable.length ? reachable : targets)
                        .slice().sort((a,b) =>
                            Math.sqrt((v.x-a.x)**2+(v.y-a.y)**2) - Math.sqrt((v.x-b.x)**2+(v.y-b.y)**2)
                        );
                    return sorted[0]?.coords || '';
                };
                const rows = nobleVillages.map(v => {
                    const snobCount   = v.troops.snob || 0;
                    const preselect   = getPreselect(v);
                    const noReachable = !targets.some(t => canReach(v, t, NOBLE_UNITS));
                    const lightWarn   = (v.troops.light||0) < NOBLE_MIN_LIGHT
                        ? `<br><small style="color:#c00;">⚠ Only ${v.troops.light||0} light — escort insufficient (need ${NOBLE_MIN_LIGHT})</small>` : '';
                    const isOff       = v.isOffensive ? `<br><small style="color:#080;">&#128312; Also an off village — full off travels with first noble</small>` : '';
                    const unreachWarn = noReachable ? `<br><small style="color:#c00;">⚠ Cannot reach any target within timeframe</small>` : '';
                    const opts = `<option value="">— None —</option>` + targets.map(t => {
                        const focusTag   = (settings.focusEnabled && targetInFocus(t, settings)) ? ' ★' : '';
                        const reachable  = canReach(v, t, NOBLE_UNITS);
                        const unreachTag = reachable ? '' : ' ⚠ too far';
                        return `<option value="${t.coords}" ${t.coords===preselect?'selected':''} ${reachable?'':'style="color:#999;"'}>${t.name||t.coords} (${t.coords})${focusTag}${unreachTag}</option>`;
                    }).join('');
                    return `<tr ${noReachable ? 'style="opacity:0.6;"' : ''}>
                        <td style="white-space:nowrap;vertical-align:middle;padding:4px 8px;">
                            <b>${v.name}</b><br><small style="color:#777;">${v.coords}</small>
                            <br><small>${snobCount} snob, ${v.troops.light||0} light</small>
                            ${lightWarn}${isOff}${unreachWarn}
                        </td>
                        <td style="vertical-align:middle;padding:4px 8px;">
                            <select class="ap-noble-select" data-vid="${v.id}" style="font-size:11px;width:200px;">${opts}</select>
                            <br><small style="color:#888;">All ${snobCount} noble(s) will attack this target, staggered 10–100ms apart.</small>
                        </td>
                    </tr>`;
                }).join('');

                nHtml = `
                <h5>&#128081; Noble Assignments — select one target per village (all snobs from that village attack it)</h5>
                <p style="font-size:11px;color:#555;margin:2px 0 6px 0;">
                    Each noble is sent as a separate attack with light escort (≥${NOBLE_MIN_LIGHT} required), staggered 10–100ms.
                    If an off village sends nobles to the same target as its off assignment, the full off travels with the first noble.
                </p>
                <table style="border-collapse:collapse;">
                    <thead><tr><th>Village</th><th>Attack Target</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>`;
            } else {
                nHtml = `<p style="font-size:12px;color:#888;">No villages with snobs found.</p>`;
            }
        }

        // ---- Off assignment: one row per VILLAGE, one target dropdown ----
        let oHtml = '';
        if (settings.sendOffs) {
            if (offVillages.length) {
                // When focus is enabled, pre-distribute offs to focus targets only
                const focusTargets = settings.focusEnabled ? targets.filter(t => targetInFocus(t, settings)) : targets;
                const defaultOffAssign = autoDistributeOffs(offVillages, focusTargets.length ? focusTargets : targets);
                const rows = offVillages.map(v => {
                    const noReachable = !targets.some(t => canReach(v, t, OFF_UNITS));
                    const opts = `<option value="">— None —</option>` + targets.map(t => {
                        const focusTag     = (settings.focusEnabled && targetInFocus(t, settings)) ? ' ★' : '';
                        const reachable    = canReach(v, t, OFF_UNITS);
                        const unreachTag   = reachable ? '' : ' ⚠ too far';
                        return `<option value="${t.coords}" ${defaultOffAssign[v.id]===t.coords?'selected':''} ${reachable?'':'style="color:#999;"'}>${t.name||t.coords} (${t.coords})${focusTag}${unreachTag}</option>`;
                    }).join('');
                    const unreachWarn = noReachable ? `<br><small style="color:#c00;">⚠ Cannot reach any target within timeframe</small>` : '';
                    return `<tr ${noReachable ? 'style="opacity:0.6;"' : ''}>
                        <td style="white-space:nowrap;"><b>${v.name}</b><br><small style="color:#777;">${v.coords}</small>${unreachWarn}</td>
                        <td style="text-align:right;">${(v.troops.axe||0).toLocaleString()}</td>
                        <td style="text-align:right;">${(v.troops.light||0).toLocaleString()}</td>
                        <td style="text-align:right;">${(v.troops.ram||0).toLocaleString()}</td>
                        <td><select class="ap-off-select" data-vid="${v.id}" style="width:100%;">${opts}</select></td>
                    </tr>`;
                }).join('');
                oHtml = `
                <h5>&#128308; Off Assignments — each village attacks one target (pre-distributed by nearest/balanced)</h5>
                <div style="overflow-x:auto;">
                <table>
                    <thead><tr><th>Village</th><th>Axe</th><th>Light</th><th>Ram</th><th>Attack Target</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                </div>`;
            } else {
                oHtml = `<p style="font-size:12px;color:#888;">No offensive villages (need ≥${OFF_MIN_AXE} axe, ≥${OFF_MIN_LIGHT} light, ≥${OFF_MIN_RAM} ram).</p>`;
            }
        }

        if (!nHtml && !oHtml) {
            oHtml = `<p style="font-size:12px;color:#888;">No noble or off assignments to configure. Off-bombs and fakes will be auto-distributed.</p>`;
        }

        $('#ap-assign-nobles-wrap').html(nHtml);
        $('#ap-assign-offs-wrap').html(oHtml);
        $('#ap-assign-status').text('');
    }

    function autoDistributeOffs(offVillages, targets) {
        if (!targets.length) return {};
        const counts = {};
        targets.forEach(t => { counts[t.coords] = 0; });
        const result = {};
        offVillages.forEach(v => {
            // Only consider targets this village can actually reach in time
            const reachable = targets.filter(t => canReach(v, t, OFF_UNITS));
            const pool      = reachable.length ? reachable : targets; // fall back to all if none reachable (shows warning)
            let best = null, bestScore = Infinity;
            pool.forEach(t => {
                const dist  = Math.sqrt((v.x-t.x)**2 + (v.y-t.y)**2);
                const score = counts[t.coords] * 100000 + dist;
                if (score < bestScore) { bestScore = score; best = t; }
            });
            if (best) {
                result[v.id] = reachable.length ? best.coords : null; // null = unreachable, leave unassigned
                if (reachable.length) counts[best.coords]++;
            }
        });
        return result;
    }

    // ========== COMPUTE PHASE ==========

    function onComputePlan() {
        // Read noble assignments: villageId → targetCoords|null (one select per village, all snobs go there)
        const nobleAssign = {};
        $('.ap-noble-select').each(function() {
            nobleAssign[parseInt($(this).data('vid'))] = $(this).val() || null;
        });

        // Read off assignments: villageId → targetCoords|null
        const offAssign = {};
        $('.ap-off-select').each(function() {
            offAssign[parseInt($(this).data('vid'))] = $(this).val() || null;
        });

        $('#ap-compute-btn').prop('disabled', true).text('Computing...');
        try {
            plan = computePlan(_loadedTargets, _loadedTimeframes, _loadedSettings, { nobles: nobleAssign, offs: offAssign });
            if (!plan.length) {
                $('#ap-assign-status').text('No attacks planned. Check troop counts or assignments.');
                return;
            }
            renderPlanTable(plan, _loadedSettings);
            savePlan(plan);
            $('#ap-plan-table-wrap').show();
            const n = plan.filter(a => a.type==='noble').length;
            const o = plan.filter(a => a.type==='off').length;
            const b = plan.filter(a => a.type==='off-bomb').length;
            const f = plan.filter(a => a.type==='fake').length;
            setStatus(`Plan: ${plan.length} attacks — ${n} noble, ${o} off, ${b} off-bomb, ${f} fake.`);
            utils.finishScript(plan.length);
            document.getElementById('ap-plan-table-wrap').scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            setStatus('Error: ' + err.message); console.error(err);
        } finally {
            $('#ap-compute-btn').prop('disabled', false).text('⟳ Compute Plan');
        }
    }

    // ========== DATA FETCHING ==========

    async function fetchWorldConfig() {
        if (_worldConfigFetched) return;
        try {
            const [configXml, unitXml] = await Promise.all([
                $.get('/interface.php?func=get_config'),
                $.get('/interface.php?func=get_unit_info'),
            ]);
            const parser = new DOMParser();
            const cfgDoc = parser.parseFromString(configXml, 'text/xml');
            const speedEl = cfgDoc.querySelector('speed');
            if (speedEl) { const s = parseFloat(speedEl.textContent); if (!isNaN(s) && s > 0) worldSpeed = s; }
            const uiDoc = parser.parseFromString(unitXml, 'text/xml');
            ALL_UNITS.forEach(u => {
                const el = uiDoc.querySelector(`${u} speed`); const spd = el ? parseInt(el.textContent) : NaN;
                if (!isNaN(spd) && spd > 0) unitSpeeds[u] = spd;
            });
            _worldConfigFetched = true;
        } catch (e) { utils.logMessage('World config failed: ' + e, 'warn'); }
    }

    async function fetchOwnVillages() {
        const villages = [];
        let page = 0, totalPages = 1;
        const parser = new DOMParser();
        while (page < totalPages) {
            const html = await $.get(`/game.php?village=${game_data.village.id}&screen=overview_villages&mode=units&type=complete&page=${page}`);
            const doc  = parser.parseFromString(html, 'text/html');
            if (page === 0) {
                let lp = 1;
                doc.querySelectorAll('.paged-nav-item').forEach(el => {
                    const n = parseInt(el.textContent.replace(/\[|\]/g,'').trim());
                    if (!isNaN(n) && n > lp) lp = n;
                });
                totalPages = lp;
            }
            const table = doc.querySelector('#units_table');
            if (!table) { page++; if (page < totalPages) await utils.sleep(300); continue; }
            table.querySelectorAll('tbody.row_marker').forEach(tbody => {
                const vn = tbody.querySelector('.quickedit-vn'); if (!vn) return;
                const villageId = parseInt(vn.getAttribute('data-id'));
                if (!villageId || villages.some(v => v.id === villageId)) return;
                const label = vn.querySelector('.quickedit-label') || vn;
                const lt    = label.textContent.trim();
                const cm    = lt.match(/\((\d+)\|(\d+)\)/); if (!cm) return;
                const x = parseInt(cm[1]), y = parseInt(cm[2]);
                const name  = lt.replace(/\s*\(\d+\|\d+\).*$/,'').trim() || `Village ${villageId}`;
                const ownRow = tbody.querySelector('tr'); if (!ownRow) return;
                const items  = ownRow.querySelectorAll('td.unit-item');
                const troops = {};
                ALL_UNITS.forEach((u, i) => { troops[u] = parseInt(items[i]?.textContent?.trim()) || 0; });
                const isOffensive = (troops.axe||0) >= OFF_MIN_AXE && (troops.light||0) >= OFF_MIN_LIGHT && (troops.ram||0) >= OFF_MIN_RAM;
                villages.push({ id: villageId, name, x, y, coords: `${x}|${y}`, troops, remainingTroops: {...troops}, points: 0, isOffensive });
            });
            page++; if (page < totalPages) await utils.sleep(300);
        }
        try {
            const wv = await fetchWorldVillages();
            const pm = {}; wv.forEach(v => { pm[v.id] = v.points; });
            villages.forEach(v => { v.points = pm[v.id] || 0; });
        } catch(e) {}
        return villages;
    }

    async function resolveTargets() {
        const mode  = $('input[name="ap-target-mode"]:checked').val();
        const input = $('#ap-targets-input').val().trim();
        if (!input) return [];
        return mode === 'coords' ? resolveByCoords(input) : resolveByPlayers(input);
    }

    async function resolveByCoords(text) {
        const wv = await fetchWorldVillages();
        const bc = {}; wv.forEach(v => { bc[`${v.x}|${v.y}`] = v; });
        const targets = [], seen = new Set();
        text.split('\n').forEach(line => {
            const raw = line.trim().replace(/\s+/g,'|'); if (!raw.includes('|')) return;
            const [xs, ys] = raw.split('|'); const x = parseInt(xs), y = parseInt(ys);
            if (isNaN(x)||isNaN(y)) return;
            const key = `${x}|${y}`; if (seen.has(key)) return; seen.add(key);
            targets.push(bc[key] || { id: null, name: key, x, y, coords: key, points: 0 });
        });
        return targets;
    }

    async function resolveByPlayers(text) {
        const [wv, players] = await Promise.all([fetchWorldVillages(), fetchPlayerData()]);
        const byPid = {}; wv.forEach(v => { (byPid[v.playerId] = byPid[v.playerId]||[]).push(v); });
        const targets = [], seen = new Set();
        text.split('\n').forEach(line => {
            const name = line.trim(); if (!name) return;
            const player = players.find(p => p.name.toLowerCase() === name.toLowerCase()); if (!player) return;
            (byPid[player.id]||[]).forEach(v => { if (seen.has(v.coords)) return; seen.add(v.coords); targets.push(v); });
        });
        return targets;
    }

    async function fetchWorldVillages() {
        if (_worldVillagesCache) return _worldVillagesCache;
        const r = await $.get('/map/village.txt');
        const v = [];
        r.split('\n').forEach(line => {
            if (!line.trim()) return; const p = line.split(','); if (p.length < 6) return;
            v.push({ id: parseInt(p[0]), name: decodeURIComponent(p[1].replace(/\+/g,' ')),
                x: parseInt(p[2]), y: parseInt(p[3]), playerId: parseInt(p[4]),
                points: parseInt(p[5]), coords: `${p[2]}|${p[3]}` });
        });
        _worldVillagesCache = v; return v;
    }

    async function fetchPlayerData() {
        if (_playerDataCache) return _playerDataCache;
        const r = await $.get('/map/player.txt');
        const p = [];
        r.split('\n').forEach(line => {
            if (!line.trim()) return; const a = line.split(','); if (a.length < 2) return;
            p.push({ id: parseInt(a[0]), name: decodeURIComponent(a[1].replace(/\+/g,' ')) });
        });
        _playerDataCache = p; return p;
    }

    // ========== SETTINGS ==========

    function getSettings() {
        const focusEnabled  = $('#ap-focus-enabled').is(':checked');
        const focusCoords   = $('#ap-focus-coords').val().trim();
        const focusRadius   = parseInt($('#ap-focus-radius').val()) || 5;
        const [fx, fy]      = focusCoords.includes('|') ? focusCoords.split('|').map(Number) : [NaN, NaN];
        const sendFromRaw   = $('#ap-send-from').val();
        const sendFromDate  = sendFromRaw ? new Date(sendFromRaw) : null;
        const sendFromMs    = sendFromDate && !isNaN(sendFromDate) ? sendFromDate.getTime() : null;
        return {
            sendNobles:         $('#ap-nobles').val() === '1',
            sendOffs:           $('#ap-offs').val() === '1',
            sendOffBombs:       $('#ap-off-bombs').val() === '1',
            sendFakes:          $('#ap-fakes').val() === '1',
            maxAttacksTo:       parseInt($('#ap-max-attacks-to').val())   || 10,
            maxAttacksFrom:     parseInt($('#ap-max-attacks-from').val()) || 5,
            fakeUnits:          $('.ap-fake-unit-cb:checked').map(function(){ return $(this).val(); }).get(),
            fakesFromAttacking: $('#ap-fakes-from-att').val() === '1',
            sendFromMs,
            focusEnabled:       focusEnabled && !isNaN(fx) && !isNaN(fy),
            focusCx:            fx, focusCy: fy, focusRadius,
        };
    }

    function getTimeframes() {
        const now = new Date();
        const tfs = [];
        $('.ap-tf-row').each(function() {
            const from = new Date($(this).find('.ap-tf-from').val());
            const to   = new Date($(this).find('.ap-tf-to').val());
            if (isNaN(from)||isNaN(to)||to<=from||to<=now) return;
            tfs.push({ from: from>now ? from : now, to });
        });
        return tfs;
    }

    // ========== ALGORITHM ==========

    function computePlan(targets, timeframes, settings, assignments) {
        const villages = ownVillages.map(v => ({ ...v, remainingTroops: {...v.troops}, usedInOff: false }));
        const byId     = {};
        villages.forEach(v => { byId[v.id] = v; });
        const byCoords = {};
        targets.forEach(t => { byCoords[t.coords] = t; });

        const now = new Date();
        const attacks = [];
        const toTargetCount    = {};
        const fromVillageCount = {};
        // Track last noble arrival per target — offs/off-bombs must arrive before this
        const lastNobleMs = {};
        let fromMs_ref = 0;

        const addAttack = (atk) => {
            toTargetCount[atk.toVillage.coords]  = (toTargetCount[atk.toVillage.coords]  || 0) + 1;
            fromVillageCount[atk.fromVillage.id] = (fromVillageCount[atk.fromVillage.id] || 0) + 1;
            attacks.push(atk);
        };
        const canAddTo   = (tc, s) => (toTargetCount[tc]               || 0) < s.maxAttacksTo;
        const canAddFrom = (id, s) => (fromVillageCount[id]             || 0) < s.maxAttacksFrom;

        // Earliest arrival for a given travel time, respecting sendFrom
        const earliestArrival = (tms) => {
            const base = Math.max(now.getTime() + 1000, settings.sendFromMs || 0);
            return Math.max(fromMs_ref, base + tms);
        };

        timeframes.forEach(({ from, to }) => {
            const fromMs = from.getTime(), toMs = to.getTime();
            fromMs_ref = fromMs; // update closure for earliestArrival

            const focusTargets    = settings.focusEnabled ? targets.filter(t => targetInFocus(t, settings)) : targets;
            const nonFocusTargets = settings.focusEnabled ? targets.filter(t => !targetInFocus(t, settings)) : [];

            // ---- Phase 1: Nobles (all snobs from a village → one target, staggered 10–100ms) ----
            if (settings.sendNobles) {
                const noblesPerTarget = {}; // tCoords → count sent so far across all villages
                Object.entries(assignments.nobles).forEach(([vidStr, tCoords]) => {
                    if (!tCoords) return;
                    const v = byId[parseInt(vidStr)]; if (!v) return;
                    const alreadySent = noblesPerTarget[tCoords] || 0;
                    const slotsLeft   = NOBLE_SLOTS - alreadySent;
                    if (slotsLeft <= 0) return;
                    let snobsLeft = Math.min(v.remainingTroops.snob || 0, slotsLeft); if (!snobsLeft) return;
                    const target = byCoords[tCoords]; if (!target) return;

                    // Noble #1 carries all off troops (reserving 20 lights per subsequent noble + per-fake-unit reservation).
                    // Nobles #2+ carry 20 lights each.
                    // Travel time for noble chain: use slowest unit the first noble will carry.
                    const noblesAfter       = snobsLeft - 1;
                    const lightsForFollowers = noblesAfter * NOBLE_FOLLOW_LIGHT;
                    const lightAvail        = v.remainingTroops.light || 0;
                    const lightForFirst     = Math.max(0, lightAvail - lightsForFollowers);

                    // First noble brings all off units (with reserved-light adjustment) → its travel time is governed by slowest off unit
                    const firstUnits = {};
                    OFF_UNITS.forEach(u => {
                        const avail = v.remainingTroops[u] || 0; if (!avail) return;
                        firstUnits[u] = u === 'light' ? lightForFirst : avail;
                    });
                    // If the village has no off troops at all, first noble just carries whatever light is available
                    if (!hasOffUnits(firstUnits) && lightAvail > 0) {
                        firstUnits.light = Math.max(0, lightAvail - lightsForFollowers);
                    }

                    const firstUnitList = Object.keys(firstUnits).filter(u => (firstUnits[u]||0) > 0);
                    const tmsFirst  = firstUnitList.length
                        ? calcTravelMs(v, target, firstUnitList)
                        : calcTravelMs(v, target, ['snob']);
                    const tmsFollow = calcTravelMs(v, target, ['snob', 'light']);
                    const maxTms    = Math.max(tmsFirst, tmsFollow);

                    const windowMin = earliestArrival(maxTms);
                    if (windowMin >= toMs - snobsLeft * NOBLE_DELAY_MAX) return;

                    const baseArrivalMs = randMs(windowMin, toMs - snobsLeft * NOBLE_DELAY_MAX);
                    let prevArrivalMs   = baseArrivalMs;

                    for (let i = 0; i < snobsLeft; i++) {
                        if ((v.remainingTroops.snob || 0) < 1) break;
                        if (!canAddTo(tCoords, settings) || !canAddFrom(v.id, settings)) break;

                        const isFirst   = i === 0;
                        const arrivalMs = isFirst
                            ? baseArrivalMs
                            : prevArrivalMs + Math.floor(Math.random() * (NOBLE_DELAY_MAX - NOBLE_DELAY_MIN + 1)) + NOBLE_DELAY_MIN;
                        prevArrivalMs = arrivalMs;

                        const tms         = isFirst ? tmsFirst : tmsFollow;
                        const arrivalTime = new Date(arrivalMs);
                        const sendTime    = new Date(arrivalMs - tms);
                        if (sendTime <= now || isInSleepWindow(arrivalTime, settings)) continue;

                        let units;
                        if (isFirst) {
                            units = { ...firstUnits, snob: 1 };
                            // Mark off assignment consumed so Phase 2 doesn't double-send
                            if (assignments.offs[v.id] === tCoords) assignments.offs[v.id] = null;
                        } else {
                            const followEscort = buildFollowEscort(v.remainingTroops);
                            if (!followEscort) break; // no lights left for this noble
                            units = { ...followEscort, snob: 1 };
                        }

                        deduct(v.remainingTroops, units);
                        v.usedInOff = true;
                        addAttack({ type: 'noble',
                            fromVillage: { id: v.id, name: v.name, x: v.x, y: v.y },
                            toVillage:   toVillageObj(target, tCoords),
                            units, travelMs: tms, sendTime, arrivalTime });

                        noblesPerTarget[tCoords] = (noblesPerTarget[tCoords] || 0) + 1;
                        lastNobleMs[tCoords] = arrivalMs; // track last noble per target
                    }
                });
            }

            // Helper: send a full off from village v to target (never after last noble to that target)
            const sendOff = (v, target) => {
                const tCoords    = target.coords;
                if (!hasOffUnits(v.remainingTroops)) return;
                const tms        = calcTravelMs(v, target, OFF_UNITS);
                const earliest   = earliestArrival(tms);
                // Must arrive before the last noble to this target (if any)
                const ceiling    = lastNobleMs[tCoords] ? lastNobleMs[tCoords] - 1 : toMs;
                if (earliest >= ceiling || !canAddTo(tCoords, settings) || !canAddFrom(v.id, settings)) return;
                const arrivalMs   = randMs(earliest, ceiling);
                const arrivalTime = new Date(arrivalMs);
                if (isInSleepWindow(arrivalTime, settings)) return;
                const units = {};
                OFF_UNITS.forEach(u => { if ((v.remainingTroops[u]||0)>0) units[u]=v.remainingTroops[u]; });
                deduct(v.remainingTroops, units); v.usedInOff = true;
                addAttack({ type: 'off',
                    fromVillage: { id: v.id, name: v.name, x: v.x, y: v.y },
                    toVillage: toVillageObj(target, tCoords),
                    units, travelMs: tms, sendTime: new Date(arrivalMs-tms), arrivalTime });
            };

            // ---- Phase 2: Full offs — assigned targets (focus targets respected via UI pre-distribution) ----
            if (settings.sendOffs) {
                villages.filter(v => v.isOffensive && hasOffUnits(v.remainingTroops)).forEach(v => {
                    const assignedCoords = assignments.offs[v.id]; if (!assignedCoords) return;
                    const target = byCoords[assignedCoords]; if (!target) return;
                    sendOff(v, target);
                });
            }

            // ---- Phase 2b: Leftover offs → non-focus targets (when focus is enabled) ----
            if (settings.sendOffs && settings.focusEnabled && nonFocusTargets.length) {
                villages.filter(v => v.isOffensive && hasOffUnits(v.remainingTroops) && !v.usedInOff).forEach(v => {
                    // Find best non-focus target (nearest with capacity)
                    const best = nonFocusTargets
                        .filter(t => canAddTo(t.coords, settings))
                        .sort((a, b) => Math.sqrt((v.x-a.x)**2+(v.y-a.y)**2) - Math.sqrt((v.x-b.x)**2+(v.y-b.y)**2))[0];
                    if (best) sendOff(v, best);
                });
            }

            // ---- Phase 3: Off-bombs — focus targets first, then non-focus ----
            if (settings.sendOffBombs) {
                const bombTargetOrder = [...focusTargets, ...nonFocusTargets];
                bombTargetOrder.forEach(target => {
                    const tCoords = target.coords;
                    villages.map(v => ({ v, tms: calcTravelMs(v, target, OFF_UNITS) }))
                        .filter(({ v, tms }) => {
                            if (!settings.fakesFromAttacking && v.usedInOff) return false;
                            if (!buildOffBomb(v.remainingTroops)) return false;
                            const earliest = earliestArrival(tms);
                            return earliest < toMs && canAddTo(tCoords, settings) && canAddFrom(v.id, settings);
                        })
                        .sort((a, b) => a.tms - b.tms)
                        .forEach(({ v, tms }) => {
                            if (!canAddTo(tCoords, settings) || !canAddFrom(v.id, settings)) return;
                            const units = buildOffBomb(v.remainingTroops); if (!units) return;
                            const earliest    = earliestArrival(tms);
                            // Must arrive before last noble to this target (if any)
                            const ceiling     = lastNobleMs[tCoords] ? lastNobleMs[tCoords] - 1 : toMs;
                            if (earliest >= ceiling) return;
                            const arrivalMs   = randMs(earliest, ceiling);
                            const arrivalTime = new Date(arrivalMs);
                            if (isInSleepWindow(arrivalTime, settings)) return;
                            deduct(v.remainingTroops, units); v.usedInOff = true;
                            addAttack({ type: 'off-bomb',
                                fromVillage: { id: v.id, name: v.name, x: v.x, y: v.y },
                                toVillage: toVillageObj(target, tCoords),
                                units, travelMs: tms,
                                sendTime: new Date(arrivalMs-tms), arrivalTime });
                        });
                });
            }

            // ---- Phase 4: Fakes — non-focus first (focus only if no focus or to fill remaining capacity) ----
            if (settings.sendFakes && settings.fakeUnits.length) {
                const fakeTargetOrder = settings.focusEnabled
                    ? [...nonFocusTargets, ...focusTargets]
                    : targets;
                fakeTargetOrder.forEach(target => {
                    const tCoords = target.coords;
                    villages.forEach(v => {
                        if (!canAddTo(tCoords, settings) || !canAddFrom(v.id, settings)) return;
                        if (!settings.fakesFromAttacking && v.usedInOff) return;
                        const tms      = calcTravelMs(v, target, settings.fakeUnits);
                        const earliest = earliestArrival(tms);
                        if (earliest >= toMs) return;
                        const arrivalMs   = randMs(earliest, toMs);
                        const arrivalTime = new Date(arrivalMs);
                        if (isInSleepWindow(arrivalTime, settings)) return;
                        const fakeN = calcFakeSize(v.points, settings.fakeUnits);
                        const units = {}; let canSend = true;
                        settings.fakeUnits.forEach(u => {
                            const avail = v.remainingTroops[u] || 0;
                            if (avail >= fakeN) units[u] = fakeN; else canSend = false;
                        });
                        if (!canSend) return;
                        deduct(v.remainingTroops, units);
                        addAttack({ type: 'fake',
                            fromVillage: { id: v.id, name: v.name, x: v.x, y: v.y },
                            toVillage: toVillageObj(target, tCoords),
                            units, travelMs: tms,
                            sendTime: new Date(arrivalMs-tms), arrivalTime });
                    });
                });
            }
        });

        return attacks.sort((a, b) => a.sendTime - b.sendTime);
    }

    function toVillageObj(t, coords) {
        return { id: t.id, name: t.name, x: t.x, y: t.y, coords };
    }

    function targetInFocus(target, settings) {
        if (!settings.focusEnabled) return true;
        const dist = Math.sqrt((target.x - settings.focusCx)**2 + (target.y - settings.focusCy)**2);
        return dist <= settings.focusRadius;
    }

    function buildFollowEscort(rt) {
        return (rt.light || 0) >= NOBLE_FOLLOW_LIGHT ? { light: NOBLE_FOLLOW_LIGHT } : null;
    }

    function buildOffBomb(rt) {
        for (const [u, min] of Object.entries(OFF_BOMB_MIN)) { if ((rt[u]||0) < min) return null; }
        const units  = { ...OFF_BOMB_MIN };
        let   budget = OFF_BOMB_MAX - Object.values(OFF_BOMB_MIN).reduce((a,b)=>a+b, 0);
        for (const u of OFF_BOMB_TOPUP) {
            if (budget <= 0) break;
            const avail = (rt[u]||0) - (units[u]||0); if (avail <= 0) continue;
            const add = Math.min(avail, budget); units[u] = (units[u]||0) + add; budget -= add;
        }
        return units;
    }

    function calcFakeSize(ownVillagePoints, fakeUnitTypes) {
        if (!ownVillagePoints || ownVillagePoints <= 0) return 1;
        const minPop    = Math.max(1, Math.ceil(ownVillagePoints * 0.01));
        const popPerSet = fakeUnitTypes.reduce((s, u) => s + (POP_COST[u]||1), 0);
        return Math.max(1, Math.ceil(minPop / Math.max(1, popPerSet)));
    }

    function hasOffUnits(troops) { return OFF_UNITS.some(u => (troops[u]||0) > 0); }

    function deduct(rt, units) {
        Object.entries(units).forEach(([u, cnt]) => { rt[u] = Math.max(0, (rt[u]||0) - cnt); });
    }

    function calcTravelMs(from, to, unitList) {
        const dist    = Math.sqrt((from.x-to.x)**2 + (from.y-to.y)**2);
        const slowest = Math.max(...unitList.map(u => unitSpeeds[u] || DEFAULT_UNIT_SPEEDS[u] || 18));
        return Math.ceil(dist * slowest / worldSpeed) * 60 * 1000;
    }

    function randMs(fromMs, toMs) {
        const range = toMs - fromMs;
        return range <= 0 ? fromMs : fromMs + Math.floor(Math.random() * range);
    }

    function isInSleepWindow() { return false; }

    // ========== RENDER — grouped by FROM village, sorted by arrival time ==========

    function renderUnitIcons(units, leadUnit) {
        const order = leadUnit
            ? [leadUnit, ...UNIT_DISPLAY_ORDER.filter(u => u !== leadUnit)]
            : UNIT_DISPLAY_ORDER;
        const present = order.filter(u => (units[u] || 0) > 0);
        // append any units not in the order list
        Object.keys(units).forEach(u => { if ((units[u]||0) > 0 && !present.includes(u)) present.push(u); });
        return present
            .map(u => `<span style="white-space:nowrap;margin-right:3px;">${unitIcon(u,16)}<span style="font-size:10px;">${units[u]}</span></span>`)
            .join('');
    }


    function renderPlanTable(attacks, settings) {
        settings = settings || _loadedSettings || {};
        // Group by target village, sorted by arrivalTime within each group
        const byTarget = {};
        const targetOrder = [];
        attacks.forEach(a => {
            const key = a.toVillage.coords;
            if (!byTarget[key]) { byTarget[key] = []; targetOrder.push(key); }
            byTarget[key].push(a);
        });
        targetOrder.forEach(key => {
            byTarget[key].sort((a, b) => a.arrivalTime - b.arrivalTime);
        });

        // Build global index for retime binding
        const planIndex = {};
        attacks.forEach((a, i) => { planIndex[a] = i; });

        const tbody = document.getElementById('ap-plan-tbody');
        tbody.innerHTML = '';
        let rowNum = 0;

        targetOrder.forEach((coords, groupIdx) => {
            const group = byTarget[coords];
            const tv    = group[0].toVillage;

            const counts = { noble: 0, off: 0, 'off-bomb': 0, fake: 0 };
            group.forEach(a => { if (counts[a.type] !== undefined) counts[a.type]++; });

            const summaryParts = [];
            if (counts.noble)     summaryParts.push(`${unitIcon('snob',14)}<span style="font-size:10px;">${counts.noble}</span>`);
            if (counts.off)       summaryParts.push(`${unitIcon('axe',14)}<span style="font-size:10px;">${counts.off}</span>`);
            if (counts['off-bomb']) summaryParts.push(`${unitIcon('ram',14)}<span style="font-size:10px;">${counts['off-bomb']}</span>`);
            if (counts.fake)      summaryParts.push(`${unitIcon('spy',14)}<span style="font-size:10px;">${counts.fake}</span>`);
            const typeSummary = summaryParts.join(' ');

            const isFocus   = targetInFocus({ x: parseInt(coords.split('|')[0]), y: parseInt(coords.split('|')[1]) }, settings);
            const focusStar = isFocus ? ' <span style="color:#b8860b;" title="Focus area">★</span>' : '';
            const tvName    = tv.name || coords;
            const tvLink    = tv.id
                ? `<a href="/game.php?village=${game_data.village.id}&screen=info_village&id=${tv.id}" target="_blank" style="font-weight:bold;">${tvName}</a>`
                : `<b>${tvName}</b>`;

            // Header row — toggles group body rows
            const headTr = document.createElement('tr');
            headTr.className = 'ap-target-header';
            headTr.dataset.group = groupIdx;
            headTr.style.cursor = 'pointer';
            headTr.innerHTML = `<td colspan="7">
                <span class="ap-group-arrow" style="font-size:10px;margin-right:4px;">▶</span>
                ${tvLink}${focusStar}
                <small style="color:#777;margin-left:4px;">${coords}</small>
                &nbsp;—&nbsp;
                <span style="font-size:11px;">${group.length} attacks: ${typeSummary}</span>
            </td>`;
            tbody.appendChild(headTr);

            // Body rows — hidden by default
            group.forEach(attack => {
                rowNum++;
                const idx        = planIndex[attack];
                const badgeClass = attack.type==='noble'?'ap-badge-noble':attack.type==='off'?'ap-badge-off':attack.type==='off-bomb'?'ap-badge-off-bomb':'ap-badge-fake';
                const label      = attack.type==='off-bomb'?'BOMB':attack.type.toUpperCase();
                const attackUrl  = buildAttackUrl(attack);
                const fromLink   = `<a href="/game.php?village=${attack.fromVillage.id}&screen=overview" target="_blank">${attack.fromVillage.name}</a><br><small style="color:#999;">${attack.fromVillage.x}|${attack.fromVillage.y}</small>`;
                const actionCell = attack.toVillage.id
                    ? `<a href="${attackUrl}" target="_blank" class="ap-btn ap-btn-primary" data-attack-idx="${idx}" style="font-size:10px;padding:2px 5px;">▶ Attack</a>`
                    : `<span style="color:#aaa;font-size:10px;">No ID</span>`;

                const tr = document.createElement('tr');
                tr.dataset.group = groupIdx;
                tr.style.display = 'none';
                tr.innerHTML = `
                    <td>${rowNum}</td>
                    <td><span class="ap-badge ${badgeClass}">${label}</span></td>
                    <td style="text-align:left;white-space:nowrap;">${fromLink}</td>
                    <td style="text-align:left;">${renderUnitIcons(attack.units, ATTACK_TYPE_LEAD[attack.type])}</td>
                    <td style="white-space:nowrap;font-family:monospace;font-size:11px;" data-send-idx="${idx}">${formatSendTime(attack.sendTime)}</td>
                    <td><input class="ap-arrival-input" type="datetime-local" step="0.001"
                            value="${formatDatetimeLocalMs(attack.arrivalTime)}" data-idx="${idx}"></td>
                    <td>${actionCell}</td>
                `;
                tbody.appendChild(tr);
            });
        });

        // Toggle on header click
        $(tbody).off('click', '.ap-target-header').on('click', '.ap-target-header', function() {
            const g     = $(this).data('group');
            const rows  = $(`#ap-plan-tbody tr[data-group="${g}"]:not(.ap-target-header)`);
            const open  = rows.first().is(':visible');
            rows.toggle(!open);
            $(this).find('.ap-group-arrow').text(open ? '▶' : '▼');
        });
    }

    function buildAttackUrl(attack) {
        if (!attack.toVillage.id || !attack.fromVillage.id) return '#missing-id';
        const units = Object.entries(attack.units).filter(([,v])=>v>0).map(([k,v])=>`${encodeURIComponent(k)}=${v}`).join('&');
        const at    = btoa(String(attack.arrivalTime.getTime()));
        return `/game.php?village=${attack.fromVillage.id}&screen=place&target=${attack.toVillage.id}&${units}&at=${at}`;
    }

    function buildWorkbenchLine(attack) {
        const slowest    = getSlowestUnit(attack.units);
        const isFake     = attack.type === 'fake' ? 'true' : 'false';
        const attackType = WB_ATTACK_TYPE[attack.type] ?? 4;
        const unitStr    = ALL_UNITS.map(u => `${u}=${btoa(String(attack.units[u] || 0))}`).join('/');
        return `${attack.fromVillage.id}&${attack.toVillage.id||0}&${slowest}&${attack.arrivalTime.getTime()}&${attackType}&${isFake}&false&${unitStr}`;
    }

    function getSlowestUnit(units) {
        let name = 'spear', maxSpd = 0;
        Object.keys(units).filter(u=>(units[u]||0)>0).forEach(u => {
            const spd = unitSpeeds[u] || DEFAULT_UNIT_SPEEDS[u] || 0;
            if (spd > maxSpd) { maxSpd = spd; name = u; }
        });
        return name;
    }

    // ========== PLAN PERSISTENCE ==========

    function savePlan(attacks) {
        try {
            utils.saveValue('savedPlan', JSON.stringify(attacks.map(a => ({
                type: a.type, fromVillage: a.fromVillage, toVillage: a.toVillage,
                units: a.units, travelMs: a.travelMs,
                sendTime: a.sendTime.getTime(), arrivalTime: a.arrivalTime.getTime(),
            }))));
        } catch(e) {}
    }

    function loadSavedPlan() {
        try {
            const raw = utils.getValue('savedPlan'); if (!raw) return null;
            return JSON.parse(raw).map(a => ({ ...a, sendTime: new Date(a.sendTime), arrivalTime: new Date(a.arrivalTime) }));
        } catch(e) { return null; }
    }

    function targetsFromPlan(attacks) {
        const seen = new Set();
        return attacks
            .filter(a => { if (seen.has(a.toVillage.coords)) return false; seen.add(a.toVillage.coords); return true; })
            .map(a => ({ id: a.toVillage.id, name: a.toVillage.name, x: a.toVillage.x, y: a.toVillage.y, coords: a.toVillage.coords }));
    }

    // ========== FORMAT HELPERS ==========

    function formatSendTime(date) {
        const p = (n, l=2) => String(n).padStart(l,'0');
        return `${p(date.getDate())}.${p(date.getMonth()+1)}. ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}:${p(date.getMilliseconds(),3)}`;
    }

    function formatDatetimeLocal(d) {
        const p = (n,l=2) => String(n).padStart(l,'0');
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }

    function formatDatetimeLocalMs(d) {
        const p = (n,l=2) => String(n).padStart(l,'0');
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(),3)}`;
    }

    // ========== SETTINGS PERSISTENCE ==========

    function saveSettings() {
        utils.saveValue('sendNobles',    $('#ap-nobles').val());
        utils.saveValue('sendOffs',      $('#ap-offs').val());
        utils.saveValue('sendOffBombs',  $('#ap-off-bombs').val());
        utils.saveValue('sendFakes',     $('#ap-fakes').val());
        utils.saveValue('maxAttacksTo',  $('#ap-max-attacks-to').val());
        utils.saveValue('maxAttacksFrom',$('#ap-max-attacks-from').val());
        utils.saveValue('fakeUnits',     JSON.stringify($('.ap-fake-unit-cb:checked').map(function(){ return $(this).val(); }).get()));
        utils.saveValue('fakesFromAtt',  $('#ap-fakes-from-att').val());
        utils.saveValue('sendFrom',      $('#ap-send-from').val());
        utils.saveValue('targetMode',    $('input[name="ap-target-mode"]:checked').val());
        utils.saveValue('targetInput',   $('#ap-targets-input').val());
        const tfs = [];
        $('.ap-tf-row').each(function() {
            const from = $(this).find('.ap-tf-from').val(), to = $(this).find('.ap-tf-to').val();
            if (from && to) tfs.push({ from, to });
        });
        utils.saveValue('timeframes', JSON.stringify(tfs));
        utils.saveValue('focusEnabled', $('#ap-focus-enabled').is(':checked') ? 'true' : 'false');
        utils.saveValue('focusCoords',  $('#ap-focus-coords').val());
        utils.saveValue('focusRadius',  $('#ap-focus-radius').val());
    }

    function restoreSettings() {
        const sv = (id, key) => { const v = utils.getValue(key); if (v !== null) $(`#${id}`).val(v); };
        sv('ap-nobles','sendNobles'); sv('ap-offs','sendOffs'); sv('ap-off-bombs','sendOffBombs');
        sv('ap-fakes','sendFakes'); sv('ap-max-attacks-to','maxAttacksTo');
        sv('ap-max-attacks-from','maxAttacksFrom'); sv('ap-fakes-from-att','fakesFromAtt');
        sv('ap-focus-coords','focusCoords'); sv('ap-focus-radius','focusRadius');
        sv('ap-send-from','sendFrom');
        const focusEn = utils.getValue('focusEnabled');
        if (focusEn !== null) $('#ap-focus-enabled').prop('checked', focusEn === 'true');
        const fu = JSON.parse(utils.getValue('fakeUnits') || 'null');
        if (fu) { $('.ap-fake-unit-cb').prop('checked', false); fu.forEach(u => $(`.ap-fake-unit-cb[value="${u}"]`).prop('checked', true)); }
        const tm = utils.getValue('targetMode');
        if (tm) $(`input[name="ap-target-mode"][value="${tm}"]`).prop('checked', true);
        const ti = utils.getValue('targetInput'); if (ti) $('#ap-targets-input').val(ti);
        try {
            const tfs = JSON.parse(utils.getValue('timeframes') || 'null');
            if (tfs && tfs.length && tfs[0] && typeof tfs[0]==='object' && tfs[0].from) {
                $('#ap-timeframes').empty(); tfs.forEach(tf => addTimeframeRow(tf.from, tf.to));
            }
        } catch(e) {}
    }

    function onResetSettings() {
        ['sendNobles','sendOffs','sendOffBombs','sendFakes','maxAttacksTo','maxAttacksFrom',
         'fakesFromAtt','fakeUnits','sendFrom','timeframes'].forEach(k => localStorage.removeItem('attack_planner_' + k));
        $('#ap-nobles').val('1'); $('#ap-offs').val('1'); $('#ap-off-bombs').val('1'); $('#ap-fakes').val('1');
        $('#ap-fakes-from-att').val('0');
        $('.ap-fake-unit-cb').prop('checked', false);
        ['spear','sword','spy','catapult'].forEach(u => $(`.ap-fake-unit-cb[value="${u}"]`).prop('checked', true));
        $('#ap-max-attacks-to').val('10'); $('#ap-max-attacks-from').val('5');
        $('#ap-send-from').val('');
        $('#ap-timeframes').empty();
        const tomorrow = new Date(Date.now() + 86400000);
        addTimeframeRow(formatDatetimeLocal(tomorrow), formatDatetimeLocal(new Date(tomorrow.getTime() + 3600000)));
        setStatus('Settings reset to defaults.');
    }

    function onResetTargets() {
        ['targetMode','targetInput','focusEnabled','focusCoords','focusRadius'].forEach(k => localStorage.removeItem('attack_planner_' + k));
        $('input[name="ap-target-mode"][value="coords"]').prop('checked', true);
        $('#ap-targets-input').val('');
        $('#ap-focus-enabled').prop('checked', false);
        $('#ap-focus-coords').val(''); $('#ap-focus-radius').val('5');
        $('#ap-assign-panel').hide();
        $('#ap-plan-table-wrap').hide();
        utils.saveValue('savedPlan', '');
        plan = [];
        setStatus('Targets cleared.');
    }

    function setStatus(msg) { $('#ap-status').text(msg); utils.logMessage(msg, 'debug'); }
}
