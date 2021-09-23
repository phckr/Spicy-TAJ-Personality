const TROUSER_TOY = createMultipleToy('trouser', 'trouser');

TROUSER_TOY.getImagePath = function() {
    return 'Images/Spicy/Toys/Clothing/Trousers/' + this.name + '.*';
};

//Mkdir folder if not exists
TROUSER_TOY.getImageFolder();

const TROUSER_TYPES = [
    'jeans',
    'leggings',
    'hot pants',
    'skort',
    'boy shorts',
];


TROUSER_TOY.createToyInstance = function(name, color, type) {
    let toy = createToy(name);
    toy.type = type;
    toy.color = color;

    toy.getName = function() {
        return this.color + ' ' + this.type;
    };

    toy.fetchToyInstance = function() {
        return this.fetchToy(this.getName(), this.getImagePath());
    };

    toy.getImagePath = function() {
        return 'Images/Spicy/Toys/Clothing/Trousers/' + this.name + '.*';
    };


    return toy;
};

TROUSER_TOY.setupNewToy = function() {
    let name = askForNewToyName(TROUSER_TOY);

    let type = askForToyType(TROUSER_TOY, TROUSER_TYPES);

    sendVirtualAssistantMessage('Now please tell me the color of the ' + TROUSER_TOY.name, 0);
    let color = createInput().getAnswer();

    let toy = TROUSER_TOY.createToyInstance(name, color, type);

    createToyAndCheckImage(toy, TROUSER_TOY);
};

TROUSER_TOY.showEditGui = function(trouser) {
    displayAutoToyDialog(trouser, TROUSER_TOY.saveToyInstances, {type: TROUSER_TYPES});
};

TROUSER_TOY.loadToyInstances();