// ==UserScript==
// @name         Fr34k Scripts
// @namespace    https://fr34k.ch
// @version      1.0.0
// @author       Fr34k
// @description  All Fr34k Tribal Wars scripts in one install
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @match        *://*.staemme.ch/game.php*
// @match        *://*.die-staemme.de/game.php*
// @match        *://*.tribalwars.net/game.php*
// @match        *://*.tribalwars.nl/game.php*
// @match        *://*.tribalwars.com.br/game.php*
// @match        *://*.tribalesguerra.com/game.php*
// @match        *://*.guerrastribales.es/game.php*
// @match        *://*.ds-ultimate.de/tools/attackPlanner/*
// @grant        none
// ==/UserScript==

(function() {
	"use strict";
	var Fr34kUtils = class {
		constructor(config) {
			this.serverUrl = "https://tribalwars-scripts.fr34k.ch/api/";
			this.config = config;
			if (!this.checkConfig()) return;
			this.initScript();
		}
		checkConfig() {
			if (!this.config.script_name) {
				this.logMessage("Missing config field: script_name", "error");
				return false;
			}
			return true;
		}
		uiMessage(message, visibleTime = 60) {
			UI.InfoMessage(message, visibleTime, true);
		}
		logMessage(message, type = "info") {
			const styles = {
				info: "color: blue; font-weight: bold;",
				debug: "color: orange; font-weight: bold;",
				error: "color: red; font-weight: bold;",
				warn: "color: orange; font-weight: bold;"
			};
			console.log(`%c[Fr34k-${this.config.script_name}] ${message}`, styles[type] || styles.info);
		}
		initScript() {
			this.logMessage(`Script ${this.config.script_name} active`, "info");
			if (!this.getValue("first_run")) this.registerScript();
			this.countScriptRuns();
		}
		finishScript(actions = 1) {
			if (actions > 0) this.countScriptActions(actions);
			this.logMessage("Script finished", "info");
		}
		async registerScript() {
			$.ajax({
				url: this.serverUrl + "scripts/" + this.config.script_name + "/register",
				type: "POST",
				data: {
					player: game_data.player.name || "Unknown",
					account_manager: game_data.features.AccountManager.active ? 1 : 0,
					premium: game_data.features.Premium.active ? 1 : 0,
					world: game_data.world || "Unknown"
				},
				success: () => {
					this.logMessage("First run registered", "debug");
					this.saveValue("first_run", true);
				},
				error: () => this.logMessage("Failed to register script", "error")
			});
		}
		async countScriptRuns() {
			$.ajax({
				url: this.serverUrl + "scripts/" + this.config.script_name + "/run",
				type: "POST",
				data: { player: game_data.player.name },
				success: (response) => this.logMessage(`Total runs: ${response.count}`, "info"),
				error: () => this.logMessage("Failed to count run", "error")
			});
		}
		async countScriptActions(counter) {
			$.ajax({
				url: this.serverUrl + "scripts/" + this.config.script_name + "/action",
				type: "POST",
				data: {
					counter,
					player: game_data.player.name
				},
				success: (response) => this.logMessage(`Total actions: ${response.counter}`, "info"),
				error: () => this.logMessage("Failed to count actions", "error")
			});
		}
		random = {
			delay: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
			number: (min, max) => Math.random() * (Number(max) - Number(min)) + Number(min)
		};
		unitPopulationCost = {
			spear: 1,
			sword: 1,
			axe: 1,
			archer: 1,
			spy: 2,
			light: 4,
			marcher: 5,
			heavy: 6,
			ram: 5,
			catapult: 8,
			knight: 10,
			snob: 100
		};
		sleep(milliseconds) {
			return new Promise((resolve) => setTimeout(resolve, milliseconds));
		}
		botDetected() {
			const detected = [
				"#botprotection_quest",
				"#bot_check",
				"#popup_box_bot_protection"
			].some((sel) => $(sel).length > 0);
			if (detected) this.logMessage("Bot detected", "warn");
			return detected;
		}
		saveValue(key, value) {
			localStorage.setItem(this.config.script_name + "_" + key, value);
		}
		getValue(key) {
			return localStorage.getItem(this.config.script_name + "_" + key);
		}
		getParameterByName(key) {
			return new URL(window.location.href).searchParams.get(key);
		}
	};
	function run$13() {
		const utils = new Fr34kUtils({
			script_name: "farm_god_addon",
			farmgod_script: "https://higamy.github.io/TW/Scripts/Approved/FarmGodCopy.js"
		});
		function createMenu() {
			const template = `
            <div class="vis">
                <h4>Auto Farm-God</h4>
                <table id="farm_god_addon_settings" style="width:100%">
                    <tbody>
                        <tr>
                            <th style="text-align:center">Autofarm</th>
                            <th style="text-align:center">Reload Page (seconds)</th>
                            <th style="text-align:center">Next Reload</th>
                        </tr>
                        <tr>
                            <td style="text-align:center"><input type="checkbox" id="farm_god_addon_autofarm" ${utils.getValue("autorefresh") === "1" ? "checked" : ""}></td>
                            <td style="text-align:center"><input id="farm_god_addon_refresh_time" type="text" value="${utils.getValue("refresh_time") || 1e3}"></td>
                            <td style="text-align:center" id="farm_god_addon_next_refresh">-</td>
                        </tr>
                    </tbody>
                </table>
            </div>`;
			$("#am_widget_Farm").before(template);
		}
		const farmSequence = {
			step1: () => {
				utils.logMessage("Starting step 1", "debug");
				if (utils.getValue("autorefresh") === "1") {
					$.getScript(utils.config.farmgod_script);
					utils.sleep(utils.random.delay(1e3, 2e3)).then(farmSequence.step2);
				}
			},
			step2: () => {
				utils.logMessage("Starting step 2", "debug");
				if (utils.getValue("autorefresh") === "1") {
					$(".optionsContent .optionButton")[0].click();
					utils.sleep(utils.random.delay(6e3, 12e3)).then(farmSequence.step3);
				}
			},
			step3: () => {
				utils.logMessage("Starting step 3", "debug");
				if (utils.getValue("autorefresh") === "1") {
					let totalDelay = 0;
					let totalActions = 0;
					const elements = $(".farmRow .farmGod_icon");
					elements.each((index, element) => {
						totalDelay += utils.random.delay(250, 400);
						utils.sleep(totalDelay).then(() => {
							if (utils.getValue("autorefresh") === "1" && !utils.botDetected()) {
								$(element).click();
								totalActions++;
								if (index === elements.length - 1) utils.finishScript(totalActions);
							}
						});
					});
				}
			}
		};
		function setRefreshTimeAndReloadPage() {
			const refreshTime = (utils.getValue("refresh_time") || 1e3) * utils.random.number(.7, 1.3) * 1e3;
			const nextRefresh = new Date(Date.now() + refreshTime);
			$("#farm_god_addon_next_refresh").text(nextRefresh.toLocaleString());
			utils.logMessage("Refreshing page on " + nextRefresh.toLocaleString(), "debug");
			utils.sleep(refreshTime).then(() => {
				if (!utils.botDetected()) location.reload();
			});
		}
		utils.sleep(2e3).then(() => utils.botDetected());
		createMenu();
		$("#farm_god_addon_autofarm").on("click", function() {
			const value = $(this).is(":checked") ? "1" : "0";
			utils.saveValue("autorefresh", value);
			if (value === "1") location.reload();
		});
		$("#farm_god_addon_refresh_time").on("change", function() {
			utils.saveValue("refresh_time", $(this).val());
		});
		utils.sleep(utils.random.delay(1e4, 15e3)).then(farmSequence.step1);
		setRefreshTimeAndReloadPage();
	}
	function run$12() {
		const utils = new Fr34kUtils({ script_name: "nice_overview" });
		function style() {
			$("ul[id^=\"unit_order\"]").css("min-width", "12em");
			$(".order").css("margin-right", "0px");
		}
		function removeText() {
			$("ul[id^=\"building_order\"]").parent().each(function() {
				const html = $(this).html();
				const pos = html.indexOf("<ul");
				if (pos >= 0) $(this).html(html.substring(pos));
			});
		}
		function showPercentage() {
			$("<style>").text(`
            .fr34k-percentage-cell { position: relative; min-width: 50px; }
            .fr34k-progress-bar { position: absolute; top: 0; left: 0; height: 100%; z-index: 1; }
            .fr34k-percentage-text { position: relative; z-index: 2; }
        `).appendTo("head");
			const getHighestResource = ($row) => Math.max(...[
				"wood",
				"stone",
				"iron"
			].map((t) => parseFloat($row.find(`.${t}`).text().replace(".", ""))));
			const getBackgroundColor = (pct) => {
				const v = pct / 100;
				return `rgba(${255 * v}, ${255 * (1 - v)}, 0, 1)`;
			};
			const sortTable = (table, colIdx, asc) => {
				const rows = table.find("tr:gt(0)").toArray().sort((a, b) => {
					const av = parseFloat($(a).find(`td:eq(${colIdx})`).find(".fr34k-percentage-text").text());
					const bv = parseFloat($(b).find(`td:eq(${colIdx})`).find(".fr34k-percentage-text").text());
					return asc ? av - bv : bv - av;
				});
				table.find("tr:gt(0)").remove();
				table.append(rows);
			};
			const $table = $("#production_table").first();
			if (!$table.length) return;
			let ascending = false;
			const $header = $("<th>Ress %</th>").css({
				cursor: "pointer",
				"white-space": "nowrap"
			});
			$table.find("tr:first th:eq(3)").after($header);
			$table.find("tr:gt(0)").each(function() {
				const $row = $(this);
				const pct = (getHighestResource($row) / parseFloat($row.find("td:eq(4)").text()) * 100).toFixed(2);
				const $cell = $("<td>").addClass("fr34k-percentage-cell").append($("<div>").addClass("fr34k-progress-bar").css({
					"background-color": getBackgroundColor(pct),
					width: `${pct}%`
				})).append($("<span>").addClass("fr34k-percentage-text").text(pct + "%"));
				$row.find("td:eq(3)").after($cell);
			});
			$header.on("click", function() {
				sortTable($table, $(this).index(), ascending);
				ascending = !ascending;
			});
		}
		function highlightUpcomingCompletions() {
			const TIME_PATTERNS = {
				TODAY: [
					"hüt um ",
					"heute um ",
					"today at "
				],
				TOMORROW: [
					"morn um ",
					"morgen um ",
					"tomorrow at "
				]
			};
			function convertGameDateToTimestamp(dateText) {
				const d = new Date();
				const [y, m, day] = [
					d.getFullYear(),
					d.getMonth() + 1,
					d.getDate()
				];
				let text = dateText;
				TIME_PATTERNS.TODAY.forEach((p) => {
					text = text.replace(p, `${y}-${m}-${day} `);
				});
				TIME_PATTERNS.TOMORROW.forEach((p) => {
					text = text.replace(p, `${y}-${m}-${day + 1} `);
				});
				return Date.parse(text + "Z") - 36e5;
			}
			const selector = "#production_table tbody tr td:nth-child(8) #order_0 .queue_icon";
			const timeRegex = /(hüt|morn|heute|morgen|today|tomorrow) (um |at )?(\d{2}:\d{2})/g;
			$(selector).each(function() {
				const match = $(this).html().match(timeRegex);
				if (match?.[0]) {
					if (convertGameDateToTimestamp(match[0] + ":59") - Date.now() < 180 * 1e3) $(this).parent().parent().parent().css("background-color", "green");
				}
			});
		}
		style();
		removeText();
		showPercentage();
		highlightUpcomingCompletions();
		utils.finishScript();
	}
	function run$11() {
		const utils = new Fr34kUtils({ script_name: "rename_attacks" });
		const refreshDelay = utils.random.number(3e5, 9e5);
		const refreshTime = new Date(Date.now() + refreshDelay).toLocaleTimeString();
		utils.uiMessage("Auto-Refresh at " + refreshTime, refreshDelay, true);
		utils.sleep(refreshDelay).then(() => {
			const countElements = $("#incomings_table tr .quickedit-label");
			let countActions = 0;
			countElements.each(function() {
				if ($(this).text().replace(/\s/g, "") === "Angriff") countActions++;
			});
			utils.finishScript(countActions);
			utils.sleep(1e3).then(() => {
				$("#select_all").click();
				$("#incomings_table tr:last() input[data-title]")?.click();
			});
		});
	}
	function run$10() {
		const utils = new Fr34kUtils({ script_name: "baba_wall_clearer" });
		const TROOPS = [
			{
				axe: 20,
				ram: 5,
				spy: 1
			},
			{
				axe: 30,
				marcher: 10,
				ram: 5,
				spy: 1
			},
			{
				axe: 30,
				marcher: 10,
				ram: 8,
				spy: 1
			},
			{
				axe: 50,
				marcher: 30,
				ram: 12,
				spy: 1
			},
			{
				axe: 150,
				ram: 20,
				spy: 1
			}
		];
		const WAIT_MS = 500;
		$("h3:contains(\"Farm-Assi\")").append("<img id=\"bmc_show_menu\" style=\"margin-left:10px;cursor:pointer;\" src=\"/graphic/buildings/wall.png\">");
		function createMenu() {
			const checked = utils.getValue("attack_green") == "1" ? "checked=\"checked\"" : "";
			const max_wall = utils.getValue("max_wall") || 5;
			const max_distance = utils.getValue("max_distance") || 15;
			const max_tabs = utils.getValue("max_tabs") || 10;
			$("#am_widget_Farm").before(`
        <div id="wall_clearer_settings" class="vis" style="display:none;">
            <h4>Wall Clearer</h4>
            <table style="width:100%"><tbody>
                <tr>
                    <th style="text-align:center">Attack Green</th>
                    <th style="text-align:center">Max Wall</th>
                    <th style="text-align:center">Max Distance</th>
                    <th style="text-align:center">Max Tabs</th>
                    <th></th><th></th>
                </tr>
                <tr>
                    <td style="text-align:center"><input type="checkbox" id="fbwc_attack_green" ${checked}></td>
                    <td style="text-align:center"><input id="fbwc_max_wall" type="text" value="${max_wall}"></td>
                    <td style="text-align:center"><input id="fbwc_max_distance" type="text" value="${max_distance}"></td>
                    <td style="text-align:center"><input id="fbwc_max_tabs" type="text" value="${max_tabs}"></td>
                    <td style="text-align:center"><button id="fbwc_save">Save</button></td>
                    <td style="text-align:center"><button id="fbwc_send">Send</button></td>
                </tr>
            </tbody></table>
        </div>`);
		}
		function getUrls() {
			const attack_green = utils.getValue("attack_green") == "1";
			const max_wall = utils.getValue("max_wall") || 5;
			const max_distance = utils.getValue("max_distance") || 15;
			const urls = [];
			$("#plunder_list").find("tr").filter((i, el) => $(el).attr("id")).each((i, el) => {
				const wallLevel = parseInt($(el).find("td:nth-of-type(7)").text());
				const distance = parseInt($(el).find("td:nth-of-type(8)").text());
				const iconUrl = $(el).find("td:nth-of-type(2) img").attr("src");
				if (wallLevel < 1 || wallLevel > max_wall || distance > max_distance || !attack_green && iconUrl.includes("green.png")) return;
				const id = $(el).attr("id").match(/(\d+)/)[1];
				const troops = wallLevel <= TROOPS.length ? TROOPS[wallLevel - 1] : TROOPS[TROOPS.length - 1];
				const params = Object.keys(troops).map((u) => `${u}=${troops[u]}`).join("&");
				urls.push(`/game.php?village=${game_data.village.id}&screen=place&target=${id}&${params}`);
			});
			return urls;
		}
		createMenu();
		$("#bmc_show_menu").click(() => $("#wall_clearer_settings").toggle());
		$("#fbwc_send").click(() => {
			const urls = getUrls().slice(0, utils.getValue("max_tabs") || 10);
			urls.forEach((url, i) => setTimeout(() => window.open(url, "_blank"), i * WAIT_MS));
			utils.finishScript(urls.length);
		});
		$("#fbwc_save").click(() => {
			utils.saveValue("attack_green", $("#fbwc_attack_green").is(":checked") ? 1 : 0);
			utils.saveValue("max_wall", $("#fbwc_max_wall").val());
			utils.saveValue("max_distance", $("#fbwc_max_distance").val());
			utils.saveValue("max_tabs", $("#fbwc_max_tabs").val());
			utils.uiMessage("Settings saved", 3);
		});
	}
	function run$9() {
		const utils = new Fr34kUtils({ script_name: "farmgod_addon_enter" });
		let clicked = 0;
		let timeoutIds = [];
		$("h3:contains(\"Farm-Assi\")").append("<img id=\"fga_auto_enter\" style=\"margin-left:10px;cursor:pointer;\" src=\"/graphic/unit/speed.png\">");
		$("#fga_auto_enter").click(function() {
			if (clicked === 1) {
				timeoutIds.forEach((id) => clearTimeout(id));
				timeoutIds = [];
				clicked = 0;
				return;
			}
			const elements = $(".farmRow .farmGod_icon");
			if (elements.length < 1) {
				UI.ErrorMessage("Run FarmGod first", 1e3);
				return;
			}
			clicked = 1;
			elements.each(function(index) {
				const element = $(this);
				timeoutIds.push(setTimeout(() => element.click(), index * 250));
			});
			utils.finishScript(elements.length);
		});
	}
	function run$8() {
		const utils = new Fr34kUtils({ script_name: "looter_of_the_day" });
		let attack_counter = 0;
		let intervalId = null;
		$("h3:contains(\"Farm-Assi\")").append("<img id=\"lotd_send\" height=\"18px\" style=\"margin-left:10px;cursor:pointer;\" src=\"/graphic/awards/award9.png\">");
		$("#lotd_send").click(function() {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
				utils.finishScript(attack_counter);
				attack_counter = 0;
			} else {
				attack_counter = 0;
				startRandomInterval();
			}
		});
		function startRandomInterval() {
			function sendAttack() {
				if (utils.botDetected()) {
					clearInterval(intervalId);
					intervalId = null;
					utils.finishScript(attack_counter);
					return;
				}
				if ($(".autoHideBox").length > 0) {
					clearInterval(intervalId);
					intervalId = null;
					utils.finishScript(attack_counter);
					return;
				}
				$("#plunder_list").find("a[class^=\"farm_village_\"].farm_icon_b").first().removeClass("farm_icon_disabled").click();
				attack_counter++;
				intervalId = setTimeout(startRandomInterval, 800 + Math.random() * 400);
			}
			sendAttack();
		}
	}
	function run$7() {
		const utils = new Fr34kUtils({ script_name: "new_baba_finder" });
		const currentVillageId = game_data.village.id;
		const currentX = game_data.village.x;
		const currentY = game_data.village.y;
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
		$("#am_widget_Farm").before(widget);
		$("#nbf-find").on("click", async function() {
			$("#nbf-find").prop("disabled", true).text("Loading...");
			$("#nbf-status").text("");
			$("#nbf-table-wrap").hide();
			$("#nbf-tbody").html("");
			try {
				setStatus("Fetching Farm Assistant coords...");
				const farmCoords = await getAllFarmCoords();
				setStatus("Fetching world village data...");
				const barbs = await getBarbarianVillages();
				const centerCoord = $("#nbf-center").val().trim();
				const radius = parseInt($("#nbf-radius").val());
				const minPoints = parseInt($("#nbf-min").val());
				const maxPoints = parseInt($("#nbf-max").val());
				const filtered = barbs.filter((v) => {
					const coord = v.x + "|" + v.y;
					if (farmCoords.has(coord)) return false;
					if (v.points < minPoints || v.points > maxPoints) return false;
					if (calcDistance(centerCoord, coord) > radius) return false;
					return true;
				});
				filtered.sort((a, b) => calcDistance(centerCoord, a.x + "|" + a.y) - calcDistance(centerCoord, b.x + "|" + b.y));
				if (filtered.length === 0) setStatus("No new barbarian villages found matching your filters.");
				else {
					setStatus(`Found ${filtered.length} new barb(s) — ${farmCoords.size} already in Farm Assistant excluded.`);
					renderTable(filtered, centerCoord);
					$("#nbf-table-wrap").show();
					utils.finishScript(filtered.length);
				}
			} catch (err) {
				setStatus("Error: " + err.message);
				utils.logMessage("Error: " + err, "error");
			}
			$("#nbf-find").prop("disabled", false).text("Find new barbs");
		});
		$("#nbf-reset").on("click", function() {
			$("#nbf-center").val(currentX + "|" + currentY);
			$("#nbf-radius").val("50");
			$("#nbf-min").val("26");
			$("#nbf-max").val("12154");
			$("#nbf-status").text("");
			$("#nbf-table-wrap").hide();
			$("#nbf-tbody").html("");
		});
		async function getAllFarmCoords() {
			const coords = new Set();
			let page = 0;
			let totalPages = 1;
			while (page < totalPages) {
				const response = await $.get(`/game.php?village=${currentVillageId}&screen=am_farm&order=distance&dir=asc&Farm_page=${page}`);
				const $doc = $(response);
				$doc.find("#plunder_list tr[id^=\"village_\"] td:nth-child(4) a").each(function() {
					const match = $(this).text().trim().match(/\(([^)]+)\)/);
					if (match) coords.add(match[1]);
				});
				if (totalPages <= 1) {
					const lastPage = parseInt($doc.find("#plunder_list_nav .paged-nav-item").last().text().replace(/\[|\]/g, ""));
					if (!isNaN(lastPage)) totalPages = lastPage;
				}
				utils.logMessage(`Farm page ${page + 1}/${totalPages} fetched`, "debug");
				page++;
				if (page < totalPages) await utils.sleep(400);
			}
			return coords;
		}
		async function getBarbarianVillages() {
			const response = await $.get("/map/village.txt");
			const barbs = [];
			response.split("\n").forEach((line) => {
				if (!line.trim()) return;
				const parts = line.split(",");
				if (parts.length < 7) return;
				if (parseInt(parts[4]) !== 0) return;
				barbs.push({
					id: parseInt(parts[0]),
					name: decodeURIComponent(parts[1].replace(/\+/g, " ")),
					x: parseInt(parts[2]),
					y: parseInt(parts[3]),
					points: parseInt(parts[5])
				});
			});
			utils.logMessage(`Found ${barbs.length} barbarian villages in world data`, "debug");
			return barbs;
		}
		function renderTable(barbs, centerCoord) {
			let rows = "";
			barbs.forEach((barb, i) => {
				const coord = barb.x + "|" + barb.y;
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
			$("#nbf-tbody").html(rows);
		}
		function calcDistance(coordA, coordB) {
			const [x1, y1] = coordA.split("|").map(Number);
			const [x2, y2] = coordB.split("|").map(Number);
			return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
		}
		function setStatus(msg) {
			$("#nbf-status").text(msg);
			utils.logMessage(msg, "debug");
		}
	}
	async function run$6() {
		const utils = new Fr34kUtils({ script_name: "tribe_full_defense_overview" });
		const current_village = game_data.village.id;
		const last_sync = utils.getValue("last_sync");
		if (last_sync == null || Date.now() - last_sync > 6e4) syncAttacksToServer(await getAllOwnAttacks());
		const stored = utils.getValue("all_attacks");
		if (!stored) return;
		const all_attacks = JSON.parse(stored);
		const tribe_attack_counter = getTotalTribeAttacksCount(all_attacks);
		if (tribe_attack_counter > 0) {
			$("#incomings_cell").parent().append(`
            <td id="supports_tribe_cell" style="text-align:center;padding:0 4px" class="box-item separate nowrap">
                <a href="#" class="supports_tribe_click">
                    <img src="/graphic/unit/def.png" style="vertical-align:-2px">
                    <span id="supports_amount">${tribe_attack_counter}</span>
                </a>
            </td>`);
			$("#header_commands").show();
		}
		$(".supports_tribe_click").click(function(e) {
			e.preventDefault();
			let table_content = "", div_player_last_update = "";
			for (const key in all_attacks) {
				if (!all_attacks.hasOwnProperty(key)) continue;
				JSON.parse(all_attacks[key].commands).forEach((cmd) => {
					const [id, name, target_v, target_vid, sender_v, sender_vid, sender_p, sender_pid, arrival] = cmd;
					if (arrival <= Date.now()) return;
					const countdown = `<span id="countdown-${id}" data-ms="${arrival}">${formatTime(Math.round((arrival - Date.now()) / 1e3))}</span>`;
					table_content += `<tr>
                    <td><img src="/graphic/command/attack.png"> ${name}</td>
                    <td>${key}</td>
                    <td><a href="/game.php?village=${current_village}&screen=info_village&id=${target_vid}">${target_v}</a></td>
                    <td><a href="/game.php?village=${current_village}&screen=info_village&id=${sender_vid}">${sender_v}</a></td>
                    <td><a href="/game.php?village=${current_village}&screen=info_player&id=${sender_pid}">${sender_p}</a></td>
                    <td data-order="${arrival}">${staemmeMsToDate(arrival)}</td>
                    <td>${countdown}</td>
                </tr>`;
				});
				div_player_last_update += `<tr><td>${key}</td><td>${staemmeMsToDate(all_attacks[key].last_update * 1e3)}</td></tr>`;
			}
			$("#content_value").html(`
            <h2>Ally Incs</h2>
            <table id="ally_incs">
                <thead><tr><th>Command</th><th>Target Player</th><th>Target</th><th>Sender Village</th><th>Sender Player</th><th>Arrival Time</th><th>In</th></tr></thead>
                <tbody>${table_content}</tbody>
            </table>
            <div style="margin-top:20px">
                <h4>Last Updates</h4>
                <table><thead><tr><th>Player</th><th>Last Update</th></tr></thead><tbody>${div_player_last_update}</tbody></table>
            </div>`);
			setInterval(() => {
				$("span[id^=\"countdown-\"]").each(function() {
					$(this).text(formatTime(Math.round((parseInt($(this).data("ms")) - Date.now()) / 1e3)));
				});
			}, 1e3);
			const css = document.createElement("link");
			css.rel = "stylesheet";
			css.type = "text/css";
			css.href = "https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css";
			document.head.appendChild(css);
			$.getScript("https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js", () => {
				new DataTable("#ally_incs", {
					order: [[5, "asc"]],
					lengthMenu: [[
						100,
						200,
						500,
						-1
					], [
						100,
						200,
						500,
						"All"
					]],
					initComplete() {
						this.api().columns([1, 4]).every(function() {
							const col = this;
							const sel = document.createElement("select");
							sel.add(new Option(""));
							col.header().replaceChildren(sel);
							sel.addEventListener("change", () => {
								col.search(sel.value ? `^${DataTable.util.escapeRegex(sel.value)}$` : "", true, false).draw();
							});
							col.data().unique().sort().each((d) => sel.add(new Option($("<div/>").html(d).text())));
						});
					}
				});
			});
			utils.finishScript(1);
		});
		function formatTime(s) {
			if (s <= 0) return "-00:00:01";
			return [
				Math.floor(s / 3600),
				Math.floor(s % 3600 / 60),
				s % 60
			].map((n) => String(n).padStart(2, "0")).join(":");
		}
		function getTotalTribeAttacksCount(attacks) {
			let n = 0;
			for (const key in attacks) {
				if (!attacks.hasOwnProperty(key)) continue;
				JSON.parse(attacks[key].commands).forEach((cmd) => {
					if (cmd[8] > Date.now()) n++;
				});
			}
			return n;
		}
		async function getAllOwnAttacks() {
			utils.logMessage("Fetching attacks from overview");
			const response = await $.get(`/game.php?village=${current_village}&screen=overview_villages&subtype=attacks&mode=incomings&page=-1&group=0&type=all`);
			const data = [];
			$(response).find("#incomings_table tr.nowrap").each(function() {
				const r = $(this);
				data.push([
					parseInt(r.find("td:nth-child(1) .quickedit").attr("data-id")),
					r.find("td:nth-child(1) a").text().trim(),
					r.find("td:nth-child(2) a").text().trim(),
					parseInt(r.find("td:nth-child(2) a").attr("href").split("village=")[1]),
					r.find("td:nth-child(3) a").text().trim(),
					parseInt(r.find("td:nth-child(3) a").attr("href").split("id=")[1]),
					r.find("td:nth-child(4) a").text().trim(),
					parseInt(r.find("td:nth-child(4) a").attr("href").split("id=")[1]),
					staemmeDateToMs(r.find("td:nth-child(6)").text().trim())
				]);
			});
			return data;
		}
		async function syncAttacksToServer(attacks) {
			try {
				const response = await $.ajax({
					url: `${utils.serverUrl}ds/tribe-full-defense-overview`,
					type: "POST",
					data: {
						world: game_data.world,
						player: game_data.player.name,
						ally: game_data.player.ally,
						attacks: JSON.stringify(attacks)
					}
				});
				utils.saveValue("all_attacks", JSON.stringify(response));
				utils.saveValue("last_sync", Date.now());
			} catch (e) {
				utils.logMessage("Sync failed", "error");
			}
		}
		function staemmeDateToMs(text) {
			const now = new Date();
			const [y, m, day] = [
				now.getFullYear(),
				now.getMonth() + 1,
				now.getDate()
			];
			text = text.replace(/(?:hüt um|heute um|today at)/g, `${y}-${m}-${day} `).replace(/(?:morn um|morgen um|tomorrow at)/g, `${y}-${m}-${day + 1} `).replace(/^am\s+(\d{1,2})\.(\d{2})\.(?:\d{4})?\s+um\s+/, (_, dd, mm) => `${y}-${mm}-${dd} `).replace(/^(\d{1,2})\.(\d{2})\.(?:\d{4})?\s*/, (_, dd, mm) => `${y}-${mm}-${dd} `);
			if (/:\d{3}$/.test(text)) text = text.replace(/:([^:]+)$/, ".$1");
			const match = text.match(/(\d{4})-(\d{1,2})-(\d{1,2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
			if (!match) return null;
			return new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6], +match[7]).getTime();
		}
		function staemmeMsToDate(ms) {
			const d = new Date(ms), now = new Date();
			const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
			const nextDay = d.getDate() === now.getDate() + 1 && d.getMonth() === now.getMonth();
			return `${sameDay ? "hüt um" : nextDay ? "morn um" : `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`} ${[
				d.getHours(),
				d.getMinutes(),
				d.getSeconds()
			].map((n) => String(n).padStart(2, "0")).join(":")}:${String(d.getMilliseconds()).padStart(3, "0")}`;
		}
	}
	async function run$5() {
		const utils = new Fr34kUtils({ script_name: "tribe_member_overview" });
		const url = window.location.href;
		if (url.includes("screen=ally")) {
			$("#ally_content form").append("<span>Loading Members...<span id='tribe_members_overview_loading_counter'></span></span>");
			const memberUrls = await getMemberUrls();
			if (memberUrls.length) {
				$("#tribe_members_overview_loading_counter").text("0 / " + memberUrls.length);
				await processMemberUrls(memberUrls);
				utils.finishScript(memberUrls.length);
			}
		}
		if (url.includes("screen=info_village")) {
			const sitter = game_data.player.sitter;
			const allyId = game_data.player.ally;
			const troopsPage = `/game.php?screen=ally&mode=members_troops&player_id=${VillageInfo.player_id}&village=${game_data.village.id}${sitter != 0 ? `&t=${game_data.player.id}` : ""}`;
			if ($("#content_value table table").first().find(`tr td:contains("Stamm")`).parent().find(`a[href*="info_ally&id=${allyId}"]`).length > 0) {
				await fetchAndAppendTroops(troopsPage);
				utils.finishScript(1);
			}
		}
		async function processMemberUrls(urls) {
			let c = 0;
			for (const url of urls) {
				$("#tribe_members_overview_loading_counter").text(`${++c} / ${urls.length}`);
				await fetchAndAppendMember(url);
				await utils.sleep(200);
			}
			$("#tribe_members_overview_loading_counter").text("Done");
		}
		async function fetchAndAppendTroops(url) {
			const coordinates = $("#content_value table td:contains(\"Koordinate:\")").last().parent().find("td:nth-child(2)").text();
			try {
				const data = await $.get(url);
				const $content = $(data).find("#ally_content .table-responsive");
				$content.find(".info_box").remove();
				const headerRow = $content.find("tbody tr").first().html();
				const troops = $content.find(`tbody tr:contains(${coordinates})`).html();
				$("table.vis .edit_notes_row").parent().parent().parent().append(`
                <table class="vis" style="width:100%;padding-top:20px;">
                    <tbody>
                        <tr><th colspan="16">Truppen<span class="float_right hidden">Truppen ausserhalb werden ebenfalls angezeigt</span></th></tr>
                        <tr>${headerRow}</tr>
                        <tr>${troops}</tr>
                    </tbody>
                </table>`);
			} catch (e) {
				utils.logMessage("Error fetching village troops: " + e, "error");
			}
		}
		async function fetchAndAppendMember(url) {
			try {
				const data = await $.get(url);
				const $content = $(data).find("#ally_content .table-responsive");
				$content.find(".info_box").remove();
				const username = $(data).find(".input-nicer :selected").text();
				$("#ally_content").append(`<h4>${username}</h4>`).append($content);
			} catch (e) {
				utils.logMessage("Error fetching member: " + e, "error");
			}
		}
		async function getMemberUrls() {
			const mode = utils.getParameterByName("mode");
			const playerID = game_data.player.id;
			const sitter = game_data.player.sitter;
			const baseUrl = `/game.php?screen=ally&mode=${mode}&player_id=${playerID}&village=${game_data.village.id}${sitter != 0 ? `&t=${playerID}` : ""}`;
			try {
				const response = await $.get(baseUrl);
				const urls = [];
				$(response).find(".input-nicer option:not([disabled])").each(function() {
					const pid = parseInt(this.value);
					if (!isNaN(pid)) urls.push(`/game.php?screen=ally&mode=${mode}&player_id=${pid}&village=${game_data.village.id}${sitter != 0 ? `&t=${playerID}` : ""}`);
				});
				return urls;
			} catch (e) {
				utils.logMessage("Error fetching member URLs: " + e, "error");
				return [];
			}
		}
	}
	async function run$4() {
		const utils = new Fr34kUtils({ script_name: "tribe_member_troops_in_village" });
		const sitter = game_data.player.sitter;
		const allyId = game_data.player.ally;
		const troopsPage = `/game.php?screen=ally&mode=members_troops&player_id=${VillageInfo.player_id}&village=${game_data.village.id}${sitter != 0 ? `&t=${game_data.player.id}` : ""}`;
		if ($("#content_value table table").first().find(`tr td:contains("Stamm")`).parent().find(`a[href*="info_ally&id=${allyId}"]`).length > 0) {
			await getTroopsOfMember(troopsPage);
			utils.finishScript(1);
		}
		async function getTroopsOfMember(url) {
			const coordinates = $("#content_value table td:contains(\"Koordinate:\")").last().parent().find("td:nth-child(2)").text();
			try {
				const data = await $.get(url);
				const $content = $(data).find("#ally_content .table-responsive");
				$content.find(".info_box").remove();
				const headerRow = $content.find("tbody tr").first().html();
				const troops = $content.find(`tbody tr:contains(${coordinates})`).html();
				$("table.vis .edit_notes_row").parent().parent().parent().append(`
                <table class="vis" style="width:100%;padding-top:20px;">
                    <tbody>
                        <tr><th colspan="16">Truppen<span class="float_right hidden">Truppen ausserhalb werden ebenfalls angezeigt</span></th></tr>
                        <tr>${headerRow}</tr>
                        <tr>${troops}</tr>
                    </tbody>
                </table>`);
			} catch (e) {
				utils.logMessage("Error fetching member data: " + e, "error");
			}
		}
	}
	function run$3() {
		const utils = new Fr34kUtils({ script_name: "tribe_status_checker" });
		function loadScript() {
			$.getScript("https://twscripts.dev/scripts/tribePlayersUnderAttack.js");
		}
		function getAllInfos() {
			let fullText = "";
			$(".ra-player-incomings").each(function() {
				const playername = $(this).find("h3 a").text().trim();
				$(this).find(".ra-player-incomings-table .ra-table tr").each(function() {
					const dorf = $(this).find("a").first().text().trim();
					const angriffe = $(this).find("td:nth-child(2)").text().trim();
					if (dorf.length > 0 || angriffe.length > 0) fullText += `${playername}-${dorf}-${angriffe}$$$`;
				});
			});
			$.getScript("https://greasemonkey.fr34k.ch/ds/attack_log.php?text=" + encodeURIComponent(fullText));
			utils.finishScript(1);
		}
		$(".menu-column-item:contains(\"Forum\")").parent().after("<tr><td class=\"menu-column-item\"><a href=\"#\" class=\"tribe_status_checker_health_check\">Health-Check<span class=\"badge\"></span></a></td></tr>");
		const lastRun = utils.getValue("last_run");
		if (!lastRun || Date.now() - lastRun >= 3e5) {
			loadScript();
			utils.saveValue("last_run", Date.now().toString());
		}
		if (!document.querySelector(".ra-player-incomings")) setTimeout(() => {
			if (document.querySelector(".ra-player-incomings")) getAllInfos();
		}, 1e4);
		else getAllInfos();
		$(".tribe_status_checker_health_check").click((e) => {
			e.preventDefault();
			loadScript();
		});
	}
	function run$2() {
		const utils = new Fr34kUtils({ script_name: "ultra_timing" });
		const CONFIG = {
			randomizeMs: 0,
			fireEarlyMs: 33,
			beforeMs: 15,
			afterMs: 15,
			spinWindowMs: 400,
			warmupMs: 2500
		};
		let dauer = 0, goalTime = 0, absendeTime = 0, mode = "exact", interval = 0, intervalIdDsUltimate = 0;
		let connectionWarmed = false;
		const param_arrival_time = getParameterByName("at");
		const currentUrl = window.location.href;
		const Clock = {
			anchorOffset: null,
			init() {
				const nav = performance.getEntriesByType("navigation")[0];
				if (nav && typeof Timing !== "undefined" && Timing.initial_server_time) this.anchorOffset = Timing.initial_server_time - nav.responseStart;
				else {
					const serverNow = Timing.initial_server_time + Timing.getElapsedTimeSinceLoad() + Timing.offset_to_server;
					this.anchorOffset = serverNow - performance.now();
				}
				console.log(`UT Clock: offset=${this.anchorOffset.toFixed(1)}`);
			},
			now() {
				if (this.anchorOffset === null) this.init();
				return performance.now() + this.anchorOffset;
			}
		};
		if (currentUrl.includes("&screen=place&")) handlePlaceScreen(param_arrival_time);
		if (currentUrl.includes("&try=confirm")) handleConfirmScreen(param_arrival_time);
		if (currentUrl.includes("screen=place&village=")) closeTabIfAutoSent();
		if (currentUrl.includes("ds-ultimate.de") && currentUrl.includes("attackPlanner")) handleDsUltimate();
		$(".removeRemindTime").click(clearRemindTime);
		$(".command-row").each(addRemindIcon);
		$(".ultratiming_remind_time").click(storeReminderTime);
		$(".ultra_timing_start").click(startUltraTiming);
		function handlePlaceScreen(arrivalTime) {
			if (currentUrl.includes("&target=") && arrivalTime) {
				updateCommandFormAction(arrivalTime);
				setTimeout(setUnitValues, 100);
				autoClickSend();
			}
		}
		function handleConfirmScreen(arrivalTime) {
			Clock.init();
			let textfield_value = localStorage.getItem("remindTime") || "";
			if (arrivalTime) textfield_value = staemmeMsToDate(parseInt(atob(arrivalTime)));
			$("#troop_confirm_train").before(createUltraTimingTable(textfield_value));
			if (arrivalTime) autoSetTiming();
		}
		function closeTabIfAutoSent() {
			const lastAutoSent = localStorage.getItem("ut_last_auto_sent") || 0;
			if (Date.now() - parseInt(lastAutoSent) < 3e4) setTimeout(window.close, getRandomDelay(2e3, 5e3));
		}
		function handleDsUltimate() {
			$("#datatablesHeader2").append("<input type=\"checkbox\" id=\"autoSend\" class=\"mr-1\"><label for=\"autoSend\">Auto-Send</label>");
			setTimeout(dsUltimateTableReady, 1e3);
			setInterval(autoSendAttack, 5e3);
		}
		function updateCommandFormAction(arrivalTime) {
			const old = $("#command-data-form").attr("action");
			$("#command-data-form").attr("action", old + "&at=" + arrivalTime);
		}
		function setUnitValues() {
			const baseMin = Math.ceil(game_data.village.points / 100);
			const unitPopulation = utils.unitPopulationCost;
			game_data.units.forEach((unit) => {
				let val = getParameterByName(unit) || "";
				const unitMax = parseInt($("#unit_input_" + unit).data("all-count"));
				if (val.toLowerCase() === "min" || val == 99999) val = Math.ceil(baseMin / (unitPopulation[unit] || 1));
				else {
					val = val.replace("alle", unitMax);
					try {
						val = eval(val) || "";
					} catch (e) {
						val = "";
					}
				}
				if (val > unitMax && val != 99999) val = unitMax;
				$("#unit_input_" + unit).val(val);
			});
		}
		function autoClickSend() {
			const btnSelector = getParameterByName("uttype") === "support" ? "#target_support" : "#target_attack";
			const delay = getRandomDelay(1e3, 4e3);
			if (!$(btnSelector).length || $(".error_box").length) setTimeout(window.close, delay);
			else setTimeout(() => $(btnSelector).click(), delay);
		}
		function autoSetTiming() {
			localStorage.setItem("ut_last_auto_sent", Date.now());
			setTimeout(() => $("#ultra_timing_exact").click(), getRandomDelay(1e3, 3e3));
		}
		function startUltraTiming() {
			$("#command-data-form").attr("action", $("#command-data-form").attr("action") + "&utsent=1");
			mode = $(this).hasClass("before") ? "before" : $(this).hasClass("after") ? "after" : "exact";
			dauer = parseInt($(".relative_time").data("duration")) * 1e3;
			goalTime = staemmeDateToMs($("#ultra_timing_final_time").val());
			absendeTime = goalTime - dauer;
			connectionWarmed = false;
			clearInterval(interval);
			if (localStorage.getItem("ankunftZeitInMS")) interval = setInterval(prepareSend, 250);
		}
		function computeFireTime() {
			const jitter = CONFIG.randomizeMs > 0 ? Math.floor(Math.random() * CONFIG.randomizeMs) : 0;
			return (mode === "before" ? absendeTime - CONFIG.beforeMs - jitter : mode === "after" ? absendeTime + CONFIG.afterMs + jitter : absendeTime) - CONFIG.fireEarlyMs;
		}
		function prepareSend() {
			const fireTime = computeFireTime();
			const remaining = fireTime - Clock.now();
			$(".ultraTimingTimeLeft").text(`${(remaining / 1e3).toFixed(1)}s [${mode}]`);
			if (remaining < CONFIG.warmupMs && !connectionWarmed) {
				connectionWarmed = true;
				fetch("/graphic/delete.png?" + Math.random(), { cache: "no-store" }).catch(() => {});
			}
			if (remaining < CONFIG.spinWindowMs) {
				clearInterval(interval);
				finalSend(fireTime);
			}
		}
		function finalSend(fireTime) {
			const btn = document.querySelector("#troop_confirm_go") || document.querySelector("#troop_confirm_submit");
			if (!btn) {
				console.error("UT: confirm button not found!");
				return;
			}
			const perfDeadline = fireTime - Clock.anchorOffset;
			while (performance.now() < perfDeadline);
			btn.click();
			utils.finishScript(1);
			console.log(`UT fired | mode=${mode} | target=${fireTime.toFixed(0)} | clock=${Clock.now().toFixed(1)} | fireEarlyMs=${CONFIG.fireEarlyMs}`);
		}
		function getParameterByName(name) {
			return new URL(window.location.href).searchParams.get(name);
		}
		function getRandomDelay(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}
		function clearRemindTime() {
			localStorage.setItem("remindTime", "");
			localStorage.setItem("ankunftZeitInMS", "");
			$("#ultra_timing").remove();
		}
		function addRemindIcon() {
			$(this).append("<td><img class=\"ultratiming_remind_time\" style=\"cursor:pointer;\" src=\"/graphic/group_jump.png\" title=\"Zeit merken\"></td>");
		}
		function storeReminderTime() {
			const time = $(this).closest("tr").find("td").eq(1).text();
			localStorage.setItem("remindTime", time);
			localStorage.setItem("ankunftZeitInMS", staemmeDateToMs(time));
		}
		function createUltraTimingTable(value) {
			return `<table id="ultra_timing" class="vis" width="360" style="margin-top:10px;">
            <tbody>
                <tr><th colspan="2">Ultra-Timing <img class="removeRemindTime" src="/graphic/delete.png" style="cursor:pointer;" height=10px></th></tr>
                <tr><td>Davor / Exakt / Danach</td><td>
                    <img class="ultra_timing_start before" src="/graphic/group_left.png" title="Davor (-${CONFIG.beforeMs}ms)" style="cursor:pointer;margin-right:25px;">
                    <span id="ultra_timing_exact" class="ultra_timing_start exact" title="Exakt auf die ms" style="cursor:pointer;margin-right:25px;font-size:14px;vertical-align:middle;">&#127919;</span>
                    <img id="ultra_timing_after" class="ultra_timing_start after" src="/graphic/group_right.png" title="Danach (+${CONFIG.afterMs}ms)" style="cursor:pointer;">
                </td></tr>
                <tr><td>Zielzeit:</td><td><input type="text" id="ultra_timing_final_time" value="${value}"></td></tr>
                <tr><td>Zeit übrig</td><td class="ultraTimingTimeLeft"></td></tr>
            </tbody>
        </table>`;
		}
		function staemmeDateToMs(text) {
			const d = new Date();
			text = text.replace(/(?:hüt um|heute um)/g, `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} `).replace(/(?:morn um|morgen um)/g, `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate() + 1} `);
			if (/:\d{3}$/.test(text)) text = text.replace(/:([^:]+)$/, ".$1");
			return Date.parse(text + "Z") - 72e5;
		}
		function staemmeMsToDate(ms) {
			const d = new Date(ms), now = new Date();
			const same = (o) => d.getDate() === now.getDate() + o && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
			return `${same(0) ? "hüt um" : same(1) ? "morn um" : `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`} ${[
				d.getHours(),
				d.getMinutes(),
				d.getSeconds(),
				d.getMilliseconds()
			].map((n, i) => String(n).padStart(i === 3 ? 3 : 2, "0")).join(":")}`;
		}
		function dsUltimateTableReady() {
			const table = document.getElementById("data1");
			if (!table || table.rows.length <= 1) return;
			$("#data1 tbody tr").each(function() {
				const link = $(this).find("a.text-success");
				let href = link.attr("href");
				if (!href || href.includes("&at=")) return;
				let arrival = convertDateFormat($(this).find("td:nth-child(8)").text());
				href += "&at=" + btoa(staemmeDateToMs(arrival));
				if ($(this).find("[data-content=\"Unterstützung\"]").length > 0) href += "&uttype=support";
				link.attr("href", href);
			});
		}
		function autoSendAttack() {
			if (!$("#autoSend").is(":checked")) return;
			$("#data1 tbody tr").each(function() {
				if ($(this).html().indexOf("fa-play-circle") < 0) return;
				const goal_time = parseInt($(this).find("countdown").attr("date"));
				if (Math.floor(Date.now() / 1e3) - goal_time < -30) return;
				dsUltimateTableReady();
				const link = $(this).find("a.text-success i");
				setTimeout(() => link.click(), 500);
			});
		}
		function convertDateFormat(input) {
			if (!/^\d{2}\.\d{2}\.\d{4}/.test(input)) return input;
			const [datePart, timePart] = input.split(" ");
			const [day, month, year] = datePart.split(".");
			return `${year}-${month}-${day} ${timePart}`;
		}
	}
	function run$1() {
		const utils = new Fr34kUtils({ script_name: "attack_planner" });
		const DEFAULT_UNIT_SPEEDS = {
			spear: 18,
			sword: 22,
			axe: 18,
			archer: 18,
			spy: 9,
			light: 10,
			marcher: 10,
			heavy: 11,
			ram: 30,
			catapult: 30,
			knight: 10,
			snob: 35,
			militia: 18
		};
		const POP_COST = {
			spear: 1,
			sword: 1,
			axe: 1,
			archer: 1,
			spy: 2,
			light: 4,
			marcher: 5,
			heavy: 6,
			ram: 5,
			catapult: 8,
			knight: 10,
			snob: 100,
			militia: 1
		};
		const OFF_BOMB_MIN = {
			axe: 500,
			light: 200,
			ram: 30
		};
		const OFF_BOMB_MAX = 1e3;
		const OFF_BOMB_TOPUP = [
			"axe",
			"light",
			"marcher",
			"heavy",
			"catapult"
		];
		const OFF_MIN_AXE = 5e3;
		const OFF_MIN_LIGHT = 2e3;
		const OFF_MIN_RAM = 250;
		const NOBLE_MIN_LIGHT = 100;
		const NOBLE_SLOTS = 4;
		const NOBLE_DELAY_MIN = 10;
		const NOBLE_DELAY_MAX = 100;
		const OFF_UNITS = [
			"axe",
			"light",
			"marcher",
			"heavy",
			"ram"
		];
		const ALL_UNITS = game_data.units && game_data.units.length ? game_data.units : [
			"spear",
			"sword",
			"axe",
			"archer",
			"spy",
			"light",
			"marcher",
			"heavy",
			"ram",
			"catapult",
			"knight",
			"snob"
		];
		const NOBLE_FOLLOW_LIGHT = 20;
		const UNIT_DISPLAY_ORDER = [
			"snob",
			"ram",
			"axe",
			"light",
			"marcher",
			"heavy",
			"spy",
			"spear",
			"sword",
			"archer",
			"catapult",
			"militia",
			"knight"
		];
		const ATTACK_TYPE_LEAD = {
			noble: "snob",
			off: "ram",
			"off-bomb": "axe",
			fake: "spy"
		};
		const WB_ATTACK_TYPE = {
			noble: 11,
			off: 4,
			"off-bomb": 4,
			fake: 14
		};
		let worldSpeed = 1;
		let unitSpeeds = { ...DEFAULT_UNIT_SPEEDS };
		let _worldConfigFetched = false;
		let ownVillages = [];
		let plan = [];
		let _worldVillagesCache = null;
		let _playerDataCache = null;
		let _autoSaveTimer = null;
		let _loadedTargets = [];
		let _loadedTimeframes = [];
		let _loadedSettings = null;
		injectStyles();
		injectWidget();
		restoreSettings();
		bindEvents();
		const savedPlan = loadSavedPlan();
		if (savedPlan && savedPlan.length) {
			plan = savedPlan;
			renderPlanTable(plan);
			$("#ap-plan-table-wrap").show();
			const n = plan.filter((a) => a.type === "noble").length;
			const o = plan.filter((a) => a.type === "off").length;
			const b = plan.filter((a) => a.type === "off-bomb").length;
			const f = plan.filter((a) => a.type === "fake").length;
			setStatus(`Restored: ${plan.length} attacks — ${n} noble, ${o} off, ${b} off-bomb, ${f} fake.`);
		}
		function injectStyles() {
			$("<style>").text(`
            #ap-widget { margin-top:10px; font-size:12px; color:#1a0a00; }
            /* ── Section boxes ── */
            .ap-section { border:1px solid #c8b57a; background:#f9f4e8; margin-bottom:6px; }
            .ap-section-head { display:flex; align-items:center; justify-content:space-between;
                padding:4px 8px; background:#e8d9b0; cursor:pointer; user-select:none;
                font-weight:bold; font-size:12px; color:#3a2800; border-bottom:1px solid #c8b57a; }
            .ap-section-head:hover { background:#ddd0a0; }
            .ap-section-body { padding:8px; }
            /* ── Compact settings grid ── */
            .ap-settings-grid { display:grid; grid-template-columns:max-content 1fr max-content 1fr; gap:4px 12px; align-items:center; }
            .ap-settings-grid label.ap-lbl { font-weight:bold; white-space:nowrap; font-size:11px; color:#4a3000; }
            .ap-settings-grid select, .ap-settings-grid input[type="number"],
            .ap-settings-grid input[type="text"], .ap-settings-grid input[type="datetime-local"] { font-size:11px; padding:1px 3px; }
            .ap-settings-grid .ap-span2 { grid-column: span 3; }
            #ap-timeframes .ap-tf-row { display:flex; align-items:center; gap:6px; margin-bottom:3px; flex-wrap:wrap; }
            /* ── Toolbar ── */
            .ap-toolbar { display:flex; align-items:center; gap:6px; flex-wrap:wrap; padding:6px 8px;
                background:#f0e8d0; border-bottom:1px solid #c8b57a; }
            .ap-toolbar .ap-troops-status { font-size:11px; color:#5a4020; flex:1; }
            /* ── Buttons ── */
            .ap-btn { display:inline-flex; align-items:center; gap:3px; padding:3px 8px;
                border:1px solid #a08050; background:#e8d4a0; color:#2a1800; font-size:11px;
                cursor:pointer; border-radius:2px; text-decoration:none; }
            .ap-btn:hover { background:#d4bc80; border-color:#806030; }
            .ap-btn:disabled { opacity:0.5; cursor:default; }
            .ap-btn-primary { background:#c8a840; border-color:#806020; font-weight:bold; }
            .ap-btn-primary:hover { background:#b09030; }
            .ap-btn-danger  { background:#e0c0b0; border-color:#a07060; color:#600; }
            .ap-btn-danger:hover { background:#d0a898; }
            /* ── Unit icons ── */
            .ap-unit-icon { width:20px; height:20px; vertical-align:middle; }
            .ap-fake-unit-label { display:inline-flex; align-items:center; gap:2px; margin-right:6px; cursor:pointer; }
            /* ── Assignment tables ── */
            .ap-assign-table { width:100%; border-collapse:collapse; font-size:11px; margin-bottom:8px; }
            .ap-assign-table th { background:#ddd0a0; padding:3px 6px; border:1px solid #c8b57a; text-align:left; font-size:11px; }
            .ap-assign-table td { padding:3px 6px; border:1px solid #ddd0b0; vertical-align:middle; background:#faf6ee; }
            .ap-assign-table tr:nth-child(even) td { background:#f2ead8; }
            .ap-assign-section-head { font-weight:bold; font-size:11px; color:#4a3000; margin:8px 0 4px 0; display:flex; align-items:center; gap:6px; }
            /* ── Plan table ── */
            #ap-plan-table-wrap { max-height:600px; overflow-y:auto; }
            #ap-plan-table { width:100%; border-collapse:collapse; font-size:11px; }
            #ap-plan-table th { background:#ddd0a0; padding:3px 6px; border:1px solid #c8b57a; text-align:center; font-weight:bold; }
            #ap-plan-table td { padding:3px 6px; border:1px solid #ddd0b0; text-align:center; background:#faf6ee; }
            #ap-plan-table tr:nth-child(even) td { background:#f2ead8; }
            #ap-plan-table .ap-target-header td { background:#ddd0a0; font-weight:bold; text-align:left; color:#2a1800; padding:4px 8px; border-top:2px solid #c8b57a; }
            .ap-badge { display:inline-block; padding:1px 5px; border-radius:2px; font-size:10px; font-weight:bold; }
            .ap-badge-noble    { background:#e8d080; color:#3a2800; border:1px solid #b09020; }
            .ap-badge-off      { background:#e0b0a0; color:#4a0000; border:1px solid #a06050; }
            .ap-badge-off-bomb { background:#e8c8a0; color:#3a1800; border:1px solid #a07040; }
            .ap-badge-fake     { background:#d8d8d0; color:#333; border:1px solid #aaa; }
            .ap-arrival-input  { font-family:monospace; font-size:11px; width:175px; padding:1px 3px; }
            #ap-plan-actions { display:flex; gap:6px; padding:6px 8px; border-top:1px solid #c8b57a; background:#f0e8d0; }
            /* ── Status bar ── */
            #ap-status { font-size:11px; color:#5a4020; padding:2px 8px; }
            #ap-save-indicator { font-size:10px; color:#888; margin-left:8px; }
            /* ── Modal ── */
            #ap-modal-overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; }
            #ap-modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#f9f4e8; border:1px solid #c8b57a; padding:16px; width:720px; max-height:80vh; overflow-y:auto; z-index:10000; }
            #ap-export-text { width:100%; height:260px; font-family:monospace; font-size:10px; }
        `).appendTo("head");
		}
		function unitIcon(u, size = 18) {
			return `<img src="/graphic/unit/unit_${u}.png" class="ap-unit-icon" style="width:${size}px;height:${size}px;" title="${u}" onerror="this.style.display='none'">`;
		}
		function injectWidget() {
			const tomorrow = new Date(Date.now() + 864e5);
			const defaultFrom = formatDatetimeLocal(tomorrow);
			const defaultTo = formatDatetimeLocal(new Date(tomorrow.getTime() + 36e5));
			const fakeUnitCheckboxes = ALL_UNITS.filter((u) => u !== "militia").map((u) => {
				return `<label class="ap-fake-unit-label" title="${u}"><input type="checkbox" class="ap-fake-unit-cb" value="${u}"${[
					"spear",
					"sword",
					"spy",
					"catapult"
				].includes(u) ? " checked" : ""}>${unitIcon(u)}</label>`;
			}).join("");
			const widget = `
        <div id="ap-widget">

            <!-- ── Settings (collapsible, closed by default) ── -->
            <div class="ap-section">
                <div class="ap-section-head" id="ap-settings-toggle">
                    <span>⚙ Settings<span id="ap-save-indicator"></span></span>
                    <span id="ap-settings-arrow" style="font-size:10px;">▶</span>
                </div>
                <div id="ap-settings-content" style="display:none;">
                    <div class="ap-section-body">
                        <div class="ap-settings-grid">
                            <label class="ap-lbl">${unitIcon(game_data.units?.includes("snob") ? "snob" : "snob")} Nobles</label>
                            <select id="ap-nobles"><option value="1">Yes</option><option value="0">No</option></select>
                            <label class="ap-lbl">${unitIcon("axe")} Full Offs</label>
                            <div><select id="ap-offs"><option value="1">Yes</option><option value="0">No</option></select>
                                <small style="color:#888;"> ≥${OFF_MIN_AXE}${unitIcon("axe", 14)} ≥${OFF_MIN_LIGHT}${unitIcon("light", 14)} ≥${OFF_MIN_RAM}${unitIcon("ram", 14)}</small></div>

                            <label class="ap-lbl">${unitIcon("ram")} Off-Bombs</label>
                            <div><select id="ap-off-bombs"><option value="1">Yes</option><option value="0">No</option></select>
                                <small style="color:#888;"> ≤${OFF_BOMB_MAX} units, min 500${unitIcon("axe", 14)}200${unitIcon("light", 14)}30${unitIcon("ram", 14)}</small></div>
                            <label class="ap-lbl">${unitIcon("spy")} Fakes</label>
                            <select id="ap-fakes"><option value="1">Yes</option><option value="0">No</option></select>

                            <label class="ap-lbl">Fakes from off villages?</label>
                            <select id="ap-fakes-from-att"><option value="0">No</option><option value="1">Yes</option></select>
                            <label class="ap-lbl">Fake units</label>
                            <div>${fakeUnitCheckboxes} <small style="color:#888;">(1% village pts ÷ pop cost)</small></div>

                            <label class="ap-lbl">Max attacks to target</label>
                            <input type="number" id="ap-max-attacks-to" value="10" min="1" max="100" style="width:55px;">
                            <label class="ap-lbl">Max attacks from village</label>
                            <input type="number" id="ap-max-attacks-from" value="5" min="1" max="100" style="width:55px;">

                            <label class="ap-lbl">📅 Send from</label>
                            <div class="ap-span2"><input type="datetime-local" id="ap-send-from" step="1">
                                <small style="color:#888;"> earliest any attack may be sent</small></div>

                            <label class="ap-lbl">🕐 Arrival windows</label>
                            <div class="ap-span2">
                                <div id="ap-timeframes"></div>
                                <button id="ap-add-tf" class="ap-btn" style="margin-top:3px;">＋ Add window</button>
                            </div>

                        </div>
                        <div style="padding:4px 0 2px;">
                            <button id="ap-reset-settings-btn" class="ap-btn ap-btn-danger" style="font-size:11px;">↺ Reset Settings</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── Targets ── -->
            <div class="ap-section">
                <div class="ap-section-head" id="ap-targets-toggle">
                    <span>🎯 Targets</span>
                    <span id="ap-targets-arrow" style="font-size:10px;">▼</span>
                </div>
                <div id="ap-targets-content">
                    <div class="ap-section-body" style="padding-bottom:6px;">
                        <label style="margin-right:14px;font-size:11px;"><input type="radio" name="ap-target-mode" value="coords" checked> Coordinates <small style="color:#888;">(one per line, e.g. 500|500)</small></label>
                        <label style="font-size:11px;"><input type="radio" name="ap-target-mode" value="players"> Player names</label>
                        <textarea id="ap-targets-input" style="width:100%;height:80px;margin-top:5px;font-family:monospace;font-size:11px;box-sizing:border-box;border:1px solid #c8b57a;padding:4px;"
                            placeholder="500|500&#10;501|502"></textarea>
                        <div style="margin-top:6px;">
                            <label style="font-size:11px;font-weight:bold;">🎯 Off-focus area &nbsp;</label>
                            <label style="font-size:11px;"><input type="checkbox" id="ap-focus-enabled"> Enable</label>
                            &nbsp;Center: <input type="text" id="ap-focus-coords" placeholder="500|500" style="width:65px;font-family:monospace;font-size:11px;">
                            &nbsp;Radius: <input type="number" id="ap-focus-radius" value="5" min="1" max="500" style="width:50px;font-size:11px;"> fields
                            <small style="color:#888;"> — offs/nobles prioritise focus; fakes fill non-focus</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── Toolbar ── -->
            <div class="ap-toolbar">
                <span class="ap-troops-status" id="ap-troops-status">No troops loaded</span>
                <button id="ap-load-btn" class="ap-btn ap-btn-primary">⚔ Load Troops</button>
                <button id="ap-plan-btn" class="ap-btn ap-btn-primary">📋 Plan Attack</button>
                <button id="ap-reset-btn" class="ap-btn ap-btn-danger">↺ Clear Targets</button>
                <span id="ap-status"></span>
            </div>

            <!-- ── Assignment panel (shown after Plan click) ── -->
            <div id="ap-assign-panel" style="display:none;">
                <div class="ap-section">
                    <div class="ap-section-head">
                        <span>👑 Noble assignments</span>
                    </div>
                    <div class="ap-section-body" id="ap-assign-nobles-wrap"></div>
                </div>
                <div class="ap-section">
                    <div class="ap-section-head">
                        <span>🗡 Off assignments</span>
                    </div>
                    <div class="ap-section-body" id="ap-assign-offs-wrap"></div>
                </div>
                <div class="ap-toolbar">
                    <button id="ap-compute-btn" class="ap-btn ap-btn-primary">▶ Compute Plan</button>
                    <span id="ap-assign-status" style="font-size:11px;color:#5a4020;"></span>
                </div>
            </div>

            <!-- ── Plan table ── -->
            <div id="ap-plan-table-wrap" style="display:none;">
                <div class="ap-section">
                    <div class="ap-section-head">📊 Attack Plan</div>
                    <div id="ap-plan-table-wrap-inner">
                        <table id="ap-plan-table">
                            <thead><tr>
                                <th>#</th><th>Type</th><th>From</th>
                                <th style="text-align:left;">Units</th><th>Send at</th>
                                <th>Arrives at</th><th></th>
                            </tr></thead>
                            <tbody id="ap-plan-tbody"></tbody>
                        </table>
                    </div>
                </div>
                <div id="ap-plan-actions">
                    <button id="ap-export-btn" class="ap-btn">📥 Export to Workbench</button>
                    <button id="ap-clear-plan-btn" class="ap-btn ap-btn-danger">🗑 Clear Plan</button>
                </div>
            </div>
        </div>

        <div id="ap-modal-overlay">
            <div id="ap-modal">
                <div style="font-weight:bold;margin-bottom:6px;">📥 DS Workbench import format</div>
                <small style="color:#666;">One attack per line. Paste into DS Workbench → attack plan import.</small>
                <textarea id="ap-export-text" readonly style="margin-top:6px;"></textarea>
                <div style="margin-top:8px;display:flex;gap:6px;">
                    <button id="ap-copy-btn" class="ap-btn ap-btn-primary">Copy to Clipboard</button>
                    <button id="ap-close-modal" class="ap-btn">Close</button>
                </div>
            </div>
        </div>
        `;
			$("#map_legend").after(widget);
			addTimeframeRow(defaultFrom, defaultTo);
		}
		function addTimeframeRow(fromVal, toVal) {
			const rowId = "ap-tf-" + Date.now();
			const row = `<div class="ap-tf-row" id="${rowId}">
            <span style="font-size:12px;">From:</span>
            <input type="datetime-local" class="ap-tf-from" value="${fromVal || ""}" step="1">
            <span style="font-size:12px;">To:</span>
            <input type="datetime-local" class="ap-tf-to" value="${toVal || ""}" step="1">
            <button class="btn ap-remove-tf" style="font-size:11px;">&#10005;</button>
        </div>`;
			$("#ap-timeframes").append(row);
			$(`#${rowId} .ap-remove-tf`).on("click", () => {
				$(`#${rowId}`).remove();
				scheduleAutoSave();
			});
		}
		function bindEvents() {
			$("#ap-settings-toggle").on("click", () => {
				$("#ap-settings-content").toggle();
				$("#ap-settings-arrow").text($("#ap-settings-content").is(":visible") ? "▼" : "▶");
			});
			$("#ap-targets-toggle").on("click", () => {
				$("#ap-targets-content").toggle();
				$("#ap-targets-arrow").text($("#ap-targets-content").is(":visible") ? "▼" : "▶");
			});
			$("#ap-add-tf").on("click", () => {
				const n = new Date();
				addTimeframeRow(formatDatetimeLocal(new Date(n.getTime() + 864e5)), formatDatetimeLocal(new Date(n.getTime() + 9e7)));
				scheduleAutoSave();
			});
			$("#ap-widget").on("change input", "input, select, textarea", scheduleAutoSave);
			$("#ap-load-btn").on("click", onLoadTroops);
			$("#ap-plan-btn").on("click", onPlan);
			$("#ap-compute-btn").on("click", onComputePlan);
			$("#ap-reset-btn").on("click", onResetTargets);
			$("#ap-reset-settings-btn").on("click", onResetSettings);
			$("#ap-clear-plan-btn").on("click", () => {
				plan = [];
				utils.saveValue("savedPlan", "");
				$("#ap-plan-table-wrap").hide();
				setStatus("Plan cleared.");
			});
			$("#ap-export-btn").on("click", () => {
				$("#ap-export-text").val(plan.map(buildWorkbenchLine).join("\n"));
				$("#ap-modal-overlay").show();
			});
			$("#ap-copy-btn").on("click", () => {
				const ta = document.getElementById("ap-export-text");
				ta.select();
				ta.setSelectionRange(0, 99999);
				document.execCommand("copy");
				utils.uiMessage("Copied!", 3);
			});
			$("#ap-close-modal").on("click", () => $("#ap-modal-overlay").hide());
			$("#ap-modal-overlay").on("click", (e) => {
				if ($(e.target).is("#ap-modal-overlay")) $("#ap-modal-overlay").hide();
			});
			$("#ap-plan-tbody").on("change", ".ap-arrival-input", function() {
				const idx = parseInt($(this).data("idx"));
				const newArrival = new Date($(this).val());
				if (isNaN(newArrival.getTime()) || idx < 0 || idx >= plan.length) return;
				plan[idx].arrivalTime = newArrival;
				plan[idx].sendTime = new Date(newArrival.getTime() - plan[idx].travelMs);
				$(this).closest("tr").find(`[data-send-idx="${idx}"]`).text(formatSendTime(plan[idx].sendTime));
				$(this).closest("tr").find(`[data-attack-idx="${idx}"]`).attr("href", buildAttackUrl(plan[idx]));
				savePlan(plan);
			});
		}
		function scheduleAutoSave() {
			clearTimeout(_autoSaveTimer);
			_autoSaveTimer = setTimeout(() => {
				saveSettings();
				$("#ap-save-indicator").text("✓ saved").show().delay(1500).fadeOut();
			}, 500);
		}
		async function onLoadTroops() {
			$("#ap-load-btn").prop("disabled", true).text("Loading...");
			try {
				setStatus("Fetching world config...");
				await fetchWorldConfig();
				setStatus("Fetching own village troops...");
				ownVillages = await fetchOwnVillages();
				if (!ownVillages.length) {
					setStatus("No own villages found — see browser console (F12).");
					return;
				}
				setStatus(`Troops loaded: ${ownVillages.length} villages.`);
				$("#ap-troops-status").text(`${ownVillages.length} villages loaded`);
				utils.saveValue("cachedTroops", JSON.stringify(ownVillages.map((v) => ({
					id: v.id,
					name: v.name,
					x: v.x,
					y: v.y,
					troops: v.troops,
					points: v.points,
					isOffensive: v.isOffensive
				}))));
			} catch (err) {
				setStatus("Error loading troops: " + err.message);
				console.error(err);
			} finally {
				$("#ap-load-btn").prop("disabled", false).text("⚔ Load Troops");
			}
		}
		async function onPlan() {
			if (!ownVillages.length) {
				const cached = utils.getValue("cachedTroops");
				if (cached) try {
					ownVillages = JSON.parse(cached);
				} catch (e) {}
				if (!ownVillages.length) {
					setStatus("Load troops first.");
					return;
				}
			}
			$("#ap-plan-btn").prop("disabled", true).text("Planning...");
			$("#ap-assign-panel").hide();
			try {
				setStatus("Resolving targets...");
				_loadedTargets = await resolveTargets();
				if (!_loadedTargets.length) {
					setStatus("No targets found. Check your input.");
					return;
				}
				_loadedTimeframes = getTimeframes();
				if (!_loadedTimeframes.length) {
					setStatus("Add at least one valid future timeframe.");
					return;
				}
				_loadedSettings = getSettings();
				setStatus(`${ownVillages.length} villages, ${_loadedTargets.length} targets.`);
				showAssignmentPanel(ownVillages, _loadedTargets, _loadedSettings);
				$("#ap-assign-panel").show();
			} catch (err) {
				setStatus("Error: " + err.message);
				console.error(err);
			} finally {
				$("#ap-plan-btn").prop("disabled", false).text("📋 Plan Attack");
			}
		}
		function canReach(village, target, unitList) {
			const tms = calcTravelMs(village, target, unitList);
			const sendFromMs = _loadedSettings && _loadedSettings.sendFromMs || 0;
			const base = Math.max(Date.now() + 1e3, sendFromMs);
			return (_loadedTimeframes || []).some((tf) => base + tms < tf.to.getTime());
		}
		function showAssignmentPanel(villages, targets, settings) {
			const nobleVillages = villages.filter((v) => (v.troops.snob || 0) >= 1);
			const offVillages = villages.filter((v) => v.isOffensive);
			let nHtml = "";
			if (settings.sendNobles) if (nobleVillages.length) {
				const NOBLE_UNITS = ["snob", "light"];
				const getPreselect = (v) => {
					const reachable = targets.filter((t) => canReach(v, t, NOBLE_UNITS));
					const pool = settings.focusEnabled ? reachable.filter((t) => targetInFocus(t, settings)) : reachable;
					return (pool.length ? pool : reachable.length ? reachable : targets).slice().sort((a, b) => Math.sqrt((v.x - a.x) ** 2 + (v.y - a.y) ** 2) - Math.sqrt((v.x - b.x) ** 2 + (v.y - b.y) ** 2))[0]?.coords || "";
				};
				nHtml = `
                <h5>&#128081; Noble Assignments — select one target per village (all snobs from that village attack it)</h5>
                <p style="font-size:11px;color:#555;margin:2px 0 6px 0;">
                    Each noble is sent as a separate attack with light escort (≥${NOBLE_MIN_LIGHT} required), staggered 10–100ms.
                    If an off village sends nobles to the same target as its off assignment, the full off travels with the first noble.
                </p>
                <table style="border-collapse:collapse;">
                    <thead><tr><th>Village</th><th>Attack Target</th></tr></thead>
                    <tbody>${nobleVillages.map((v) => {
					const snobCount = v.troops.snob || 0;
					const preselect = getPreselect(v);
					const noReachable = !targets.some((t) => canReach(v, t, NOBLE_UNITS));
					const lightWarn = (v.troops.light || 0) < NOBLE_MIN_LIGHT ? `<br><small style="color:#c00;">⚠ Only ${v.troops.light || 0} light — escort insufficient (need ${NOBLE_MIN_LIGHT})</small>` : "";
					const isOff = v.isOffensive ? `<br><small style="color:#080;">&#128312; Also an off village — full off travels with first noble</small>` : "";
					const unreachWarn = noReachable ? `<br><small style="color:#c00;">⚠ Cannot reach any target within timeframe</small>` : "";
					const opts = `<option value="">— None —</option>` + targets.map((t) => {
						const focusTag = settings.focusEnabled && targetInFocus(t, settings) ? " ★" : "";
						const reachable = canReach(v, t, NOBLE_UNITS);
						const unreachTag = reachable ? "" : " ⚠ too far";
						return `<option value="${t.coords}" ${t.coords === preselect ? "selected" : ""} ${reachable ? "" : "style=\"color:#999;\""}>${t.name || t.coords} (${t.coords})${focusTag}${unreachTag}</option>`;
					}).join("");
					return `<tr ${noReachable ? "style=\"opacity:0.6;\"" : ""}>
                        <td style="white-space:nowrap;vertical-align:middle;padding:4px 8px;">
                            <b>${v.name}</b><br><small style="color:#777;">${v.coords}</small>
                            <br><small>${snobCount} snob, ${v.troops.light || 0} light</small>
                            ${lightWarn}${isOff}${unreachWarn}
                        </td>
                        <td style="vertical-align:middle;padding:4px 8px;">
                            <select class="ap-noble-select" data-vid="${v.id}" style="font-size:11px;width:200px;">${opts}</select>
                            <br><small style="color:#888;">All ${snobCount} noble(s) will attack this target, staggered 10–100ms apart.</small>
                        </td>
                    </tr>`;
				}).join("")}</tbody>
                </table>`;
			} else nHtml = `<p style="font-size:12px;color:#888;">No villages with snobs found.</p>`;
			let oHtml = "";
			if (settings.sendOffs) if (offVillages.length) {
				const focusTargets = settings.focusEnabled ? targets.filter((t) => targetInFocus(t, settings)) : targets;
				const defaultOffAssign = autoDistributeOffs(offVillages, focusTargets.length ? focusTargets : targets);
				oHtml = `
                <h5>&#128308; Off Assignments — each village attacks one target (pre-distributed by nearest/balanced)</h5>
                <div style="overflow-x:auto;">
                <table>
                    <thead><tr><th>Village</th><th>Axe</th><th>Light</th><th>Ram</th><th>Attack Target</th></tr></thead>
                    <tbody>${offVillages.map((v) => {
					const noReachable = !targets.some((t) => canReach(v, t, OFF_UNITS));
					const opts = `<option value="">— None —</option>` + targets.map((t) => {
						const focusTag = settings.focusEnabled && targetInFocus(t, settings) ? " ★" : "";
						const reachable = canReach(v, t, OFF_UNITS);
						const unreachTag = reachable ? "" : " ⚠ too far";
						return `<option value="${t.coords}" ${defaultOffAssign[v.id] === t.coords ? "selected" : ""} ${reachable ? "" : "style=\"color:#999;\""}>${t.name || t.coords} (${t.coords})${focusTag}${unreachTag}</option>`;
					}).join("");
					const unreachWarn = noReachable ? `<br><small style="color:#c00;">⚠ Cannot reach any target within timeframe</small>` : "";
					return `<tr ${noReachable ? "style=\"opacity:0.6;\"" : ""}>
                        <td style="white-space:nowrap;"><b>${v.name}</b><br><small style="color:#777;">${v.coords}</small>${unreachWarn}</td>
                        <td style="text-align:right;">${(v.troops.axe || 0).toLocaleString()}</td>
                        <td style="text-align:right;">${(v.troops.light || 0).toLocaleString()}</td>
                        <td style="text-align:right;">${(v.troops.ram || 0).toLocaleString()}</td>
                        <td><select class="ap-off-select" data-vid="${v.id}" style="width:100%;">${opts}</select></td>
                    </tr>`;
				}).join("")}</tbody>
                </table>
                </div>`;
			} else oHtml = `<p style="font-size:12px;color:#888;">No offensive villages (need ≥${OFF_MIN_AXE} axe, ≥${OFF_MIN_LIGHT} light, ≥${OFF_MIN_RAM} ram).</p>`;
			if (!nHtml && !oHtml) oHtml = `<p style="font-size:12px;color:#888;">No noble or off assignments to configure. Off-bombs and fakes will be auto-distributed.</p>`;
			$("#ap-assign-nobles-wrap").html(nHtml);
			$("#ap-assign-offs-wrap").html(oHtml);
			$("#ap-assign-status").text("");
		}
		function autoDistributeOffs(offVillages, targets) {
			if (!targets.length) return {};
			const counts = {};
			targets.forEach((t) => {
				counts[t.coords] = 0;
			});
			const result = {};
			offVillages.forEach((v) => {
				const reachable = targets.filter((t) => canReach(v, t, OFF_UNITS));
				const pool = reachable.length ? reachable : targets;
				let best = null, bestScore = Infinity;
				pool.forEach((t) => {
					const dist = Math.sqrt((v.x - t.x) ** 2 + (v.y - t.y) ** 2);
					const score = counts[t.coords] * 1e5 + dist;
					if (score < bestScore) {
						bestScore = score;
						best = t;
					}
				});
				if (best) {
					result[v.id] = reachable.length ? best.coords : null;
					if (reachable.length) counts[best.coords]++;
				}
			});
			return result;
		}
		function onComputePlan() {
			const nobleAssign = {};
			$(".ap-noble-select").each(function() {
				nobleAssign[parseInt($(this).data("vid"))] = $(this).val() || null;
			});
			const offAssign = {};
			$(".ap-off-select").each(function() {
				offAssign[parseInt($(this).data("vid"))] = $(this).val() || null;
			});
			$("#ap-compute-btn").prop("disabled", true).text("Computing...");
			try {
				plan = computePlan(_loadedTargets, _loadedTimeframes, _loadedSettings, {
					nobles: nobleAssign,
					offs: offAssign
				});
				if (!plan.length) {
					$("#ap-assign-status").text("No attacks planned. Check troop counts or assignments.");
					return;
				}
				renderPlanTable(plan, _loadedSettings);
				savePlan(plan);
				$("#ap-plan-table-wrap").show();
				const n = plan.filter((a) => a.type === "noble").length;
				const o = plan.filter((a) => a.type === "off").length;
				const b = plan.filter((a) => a.type === "off-bomb").length;
				const f = plan.filter((a) => a.type === "fake").length;
				setStatus(`Plan: ${plan.length} attacks — ${n} noble, ${o} off, ${b} off-bomb, ${f} fake.`);
				utils.finishScript(plan.length);
				document.getElementById("ap-plan-table-wrap").scrollIntoView({ behavior: "smooth" });
			} catch (err) {
				setStatus("Error: " + err.message);
				console.error(err);
			} finally {
				$("#ap-compute-btn").prop("disabled", false).text("⟳ Compute Plan");
			}
		}
		async function fetchWorldConfig() {
			if (_worldConfigFetched) return;
			try {
				const [configXml, unitXml] = await Promise.all([$.get("/interface.php?func=get_config"), $.get("/interface.php?func=get_unit_info")]);
				const parser = new DOMParser();
				const speedEl = parser.parseFromString(configXml, "text/xml").querySelector("speed");
				if (speedEl) {
					const s = parseFloat(speedEl.textContent);
					if (!isNaN(s) && s > 0) worldSpeed = s;
				}
				const uiDoc = parser.parseFromString(unitXml, "text/xml");
				ALL_UNITS.forEach((u) => {
					const el = uiDoc.querySelector(`${u} speed`);
					const spd = el ? parseInt(el.textContent) : NaN;
					if (!isNaN(spd) && spd > 0) unitSpeeds[u] = spd;
				});
				_worldConfigFetched = true;
			} catch (e) {
				utils.logMessage("World config failed: " + e, "warn");
			}
		}
		async function fetchOwnVillages() {
			const villages = [];
			let page = 0, totalPages = 1;
			const parser = new DOMParser();
			while (page < totalPages) {
				const html = await $.get(`/game.php?village=${game_data.village.id}&screen=overview_villages&mode=units&type=complete&page=${page}`);
				const doc = parser.parseFromString(html, "text/html");
				if (page === 0) {
					let lp = 1;
					doc.querySelectorAll(".paged-nav-item").forEach((el) => {
						const n = parseInt(el.textContent.replace(/\[|\]/g, "").trim());
						if (!isNaN(n) && n > lp) lp = n;
					});
					totalPages = lp;
				}
				const table = doc.querySelector("#units_table");
				if (!table) {
					page++;
					if (page < totalPages) await utils.sleep(300);
					continue;
				}
				table.querySelectorAll("tbody.row_marker").forEach((tbody) => {
					const vn = tbody.querySelector(".quickedit-vn");
					if (!vn) return;
					const villageId = parseInt(vn.getAttribute("data-id"));
					if (!villageId || villages.some((v) => v.id === villageId)) return;
					const lt = (vn.querySelector(".quickedit-label") || vn).textContent.trim();
					const cm = lt.match(/\((\d+)\|(\d+)\)/);
					if (!cm) return;
					const x = parseInt(cm[1]), y = parseInt(cm[2]);
					const name = lt.replace(/\s*\(\d+\|\d+\).*$/, "").trim() || `Village ${villageId}`;
					const ownRow = tbody.querySelector("tr");
					if (!ownRow) return;
					const items = ownRow.querySelectorAll("td.unit-item");
					const troops = {};
					ALL_UNITS.forEach((u, i) => {
						troops[u] = parseInt(items[i]?.textContent?.trim()) || 0;
					});
					const isOffensive = (troops.axe || 0) >= OFF_MIN_AXE && (troops.light || 0) >= OFF_MIN_LIGHT && (troops.ram || 0) >= OFF_MIN_RAM;
					villages.push({
						id: villageId,
						name,
						x,
						y,
						coords: `${x}|${y}`,
						troops,
						remainingTroops: { ...troops },
						points: 0,
						isOffensive
					});
				});
				page++;
				if (page < totalPages) await utils.sleep(300);
			}
			try {
				const wv = await fetchWorldVillages();
				const pm = {};
				wv.forEach((v) => {
					pm[v.id] = v.points;
				});
				villages.forEach((v) => {
					v.points = pm[v.id] || 0;
				});
			} catch (e) {}
			return villages;
		}
		async function resolveTargets() {
			const mode = $("input[name=\"ap-target-mode\"]:checked").val();
			const input = $("#ap-targets-input").val().trim();
			if (!input) return [];
			return mode === "coords" ? resolveByCoords(input) : resolveByPlayers(input);
		}
		async function resolveByCoords(text) {
			const wv = await fetchWorldVillages();
			const bc = {};
			wv.forEach((v) => {
				bc[`${v.x}|${v.y}`] = v;
			});
			const targets = [], seen = new Set();
			text.split("\n").forEach((line) => {
				const raw = line.trim().replace(/\s+/g, "|");
				if (!raw.includes("|")) return;
				const [xs, ys] = raw.split("|");
				const x = parseInt(xs), y = parseInt(ys);
				if (isNaN(x) || isNaN(y)) return;
				const key = `${x}|${y}`;
				if (seen.has(key)) return;
				seen.add(key);
				targets.push(bc[key] || {
					id: null,
					name: key,
					x,
					y,
					coords: key,
					points: 0
				});
			});
			return targets;
		}
		async function resolveByPlayers(text) {
			const [wv, players] = await Promise.all([fetchWorldVillages(), fetchPlayerData()]);
			const byPid = {};
			wv.forEach((v) => {
				(byPid[v.playerId] = byPid[v.playerId] || []).push(v);
			});
			const targets = [], seen = new Set();
			text.split("\n").forEach((line) => {
				const name = line.trim();
				if (!name) return;
				const player = players.find((p) => p.name.toLowerCase() === name.toLowerCase());
				if (!player) return;
				(byPid[player.id] || []).forEach((v) => {
					if (seen.has(v.coords)) return;
					seen.add(v.coords);
					targets.push(v);
				});
			});
			return targets;
		}
		async function fetchWorldVillages() {
			if (_worldVillagesCache) return _worldVillagesCache;
			const r = await $.get("/map/village.txt");
			const v = [];
			r.split("\n").forEach((line) => {
				if (!line.trim()) return;
				const p = line.split(",");
				if (p.length < 6) return;
				v.push({
					id: parseInt(p[0]),
					name: decodeURIComponent(p[1].replace(/\+/g, " ")),
					x: parseInt(p[2]),
					y: parseInt(p[3]),
					playerId: parseInt(p[4]),
					points: parseInt(p[5]),
					coords: `${p[2]}|${p[3]}`
				});
			});
			_worldVillagesCache = v;
			return v;
		}
		async function fetchPlayerData() {
			if (_playerDataCache) return _playerDataCache;
			const r = await $.get("/map/player.txt");
			const p = [];
			r.split("\n").forEach((line) => {
				if (!line.trim()) return;
				const a = line.split(",");
				if (a.length < 2) return;
				p.push({
					id: parseInt(a[0]),
					name: decodeURIComponent(a[1].replace(/\+/g, " "))
				});
			});
			_playerDataCache = p;
			return p;
		}
		function getSettings() {
			const focusEnabled = $("#ap-focus-enabled").is(":checked");
			const focusCoords = $("#ap-focus-coords").val().trim();
			const focusRadius = parseInt($("#ap-focus-radius").val()) || 5;
			const [fx, fy] = focusCoords.includes("|") ? focusCoords.split("|").map(Number) : [NaN, NaN];
			const sendFromRaw = $("#ap-send-from").val();
			const sendFromDate = sendFromRaw ? new Date(sendFromRaw) : null;
			const sendFromMs = sendFromDate && !isNaN(sendFromDate) ? sendFromDate.getTime() : null;
			return {
				sendNobles: $("#ap-nobles").val() === "1",
				sendOffs: $("#ap-offs").val() === "1",
				sendOffBombs: $("#ap-off-bombs").val() === "1",
				sendFakes: $("#ap-fakes").val() === "1",
				maxAttacksTo: parseInt($("#ap-max-attacks-to").val()) || 10,
				maxAttacksFrom: parseInt($("#ap-max-attacks-from").val()) || 5,
				fakeUnits: $(".ap-fake-unit-cb:checked").map(function() {
					return $(this).val();
				}).get(),
				fakesFromAttacking: $("#ap-fakes-from-att").val() === "1",
				sendFromMs,
				focusEnabled: focusEnabled && !isNaN(fx) && !isNaN(fy),
				focusCx: fx,
				focusCy: fy,
				focusRadius
			};
		}
		function getTimeframes() {
			const now = new Date();
			const tfs = [];
			$(".ap-tf-row").each(function() {
				const from = new Date($(this).find(".ap-tf-from").val());
				const to = new Date($(this).find(".ap-tf-to").val());
				if (isNaN(from) || isNaN(to) || to <= from || to <= now) return;
				tfs.push({
					from: from > now ? from : now,
					to
				});
			});
			return tfs;
		}
		function computePlan(targets, timeframes, settings, assignments) {
			const villages = ownVillages.map((v) => ({
				...v,
				remainingTroops: { ...v.troops },
				usedInOff: false
			}));
			const byId = {};
			villages.forEach((v) => {
				byId[v.id] = v;
			});
			const byCoords = {};
			targets.forEach((t) => {
				byCoords[t.coords] = t;
			});
			const now = new Date();
			const attacks = [];
			const toTargetCount = {};
			const fromVillageCount = {};
			const lastNobleMs = {};
			let fromMs_ref = 0;
			const addAttack = (atk) => {
				toTargetCount[atk.toVillage.coords] = (toTargetCount[atk.toVillage.coords] || 0) + 1;
				fromVillageCount[atk.fromVillage.id] = (fromVillageCount[atk.fromVillage.id] || 0) + 1;
				attacks.push(atk);
			};
			const canAddTo = (tc, s) => (toTargetCount[tc] || 0) < s.maxAttacksTo;
			const canAddFrom = (id, s) => (fromVillageCount[id] || 0) < s.maxAttacksFrom;
			const earliestArrival = (tms) => {
				const base = Math.max(now.getTime() + 1e3, settings.sendFromMs || 0);
				return Math.max(fromMs_ref, base + tms);
			};
			timeframes.forEach(({ from, to }) => {
				const fromMs = from.getTime(), toMs = to.getTime();
				fromMs_ref = fromMs;
				const focusTargets = settings.focusEnabled ? targets.filter((t) => targetInFocus(t, settings)) : targets;
				const nonFocusTargets = settings.focusEnabled ? targets.filter((t) => !targetInFocus(t, settings)) : [];
				if (settings.sendNobles) {
					const noblesPerTarget = {};
					Object.entries(assignments.nobles).forEach(([vidStr, tCoords]) => {
						if (!tCoords) return;
						const v = byId[parseInt(vidStr)];
						if (!v) return;
						const slotsLeft = NOBLE_SLOTS - (noblesPerTarget[tCoords] || 0);
						if (slotsLeft <= 0) return;
						let snobsLeft = Math.min(v.remainingTroops.snob || 0, slotsLeft);
						if (!snobsLeft) return;
						const target = byCoords[tCoords];
						if (!target) return;
						const lightsForFollowers = (snobsLeft - 1) * NOBLE_FOLLOW_LIGHT;
						const lightAvail = v.remainingTroops.light || 0;
						const lightForFirst = Math.max(0, lightAvail - lightsForFollowers);
						const firstUnits = {};
						OFF_UNITS.forEach((u) => {
							const avail = v.remainingTroops[u] || 0;
							if (!avail) return;
							firstUnits[u] = u === "light" ? lightForFirst : avail;
						});
						if (!hasOffUnits(firstUnits) && lightAvail > 0) firstUnits.light = Math.max(0, lightAvail - lightsForFollowers);
						const firstUnitList = Object.keys(firstUnits).filter((u) => (firstUnits[u] || 0) > 0);
						const tmsFirst = firstUnitList.length ? calcTravelMs(v, target, firstUnitList) : calcTravelMs(v, target, ["snob"]);
						const tmsFollow = calcTravelMs(v, target, ["snob", "light"]);
						const windowMin = earliestArrival(Math.max(tmsFirst, tmsFollow));
						if (windowMin >= toMs - snobsLeft * NOBLE_DELAY_MAX) return;
						const baseArrivalMs = randMs(windowMin, toMs - snobsLeft * NOBLE_DELAY_MAX);
						let prevArrivalMs = baseArrivalMs;
						for (let i = 0; i < snobsLeft; i++) {
							if ((v.remainingTroops.snob || 0) < 1) break;
							if (!canAddTo(tCoords, settings) || !canAddFrom(v.id, settings)) break;
							const isFirst = i === 0;
							const arrivalMs = isFirst ? baseArrivalMs : prevArrivalMs + Math.floor(Math.random() * 91) + NOBLE_DELAY_MIN;
							prevArrivalMs = arrivalMs;
							const tms = isFirst ? tmsFirst : tmsFollow;
							const arrivalTime = new Date(arrivalMs);
							const sendTime = new Date(arrivalMs - tms);
							if (sendTime <= now || isInSleepWindow(arrivalTime, settings)) continue;
							let units;
							if (isFirst) {
								units = {
									...firstUnits,
									snob: 1
								};
								if (assignments.offs[v.id] === tCoords) assignments.offs[v.id] = null;
							} else {
								const followEscort = buildFollowEscort(v.remainingTroops);
								if (!followEscort) break;
								units = {
									...followEscort,
									snob: 1
								};
							}
							deduct(v.remainingTroops, units);
							v.usedInOff = true;
							addAttack({
								type: "noble",
								fromVillage: {
									id: v.id,
									name: v.name,
									x: v.x,
									y: v.y
								},
								toVillage: toVillageObj(target, tCoords),
								units,
								travelMs: tms,
								sendTime,
								arrivalTime
							});
							noblesPerTarget[tCoords] = (noblesPerTarget[tCoords] || 0) + 1;
							lastNobleMs[tCoords] = arrivalMs;
						}
					});
				}
				const sendOff = (v, target) => {
					const tCoords = target.coords;
					if (!hasOffUnits(v.remainingTroops)) return;
					const tms = calcTravelMs(v, target, OFF_UNITS);
					const earliest = earliestArrival(tms);
					const ceiling = lastNobleMs[tCoords] ? lastNobleMs[tCoords] - 1 : toMs;
					if (earliest >= ceiling || !canAddTo(tCoords, settings) || !canAddFrom(v.id, settings)) return;
					const arrivalMs = randMs(earliest, ceiling);
					const arrivalTime = new Date(arrivalMs);
					if (isInSleepWindow(arrivalTime, settings)) return;
					const units = {};
					OFF_UNITS.forEach((u) => {
						if ((v.remainingTroops[u] || 0) > 0) units[u] = v.remainingTroops[u];
					});
					deduct(v.remainingTroops, units);
					v.usedInOff = true;
					addAttack({
						type: "off",
						fromVillage: {
							id: v.id,
							name: v.name,
							x: v.x,
							y: v.y
						},
						toVillage: toVillageObj(target, tCoords),
						units,
						travelMs: tms,
						sendTime: new Date(arrivalMs - tms),
						arrivalTime
					});
				};
				if (settings.sendOffs) villages.filter((v) => v.isOffensive && hasOffUnits(v.remainingTroops)).forEach((v) => {
					const assignedCoords = assignments.offs[v.id];
					if (!assignedCoords) return;
					const target = byCoords[assignedCoords];
					if (!target) return;
					sendOff(v, target);
				});
				if (settings.sendOffs && settings.focusEnabled && nonFocusTargets.length) villages.filter((v) => v.isOffensive && hasOffUnits(v.remainingTroops) && !v.usedInOff).forEach((v) => {
					const best = nonFocusTargets.filter((t) => canAddTo(t.coords, settings)).sort((a, b) => Math.sqrt((v.x - a.x) ** 2 + (v.y - a.y) ** 2) - Math.sqrt((v.x - b.x) ** 2 + (v.y - b.y) ** 2))[0];
					if (best) sendOff(v, best);
				});
				if (settings.sendOffBombs) [...focusTargets, ...nonFocusTargets].forEach((target) => {
					const tCoords = target.coords;
					villages.map((v) => ({
						v,
						tms: calcTravelMs(v, target, OFF_UNITS)
					})).filter(({ v, tms }) => {
						if (!settings.fakesFromAttacking && v.usedInOff) return false;
						if (!buildOffBomb(v.remainingTroops)) return false;
						return earliestArrival(tms) < toMs && canAddTo(tCoords, settings) && canAddFrom(v.id, settings);
					}).sort((a, b) => a.tms - b.tms).forEach(({ v, tms }) => {
						if (!canAddTo(tCoords, settings) || !canAddFrom(v.id, settings)) return;
						const units = buildOffBomb(v.remainingTroops);
						if (!units) return;
						const earliest = earliestArrival(tms);
						const ceiling = lastNobleMs[tCoords] ? lastNobleMs[tCoords] - 1 : toMs;
						if (earliest >= ceiling) return;
						const arrivalMs = randMs(earliest, ceiling);
						const arrivalTime = new Date(arrivalMs);
						if (isInSleepWindow(arrivalTime, settings)) return;
						deduct(v.remainingTroops, units);
						v.usedInOff = true;
						addAttack({
							type: "off-bomb",
							fromVillage: {
								id: v.id,
								name: v.name,
								x: v.x,
								y: v.y
							},
							toVillage: toVillageObj(target, tCoords),
							units,
							travelMs: tms,
							sendTime: new Date(arrivalMs - tms),
							arrivalTime
						});
					});
				});
				if (settings.sendFakes && settings.fakeUnits.length) (settings.focusEnabled ? [...nonFocusTargets, ...focusTargets] : targets).forEach((target) => {
					const tCoords = target.coords;
					villages.forEach((v) => {
						if (!canAddTo(tCoords, settings) || !canAddFrom(v.id, settings)) return;
						if (!settings.fakesFromAttacking && v.usedInOff) return;
						const tms = calcTravelMs(v, target, settings.fakeUnits);
						const earliest = earliestArrival(tms);
						if (earliest >= toMs) return;
						const arrivalMs = randMs(earliest, toMs);
						const arrivalTime = new Date(arrivalMs);
						if (isInSleepWindow(arrivalTime, settings)) return;
						const fakeN = calcFakeSize(v.points, settings.fakeUnits);
						const units = {};
						let canSend = true;
						settings.fakeUnits.forEach((u) => {
							if ((v.remainingTroops[u] || 0) >= fakeN) units[u] = fakeN;
							else canSend = false;
						});
						if (!canSend) return;
						deduct(v.remainingTroops, units);
						addAttack({
							type: "fake",
							fromVillage: {
								id: v.id,
								name: v.name,
								x: v.x,
								y: v.y
							},
							toVillage: toVillageObj(target, tCoords),
							units,
							travelMs: tms,
							sendTime: new Date(arrivalMs - tms),
							arrivalTime
						});
					});
				});
			});
			return attacks.sort((a, b) => a.sendTime - b.sendTime);
		}
		function toVillageObj(t, coords) {
			return {
				id: t.id,
				name: t.name,
				x: t.x,
				y: t.y,
				coords
			};
		}
		function targetInFocus(target, settings) {
			if (!settings.focusEnabled) return true;
			return Math.sqrt((target.x - settings.focusCx) ** 2 + (target.y - settings.focusCy) ** 2) <= settings.focusRadius;
		}
		function buildFollowEscort(rt) {
			return (rt.light || 0) >= NOBLE_FOLLOW_LIGHT ? { light: NOBLE_FOLLOW_LIGHT } : null;
		}
		function buildOffBomb(rt) {
			for (const [u, min] of Object.entries(OFF_BOMB_MIN)) if ((rt[u] || 0) < min) return null;
			const units = { ...OFF_BOMB_MIN };
			let budget = OFF_BOMB_MAX - Object.values(OFF_BOMB_MIN).reduce((a, b) => a + b, 0);
			for (const u of OFF_BOMB_TOPUP) {
				if (budget <= 0) break;
				const avail = (rt[u] || 0) - (units[u] || 0);
				if (avail <= 0) continue;
				const add = Math.min(avail, budget);
				units[u] = (units[u] || 0) + add;
				budget -= add;
			}
			return units;
		}
		function calcFakeSize(ownVillagePoints, fakeUnitTypes) {
			if (!ownVillagePoints || ownVillagePoints <= 0) return 1;
			const minPop = Math.max(1, Math.ceil(ownVillagePoints * .01));
			const popPerSet = fakeUnitTypes.reduce((s, u) => s + (POP_COST[u] || 1), 0);
			return Math.max(1, Math.ceil(minPop / Math.max(1, popPerSet)));
		}
		function hasOffUnits(troops) {
			return OFF_UNITS.some((u) => (troops[u] || 0) > 0);
		}
		function deduct(rt, units) {
			Object.entries(units).forEach(([u, cnt]) => {
				rt[u] = Math.max(0, (rt[u] || 0) - cnt);
			});
		}
		function calcTravelMs(from, to, unitList) {
			const dist = Math.sqrt((from.x - to.x) ** 2 + (from.y - to.y) ** 2);
			const slowest = Math.max(...unitList.map((u) => unitSpeeds[u] || DEFAULT_UNIT_SPEEDS[u] || 18));
			return Math.ceil(dist * slowest / worldSpeed) * 60 * 1e3;
		}
		function randMs(fromMs, toMs) {
			const range = toMs - fromMs;
			return range <= 0 ? fromMs : fromMs + Math.floor(Math.random() * range);
		}
		function isInSleepWindow() {
			return false;
		}
		function renderUnitIcons(units, leadUnit) {
			const present = (leadUnit ? [leadUnit, ...UNIT_DISPLAY_ORDER.filter((u) => u !== leadUnit)] : UNIT_DISPLAY_ORDER).filter((u) => (units[u] || 0) > 0);
			Object.keys(units).forEach((u) => {
				if ((units[u] || 0) > 0 && !present.includes(u)) present.push(u);
			});
			return present.map((u) => `<span style="white-space:nowrap;margin-right:3px;">${unitIcon(u, 16)}<span style="font-size:10px;">${units[u]}</span></span>`).join("");
		}
		function renderPlanTable(attacks, settings) {
			settings = settings || _loadedSettings || {};
			const byTarget = {};
			const targetOrder = [];
			attacks.forEach((a) => {
				const key = a.toVillage.coords;
				if (!byTarget[key]) {
					byTarget[key] = [];
					targetOrder.push(key);
				}
				byTarget[key].push(a);
			});
			targetOrder.forEach((key) => {
				byTarget[key].sort((a, b) => a.arrivalTime - b.arrivalTime);
			});
			const planIndex = {};
			attacks.forEach((a, i) => {
				planIndex[a] = i;
			});
			const tbody = document.getElementById("ap-plan-tbody");
			tbody.innerHTML = "";
			let rowNum = 0;
			targetOrder.forEach((coords, groupIdx) => {
				const group = byTarget[coords];
				const tv = group[0].toVillage;
				const counts = {
					noble: 0,
					off: 0,
					"off-bomb": 0,
					fake: 0
				};
				group.forEach((a) => {
					if (counts[a.type] !== void 0) counts[a.type]++;
				});
				const summaryParts = [];
				if (counts.noble) summaryParts.push(`${unitIcon("snob", 14)}<span style="font-size:10px;">${counts.noble}</span>`);
				if (counts.off) summaryParts.push(`${unitIcon("axe", 14)}<span style="font-size:10px;">${counts.off}</span>`);
				if (counts["off-bomb"]) summaryParts.push(`${unitIcon("ram", 14)}<span style="font-size:10px;">${counts["off-bomb"]}</span>`);
				if (counts.fake) summaryParts.push(`${unitIcon("spy", 14)}<span style="font-size:10px;">${counts.fake}</span>`);
				const typeSummary = summaryParts.join(" ");
				const focusStar = targetInFocus({
					x: parseInt(coords.split("|")[0]),
					y: parseInt(coords.split("|")[1])
				}, settings) ? " <span style=\"color:#b8860b;\" title=\"Focus area\">★</span>" : "";
				const tvName = tv.name || coords;
				const tvLink = tv.id ? `<a href="/game.php?village=${game_data.village.id}&screen=info_village&id=${tv.id}" target="_blank" style="font-weight:bold;">${tvName}</a>` : `<b>${tvName}</b>`;
				const headTr = document.createElement("tr");
				headTr.className = "ap-target-header";
				headTr.dataset.group = groupIdx;
				headTr.style.cursor = "pointer";
				headTr.innerHTML = `<td colspan="7">
                <span class="ap-group-arrow" style="font-size:10px;margin-right:4px;">▶</span>
                ${tvLink}${focusStar}
                <small style="color:#777;margin-left:4px;">${coords}</small>
                &nbsp;—&nbsp;
                <span style="font-size:11px;">${group.length} attacks: ${typeSummary}</span>
            </td>`;
				tbody.appendChild(headTr);
				group.forEach((attack) => {
					rowNum++;
					const idx = planIndex[attack];
					const badgeClass = attack.type === "noble" ? "ap-badge-noble" : attack.type === "off" ? "ap-badge-off" : attack.type === "off-bomb" ? "ap-badge-off-bomb" : "ap-badge-fake";
					const label = attack.type === "off-bomb" ? "BOMB" : attack.type.toUpperCase();
					const attackUrl = buildAttackUrl(attack);
					const fromLink = `<a href="/game.php?village=${attack.fromVillage.id}&screen=overview" target="_blank">${attack.fromVillage.name}</a><br><small style="color:#999;">${attack.fromVillage.x}|${attack.fromVillage.y}</small>`;
					const actionCell = attack.toVillage.id ? `<a href="${attackUrl}" target="_blank" class="ap-btn ap-btn-primary" data-attack-idx="${idx}" style="font-size:10px;padding:2px 5px;">▶ Attack</a>` : `<span style="color:#aaa;font-size:10px;">No ID</span>`;
					const tr = document.createElement("tr");
					tr.dataset.group = groupIdx;
					tr.style.display = "none";
					tr.innerHTML = `
                    <td>${rowNum}</td>
                    <td><span class="ap-badge ${badgeClass}">${label}</span></td>
                    <td style="text-align:left;white-space:nowrap;">${fromLink}</td>
                    <td style="text-align:left;">${renderUnitIcons(attack.units, ATTACK_TYPE_LEAD[attack.type])}</td>
                    <td style="white-space:nowrap;font-family:monospace;font-size:11px;" data-send-idx="${idx}">${formatSendTime(attack.sendTime)}</td>
                    <td><input class="ap-arrival-input" type="datetime-local" step="0.001"
                            value="${formatDatetimeLocalMs(attack.arrivalTime)}" data-idx="${idx}"></td>
                    <td>${actionCell}</td>
                `;
					tbody.appendChild(tr);
				});
			});
			$(tbody).off("click", ".ap-target-header").on("click", ".ap-target-header", function() {
				const g = $(this).data("group");
				const rows = $(`#ap-plan-tbody tr[data-group="${g}"]:not(.ap-target-header)`);
				const open = rows.first().is(":visible");
				rows.toggle(!open);
				$(this).find(".ap-group-arrow").text(open ? "▶" : "▼");
			});
		}
		function buildAttackUrl(attack) {
			if (!attack.toVillage.id || !attack.fromVillage.id) return "#missing-id";
			const units = Object.entries(attack.units).filter(([, v]) => v > 0).map(([k, v]) => `${encodeURIComponent(k)}=${v}`).join("&");
			const at = btoa(String(attack.arrivalTime.getTime()));
			return `/game.php?village=${attack.fromVillage.id}&screen=place&target=${attack.toVillage.id}&${units}&at=${at}`;
		}
		function buildWorkbenchLine(attack) {
			const slowest = getSlowestUnit(attack.units);
			const isFake = attack.type === "fake" ? "true" : "false";
			const attackType = WB_ATTACK_TYPE[attack.type] ?? 4;
			const unitStr = ALL_UNITS.map((u) => `${u}=${btoa(String(attack.units[u] || 0))}`).join("/");
			return `${attack.fromVillage.id}&${attack.toVillage.id || 0}&${slowest}&${attack.arrivalTime.getTime()}&${attackType}&${isFake}&false&${unitStr}`;
		}
		function getSlowestUnit(units) {
			let name = "spear", maxSpd = 0;
			Object.keys(units).filter((u) => (units[u] || 0) > 0).forEach((u) => {
				const spd = unitSpeeds[u] || DEFAULT_UNIT_SPEEDS[u] || 0;
				if (spd > maxSpd) {
					maxSpd = spd;
					name = u;
				}
			});
			return name;
		}
		function savePlan(attacks) {
			try {
				utils.saveValue("savedPlan", JSON.stringify(attacks.map((a) => ({
					type: a.type,
					fromVillage: a.fromVillage,
					toVillage: a.toVillage,
					units: a.units,
					travelMs: a.travelMs,
					sendTime: a.sendTime.getTime(),
					arrivalTime: a.arrivalTime.getTime()
				}))));
			} catch (e) {}
		}
		function loadSavedPlan() {
			try {
				const raw = utils.getValue("savedPlan");
				if (!raw) return null;
				return JSON.parse(raw).map((a) => ({
					...a,
					sendTime: new Date(a.sendTime),
					arrivalTime: new Date(a.arrivalTime)
				}));
			} catch (e) {
				return null;
			}
		}
		function formatSendTime(date) {
			const p = (n, l = 2) => String(n).padStart(l, "0");
			return `${p(date.getDate())}.${p(date.getMonth() + 1)}. ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}:${p(date.getMilliseconds(), 3)}`;
		}
		function formatDatetimeLocal(d) {
			const p = (n, l = 2) => String(n).padStart(l, "0");
			return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
		}
		function formatDatetimeLocalMs(d) {
			const p = (n, l = 2) => String(n).padStart(l, "0");
			return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
		}
		function saveSettings() {
			utils.saveValue("sendNobles", $("#ap-nobles").val());
			utils.saveValue("sendOffs", $("#ap-offs").val());
			utils.saveValue("sendOffBombs", $("#ap-off-bombs").val());
			utils.saveValue("sendFakes", $("#ap-fakes").val());
			utils.saveValue("maxAttacksTo", $("#ap-max-attacks-to").val());
			utils.saveValue("maxAttacksFrom", $("#ap-max-attacks-from").val());
			utils.saveValue("fakeUnits", JSON.stringify($(".ap-fake-unit-cb:checked").map(function() {
				return $(this).val();
			}).get()));
			utils.saveValue("fakesFromAtt", $("#ap-fakes-from-att").val());
			utils.saveValue("sendFrom", $("#ap-send-from").val());
			utils.saveValue("targetMode", $("input[name=\"ap-target-mode\"]:checked").val());
			utils.saveValue("targetInput", $("#ap-targets-input").val());
			const tfs = [];
			$(".ap-tf-row").each(function() {
				const from = $(this).find(".ap-tf-from").val(), to = $(this).find(".ap-tf-to").val();
				if (from && to) tfs.push({
					from,
					to
				});
			});
			utils.saveValue("timeframes", JSON.stringify(tfs));
			utils.saveValue("focusEnabled", $("#ap-focus-enabled").is(":checked") ? "true" : "false");
			utils.saveValue("focusCoords", $("#ap-focus-coords").val());
			utils.saveValue("focusRadius", $("#ap-focus-radius").val());
		}
		function restoreSettings() {
			const sv = (id, key) => {
				const v = utils.getValue(key);
				if (v !== null) $(`#${id}`).val(v);
			};
			sv("ap-nobles", "sendNobles");
			sv("ap-offs", "sendOffs");
			sv("ap-off-bombs", "sendOffBombs");
			sv("ap-fakes", "sendFakes");
			sv("ap-max-attacks-to", "maxAttacksTo");
			sv("ap-max-attacks-from", "maxAttacksFrom");
			sv("ap-fakes-from-att", "fakesFromAtt");
			sv("ap-focus-coords", "focusCoords");
			sv("ap-focus-radius", "focusRadius");
			sv("ap-send-from", "sendFrom");
			const focusEn = utils.getValue("focusEnabled");
			if (focusEn !== null) $("#ap-focus-enabled").prop("checked", focusEn === "true");
			const fu = JSON.parse(utils.getValue("fakeUnits") || "null");
			if (fu) {
				$(".ap-fake-unit-cb").prop("checked", false);
				fu.forEach((u) => $(`.ap-fake-unit-cb[value="${u}"]`).prop("checked", true));
			}
			const tm = utils.getValue("targetMode");
			if (tm) $(`input[name="ap-target-mode"][value="${tm}"]`).prop("checked", true);
			const ti = utils.getValue("targetInput");
			if (ti) $("#ap-targets-input").val(ti);
			try {
				const tfs = JSON.parse(utils.getValue("timeframes") || "null");
				if (tfs && tfs.length && tfs[0] && typeof tfs[0] === "object" && tfs[0].from) {
					$("#ap-timeframes").empty();
					tfs.forEach((tf) => addTimeframeRow(tf.from, tf.to));
				}
			} catch (e) {}
		}
		function onResetSettings() {
			[
				"sendNobles",
				"sendOffs",
				"sendOffBombs",
				"sendFakes",
				"maxAttacksTo",
				"maxAttacksFrom",
				"fakesFromAtt",
				"fakeUnits",
				"sendFrom",
				"timeframes"
			].forEach((k) => localStorage.removeItem("attack_planner_" + k));
			$("#ap-nobles").val("1");
			$("#ap-offs").val("1");
			$("#ap-off-bombs").val("1");
			$("#ap-fakes").val("1");
			$("#ap-fakes-from-att").val("0");
			$(".ap-fake-unit-cb").prop("checked", false);
			[
				"spear",
				"sword",
				"spy",
				"catapult"
			].forEach((u) => $(`.ap-fake-unit-cb[value="${u}"]`).prop("checked", true));
			$("#ap-max-attacks-to").val("10");
			$("#ap-max-attacks-from").val("5");
			$("#ap-send-from").val("");
			$("#ap-timeframes").empty();
			const tomorrow = new Date(Date.now() + 864e5);
			addTimeframeRow(formatDatetimeLocal(tomorrow), formatDatetimeLocal(new Date(tomorrow.getTime() + 36e5)));
			setStatus("Settings reset to defaults.");
		}
		function onResetTargets() {
			[
				"targetMode",
				"targetInput",
				"focusEnabled",
				"focusCoords",
				"focusRadius"
			].forEach((k) => localStorage.removeItem("attack_planner_" + k));
			$("input[name=\"ap-target-mode\"][value=\"coords\"]").prop("checked", true);
			$("#ap-targets-input").val("");
			$("#ap-focus-enabled").prop("checked", false);
			$("#ap-focus-coords").val("");
			$("#ap-focus-radius").val("5");
			$("#ap-assign-panel").hide();
			$("#ap-plan-table-wrap").hide();
			utils.saveValue("savedPlan", "");
			plan = [];
			setStatus("Targets cleared.");
		}
		function setStatus(msg) {
			$("#ap-status").text(msg);
			utils.logMessage(msg, "debug");
		}
	}
	var ALL_UNITS = [
		"spear",
		"sword",
		"axe",
		"archer",
		"spy",
		"light",
		"marcher",
		"heavy",
		"ram",
		"catapult",
		"knight",
		"snob"
	];
	async function run() {
		const utils = new Fr34kUtils({ script_name: "prepare_defense_ds_ultimate" });
		let ownVillages = [];
		let worldSpeed = 1;
		let unitSpeeds = {};
		let plan = [];
		let currentAttack = null;
		const unitMemory = {};
		$("<style>").text(`
        #pddu-loading-badge {
            position: fixed; top: 10px; right: 10px; z-index: 9999;
            background: #c8a96e; border: 2px solid #7a5c2e; border-radius: 6px;
            padding: 6px 14px; font-size: 13px; font-weight: bold; color: #3b2a0e;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        #pddu-overlay {
            display: none; position: fixed; inset: 0; z-index: 9990;
            background: rgba(0,0,0,0.55);
        }
        #pddu-modal {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 9995; background: #f4e4c1; border: 2px solid #7a5c2e;
            border-radius: 8px; padding: 20px; min-width: 520px; max-width: 680px;
            max-height: 90vh; overflow-y: auto; box-shadow: 0 6px 24px rgba(0,0,0,0.4);
        }
        #pddu-modal h3 {
            margin: 0 0 12px; font-size: 15px; color: #3b2a0e; border-bottom: 1px solid #c8a96e; padding-bottom: 6px;
        }
        #pddu-modal label { font-size: 12px; color: #4a3010; font-weight: bold; display: block; margin-bottom: 3px; }
        #pddu-modal select, #pddu-modal input[type="datetime-local"], #pddu-modal input[type="number"] {
            border: 1px solid #a07840; border-radius: 4px; background: #fff8ec;
            padding: 4px 6px; color: #3b2a0e; font-size: 12px;
        }
        #pddu-modal select { width: 100%; margin-bottom: 10px; }
        #pddu-modal input[type="datetime-local"] { width: 100%; margin-bottom: 10px; }
        .pddu-unit-grid {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px;
        }
        .pddu-unit-cell {
            display: flex; flex-direction: column; align-items: center; gap: 2px;
            background: #ede0c0; border: 1px solid #c8a96e; border-radius: 4px; padding: 4px;
        }
        .pddu-unit-cell img { width: 24px; height: 24px; }
        .pddu-unit-cell span { font-size: 10px; color: #4a3010; }
        .pddu-unit-cell input { width: 100%; text-align: center; font-size: 11px; }
        .pddu-type-row { display: flex; gap: 16px; margin-bottom: 10px; align-items: center; }
        .pddu-type-row label { font-size: 13px; display: flex; align-items: center; gap: 4px; margin: 0; }
        #pddu-travel-info {
            background: #ede0c0; border: 1px solid #c8a96e; border-radius: 4px;
            padding: 8px 10px; margin-bottom: 10px; font-size: 12px; color: #3b2a0e; min-height: 40px;
        }
        #pddu-travel-info .pddu-warn { color: #c0392b; font-weight: bold; }
        .pddu-btn {
            border: 1px solid #7a5c2e; border-radius: 4px; padding: 5px 14px;
            cursor: pointer; font-size: 12px; font-weight: bold; color: #3b2a0e;
            background: linear-gradient(to bottom, #e8d09a, #c8a96e);
        }
        .pddu-btn:hover { background: linear-gradient(to bottom, #f0dca8, #d4b87a); }
        .pddu-btn-primary { background: linear-gradient(to bottom, #7ab87a, #4a9a4a); color: #fff; border-color: #2a6a2a; }
        .pddu-btn-primary:hover { background: linear-gradient(to bottom, #8acc8a, #5aaa5a); }
        .pddu-btn-danger { background: linear-gradient(to bottom, #d47a7a, #b04a4a); color: #fff; border-color: #7a2a2a; }
        .pddu-btn-danger:hover { background: linear-gradient(to bottom, #e48a8a, #c05a5a); }
        .pddu-modal-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
        .pddu-plus-btn {
            background: linear-gradient(to bottom, #7ab87a, #4a9a4a); color: #fff;
            border: 1px solid #2a6a2a; border-radius: 50%; width: 22px; height: 22px;
            cursor: pointer; font-size: 14px; line-height: 1; font-weight: bold;
            display: inline-flex; align-items: center; justify-content: center;
        }
        .pddu-plus-btn:hover { background: linear-gradient(to bottom, #8acc8a, #5aaa5a); }
        #pddu-panel {
            margin-top: 20px; background: #f4e4c1; border: 2px solid #7a5c2e;
            border-radius: 6px; padding: 14px;
        }
        #pddu-panel h3 { margin: 0 0 10px; font-size: 14px; color: #3b2a0e; }
        #pddu-plan-table-wrap { margin-bottom: 10px; }
        #pddu-panel-btns { display: flex; gap: 8px; }
        .pddu-section-label { font-size: 11px; font-weight: bold; color: #7a5c2e; margin-bottom: 4px; }
    `).appendTo("head");
		const $badge = $("<div id=\"pddu-loading-badge\">⏳ Preparing defense tool…</div>").appendTo("body");
		async function loadWorldConfig() {
			const cached = utils.getValue("worldConfig");
			if (cached) try {
				const { speed, speeds } = JSON.parse(cached);
				worldSpeed = speed;
				unitSpeeds = speeds;
				return;
			} catch (e) {}
			try {
				const [configXml, unitXml] = await Promise.all([$.get("/interface.php?func=get_config"), $.get("/interface.php?func=get_unit_info")]);
				const parser = new DOMParser();
				const speedEl = parser.parseFromString(configXml, "text/xml").querySelector("speed");
				if (speedEl) {
					const s = parseFloat(speedEl.textContent);
					if (!isNaN(s) && s > 0) worldSpeed = s;
				}
				const uiDoc = parser.parseFromString(unitXml, "text/xml");
				ALL_UNITS.forEach((u) => {
					const el = uiDoc.querySelector(`${u} speed`);
					const spd = el ? parseInt(el.textContent) : NaN;
					if (!isNaN(spd) && spd > 0) unitSpeeds[u] = spd;
				});
				utils.saveValue("worldConfig", JSON.stringify({
					speed: worldSpeed,
					speeds: unitSpeeds
				}));
			} catch (e) {
				utils.logMessage("World config failed: " + e, "warn");
			}
		}
		async function loadOwnVillages() {
			const villages = [];
			let page = 0, totalPages = 1;
			const parser = new DOMParser();
			while (page < totalPages) {
				const html = await $.get(`/game.php?village=${game_data.village.id}&screen=overview_villages&mode=units&type=complete&page=${page}`);
				const doc = parser.parseFromString(html, "text/html");
				if (page === 0) {
					let lp = 1;
					doc.querySelectorAll(".paged-nav-item").forEach((el) => {
						const n = parseInt(el.textContent.replace(/\[|\]/g, "").trim());
						if (!isNaN(n) && n > lp) lp = n;
					});
					totalPages = lp;
				}
				const table = doc.querySelector("#units_table");
				if (!table) {
					page++;
					if (page < totalPages) await utils.sleep(300);
					continue;
				}
				table.querySelectorAll("tbody.row_marker").forEach((tbody) => {
					const vn = tbody.querySelector(".quickedit-vn");
					if (!vn) return;
					const villageId = parseInt(vn.getAttribute("data-id"));
					if (!villageId) return;
					if (villages.some((v) => v.id === villageId)) return;
					const lt = (vn.querySelector(".quickedit-label") || vn).textContent.trim();
					const cm = lt.match(/\((\d+)\|(\d+)\)/);
					if (!cm) return;
					const x = parseInt(cm[1]), y = parseInt(cm[2]);
					const name = lt.replace(/\s*\(\d+\|\d+\).*$/, "").trim() || `Village ${villageId}`;
					const ownRow = tbody.querySelector("tr");
					if (!ownRow) return;
					const items = ownRow.querySelectorAll("td.unit-item");
					const troops = {};
					ALL_UNITS.forEach((u, i) => {
						troops[u] = parseInt(items[i]?.textContent?.trim()) || 0;
					});
					villages.push({
						id: villageId,
						name,
						x,
						y,
						troops
					});
				});
				page++;
				if (page < totalPages) await utils.sleep(300);
			}
			return villages;
		}
		function savePlan() {
			utils.saveValue("plan", JSON.stringify(plan));
		}
		function loadPlan() {
			try {
				const raw = utils.getValue("plan");
				if (raw) plan = JSON.parse(raw);
			} catch (e) {
				plan = [];
			}
		}
		function getCommitted() {
			const committed = {};
			plan.forEach((cmd) => {
				const vid = cmd.fromVillageId;
				if (!committed[vid]) committed[vid] = {};
				ALL_UNITS.forEach((u) => {
					committed[vid][u] = (committed[vid][u] || 0) + (cmd.units[u] || 0);
				});
			});
			return committed;
		}
		function getAvailableTroops(village) {
			const c = getCommitted()[village.id] || {};
			const avail = {};
			ALL_UNITS.forEach((u) => {
				avail[u] = Math.max(0, (village.troops[u] || 0) - (c[u] || 0));
			});
			return avail;
		}
		function staemmeDateToMs(text) {
			const now = new Date();
			const [y, m, day] = [
				now.getFullYear(),
				now.getMonth() + 1,
				now.getDate()
			];
			text = text.replace(/(?:hüt um|heute um|today at)/g, `${y}-${m}-${day} `).replace(/(?:morn um|morgen um|tomorrow at)/g, `${y}-${m}-${day + 1} `).replace(/^am\s+(\d{1,2})\.(\d{2})\.(?:\d{4})?\s+um\s+/, (_, dd, mm) => `${y}-${mm}-${dd} `).replace(/^(\d{1,2})\.(\d{2})\.(?:\d{4})?\s*/, (_, dd, mm) => `${y}-${mm}-${dd} `);
			if (/:\d{3}$/.test(text)) text = text.replace(/:([^:]+)$/, ".$1");
			const match = text.match(/(\d{4})-(\d{1,2})-(\d{1,2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
			if (!match) return null;
			return new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6], +match[7]).getTime();
		}
		function msToDatetimeLocal(ms) {
			const d = new Date(ms);
			const pad = (n) => String(n).padStart(2, "0");
			const ms3 = String(d.getMilliseconds()).padStart(3, "0");
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${ms3}`;
		}
		function formatDuration(ms) {
			if (ms <= 0) return "00:00:00";
			const s = Math.floor(ms / 1e3);
			return [
				Math.floor(s / 3600),
				Math.floor(s % 3600 / 60),
				s % 60
			].map((n) => String(n).padStart(2, "0")).join(":");
		}
		function formatSendTime(ms) {
			const d = new Date(ms);
			const pad = (n) => String(n).padStart(2, "0");
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}:${String(d.getMilliseconds()).padStart(3, "0")}`;
		}
		function calcDistance(v1, v2) {
			const x2 = v2.x ?? v2.tx;
			const y2 = v2.y ?? v2.ty;
			let dx = Math.abs(v1.x - x2);
			let dy = Math.abs(v1.y - y2);
			dx = Math.min(dx, 1e3 - dx);
			dy = Math.min(dy, 1e3 - dy);
			return Math.sqrt(dx * dx + dy * dy);
		}
		function getSlowestSpeed(units) {
			let maxSpd = 0, slowestUnit = "spear";
			ALL_UNITS.forEach((u) => {
				if ((units[u] || 0) > 0) {
					const spd = unitSpeeds[u] || 30;
					if (spd > maxSpd) {
						maxSpd = spd;
						slowestUnit = u;
					}
				}
			});
			return {
				maxSpd,
				slowestUnit
			};
		}
		function calcTravelMs(fromVillage, toCoords, units) {
			const { maxSpd } = getSlowestSpeed(units);
			if (maxSpd === 0) return 0;
			const dist = calcDistance(fromVillage, toCoords);
			return Math.round(dist * maxSpd * 6e4 / worldSpeed);
		}
		function buildWorkbenchLine(cmd) {
			const units = cmd.units;
			const { slowestUnit } = getSlowestSpeed(units);
			const typeCode = cmd.type === "support" ? 0 : 4;
			const unitStr = ALL_UNITS.map((u) => `${u}=${btoa(String(units[u] || 0))}`).join("/");
			return `${cmd.fromVillageId}&${cmd.toVillageId}&${slowestUnit}&${cmd.arrivalMs}&${typeCode}&false&false&${unitStr}`;
		}
		function parseAttackRows() {
			const rows = [];
			$("#incomings_table tr.nowrap").each(function() {
				const $r = $(this);
				const attackId = parseInt($r.find("td:nth-child(1) .quickedit").attr("data-id"));
				const targetName = $r.find("td:nth-child(2) a").first().text().trim();
				const targetVidMatch = ($r.find("td:nth-child(2) a").first().attr("href") || "").match(/village=(\d+)/);
				const targetVid = targetVidMatch ? parseInt(targetVidMatch[1]) : 0;
				const senderName = $r.find("td:nth-child(3) a").first().text().trim();
				const senderVidMatch = ($r.find("td:nth-child(3) a").first().attr("href") || "").match(/id=(\d+)/);
				const senderVid = senderVidMatch ? parseInt(senderVidMatch[1]) : 0;
				const arrivalMs = staemmeDateToMs($r.find("td:nth-child(6)").text().trim());
				const coordMatch = targetName.match(/\((\d+)\|(\d+)\)/);
				const tx = coordMatch ? parseInt(coordMatch[1]) : null;
				const ty = coordMatch ? parseInt(coordMatch[2]) : null;
				rows.push({
					attackId,
					targetName,
					targetVid,
					senderName,
					senderVid,
					arrivalMs,
					tx,
					ty,
					$row: $r
				});
			});
			return rows;
		}
		function renderPlanList() {
			const $wrap = $("#pddu-plan-table-wrap");
			$wrap.empty();
			if (plan.length === 0) {
				$wrap.html("<p style=\"color:#888;font-style:italic;margin:0 0 10px\">No commands planned yet.</p>");
				return;
			}
			const cid = game_data.village.id;
			let rows = "";
			plan.forEach((cmd, idx) => {
				const village = ownVillages.find((v) => v.id === cmd.fromVillageId);
				const typeLabel = cmd.type === "support" ? "<img src=\"/graphic/command/support.png\" style=\"vertical-align:-2px\"> Support" : "<img src=\"/graphic/command/attack.png\" style=\"vertical-align:-2px\"> Attack";
				const fromLink = village ? `<a href="/game.php?village=${cid}&screen=info_village&id=${cmd.fromVillageId}">${village.name} (${village.x}|${village.y})</a>` : `Village ${cmd.fromVillageId}`;
				const toLink = `<a href="/game.php?village=${cid}&screen=info_village&id=${cmd.toVillageId}">${cmd.toVillageName}</a>`;
				const arrStr = formatSendTime(cmd.arrivalMs);
				const unitSummary = ALL_UNITS.filter((u) => (cmd.units[u] || 0) > 0).map((u) => `<img src="/graphic/unit/unit_${u}.png" style="width:16px;vertical-align:-2px" title="${u}"> ${cmd.units[u]}`).join(" ");
				const rowClass = idx % 2 === 0 ? "row_a" : "row_b";
				rows += `<tr class="${rowClass}">
                <td>${typeLabel}</td>
                <td>${fromLink}</td>
                <td>${toLink}</td>
                <td>${arrStr}</td>
                <td>${unitSummary}</td>
                <td style="text-align:center"><button type="button" class="pddu-plan-remove" data-idx="${idx}" title="Remove" style="background:none;border:none;color:#b04a4a;cursor:pointer;font-size:16px;padding:0 2px">×</button></td>
            </tr>`;
			});
			$wrap.html(`
            <table class="vis" style="width:100%;margin-bottom:10px">
                <thead><tr>
                    <th>Type</th><th>From</th><th>To</th><th>Arrival</th><th>Units</th><th></th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `);
		}
		function buildModal() {
			$("body").append(`
            <div id="pddu-overlay"></div>
            <div id="pddu-modal" style="display:none">
                <h3 id="pddu-modal-title">Plan Defense</h3>
                <div class="pddu-section-label">Send from village</div>
                <select id="pddu-from-village"></select>
                <div class="pddu-section-label">Units to send</div>
                <div class="pddu-unit-grid" id="pddu-unit-grid"></div>
                <div class="pddu-section-label">Arrival time</div>
                <input type="datetime-local" id="pddu-arrival" step="0.001">
                <div class="pddu-section-label">Command type</div>
                <div class="pddu-type-row">
                    <label><input type="radio" name="pddu-type" value="support" checked> 🛡 Support</label>
                    <label><input type="radio" name="pddu-type" value="attack"> ⚔ Attack</label>
                </div>
                <div id="pddu-travel-info">Select a village and units to see travel info.</div>
                <div class="pddu-modal-footer">
                    <button class="pddu-btn" id="pddu-close-btn">Cancel</button>
                    <button class="pddu-btn pddu-btn-primary" id="pddu-add-btn">+ Add to Plan</button>
                </div>
            </div>
        `);
			ALL_UNITS.forEach((u) => {
				$("#pddu-unit-grid").append(`
                <div class="pddu-unit-cell">
                    <img src="/graphic/unit/unit_${u}.png" alt="${u}" title="${u}">
                    <span>${u}</span>
                    <input type="number" min="0" value="0" id="pddu-unit-${u}" data-unit="${u}">
                </div>
            `);
			});
		}
		function populateVillageDropdown(target) {
			const $sel = $("#pddu-from-village");
			const prevVal = $sel.val();
			$sel.empty();
			let sorted = [...ownVillages];
			if (target && target.tx != null) sorted.sort((a, b) => calcDistance(a, target) - calcDistance(b, target));
			sorted.forEach((v) => {
				const avail = getAvailableTroops(v);
				const nonZero = ALL_UNITS.filter((u) => avail[u] > 0);
				const troopStr = nonZero.length > 0 ? nonZero.map((u) => `${u}:${avail[u]}`).join(" ") : "no troops";
				const dist = target && target.tx != null ? ` | ${calcDistance(v, target).toFixed(1)} fields` : "";
				$sel.append(`<option value="${v.id}">${v.name} (${v.x}|${v.y})${dist} — ${troopStr}</option>`);
			});
			if (prevVal && $sel.find(`option[value="${prevVal}"]`).length) $sel.val(prevVal);
		}
		function getSelectedVillage() {
			const vid = parseInt($("#pddu-from-village").val());
			return ownVillages.find((v) => v.id === vid) || null;
		}
		function updateUnitMaxes() {
			const village = getSelectedVillage();
			if (!village) return;
			const avail = getAvailableTroops(village);
			ALL_UNITS.forEach((u) => {
				const $inp = $(`#pddu-unit-${u}`);
				const max = avail[u] || 0;
				$inp.attr("max", max);
				if (parseInt($inp.val()) > max) $inp.val(max);
			});
		}
		function getCurrentUnits() {
			const units = {};
			ALL_UNITS.forEach((u) => {
				units[u] = parseInt($(`#pddu-unit-${u}`).val()) || 0;
			});
			return units;
		}
		function updateTravelInfo() {
			if (!currentAttack) return;
			const village = getSelectedVillage();
			if (!village) return;
			const units = getCurrentUnits();
			const arrivalMs = new Date($("#pddu-arrival").val()).getTime();
			if (isNaN(arrivalMs)) {
				$("#pddu-travel-info").html("Invalid arrival time.");
				return;
			}
			const toCoords = {
				x: currentAttack.tx,
				y: currentAttack.ty
			};
			if (toCoords.x == null) {
				$("#pddu-travel-info").html("Target coordinates unknown.");
				return;
			}
			if (!ALL_UNITS.some((u) => units[u] > 0)) {
				$("#pddu-travel-info").html("Select units to see travel time.");
				return;
			}
			const travelMs = calcTravelMs(village, toCoords, units);
			const sendMs = arrivalMs - travelMs;
			const now = Date.now();
			const travelStr = formatDuration(travelMs);
			const sendStr = formatSendTime(sendMs);
			const timeLeft = sendMs - now;
			const timeLeftStr = timeLeft > 0 ? `<span style="color:#2a6a2a">Time to send: ${formatDuration(timeLeft)}</span>` : `<span class="pddu-warn">⚠ Send time already passed!</span>`;
			$("#pddu-travel-info").html(`Travel time: <b>${travelStr}</b> | Send by: <b>${sendStr}</b><br>${timeLeftStr}`);
		}
		function openModal(attack) {
			currentAttack = attack;
			$("#pddu-modal-title").text(`Plan: incoming → ${attack.targetName}`);
			if (attack.arrivalMs) $("#pddu-arrival").val(msToDatetimeLocal(attack.arrivalMs));
			$("input[name=\"pddu-type\"][value=\"support\"]").prop("checked", true);
			populateVillageDropdown(attack);
			updateUnitMaxes();
			const remembered = unitMemory[attack.attackId];
			ALL_UNITS.forEach((u) => {
				$(`#pddu-unit-${u}`).val(remembered ? remembered[u] || 0 : 0);
			});
			updateTravelInfo();
			$("#pddu-overlay").show();
			$("#pddu-modal").show();
		}
		function closeModal() {
			$("#pddu-overlay").hide();
			$("#pddu-modal").hide();
			currentAttack = null;
		}
		function buildPlanPanel() {
			$(`
            <div id="pddu-panel">
                <h3>🛡 Defense Plan</h3>
                <div id="pddu-plan-table-wrap"></div>
                <div id="pddu-panel-btns">
                    <button type="button" class="pddu-btn pddu-btn-primary" id="pddu-export-btn">📋 Export to Workbench</button>
                    <button type="button" class="pddu-btn pddu-btn-danger" id="pddu-clear-btn">🗑 Clear Plan</button>
                </div>
            </div>
        `).insertAfter("#incomings_table");
		}
		function injectPlusButtons(attackRows) {
			$("#incomings_table thead tr").append("<th style=\"white-space:nowrap\">Plan</th>");
			attackRows.forEach((attack) => {
				const $btn = $(`<button type="button" class="pddu-plus-btn" title="Add to defense plan">+</button>`);
				$btn.on("click", () => openModal(attack));
				attack.$row.append($("<td style=\"text-align:center\"></td>").append($btn));
			});
		}
		function bindEvents() {
			$("#pddu-overlay, #pddu-close-btn").on("click", closeModal);
			$("#pddu-modal").on("click", (e) => e.stopPropagation());
			$("#pddu-from-village").on("change", () => {
				updateUnitMaxes();
				ALL_UNITS.forEach((u) => {
					$(`#pddu-unit-${u}`).val(0);
				});
				updateTravelInfo();
			});
			$("#pddu-unit-grid").on("input", "input[type=\"number\"]", () => {
				ALL_UNITS.forEach((u) => {
					const $inp = $(`#pddu-unit-${u}`);
					const max = parseInt($inp.attr("max")) || 0;
					const val = parseInt($inp.val()) || 0;
					if (val > max) $inp.val(max);
					if (val < 0) $inp.val(0);
				});
				if (currentAttack) unitMemory[currentAttack.attackId] = getCurrentUnits();
				updateTravelInfo();
			});
			$("#pddu-arrival").on("input", updateTravelInfo);
			$("input[name=\"pddu-type\"]").on("change", updateTravelInfo);
			$("#pddu-add-btn").on("click", () => {
				if (!currentAttack) return;
				const village = getSelectedVillage();
				if (!village) {
					utils.uiMessage("Select a village first.", 3);
					return;
				}
				const units = getCurrentUnits();
				if (!ALL_UNITS.some((u) => units[u] > 0)) {
					utils.uiMessage("Add at least one unit.", 3);
					return;
				}
				const arrivalMs = new Date($("#pddu-arrival").val()).getTime();
				if (isNaN(arrivalMs)) {
					utils.uiMessage("Invalid arrival time.", 3);
					return;
				}
				const type = $("input[name=\"pddu-type\"]:checked").val();
				plan.push({
					fromVillageId: village.id,
					fromVillageName: `${village.name} (${village.x}|${village.y})`,
					toVillageId: currentAttack.targetVid,
					toVillageName: currentAttack.targetName,
					arrivalMs,
					type,
					units
				});
				delete unitMemory[currentAttack.attackId];
				savePlan();
				renderPlanList();
				closeModal();
				utils.uiMessage("Added to plan!", 2);
			});
			$("#pddu-plan-table-wrap").on("click", ".pddu-plan-remove", function() {
				const idx = parseInt($(this).data("idx"));
				plan.splice(idx, 1);
				savePlan();
				renderPlanList();
			});
			$("#pddu-export-btn").on("click", () => {
				if (plan.length === 0) {
					utils.uiMessage("Plan is empty.", 3);
					return;
				}
				const lines = plan.map(buildWorkbenchLine).join("\n");
				const ta = document.createElement("textarea");
				ta.value = lines;
				document.body.appendChild(ta);
				ta.select();
				ta.setSelectionRange(0, 99999);
				document.execCommand("copy");
				document.body.removeChild(ta);
				utils.uiMessage(`Copied ${plan.length} command(s) to clipboard!`, 4);
			});
			$("#pddu-clear-btn").on("click", () => {
				if (!confirm("Clear all planned commands?")) return;
				plan = [];
				savePlan();
				renderPlanList();
			});
		}
		loadPlan();
		await Promise.all([loadWorldConfig(), loadOwnVillages().then((v) => {
			ownVillages = v;
		})]);
		$badge.remove();
		if (ownVillages.length === 0) {
			utils.uiMessage("Prepare Defense: could not load own villages.", 5);
			return;
		}
		const attackRows = parseAttackRows();
		if (attackRows.length === 0) utils.logMessage("No incoming attacks found on this page.", "info");
		buildModal();
		buildPlanPanel();
		injectPlusButtons(attackRows);
		renderPlanList();
		bindEvents();
		utils.finishScript(attackRows.length);
	}
	var url = window.location.href;
	if (url.includes("screen=am_farm")) {
		run$13();
		run$10();
		run$9();
		run$8();
		run$7();
	}
	if (url.includes("screen=overview_villages") && url.includes("mode=prod")) run$12();
	if (url.includes("screen=overview_villages") && url.includes("mode=incomings")) {
		run$11();
		run();
	}
	if (url.includes("screen=ally")) run$5();
	if (url.includes("screen=info_village")) {
		run$4();
		run$5();
	}
	if (url.includes("game.php")) {
		run$3();
		run$6();
	}
	if (url.includes("screen=map")) run$1();
	if (url.includes("screen=place") || url.includes("screen=info_village") || url.includes("ds-ultimate.de") && url.includes("attackPlanner")) run$2();
})();
