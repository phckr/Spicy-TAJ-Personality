addResponseRegex("injectcodedebug");

var injectCodeMessage;

function injectCodeResponse(message) {
    //Used to inject code during run time because when running a file it is read from disk again
    injectCodeMessage = null;
    var space = message.indexOf(' ');
    if (space > 10) {
        injectCodeMessage = message.substring(space);
    }
    sendDebugMessage('Injecting code...');
    run('Utils/InjectCode.js');
    return true;
}