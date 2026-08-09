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

## Restarting the server

PlugMan's `restart` route needs the server process to come back up. How that
happens depends on the host, configured with a `plugman_restart` key in the
wiki config (or a `PLUGMAN_RESTART` env var). If neither is set, PlugMan falls
back to `process.exit(0)` and relies on a supervisor to relaunch — correct on
hosts that have one, fatal on a bare laptop farm that does not.

- **Local laptop farm (no supervisor):** use a port-based restart, not a
  `pgrep`-based one. When the farm spawns its own restarter, macOS `pgrep`
  cannot see the parent farm process from the detached child, so
  `wiki-start --restart` starts a colliding second farm that dies on
  `EADDRINUSE`. Key on the port instead:

      plugman_restart = "kill $(lsof -ti tcp:4242) 2>/dev/null; \
        for i in $(seq 1 20); do lsof -ti tcp:4242 >/dev/null 2>&1 || break; sleep 0.5; done; \
        kill -9 $(lsof -ti tcp:4242) 2>/dev/null; sleep 1; wiki-start"

- **systemd host (e.g. a Pi):** `process.exit(0)` works if the unit is
  `Restart=always`; otherwise set
  `plugman_restart = "systemctl --user restart federated-wiki.service"`.

- **Docker / Co-op Cloud (Wiki Café):** the container is `Restart=always`, so
  the fallback `process.exit(0)` restarts it — no config needed. To restart it
  from another host, use the SSH command from the wiki-server-restart runbook:
  `ssh restarter@<host> 'sudo docker restart $(sudo docker ps -q -f name=^hitchhikers_earth_app)'`.

The client waits for the restart to land by polling `/plugin/plugman/ready`
until the reported `pid` changes — the old process can keep answering during
the kill window, so a plain 200 is not proof the restart took.

## Provenance

Cloned from `wiki-plugin-plugmatic` v1.5.1 (fedwiki/wiki-plugin-plugmatic) by
Claude Code working with David Bovill. Original authors retained in AUTHORS.txt.

## License

MIT
