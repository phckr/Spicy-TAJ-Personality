// Some ways of constructing a virtual DOM and then serializing it into HTML and sending it

const noClosingTags = {
    img: true
};

function escapeHtml(unsafe) {
    if (typeof unsafe != "string") {
        unsafe = "" + unsafe;
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeQuotes(unsafe) {
    if (typeof unsafe != "string") {
        unsafe = "" + unsafe;
    }
    return unsafe
        .replace(/"/g, "&quot;");
}


var HtmlElement = {
    tag: null,
    append: function (item) {
        this.children.push(item);
    },
    empty: function () {
        this.children = [];
    },
    serializeAttrs: function () {
        var result = "";
        for (var attr in this.attrs) {
            result += " " + attr + '="' + escapeQuotes(this.attrs[attr]) + '"';
        }
        return result;
    },
    serialize: function () {
        var result = "<" + this.tag + this.serializeAttrs() + ">";
        for (var i = 0; i < this.children.length; i++) {
            let childtype = typeof this.children[i];
            if (childtype != "object") {
                result += this.children[i];
            } else {
                result += this.children[i].serialize();
            }
        }
        if (!noClosingTags[this.tag]) {
            result += "</" + this.tag + ">";
        }
        return result;
    },
    render: function () {
        sendWebControlJson(JSON.stringify({ html: this.serialize() }));
    },
    text: function (text) {
        this.children = [escapeHtml(text)];
    },
    html: function (html) {
        this.children = [html];
    },
};

function createElement(element, attrs) {
    var result = Object.create(HtmlElement);
    result.tag = element;
    result.attrs = attrs || {};
    result.children = [];
    return result;
}

function createTextElement(text) {
    return escapeHtml(text);
}
