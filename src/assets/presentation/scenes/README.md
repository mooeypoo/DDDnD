# Scene Background Assets

This folder stores gameplay scene background assets for the UI layer only.

Structure:

- scenario/ for run-level scene backgrounds
- events/ for event illustration assets

Scenario structure:

- One folder per scene background ID
- Use `background.png` or `background.jpg` as the scene image file in each folder

Current scenario IDs:

- fortified_monolith_hall
- strategic_war_room
- archive_library_chamber
- dark_dungeon_room
- medieval_throne_room
- forge_of_heroes

Register runtime usage through src/ui/config/presentation_scene_registry.ts.
