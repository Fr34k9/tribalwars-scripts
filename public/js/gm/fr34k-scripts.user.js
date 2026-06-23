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

(function () {
  'use strict';

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Fr34kUtils {
    constructor(config) {
      __publicField(this, "random", {
        delay: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        number: (min, max) => Math.random() * (Number(max) - Number(min)) + Number(min)
      });
      __publicField(this, "unitPopulationCost", {
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
      });
      this.serverUrl = "https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/api/";
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
      if (!this.getValue("first_run")) {
        this.registerScript();
      }
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
        data: { counter, player: game_data.player.name },
        success: (response) => this.logMessage(`Total actions: ${response.counter}`, "info"),
        error: () => this.logMessage("Failed to count actions", "error")
      });
    }
    sleep(milliseconds) {
      return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }
    botDetected() {
      const detected = ["#botprotection_quest", "#bot_check", "#popup_box_bot_protection"].some((sel) => $(sel).length > 0);
      if (detected) this.logMessage("Bot detected", "warn");
      return detected;
    }
    // localStorage prefixed by script_name to avoid key collisions between features
    saveValue(key, value) {
      localStorage.setItem(this.config.script_name + "_" + key, value);
    }
    getValue(key) {
      return localStorage.getItem(this.config.script_name + "_" + key);
    }
    getParameterByName(key) {
      return new URL(window.location.href).searchParams.get(key);
    }
  }
  function run$c() {
    const utils2 = new Fr34kUtils({
      script_name: "farm_god_addon",
      farmgod_script: "https://higamy.github.io/TW/Scripts/Approved/FarmGodCopy.js"
    });
    function createMenu() {
      const checked = utils2.getValue("autorefresh") === "1" ? "checked" : "";
      const refreshTime = utils2.getValue("refresh_time") || 1e3;
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
                            <td style="text-align:center"><input type="checkbox" id="farm_god_addon_autofarm" ${checked}></td>
                            <td style="text-align:center"><input id="farm_god_addon_refresh_time" type="text" value="${refreshTime}"></td>
                            <td style="text-align:center" id="farm_god_addon_next_refresh">-</td>
                        </tr>
                    </tbody>
                </table>
            </div>`;
      $("#am_widget_Farm").before(template);
    }
    const farmSequence = {
      step1: () => {
        utils2.logMessage("Starting step 1", "debug");
        if (utils2.getValue("autorefresh") === "1") {
          $.getScript(utils2.config.farmgod_script);
          utils2.sleep(utils2.random.delay(1e3, 2e3)).then(farmSequence.step2);
        }
      },
      step2: () => {
        utils2.logMessage("Starting step 2", "debug");
        if (utils2.getValue("autorefresh") === "1") {
          $(".optionsContent .optionButton")[0].click();
          utils2.sleep(utils2.random.delay(6e3, 12e3)).then(farmSequence.step3);
        }
      },
      step3: () => {
        utils2.logMessage("Starting step 3", "debug");
        if (utils2.getValue("autorefresh") === "1") {
          let totalDelay = 0;
          let totalActions = 0;
          const elements = $(".farmRow .farmGod_icon");
          elements.each((index, element) => {
            totalDelay += utils2.random.delay(250, 400);
            utils2.sleep(totalDelay).then(() => {
              if (utils2.getValue("autorefresh") === "1" && !utils2.botDetected()) {
                $(element).click();
                totalActions++;
                if (index === elements.length - 1) utils2.finishScript(totalActions);
              }
            });
          });
        }
      }
    };
    function setRefreshTimeAndReloadPage() {
      const refreshTime = (utils2.getValue("refresh_time") || 1e3) * utils2.random.number(0.7, 1.3) * 1e3;
      const nextRefresh = new Date(Date.now() + refreshTime);
      $("#farm_god_addon_next_refresh").text(nextRefresh.toLocaleString());
      utils2.logMessage("Refreshing page on " + nextRefresh.toLocaleString(), "debug");
      utils2.sleep(refreshTime).then(() => {
        if (!utils2.botDetected()) location.reload();
      });
    }
    utils2.sleep(2e3).then(() => utils2.botDetected());
    createMenu();
    $("#farm_god_addon_autofarm").on("click", function() {
      const value = $(this).is(":checked") ? "1" : "0";
      utils2.saveValue("autorefresh", value);
      if (value === "1") location.reload();
    });
    $("#farm_god_addon_refresh_time").on("change", function() {
      utils2.saveValue("refresh_time", $(this).val());
    });
    utils2.sleep(utils2.random.delay(1e4, 15e3)).then(farmSequence.step1);
    setRefreshTimeAndReloadPage();
  }
  function run$b() {
    const utils2 = new Fr34kUtils({
      script_name: "building_completion_highlighter",
      highlight_minutes: 3,
      highlight_color: "green"
    });
    const TIME_PATTERNS = {
      TODAY: ["hüt um ", "heute um ", "today at "],
      TOMORROW: ["morn um ", "morgen um ", "tomorrow at "]
    };
    function convertGameDateToTimestamp(dateText) {
      const d = /* @__PURE__ */ new Date();
      const [y, m, day] = [d.getFullYear(), d.getMonth() + 1, d.getDate()];
      let text = dateText;
      TIME_PATTERNS.TODAY.forEach((p) => {
        text = text.replace(p, `${y}-${m}-${day} `);
      });
      TIME_PATTERNS.TOMORROW.forEach((p) => {
        text = text.replace(p, `${y}-${m}-${day + 1} `);
      });
      return Date.parse(text + "Z") - 36e5;
    }
    function highlightUpcomingCompletions() {
      const selector = "#production_table tbody tr td:nth-child(8) #order_0 .queue_icon";
      const timeRegex = /(hüt|morn|heute|morgen|today|tomorrow) (um |at )?(\d{2}:\d{2})/g;
      $(selector).each(function() {
        const match = $(this).html().match(timeRegex);
        if (match == null ? void 0 : match[0]) {
          const ts = convertGameDateToTimestamp(match[0] + ":59");
          if (ts - Date.now() < utils2.config.highlight_minutes * 60 * 1e3) {
            $(this).parent().parent().parent().css("background-color", utils2.config.highlight_color);
          }
        }
      });
    }
    highlightUpcomingCompletions();
    utils2.finishScript(0);
  }
  function run$a() {
    const utils2 = new Fr34kUtils({ script_name: "nice_overview" });
    function style() {
      $('ul[id^="unit_order"]').css("min-width", "12em");
      $(".order").css("margin-right", "0px");
    }
    function removeText() {
      $('ul[id^="building_order"]').parent().each(function() {
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
      const getHighestResource = ($row) => Math.max(...["wood", "stone", "iron"].map((t) => parseFloat($row.find(`.${t}`).text().replace(".", ""))));
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
      const $header = $("<th>Ress %</th>").css({ cursor: "pointer", "white-space": "nowrap" });
      $table.find("tr:first th:eq(3)").after($header);
      $table.find("tr:gt(0)").each(function() {
        const $row = $(this);
        const highest = getHighestResource($row);
        const total = parseFloat($row.find("td:eq(4)").text());
        const pct = (highest / total * 100).toFixed(2);
        const $cell = $("<td>").addClass("fr34k-percentage-cell").append($("<div>").addClass("fr34k-progress-bar").css({ "background-color": getBackgroundColor(pct), width: `${pct}%` })).append($("<span>").addClass("fr34k-percentage-text").text(pct + "%"));
        $row.find("td:eq(3)").after($cell);
      });
      $header.on("click", function() {
        sortTable($table, $(this).index(), ascending);
        ascending = !ascending;
      });
    }
    style();
    removeText();
    showPercentage();
    utils2.finishScript();
  }
  function run$9() {
    const utils2 = new Fr34kUtils({ script_name: "rename_attacks" });
    const refreshDelay = utils2.random.number(3e5, 9e5);
    const refreshTime = new Date(Date.now() + refreshDelay).toLocaleTimeString();
    utils2.uiMessage("Auto-Refresh at " + refreshTime, refreshDelay, true);
    utils2.sleep(refreshDelay).then(() => {
      const countElements = $("#incomings_table tr .quickedit-label");
      let countActions = 0;
      countElements.each(function() {
        if ($(this).text().replace(/\s/g, "") === "Angriff") countActions++;
      });
      utils2.finishScript(countActions);
      utils2.sleep(1e3).then(() => {
        var _a;
        $("#select_all").click();
        (_a = $("#incomings_table tr:last() input[data-title]")) == null ? void 0 : _a.click();
      });
    });
  }
  function run$8() {
    const utils2 = new Fr34kUtils({ script_name: "baba_wall_clearer" });
    const TROOPS = [
      { axe: 20, ram: 5, spy: 1 },
      { axe: 30, marcher: 10, ram: 5, spy: 1 },
      { axe: 30, marcher: 10, ram: 8, spy: 1 },
      { axe: 50, marcher: 30, ram: 12, spy: 1 },
      { axe: 150, ram: 20, spy: 1 }
    ];
    const WAIT_MS = 500;
    $('h3:contains("Farm-Assi")').append('<img id="bmc_show_menu" style="margin-left:10px;cursor:pointer;" src="/graphic/buildings/wall.png">');
    function createMenu() {
      const checked = utils2.getValue("attack_green") == "1" ? 'checked="checked"' : "";
      const max_wall = utils2.getValue("max_wall") || 5;
      const max_distance = utils2.getValue("max_distance") || 15;
      const max_tabs = utils2.getValue("max_tabs") || 10;
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
      const attack_green = utils2.getValue("attack_green") == "1";
      const max_wall = utils2.getValue("max_wall") || 5;
      const max_distance = utils2.getValue("max_distance") || 15;
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
      const urls = getUrls().slice(0, utils2.getValue("max_tabs") || 10);
      urls.forEach((url2, i) => setTimeout(() => window.open(url2, "_blank"), i * WAIT_MS));
      utils2.finishScript(urls.length);
    });
    $("#fbwc_save").click(() => {
      utils2.saveValue("attack_green", $("#fbwc_attack_green").is(":checked") ? 1 : 0);
      utils2.saveValue("max_wall", $("#fbwc_max_wall").val());
      utils2.saveValue("max_distance", $("#fbwc_max_distance").val());
      utils2.saveValue("max_tabs", $("#fbwc_max_tabs").val());
      utils2.uiMessage("Settings saved", 3);
    });
  }
  function run$7() {
    const utils2 = new Fr34kUtils({ script_name: "farmgod_addon_enter" });
    let clicked = 0;
    let timeoutIds = [];
    $('h3:contains("Farm-Assi")').append('<img id="fga_auto_enter" style="margin-left:10px;cursor:pointer;" src="/graphic/unit/speed.png">');
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
      utils2.finishScript(elements.length);
    });
  }
  function run$6() {
    const utils2 = new Fr34kUtils({ script_name: "looter_of_the_day" });
    let attack_counter = 0;
    let intervalId = null;
    $('h3:contains("Farm-Assi")').append('<img id="lotd_send" height="18px" style="margin-left:10px;cursor:pointer;" src="/graphic/awards/award9.png">');
    $("#lotd_send").click(function() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        utils2.finishScript(attack_counter);
        attack_counter = 0;
      } else {
        attack_counter = 0;
        startRandomInterval();
      }
    });
    function startRandomInterval() {
      function sendAttack() {
        if (utils2.botDetected()) {
          clearInterval(intervalId);
          intervalId = null;
          utils2.finishScript(attack_counter);
          return;
        }
        if ($(".autoHideBox").length > 0) {
          clearInterval(intervalId);
          intervalId = null;
          utils2.finishScript(attack_counter);
          return;
        }
        const el = $("#plunder_list").find('a[class^="farm_village_"].farm_icon_b').first();
        el.removeClass("farm_icon_disabled").click();
        attack_counter++;
        intervalId = setTimeout(startRandomInterval, 800 + Math.random() * 400);
      }
      sendAttack();
    }
  }
  function run$5() {
    const utils2 = new Fr34kUtils({ script_name: "new_baba_finder" });
    $('h3:contains("Farm-Assi")').append('<img id="nbf_remove" style="margin-left:10px;cursor:pointer;" src="/graphic/buildings/main.png">');
    $("#nbf_remove").click(async function() {
      const results = await getAllCoords();
      let removed = 0, tagged = 0;
      $("#barbariansTable .overview_table.ra-table tbody tr td:nth-child(3) a").each(function() {
        const text = $(this).text().replace("\n", "").trim();
        if (results.includes(text)) {
          $(this).parent().parent().remove();
          removed++;
        } else {
          const href = $(this).parent().parent().find("td").last().find("a").attr("href");
          $(this).parent().parent().find("td").last().find("a").attr("href", href + "&light=10");
          tagged++;
        }
      });
      utils2.logMessage(`Removed: ${removed}, Tagged: ${tagged}`);
      utils2.finishScript(removed + tagged);
    });
    async function getAllCoords() {
      const current_village = game_data.village.id;
      const all_coords = [];
      let total_pages = 1, current_page = 0;
      while (current_page < total_pages) {
        const response = await $.get(`/game.php?village=${current_village}&screen=am_farm&order=distance&dir=asc&Farm_page=${current_page}`);
        $(response).find('#plunder_list tr[id^="village_"] td:nth-child(4) a').each(function() {
          const match = $(this).text().trim().match(/\(([^)]+)\)/);
          if (match) all_coords.push(match[1]);
        });
        utils2.logMessage("Downloaded page " + current_page, "debug");
        if (total_pages <= 1) {
          total_pages = parseInt($(response).find("#plunder_list_nav .paged-nav-item").last().text().replace("[", "").replace("]", ""));
        }
        current_page++;
        await utils2.sleep(500);
      }
      return all_coords;
    }
  }
  async function run$4() {
    const utils2 = new Fr34kUtils({ script_name: "tribe_full_defense_overview" });
    const current_village = game_data.village.id;
    const last_sync = utils2.getValue("last_sync");
    if (last_sync == null || Date.now() - last_sync > 6e4) {
      const attacks = await getAllOwnAttacks();
      syncAttacksToServer(attacks);
    }
    const stored = utils2.getValue("all_attacks");
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
        const player_commands = JSON.parse(all_attacks[key].commands);
        player_commands.forEach((cmd) => {
          const [id, name, target_v, target_vid, sender_v, sender_vid, sender_p, sender_pid, arrival] = cmd;
          if (arrival <= Date.now()) return;
          const countdown = `<span id="countdown-${id}" data-ms="${arrival}">${formatTime(Math.round((arrival - Date.now()) / 1e3))}</span>`;
          table_content += `<tr>
                    <td><img src="/graphic/command/attack.png"> ${name}</td>
                    <td>${key}</td>
                    <td><a href="/game.php?village=${current_village}&screen=info_village&id=${target_vid}">${target_v}</a></td>
                    <td><a href="/game.php?village=${current_village}&screen=info_village&id=${sender_vid}">${sender_v}</a></td>
                    <td><a href="/game.php?village=${current_village}&screen=info_player&id=${sender_pid}">${sender_p}</a></td>
                    <td data-order="${arrival}">${staemmeMsToDate2(arrival)}</td>
                    <td>${countdown}</td>
                </tr>`;
        });
        div_player_last_update += `<tr><td>${key}</td><td>${staemmeMsToDate2(all_attacks[key].last_update * 1e3)}</td></tr>`;
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
        $('span[id^="countdown-"]').each(function() {
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
          lengthMenu: [[100, 200, 500, -1], [100, 200, 500, "All"]],
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
      utils2.finishScript(1);
    });
    function formatTime(s) {
      if (s <= 0) return "-00:00:01";
      return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
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
      utils2.logMessage("Fetching attacks from overview");
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
          staemmeDateToMs2(r.find("td:nth-child(6)").text().trim())
        ]);
      });
      return data;
    }
    async function syncAttacksToServer(attacks) {
      try {
        const response = await $.ajax({
          url: "https://greasemonkey.fr34k.ch/ds/tribe-full-defense-overview/index.php",
          type: "POST",
          data: { world: game_data.world, player: game_data.player.name, ally: game_data.player.ally, attacks: JSON.stringify(attacks) }
        });
        utils2.saveValue("all_attacks", response);
        utils2.saveValue("last_sync", Date.now());
      } catch (e) {
        utils2.logMessage("Sync failed", "error");
      }
    }
    function staemmeDateToMs2(text) {
      const d = /* @__PURE__ */ new Date();
      const [y, m, day] = [d.getFullYear(), d.getMonth() + 1, d.getDate()];
      text = text.replace(/(?:hüt um|heute um|today at)/g, `${y}-${m}-${day} `).replace(/(?:morn um|morgen um|tomorrow at)/g, `${y}-${m}-${day + 1} `);
      if (/\d{3}$/.test(text)) text = text.replace(/:([^:]+)$/, ".$1");
      return Date.parse(text + "Z") - 36e5;
    }
    function staemmeMsToDate2(ms) {
      const d = new Date(ms), now = /* @__PURE__ */ new Date();
      const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      const nextDay = d.getDate() === now.getDate() + 1 && d.getMonth() === now.getMonth();
      const prefix = sameDay ? "hüt um" : nextDay ? "morn um" : `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      return `${prefix} ${[d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":")}:${String(d.getMilliseconds()).padStart(3, "0")}`;
    }
  }
  async function run$3() {
    const utils2 = new Fr34kUtils({ script_name: "tribe_member_overview" });
    const url2 = window.location.href;
    if (url2.includes("screen=ally")) {
      $("#ally_content form").append("<span>Loading Members...<span id='tribe_members_overview_loading_counter'></span></span>");
      const memberUrls = await getMemberUrls();
      if (memberUrls.length) {
        $("#tribe_members_overview_loading_counter").text("0 / " + memberUrls.length);
        await processMemberUrls(memberUrls);
        utils2.finishScript(memberUrls.length);
      }
    }
    if (url2.includes("screen=info_village")) {
      const sitter = game_data.player.sitter;
      const allyId = game_data.player.ally;
      const troopsPage = `/game.php?screen=ally&mode=members_troops&player_id=${VillageInfo.player_id}&village=${game_data.village.id}${sitter != 0 ? `&t=${game_data.player.id}` : ""}`;
      if ($("#content_value table table").first().find(`tr td:contains("Stamm")`).parent().find(`a[href*="info_ally&id=${allyId}"]`).length > 0) {
        await fetchAndAppendTroops(troopsPage);
        utils2.finishScript(1);
      }
    }
    async function processMemberUrls(urls) {
      let c = 0;
      for (const url3 of urls) {
        $("#tribe_members_overview_loading_counter").text(`${++c} / ${urls.length}`);
        await fetchAndAppendMember(url3);
        await utils2.sleep(200);
      }
      $("#tribe_members_overview_loading_counter").text("Done");
    }
    async function fetchAndAppendTroops(url3) {
      const coordinates = $('#content_value table td:contains("Koordinate:")').last().parent().find("td:nth-child(2)").text();
      try {
        const data = await $.get(url3);
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
        utils2.logMessage("Error fetching village troops: " + e, "error");
      }
    }
    async function fetchAndAppendMember(url3) {
      try {
        const data = await $.get(url3);
        const $content = $(data).find("#ally_content .table-responsive");
        $content.find(".info_box").remove();
        const username = $(data).find(".input-nicer :selected").text();
        $("#ally_content").append(`<h4>${username}</h4>`).append($content);
      } catch (e) {
        utils2.logMessage("Error fetching member: " + e, "error");
      }
    }
    async function getMemberUrls() {
      const mode2 = utils2.getParameterByName("mode");
      const playerID = game_data.player.id;
      const sitter = game_data.player.sitter;
      const baseUrl = `/game.php?screen=ally&mode=${mode2}&player_id=${playerID}&village=${game_data.village.id}${sitter != 0 ? `&t=${playerID}` : ""}`;
      try {
        const response = await $.get(baseUrl);
        const urls = [];
        $(response).find(".input-nicer option:not([disabled])").each(function() {
          const pid = parseInt(this.value);
          if (!isNaN(pid)) urls.push(`/game.php?screen=ally&mode=${mode2}&player_id=${pid}&village=${game_data.village.id}${sitter != 0 ? `&t=${playerID}` : ""}`);
        });
        return urls;
      } catch (e) {
        utils2.logMessage("Error fetching member URLs: " + e, "error");
        return [];
      }
    }
  }
  async function run$2() {
    const utils2 = new Fr34kUtils({ script_name: "tribe_member_troops_in_village" });
    const sitter = game_data.player.sitter;
    const allyId = game_data.player.ally;
    const troopsPage = `/game.php?screen=ally&mode=members_troops&player_id=${VillageInfo.player_id}&village=${game_data.village.id}${sitter != 0 ? `&t=${game_data.player.id}` : ""}`;
    if ($("#content_value table table").first().find(`tr td:contains("Stamm")`).parent().find(`a[href*="info_ally&id=${allyId}"]`).length > 0) {
      await getTroopsOfMember(troopsPage);
      utils2.finishScript(1);
    }
    async function getTroopsOfMember(url2) {
      const coordinates = $('#content_value table td:contains("Koordinate:")').last().parent().find("td:nth-child(2)").text();
      try {
        const data = await $.get(url2);
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
        utils2.logMessage("Error fetching member data: " + e, "error");
      }
    }
  }
  function run$1() {
    const utils2 = new Fr34kUtils({ script_name: "tribe_status_checker" });
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
      utils2.finishScript(1);
    }
    $('.menu-column-item:contains("Forum")').parent().after(
      '<tr><td class="menu-column-item"><a href="#" class="tribe_status_checker_health_check">Health-Check<span class="badge"></span></a></td></tr>'
    );
    const lastRun = utils2.getValue("last_run");
    if (!lastRun || Date.now() - lastRun >= 3e5) {
      loadScript();
      utils2.saveValue("last_run", Date.now().toString());
    }
    const incoming = document.querySelector(".ra-player-incomings");
    if (!incoming) {
      setTimeout(() => {
        if (document.querySelector(".ra-player-incomings")) getAllInfos();
      }, 1e4);
    } else {
      getAllInfos();
    }
    $(".tribe_status_checker_health_check").click((e) => {
      e.preventDefault();
      loadScript();
    });
  }
  function run() {
    const utils = new Fr34kUtils({ script_name: "ultra_timing" });
    const CONFIG = {
      fireEarlyMs: 33,
      beforeMs: 15,
      afterMs: 15,
      spinWindowMs: 400,
      warmupMs: 2500
    };
    let dauer = 0, goalTime = 0, absendeTime = 0, mode = "exact", interval = 0;
    let connectionWarmed = false;
    const param_arrival_time = getParameterByName("at");
    const currentUrl = window.location.href;
    const Clock = {
      anchorOffset: null,
      init() {
        const nav = performance.getEntriesByType("navigation")[0];
        if (nav && typeof Timing !== "undefined" && Timing.initial_server_time) {
          this.anchorOffset = Timing.initial_server_time - nav.responseStart;
        } else {
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
      if (Date.now() - parseInt(lastAutoSent) < 3e4) {
        setTimeout(window.close, getRandomDelay(2e3, 5e3));
      }
    }
    function handleDsUltimate() {
      $("#datatablesHeader2").append('<input type="checkbox" id="autoSend" class="mr-1"><label for="autoSend">Auto-Send</label>');
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
        if (val.toLowerCase() === "min" || val == 99999) {
          val = Math.ceil(baseMin / (unitPopulation[unit] || 1));
        } else {
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
      const isSupport = getParameterByName("uttype") === "support";
      const btnSelector = isSupport ? "#target_support" : "#target_attack";
      const delay = getRandomDelay(1e3, 4e3);
      if (!$(btnSelector).length || $(".error_box").length) {
        setTimeout(window.close, delay);
      } else {
        setTimeout(() => $(btnSelector).click(), delay);
      }
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
      const jitter = 0;
      const targetArrival = mode === "before" ? absendeTime - CONFIG.beforeMs - jitter : mode === "after" ? absendeTime + CONFIG.afterMs + jitter : absendeTime;
      return targetArrival - CONFIG.fireEarlyMs;
    }
    function prepareSend() {
      const fireTime = computeFireTime();
      const remaining = fireTime - Clock.now();
      $(".ultraTimingTimeLeft").text(`${(remaining / 1e3).toFixed(1)}s [${mode}]`);
      if (remaining < CONFIG.warmupMs && !connectionWarmed) {
        connectionWarmed = true;
        fetch("/graphic/delete.png?" + Math.random(), { cache: "no-store" }).catch(() => {
        });
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
      while (performance.now() < perfDeadline) {
      }
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
      $(this).append('<td><img class="ultratiming_remind_time" style="cursor:pointer;" src="/graphic/group_jump.png" title="Zeit merken"></td>');
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
      const d = /* @__PURE__ */ new Date();
      text = text.replace(/(?:hüt um|heute um)/g, `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} `).replace(/(?:morn um|morgen um)/g, `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate() + 1} `);
      if (/:\d{3}$/.test(text)) text = text.replace(/:([^:]+)$/, ".$1");
      return Date.parse(text + "Z") - 72e5;
    }
    function staemmeMsToDate(ms) {
      const d = new Date(ms), now = /* @__PURE__ */ new Date();
      const same = (o) => d.getDate() === now.getDate() + o && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      const prefix = same(0) ? "hüt um" : same(1) ? "morn um" : `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      return `${prefix} ${[d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()].map((n, i) => String(n).padStart(i === 3 ? 3 : 2, "0")).join(":")}`;
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
        if ($(this).find('[data-content="Unterstützung"]').length > 0) href += "&uttype=support";
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
  const url = window.location.href;
  if (url.includes("screen=am_farm")) {
    run$c();
    run$8();
    run$7();
    run$6();
    run$5();
  }
  if (url.includes("screen=overview_villages") && url.includes("mode=prod")) {
    run$b();
    run$a();
  }
  if (url.includes("screen=overview_villages") && url.includes("mode=incomings")) {
    run$9();
  }
  if (url.includes("screen=ally")) {
    run$3();
  }
  if (url.includes("screen=info_village")) {
    run$2();
    run$3();
  }
  if (url.includes("game.php")) {
    run$1();
    run$4();
  }
  if (url.includes("screen=place") || url.includes("screen=info_village") || url.includes("ds-ultimate.de") && url.includes("attackPlanner")) {
    run();
  }

})();
