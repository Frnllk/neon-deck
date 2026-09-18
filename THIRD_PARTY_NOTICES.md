# Third-party notices

No third-party code or libraries are included. The only bundled third-party files are the fonts listed here.

## Fonts (SIL Open Font License 1.1)
Subsets of these fonts are bundled in `fonts/`. The full license texts are next to them.

| Font | Copyright | License file |
|---|---|---|
| Unbounded | © 2022 The Unbounded Project Authors | `fonts/OFL-unbounded.txt` |
| JetBrains Mono | © 2020 The JetBrains Mono Project Authors | `fonts/OFL-jetbrainsmono.txt` |
| Pixelify Sans | © 2021 The Pixelify Sans Project Authors | `fonts/OFL-pixelifysans.txt` |

## Online services (used at runtime, nothing is bundled)
- **Open-Meteo** (open-meteo.com): weather and geocoding. The data is licensed CC BY 4.0, with attribution shown in the weather panel. The free API is for non-commercial use.
- **DuckDuckGo icon service** (icons.duckduckgo.com): bookmark favicons. The domains of your bookmarks are sent to fetch the icons.

## Privacy
Everything is stored locally in `browser.storage`. The extension sends only:
- the coordinates of the city you picked, to Open-Meteo;
- the city name you type into the search field in settings, to Open-Meteo;
- bookmark domains, to DuckDuckGo, to fetch favicons.
