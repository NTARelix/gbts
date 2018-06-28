# GBTS - Game Boy Emulator

This is a WIP emulator for the original Nintendo Game Boy, written in TypeScript with minimal run-time dependencies.

I've been following a variety of resources in the following repo to get what I currently have here: https://github.com/avivace/awesome-gbdev

## Features
- `[X]` Webpack development server with hot reload
- `[X]` General hardware architecture
- `[X]` Simple debugging UI (view registers, view RAM at PC, step through instructions, simple breakpoints)
- `[ ]` Ability to load and run bootrom
- `[X]` Implement first ROM bank
- `[ ]` Implement remaining ROM banks
- `[ ]` Implement VRAM
- `[ ]` Implement External RAM
- `[X]` Implement Working RAM
- `[X]` Implement Working RAM mirror
- `[ ]` Implement OAM
- `[ ]` Implement I/O
- `[ ]` Implement Zero-page RAM
- `[X]` Setup CPU fetch-decode-execute cycle
- `[X]` Implement all CPU instructions
- `[ ]` Implement PPU (experiment with WebGL)

More features necessary, but unknown...

## Bells and Whistles
- `[ ]` Save/load state
- `[ ]` Link-cable over web (WebSockets or WebRTC)
- `[ ]` Rewind
- `[ ]` Cheat codes
