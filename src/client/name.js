// The plugin's short name, injected at build time so the same source can be
// built for its own seat (plugman) or to occupy the plugmatic seat — see
// http://plugin.fedwiki.club/view/plugin-upgrade for the seat/occupant path.
// PLUGIN_NAME is an esbuild `define`; under node (tests) it is undefined.
export const NAME = typeof PLUGIN_NAME === 'undefined' ? 'plugman' : PLUGIN_NAME
