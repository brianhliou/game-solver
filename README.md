# game-solver

A retrograde-analysis engine for small combinatorial games, the WASM build of it, and a browser explorer that plays perfectly against the tablebases it produces.

The engine enumerates a game's reachable positions, works backward from the terminal ones, and propagates win/loss/draw until every position has an exact value. Cyclic games (where positions repeat) are handled by a reachable-graph solver rather than plain backward induction, which is what makes the morris family tractable.

**▶ [Open the explorer](https://tablebase.brianhliou.com/)**

## Results

| Game | Result under perfect play | Positions | Notes |
|---|---|---:|---|
| Six men's morris | **Draw** | 42,372,745 | No earlier published solution found (searched 2026-10-17) |
| Six men's morris (flying) | **Draw** | 42,383,945 | |
| Five men's morris | Draw | 17,844,721 | |
| Four men's morris | Draw | 4,111,151 | |
| Three men's morris | First player wins | — | Classical folklore; reproduced here |
| Y (side 6) | First player wins | — | Solved slice-by-slice to fit in memory |
| Tic-tac-toe | Draw | — | Validation target |

No published solution of six men's morris was found in the academic work (Gasser 1993; Gévay and Danner 2014), in the open-source solvers [Malom](https://github.com/ggevay/malom) and [Sanmill](https://github.com/calcitem/Sanmill), which cover nine, twelve and Lasker morris plus Morabaraba but not six, or in a web search on 2026-10-17. Unpublished and non-English work was not searched. The tablebases are published so the result can be checked rather than believed.

**Tablebases: [tablebase-v1 release](https://github.com/brianhliou/game-solver/releases/tag/tablebase-v1)** — `.wld` files with a `.meta.json` each giving the encoding and the win/loss/draw breakdown.

Write-up: [Six Men's Morris Is a Draw](https://brianhliou.com/posts/six-mens-morris/).

## Layout

```
engine/     Rust solver. One module per game under src/games/, binaries under src/bin/.
wasm/       wasm-bindgen wrapper exposing the engine to the browser.
explorer/   Vite app. Queries the tablebases client-side; no server.
```

## Build

The engine is a plain Cargo project:

```bash
cd engine && cargo test && cargo run --release --bin morris_tablebase
```

The explorer depends on the WASM build via a `file:` path, so build that first:

```bash
cd wasm && wasm-pack build --target bundler
cd ../explorer && npm install && npm run build
```

Tablebases land in `engine/artifacts/` and are gitignored; they ship as release assets.

## Provenance

This engine began inside [solved-games](https://github.com/brianhliou/solved-games), a reference registry of solved games, as a way to verify the records rather than take them on faith. It outgrew that role within a day and was split out here with its history intact. The commit that solved six men's morris is preserved with its original date.

## Licence

MIT. See [LICENSE](LICENSE).
