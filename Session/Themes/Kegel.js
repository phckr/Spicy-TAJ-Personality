
// This gets called at session start and on every break.

function kegelRun(phase) {
    if (phase == THEME_PHASE.START) {
        sendMessage(random("Today you will be doing some muscle training.", "You will be learning to control your pelvic floor muscles."));
        sendMessage(random("When you hear a 'tick' you will clench your pelvic floor muscles."));
        sendMessage("These are the ones that you use to stop peeing in midstream.");
        sendMessage(random("When you hear my bell, you can relax.", "I will ring my bell when you can relax."));
    }

    var start = Date.now();
    while (Date.now() - start < 60 * 1000) {
        sleep(3);
        playAudio("Audio/Spicy/SpecialSounds/MetronomeTick.mp3");

        if (chance(20)) {
            sleep(randomInteger(7, 15));
        } else {
            sleep(randomInteger(2, 4));
        }

        playAudio("Audio/Spicy/SpecialSounds/Bell.mp3");
    }
    sleep(1);
    sendMessage("%Good%");
}

function kegelGetFrequency() {
    // Maybe should check that we have the mp3 file
    return { roughly: 3 };
}