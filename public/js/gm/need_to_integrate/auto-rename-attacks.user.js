// ==UserScript==
// @name         Auto-Refresh and Rename Attacks
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Fr34k
// @match        *.staemme.ch/game.php?village=*screen=overview_villages&mode=incomings&*type=*
// @match        *.staemme.ch/game.php?screen=overview_villages&mode=incomings&*type=*&village=*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    console.log('Script aktiv: Auto-Refresh and Rename');
    if (document.title.includes("001")) {
        var x = Math.floor((Math.random() * 600000) + 300000);
        UI.InfoMessage('Auto-Refresh in ' + x + 'ms',x,true);
        var interval = setInterval(doIt, x);

        function doIt(){
            console.log('click select all');
            $('#select_all').click();
            console.log('click unbenennen');
            $("input[value='Beschrifte']").click();
        }
    } else {
        console.log('Not in 001');
    }
})();