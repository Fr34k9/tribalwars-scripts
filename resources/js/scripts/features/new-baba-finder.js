import { Fr34kUtils } from '../fr34k.js';

export function run() {
    const utils = new Fr34kUtils({ script_name: 'new_baba_finder' });

    const currentVillageId = game_data.village.id;
    const currentX = game_data.village.x;
    const currentY = game_data.village.y;

    // --- UI ---

    const widget = `
        <style>
            #nbf-table-wrap { max-height: 450px; overflow-y: auto; margin-top: 8px; }
            #nbf-results { width: 100%; border-collapse: collapse; }
            #nbf-results th, #nbf-results td { padding: 4px 8px; text-align: center; border: 1px solid #bd9c5a; font-size: 12px; }
            #nbf-results tr:nth-child(even) td { background: #f0e2be; }
            #nbf-results tr:nth-child(odd) td { background: #fff5da; }
            #nbf-results th { background: #c1a264; }
        </style>
        <div class="vis">
            <h4>New Baba Finder</h4>
            <table style="width:100%">
                <tbody>
                    <tr>
                        <th style="text-align:center">Center Village</th>
                        <th style="text-align:center">Radius</th>
                        <th style="text-align:center">Min Points</th>
                        <th style="text-align:center">Max Points</th>
                        <th style="text-align:center"></th>
                    </tr>
                    <tr>
                        <td style="text-align:center"><input type="text" id="nbf-center" value="${currentX}|${currentY}"></td>
                        <td style="text-align:center">
                            <select id="nbf-radius">
                                <option>10</option><option>20</option><option>30</option>
                                <option selected>50</option><option>70</option><option>100</option>
                                <option>150</option><option>999</option>
                            </select>
                        </td>
                        <td style="text-align:center"><input type="text" id="nbf-min" value="26"></td>
                        <td style="text-align:center"><input type="text" id="nbf-max" value="12154"></td>
                        <td style="text-align:center">
                            <button id="nbf-find" class="btn btn-confirm-yes">Find</button>
                            <button id="nbf-reset" class="btn btn-confirm-no">Reset</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div id="nbf-status" style="margin-top:6px; font-size:12px;"></div>
            <div id="nbf-table-wrap" style="display:none;">
                <table id="nbf-results">
                    <thead>
                        <tr>
                            <th>#</th><th>K</th><th>Coords</th><th>Points</th><th>Dist.</th><th>Attack</th>
                        </tr>
                    </thead>
                    <tbody id="nbf-tbody"></tbody>
                </table>
            </div>
        </div>
    `;

    $('#am_widget_Farm').before(widget);

    // --- Event handlers ---

    $('#nbf-find').on('click', async function () {
        $('#nbf-find').prop('disabled', true).text('Loading...');
        $('#nbf-status').text('');
        $('#nbf-table-wrap').hide();
        $('#nbf-tbody').html('');

        try {
            setStatus('Fetching Farm Assistant coords...');
            const farmCoords = await getAllFarmCoords();

            setStatus('Fetching world village data...');
            const barbs = await getBarbarianVillages();

            const centerCoord = $('#nbf-center').val().trim();
            const radius = parseInt($('#nbf-radius').val());
            const minPoints = parseInt($('#nbf-min').val());
            const maxPoints = parseInt($('#nbf-max').val());

            const filtered = barbs.filter(v => {
                const coord = v.x + '|' + v.y;
                if (farmCoords.has(coord)) return false;
                if (v.points < minPoints || v.points > maxPoints) return false;
                if (calcDistance(centerCoord, coord) > radius) return false;
                return true;
            });

            filtered.sort((a, b) =>
                calcDistance(centerCoord, a.x + '|' + a.y) - calcDistance(centerCoord, b.x + '|' + b.y)
            );

            if (filtered.length === 0) {
                setStatus('No new barbarian villages found matching your filters.');
            } else {
                setStatus(`Found ${filtered.length} new barb(s) — ${farmCoords.size} already in Farm Assistant excluded.`);
                renderTable(filtered, centerCoord);
                $('#nbf-table-wrap').show();
                utils.finishScript(filtered.length);
            }
        } catch (err) {
            setStatus('Error: ' + err.message);
            utils.logMessage('Error: ' + err, 'error');
        }

        $('#nbf-find').prop('disabled', false).text('Find new barbs');
    });

    $('#nbf-reset').on('click', function () {
        $('#nbf-center').val(currentX + '|' + currentY);
        $('#nbf-radius').val('50');
        $('#nbf-min').val('26');
        $('#nbf-max').val('12154');
        $('#nbf-status').text('');
        $('#nbf-table-wrap').hide();
        $('#nbf-tbody').html('');
    });

    // --- Core logic ---

    async function getAllFarmCoords() {
        const coords = new Set();
        let page = 0;
        let totalPages = 1;

        while (page < totalPages) {
            const response = await $.get(`/game.php?village=${currentVillageId}&screen=am_farm&order=distance&dir=asc&Farm_page=${page}`);
            const $doc = $(response);

            $doc.find('#plunder_list tr[id^="village_"] td:nth-child(4) a').each(function () {
                const match = $(this).text().trim().match(/\(([^)]+)\)/);
                if (match) coords.add(match[1]);
            });

            if (totalPages <= 1) {
                const lastPage = parseInt($doc.find('#plunder_list_nav .paged-nav-item').last().text().replace(/\[|\]/g, ''));
                if (!isNaN(lastPage)) totalPages = lastPage;
            }

            utils.logMessage(`Farm page ${page + 1}/${totalPages} fetched`, 'debug');
            page++;
            if (page < totalPages) await utils.sleep(400);
        }

        return coords;
    }

    async function getBarbarianVillages() {
        const response = await $.get('/map/village.txt');
        const barbs = [];

        response.split('\n').forEach(line => {
            if (!line.trim()) return;
            const parts = line.split(',');
            if (parts.length < 7) return;
            if (parseInt(parts[4]) !== 0) return;

            barbs.push({
                id: parseInt(parts[0]),
                name: decodeURIComponent(parts[1].replace(/\+/g, ' ')),
                x: parseInt(parts[2]),
                y: parseInt(parts[3]),
                points: parseInt(parts[5]),
            });
        });

        utils.logMessage(`Found ${barbs.length} barbarian villages in world data`, 'debug');
        return barbs;
    }

    function renderTable(barbs, centerCoord) {
        let rows = '';
        barbs.forEach((barb, i) => {
            const coord = barb.x + '|' + barb.y;
            const dist = calcDistance(centerCoord, coord).toFixed(1);
            const continent = String(barb.y).charAt(0) + String(barb.x).charAt(0);
            rows += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${continent}</td>
                    <td><a href="/game.php?screen=info_village&id=${barb.id}" target="_blank">${coord}</a></td>
                    <td>${barb.points.toLocaleString()}</td>
                    <td>${dist}</td>
                    <td><a href="/game.php?village=${currentVillageId}&screen=place&target=${barb.id}&spy=1" target="_blank" class="btn btn-confirm-yes">Attack</a></td>
                </tr>`;
        });
        $('#nbf-tbody').html(rows);
    }

    // --- Helpers ---

    function calcDistance(coordA, coordB) {
        const [x1, y1] = coordA.split('|').map(Number);
        const [x2, y2] = coordB.split('|').map(Number);
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    function setStatus(msg) {
        $('#nbf-status').text(msg);
        utils.logMessage(msg, 'debug');
    }
}
