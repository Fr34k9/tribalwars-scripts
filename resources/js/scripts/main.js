import { run as farmGodAddon }              from './features/farm-god-addon.js';
import { run as niceOverview }              from './features/nice-overview.js';
import { run as renameAttacks }             from './features/rename-attacks.js';
import { run as babaWallClearer }           from './features/baba-wall-clearer.js';
import { run as farmgodAddonEnter }         from './features/farmgod-addon-enter.js';
import { run as looterOfTheDay }            from './features/looter-of-the-day.js';
import { run as newBabaFinder }             from './features/new-baba-finder.js';
import { run as tribeFullDefenseOverview }  from './features/tribe-full-defense-overview.js';
import { run as tribeMemberOverview }       from './features/tribe-member-overview.js';
import { run as tribeMemberTroopsInVillage } from './features/tribe-member-troops-in-village.js';
import { run as tribeStatusChecker }        from './features/tribe-status-checker.js';
import { run as ultraTiming }               from './features/ultra-timing.js';
import { run as attackPlanner }            from './features/attack-planner.js';

const url = window.location.href;

// Farm assistant page — multiple features live here
if (url.includes('screen=am_farm')) {
    farmGodAddon();
    babaWallClearer();
    farmgodAddonEnter();
    looterOfTheDay();
    newBabaFinder();
}

// Village production overview
if (url.includes('screen=overview_villages') && url.includes('mode=prod')) {
    niceOverview();
}

// Incoming attacks overview
if (url.includes('screen=overview_villages') && url.includes('mode=incomings')) {
    renameAttacks();
}

// Tribe/ally pages
if (url.includes('screen=ally')) {
    tribeMemberOverview();
}

// Village info — tribe member troop info + member overview (handles both)
if (url.includes('screen=info_village')) {
    tribeMemberTroopsInVillage();
    tribeMemberOverview();
}

// Any game page — tribe status checker (runs on all pages, self-throttles)
if (url.includes('game.php')) {
    tribeStatusChecker();
    tribeFullDefenseOverview();
}

// Map screen — attack planner
if (url.includes('screen=map')) {
    attackPlanner();
}

// Ultra timing — place screen, confirm screen, DS Ultimate planner
if (
    url.includes('screen=place') ||
    url.includes('screen=info_village') ||
    (url.includes('ds-ultimate.de') && url.includes('attackPlanner'))
) {
    ultraTiming();
}
