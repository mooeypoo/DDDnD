# Stakeholder Avatar Role Assets

This folder stores UI-only stakeholder avatarRole visuals.

Rules:

- avatarRole is presentation-only
- Stakeholder domain entities remain content/simulation data
- Use individual transparent PNG files as implementation assets
- Mood-sheet composites are optional references only

Folder contract:

- One folder per avatarRole ID
- Inside each role folder, file names must be:
	- happy.png
	- neutral.png
	- concerned.png
	- angry.png

Register runtime usage through src/ui/config/presentation_avatar_registry.ts
