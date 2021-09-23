// Use as in %units:30,gm%   -- this turns into either "30 gm" or "1 oz"
function unitsVocabulary(arg) {
    // By default, just return the info
    if (!arg) {
        return "";
    }

    sendDebugMessage("Unit conversion: " + arg);

    const unitStyle = getVar("unitStyle", "metric");

    if (unitStyle == "imperial") {
        const measurement = arg.split(/,/);
        if (measurement.length == 2) {
            var amount = measurement[0];
            var units = measurement[1].toLowerCase();

            if (units == "gm" || units == "g") {
                units = "oz";
                amount = scaleUnits(measurement[0], 1 / 28.35);

                if (amount > 24) {
                    units = "lb";
                    amount = scaleUnits(measurement[0], 1 / 453.6);
                }
            }
            if (units == "kg") {
                units = "lb";
                amount = scaleUnits(measurement[0], 2.2);
            }
            if (units == "cm") {
                units = "in";
                amount = scaleUnits(measurement[0], 1 / 2.54);
                if (amount > 23 || Math.abs(measurement[0] - 30) < 3) {
                    units = "ft";
                    amount = scaleUnits(measurement[0], 1 / (12 * 2.54));
                }
            }
            if (units == "cc" || units == "ml") {
                units = " fl oz";
                amount = scaleUnits(measurement[0], 1 / 29.57);

                if (amount >= 8) {
                    units = " cups";
                    amount = scaleUnits(measurement[0], 1 / (29.57 * 8));

                    if (amount > 3) {
                        units = " pints";
                        amount = scaleUnits(measurement[0], 1 / (29.57 * 16));
                    }
                }
            }
            if (amount == 1 && units.endsWith("s")) {
                units = units.substring(0, units.length - 1);
            }

            arg = amount + units;
        }
    } else {
        arg = arg.replace(/,/g, "");
    }
    sendDebugMessage("converted to " + arg);
    return arg;
}

function getApplicableUnit(metric, imperial) {
    const unitStyle = getVar("unitStyle", "metric");

    if (unitStyle == "imperial") {
        return imperial;
    }
    return metric;
}

function convertToMetric(amount, unit) {
    if (unit.startsWith("in")) {
        return amount * 2.54;
    }
    if (unit == "ft") {
        return amount * 12 * 2.54;
    }
    if (unit == "oz") {
        return amount * 28.35;
    }
    if (unit == "lb") {
        return amount * 16 * 28.35;
    }
    if (unit == "fl oz") {
        return amount * 29.57;
    }
    if (unit == "cups") {
        return amount * 8 * 29.57;
    }
    if (unit == "pints") {
        return amount * 16 * 29.57;
    }

    return amount;
}

function scaleUnits(amount, factor) {
    // get number of sig figs
    var absamount = Math.abs(amount);
    var sig = ("" + absamount).replace(/0*$/, "").replace(/^1/, "");
    var sigdig = Math.max(1, sig.length);

    if (sigdig == 1) {
        absamount = absamount * factor;
        var absstr = "" + absamount;
        if (absstr >= "14" && absstr <= "16") {
            sigdig += 1;
        }
    }
    return +((amount * factor).toPrecision(sigdig));
}
