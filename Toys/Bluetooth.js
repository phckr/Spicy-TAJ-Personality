const BLUETOOTH_TOYS = [];

let currentBluetoothToy;

loadBluetoothToys();

const BLUETOOTH_TOY_TYPE = {
    COCK_RING: 0,
    BUTT_PLUG: 1,
    WAND: 2,
    FUCKING_MACHINE: 3,
    STROKER: 4,
};


function loadBluetoothToys() {
    //No var or no bluetooth toys anyway
    if (!isVar('bluetoothToys') || !hasBluetoothToys()) {
        setVar('bluetoothToys', new java.util.ArrayList());
    } else {
        let saveToys = false;

        let arrayList = tryGetArrayList('bluetoothToys');

        for (let x = 0; x < arrayList.size(); x++) {
            let entry = arrayList.get(x);
            let bluetoothToy = createBluetoothToy().fromString(entry);
            BLUETOOTH_TOYS.push(bluetoothToy);
        }

        setVar(VARIABLE.HAS_BLUETOOTH_TOYS, BLUETOOTH_TOYS.length > 0);

        if (saveToys) {
            saveBluetoothToys();
        }
    }
}

function saveBluetoothToys() {
    let arrayList = new java.util.ArrayList();

    for (let y = 0; y < BLUETOOTH_TOYS.length; y++) {
        arrayList.add(BLUETOOTH_TOYS[y].toString());
    }

    setVar('bluetoothToys', arrayList);
}

function getBluetoothToyByName(name) {
    for (let y = 0; y < BLUETOOTH_TOYS.length; y++) {
        if (name.toUpperCase() === BLUETOOTH_TOYS[y].name.toUpperCase()) {
            return BLUETOOTH_TOYS[y];
        }
    }

    return null;
}

function getBluetoothToyWithBool(attribute) {
    for (let y = 0; y < BLUETOOTH_TOYS.length; y++) {
        if (BLUETOOTH_TOYS[y][attribute]) {
            return BLUETOOTH_TOYS[y];
        }
    }

    return null;
}

