// ==UserScript==
// @name         Farm God Addon Enter
// @namespace    http://Fr34k.ch
// @version      2.0
// @description  Farm God Addon. Adds Enter Button to Farmgod. Sit back.
// @author       Fr34k
// @match        *.staemme.ch/game.php?village=*&screen=am_farm*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @require      https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/js/fr34k.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const config = {
        script_name: 'farmgod_addon_enter',
    };

    const utils = new Fr34kUtils(config);

    var clicked = 0;
    var timeoutIds = [];

    $('h3:contains("Farm-Assi")').append('<img id="fga_auto_enter" style="margin-left: 10px; cursor: pointer;" src="/graphic/unit/speed.png">');

    $('#fga_auto_enter').click(function() {
        if (clicked == 1) {
            for (var i = 0; i < timeoutIds.length; i++) {
                clearTimeout(timeoutIds[i]);
            }
            timeoutIds = [];
            clicked = 0;
            return false;
        }

        const elements = $(".farmRow .farmGod_icon");
        const delay = 250;

        if (elements.length < 1) {
            UI.ErrorMessage("Run FarmGod first", 1000);
            return false;
        }

        clicked = 1;
        elements.each(function(index) {
            var element = $(this);
            var timeoutId = setTimeout(function() {
                element.click();
            }, index * delay);
            timeoutIds.push(timeoutId);
        });

        utils.finishScript(elements.length);
    });
})();
