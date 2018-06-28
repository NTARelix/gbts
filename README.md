# GBTS - Game Boy Emulator

This is a WIP emulator for the original Nintendo Game Boy, written in TypeScript with minimal run-time dependencies.

I've been following a variety of resources in the following repo to get what I currently have here: https://github.com/avivace/awesome-gbdev

## Quickstart
1. `npm install && npm start`
2. Open http://localhost:8080 in browser

## Features
- `[X]` Webpack development server with hot reload
- `[X]` General hardware architecture
- `[X]` Simple debugging UI (view registers, view RAM at PC, step through instructions, simple breakpoints)
- `[ ]` Ability to load and run bootrom
- `[X]` First ROM bank
- `[ ]` Remaining ROM banks
- `[ ]` VRAM
- `[ ]` External RAM
- `[X]` Working RAM
- `[X]` Working RAM mirror
- `[ ]` OAM
- `[ ]` I/O
- `[ ]` Zero-page RAM
- `[X]` CPU fetch-decode-execute cycle
- `[X]` All CPU instructions
- `[ ]` PPU (experiment with WebGL)

More features necessary, but unknown...

## Bells and Whistles
- `[ ]` Save/load state
- `[ ]` Link-cable over web (WebSockets or WebRTC)
- `[ ]` Rewind
- `[ ]` Cheat codes
