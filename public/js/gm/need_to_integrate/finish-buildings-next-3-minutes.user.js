// ==UserScript==
// @name         Finish Buildings next 3 minutes
// @namespace    http://Fr34k.ch
// @version      1.2
// @description  Shows all buildings with a green background which are finish within next 3 minutes or ask a Fr34k ♥
// @author       Fr34k
// @match        https://*.staemme.ch/game.php?*&screen=overview_villages*&mode=prod*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// ==/UserScript==

(function() {
    'use strict';
    console.log('Script aktiv: Alle Dorfer gruen anfaerben welche in den naechsten 3 Minuten die Bauschleife beenden');
    var minutes = 3;

    $('#production_table tbody tr td:nth-child(8) #order_0 .queue_icon').each(function( index ) {
        var html = $( this ).html();

        const regex = /(hüt|morn) um (\d{2}:\d{2})/g;
        const endtime = html.match(regex);
        const enddate = staemme_date_to_ms( endtime[0] + ":59" );
        var now = new Date().getTime();

        // difference
        if( enddate - now < minutes * 60000) {
            $(this).css('background-color', 'green');
        }
    });


    function staemme_date_to_ms( text ) {
        var current_date = new Date();
        var time = text;
        time = time.replace("hüt um ", current_date.getFullYear()+'-'+(parseInt(current_date.getMonth())+1)+'-'+current_date.getDate()+' '); //Replace heute um durch Datum
        time = time.replace("heute um ", current_date.getFullYear()+'-'+(parseInt(current_date.getMonth())+1)+'-'+current_date.getDate()+' '); //Replace heute um durch Datum
        time = time.replace("morn um ", current_date.getFullYear()+'-'+(parseInt(current_date.getMonth())+1)+'-'+(parseInt(current_date.getDate())+1)+' '); //Replace morgen um durch Datum von morgen
        time = time.replace("morgen um ", current_date.getFullYear()+'-'+(parseInt(current_date.getMonth())+1)+'-'+(parseInt(current_date.getDate())+1)+' '); //Replace morgen um durch Datum von morgen

        let time_ms = Date.parse(time + 'Z');
        //time_ms = parseInt(time_ms) - 7200000; // Sommerzeit
        time_ms = parseInt(time_ms) - 3600000; // Winterzeit
        return time_ms;
    }
})();