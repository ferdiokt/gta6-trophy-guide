# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/ferdiokt/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/ferdiokt/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Ledger** is an offline guide and tracker for all 55 Grand Theft Auto VI trophies on PS5 (1 platinum, 2 gold, 6 silver, 46 bronze). It is unofficial and has no affiliation with Rockstar Games.

- **Checklist.** Every trophy has its official name, description and grade. Progress (earned with timestamps, counters such as 184/250 stunts) is saved in `localStorage`.
- **Filters.** Story, Missable, Collectibles, Activities, Strangers and Crime. The Online filter shows 0, because the official list has no online trophies. There is also a progress filter (all, to do, earned) and search.
- **Spoiler shield.** It is on by default and saved. Every unearned story trophy and every trophy PlayStation hides (28) shows only "Hidden trophy", its grade and kind, with its guide collapsed. That holds in search and in the roadmap too. Each has a Reveal button, and marking a trophy earned reveals it.
- **Cited guides.** Every step of every guide is written in our own words, with its source linked beside it. Every trophy cites at least two independent sites (47 cite two, 8 cite three): PowerPyx, GTABase, PSNProfiles, PSN 100%, GamesRadar, GameSpot, Push Square, PlayStationTrophies.org, TrueAchievements, Gamer Social Club, HeistAtlas and GAMES.GG.
- **Missable verdicts.** Each of the 55 trophies has a verdict read from its official description and the cited guides, with the chapter it depends on and its sources: 1 missable (Positive Mental Attitude: the Chapter 1 balcony meditation), 2 unconfirmed (Bad Luck, I Guess and The Truth Is Out There) and 52 not missable, each with a one-line reason.
- **Data check.** A panel beside the list counts `data/trophies.json` live against PlayStation's published totals (55 = 1 platinum + 2 gold + 6 silver + 46 bronze, 28 hidden), plus sources per trophy, missable verdicts and the filter counts.
- **Platinum roadmap.** Six stages in play order, each sorted by the chapter its trophies open in, with grade and target count (×18, ×100) on every line. Above them sits a missable strip giving each risky trophy's chapter, the reason and its sources.
- **Export / Import / Reset.** Export writes a versioned JSON file. Import validates it (rejecting bad JSON and reporting unknown names), then shows a summary such as "41 earned, 2 ignored" in a side panel beside the list, with Merge or Replace. Reset asks for confirmation first.

The app is static files in `app/`: no build step, no CDN, no network at run time. Fonts are Anybody and Archivo (SIL OFL), vendored as woff2 files. `main.ts` checks the trophy file and the screenshots, then hands in `app/`, `screenshots/` and `dossier.json`.

## Run it

```sh
node serve.ts                      # then open http://localhost:8080 (any static server with app/ as root works)
node --test test/                  # progress file rules (round trip, bad JSON, unknown names, merge, spoiler search) and the data check
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # Node 22.18+
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
