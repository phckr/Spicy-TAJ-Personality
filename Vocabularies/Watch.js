function watchVocabulary() {

    const answers = ["watch", "see", "monitor", "study", "gaze at", "check on"];

    return answers[randomInteger(0, answers.length - 1)];
}
