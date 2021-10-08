{
    setCurrentSender(SENDER_TAJ);
    setDate(VARIABLE.CURRENT_SESSION_DATE);
    setTempVar(VARIABLE.CURRENT_SESSION_ACTIVE, true);
    setVar(VARIABLE.CURRENT_SESSION_NUMBER, getVar(VARIABLE.CURRENT_SESSION_NUMBER, 0) + 1);

    sendDebugMessage('Starting session with mood: ' + getMood());

    //Toys
    updateSessionButtplugs();
    updateSessionDildos();

    //TODO: Special day test (birthday etc.)

    if (!sendGreeting()) {

    }


    //Force unlock
    if (isInChastity() && getVar(VARIABLE.LOCKED_DAYS_IN_ROW, 0) > getVar(VARIABLE.LOCKED_UP_LIMIT, 3)) {
        sendDebugMessage('Forced to unlock because locked in a row is higher than locked up limit');
        unlockChastityStart();
    } else if (isVar(VARIABLE.LOCKED_UP_UNTIL) && !getDate(VARIABLE.LOCKED_UP_UNTIL).hasPassed()) {
        sendMessage(random("As you well know", "As you know", "As you should know", "Oh well", "Oh my", "Poor you"));
        lockImages();
        showPicture("Images/Spicy/Chastity/ChastityOffDenied/*.*", 5);
        sendMessage(random("You're under strict lock down", "You're strictly locked", "You're not gonna be released"));
        //, "You are still being punished", "You're serving a punishment" TODO: Punishment flag
        sendMessage(random("Meaning there will be no release from that %ChastityCage%...", "Meaning you won't be released for this session", "So there won't be any release today"));
        unlockImages();
    } else if (hasChastityCage()) {
        sendDebugMessage('Lock days in a row is ' + getVar(VARIABLE.LOCKED_DAYS_IN_ROW, 0) + ' and limit is ' + getVar(VARIABLE.LOCKED_UP_LIMIT, 3));

        //Force unlock
        if (getVar(VARIABLE.LOCKED_DAYS_IN_ROW, 0) > getVar(VARIABLE.LOCKED_UP_LIMIT, 3) && isInChastity()) {
            sendDebugMessage('Forced to unlock because locked in a row is higher than locked up limit');
            unlockChastityStart();
        } else {
            //Unlock
            if (!willKeepChastityOn()) {
                if (isInChastity()) {
                    sendDebugMessage('Decided to unlock chastity today');

                    if (isChance(35)) {
                        sendDebugMessage('But not now (later)');
                        setTempVar(VARIABLE.CHASTITY_REMOVE_LATER, true);

                        run('Session/Start/Chastity/OffDenied/*.js');
                    } else {
                        unlockChastityStart();
                    }
                }
            }
            //Denied
            else {
                if (isInChastity()) {
                    sendDebugMessage('Decided to NOT unlock chastity');
                    if (feelsEvil()) {
                        sendDebugMessage('Faking unlock chastity');
                        unlockChastityCage(true);
                        sendMessage('I was just playing with you %Wicked%');
                        sendMessage(random('No way for me to unlock that %Cock% right now', 'I will not unlock that %Cock% right now', 'The cage stays on'));
                        sendMessage(random('And you\'ll have to deal with that', 'You were so close and yet so far %Lol%', 'So close and yet so far %Lol%',
                            'You weren\'t going to be unlocked in any world right now', 'And there was no way to change that'));

                        sendMessage('Tell me when you are ready to continue');
                        waitForDone();
                    } else {
                        run('Session/Start/Chastity/OffDenied/*.js');
                    }
                } else {
                    sendDebugMessage('Decided to lock chastity at start');
                    //TODO: Intro files
                    lockChastityCage();
                }
            }
        }
    }


    run("Session/Start/DecideStart.js");

    if (isInChastity() && !getVar(VARIABLE.CHASTITY_REMOVE_LATER, false)) {
        sendDebugMessage('Stayed in chastity so incrementing locked in a row');
        incrementVar(VARIABLE.LOCKED_DAYS_IN_ROW, 1, 0);
    } else if (getVar(VARIABLE.LOCKED_DAYS_IN_ROW, 0) > 0) {
        sendDebugMessage('Resetting locked days in a row');
        setVar(VARIABLE.LOCKED_DAYS_IN_ROW, 0);
    }

    run("Session/Modules/DecideModule.js");
}

function unlockChastityStart() {
    if (getVar(VARIABLE.HAS_CHASTITY) && getVar(VARIABLE.CHASTITY_ON)) {
        unlockChastityCage();
    }
}

