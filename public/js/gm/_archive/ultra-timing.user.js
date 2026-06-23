// ==UserScript==
// @name         Ultra Timing
// @namespace    https://fr34k.ch
// @version      1.8
// @description  Ultra Timing. Find out by yourself or ask a Fr34k ♥
// @author       Fr34k
// @match        *die-staemme.de/game.php?*village=*&screen=info_village&id=*
// @match        *die-staemme.de/game.php?*village=*&screen=place*
// @match        *.staemme.ch/game.php?*village=*&screen=info_village&id=*
// @match        *.staemme.ch/game.php?*village=*&screen=place*
// @match        *.staemme.ch/game.php?*screen=place&village=*
// @match        *ds-ultimate.de/tools/attackPlanner/*show*
// @require      https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/js/fr34k.js
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// ==/UserScript==

(function () {
    'use strict';

    const utils = new Fr34kUtils({ script_name: 'ultra_timing' });

    console.log('Script aktiv: Ultra Timing v1.8');

    // ------------------------------------------------------------------
    // CONFIG
    // ------------------------------------------------------------------
    const CONFIG = {
        randomizeMs: 0,     // 0 = max precision. Set e.g. 30 to re-enable random jitter
                            // (only applies to before/after modes, never to exact)
        fireEarlyMs: 33,    // MANUAL CALIBRATION (calibrated for the
                            // responseStart clock anchor):
                            //   positive  = fire that many ms EARLIER
                            //   negative  = fire that many ms LATER
                            // Re-tune if your network or location changes:
                            // mean(actual - target) of a few sends, negated.
        beforeMs: 15,       // left button:   target this many ms BEFORE the Zielzeit
        afterMs: 15,        // right button:  target this many ms AFTER the Zielzeit
                            // center button: targets the Zielzeit EXACTLY (no offset)
        spinWindowMs: 400,  // MUST be larger than the 250ms polling interval,
                            // otherwise the deadline can pass between two ticks
                            // and the send fires late
        warmupMs: 2500      // this long before fire-time, fetch one small asset to
                            // keep the HTTP connection warm (prevents a fresh
                            // TCP/TLS handshake from delaying the actual send)
    };

    let dauer = 0, goalTime = 0, absendeTime = 0, mode = 'exact', interval = 0, intervalIdDsUltimate = 0;
    let connectionWarmed = false;

    const param_arrival_time = getParameterByName('at');
    const currentUrl = window.location.href;

    // ------------------------------------------------------------------
    // CLOCK
    // Anchors server time to performance.now() ONCE per page load, using
    // the Navigation Timing API: the server stamped initial_server_time
    // while generating this page, and nav.responseStart is the moment
    // (on the performance clock) the first byte arrived. Consistent,
    // low-variance anchor; the systematic part (one-way latency) is
    // absorbed by CONFIG.fireEarlyMs.
    // ------------------------------------------------------------------
    const Clock = {
        anchorOffset: null, // serverMs - performance.now()

        init() {
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav && typeof Timing !== 'undefined' && Timing.initial_server_time) {
                this.anchorOffset = Timing.initial_server_time - nav.responseStart;
                console.log(`UT Clock: responseStart anchor (offset=${this.anchorOffset.toFixed(1)})`);
            } else {
                // Fallback: old game-Timing based anchor
                const serverNow = Timing.initial_server_time + Timing.getElapsedTimeSinceLoad() + Timing.offset_to_server;
                this.anchorOffset = serverNow - performance.now();
                console.log(`UT Clock: FALLBACK game-Timing anchor (offset=${this.anchorOffset.toFixed(1)})`);
            }
        },

        now() {
            if (this.anchorOffset === null) this.init();
            return performance.now() + this.anchorOffset;
        }
    };

    /* ------------------------------------------------------------------
    // NETWORK SYNC — DISABLED (probing the server with HEAD requests
    // is too conspicuous). Kept here in case it should come back later.
    // It measured the true server clock offset + RTT via second-edge
    // detection on the HTTP Date header. Without it, we rely on the
    // responseStart anchor above and the manual CONFIG.fireEarlyMs knob.
    // ------------------------------------------------------------------
    const PrecisionClock = {
        offset: null,
        minRtt: null,
        synced: false,
        syncing: false,

        async probe() {
            const t0 = performance.now();
            const res = await fetch('/robots.txt?ut=' + Math.random(), {
                method: 'HEAD',
                cache: 'no-store',
                credentials: 'omit'
            });
            const t1 = performance.now();
            return {
                t0, t1,
                rtt: t1 - t0,
                serverSec: Math.floor(Date.parse(res.headers.get('date')) / 1000)
            };
        },

        async detectEdgeCoarse() {
            let prev = await this.probe();
            for (let i = 0; i < 40; i++) {
                await sleep(40);
                const cur = await this.probe();
                if (cur.serverSec > prev.serverSec) {
                    return this._edgeEstimate(prev, cur);
                }
                prev = cur;
            }
            return null;
        },

        async detectEdgeRefined() {
            const nowSrv = performance.now() + this.offset;
            const nextEdge = (Math.floor(nowSrv / 1000) + 1) * 1000;
            const waitMs = nextEdge - nowSrv - 120;
            if (waitMs > 0) await sleep(waitMs);

            let prev = await this.probe();
            for (let i = 0; i < 20; i++) {
                const cur = await this.probe();
                if (cur.serverSec > prev.serverSec) {
                    return this._edgeEstimate(prev, cur);
                }
                prev = cur;
            }
            return null;
        },

        _edgeEstimate(prev, cur) {
            const tPrev = prev.t0 + prev.rtt / 2;
            const tCur = cur.t0 + cur.rtt / 2;
            return {
                offset: cur.serverSec * 1000 - (tPrev + tCur) / 2,
                uncertainty: (tCur - tPrev) / 2,
                rtt: Math.min(prev.rtt, cur.rtt)
            };
        },

        async sync() {
            if (this.syncing) return;
            this.syncing = true;
            try {
                const coarse = await this.detectEdgeCoarse();
                if (!coarse) return false;
                this.offset = coarse.offset;

                const edges = [coarse];
                for (let i = 0; i < 3; i++) {
                    const e = await this.detectEdgeRefined();
                    if (e) {
                        edges.push(e);
                        this.offset = e.offset;
                    }
                }

                edges.sort((a, b) => a.offset - b.offset);
                this.offset = edges[Math.floor(edges.length / 2)].offset;
                this.minRtt = Math.min(...edges.map(e => e.rtt));
                this.synced = true;
                return true;
            } finally {
                this.syncing = false;
            }
        }
    };

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
    ------------------------------------------------------------------ */

    // ------------------------------------------------------------------
    // ROUTING
    // ------------------------------------------------------------------
    if (currentUrl.includes('&screen=place&')) {
        handlePlaceScreen(param_arrival_time);
    }

    if (currentUrl.includes('&try=confirm')) {
        handleConfirmScreen(param_arrival_time);
    }

    if (currentUrl.includes('screen=place&village=')) {
        closeTabIfAutoSent();
    }

    if (currentUrl.includes('ds-ultimate.de') && currentUrl.includes('attackPlanner')) {
        handleDsUltimate();
    }

    // Event listeners
    $('.removeRemindTime').click(clearRemindTime);
    $('.command-row').each(addRemindIcon);
    $('.ultratiming_remind_time').click(storeReminderTime);
    $('.ultra_timing_start').click(startUltraTiming);

    // ------------------------------------------------------------------
    // MAIN FUNCTIONS
    // ------------------------------------------------------------------
    function handlePlaceScreen(arrivalTime) {
        if (currentUrl.includes('&target=') && arrivalTime) {
            updateCommandFormAction(arrivalTime);
            setTimeout(setUnitValues, 100);
            autoClickSend();
        }
    }

    function handleConfirmScreen(arrivalTime) {
        // Anchor the clock as early as possible
        Clock.init();

        let textfield_value = localStorage.getItem("remindTime") || "";
        if (arrivalTime) textfield_value = staemmeMsToDate(parseInt(atob(arrivalTime)));

        const ultraTimingHtml = createUltraTimingTable(textfield_value);
        $('#troop_confirm_train').before(ultraTimingHtml);

        if (arrivalTime) {
            autoSetTiming();
        }
    }

    function closeTabIfAutoSent() {
        const lastAutoSent = localStorage.getItem("ut_last_auto_sent") || 0;
        const currentTime = new Date().getTime();

        if (currentTime - parseInt(lastAutoSent) < 30000) {
            const delay = getRandomDelay(2000, 5000);
            setTimeout(window.close, delay);
        }
    }

    function handleDsUltimate() {
        const autoSendCheckbox = `<input type="checkbox" id="autoSend" class="mr-1"><label for="autoSend">Auto-Send</label>`;
        $('#datatablesHeader2').append(autoSendCheckbox);
        setTimeout(dsUltimateTableReady, 1000);
        intervalIdDsUltimate = setInterval(autoSendAttack, 5000);
    }

    function updateCommandFormAction(arrivalTime) {
        const old_action = $('#command-data-form').attr("action");
        $('#command-data-form').attr("action", old_action + '&at=' + arrivalTime);
    }

    function setUnitValues() {
        const populationCurrentVilla = game_data.village.pop;
        const baseMinTroopsNeeded = Math.ceil(game_data.village.points / 100);

        const unitPopulation = {
            spear: 1, sword: 1, axe: 1, archer: 1, spy: 2, light: 4,
            marcher: 5, heavy: 6, ram: 5, catapult: 8, knight: 10, snob: 100
        };

        game_data.units.forEach(unit => {
            let paramValue = getParameterByName(unit) || "";
            const unitMax = parseInt($('#unit_input_' + unit).data('all-count'));

            if (paramValue.toLowerCase() === 'min' || paramValue == 99999) {
                const unitPopCost = unitPopulation[unit] || 1;
                paramValue = Math.ceil(baseMinTroopsNeeded / unitPopCost);
            } else {
                paramValue = paramValue.replace('alle', unitMax);
                try {
                    paramValue = eval(paramValue) || "";
                } catch (e) {
                    paramValue = "";
                }
            }

            if (paramValue > unitMax && paramValue != 99999) paramValue = unitMax;
            $('#unit_input_' + unit).val(paramValue);
        });
    }

    // Clicks "Angriff" or "Unterstützung" on the place screen, depending
    // on the uttype URL param set by the ds-ultimate integration.
    function autoClickSend() {
        const isSupport = getParameterByName('uttype') === 'support';
        const btnSelector = isSupport ? '#target_support' : '#target_attack';

        const randomDelay = getRandomDelay(1000, 4000);
        if (!$(btnSelector).length || $('.error_box').length) {
            console.log('ERROR happened. Probably no troops. Close tab.');
            setTimeout(window.close, randomDelay);
        } else {
            console.log(`UT: auto-clicking ${isSupport ? 'Unterstützung' : 'Angriff'}`);
            setTimeout(() => $(btnSelector).click(), randomDelay);
        }
    }

    function autoSetTiming() {
        const now = new Date().getTime();
        localStorage.setItem("ut_last_auto_sent", now);
        const randomDelay = getRandomDelay(1000, 3000);
        // Auto-sends from ds-ultimate use the CENTER button (exact mode)
        setTimeout(() => $('#ultra_timing_exact').click(), randomDelay);
    }

    // ------------------------------------------------------------------
    // ULTRA TIMING SEND PATH
    // ------------------------------------------------------------------
    function startUltraTiming() {
        const action = $('#command-data-form').attr("action") + "&utsent=1";
        $('#command-data-form').attr("action", action);

        mode = $(this).hasClass('before') ? 'before'
            : $(this).hasClass('after') ? 'after'
            : 'exact';

        dauer = parseInt($('.relative_time').data('duration')) * 1000;
        goalTime = staemmeDateToMs($('#ultra_timing_final_time').val());
        absendeTime = goalTime - dauer;
        connectionWarmed = false;

        clearInterval(interval);
        if (localStorage.getItem("ankunftZeitInMS")) {
            interval = setInterval(prepareSend, 250);
        }
    }

    function computeFireTime() {
        const jitter = CONFIG.randomizeMs > 0
            ? Math.floor(Math.random() * CONFIG.randomizeMs)
            : 0;

        let targetArrival;
        if (mode === 'before') {
            targetArrival = absendeTime - CONFIG.beforeMs - jitter;
        } else if (mode === 'after') {
            targetArrival = absendeTime + CONFIG.afterMs + jitter;
        } else {
            // exact: hit the Zielzeit on the millisecond — no offset, no jitter
            targetArrival = absendeTime;
        }

        // Manual calibration: shift so the request ARRIVES at the server on time.
        return targetArrival - CONFIG.fireEarlyMs;
    }

    function prepareSend() {
        const fireTime = computeFireTime();
        const remaining = fireTime - Clock.now();
        $('.ultraTimingTimeLeft').text(`${(remaining / 1000).toFixed(1)}s [${mode}]`);

        // Keep the HTTP connection warm shortly before the send, so the
        // actual POST doesn't pay for a fresh TCP/TLS handshake.
        if (remaining < CONFIG.warmupMs && !connectionWarmed) {
            connectionWarmed = true;
            fetch('/graphic/delete.png?' + Math.random(), { cache: 'no-store' }).catch(() => {});
        }

        if (remaining < CONFIG.spinWindowMs) {
            clearInterval(interval);
            finalSend(fireTime);
        }
    }

    function finalSend(fireTime) {
        // Resolve the button ONCE, outside the hot loop
        const btn = document.querySelector('#troop_confirm_go')
            || document.querySelector('#troop_confirm_submit');
        if (!btn) {
            console.error('UT: confirm button not found!');
            return;
        }

        // Precomputed performance.now() deadline -> only a comparison
        // inside the spin loop. Monotonic, NTP-safe.
        const perfDeadline = fireTime - Clock.anchorOffset;
        while (performance.now() < perfDeadline) { /* spin */ }

        btn.click();
        utils.finishScript(1);
        console.log(`UT fired | mode=${mode} | target=${fireTime.toFixed(0)} | clock=${Clock.now().toFixed(1)} | fireEarlyMs=${CONFIG.fireEarlyMs}`);
    }

    // ------------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------------
    function getParameterByName(name) {
        return new URL(window.location.href).searchParams.get(name);
    }

    function getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function clearRemindTime() {
        localStorage.setItem("remindTime", "");
        localStorage.setItem("ankunftZeitInMS", "");
        $('#ultra_timing').remove();
    }

    function addRemindIcon() {
        $(this).append('<td><img class="ultratiming_remind_time" style="cursor:pointer;" src="/graphic/group_jump.png" title="Zeit merken"></td>');
    }

    function storeReminderTime() {
        const time = $(this).closest('tr').find('td').eq(1).text();
        localStorage.setItem("remindTime", time);
        localStorage.setItem("ankunftZeitInMS", staemmeDateToMs(time));
    }

    function createUltraTimingTable(value) {
        return `
        <table id="ultra_timing" class="vis" width="360" style="margin-top: 10px;">
            <tbody>
                <tr><th colspan="2">Ultra-Timing <img class="removeRemindTime" src="/graphic/delete.png" style="cursor:pointer;" height=10px></th></tr>
                <tr><td>Davor / Exakt / Danach</td><td>
                    <img class="ultra_timing_start before" src="/graphic/group_left.png" title="Davor (-${CONFIG.beforeMs}ms)" style="cursor:pointer; margin-right: 25px;">
                    <span id="ultra_timing_exact" class="ultra_timing_start exact" title="Exakt auf die ms" style="cursor:pointer; margin-right: 25px; font-size: 14px; vertical-align: middle;">&#127919;</span>
                    <img id="ultra_timing_after" class="ultra_timing_start after" src="/graphic/group_right.png" title="Danach (+${CONFIG.afterMs}ms)" style="cursor:pointer;">
                </td></tr>
                <tr><td>Zielzeit:</td><td><input type="text" id="ultra_timing_final_time" value="${value}"></td></tr>
                <tr><td>Zeit übrig</td><td class="ultraTimingTimeLeft"></td></tr>
            </tbody>
        </table>`;
    }

    function staemmeDateToMs(text) {
        const currentDate = new Date();
        text = text.replace(/(?:hüt um|heute um)/g, `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()} `)
            .replace(/(?:morn um|morgen um)/g, `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate() + 1} `);

        if (/\:\d{3}$/.test(text)) text = text.replace(/:([^:]+)$/, '.$1');
        return Date.parse(text + 'Z') - 7200000;
    }

    function staemmeMsToDate(ms) {
        const input_date = new Date(ms);
        const current_date = new Date();

        const isSameDate = (date1, date2, dayOffset = 0) => {
            return date1.getDate() === (date2.getDate() + dayOffset) &&
                date1.getMonth() === date2.getMonth() &&
                date1.getFullYear() === date2.getFullYear();
        };

        let prefix = isSameDate(input_date, current_date) ? 'hüt um' :
            isSameDate(input_date, current_date, 1) ? 'morn um' :
                `${input_date.getFullYear()}-${input_date.getMonth() + 1}-${input_date.getDate()}`;

        const timeComponents = [
            input_date.getHours(),
            input_date.getMinutes(),
            input_date.getSeconds(),
            input_date.getMilliseconds()
        ].map((num, index) =>
            String(num).padStart(index === 3 ? 3 : 2, '0')
        );

        return `${prefix} ${timeComponents.join(':')}`;
    }

    // ------------------------------------------------------------------
    // DS-ULTIMATE FUNCTIONS
    // ------------------------------------------------------------------
    function dsUltimateTableReady() {
        const table = document.getElementById('data1');
        if (table && table.rows.length > 1) {
            $('#data1 tbody tr').each(function () {
                const link = $(this).find('a.text-success');
                let href = link.attr("href");

                // Guard: skip rows without a link or already-processed rows
                // (this function is called repeatedly; without the guard the
                // params would be appended again on every call)
                if (!href || href.includes('&at=')) return;

                let arrival_time = $(this).find('td:nth-child(8)').text();
                arrival_time = convertDateFormat(arrival_time);
                arrival_time = staemmeDateToMs(arrival_time);

                href += "&at=" + btoa(arrival_time);

                // Typ "Unterstützung": pass it along so the place screen
                // clicks the support button instead of attack
                if ($(this).find('[data-content="Unterstützung"]').length > 0) {
                    href += "&uttype=support";
                }

                link.attr("href", href);
            });
        }
    }

    function autoSendAttack() {
        if ($('#autoSend').is(':checked')) {
            $('#data1 tbody tr').each(function () {
                if ($(this).html().indexOf('fa-play-circle') > 0) {
                    let current_time = Math.floor(Date.now() / 1000);
                    let goal_time = parseInt($(this).find('countdown').attr("date"));
                    if (goal_time - current_time < 30) {
                        dsUltimateTableReady();

                        // BUGFIX: was setTimeout(....click(), 500) which executed
                        // the click immediately and passed its return value to setTimeout
                        const link = $(this).find('a.text-success i');
                        setTimeout(() => link.click(), 500);
                    }
                }
            });
        }
    }

    function convertDateFormat(inputDate) {
        const dateRegex = /^\d{2}\.\d{2}\.\d{4}/;
        if (!dateRegex.test(inputDate)) {
            return inputDate;
        }

        const [datePart, timePart] = inputDate.split(' ');
        const [day, month, year] = datePart.split('.');
        const formattedDate = `${year}-${month}-${day}`;
        const outputDate = `${formattedDate} ${timePart}`;

        return outputDate;
    }
})();