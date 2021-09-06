addResponseRegex("taj-posenet-data");

let posenet_result = null;

function posenetResponse(message) {
  const result = JSON.parse(message.substring(17));
  sendDebugMessage("Posenet: " + JSON.stringify(result)); 
  const previous = posenet_result;
  posenet_result = result;
  if (!previous || JSON.stringify(result.position) != JSON.stringify(previous.position)) {
    positionMonitor.change(result.position, result);
  }
}

function getPosenetResult() {
    return posenet_result;
}

function PositionMonitor() {
    this.handlers = [];
}

PositionMonitor.prototype = {
    subscribe: function (fn) {
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
        sendDebugMessage("Notifying " + JSON.stringify(pos) + " to observers " + this.handlers);
        var scope = thisObj || window;
        this.handlers.forEach(function (item) {
            item.call(scope, pos, res);
        });
    }
}

var positionMonitor = new PositionMonitor();
