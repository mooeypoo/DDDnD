# Presentation Asset Root

This is the canonical asset root for the redesigned UI presentation system.

Categories:

- branding
- ui-surfaces
- scenes
- avatars
- action-effect-icons
- ending-visuals

Reference policy:

- Use src/ui/config/presentation_asset_registry.ts for runtime and Storybook lookups.
- Avoid adding new direct component imports to file paths when a registry key is available.
- Keep presentation assets out of simulation/content domains.
