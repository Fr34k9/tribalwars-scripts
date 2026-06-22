// ==UserScript==
// @name         Nice Overview
// @namespace    http://Fr34k.ch
// @version      1.0
// @description  Shows village closer to each other.
// @author       Fr34k
// @match        *.staemme.ch/game.php?village=*&screen=overview_villages&mode=prod*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    console.log("[Fr34k|Nice overview] Script aktiv");

    // set unit order styling
    $('ul[id^="unit_order"]').css("min-width", "12em");
    $('.order').css("margin-right", "0px");

    // remove text from building order
    var elements = $('ul[id^="building_order"]').parent();
    elements.each(function(element){
        var html = $(this).html();
        var position = html.indexOf('<ul');
        if( position >= 0 ) {
            html = html.substring(position); // +4 to include the '<br>' itself
        }
        $(this).html(html);
    });

    // Warehouse perc
    var notifyPercentage = 97;
    var minWarehouseSize = 80000;
    $.getScript("https://dl.dropboxusercontent.com/s/8j8yi1ojbq3af3u/WHperc_minified.js");
})();