function setupNewBluetoothToy() {
    sendDebugMessage("isBrowserConnected() = " + JSON.stringify(isBrowserConnected()));
    if (!isBrowserConnected()) {
        sendVirtualAssistantMessage('You can\'t setup Bluetooth toys unless you are connected via a browser.');
        return;
    }

    setCurrentSender(SENDER_ASSISTANT);

    sendVirtualAssistantMessage('Please enter a name for your new bluetooth enabled toy', 0);

    let answer = createInput();
    let name = 'undefined';

    while (true) {
        if (getBluetoothToyByName(answer.getAnswer()) !== null) {
            sendVirtualAssistantMessage('A bluetooth toy with a similar name already exists. Please choose a different name.', 0);
            answer.loop();
        } else {
            name = answer.getAnswer();
            break;
        }
    }

    if (tryTakePhoto("Hold it in front of the camera and tell me when you are ready (or just paste an image in).", getBluetoothToyImagePath(name))) {
      sendVirtualAssistantMessage('This is what I saw', false, true);
    } else {
      sendVirtualAssistantMessage('Please make sure to add a picture of your cage named like your bluetooth toy to your Toys/Bluetooth Toys folder.', false);
      sleep(2);
      sendVirtualAssistantMessage('So in this case make sure to add a picture called "' + name + '.jpg" to the bluetooth toys folder', false);
      sleep(2);
      sendVirtualAssistantMessage('If it already exists a picture of it should show up now', false, true);
    }
    showImage(getBluetoothToyImagePath(name), 5);

    var deviceData;

    for (var loop = 0; loop < 2; loop++) {
        if (loop > 0) {
            sendVirtualAssistantMessage("I don't see your toy. Please try again.");
        }
        sendVirtualAssistantMessage("Turn on your toy, and tell me when that is done. Then you can pair it in the popup.");

        var done = {};

        bluetoothStartScanning(function (info) {
            sendDebugMessage("Scan response: " + JSON.stringify(info));
            done.done = 1;
            deviceData = info;
        });

        sendDebugMessage("About to wait for done");
        waitForDone();
        sendDebugMessage("DOne waitForDone");

        while (!done.done) {
            wait(0.2);
        }

        if (deviceData && deviceData.allowedMessages && deviceData.device) {
            console.log("deviceData = " + JSON.stringify(deviceData));
            break;
        }
        deviceData = null;
    }

    if (!deviceData) {
        sendVirtualAssistantMessage("I can't see this toy. Sorry.");
        return;
    }

    sendVirtualAssistantMessage('What sort of toy is ' + name + '(' + deviceData.device + ')? Cock ring, Butt plug, Stroker, Wand, or Fucking Machine');
    let options = ["Cock ring", "Butt plug", "Stroker", "Wand", "Fucking machine"];

    answer = createAnswerInput(options);

    var toyType;

    while (true) {
        if (answer.isLike("cock")) {
            toyType = BLUETOOTH_TOY_TYPE.COCK_RING;
            break;
        }
        if (answer.isLike("butt")) {
            toyType = BLUETOOTH_TOY_TYPE.BUTT_PLUG;
            break;
        }
        if (answer.isLike("strok")) {
            toyType = BLUETOOTH_TOY_TYPE.STROKER;
            break;
        }
        if (answer.isLike("wand")) {
            toyType = BLUETOOTH_TOY_TYPE.WAND;
            break;
        }
        if (answer.isLike("fuck")) {
            toyType = BLUETOOTH_TOY_TYPE.FUCKING_MACHINE;
            break;
        }

        sendVirtualAssistantMessage("I'm sorry, I don't understand. Please try again.");
        answer.loop();
    }

    answer.clearOptions();

    sendDebugMessage("GOt toy type: " + toyType);

    BLUETOOTH_TOYS.push(createBluetoothToy(name, toyType, deviceData.device, 
        deviceData.allowedMessages["vibrate"],
        deviceData.allowedMessages["rotate"],
        deviceData.allowedMessages["linear"],
        deviceData.allowedMessages["batteryLevel"]
        ));

    setVar(VARIABLE.HAS_BLUETOOTH_TOYS, true);
    saveBluetoothToys();

    sendVirtualAssistantMessage('Added your new bluetooth toy to %DomHonorific% %DomName%\'s collection');
    sendVirtualAssistantMessage('Enjoy %Grin%');
}


function createBluetoothToy(name, toyType, deviceName, vibrate, rotate, linear, batteryLevel) {
    return {
        name: name,
        toyType: toyType,
        deviceName: deviceName,
        vibrate: !!vibrate,
        rotate: !!rotate,
        linear: !!linear,
        batteryLevel: !!batteryLevel,

        getImagePath: function () {
            return 'Images/Spicy/Toys/Bluetooth Toys/' + this.name + '.*';
        },

        fetchBluetoothToy: function () {
            return fetchToy(this.name, this.getImagePath());
        },

        toString: function () {
            return serializeObject(this);
        },

        fromString: function (string) {
            return deserializeObject(this, string);
        },

        setToyOn: function (bool) {
            sendDebugMessage('Setting bluetooth toy ' + this.name + ' on to ' + bool);
            if (bool) {
                setVar(VARIABLE.BLUETOOTH_ON, true);

                setVar(VARIABLE.ACTIVE_BLUETOOTH_TOY, this.name);

                currentBluetoothToy = this;
            } else {
                setVar(VARIABLE.BLUETOOTH_ON, false);

                //setVar(VARIABLE.ACTIVE_BLUETOOTH_TOY, this.name);

                currentBluetoothToy = null;
            }
        },
    }
}

function fetchBluetoothToy(toy) {
    return fetchToy(toy, getBluetoothToyImagePath(toy));
}

function getBluetoothToyImagePath(name) {
    return 'Images/Spicy/Toys/Bluetooth Toys/' + name + '.*';
}

function openBluetoothToyList() {
    openToyList(BLUETOOTH_TOYS, function (name) { showBluetoothToyGUI(getBluetoothToyByName(name)) }, "Bluetooth Toys");
}

function showBluetoothToyGUI(bluetoothToy) {
    displayAutoToyDialog(bluetoothToy, saveBluetoothToys);
}

function hasBluetoothToys() {
    return getVar(VARIABLE.HAS_BLUETOOTH_TOYS);
}

