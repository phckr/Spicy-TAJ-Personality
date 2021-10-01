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
        return this;
    },
    empty: function () {
        this.children = [];
        return this;
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
        return this;
    },
    html: function (html) {
        this.children = [html];
        return this;
    },
    attr: function (name, value) {
        this.attrs[name] = value;
        return this;
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

function showDialogAsHtml(dialog, saveFn) {
    var gui = createElement('table', { class: 'dialog' + dialog.name });
    var header = createElement("tr", { class: 'capitalize' });
    var label = createElement("th");
    label.append(dialog.name);
    header.append(label);
    gui.append(header);

    let scene = dialog.dialog.getScene();
    let pane = scene.getRoot();   // We know this is a javafx GridPane object

    var tr = createElement('tr');
    var currentRow = 0;
    var currentCol = 0;

    const GridPane = pane.class.static;

    let children = pane.getChildren();
    let writebackGui = dialog.writebackGui;

    for (var childIndex in pane.getChildren()) {
        let child = children[childIndex];
        var row = GridPane.getRowIndex(child);
        var col = GridPane.getColumnIndex(child);

        if (row > currentRow) {
            gui.append(tr);
            tr = createElement('tr');
            currentRow += 1;
            currentCol = 0;
        }
        while (col > currentCol) {
            tr.append(createElement('td'));
            currentCol += 1;
        }
        let td = createElement('td');
        // Now figure out how to map `child` into HTML
        let childClass = "" + child.getClass();
        if (childClass.endsWith(".Text")) {
            let text = child.getText();
            if (text.endsWith(":")) {
                text = text.slice(0, -1);
            }
            td.text(text);
        }

        let name = writebackGui.getAttributeNameForControl(child) || "";

        if (childClass.endsWith(".ImageView")) {
            let attrs = { src: allocateTempUrl(dialog.imagePath) };
            var fitWidth = child.getFitWidth();
            if (fitWidth) {
                attrs.width = fitWidth;
            }
            let img = createElement("img", attrs);

            td.append(img);
        }

        if (childClass.endsWith(".TextField")) {
            let text = child.getText();
            if (!text) {
                text = "";
            }
            let attrs = { name: name, value: text, type: 'text' };
            if (!isNaN(text)) {
                attrs.type = "number";
            }
            let input = createElement('input', attrs);
            td.append(input);
        }

        if (childClass.endsWith(".CheckBox")) {
            var attrs = { type: 'checkbox', name: name };
            if (child.isSelected()) {
                attrs.checked = true;
            }
            let input = createElement('input', attrs);
            td.append(input);
        }

        if (childClass.endsWith(".Button")) {
            if (child.getText() != "Close") {
                var text = child.getText();
                let button = createElement('button', { type: 'button', name: name, onclick: 'sendClick(".' + gui.attrs.class + '", this, true)' });
                button.text(text);
                td.append(button);
            }
        }

        if (childClass.endsWith(".ComboBox")) {
            let items = child.getItems();
            let selectedItem = child.getValue();
            let select = createElement('select', { name: name });
            for (var itemIndex in items) {
                let item = items[itemIndex];
                var attrs = { value: item };
                if (item == selectedItem) {
                    attrs.selected = true;
                }
                var option = createElement('option', attrs);
                option.text(item);
                select.append(option);
            }
            td.append(select);
        }

        tr.append(td);
        currentCol += 1;
    }
    gui.append(tr);

    registerOnClick('.' + gui.attrs.class, function (click, result) {
        if (click == "Delete") {
            writebackGui.remove();
        }
        if (click == "Save") {
            for (var name in result) {
                if (name) {
                    var value = result[name];
                    let control = writebackGui.getTAJControlForName(name);
                    if (control) {
                        if (control.getWriteBackValueForValue) {
                            value = control.getWriteBackValueForValue(value);
                        }
                    }
                    writebackGui.object[name] = isNaN(value) ? value : +value;
                }
            }
        }
        saveFn();
    });

    gui.render();
}
