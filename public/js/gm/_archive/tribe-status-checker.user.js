// ==UserScript==
// @name         Tribe Status Checker
// @namespace    http://Fr34k.ch
// @version      2.0
// @description  Checks Tribe Status every 5 minutes
// @author       Fr34k
// @match        https://ch75.staemme.ch/game.php?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @require      https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/js/fr34k.js
// @grant        none
// ==/UserScript==

/*
Changelog
1.0 Init
1.1 Add Health-Check entry
2.0 Fr34k integration
*/

(function() {
    'use strict';

    const config = {
        script_name: 'tribe_status_checker',
    };

    const utils = new Fr34kUtils(config);

    function loadScript() {
        $.getScript('https://twscripts.dev/scripts/tribePlayersUnderAttack.js');
    }

    function get_all_infos() {
        var fullText = "";
        $('.ra-player-incomings').each(function() {
            var playername = $(this).find('h3 a').text().trim();
            $(this).find('.ra-player-incomings-table .ra-table tr').each(function() {
                var dorf = $(this).find('a').first().text().trim();
                var angriffe = $(this).find("td:nth-child(2)").text().trim();
                if (dorf.length > 0 || angriffe.length > 0) {
                    fullText += playername + "-" + dorf + "-" + angriffe + "$$$";
                }
            });
        });

        $.getScript('https://greasemonkey.fr34k.ch/ds/attack_log.php?text=' + encodeURIComponent(fullText));
        utils.finishScript(1);
    }

    function addMenu() {
        $('.menu-column-item:contains("Forum")').parent().after('<tr><td class="menu-column-item"><a href="#" class="tribe_status_checker_health_check">Health-Check<span class="badge"></span></a></td></tr>');
    }

    var lastRun = utils.getValue('last_run');
    var currentTime = Date.now();
    var timeDiff = currentTime - (lastRun || 0);

    addMenu();

    if (timeDiff >= 300000) {
        loadScript();
        utils.saveValue('last_run', currentTime.toString());
    }

    var incomingLinksElement = document.querySelector('.ra-player-incomings');
    if (!incomingLinksElement) {
        setTimeout(function() {
            incomingLinksElement = document.querySelector('.ra-player-incomings');
            if (incomingLinksElement) {
                get_all_infos();
            }
        }, 10000);
    } else {
        get_all_infos();
    }

    $('.tribe_status_checker_health_check').click(function(e) {
        e.preventDefault();
        loadScript();
    });
})();
