// ==UserScript==
// @name         Farm God Addon
// @namespace    http://Fr34k.ch
// @version      1.0
// @description  Farm God Addon
// @author       Fr34k
// @match        *.staemme.ch/game.php?village=*&screen=am_farm*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const PREFIX = 'farm_god_addon';
    var BOT_DETECTED = false;

    sleep(2000, function () {
        detectBot();
    });
    createMenu();

    // Start the sequence by calling step1
    sleep(randomDelay(5000, 10000), step1);
    setRefreshTimeAndReloadPage();

    $('#farm_god_addon_autofarm').click(function () {
        let checkbox = $('#farm_god_addon_autofarm').is(":checked");
        let value = 0;
        if (checkbox == true) {
            value = 1;
        }
        save_value('autorefresh', value);

        if (value == 1) {
            location.reload();
        }
    });

    $('#farm_god_addon_refresh_time').change(function () {
        save_value('refresh_time', $('#farm_god_addon_refresh_time').val());
    });

    // Function to perform the first action with a random delay between 5-15 seconds
    function step1() {
        console.log('Step1');
        if (get_value('autorefresh') == "1") {
            $(".quickbar_link:contains('Farm God')")[0].click();
            sleep(randomDelay(1000, 5000), step2);
        }
    }

    // Function to perform the second action with a random delay between 1-5 seconds
    function step2() {
        console.log('Step2');
        if (get_value('autorefresh') == '1') {
            $('.optionsContent .optionButton')[0].click();
            sleep(randomDelay(1000, 5000), step3);
        }
    }

    // Function to simulate a click on all elements with the specified selector with a random delay between 500ms-2s
    function step3() {
        console.log('Step3');
        if (get_value('autorefresh') == '1') {
            const elementsToClick = $(".farmRow .farmGod_icon");

            var fullWaitTime = 0;
            elementsToClick.each(function (index) {
                var delay = randomDelay(250, 400)
                fullWaitTime = fullWaitTime + delay; // Fulltime needs to be waited

                sleep(fullWaitTime, () => {
                    if (get_value('autorefresh') == '1' && BOT_DETECTED === false && detectBot() === false) {
                        $(this).click();
                        console.log(`Clicked element ${index + 1} of ${elementsToClick.length}`);
                        if (index === elementsToClick.length - 1) {
                            console.log('All steps completed.');
                        }
                    }
                });
            });
        }
    }

    function detectBot() {
        // Check if detected
        if ($('#botprotection_quest').length > 0) {
            BOT_DETECTED = true;
        }

        if ($('#bot_check .btn-default:contains("Starte Botcheck")').length > 0) {
            console.log('Bot Detected2. Try to solve...');
            BOT_DETECTED = true;
        }

        if (document.body.innerText.indexOf('Farm-Assis') < 0) {
            BOT_DETECTED = true;
        }

        if (BOT_DETECTED === true) {
            send_log('DS Script: Auto Farmer | BOT-SCHUTZ');
        }
        return BOT_DETECTED;
    }


    function createMenu() {
        var checked = get_value('autorefresh') == '1' ? ' checked="checked" ' : '';
        var refresh_time = get_value('refresh_time') ? get_value('refresh_time') : 1000;
        var template = `<div class="vis">
	<h4>Auto Farm-God</h4>
	<table id="farm_god_addon_settings" style="width:100%">
	 <tbody>
		<tr>
			<th style="text-align:center">Autofarm</th>
			<th style="text-align:center">Reload Page (seconds)</th>
			<th style="text-align:center">Next Reload</th>
		</tr>
		<tr>
		   <td style="text-align:center"><input type="checkbox" id="farm_god_addon_autofarm" ` + checked + `></td>
		   <td style="text-align:center"><input id="farm_god_addon_refresh_time" type="text" value="` + get_value('refresh_time') + `"></td>
		   <td style="text-align:center" id="farm_god_addon_next_refresh">-</td>
		</tr>
	 </tbody>
	</table>
</div>`;
        $('#am_widget_Farm').before(template);
    }

    function setRefreshTimeAndReloadPage() {
        var refresh_time = get_value('refresh_time') ? get_value('refresh_time') : 1000;
        refresh_time = random_number(refresh_time * 0.7, refresh_time * 1.3);
        refresh_time *= 1000;
        // Get the current time in milliseconds since January 1, 1970 (Unix timestamp)
        const currentTimeMilliseconds = Date.now();
        const newTimeMilliseconds = currentTimeMilliseconds + refresh_time;
        const newDate = new Date(newTimeMilliseconds);
        const formattedDate = newDate.toLocaleString();
        $("#farm_god_addon_next_refresh").text(formattedDate);


        sleep(refresh_time, () => {
            location.reload();
        });
    }

    function send_log(text) {
        var oReq;
        oReq = new XMLHttpRequest();
        // oReq.addEventListener("load", reqListener);
        oReq.open("GET", "https://discord.fr34k.ch/message.php?username=DS Log&content=" + text); // Send a message to fr34k that detected
        oReq.send();
        fetch('https://ntfy.sh/fr34k_app_logs', {
            method: 'POST', // PUT works too
            body: text
        })
    }

    // Function to generate a random delay between min and max seconds
    function randomDelay(minMilliseconds, maxMilliseconds) {
        return Math.floor(Math.random() * (maxMilliseconds - minMilliseconds + 1)) + minMilliseconds;
    }

    function random_number(min, max) {
        // Ensure that min is truly the minimum and max is the maximum
        // by swapping them if necessary
        if (min > max) {
            const temp = min;
            min = max;
            max = temp;
        }

        // Generate a random number between min (inclusive) and max (exclusive)
        return parseInt(Math.random() * (max - min) + min);
    }

    function save_value(variable, value) {
        localStorage.setItem(PREFIX + '_' + variable, value);
    }

    function get_value(variable) {
        var value = localStorage.getItem(PREFIX + '_' + variable);
        if (value == null) value = false;
        return value;
    }

    function sleep(ms, callback) {
        setTimeout(callback, ms);
    }
})();