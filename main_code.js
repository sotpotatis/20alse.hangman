/* main_code.js
Contains the main code that is used. */

const chars = "abcdefghijklmnopqrstuvwxyzåäöABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ";
const lastCharIndex = chars.length - 1;

const imagesBaseURL = "/images";
const baseURL = "https://20alse.ssis.nu/hangman/api"

// GAME CODE STARTS HERE
const validGameModes = ["daily", "random"]
let currentGameMode = "daily"
function setGameMode(gameModeType){
  if (validGameModes.includes(gameModeType)){
    currentGameMode = gameModeType
    console.log(`Active game mode changed to ${gameModeType}.`)
  }
  else {
    console.log("Requested changing of game mode, but received an invalid value!")
  }
}

/**
 * Resets the game status.
 */
function resetGameStatus() {
  gameStatus = {
    isRunning: false,
    somethingIsLoading: false,
    currentWord: null,
    wordLength: null,
    attemptedChars: [],
    placesGuessed: 0, // Number of characters guessed correctly
    tries: 0,
  };
}
gameStatus = {};
resetGameStatus();


// EVENTS
// Keyboard input - when the player presses the keyboard
const keyboardInputEventName = "keyboardInput";
const keyboardInput = new Event(keyboardInputEventName);
// Lost game - when the player loses the game
const lostGameEventName = "lostGame";
const lostGame = new Event(lostGameEventName);
// Win game - when the player wins the game
const wonGameEventName = "wonGame";
const wonGame = new Event(wonGameEventName);
// Pending load done - when something we were waiting for to load has loaded
const pendingLoadDoneEventName = "pageLoaded";
const pendingLoadDone = new Event(pendingLoadDoneEventName);


// ELEMENTS
let mainContent = document.getElementById("main-content"); // The main content wrapper, including both loading and gameplay (basically everything in body)
let wordhintWrapper = document.getElementById("letters-wrapper"); // The part of the page that fills out the word you're guessing ("A _ C _ _ E")
let failedLettersWrapper = document.getElementById("failed-letters-wrapper"); // The part of the page that displays wrong letters
let hangmanImageWrapper = document.getElementById("image-wrapper");
let hangmanImage = document.getElementById("status-image");

// API STUFF
function getWord(daily, callback) {
  let url = baseURL + (daily ? "/words/daily.php": "/words/random.php")
  console.log(`Getting word from ${url}...`);
  $.getJSON(url, function (data) {
    console.log(data)
    console.log("Got a response from the word data API. (data: see above)")
    if (data.data.word !== undefined){
    console.log("Received word!");
    callback(data.data.word)
  }
  else {
    console.log("Did not receive a word - request failed!")
  }
  });
}

/**
 * Function for checking if a character is in the current word.
 * @param {string} char The character to look up (for example "s")
 * @param {Function} callback A callback which will receive a list with the indexes (starting with 0, may be empty)
 * that the character was found at.
 */
function checkCharGuess(char, callback){
  let url = baseURL + `/words/check_guess.php?word=${gameStatus.currentWord}&guessed_char=${char}`
  console.log(`Sending char guess to ${url}...`)
  $.getJSON(url, function(data){
    console.log(data)
    console.log("Got a response from the word guess API. (data: see above)")
    if (data.data.indexes !== undefined){
      callback(data.data.indexes)
    }
    else {
      console.log("Did not receive index data - request failed!")
    }
  })
}

/**
 * Shortcut function for creating a tag with text inside it in the current document
 * @param tagName The name of the tag to add, for example "p"
 * @param text The text to add to the tag.
 * @param dataset Any custom dataset to apply to the tag.
 * @returns {Text | ActiveX.IXMLDOMNode}
 */
function createTagWithText(tagName, text, dataset = {}) {
  let newTag = document.createElement(tagName);
  newTag.appendChild(document.createTextNode(text));
  // Check and apply custom dataset keys if any
  for (const datasetKey in dataset) {
    newTag.dataset[datasetKey] = dataset[datasetKey];
  }
  return newTag;
}

/**
 * Used to set the data-loading attribute on an item. Used to display loading screens etc.
 * @param element The element to set the attribute on
 * @param loading: true to set it to loading, false to set it to not loading.
 */
function setLoading(element, loading) {
  element.dataset.loading = loading ? "true": "false";
  console.log(`Set loading on ${element.id} to ${loading}.`);
}

// Handlers for game status
/**
 * Reset word hints (the elements saying "_" hinting what word is to be used)
 */
function clearWordHints() {
  console.log("Resetting word hints...");
  wordhintWrapper.innerHTML = "";
}

/**
 * Resets failed inputs (the elements listing all the letters you got wrong)
 */
function clearFailedInputs() {
  console.log("Resetting failed inputs...");
  failedLettersWrapper.innerHTML = "";
}

