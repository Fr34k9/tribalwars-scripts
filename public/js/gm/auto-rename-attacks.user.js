// ==UserScript==
// @name         Rename Attacks
// @namespace    http://Fr34k.ch
// @version      2.0
// @description  Automatically renames all attacks in the overview page
// @author       Fr34k
// @match        *.staemme.ch/game.php?village=*screen=overview_villages&mode=incomings&*type=*
// @match        *.staemme.ch/game.php?screen=overview_villages&mode=incomings&*type=*&village=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @require      https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/js/fr34k.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const config = {
        script_id: 4,
        script_name: 'rename_attacks',
        debug: true,
    };

    const utils = new Fr34kUtils(config);

    const refreshDelay = utils.random.number(300000, 900000)
    const refreshTime = new Date(Date.now() + refreshDelay).toLocaleTimeString();
    utils.uiMessage('Auto-Refresh at ' + refreshTime, refreshDelay, true);

    utils.sleep(refreshDelay).then(() => {
        autoRenameAttacks();
    });

    // Function to perform the renaming actions
    function autoRenameAttacks() {
        // loop over all elements $('#incomings_table tr .quickedit-label')
        // if text (without whitespaces) is Angriff, add 1 to countActions
        const countElements = $('#incomings_table tr .quickedit-label');
        utils.logMessage(`Found ${countElements.length} attacks`, 'debug');

        let countActions = 0;
        countElements.each(function () {
            if ($(this).text().replace(/\s/g, '') === 'Angriff') {
                countActions++;
            }
        });

        utils.logMessage(`Found ${countActions} attacks which were not renamed before`, 'debug');

        utils.finishScript(countActions);

        utils.sleep(1000).then(() => {
            $('#select_all').click();
            $("#incomings_table tr:last() input[data-title]")?.click();
        });
    }
})();