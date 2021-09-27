if (typeof sendWebControlJSON == "undefined") {
    sendWebControlJSON = function (s) { sendDebugMessage("sendWebControlJson called: " + s); };
}

if (typeof allocateTempUrl == "undefined") {
    allocateTempUrl = function (s) { sendDebugMessage("allocateTempUrl called: " + s); };
}