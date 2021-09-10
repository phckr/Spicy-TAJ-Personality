addResponseRegex("taj-posenet-data");

let posenet_result = null;
let posenet_image_requests = {};

function posenetResponse(message) {
  const result = JSON.parse(message.substring(17));
  if (result.command) {
    sendDebugMessage("Command: " + JSON.stringify(result)); 
    if (result.command == "vocab") {
      sendWebControlJson(JSON.stringify({response: result.command, arg: result.arg, result: replaceVocab(result.arg)}));
    }
    return;
  }
  sendDebugMessage("Posenet: " + JSON.stringify(result.position)); 
  const previous = posenet_result;
  result.when = Date.now();
  posenet_result = result;
  sendDebugMessage("Posenet latency = " + (result.when - result.captured) + "ms");
  positionMonitor.update(result);
  if (!previous || JSON.stringify(result.position) != JSON.stringify(previous.position)) {
    // positionChange.change(result.position, result);
  }
  sendDebugMessage("Posenet handling latency = " + (Date.now() - result.when) + "ms");
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
}

function getSubRandomFilename(prefix) {
  return (prefix ? prefix : "") + (Math.random().toString(36) + Math.random().toString(36)).replace(/\./g, "");
}

function takeSubPhotoAndSaveInFolder(folder, prefix) {
  takeSubPhoto(function (data) {
    writeSubPhotoToFile(data, folder + "/" + getSubRandomFilename(prefix));
  });
}

function writeSubPhotoToFile(data, filePath) {
  let binaryData = java.util.Base64.getMimeDecoder().decode(data.split('base64,')[1]);
  let imageType = data.substring(11, 100);
  imageType = imageType.split(";")[0];
  if (imageType == "jpeg") {
    imageType = "jpg";
  }
  filePath = filePath + "." + imageType;
  let stream = new java.io.FileOutputStream(filePath);
  stream.write(binaryData);
  stream.close();

  return filePath;
}

function takeSubPhoto(done) {
  var name = Math.random().toString(36);
  posenet_image_requests[name] = done;
  sendWebControlJson(JSON.stringify({photo:name}));
}

function getRecentPosenetResult() {
    if (posenet_result && Date.now() - posenet_result.when < 15000) {
      return posenet_result;
    }
    return null;
}

function getSubPosition() {
    const result = getRecentPosenetResult();
    if (result) {
      return result.position;
    }
    return null;
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
        this.handlers.push({"f":fn, "thisObj":thisObj});
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

var positionMonitor = new PositionMonitor();
