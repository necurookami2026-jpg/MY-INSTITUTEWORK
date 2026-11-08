"use strict";

function readPreference(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The current page can still use the preference.
  }
}

const root = document.documentElement;
const settingsKey = "all-recursive-institutes.access";
const defaults = {
  contrast: matchMedia("(prefers-contrast: more)").matches,
  motion: matchMedia("(prefers-reduced-motion: reduce)").matches,
};
const settings = { ...defaults, ...readPreference(settingsKey, {}) };
for (const input of document.querySelectorAll("[data-setting]")) {
  const key = input.dataset.setting;
  input.checked = settings[key] === true;
  root.dataset[key] = String(input.checked);
  input.addEventListener("change", () => {
    root.dataset[key] = String(input.checked);
    settings[key] = input.checked;
    savePreference(settingsKey, settings);
  });
}
document.querySelector(".settings").hidden = false;

const followKey = "all-recursive-institutes.followed";
const saved = readPreference(followKey, []);
const follows = new Set(Array.isArray(saved) ? saved : []);
const cards = [...document.querySelectorAll("[data-institute]")];
const search = document.querySelector("#search");
const sector = document.querySelector("#sector");
const following = document.querySelector("#following");

function updateDirectory() {
  if (!search) return;
  const query = search.value.trim().toLocaleLowerCase();
  const showFollowing = following.getAttribute("aria-pressed") === "true";
  let count = 0;
  for (const card of cards) {
    const match = card.dataset.search.includes(query)
      && (!sector.value || card.dataset.sector === sector.value)
      && (!showFollowing || follows.has(card.dataset.institute));
    card.hidden = !match;
    if (match) count++;
  }
  document.querySelector("#count").textContent = count === 1 ? "1 institute" : count + " institutes";
  document.querySelector("#empty").hidden = count !== 0;
}

function updateFollow(button) {
  const followed = follows.has(button.dataset.follow);
  button.setAttribute("aria-pressed", String(followed));
  button.setAttribute("aria-label", (followed ? "Unfollow " : "Follow ") + button.dataset.name);
  button.textContent = followed ? "Following" : "+ Follow";
}

for (const button of document.querySelectorAll("[data-follow]")) {
  updateFollow(button);
  button.hidden = false;
  button.addEventListener("click", () => {
    const key = button.dataset.follow;
    if (follows.has(key)) {
      follows.delete(key);
    } else {
      follows.add(key);
    }
    savePreference(followKey, [...follows]);
    updateFollow(button);
    updateDirectory();
    if (button.closest("[hidden]")) following.focus();
  });
}

if (search) {
  document.querySelector(".filters").hidden = false;
  search.addEventListener("input", updateDirectory);
  sector.addEventListener("change", updateDirectory);
  following.addEventListener("click", () => {
    following.setAttribute("aria-pressed", String(following.getAttribute("aria-pressed") === "false"));
    updateDirectory();
  });
}
