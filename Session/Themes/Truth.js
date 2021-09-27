
// This gets called at session start and on every break.

function truthRun(phase) {
    truthAskQuestions();
}

function truthGetFrequency() {
    return { roughly: 3 };
}