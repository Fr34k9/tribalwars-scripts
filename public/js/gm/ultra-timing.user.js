// ==UserScript==
// @name         Ultra Timing
// @namespace    https://Fr34k.ch
// @version      1.2
// @description  Can snipe with ultra precision. Set the exact time you want your attack to land. Works with DS Ultimate.
// @author       Fr34k
// @match        *die-staemme.de/game.php?*village=*&screen=info_village&id=*
// @match        *die-staemme.de/game.php?*village=*&screen=place*
// @match        *.staemme.ch/game.php?*village=*&screen=info_village&id=*
// @match        *.staemme.ch/game.php?*village=*&screen=place*
// @match        *.staemme.ch/game.php?*screen=place&village=*
// @match        *ds-ultimate.de/tools/attackPlanner/*show*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @require      https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/js/fr34k.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const config = {
        script_id: 4,
        script_name: 'ultra_timing',
        debug: true,
    };

    const utils = new Fr34kUtils(config);

    let dauer = 0, goalTime = 0, absendeTime = 0, beforeAfter = 0, interval = 0, intervalIdDsUltimate = 0;

    const param_arrival_time = getParameterByName('at');
    const currentUrl = window.location.href;

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

    // Event listeners and helper functions below
    $('.removeRemindTime').click(clearRemindTime);
    $('.command-row').each(addRemindIcon);
    $('.ultratiming_remind_time').click(storeReminderTime);
    $('.ultra_timing_start').click(startUltraTiming);

    // Main functions
    function handlePlaceScreen(arrivalTime) {
        if (currentUrl.includes('&target=') && arrivalTime) {
            updateCommandFormAction(arrivalTime);
            setTimeout(setUnitValues, 100);
            autoClickAttack();
        }
    }

    function handleConfirmScreen(arrivalTime) {
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
            const delay = utils.random.number(2000, 5000);
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

        // Population cost per unit type
        const unitPopulation = {
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

        game_data.units.forEach(unit => {
            let paramValue = getParameterByName(unit) || "";
            const unitMax = parseInt($('#unit_input_' + unit).data('all-count'));

            // Handle the 'min' parameter with unit-specific calculation
            if (paramValue.toLowerCase() === 'min' || paramValue == 99999) {
                // Calculate minimum troops based on unit's population cost
                const unitPopCost = unitPopulation[unit] || 1; // Default to 1 if unknown
                paramValue = Math.ceil(baseMinTroopsNeeded / unitPopCost);
            } else {
                // Handle 'alle' replacement as before
                paramValue = paramValue.replace('alle', unitMax);

                try {
                    // Safely evaluate the expression
                    paramValue = eval(paramValue) || "";
                } catch (e) {
                    paramValue = "";
                }
            }

            // Ensure we don't exceed the maximum available units
            if (paramValue > unitMax && paramValue != 99999) paramValue = unitMax;

            $('#unit_input_' + unit).val(paramValue);
        });
    }

    function autoClickAttack() {
        const randomDelay = utils.random.number(1000, 4000);
        if (!$('#target_attack').length || $('.error_box').length) {
            utils.uiMessage('Error detected. Probably no troops. Closing tab.', randomDelay);
            utils.logMessage('Error detected. Probably no troops. Closing tab.', 'error');
            setTimeout(window.close, randomDelay);
        } else {
            setTimeout(() => $('#target_attack').click(), randomDelay);
        }
    }

    function autoSetTiming() {
        const now = new Date().getTime();
        localStorage.setItem("ut_last_auto_sent", now);
        const randomDelay = utils.random.number(1000, 3000);
        setTimeout(() => $('#ultra_timing_after').click(), randomDelay);
    }

    // Ultra Timing Start
    function startUltraTiming() {
        const action = $('#command-data-form').attr("action") + "&utsent=1";
        $('#command-data-form').attr("action", action);

        beforeAfter = $(this).hasClass('before') ? 0 : 1;
        dauer = parseInt($('.relative_time').data('duration')) * 1000;
        goalTime = staemmeDateToMs($('#ultra_timing_final_time').val());
        absendeTime = goalTime - dauer;

        clearInterval(interval);
        if (localStorage.getItem("ankunftZeitInMS")) {
            interval = setInterval(prepareSend, 500);
        }
    }

    function prepareSend() {
        const timeNow = Timing.initial_server_time + Timing.getElapsedTimeSinceLoad() + Timing.offset_to_server;
        $('.ultraTimingTimeLeft').text(`${((parseInt(absendeTime) - 1000 - timeNow) / 1000).toFixed(1)}s`);
        if (timeNow > parseInt(absendeTime) - 1000) {
            clearInterval(interval);
            finalSend();
        }
    }

    function finalSend() {
        const randomOffset = getRandomOffset();
        while (true) {
            const timeNow = Timing.initial_server_time + Timing.getElapsedTimeSinceLoad() + Timing.offset_to_server;
            const sendTime = beforeAfter === 0 ? absendeTime - 10 - randomOffset : absendeTime + 50 + randomOffset;
            if (timeNow > sendTime) {
                $('#troop_confirm_go, #troop_confirm_submit').click();
                break;
            }
        }
    }

    // Helper functions
    function getParameterByName(name) {
        return new URL(window.location.href).searchParams.get(name);
    }

    function getRandomOffset() {
        return Math.floor(Math.random() * 41) + 10;
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
                <tr><td>Davor / Danach</td><td><img class="ultra_timing_start before" src="/graphic/group_left.png" style="cursor:pointer; margin-right: 30px;"><img id="ultra_timing_after" class="ultra_timing_start after" src="/graphic/group_right.png" style="cursor:pointer;"></td></tr>
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
        return Date.parse(text + 'Z') - 3600000;
    }

    function staemmeMsToDate(ms) {
        const input_date = new Date(ms);
        const current_date = new Date();

        // Helper function to check if dates are the same
        const isSameDate = (date1, date2, dayOffset = 0) => {
            return date1.getDate() === (date2.getDate() + dayOffset) &&
                date1.getMonth() === date2.getMonth() &&
                date1.getFullYear() === date2.getFullYear();
        };

        // Determine the date prefix
        let prefix = isSameDate(input_date, current_date) ? 'hüt um' :
            isSameDate(input_date, current_date, 1) ? 'morn um' :
                `${input_date.getFullYear()}-${input_date.getMonth() + 1}-${input_date.getDate()}`;

        // Format time components
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


    // DS-ULTIMATE FUNCTIONS
    // Function to periodically check if the table has multiple rows
    function dsUltimateTableReady() {
        const table = document.getElementById('data1');
        if (table && table.rows.length > 1) {
            $('#data1 tbody tr').each(function () {
                let arrival_time = $(this).find('td:nth-child(8)').text();
                arrival_time = convertDateFormat(arrival_time);
                arrival_time = staemmeDateToMs(arrival_time);

                let old_href = $(this).find('a.text-success').attr("href");
                $(this).find('a.text-success').attr("href", old_href + "&at=" + btoa(arrival_time));
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

                        setTimeout($(this).find('a.text-success i').click(), 500);
                    }
                }
            });
        }
    }

    function convertDateFormat(inputDate) {
        // Check if the input date has the expected format (day.month.year)
        const dateRegex = /^\d{2}\.\d{2}\.\d{4}/;
        if (!dateRegex.test(inputDate)) {
            // Return the input unchanged if the format is not as expected
            return inputDate;
        }

        const [datePart, timePart] = inputDate.split(' ');
        const [day, month, year] = datePart.split('.');
        const formattedDate = `${year}-${month}-${day}`;
        const outputDate = `${formattedDate} ${timePart}`;

        return outputDate;
    }
})();
