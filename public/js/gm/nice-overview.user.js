// ==UserScript==
// @name         Nice Overview
// @namespace    https://Fr34k.ch
// @version      2.0
// @description  Modifies the overview page to be more user friendly. Adds a percentage to the warehouse fullness.
// @author       Fr34k
// @match        *.staemme.ch/game.php?village=*&screen=overview_villages*&mode=prod*
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
        utils.logMessage('Styling overview', 'info');
        $('ul[id^="unit_order"]').css("min-width", "12em");
        $('.order').css("margin-right", "0px");
    }

    function removeText() {
        utils.logMessage('Remove text from building order', 'info');
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

    function showPercentage() {
        utils.logMessage('Show percentage', 'info');
        $('<style>')
            .text(`
                .fr34k-percentage-cell {
                    position: relative;
                    min-width: 50px;
                }
                .fr34k-progress-bar {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    z-index: 1;
                }
                .fr34k-percentage-text {
                    position: relative;
                    z-index: 2;
                }
            `)
            .appendTo('head');

        // Get highest resource value from a row
        const getHighestResource = $row => {
            const resources = ['wood', 'stone', 'iron'].map(type =>
                parseFloat($row.find(`.res.${type}`).text().replace('.', ''))
            );
            return Math.max(...resources);
        };

        // Get color based on percentage
        const getBackgroundColor = percentage => {
            const value = percentage / 100;
            return `rgba(${255 * value}, ${255 * (1 - value)}, 0, 1)`;
        };

        // Sort table function
        const sortTable = (table, columnIndex, ascending) => {
            const rows = table.find('tr:gt(0)').toArray();
            rows.sort((a, b) => {
                const aVal = parseFloat($(a).find(`td:eq(${columnIndex})`).find('.fr34k-percentage-text').text());
                const bVal = parseFloat($(b).find(`td:eq(${columnIndex})`).find('.fr34k-percentage-text').text());
                return ascending ? aVal - bVal : bVal - aVal;
            });
            table.find('tr:gt(0)').remove();
            table.append(rows);
        };

        // Main script
        const $table = $('#production_table').first();
        if (!$table.length) return;

        // Add header
        const $header = $('<th>Ress %</th>').css({
            'cursor': 'pointer',
            'white-space': 'nowrap'
        });
        $table.find('tr:first th:eq(3)').after($header);

        // Process each row
        let ascending = false;
        $table.find('tr:gt(0)').each(function () {
            const $row = $(this);
            const highestResource = getHighestResource($row);
            const total = parseFloat($row.find('td:eq(4)').text());
            const percentage = (highestResource / total * 100).toFixed(2);
            const bgcolor = getBackgroundColor(parseFloat(percentage));

            const $newCell = $('<td>')
                .addClass('fr34k-percentage-cell')
                .append(
                    $('<div>')
                        .addClass('fr34k-progress-bar')
                        .css({
                            'background-color': bgcolor,
                            'width': `${percentage}%`
                        })
                )
                .append(
                    $('<span>')
                        .addClass('fr34k-percentage-text')
                        .text(percentage + '%')
                );

            // Insert after the 4th column
            $row.find('td:eq(3)').after($newCell);
        });

        // Add click handler for sorting
        $header.on('click', function () {
            const columnIndex = $(this).index();
            sortTable($table, columnIndex, ascending);
            ascending = !ascending;
        });
    }

    style();
    removeText();
    showPercentage();

    utils.finishScript();
})();