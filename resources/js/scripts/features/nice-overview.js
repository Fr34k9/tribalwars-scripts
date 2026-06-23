import { Fr34kUtils } from '../fr34k.js';

export function run() {
    const utils = new Fr34kUtils({ script_name: 'nice_overview' });

    function style() {
        $('ul[id^="unit_order"]').css('min-width', '12em');
        $('.order').css('margin-right', '0px');
    }

    function removeText() {
        $('ul[id^="building_order"]').parent().each(function () {
            const html = $(this).html();
            const pos = html.indexOf('<ul');
            if (pos >= 0) $(this).html(html.substring(pos));
        });
    }

    function showPercentage() {
        $('<style>').text(`
            .fr34k-percentage-cell { position: relative; min-width: 50px; }
            .fr34k-progress-bar { position: absolute; top: 0; left: 0; height: 100%; z-index: 1; }
            .fr34k-percentage-text { position: relative; z-index: 2; }
        `).appendTo('head');

        const getHighestResource = $row =>
            Math.max(...['wood', 'stone', 'iron'].map(t => parseFloat($row.find(`.${t}`).text().replace('.', ''))));

        const getBackgroundColor = pct => {
            const v = pct / 100;
            return `rgba(${255 * v}, ${255 * (1 - v)}, 0, 1)`;
        };

        const sortTable = (table, colIdx, asc) => {
            const rows = table.find('tr:gt(0)').toArray().sort((a, b) => {
                const av = parseFloat($(a).find(`td:eq(${colIdx})`).find('.fr34k-percentage-text').text());
                const bv = parseFloat($(b).find(`td:eq(${colIdx})`).find('.fr34k-percentage-text').text());
                return asc ? av - bv : bv - av;
            });
            table.find('tr:gt(0)').remove();
            table.append(rows);
        };

        const $table = $('#production_table').first();
        if (!$table.length) return;

        let ascending = false;
        const $header = $('<th>Ress %</th>').css({ cursor: 'pointer', 'white-space': 'nowrap' });
        $table.find('tr:first th:eq(3)').after($header);

        $table.find('tr:gt(0)').each(function () {
            const $row = $(this);
            const highest = getHighestResource($row);
            const total = parseFloat($row.find('td:eq(4)').text());
            const pct = (highest / total * 100).toFixed(2);

            const $cell = $('<td>').addClass('fr34k-percentage-cell')
                .append($('<div>').addClass('fr34k-progress-bar').css({ 'background-color': getBackgroundColor(pct), width: `${pct}%` }))
                .append($('<span>').addClass('fr34k-percentage-text').text(pct + '%'));

            $row.find('td:eq(3)').after($cell);
        });

        $header.on('click', function () {
            sortTable($table, $(this).index(), ascending);
            ascending = !ascending;
        });
    }

    function highlightUpcomingCompletions() {
        const TIME_PATTERNS = {
            TODAY:    ['hüt um ', 'heute um ', 'today at '],
            TOMORROW: ['morn um ', 'morgen um ', 'tomorrow at '],
        };

        function convertGameDateToTimestamp(dateText) {
            const d = new Date();
            const [y, m, day] = [d.getFullYear(), d.getMonth() + 1, d.getDate()];
            let text = dateText;
            TIME_PATTERNS.TODAY.forEach(p => { text = text.replace(p, `${y}-${m}-${day} `); });
            TIME_PATTERNS.TOMORROW.forEach(p => { text = text.replace(p, `${y}-${m}-${day + 1} `); });
            return Date.parse(text + 'Z') - 3600000;
        }

        const selector = '#production_table tbody tr td:nth-child(8) #order_0 .queue_icon';
        const timeRegex = /(hüt|morn|heute|morgen|today|tomorrow) (um |at )?(\d{2}:\d{2})/g;

        $(selector).each(function () {
            const match = $(this).html().match(timeRegex);
            if (match?.[0]) {
                const ts = convertGameDateToTimestamp(match[0] + ':59');
                if (ts - Date.now() < 3 * 60 * 1000) {
                    $(this).parent().parent().parent().css('background-color', 'green');
                }
            }
        });
    }

    style();
    removeText();
    showPercentage();
    highlightUpcomingCompletions();
    utils.finishScript();
}
