addResponseRegex("^taj-posenet-data");
setResponseIgnoreDisabled(true);

let posenet_result = null;
let posenet_image_requests = {};
let posenet_video_requests = {};
let posenetMotionDetected = null;
let posenet_last_message = null;
let posenetOnClick = {};

function posenetResponse(message) {
    var result = JSON.parse(message.substring(17));
    result.when = Date.now();
    posenet_last_message = result;
    if (result.command) {
        sendDebugMessage("Command: " + JSON.stringify(result));
        if (result.command == "vocab") {
            sendWebControlJson(JSON.stringify({ response: result.command, arg: result.arg, result: replaceVocab(result.arg) }));
        }
        return;
    }

    if (result.position) {
        sendDebugMessage("Posenet: " + JSON.stringify(result.position));
        const previous = posenet_result;
        posenet_result = result;
        sendDebugMessage("Posenet latency = " + (result.when - result.captured) + "ms");
        setTimeout(function () { if (posenetMotionDetected) { posenetMotionDetected(result.position.motion); } }, 0);
        setTimeout(function () {
            sendDebugMessage("Posenet callback latency = " + (Date.now() - result.when) + "ms");
            positionMonitor.update(result);
        }, 0);
        if (!previous || JSON.stringify(result.position) != JSON.stringify(previous.position)) {
            // positionChange.change(result.position, result);
        }
        sendDebugMessage("Posenet handling latency = " + (Date.now() - result.when) + "ms");
    }

    if (result.images) {
        var imgs = result.images;
        for (var i = 0; i < imgs.length; i++) {
            sendDebugMessage("Handling photo " + imgs[i].name);
            if (posenet_image_requests[imgs[i].name]) {
                posenet_image_requests[imgs[i].name](imgs[i].value);
                delete posenet_image_requests[imgs[i].name];
            }
        }
    }

    if (result.videos) {
        var vids = result.videos;
        for (var i = 0; i < vids.length; i++) {
            sendDebugMessage("Handling video " + vids[i].name);
            if (posenet_video_requests[vids[i].name]) {
                posenet_video_requests[vids[i].name](vids[i].value);
            }
        }
    }

    if (result.click) {
        var handler = posenetOnClick[result.dialog];
        if (handler) {
            handler(result.click, result.args);
        } else {
            sendDebugMessage("Unable to find handler for " + result.dialog);
        }
    }
}

function setPhotoMotionDetect(detected) {
    posenetMotionDetected = detected;
    if (!detected) {
        sendWebControlJson(JSON.stringify({ motion: false }));
        return;
    }
    sendWebControlJson(JSON.stringify({ motion: true }));
}

function getSubRandomFilename(prefix) {
    return (prefix ? prefix : "") + (Math.random().toString(36) + Math.random().toString(36)).replace(/\./g, "");
}

function takeSubPhotoAndSaveInFolder(folder, prefix) {
    takeSubPhoto(function (data) {
        writeSubPhotoToFile(data, folder + "/" + getSubRandomFilename(prefix));
    });
}

function takeSubVideoAndSaveInFolder(folder, prefix, duration) {
    var path = folder + "/" + getSubRandomFilename(prefix);
    takeSubVideo(function (data) {
        writeSubVideoToFile(data, path);
    }, duration);
}

// Note that duration can be a function that returns truthy to continue
// and falsy to stop
function tryTakeVideo(prompt, pathname, duration) {
    sendWebControlJson(JSON.stringify({ largeCamera: true }));
    if (sendYesOrNoQuestion(prompt)) {
        var flag = { complete: false };
        takeSubVideo(function (data) {
            if (data) {
                writeSubVideoToFile(data, pathname);
            } else {
                flag.complete = true;
            }
        }, duration);
        if (typeof duration == "function") {
            while (duration() && !flag.complete) {
                wait(0.2);
            }
            sendWebControlJson(JSON.stringify({ video: null }));
        } else {
            var start = Date.now() + duration;
            while (start + 60 * 1000 > Date.now() && !flag.complete) {
                wait(0.2);
            }
        }
        sendWebControlJson(JSON.stringify({ largeCamera: false }));
        return flag.complete;
    } else {
        sendWebControlJson(JSON.stringify({ largeCamera: false }));
        return false;
    }
}

function addRandomSuffix(pathname) {
    var name = Math.random().toString(36);
    return pathname + name;
}

function tryTakePhoto(prompt, pathname, options) {
    var flag = { complete: false };
    var command = { largeCamera: true };
    if (options) {
        comand.maskPercent = options.maskPercent;
    }
    sendWebControlJson(JSON.stringify(command));

    handlePasteSubPhoto(function (data) {
        writeSubPhotoToFile(data, pathname);
        flag.complete = true;
    });

    var res;
    if (typeof prompt == "string") {
        res = sendYesOrNoQuestion(prompt, null, function () { return flag.complete; });
    } else {
        // we wait for the function to return true

        while (!flag.complete) {
            if (prompt()) {
                res = 1;
                break;
            }
            wait(0.2);
        }
    }
    if (res) {
        playSound("Audio/Spicy/SpecialSounds/CameraShutter.mp3");
        takeSubPhoto(function (data) {
            writeSubPhotoToFile(data, pathname);
            flag.complete = true;
        });
        var start = Date.now();
        while (start + 60 * 1000 > Date.now() && !flag.complete) {
            wait(0.2);
        }
        sendWebControlJson(JSON.stringify({ largeCamera: false }));
        return flag.complete;
    } else {
        sendWebControlJson(JSON.stringify({ largeCamera: false }));
        return flag.complete;
    }
}

