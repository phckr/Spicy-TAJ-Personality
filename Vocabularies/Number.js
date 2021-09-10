// Use as in %Number:3%   -- this turns into "three"
function numberVocabulary(arg) {

  const numbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

  if (+arg < 0 || +arg >= numbers.length) {
    return arg;
  }

  return numbers[arg];
}