/**
 * Runs when a new game is started
 */
function startNewGame() {
  console.log("Starting new game...");
    resetGameStatus();
  // Clear previous data
  clearFailedInputs();
  clearWordHints();
  setLoading(wordhintWrapper, true)
  let isDailyWord = currentGameMode === "daily"; // Whether the game mode is "daily" or not
    getWord(isDailyWord, function(wordData){
      console.log("Callback received word.")
      setLoading(wordhintWrapper, false)
      gameStatus.currentWord = wordData.word;
      gameStatus.wordLength = wordData.wordLength;
      gameStatus.isRunning = true;
      syncHangmanFrame(); // Sync hangman image with game status

      // Create hints for the word
      for (let i = 0; i < gameStatus.wordLength; i++) {
        wordhintWrapper.appendChild(
          createTagWithText("p", "_", { guessed: "false" })
        );
      }
      console.log("Added word hints. Setting game status...");
      console.log("Game was started.");
    })

}

/**
 * Adds a character to the display element on the page that displays which characters that have been tried and proven wrong.
 * @param char The character to add.
 */
function addCharToFailedInputs(char) {
  console.log(`Adding character ${char} to list of failed inputs...`);
  gameStatus.attemptedChars.push(char);
  failedLettersWrapper.appendChild(createTagWithText("p", char)); // Add text element to failed letters
}

/**
 * Fills the letter hints (_ for unknown characters) with a charater
 * @param letter The letter to fill in.
 * @param letterIndexes Where in the word hint to insert the letter index.
 */
function fillLetterHintsWithLetter(letter, letterIndexes) {
  for (const index of letterIndexes) {
    console.log(index);
    wordhintWrapper.childNodes[index].replaceWith(
      createTagWithText("p", letter, { guessed: "true" })
    );
  }
}

/**
 * Updates the hangman image to match the current amount of failed tries.
 */
function syncHangmanFrame() {
  hangmanImage.src = `${imagesBaseURL}/hangman-${gameStatus.tries}.png`;
}

/**
 * Handles keyboard input.
 */
function handleKeyboardInput(event) {
  if (gameStatus.isRunning) {
    console.log("Checking keyboard input...");
    console.log(`Key code press: ${event.keyCode}.`);
    let inputChar = null;
    if (event.keyCode >= 65 && event.keyCode <= 90) {
      // A-Z letters
      inputChar = chars[event.keyCode - 65];
    } else if (event.keyCode === 221) {
      // Å letter
      inputChar = "å";
    } else if (event.keyCode === 222) {
      // Ä letter
      inputChar = "ä";
    } else if (event.keyCode === 192) {
      // Ö letter
      inputChar = "ö";
    } else {
      console.log("Keycode is not a character.");
      return;
    }
    // Check cases when guess checking shouldn't be performed
    if (!gameStatus.isRunning){
      console.log("Game is not running. Ignoring...")
      return
    }
    else if (gameStatus.attemptedChars.includes(inputChar)) {
      console.log("Character has already been guessed. Ignoring...");
      return;
    }
    
    console.log("Requesting char data from server...")
    setLoading(wordhintWrapper, true)
    checkCharGuess(inputChar, function(positions){
    setLoading(wordhintWrapper, false)
      console.log(`Received word positions: ${positions}.`)
      gameStatus.attemptedChars.push(inputChar);
    // Check if player loses
    if (positions.length === 0) {
      gameStatus.tries += 1;
      if (gameStatus.tries >= 10) {
        console.log("The player lost!");
        document.dispatchEvent(lostGame);
      } else {
        console.log("Char is not in word, but there are still tries left.");
        gameStatus.attemptedChars.push(inputChar);
        addCharToFailedInputs(inputChar);
      }
      syncHangmanFrame(); // Sync hangman image with game status
    } else {
      console.log("The guess was correct!");
      gameStatus.placesGuessed += positions.length;
      // Fill out letters
      fillLetterHintsWithLetter(inputChar, positions);
      if (gameStatus.placesGuessed === gameStatus.wordLength) {
        console.log("Win detected!");
        document.dispatchEvent(wonGame);
      }
    }
    })
    
  }
}

function playerLost() {
  console.log("Handling lost event.");
  // Iterate over child nodes. If not guessed, fill out.
  for (let i = 0; i < gameStatus.wordLength; i++) {
    let childNode = wordhintWrapper.childNodes[i];
    if (childNode.dataset.guessed === "false") {
      childNode.replaceWith(createTagWithText("p", "?"));
    }
  }
}

// Add listeners for new game and keyboard input events
document.addEventListener("keydown", handleKeyboardInput);
document.addEventListener(keyboardInputEventName, handleKeyboardInput);

// Add listeners for when you lose the game
document.addEventListener(lostGameEventName, playerLost);
