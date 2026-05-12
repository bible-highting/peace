const form = document.querySelector("#sentenceForm");
const input = document.querySelector("#sentenceInput");
const backgroundInput = document.querySelector("#backgroundInput");
const backgroundUrlInput = document.querySelector("#backgroundUrlInput");
const fallbackArt = document.querySelector("#fallbackArt");
const characterFace = document.querySelector("#characterFace");
const characterOptions = document.querySelectorAll(".character-option");
const versionOptions = document.querySelectorAll(".version-option");
const game = document.querySelector(".game");
const stage = document.querySelector("#stage");
const blastLayer = document.querySelector("#blastLayer");
const mouthAnchor = document.querySelector("#mouthAnchor");
const pinMarker = document.querySelector("#pinMarker");
const pinHelp = document.querySelector("#pinHelp");

const sampleWords = ["꽝!", "꽝!", "꽝!"];
const pinDescriptions = {
  unset: "배경을 넣은 뒤, 스테이지에서 소리가 시작될 위치를 탭해서 핀을 옮기세요.",
  default: "기본 핀이 놓여 있어요. 이미지에서 입 위치를 탭하면 바로 그 지점으로 옮길 수 있어요.",
  set: "핀 위치가 설정됐어요. 다른 곳을 탭하면 바로 발사 시작점이 바뀝니다.",
};
const state = {
  mode: "classic",
  customAnchor: null,
  customAnchorPinned: false,
  customBackgroundUrl: "",
  customBackgroundSource: "",
};

clearVolatileInputs();
setCharacter("default");
setMode("classic");

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

  if (state.customBackgroundUrl) {
    releaseCustomBackground();
  }

  state.customBackgroundUrl = URL.createObjectURL(file);
  state.customBackgroundSource = "file";
  backgroundUrlInput.value = "";
  syncCustomBackground();
});

backgroundUrlInput.addEventListener("change", syncBackgroundUrlInput);
backgroundUrlInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  syncBackgroundUrlInput();
  backgroundUrlInput.blur();
});

characterOptions.forEach((option) => {
  option.addEventListener("click", () => {
    setCharacter(option.dataset.character);
  });
});

versionOptions.forEach((option) => {
  option.addEventListener("click", () => {
    setMode(option.dataset.version);
  });
});

stage.addEventListener("click", (event) => {
  if (state.mode !== "custom") {
    return;
  }

  const rect = stage.getBoundingClientRect();
  const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
  const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);

  state.customAnchor = {
    x: x / rect.width,
    y: y / rect.height,
  };
  state.customAnchorPinned = true;

  renderPin();
  pinHelp.textContent = pinDescriptions.set;
});

window.addEventListener("pageshow", clearVolatileInputs);
window.addEventListener("pagehide", clearVolatileInputs);
window.addEventListener("beforeunload", clearVolatileInputs);
window.addEventListener("resize", renderPin);
window.addEventListener("beforeunload", releaseCustomBackground);

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

function setCharacter(character) {
  characterFace.className = `fallback-face character-${character}`;
  characterOptions.forEach((item) => item.classList.toggle("is-active", item.dataset.character === character));
}

function setMode(mode) {
  state.mode = mode;
  game.dataset.mode = mode;
  versionOptions.forEach((item) => item.classList.toggle("is-active", item.dataset.version === mode));
  stage.classList.toggle("is-pinnable", mode === "custom");

  if (mode === "custom" && !state.customAnchor) {
    state.customAnchor = { x: 0.6, y: 0.55 };
    state.customAnchorPinned = false;
  }

  pinHelp.textContent = getPinHelpText();
  syncCustomBackground();
  renderPin();
}

function getPinHelpText() {
  if (!state.customAnchor) {
    return pinDescriptions.unset;
  }

  return state.customAnchorPinned ? pinDescriptions.set : pinDescriptions.default;
}

function syncCustomBackground() {
  const shouldShowCustomBackground = state.mode === "custom" && Boolean(state.customBackgroundUrl);

  if (shouldShowCustomBackground) {
    fallbackArt.style.setProperty("--custom-bg", `url("${state.customBackgroundUrl}")`);
    fallbackArt.classList.add("has-custom-bg");
    return;
  }

  fallbackArt.classList.remove("has-custom-bg");
  fallbackArt.style.removeProperty("--custom-bg");
}

function renderPin() {
  const hasVisiblePin = state.mode === "custom" && state.customAnchor && !stage.classList.contains("firing");

  pinMarker.classList.toggle("is-visible", Boolean(hasVisiblePin));

  if (!hasVisiblePin) {
    return;
  }

  pinMarker.style.setProperty("--pin-x", `${state.customAnchor.x * 100}%`);
  pinMarker.style.setProperty("--pin-y", `${state.customAnchor.y * 100}%`);
}

function releaseCustomBackground() {
  if (!state.customBackgroundUrl) {
    return;
  }

  if (state.customBackgroundSource === "file") {
    URL.revokeObjectURL(state.customBackgroundUrl);
  }

  state.customBackgroundUrl = "";
  state.customBackgroundSource = "";
}

function syncBackgroundUrlInput() {
  const nextUrl = backgroundUrlInput.value.trim();

  if (!nextUrl) {
    return;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(nextUrl);
  } catch {
    backgroundUrlInput.setCustomValidity("이미지 주소를 https://로 시작하는 전체 링크로 넣어주세요.");
    backgroundUrlInput.reportValidity();
    return;
  }

  if (parsedUrl.protocol !== "https:") {
    backgroundUrlInput.setCustomValidity("https:// 이미지 링크만 사용할 수 있어요.");
    backgroundUrlInput.reportValidity();
    return;
  }

  backgroundUrlInput.setCustomValidity("");
  releaseCustomBackground();
  backgroundInput.value = "";
  state.customBackgroundUrl = parsedUrl.href;
  state.customBackgroundSource = "url";
  syncCustomBackground();
}

function fireWords(words) {
  blastLayer.replaceChildren();
  stage.classList.remove("shake", "firing");
  void stage.offsetWidth;
  stage.classList.add("shake", "firing");
  renderPin();

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
    renderPin();
  }, firingDuration);
}

function getAnchorPoint() {
  if (state.mode === "custom" && state.customAnchor) {
    return {
      x: stage.clientWidth * state.customAnchor.x,
      y: stage.clientHeight * state.customAnchor.y,
    };
  }

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
