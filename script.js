const form = document.querySelector("#sentenceForm");
const input = document.querySelector("#sentenceInput");
const backgroundInput = document.querySelector("#backgroundInput");
const fallbackArt = document.querySelector("#fallbackArt");
const characterFace = document.querySelector("#characterFace");
const characterOptions = document.querySelectorAll(".character-option");
const stage = document.querySelector("#stage");
const blastLayer = document.querySelector("#blastLayer");
const mouthAnchor = document.querySelector("#mouthAnchor");

const sampleWords = ["꽝!", "꽝!", "꽝!"];

clearVolatileInputs();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const words = input.value.trim().split(/\s+/).filter(Boolean);
  clearVolatileInputs();
  fireWords(words.length ? words : sampleWords);
});

backgroundInput.addEventListener("change", (event) => {
  const [file] = event.target.files;

  if (!file) {
    return;
  }

  fallbackArt.style.setProperty("--custom-bg", `url("${URL.createObjectURL(file)}")`);
  fallbackArt.classList.add("has-custom-bg");
});

characterOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const character = option.dataset.character;

    characterFace.className = `fallback-face character-${character}`;
    characterOptions.forEach((item) => item.classList.toggle("is-active", item === option));
  });
});

window.addEventListener("pageshow", clearVolatileInputs);
window.addEventListener("pagehide", clearVolatileInputs);
window.addEventListener("beforeunload", clearVolatileInputs);

try {
  localStorage.removeItem("sentenceInput");
  sessionStorage.removeItem("sentenceInput");
} catch {
  // Storage may be unavailable on file:// pages.
}

function clearVolatileInputs() {
  input.value = "";
  input.defaultValue = "";
  form.reset();
}

function fireWords(words) {
  blastLayer.replaceChildren();
  stage.classList.remove("shake", "firing");
  void stage.offsetWidth;
  stage.classList.add("shake", "firing");

  const anchor = getAnchorPoint();
  const firingDuration = Math.max(900, (words.length - 1) * 190 + 980);

  words.forEach((word, index) => {
    const delay = index * 190;
    window.setTimeout(() => {
      emitShockwave(anchor);
      emitSpeedLines(anchor, index);
      emitWord(word, anchor, index, words.length);
    }, delay);
  });

  window.setTimeout(() => {
    stage.classList.remove("firing");
  }, firingDuration);
}

function getAnchorPoint() {
  const stageBox = stage.getBoundingClientRect();
  const anchorBox = mouthAnchor.getBoundingClientRect();

  return {
    x: anchorBox.left - stageBox.left,
    y: anchorBox.top - stageBox.top,
  };
}

function emitWord(word, anchor, index, total) {
  const element = document.createElement("span");
  const spread = total <= 1 ? 0 : (index / (total - 1) - 0.5) * 2;
  const randomLift = Math.sin(index * 1.9) * 18;
  const travelX = stage.clientWidth * (0.08 + Math.min(index, 5) * 0.035);
  const travelY = spread * stage.clientHeight * 0.18 - stage.clientHeight * 0.05 + randomLift;
  const spin = `${spread * 12 + (index % 2 ? 8 : -8)}deg`;

  element.className = "word-bomb";
  element.textContent = word;
  element.style.setProperty("--start-x", `${anchor.x}px`);
  element.style.setProperty("--start-y", `${anchor.y}px`);
  element.style.setProperty("--travel-x", `${travelX}px`);
  element.style.setProperty("--travel-y", `${travelY}px`);
  element.style.setProperty("--spin", spin);

  blastLayer.append(element);
  element.addEventListener("animationend", () => element.remove());
}

function emitShockwave(anchor) {
  const ring = document.createElement("span");

  ring.className = "shockwave";
  ring.style.setProperty("--start-x", `${anchor.x}px`);
  ring.style.setProperty("--start-y", `${anchor.y}px`);

  blastLayer.append(ring);
  ring.addEventListener("animationend", () => ring.remove());
}

function emitSpeedLines(anchor, index) {
  for (let i = 0; i < 8; i += 1) {
    const line = document.createElement("span");
    const angle = -38 + i * 11 + (index % 2) * 5;

    line.className = "speed-line";
    line.style.setProperty("--start-x", `${anchor.x}px`);
    line.style.setProperty("--start-y", `${anchor.y}px`);
    line.style.setProperty("--angle", `${angle}deg`);
    line.style.setProperty("--line-length", `${stage.clientWidth * (0.28 + i * 0.025)}px`);
    line.style.setProperty("--line-distance", `${stage.clientWidth * 0.08}px`);

    blastLayer.append(line);
    line.addEventListener("animationend", () => line.remove());
  }
}
