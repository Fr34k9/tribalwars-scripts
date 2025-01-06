// ==UserScript==
// @name         Ultra Timing
// @namespace    https://Fr34k.ch
// @version      1.3
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
        script_id: 5,
        script_name: 'ultra_timing',
        debug: true,
    };

    const utils = new Fr34kUtils(config);

    let dauer = 0, goalTime = 0, absendeTime = 0, beforeAfter = 0, interval = 0, intervalIdDsUltimate = 0;

    const param_arrival_time = utils.getParameterByName('at');
    const currentUrl = window.location.href;
    const screen = game_data.screen;

    if (screen == 'place') {
        if (currentUrl.includes('&target=')) {
            utils.logMessage('Handle Place Screen', 'info');
            handlePlaceScreen(param_arrival_time);
        }

        if (currentUrl.includes('&try=confirm')) {
            utils.logMessage('Handle Confirm Screen', 'info');
            handleConfirmScreen(param_arrival_time);
        }

        if (currentUrl.includes('screen=place&village=')) {
            utils.logMessage('Close tab if auto-sent', 'info');
            closeTabIfAutoSent();
        }
    }

    if (currentUrl.includes('ds-ultimate.de') && currentUrl.includes('attackPlanner')) {
        utils.logMessage('Handle DS Ultimate', 'info');
        handleDsUltimate();
    }

    // Event listeners and helper functions below
    $('.removeRemindTime').click(clearRemindTime);
    $('.command-row').each(addRemindIcon);
    $('.ultratiming_remind_time').click(storeReminderTime);
    $('.ultra_timing_start').click(startUltraTiming);

    // Main functions
    function handlePlaceScreen(arrivalTime) {
        if (arrivalTime) {
            updateCommandFormAction(arrivalTime);
            utils.sleep(100).then(() => setUnitValues());
            autoClickAttack();
        }
    }

    function handleConfirmScreen(arrivalTime) {
        let textfield_value = utils.getValue("remindTime") || "";
        if (arrivalTime) textfield_value = staemmeMsToDate(parseInt(atob(arrivalTime)));

        const ultraTimingHtml = createUltraTimingTable(textfield_value);
        $('#troop_confirm_train').before(ultraTimingHtml);

        if (arrivalTime) {
            autoSetTiming();
        }
    }

    function closeTabIfAutoSent() {
        utils.logMessage('Closing tab if auto-sent...', 'info');
        const lastAutoSent = utils.getValue("last_auto_sent") || 0;
        const currentTime = new Date().getTime();

        if (currentTime - parseInt(lastAutoSent) < 30000) {
            utils.sleep(utils.random.number(2000, 5000)).then(() => window.close());
        }
    }

    function handleDsUltimate() {
        utils.logMessage('Handling DS Ultimate...', 'info');
        const autoSendCheckbox = `<input type="checkbox" id="autoSend" class="mr-1"><label for="autoSend">Auto-Send</label>`;
        $('#datatablesHeader2').append(autoSendCheckbox);
        utils.sleep(1000).then(() => dsUltimateTableReady());
        intervalIdDsUltimate = setInterval(autoSendAttack, 5000);
    }

    function updateCommandFormAction(arrivalTime) {
        utils.logMessage('Updating command form action...', 'info');
        const old_action = $('#command-data-form').attr("action");
        $('#command-data-form').attr("action", old_action + '&at=' + arrivalTime);
    }

    function setUnitValues() {
        utils.logMessage('Setting unit values...', 'info');
        const populationCurrentVilla = game_data.village.pop;
        const baseMinTroopsNeeded = Math.ceil(game_data.village.points / 100);
        utils.logMessage('Calculate min troops needed: ' + baseMinTroopsNeeded, 'info'); // CHECK IF THIS NEEDS TO BE DONE ON WORLDS WITH NO MIN-POP


        game_data.units.forEach(unit => {
            let paramValue = utils.getParameterByName(unit) || "";
            const unitMax = parseInt($('#unit_input_' + unit).data('all-count'));

            // Handle the 'min' parameter with unit-specific calculation
            if (paramValue.toLowerCase() === 'min' || paramValue == 99999) {
                // Calculate minimum troops based on unit's population cost
                const unitPopCost = utils.unitPopulation[unit] || 1; // Default to 1 if unknown
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

            utils.logMessage(`Setting ${unit} to ${paramValue}`, 'info');
            $('#unit_input_' + unit).val(paramValue);
        });
    }

    function autoClickAttack() {
        utils.logMessage('Auto-clicking attack...', 'info');
        const randomDelay = utils.random.number(1000, 4000);
        if (!$('#target_attack').length || $('.error_box').length) {
            utils.uiMessage('Error detected. Probably no troops. Closing tab.', randomDelay);
            utils.logMessage('Error detected. Probably no troops. Closing tab.', 'error');
            utils.sleep(randomDelay).then(() => window.close());
        } else {
            utils.sleep(randomDelay).then(() => $('#target_attack').click());
        }
    }

    function autoSetTiming() {
        utils.logMessage('Auto-setting timing...', 'info');
        const now = new Date().getTime();
        utils.saveValue("last_auto_sent", now);
        const randomDelay = utils.random.number(1000, 3000);
        utils.sleep(randomDelay).then(() => $('#ultra_timing_after').click());
    }

    // Ultra Timing Start
    function startUltraTiming() {
        utils.logMessage('Ultra Timing started...', 'info');
        const action = $('#command-data-form').attr("action") + "&utsent=1";
        $('#command-data-form').attr("action", action);

        beforeAfter = $(this).hasClass('before') ? 0 : 1;
        dauer = parseInt($('.relative_time').data('duration')) * 1000;
        goalTime = staemmeDateToMs($('#ultra_timing_final_time').val());
        absendeTime = goalTime - dauer;

        clearInterval(interval);
        if (utils.getValue("ankunftZeitInMS")) {
            interval = setInterval(prepareSend, 500);
        }
    }

    function prepareSend() {
        utils.logMessage('Preparing to send...', 'info');
        const timeNow = Timing.initial_server_time + Timing.getElapsedTimeSinceLoad() + Timing.offset_to_server;
        $('.ultraTimingTimeLeft').text(`${((parseInt(absendeTime) - 1000 - timeNow) / 1000).toFixed(1)}s`);
        if (timeNow > parseInt(absendeTime) - 1000) {
            clearInterval(interval);
            finalSend();
        }
    }

    function finalSend() {
        utils.logMessage('Sending troops...', 'info');
        const randomOffset = parseInt(utils.random.number(10, 50));
        while (true) {
            const timeNow = Timing.initial_server_time + Timing.getElapsedTimeSinceLoad() + Timing.offset_to_server;
            const sendTime = beforeAfter === 0 ? absendeTime - 10 - randomOffset : absendeTime + 50 + randomOffset;
            if (timeNow > sendTime) {
                $('#troop_confirm_go, #troop_confirm_submit').click();
                break;
            }
        }
    }

    function clearRemindTime() {
        utils.saveValue("remindTime", "");
        utils.saveValue("ankunftZeitInMS", "");
        $('#ultra_timing').remove();
    }

    function addRemindIcon() {
        $(this).append('<td><img class="ultratiming_remind_time" style="cursor:pointer;" src="/graphic/group_jump.png" title="Zeit merken"></td>');
    }

    function storeReminderTime() {
        utils.logMessage('Storing reminder time...', 'info');
        const time = $(this).closest('tr').find('td').eq(1).text();
        utils.saveValue("remindTime", time);
        utils.saveValue("ankunftZeitInMS", staemmeDateToMs(time));
        utils.logMessage('Reminder time stored: ' + time, 'info');
    }

    function createUltraTimingTable(value) {
        utils.logMessage('Creating Ultra Timing table...', 'info');
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
        utils.logMessage('Converting staemme date to milliseconds...', 'info');
        utils.logMessage('Input date: ' + text, 'info');
        const currentDate = new Date();
        text = text.replace(/(?:hüt um|heute um)/g, `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()} `)
            .replace(/(?:morn um|morgen um)/g, `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate() + 1} `);

        if (/\:\d{3}$/.test(text)) text = text.replace(/:([^:]+)$/, '.$1');

        utils.logMessage('Output date: ' + (Date.parse(text + 'Z') - 3600000), 'info');
        return Date.parse(text + 'Z') - 3600000;
    }

    function staemmeMsToDate(ms) {
        utils.logMessage('Converting milliseconds to staemme date...', 'info');
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

        utils.logMessage('Output date: ' + `${prefix} ${timeComponents.join(':')}`, 'info');

        return `${prefix} ${timeComponents.join(':')}`;
    }


    // DS-ULTIMATE FUNCTIONS
    // Function to periodically check if the table has multiple rows
    function dsUltimateTableReady() {
        utils.logMessage('Checking DS Ultimate table (dsUltimateTableReady)...', 'info');
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
        utils.logMessage('Auto-sending attack...', 'info');
        if ($('#autoSend').is(':checked')) {
            utils.logMessage('Auto-send is checked...', 'info');
            $('#data1 tbody tr').each(function () {
                if ($(this).html().indexOf('fa-play-circle') > 0) {
                    let current_time = Math.floor(Date.now() / 1000);
                    let goal_time = parseInt($(this).find('countdown').attr("date"));
                    if (goal_time - current_time < 30) {
                        utils.logMessage('Auto-sending attack because rest is: ' + (goal_time - current_time), 'info');
                        dsUltimateTableReady();

                        utils.sleep(500).then(() => { $(this).find('a.text-success').click(); });
                    }
                }
            });
        }
    }

    function convertDateFormat(inputDate) {
        utils.logMessage('Converting date format...', 'info');
        utils.logMessage('Input date: ' + inputDate, 'info');
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

        utils.logMessage('Output date: ' + outputDate, 'info');
        return outputDate;
    }
})();
