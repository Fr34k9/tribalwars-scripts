// ==UserScript==
// @name         Looter of the Day
// @namespace    http://Fr34k.ch
// @version      2.0
// @description  Searching for new babas to attack.
// @author       Fr34k
// @match        *.staemme.ch/game.php?village=*&screen=am_farm*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @require      https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/js/fr34k.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const config = {
        script_name: 'looter_of_the_day',
    };

    const utils = new Fr34kUtils(config);

    let attack_counter = 0;
    let intervalId = null;

    $('h3:contains("Farm-Assi")').append('<img id="lotd_send" height="18px" style="margin-left: 10px; cursor: pointer;" src="/graphic/awards/award9.png">');

    $('#lotd_send').click(function() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
            utils.logMessage('Stopped. Attacks sent: ' + attack_counter);
            utils.finishScript(attack_counter);
            attack_counter = 0;
        } else {
            attack_counter = 0;
            startRandomInterval();
        }
    });

    function startRandomInterval() {
        function sendAttack() {
            if (utils.botDetected()) {
                clearInterval(intervalId);
                intervalId = null;
                utils.logMessage('Bot protection detected — stopped', 'error');
                utils.finishScript(attack_counter);
                return;
            }

            if ($('.autoHideBox').length > 0) {
                clearInterval(intervalId);
                intervalId = null;
                utils.logMessage('All units sent');
                utils.finishScript(attack_counter);
                return;
            }

            const el = $('#plunder_list').find('a[class^="farm_village_"].farm_icon_b').first();
            el.removeClass('farm_icon_disabled');
            el.click();
            attack_counter++;

            const randomInterval = 800 + Math.random() * 400;
            intervalId = setTimeout(startRandomInterval, randomInterval);
        }

        sendAttack();
    }
})();
