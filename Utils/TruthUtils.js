const TRUTHS = [];

const TRUTH_NAUGHTY_WORDS = [
    "fuck", "suck", "lick", "wank", "masturb", "cum", "spank", "fondle", "punish",
    "pee", "jizz",
    "puss[iy]", "cunt", "clit", "cock", "dick", "penis", "ball", "oral", "anal", "ass\\b", "breast", 
    "boob", "nipple", "tit(s)?\\b", "mouth", "anus", "knees", "tongue", "face",
    "gag", "panty", "chastity", "lingerie", "panti", "stockings", "bra\\b", "corset", "boots",
    "bdsm", "bondage", "domina", "submiss", "blowjob", "bj\\b", 
    "sex", "erotic", "orgasm", "lesbian", "fetish", "strapon", "vibrat", "dildo", "collar", "cosplay", "voyeur", "porn", "underwear",
    "fantas", "sound", "excit", "strip", "tie[ d]", "edg[ie]", "facial", 
    "slut", "whore", 
];

const TRUTH_NAUGHTY_REGEX = new RegExp("\\b(" + TRUTH_NAUGHTY_WORDS.join('|') + ")", "g");

/**
 * Get an object with properties where the property names are words
 * and the values are the counts across all answers.
 * @returns Object with one property per distinct word.
 */
function truthGetWordFrequencies() {
    var result = {};
    for (var i = 0; i < TRUTHS.length; i++) {
        TRUTHS[i].addWordCounts(result);
    }
    return result;
}

/**
 * Gets a sorted list of words by frequency. The most used words come
 * first in the resulting list. If `restrict` is passed, then the resulting
 * list of words will only include words from that list.
 * @param {Iterable} restrict List of words to include in output list.
 * @returns List of words
 */
function truthGetSortedWordUse(restrict) {
    var all = truthGetWordFrequencies();
    var result = Object.keys(all);
    if (restrict) {
        let restrictedSet = new Set(restrict);
        var temp = result;
        result = [];
        for (var i = 0; i < temp.length; i++) {
            if (restrictedSet.has(temp[i])) {
                result.push(temp[i]);
            }
        }
    }

    result.sort(function (a, b) { return all[b] - all[a]; });

    return result;
}

function truthValidateAnswer(answer) {
    answer = answer.trim().replace(/\s+/g, " ");
    if (answer.length < 30) {
        sendMessage("I want a longer answer than that. Provide some more detail.");
        sendWebControlJson(JSON.stringify({prefill: answer}));
        return false;
    }

    if (truthCountNaughty(answer)) {
        return true;
    }

    sendMessage("You are being a bit coy. Be more explicit in your answers. Try again.");
    sendWebControlJson(JSON.stringify({prefill: answer}));
    return false;
}

function truthAskQuestionAndSave(partnerMention) {
    var question;
    var partnerQuestion;

    for (var i = 0; i < 30; i++) {
        question = replaceVocab("%Truth%", 99);
        if (partnerMention) {
            if (question.contains("%YourPartner%")) {
                partnerQuestion = question;
            } else {
                continue;
            }
        }
        let truth = getTruthByQuestion(question);
        if (!truth || truth.isOld()) {
            break;
        }
    }

    if (partnerQuestion) {
        question = partnerQuestion;
    }

    var answer = sendQuestion(question, truthValidateAnswer);

    let truth = createTruth(question, answer);

    TRUTHS.push(truth);

    saveTruths();
}

function getTruthByQuestion(question) {
    question = truthCleanQuestion(question);
    var matches = [];
    for (let y = 0; y < TRUTHS.length; y++) {
        if (question === TRUTHS[y].key) {
            matches.push(TRUTHS[y]);
        }
    }

    // Pick the most recent
    matches.sort(function (a, b) { return b.answered - a.answered; });
    if (matches.length > 0) {
        return matches[0];
    }

    return null;
}

function truthCleanQuestion(q) {
    if (!q) {
        return q;
    }
    return q.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function truthCountNaughty(answer) {
    if (!answer) {
        return 0;
    }
    var words = answer.match(TRUTH_NAUGHTY_REGEX);
    return words ? words.length : 0;
}

function createTruth(question, answer, partnerMentioned, naughtyWords) {
    return {
        question: question,
        key: truthCleanQuestion(question),
        answer: answer,
        partnerMentioned: partnerMentioned || (question && question.contains("%YourPartner%")),
        naughtyWords: naughtyWords || truthCountNaughty(answer),
        answered: Date.now(),

        addWordCounts: function(counts) {
            var words = this.answer.toLowerCase().match(/\b(\w|')+\b/g);
            for (var i = 0; i < words.length; i++) {
                counts[words[i]] = (counts[words[i]] || 0) + 1;
            }
        },

        toString: function () {
            return JSON.stringify(this);
        },

        fromString: function (string) {
            var newObject = JSON.parse(string);
            for (var prop in newObject) {
                this[prop] = newObject[prop];
            }
            this.key = truthCleanQuestion(this.question);
            this.naughtyWords = truthCountNaughty(this.question);
            return this;
        },

        isOld: function() {
            return this.answered < Date.now() - 1000 * 60 * 60 * 24 * 90;
        }
    };
}

function saveTruths() {
    let arrayList = new java.util.ArrayList();

    for (let y = 0; y < TRUTHS.length; y++) {
        arrayList.add(TRUTHS[y].toString());
    }

    setVar('truths', arrayList);
}

function loadTruths() {
    if (!isVar('truths')) {
        setVar('truths', new java.util.ArrayList());
    } else {
        let arrayList = tryGetArrayList('truths');

        for (let x = 0; x < arrayList.size(); x++) {
            let entry = arrayList.get(x);

            let truth = createTruth().fromString(entry);

            TRUTHS.push(truth);
        }
    }
}

function truthGetRandomPartnerMention() {
    var matches = [];
    for (let y = 0; y < TRUTHS.length; y++) {
        if (TRUTHS[y].partnerMentioned) {
            matches.push(TRUTHS[y]);
        }
    }
   
    return random(matches);
}

function truthAskQuestions(partnerMention) {
    if (getVar("truthSessionIndex", 0) == 0) {
        sendMessage(random("I %Want% to get to know you a bit better %SubName%", "I %Want% to know more about you."));
        if (TRUTHS.length > 0) {
            sendMessage("You know how this goes from before");
            sendMessage("Just a quick reminder");
        } else {
            sendMessage(random("That way I'll be able to have more fun with pushing your limits.", "It will be useful in planning our sessions."));
        }
        sendMessage(random("I'm going to ask you some questions, and I %Want% long, honest, explicit answers %SubName%", 
                           "I %Want% full, detailed, honest and explicit answers to my questions."));
        sendMessage(random("Even if it is a yes/no question, you should explain yourself fully.", 
                           "If it is a yes / no question then please go into detail about why you feel that way %SubName%"));
    }
    
    for (var n = randomInteger(1, 3); n > 0; n--) {
        truthAskQuestionAndSave(partnerMention);
        sendMessage("%Good%");
    }
    
    setTempVar("truthSessionIndex", getVar("truthSessionIndex", 0) + 1);
}
