// ==UserScript==
// @name         Farm God Addon Enter
// @namespace    http://Fr34k.ch
// @version      1.0
// @description  Farm God Addon. Adds Enter Button to Farmgod. Sit back.
// @author       Fr34k
// @match        *.staemme.ch/game.php?village=*&screen=am_farm*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    console.log("[Fr34k|Farm God Addon Enter] Script aktiv");
    var clicked = 0;
    var timeoutIds = [];

    $('h3:contains("Farm-Assi")').append('<img id="fga_auto_enter" style="margin-left: 10px; cursor: pointer;" src="/graphic/unit/speed.png">');

    $('#fga_auto_enter').click(function() {
        if( clicked == 1 ) {
            for (var i = 0; i < timeoutIds.length; i++) {
                clearTimeout(timeoutIds[i]);
            }
            timeoutIds = [];
            clicked = 0;
            return false;
        }

        const elements = $(".farmRow .farmGod_icon");
        const delay = 250;

        if(elements.length < 1) {
            UI.ErrorMessage("Run FarmGod first", 1000)
            return false;
        }

        clicked = 1;
        elements.each(function (index) {
            // check if botschutz detected, than continue with 5 clicks
            var element = $(this);
            var timeoutId = setTimeout(function() {
                element.click();
            }, index * delay);
            timeoutIds.push(timeoutId);
        });
    });
})();