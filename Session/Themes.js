const THEMES = [];

const THEME_PHASE = {
    START: 0,
    INTERMEDIATE: 1,
    LAST: 2,
};

function themesLoadAll() {
    var themesPath = getPersonalityPath() + "/Session/Themes";
    if (getFile(themesPath).exists()) {
        var themes = getScriptFilesInFolder(themesPath + "/");

        for (var i = 0; i < themes.length; i++) {
            run(themes[i]);

            var match = themes[i].match(/[\/\\](.*?)\.js$/);

            THEMES.push({
                name: match[1],
                getFrequency: function () { return eval(match[1].toLowerCase() + "GetFrequency")(); },
                run: function (phase) {
                    if (phase == THEME_PHASE.START) {
                        setVar(VARIABLE.THEME_LAST_SESSION_NUMBER + match[1], getVar(VARIABLE.CURRENT_SESSION_NUMBER, 0));
                    }
                    return eval(match[1].toLowerCase() + "Run")(phase);
                },
                getLastSessionNumber: function () { return getVar(VARIABLE.THEME_LAST_SESSION_NUMBER + match[1], 0); },
            });
        }
    }
}

/**
 * Picks a theme module to run between all the actual modules. This is o
 */
function pickTheme() {
    themesLoadAll();

    // Build ttable of probabilities 

    var p = [];

    var thisSessionNumber = getVar(VARIABLE.CURRENT_SESSION_NUMBER, 0);

    var total_exact = 0;
    var total_approx = 0;

    for (var i = 0; i < THEMES.length; i++) {
        var freq = THEMES[i].getFrequency();
        if (freq.approx) {
            p.push(freq);
            total_approx += freq.approx;
        } else {
            var lastSessionNumber = THEMES[i].getLastSessionNumber();
            var diff = thisSessionNumber - lastSessionNumber;
            var val;

            if (diff < freq.min) {
                // Do nothing
                val = 0;
            } else {
                if (diff >= freq.max) {
                    // Return 1
                    val = 1;
                } else {
                    val = 1.0 / (freq.max + 1 - diff);
                }
            }
            p.push({ exact: val });
            total_exact += val;
        }
    }

    var approx_scale = 1;
    if (total_exact + total_approx > 1) {
        if (total_exact > 1) {
            approx_scale = 0;
        } else {
            approx_scale = (1 - total_exact) / total_approx;
        }
    }

    var range = total_exact + total_approx * approx_scale;

    var val = Math.random() * range;

    var matched = null;

    for (var i = 0; i < p.length; i++) {
        var pr = p[i].exact || (p[i].approx * approx_scale);
        if (pr >= val) {
            matched = THEMES[i];
            break;
        }
        val -= pr;
    }

    if (matched) {
        return THEMES[i];
    }
}
