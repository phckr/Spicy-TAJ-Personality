{
  const GLASSES = 5;

  // This will get run before the session starts and between each module and at the end
  var startTime = getVar("waterStartTime", 0);
  var action = false;
  if (!startTime) {
    startTime = Date.now();
    setTempVar("waterStartTime", startTime);
    setTempVar("waterVolume", 0);
  }
  
  var prolongedSessionTime = getVar(VARIABLE.PROLONGED_SESSION_TIME, 0);
  var possibleSessionEnd = getVar("themePossibleSessionEnd", 0);

  if (!possibleSessionEnd && (RAPID_TESTING || Date.now() - getVar("waterLastAction", 0) > 1000 * 60 * 10)) {
    var visitNumber = getVar("waterVisitNumber", 0);
    setTempVar("waterVisitNumber", visitNumber + 1);

    if (visitNumber == 0) {
      sendMessage("I want to try something a little different during our session today.");
      sendMessage("Go and fetch %Number:" + GLASSES + "% %Units:500,ml% water glasses and fill them with water. Also fetch a large measuring jug.");
      sendMessage("Tell me when you are back.");
      waitForBack(1000);
      sendMessage("%Good%");
      action = true;
    }

    if (visitNumber < GLASSES) {
      if (visitNumber > 0) {
	sendMessage("I want you to drink one of those glasses of water that you fetched earlier.");
      } else {
	sendMessage("I want you to drink one of those glasses of water that you just fetched.");
      }
      sendMessage("Tell me when you are done.");
      var drinkStart = Date.now();
      waitForDone(1000);
      var drinkTime = Date.now() - drinkStart;
      if (drinkTime > 200 * 1000) {
         sendMessage("I'm getting tired of waiting for you to drink this water. Do it faster next time.");
      } else {
         sendMessage("%Good%");
      }
      action = true;
      if (getVar(VARIABLE.DEVOTION) + getVar(VARIABLE.PROLONGED_SESSION_TIME, 0) < 130) {
        sendMessage("I'm not sure that this session is going to be long enough to finish everything.");
        if (sendYesOrNoQuestion("Do you want to extend it? You know what the right answer is.")) {
	  // Add 40 minutes
	  setTempVar(VARIABLE.PROLONGED_SESSION_TIME, 40 + getVar(VARIABLE.PROLONGED_SESSION_TIME, 0));
          sendMessage("I just extended the session for a short time.");
        } else {
          sendMessage("I'm not happy about that, and it will actually make things more difficult for you.");
        }
      }
    }
    if (visitNumber + 1 == GLASSES) {
      setTempVar("waterAllGlassesTime", Date.now());
    }
  }
  var earlyPee = false;
  if (visitNumber >= GLASSES && (RAPID_TESTING || Date.now() - getVar("waterAllGlassesTime", 0) > 1000 * 60 * 20)) {
    if (sendYesOrNoQuestion("Do you think that you can pee now?")) {
      sendMessage("%Good%");
      earlyPee = true;
      if (!PEE_LIMIT.isAllowed()) {
        if (sendYesOrNoQuestion("Do you want to pee while I watch?")) {
          if (getVar("waterAskedLimitChange", 0) == 0) {
	    PEE_LIMIT.askForLimitChange(LIMIT_ADDRESS.DOMME);
	    setTempVar("waterAskedLimitChange", 1);
	  }
        }
      }
    } else {
      sendMessage("We will wait a bit longer.");
    }
  }

  if (PEE_LIMIT.isAllowed()) {
    if (possibleSessionEnd || earlyPee) {
      action = true;
      // Now for the next step
      if (getVar("waterVolume", 0)) {
	// Second chance to pee
	sendMessage("Maybe you can pee some more now and increase your pee volume.");
      } else {
	sendMessage("Let's see how much you can pee.");
      }
      var position = getSubPosition();
      if (position) {
        sendMessage("Get your measuring jug.");
      }
      var noAction1 = 0;
      var noAction2 = 0;
      while (position) {
        if (!position.present) {
          if (!noAction1) {
	    sendWebControlJson(JSON.stringify({speak: "Come back here. I want to %Watch% you peeing."}));
          }
          noAction1 = (noAction1 + 1) % 5;
          wait(1);
        } else if (!position.far) {
          if (!noAction2) {
            sendMessage("Move back so I can %Watch% you peeing. %PetName%");
          }
          noAction2 = (noAction2 + 1) % 5;
          wait(1);
        } else {
          break;
        }
        position = getSubPosition();
      }
      sendMessage("I command you to fill that measuring jug with as much pee as possible.");
      sendMessage("The more the better as I have some ideas on how to use it.");
      sendMessage("Tell me when you have finished peeing into that jug.");
      wait(10);
      takeSubPhotoAndSaveIntoFolder("Images/Spicy/SelfHumiliation", "pee_");
      waitForDone(300);
      sendMessage("%Good%");
      let volume = createIntegerInput("Tell me how many ml of pee you managed to produce.", 0, 3000, "That isn't a valid answer", "That doesn't seem likely -- please read the jug again.");
      volume += getVar("waterVolume");
      let history = createHistory("waterPeeVolume");
      let values = tryGetArrayList("waterPeeVolume");
      if (getVar("waterVolume")) {
        values.remove("" + getVar("waterVolume"));
      }
      if (!values.size()) {
	 if (volume < 300) {
	   sendMessage("That isn't very much. You will have to try much harder next time.");
	 } else if (volume < 600) {
	   sendMessage("That isn't very impressive. You will have to try harder next time.");
	 } else if (volume < 900) {
	   sendMessage("That is acceptable for a first attempt. But not enough for what I want.");
	 } else {
	   sendMessage("That is pretty good for a first attempt. But not enough for what I want.");
	 }
      } else {
	 // See where this falls.
	 var biggerThan = 0;
	 var totalVolume = 0;
	 for (var i = 0; i < values.size(); i++) {
	   if (volume > values[i]) {
	     biggerThan += 1;
	   }
	   totalVolume += values[i];
	 }
	 if (volume < totalVolume / values.size()) {
	   sendMessage("I'm disappointed in you. That wasn't even average. You must try harder next time.");
	 } else {
	   var perc = values.size() * 0.75;
	   if (biggerThan >= values.size() && biggerThan > 2) {
	     sendMessage("Congratulations, you peed an all time record for you.");
	   } else if (biggerThan > perc && biggerThan > 2) {
	     sendMessage("A very worthy effort, but not quite a record for you. We'll try again later.");
	   } else {
	     sendMessage("Good try, but not enough for what I want. I'm disappointed in you.");
	   }
	 }

         if (volume > 700) {
	   sendMessage("Now put your right hand in your pee.");
	   sendMessage("Feel the warmth.");
	   sendMessage("Swirl it around a bit.");
	   sendMessage("Now do the same with your left hand.");
	   sendMessage("Do you feel the warm wetness covering your hands?");
	   sendMessage("Do you want to stroke %MyYour% %Cock%?");
	   sendMessage("I bet you do.");
	   sendMessage("I expect you are waiting for the beat.");
           sendMessage("But not today. %PetName%");
	 } else {
           var finishQ = function() {};
	   if (getVar("waterTasteKnown", 0) || sendYesOrNoQuestion("Do you know what your pee tastes like?")) {
             if (!getVar("waterTasteKnown")) {
	       sendMessage("%Good%");
	     }
             sendMessage("I wonder if this batch of pee tastes the same as before.");
	     finishQ = function() { 
		if (sendYesOrNoQuestion("Was that nicer than last time?")) {
		  sendMessage("%Good%");
		} else {
		  sendMessage("There is always a next time.");
                }
             }
           } else {
	     finishQ = function () {
	       sendMessage("I'm happy that I have introduced you to the joys of pee play.");
	     }
             sendMessage("Now is your chance to find out.");
             if (sendYesOrNoQuestion("Does the thought of tasting your own pee excite you?")) {
               sendMessage("%Good%");
             } else {
               sendMessage("I'm sorry to hear that. Well, you get the opportunity anyway.");
               sendMessage("Don't disappoint me.");
             }
           }
	   sendMessage("Dip the index finger of your right hand into the jug and swirl it around.");
	   sendMessage("Now rub that finger along your lips.");
	   sendMessage("Now lick your finger clean and tell me when you are done.");
           waitForDone(60);
           finishQ();
         }
      }
      values.add("" + volume);
      setVar("waterPeeVolume", values);
      setTempVar("waterVolume", volume);
      if (!prolongedSessionTime || !possibleSessionEnd) {
	sendMessage("Keep that measuring jug handy, you might be able to fill it some more.");
      }
    }

    if (prolongedSessionTime && prolongedSessionTime < 25) {
      // Give us a longer session
      setTempVar(VARIABLE.PROLONGED_SESSION_TIME, prolongedSessionTime + randomInteger(20, 30));
    }
  } else {
    sendDebugMessage("User doesn't want pee play");
  }

  if (action) {
    setTempVar("waterActionTime", Date.now());
  }
}
