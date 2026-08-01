/**
 * Tiny event bridge for the ⌘K palette.
 *
 * Lives in its own module rather than beside the component so
 * CommandPalette.tsx exports a component and nothing else — mixing the two
 * breaks React Fast Refresh.
 */
export const COMMAND_PALETTE_EVENT = 'open-command-palette';

/** Ask the palette to open, from anywhere, without prop-drilling its state. */
export const openCommandPalette = () =>
  window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_EVENT));
