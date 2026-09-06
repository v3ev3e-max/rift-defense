import { heroById, buildNames } from "../data/heroes";
import type { Hero, SaveData } from "../data/types";
const paths: Record<string, string> = {
  home: "M3 10 12 3l9 7v10h-6v-6H9v6H3z",
  hero: "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21v-4c0-6 16-6 16 0v4",
  deck: "M4 4h6v7H4zM14 4h6v7h-6zM4 15h6v6H4zM14 15h6v6h-6z",
  battle: "m5 3 14 14M16 16l5 5M14 20l6-6M19 3 5 17M8 16l-5 5M10 20l-6-6",
  shop: "M4 8h16l-1 13H5zM8 8V5a4 4 0 0 1 8 0v3",
  settings:
    "M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  bolt: "m14 2-9 12h7l-2 8 9-13h-7z",
  shield: "M12 2 3 6v7c0 4 9 9 9 9s9-5 9-9V6z",
  pause: "M8 4v16M16 4v16",
  play: "m7 3 14 9-14 9z",
  merge: "M5 20v-4l7-6 7 6v4M12 3v11m-5-6 5-5 5 5",
  science: "M9 3h6M10 3v7l-6 9v2h16v-2l-6-9V3M7 16h10",
  close: "m5 5 14 14M19 5 5 19",
  check: "m4 12 5 5L20 6",
  coin: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M15 8h-5l-1 4h5l-1 4H8",
  gem: "m12 2 9 8-9 12L3 10zM3 10h18M12 2 8 10l4 12 4-12z",
  sound: "M3 9h4l5-5v16l-5-5H3zM16 8c3 2 3 6 0 8M19 5c5 4 5 10 0 14",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 10v7M12 7v1",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v6l4 2",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
};
export const icon = (name: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] ?? paths.bolt}"/></svg>`;
export const portrait = (id: string, cls = "") =>
  `<img class="pixel-hero ${cls}" src="/assets/heroes/${id}.svg" alt="${heroById[id].name}" draggable="false"/>`;
export const num = (v: number) => Math.floor(v).toLocaleString("ko-KR");
export const time = (v: number) =>
  `${Math.floor(v / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(v % 60)
    .toString()
    .padStart(2, "0")}`;
export function heroCard(
  h: Hero,
  save: SaveData,
  selected = false,
  mode = "hero",
) {
  return `<button class="hero-card ${h.rarity} ${selected ? "selected" : ""}" style="--hero-color:${h.color}" data-action="${mode}" data-id="${h.id}" title="${h.name} · ${h.role} · ${h.skill}"><span class="card-top"><small>${h.code}</small><span>${mode === "toggle-deck" ? (selected ? icon("check") : "+") : h.rarity.toUpperCase()}</span></span><div class="card-portrait">${portrait(h.id)}<span class="card-cross">+</span></div><div class="card-bottom"><b>${h.name}</b><span>Lv.${save.heroes[h.id].level}</span></div><small class="card-role">${h.role} <span>· ${buildNames[h.build]}</span></small></button>`;
}
export const button = (
  label: string,
  action: string,
  cls = "",
  ic = "",
  extra = "",
) =>
  `<button class="btn ${cls}" data-action="${action}" ${extra}>${ic ? icon(ic) : ""}<span>${label}</span></button>`;
export const esc = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ]!,
  );
