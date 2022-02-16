const positiveFlavourLines = [
  "did you buy it dinner first?",
  ("what, you egg? " + "[He stabs him]".italic),
  "Hello there.",
  "You want a cheez it fool?",
  "You smell different when you're awake...".italic,
  "I'm not a bot, I'm a human.",
  "H A M P T E R".rainbow
]

const errorFlavourLines = [
  "that code was written by the last guy.",
  "you must have the wrong version.",
  "nobody has ever complained about it.",
  "the third party API is not responding.",
  "you must have done something wrong.",
  "I have never seen that before in my life.",
  "actually, that's a feature.",
  "well, at least it displays a very pretty error.",
  "it must be a firewall issue."
]

const randomFromArray = (array) => {
  return array[Math.floor(Math.random() * array.length)]
}

const getPositiveFlavour = () => {
  return randomFromArray(positiveFlavourLines)
}

const getRandomFlavour = () => {
  const allLines = [...positiveFlavourLines, ...errorFlavourLines]
  return randomFromArray(allLines)
}

module.exports = { positiveFlavourLines, errorFlavourLines, getPositiveFlavour, getRandomFlavour }