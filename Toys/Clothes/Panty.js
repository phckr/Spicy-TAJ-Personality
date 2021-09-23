const PANTY_TOY = createMultipleToy('panty', 'panties');
PANTY_TOY.getImagePath = function() {
    return 'Images/Spicy/Toys/Clothing/Panties/' + this.name + '.*';
};

//Mkdir folder if not exists
PANTY_TOY.getImageFolder();

const PANTY_TYPES = [
    'c-string',
    't-string',
    'v-string',
    'g-string',
    'thong',
    'tanga',
    'bikini',
    'brazilian',
    'string-bikini',
    'cheeky',
    'hipster',
    'boyshort',
    'hiphugger',
    'high-leg',
    'high-waist',
    'shapewear',
    'crotchless'
];


PANTY_TOY.createToyInstance = function(name, color, type, sexAppeal, comfort) {
    let toy = createToy(name);
    toy.type = type;
    toy.color = color;

    toy.sexAppeal = sexAppeal;
    toy.comfort = comfort;

    toy.getName = function() {
        return this.color + ' ' + this.type + ' ' + PANTY_TOY.name;
    };

    toy.fetchToyInstance = function() {
        return this.fetchToy(this.getName(), this.getImagePath());
    };

    toy.getImagePath = function() {
        return 'Images/Spicy/Toys/Clothing/Panties/' + this.name + '.*';
    };

    //Mkdir folder if not exists
    toy.getImageFolder();

    return toy;
};

PANTY_TOY.setupNewToy = function() {
    let name = askForNewToyName(PANTY_TOY);

    let type = askForToyType(PANTY_TOY, PANTY_TYPES, 'https://www.123rf.com/photo_124891947_stock-vector-all-types-of-womens-panties-the-most-complete-vector-collection-of-lingerie.html');

    sendVirtualAssistantMessage('Now please tell me the color of the ' + PANTY_TOY.name, 0);
    let color = createInput().getAnswer();

    let sexAppeal = rateSexAppealOfToy(PANTY_TOY);
    let comfort = rateComfortOfToy(PANTY_TOY);

    let toy = PANTY_TOY.createToyInstance(name, color, type, sexAppeal, comfort);

    createToyAndCheckImage(toy, PANTY_TOY);
};

function rateSexAppealOfToy(toyMultiple) {
    sendVirtualAssistantMessage('Now I want you to rate the sex appeal of the ' + toyMultiple.name + ' on a scale of 1-10');
    sendVirtualAssistantMessage('1 being completely plain, no nothing. A plain ' + toyMultiple.name + ' for example. And 10 being a slutty and sexy one');

    return createIntegerInput('So what level of sex appeal would you give this ' + toyMultiple.name + '?', 1, 10, 'That\'s not a valid number', 'This number is outside of the given range of 1-10 %SlaveName%');
}

function rateComfortOfToy(toyMultiple) {
    sendVirtualAssistantMessage('Now I want you to rate the comfort level of the ' + toyMultiple.name + ' on a scale of 1-10');
    sendVirtualAssistantMessage('10 being completely comfortable, even pleasant. And 1 causing a lot of discomfort. Maybe even painful to wear.');

    return createIntegerInput('So what level of comfort would you give this ' + toyMultiple.name + '?', 1, 10, 'That\'s not a valid number', 'This number is outside of the given range of 1-10 %SlaveName%');
}

PANTY_TOY.showEditGui = function(panty) {
    displayAutoToyDialog(panty, PANTY_TOY.saveToyInstances, {type: PANTY_TYPES});
};

PANTY_TOY.loadToyInstances();