// ==UserScript==
// @name         Building Completion Highlighter
// @namespace    http://Fr34k.ch
// @version      2.0
// @description  Highlights buildings that will complete construction within the next 3 minutes
// @author       Fr34k
// @match        *.staemme.ch/game.php?*&screen=overview_villages*&mode=prod*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @require      https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/js/fr34k.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const config = {
        script_id: 2,
        script_name: 'building_completion_highlighter',
        debug: true,
        highlight_minutes: 3,
        highlight_color: 'green',
    };

    const utils = new Fr34kUtils(config);

    // Configuration
    const TIME_PATTERNS = {
        TODAY: ['hüt um ', 'heute um '],
        TOMORROW: ['morn um ', 'morgen um ']
    };

    /**
     * Converts game-specific date text to milliseconds timestamp
     * @param {string} dateText - Date text in game format (e.g., "heute um 15:30")
     * @returns {number} - Timestamp in milliseconds
     */
    function convertGameDateToTimestamp(dateText) {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();

        let formattedDate = dateText;

        // Replace today patterns
        TIME_PATTERNS.TODAY.forEach(pattern => {
            formattedDate = formattedDate.replace(pattern, `${year}-${month}-${day} `);
        });

        // Replace tomorrow patterns
        TIME_PATTERNS.TOMORROW.forEach(pattern => {
            formattedDate = formattedDate.replace(pattern, `${year}-${month}-${day + 1} `);
        });

        // Parse the date and adjust for timezone
        let timestamp = Date.parse(formattedDate + 'Z');
        // Adjust for winter time (CET)
        timestamp = timestamp - (60 * 60 * 1000); // Subtract 1 hour (3600000 ms)

        return timestamp;
    }

    /**
     * Check and highlight buildings completing soon
     */
    function highlightUpcomingCompletions() {
        const selector = '#production_table tbody tr td:nth-child(8) #order_0 .queue_icon';
        const timeRegex = /(hüt|morn|heute|morgen) um (\d{2}:\d{2})/g;

        $(selector).each(function () {
            const buildingInfo = $(this).html();
            const completionTime = buildingInfo.match(timeRegex);

            if (completionTime && completionTime[0]) {
                const completionTimestamp = convertGameDateToTimestamp(completionTime[0] + ':59');
                const currentTime = new Date().getTime();
                const timeUntilCompletion = completionTimestamp - currentTime;

                // Highlight if completing within specified minutes
                if (timeUntilCompletion < config.highlight_minutes * 60 * 1000) {
                    $(this).parent().parent().parent().css('background-color', config.highlight_color);
                }
            }
        });
    }

    // Run the highlighting function
    highlightUpcomingCompletions();
    utils.finishScript(1);
})();