const TOP_TOY = createMultipleToy('top', 'tops');
TOP_TOY.getImagePath = function() {
    return 'Images/Spicy/Toys/Clothing/Tops/' + this.name + '.*';
};

//Mkdir folder if not exists
TOP_TOY.getImageFolder();

const TOP_TYPES = [
    'blouse',
    'crop',
    'tank',
    'camisole',
    'tube',
    'tunic',
    'longline',
    'peplum',
    'bodysuit',
    'bardot',
    'kaftan',
    'wrap',
    'tulip',
    'cold shoulder',
    'shirt',
    'one shoulder',
    'choker',
    'hooded',
    'lace',
    'bustier',
    'sweatshirt',
    'dress',
    'nightie',
    'babydoll',
];


TOP_TOY.createToyInstance = function(name, color, type, sexAppeal, comfort) {
    let toy = createToy(name);
    toy.type = type;
    toy.color = color;

    toy.sexAppeal = sexAppeal;
    toy.comfort = comfort;

    toy.getName = function() {
        return this.color + ' ' + this.type + ' ' + TOP_TOY.name;
    };


    toy.fetchToyInstance = function() {
        return this.fetchToy(this.getName(), this.getImagePath());
    };

    toy.getImagePath = function() {
        return 'Images/Spicy/Toys/Clothing/Tops/' + this.name + '.*';
    };

    //Mkdir folder if not exists
    toy.getImageFolder();

    return toy;
};

TOP_TOY.setupNewToy = function() {
    let name = askForNewToyName(TOP_TOY);

    let type = askForToyType(TOP_TOY, TOP_TYPES, 'https://www.looksgud.in/blog/women-tops-types-designs/');

    sendVirtualAssistantMessage('Now please tell me the color of the ' + TOP_TOY.name, 0);
    let color = createInput().getAnswer();

    let sexAppeal = rateSexAppealOfToy(TOP_TOY);
    let comfort = rateComfortOfToy(TOP_TOY);

    let toy = TOP_TOY.createToyInstance(name, color, type, sexAppeal, comfort);

    createToyAndCheckImage(toy, TOP_TOY);
};

TOP_TOY.showEditGui = function(top) {
    displayAutoToyDialog(top, TOP_TOY.saveToyInstances, {type: TOP_TYPES});
};

TOP_TOY.loadToyInstances();

function getDailyWearTops() {
    return TOP_TOY.getToysNotOfTypes(['nightie', 'corset', 'babydoll']);
}

function getNightwearTops() {
    return TOP_TOY.getToysOfTypes(['nightie', 'babydoll']);
}