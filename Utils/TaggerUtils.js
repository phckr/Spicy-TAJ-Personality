/*
 * This is an HTML implementation of the media tagger. It is intended to be used
 * as either a session link or as a session theme
 */

/**
 * Displays the tagging UI and when the tagging is complete, it calls the cb
 * @param {String} path The image to be tagged
 * @param {function} cb WIll be called when the tagging is complete
 */
function taggerTagPicture(path, cb) {

    const TaggedPicture = Java.type('me.goddragon.teaseai.api.picture.TaggedPicture');
    const File = Java.type('java.io.File');

    var taggedPicture = new TaggedPicture(new File(path), true);

    taggerTagTaggedPicture(taggedPicture, cb);
}

function taggerTagRandomPicture(cb) {
    const PictureFolder = Java.type('me.goddragon.teaseai.api.picture.PictureFolder');

    taggerTagTaggedPicture(PictureFolder.getRandomUntaggedPictureAcrossAll(), cb)
}

function taggerTagRandomPicturesWaitUntil(constraint) {
    var done = {};
    taggerTagRandomPicturesUntil(constraint, function() { done.done = 1; });

    while (!done.done) {
        wait(0.2);
    }
}

function taggerTagRandomPicturesUntil(constraint, cb) {
    if (!constraint.time) {
        constraint.time = 0;
    }
    if (!constraint.count) {
        constraint.count = 0;
    }
    if (constraint.time <= 0 && constraint.count <= 0) {
        sendWebControlJson(JSON.stringify({ html: null }));
        cb();
        return;
    }

    var start = Date.now();

    taggerTagRandomPicture(function() { 
        var nextConstraint = {time: constraint.time - (Date.now() - start) / 1000, 
            count: constraint.count - 1};

        taggerTagRandomPicturesUntil(nextConstraint, cb);
    });
}

function taggerTagTaggedPicture(taggedPicture, cb) {
    if (!taggedPicture) {
        cb(false);
        return;
    }
    var top = createElement('div', { class: 'tagger' });
    var left = createElement('div', { class: 'tagger-left' });
    top.append(left);
    var right = createElement('div', { class: 'tagger-right' });
    top.append(right);

    var leftSelection = createElement('div', { class: 'tagger-left-select' });
    left.append(leftSelection);
    var leftNext = createElement('div', { class: 'tagger-left-next' });
    left.append(leftNext);

    right.append(createElement('img', { class: 'tagger-img', src: allocateTempUrl(taggedPicture.getFile().getPath())}));

    /* Now stuff all the checkboxes / radio buttons into leftSelection */

    var PictureTag = Java.type('me.goddragon.teaseai.api.picture.PictureTag');
    var TagType = Java.type('me.goddragon.teaseai.api.picture.PictureTag.TagType');

    var tagTypes = [TagType.BODY_PART, TagType.BODY_TYPE, TagType.CATEGORY, 
        TagType.VIEW, TagType.PEOPLE_INVOLVED, TagType.ACTION, TagType.ACCESSORIES];

    let allTagNames = {};

    for (var j = 0; j < tagTypes.length; j++) {
        const tagType = tagTypes[j];
        var viewTags = PictureTag.getPictureTagsByType(tagType);

        var typeDiv = createElement('div', { class: 'tag-group' });
        for (var i = 0; i < viewTags.length; i++) {
            var origTag = viewTags[i].getTagName();
            allTagNames[origTag] = viewTags[i];
            var tag = origTag.replace('Tag', '');
            var label = createElement('label', { class: 'tag-label' });
            var tagBox = createElement('input', { type: 'checkbox', name: origTag });
            if (taggedPicture.hasTag(viewTags[i])) {
                tagBox.attr('checked', '1');
            }
            tagBox.text(tag);
            label.append(tagBox);
            typeDiv.append(label);
        }

        leftSelection.append(typeDiv);
    }

    var DressState = Java.type('me.goddragon.teaseai.api.picture.DressState');
    var dressStates = DressState.values();

    let allDressStates = {};

    var typeDiv = createElement('div', { class: 'tag-group' });
    for (var i = 0; i < dressStates.length; i++) {
        var origTag = dressStates[i].getTagName();
        allDressStates[origTag] = dressStates[i];
        var tag = origTag.replace('Tag', '');
        var label = createElement('label', { class: 'tag-label' });
        var tagBox = createElement('input', { type: 'radio', name: 'dressState', value: origTag });
        if (taggedPicture.hasDressState(dressStates[i])) {
            tagBox.attr('checked', '1');
        }
        tagBox.text(tag);
        label.append(tagBox);
        typeDiv.append(label);
    }

    leftSelection.append(typeDiv);

    leftNext.append(createElement('button', { class: 'tag-next', name: 'Save', value: 'Save',
            onclick: "sendClick('.tagger', this); $('.tagger-overlay').show();"}).text('Save/Next'));

    var script = createElement('script');
    script.html('$(window).on("resize.tagger", function() ' +
        '{ fitContent($(".tagger-left-select"), $(".tagger-left"), 50); });\n' + 
        'setTimeout(function () { $(window).trigger("resize.tagger") }, 0);\n');

    top.append(script);

    var overlay = createElement('div', { class: 'tagger-overlay'});
    top.append(overlay);

    registerOnClick('.tagger', function (item, content) {
        sendDebugMessage("Got click on " + item + " with contents " + JSON.stringify(content));
        const HashSet = Java.type('java.util.HashSet');
        var newTags = new HashSet();
        var newDressState = null;
        for (var tag in content) {
            if (content[tag]) {
                if (allTagNames[tag]) {
                    newTags.add(allTagNames[tag]);
                }
            }
        }

        if (allDressStates[content.dressState]) {
            newDressState = allDressStates[content.dressState];
        }

        taggedPicture.setTags(newTags);
        taggedPicture.setDressState(newDressState);

        if (cb) {
            cb(true);
        }
      });    

    top.render();
}