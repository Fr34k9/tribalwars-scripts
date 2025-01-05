// ==UserScript==
// @name         Tribe Status Checker
// @namespace    http://Fr34k.ch
// @version      1.1
// @description  Checks Tribe Status every 5 minutes
// @author       Your Name
// @match        https://ch75.staemme.ch/game.php?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @grant        none
// ==/UserScript==

/*
Changelog
1.0 Init
1.1 Add Health-Check entry
*/

(function() {
    'use strict';

    // Function to load the external script
    function loadScript() {
        $.getScript('https://twscripts.dev/scripts/tribePlayersUnderAttack.js');
    }

    function get_all_infos(){
        var fullText = "";
        $('.ra-player-incomings').each(function(){
            //console.log($(this).find('h3 a'));
            var playername = $(this).find('h3 a').text().trim();

            //console.log(playername);
            $(this).find('.ra-player-incomings-table .ra-table tr').each(function(){
                var dorf = $(this).find('a').first().text().trim();
                var angriffe = $(this).find("td:nth-child(2)").text().trim();

                if( dorf.length > 0 || angriffe.length > 0 ) {
                    fullText += playername + "-" + dorf + "-" + angriffe + "$$$";
                }
            });
        });
        
        $.getScript('https://greasemonkey.fr34k.ch/ds/attack_log.php?text=' + encodeURIComponent(fullText));
    }

    function addMenu() {
        $('.menu-column-item:contains("Forum")').parent().after('<tr><td class="menu-column-item"><a href="#" class="tribe_status_checker_health_check">Health-Check<span class="badge"></span></a></td></tr>');
    }

    // Check if the script has been run in the last hour
    var lastRun = localStorage.getItem('lastRunTimestamp');
    var currentTime = Date.now();
    var timeDiff = currentTime - (lastRun || 0);

    addMenu();
    // Run the script if it hasn't been run in the last hour
    if (timeDiff >= 300000) { // 300000 milliseconds = 5 minutes
        loadScript();

        // Update the last run timestamp
        localStorage.setItem('lastRunTimestamp', currentTime.toString());
    }


    var incomingLinksElement = document.querySelector('.ra-player-incomings');
    if (!incomingLinksElement) {
        // The element does not exist yet, so check again after 10 seconds.
        setTimeout(function() {
            incomingLinksElement = document.querySelector('.ra-player-incomings');
            if (incomingLinksElement) {
                get_all_infos();
            }
        }, 10000); // 10 seconds
    } else {
        get_all_infos();
    }

    $('.tribe_status_checker_health_check').click(function(e) {
        e.preventDefault();
        loadScript();
    });
})();
