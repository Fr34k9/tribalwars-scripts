// ==UserScript==
// @name         Looter of the day
// @namespace    http://Fr34k.ch
// @version      1.0
// @description  Searching for new babas to attack.
// @author       Fr34k
// @match        *.staemme.ch/game.php?village=*&screen=am_farm*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    console.log('[Fr34k|Looter of the day] Script aktiv');
    let attack_counter = 0;
    let intervalId = null; // To store the interval ID

    $('h3:contains("Farm-Assi")').append('<img id="lotd_send" height="18px" style="margin-left: 10px; cursor: pointer;" src="/graphic/awards/award9.png">');

    $('#lotd_send').click(function() {
        if ( intervalId ) {
            // If the interval is already running, stop it
            clearInterval(intervalId);
            intervalId = null;
            console.log('Console logging stopped.');
        } else {
            startRandomInterval();
            console.log('Console logging started.');
        }
    });


    // Function to start logging with a random interval
    function startRandomInterval() {
        function sendAttack(){
            console.log('Try to send attack');
            if( $('.autoHideBox').length > 0 ) {
                clearInterval(intervalId);
                console.log('All units sent');
                return false;
            }

            const el = $('#plunder_list').find('a[class^="farm_village_"].farm_icon_b').first()
            el.removeClass('farm_icon_disabled');
            el.click();

            const randomInterval = 800 + Math.random() * 400;
            // Set the interval for the next log
            intervalId = setTimeout(startRandomInterval, randomInterval);
        }

        // Call the initial log
        sendAttack();
    }
})();