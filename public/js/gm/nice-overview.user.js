// ==UserScript==
// @name         Nice Overview
// @namespace    http://Fr34k.ch
// @version      2.0
// @description  Modifies the overview page to be more user friendly. Adds a percentage to the warehouse fullness and highlights the row if the warehouse is over a certain percentage full.
// @author       Fr34k
// @match        *.staemme.ch/game.php?village=*&screen=overview_villages&mode=prod*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @require      https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/js/fr34k.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const config = {
        script_id: 3,
        script_name: 'nice_overview',
        debug: true,
    };

    const utils = new Fr34kUtils(config);

    function style() {
        // set unit order styling
        $('ul[id^="unit_order"]').css("min-width", "12em");
        $('.order').css("margin-right", "0px");
    }

    function removeText() {
        // remove text from building order
        var elements = $('ul[id^="building_order"]').parent();
        elements.each(function (element) {
            var html = $(this).html();
            var position = html.indexOf('<ul');
            if (position >= 0) {
                html = html.substring(position); // +4 to include the '<br>' itself
            }
            $(this).html(html);
        });
    }


    style();
    removeText();

    utils.logMessage('Loading external script WHperc', 'debug');
    $.getScript("https://dl.dropboxusercontent.com/s/8j8yi1ojbq3af3u/WHperc_minified.js");
})();