export const UNIVERSES = [
  {
    id: "mcu-earth-616",
    name: "Marvel Cinematic Universe — Earth-616",
    earth: "616",
    color: "#e62429",
    description:
      "The primary Marvel Cinematic Universe continuity, including its films, Disney+ series, specials, and connected MCU stories.",
  },
  {
    id: "mcu-multiverse",
    name: "MCU Multiverse",
    earth: "MULTIVERSE",
    color: "#8b5cf6",
    description:
      "Stories and realities that expand the MCU beyond its primary Earth-616 continuity.",
  },
  {
    id: "raimi-spider-man",
    name: "Raimi Spider-Man",
    earth: "96283",
    color: "#b91c1c",
    description: "Sam Raimi's Spider-Man trilogy starring Tobey Maguire.",
  },
  {
    id: "amazing-spider-man",
    name: "The Amazing Spider-Man",
    earth: "120703",
    color: "#2563eb",
    description: "The Amazing Spider-Man continuity starring Andrew Garfield.",
  },
  {
    id: "sony-spider-man-universe",
    name: "Sony Spider-Man Universe",
    earth: "SSU",
    color: "#7c3aed",
    description:
      "Sony's Spider-Man-adjacent live-action universe featuring characters connected to Spider-Man.",
  },
  {
    id: "fox-x-men",
    name: "Fox X-Men Universe",
    earth: "10005",
    color: "#64748b",
    description:
      "The long-running X-Men film continuity produced by 20th Century Fox.",
  },
  {
    id: "wolverine-deadpool",
    name: "Wolverine & Deadpool",
    earth: "MULTIPLE",
    color: "#dc2626",
    description:
      "Wolverine and Deadpool stories spanning the X-Men film continuity and its later multiverse connections.",
  },
  {
    id: "fantastic-four-legacy",
    name: "Legacy Fantastic Four",
    earth: "LEGACY",
    color: "#f59e0b",
    description:
      "Earlier live-action Fantastic Four film continuities outside the modern MCU.",
  },
  {
    id: "marvel-television",
    name: "Marvel Television",
    earth: "TV",
    color: "#0ea5e9",
    description:
      "Marvel Television productions and adjacent series, including the Netflix-era shows and other legacy television stories.",
  },
  {
    id: "marvel-animation",
    name: "Marvel Animation",
    earth: "ANIMATION",
    color: "#10b981",
    description:
      "Marvel animated series and films, including stories that connect to or expand Marvel's wider multiverse.",
  },
];

export function getUniverse(id) {
  return (
    UNIVERSES.find((universe) => universe.id === id) || {
      id,
      name: "Unknown Universe",
      earth: "—",
      color: "#666",
      description: "Universe information is not available.",
    }
  );
}
