const JEWELLERY_TOY = createMultipleToy('jewellery', 'jewellery');
JEWELLERY_TOY.getImagePath = function() {
    return 'Images/Spicy/Toys/Clothing/Jewellery/' + this.name + '.*';
};

//Mkdir folder if not exists
JEWELLERY_TOY.getImageFolder();

const JEWELLERY_TYPES = [
    'necklace',
    'anklet',
    'ring',
    'choker',
    'earring',
    'crown',
    'bracelet',
    'toe ring',
];


JEWELLERY_TOY.createToyInstance = function(name, color, type, engraving, visible) {
    let toy = createToy(name);
    toy.type = type;
    toy.color = color;

    toy.engraving = engraving;

    toy.visible = visible;

    toy.getName = function() {
        return this.color + ' ' + this.type + ' ' + JEWELLERY_TOY.name;
    };


    toy.fetchToyInstance = function() {
        return this.fetchToy(this.getName(), this.getImagePath());
    };

    toy.getImagePath = function() {
        return 'Images/Spicy/Toys/Clothing/Jewellery/' + this.name + '.*';
    };

    return toy;
};

JEWELLERY_TOY.setupNewToy = function() {
    let name = askForNewToyName(JEWELLERY_TOY);

    let type = askForToyType(JEWELLERY_TOY, JEWELLERY_TYPES);

    sendVirtualAssistantMessage('Now please tell me the color of the ' + JEWELLERY_TOY.name, 0);
    let color = createInput().getAnswer();

    let engraving = '';
    if(sendYesOrNoQuestion('Is there any engraving like "Sissy" or similar on it?')) {
        sendVirtualAssistantMessage('Well then tell me what\'s written onto it', 0);
        let answer = createInput();

        engraving = answer.getAnswer();

        sendVirtualAssistantMessage('Great! %EmoteHappy%');
    } else {
        sendVirtualAssistantMessage('%EmoteSad%');
    }

    let visible = sendYesOrNoQuestion('Next would you consider this jewellery hard to hide underneath casual clothing or not? No being easy to hide and yes hard to hide.', 0);

    let toy = JEWELLERY_TOY.createToyInstance(name, color, type, engraving, visible);

    createToyAndCheckImage(toy, JEWELLERY_TOY);
};

JEWELLERY_TOY.showEditGui = function(jewellery) {
    displayAutoToyDialog(jewellery, JEWELLERY_TOY.saveToyInstances, {type: JEWELLERY_TYPES});
};
 
JEWELLERY_TOY.loadToyInstances();