# PlugMan Plugin

A plugin manager for [Federated Wiki](http://fed.wiki.org). PlugMan lists the
plugins a server should run, shows their install/published status, and — as an
admin — installs, updates, and (soon) uninstalls them, then restarts the server.

PlugMan **began life as an explicit clone of [Plugmatic](https://github.com/fedwiki/wiki-plugin-plugmatic)
v1.5.1** by Ward Cunningham. It keeps Plugmatic's markup (the same `NAME`,
`STATUS`, `BROWSE`, `wiki-plugin-*` lines) and reveals the same routes, and it
can occupy the `plugmatic` seat via the Federated Wiki plugin-upgrade path so
existing plugmatic items keep working. From there it grows features Plugmatic
lacks — Update All, remote farms, uninstall, and security-plugin support.

## Markup

Add a PlugMan item and give it lines. Keywords choose report columns
(`STATUS NAME MENU PAGES SERVICE BUNDLED INSTALLED PUBLISHED`), `BROWSE` shows
the catalogue, and a bare `wiki-plugin-name` (or `wiki-security-name`) line
inventories that package.

## Provenance

Cloned from `wiki-plugin-plugmatic` v1.5.1 (fedwiki/wiki-plugin-plugmatic) by
Claude Code working with David Bovill. Original authors retained in AUTHORS.txt.

## License

MIT
