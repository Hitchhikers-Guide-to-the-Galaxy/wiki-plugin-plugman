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

## Security model — read before deploying

PlugMan installs and removes npm packages and restarts the server, so its
admin routes are powerful. Understand the trust boundary before running it on
any farm that other people can reach.

- **Admin = host code execution.** `install`/`update` run `npm install`, and npm
  runs a package's install scripts. The `wiki-plugin-`/`wiki-security-` prefix is
  a naming convention, **not** a security boundary — anyone can publish a
  malicious `wiki-plugin-*` to npm. So whoever can pass the `isAdmin` check can
  run code on the server as the wiki user. **Treat the admin secret as root on
  that host** and give it only to people you would give a shell.
- **Safe by default.** With the default (no-security) module, `isAdmin` is always
  false, so every mutating route returns 403 — PlugMan is inventory-only until a
  security module and an admin secret are configured. Ordinary farm members
  (non-admins) can never install, uninstall, or restart.
- **Admin-gated (writes + npm-spawning):** `install`, `update`, `uninstall`,
  `restart`, `remote/install`, `remote/uninstall`, `remote/restart`, and the
  npm-spawning `view`/`status` reads.
- **Unauthenticated (read-only):** `plugins`, `sitemap.json`, `page/:slug.json`,
  `file/.../slug/...`, `ready`, and the remote **reads** `remote/status` /
  `remote/ready` (which only proxy information the remote already serves
  publicly, bounded by the loopback/link-local guard and a timeout). These
  reveal the installed plugin inventory and versions — fingerprinting
  information. Do not expose an admin-configured farm to untrusted networks
  without a reverse proxy / rate limiting in front.
- **Remote farms** are reached only by an admin, secrets live in
  `~/.wiki-plugman/secrets.json` (**you must `chmod 600` it**), are scoped per
  domain, and are never returned in a response. Loopback and link-local targets
  (localhost, `169.254.169.254`) are blocked; LAN and public farms are allowed,
  so an admin can still reach internal hosts — a deliberate SSRF surface.

See the full audit at plugin.fedwiki.club (linked from the About page).

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
