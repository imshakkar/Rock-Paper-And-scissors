let userScore = 0;
let computerScore = 0;
let busy = false;   // true while a round is playing, blocks double clicks

/* ---------- Hand icons (WebP files next to index.html) ---------- */

const IMAGES = {
    rock: "./rock.webp",
    paper: "./paper.webp",
    scissors: "./scissors.webp",
};

const iconHTML = (pick) =>
    `<img src="${IMAGES[pick]}" alt="" width="360" height="360" decoding="async" draggable="false" />`;

// load all three images up front so the house pick appears instantly
Object.values(IMAGES).forEach((src) => { new Image().src = src; });

const choices = document.querySelectorAll(".choice");
const msg = document.querySelector("#msg");

const userScorePara = document.querySelector("#user-score");
const computerScorePara = document.querySelector("#computer-score");

const chooseScreen = document.querySelector("#choose-screen");
const resultScreen = document.querySelector("#result-screen");
const playerSlot = document.querySelector("#player-slot");
const houseSlot = document.querySelector("#house-slot");
const outcome = document.querySelector("#outcome");
const playAgainBtn = document.querySelector("#play-again");

const rulesModal = document.querySelector("#rules-modal");
const openRulesBtn = document.querySelector("#open-rules");
const closeRulesBtn = document.querySelector("#close-rules");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// change the message text + state ("thinking", "win", "lose", "draw") and replay its animation
const setMsg = (text, state = "") => {
    msg.className = "";
    void msg.offsetWidth;          // restart the CSS animation
    msg.innerText = text;
    msg.className = state;
};

/* ---------- Score (starts from 0 on every page load) ---------- */

// update a score number and make it "bump"
const setScore = (el, value) => {
    el.innerText = value;
    el.classList.remove("bump");
    void el.offsetWidth;            // restart the animation
    el.classList.add("bump");
};

/* ---------- Game logic ---------- */

const genComputerChoice = () => {
    const options = ["rock", "paper", "scissors"];
    const randIdx = Math.floor(Math.random() * 3);
    return options[randIdx];
};

// Builds the circular pick (same look as the buttons, but not clickable)
const makePick = (pick) => {
    const el = document.createElement("div");
    el.className = `token ${pick} pop-in`;
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", pick);
    el.innerHTML = `<span class="inner">${iconHTML(pick)}</span>`;
    return el;
};

const makePlaceholder = () => {
    const el = document.createElement("div");
    el.className = "placeholder";
    return el;
};

const drawGame = () => {
    setMsg("Game was a draw. Play again.", "draw");
};

const showWinner = (userWin, userChoice, computerChoice) => {
    if (userWin) {
        userScore++;
        setScore(userScorePara, userScore);
        setMsg(`You win! Your ${userChoice} beats ${computerChoice}`, "win");
        playerSlot.classList.add("winner");
    } else {
        computerScore++;
        setScore(computerScorePara, computerScore);
        setMsg(`You lost. ${computerChoice} beats your ${userChoice}`, "lose");
        houseSlot.classList.add("winner");
    }
};

const playGame = async (userChoice) => {
    if (busy) return;
    busy = true;

    // 1. swap screens: your pick on the left, empty circle for the house
    chooseScreen.hidden = true;
    resultScreen.hidden = false;
    playerSlot.classList.remove("winner");
    houseSlot.classList.remove("winner");
    outcome.classList.remove("show");
    playerSlot.replaceChildren(makePick(userChoice));
    houseSlot.replaceChildren(makePlaceholder());
    setMsg("The house is choosing...", "thinking");

    // 2. short pause, then reveal the house pick
    await wait(1000);
    const computerChoice = genComputerChoice();
    houseSlot.replaceChildren(makePick(computerChoice));

    // 3. another short pause, then show the verdict
    await wait(600);

    if (userChoice === computerChoice) {
        drawGame();
    } else {
        let userWin = true;
        if (userChoice === "rock") {
            userWin = computerChoice === "paper" ? false : true;
        } else if (userChoice === "paper") {
            userWin = computerChoice === "scissors" ? false : true;
        } else {
            userWin = computerChoice === "rock" ? false : true;
        }
        showWinner(userWin, userChoice, computerChoice);
    }

    outcome.classList.add("show");
    playAgainBtn.focus();
    busy = false;
};

const playAgain = () => {
    resultScreen.hidden = true;
    chooseScreen.hidden = false;
    setMsg("Play your move!");
    document.querySelector("#paper").focus();
};

choices.forEach((choice) => {
    choice.addEventListener("click", () => {
        const userChoice = choice.getAttribute("id");
        playGame(userChoice);
    });
});

playAgainBtn.addEventListener("click", playAgain);

/* ---------- Intro animation: Rock, Paper, Scissors ---------- */

const splash = document.querySelector("#splash");
const splashHand = document.querySelector("#splash-hand");
const splashImg = document.querySelector("#splash-img");
const splashWord = document.querySelector("#splash-word");

// restart a CSS animation class on an element
const replay = (el, cls) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
};

const skipSplash = () => splash.classList.add("done");

const runSplash = async () => {
    for (const pick of ["rock", "paper", "scissors"]) {
        if (splash.classList.contains("done")) return;
        splashImg.src = IMAGES[pick];
        splashHand.className = `token ${pick} splash-hand`;
        splashWord.textContent = pick[0].toUpperCase() + pick.slice(1);
        replay(splashHand, "beat");
        replay(splashWord, "pop");
        await wait(650);
    }
};

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    splash.remove();                     // no intro if motion is turned off
} else {
    splash.addEventListener("click", skipSplash);
    // remove it from the page once it has faded out (ignore the hand's own animations)
    splash.addEventListener("animationend", (e) => {
        if (e.target === splash) splash.remove();
    });
    runSplash();
}

/* ---------- Keyboard shortcuts: R, P, S ---------- */

const KEYS = { r: "rock", p: "paper", s: "scissors" };

document.addEventListener("keydown", (e) => {
    if (splash.isConnected) {            // intro still playing: key = skip
        skipSplash();
        return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (rulesModal.open || chooseScreen.hidden) return;
    const pick = KEYS[e.key.toLowerCase()];
    if (pick) playGame(pick);
});

/* ---------- Rules modal (native <dialog>) ---------- */
/* showModal() handles Escape, focus trapping and returning focus for us */

openRulesBtn.addEventListener("click", () => rulesModal.showModal());
closeRulesBtn.addEventListener("click", () => rulesModal.close());

// click on the dark backdrop closes it
rulesModal.addEventListener("click", (e) => {
    if (e.target === rulesModal) rulesModal.close();
});