function writeSubVideoToFile(data, filePath) {
    if (data) {
        let binaryData = java.util.Base64.getMimeDecoder().decode(data.split('base64,')[1]);
        let imageType = data.substring(11, 100);
        imageType = imageType.split(";")[0];
        if (filePath.endsWith(".*")) {
            filePath = filePath.slice(0, -2);
        }
        filePath = filePath + "." + imageType;
        sendDebugMessage("About to write video chunk to " + filePath);
        let stream = new java.io.FileOutputStream(filePath, true);
        stream.write(binaryData);
        stream.close();
    }

    return filePath;
}

function writeSubPhotoToFile(data, filePath) {
    let binaryData = java.util.Base64.getMimeDecoder().decode(data.split('base64,')[1]);
    let imageType = data.substring(11, 100);
    imageType = imageType.split(";")[0];
    if (imageType == "jpeg") {
        imageType = "jpg";
    }
    if (filePath.endsWith(".*")) {
        filePath = filePath.slice(0, -2);
    }
    filePath = filePath + "." + imageType;
    sendDebugMessage("About to write photo to " + filePath);
    let stream = new java.io.FileOutputStream(filePath);
    stream.write(binaryData);
    stream.close();

    return filePath;
}

function takeSubPhoto(done) {
    var name = Math.random().toString(36);
    posenet_image_requests[name] = done;
    sendWebControlJson(JSON.stringify({ photo: name }));
}

function handlePasteSubPhoto(done) {
    var name = Math.random().toString(36);
    posenet_image_requests[name] = done;
    sendWebControlJson(JSON.stringify({ photopaste: name }));
}

function takeSubVideo(done, duration) {
    var name = Math.random().toString(36);
    posenet_video_requests[name] = done;
    var command = { video: name };
    if (typeof duration == "function") {
        command.duration = duration;
    }
    sendWebControlJson(JSON.stringify(command));
}

function canUseCamera() {
    return getRecentPosenetResult() != null;
}

function getRecentPosenetResult() {
    if (posenet_result && Date.now() - posenet_result.when < 15000) {
        return posenet_result;
    }
    return null;
}

function isBrowserConnected() {
    if (posenet_last_message && Date.now() - posenet_last_message.when < 15000) {
        return true;
    }
    return false;
}

function getSubPosition() {
    const result = getRecentPosenetResult();
    if (result) {
        return result.position;
    }
    return null;
}

function getSubPresent() {
    const pos = getSubPosition();
    return pos && pos.present;
}

function getPosenetResult() {
    return posenet_result;
}

function PositionChange() {
    this.handlers = [];
}

PositionChange.prototype = {
    subscribe: function (fn) {
        this.unsubscribe(fn);
        this.handlers.push(fn);
    },

    unsubscribe: function (fn) {
        this.handlers = this.handlers.filter(
            function (item) {
                if (item !== fn) {
                    return item;
                }
            }
        );
    },

    change: function (pos, res, thisObj) {
        sendDebugMessage("Notifying " + JSON.stringify(pos) + " to observers");
        var scope = thisObj || null;
        this.handlers.forEach(function (item) {
            item.call(scope, pos, res);
        });
    }
}

var positionChange = new PositionChange();


function PositionMonitor() {
    this.handlers = [];
}

PositionMonitor.prototype = {
    subscribe: function (fn, thisObj) {
        if (thisObj == null) {
            thisObj = {};
        }
        this.unsubscribe(fn);
        this.handlers.push({ "f": fn, "thisObj": thisObj });
        var recent = getRecentPosenetResult();
        if (recent) {
            fn.call(thisObj, recent);
        }
    },

    unsubscribe: function (fn) {
        this.handlers = this.handlers.filter(
            function (item) {
                if (item.f !== fn) {
                    return item;
                }
            }
        );
    },

    update: function (res) {
        this.serial++;
        if (this.notifying) {
            sendDebugMessage("Skipping notification as one in progress");
            this.notifying = res;
            return;
        }
        this.notifying = true;
        while (true) {
            const thisSerial = this.serial;
            const pos = res ? res.position : null;
            sendDebugMessage("Notifying " + JSON.stringify(pos) + " to observers -- serial " + thisSerial);
            const thisItem = this;
            this.handlers.forEach(function (item) {
                if (thisItem.serial == thisSerial) {
                    sendDebugMessage("Calling " + item.f);
                    item.f.call(item.thisObj, pos, res);
                    sendDebugMessage("returned");
                } else {
                    sendDebugMessage("Not notifying due to serial difference: " + thisItem.serial + " != " + thisSerial);
                }
            });
            sendDebugMessage("Notified observers -- serial " + thisSerial + " (currently " + this.serial + ")");
            if (!this.notify) {
                break;
            }
            res = this.notify;
            this.notify = null;
        }
        this.notifying = false;
    },

    serial: 0,
    notifying: false
}

function setTimeout(callback, delay) {
    const RunnableClass = Java.type('me.goddragon.teaseai.api.runnable.TeaseRunnable');
    let CustomRunnable = Java.extend(RunnableClass, { run: callback });
    var timer = new CustomRunnable();
    timer.runLater(delay);
    return timer;
}

function cancelTimeout(runnable) {
    const RunnableHandlerClass = Java.type('me.goddragon.teaseai.api.runnable.TeaseRunnableHandler');
    RunnableHandlerClass.getHandler().remove(runnable);
}

function registerOnClick(selector, callback) {
    posenetOnClick[selector] = callback;
}

var positionMonitor = new PositionMonitor();
