# DDDnD - Domain-Driven Design & Dragons

A humorous simulation game about software architecture decision making using concepts from Domain-Driven Design.

## Project Status

🚧 **MVP Scaffolding Complete** - Core architecture is in place, gameplay implementation in progress.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Run tests with UI
npm test:ui

# Build for production
npm run build
```

## Project Structure

```
content/                    # Authored game content (versioned JSON files)
├── scenarios/
├── scores/
├── stakeholders/
├── stakeholder-reaction-rules/
├── cards/
├── events/
├── delayed-effects/
├── classes/
├── outcome-tiers/
└── outcome-archetypes/

src/
├── app/                    # Application bootstrap and routing
│   ├── bootstrap/
│   ├── router/
│   └── providers/
├── domains/                # Core domain logic (UI-agnostic)
│   ├── content/           # Content loading and validation
│   │   ├── model/
│   │   ├── services/
│   │   └── validation/
│   ├── simulation/        # Game engine (deterministic, pure)
│   │   ├── model/
│   │   ├── services/
│   │   └── rules/
│   ├── persistence/       # Save/load/export
│   │   ├── services/
│   │   └── adapters/
│   └── reporting/         # Summaries and shareable results
│       ├── services/
│       └── formatters/
├── ui/                     # Vue components and presentation
│   ├── components/
│   │   ├── common/
│   │   ├── cards/
│   │   ├── stakeholders/
│   │   ├── scores/
│   │   └── turn/
│   ├── views/
│   ├── layouts/
│   ├── composables/
│   ├── stores/
│   └── styles/
├── shared/                 # Shared utilities and contracts
│   ├── contracts/
│   ├── utils/
│   ├── errors/
│   └── random/
├── App.vue
└── main.ts

tests/                      # Test files mirroring src structure
├── content/
├── simulation/
├── persistence/
└── reporting/
```

## Architecture Principles

### Domain Separation

The codebase is organized into clear domains:

- **content** - Authored game data and validation
- **simulation** - Deterministic game engine (UI-agnostic)
- **persistence** - Save/load/export functionality
- **reporting** - Summaries and shareable results
- **ui** - Vue components and presentation

### Simulation Purity

The simulation domain is **pure and deterministic**:

- ✅ Depends only on scenario bundles and game state
- ✅ Uses seeded random for reproducibility
- ❌ No Vue imports
- ❌ No Pinia imports
- ❌ No browser APIs
- ❌ No localStorage

### UI Boundaries

UI components may:
- ✅ Call simulation engine services
- ✅ Display results
- ❌ Implement gameplay rules
- ❌ Modify simulation behavior

All gameplay logic belongs in `src/domains/simulation`.

## TypeScript Philosophy

TypeScript is used to improve clarity and safety:

- **Strong typing** in simulation, content, persistence, reporting, and shared contracts
- **Light typing** in UI layer
- **Readable** code over clever type gymnastics
- **Explicit** named exports

Avoid advanced type-level programming and unnecessary abstraction.

## Content Philosophy

Content files are:

- **Human readable** - Non-programmers should understand them
- **Versioned** - Use `<id>-v<version>.json` format
- **Explicit** - Use snake_case keys, avoid cryptic identifiers
- **Deterministic** - Same content = same behavior

See [CONTENT_SCHEMA.md](./CONTENT_SCHEMA.md) and [CONTENT_VERSIONING.md](./CONTENT_VERSIONING.md) for details.

## Testing

The project uses Vitest for testing.

Critical areas that must have tests:
- Deterministic turn resolution
- Scenario bundle construction
- Stakeholder rule evaluation
- Delayed effect scheduling
- Export/import round-trip
- Run determinism (same seed + actions = same result)

## Key Documents

- [AGENT.md](./AGENT.md) - Rules for humans and AI agents
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [GAME_DESIGN.md](./GAME_DESIGN.md) - Game design and mechanics
- [CONTENT_SCHEMA.md](./CONTENT_SCHEMA.md) - Content file structure
- [CONTENT_VERSIONING.md](./CONTENT_VERSIONING.md) - Versioning rules

## Tech Stack

- **Vue 3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Vue Router** - Routing
- **Pinia** - State management
- **Vitest** - Testing

## License

TBD
