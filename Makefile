# Optional overrides; otherwise discover global skill destinations automatically.
INSTALL_DEST_ORIGIN := $(origin DEST)
GLOBAL_DESTS ?=
FORCE ?= 0
COLOR ?= auto
export COLOR
.DEFAULT_GOAL := help
# Local open-source Backstage instance for trying skill output.
BACKSTAGE_HOME ?= $(CURDIR)/.backstage
BACKSTAGE_APP_PORT ?= 3000
BACKSTAGE_BACKEND_PORT ?= 7007
# Colon-separated catalog descriptor files to load as `file` locations.
CATALOG_FILES_ORIGIN := $(origin CATALOG_FILES)
CATALOG_FILES ?=
BACKSTAGE_NODE_VERSION ?= 24
export DEST GLOBAL_DESTS FORCE BACKSTAGE_HOME BACKSTAGE_APP_PORT BACKSTAGE_BACKEND_PORT CATALOG_FILES BACKSTAGE_NODE_VERSION

# Selects a Backstage-supported Node (current, nvm, or asdf) and a Yarn shim.
BACKSTAGE_ENV = node_bin=$$(sh "$(CURDIR)/scripts/backstage-node.sh"); \
	export PATH="$$node_bin:$$PATH"; \
	$(BACKSTAGE_HOME_ENV); \
	export COREPACK_HOME="$$BACKSTAGE_HOME/tools/corepack" \
	COREPACK_ENABLE_DOWNLOAD_PROMPT=0 YARN_ENABLE_TELEMETRY=0 \
	PATH="$$BACKSTAGE_HOME/tools/bin:$$node_bin:$$PATH"; \
	echo "Using Node $$(node -v) from $$node_bin"

# Skills that were renamed, as old=new. install and update remove an old
# copy only when it is a real directory whose SKILL.md carries the old name
# and this repository's author, so a user's own skill of that name is kept.
RENAMED_SKILLS = doc-author=documentation-author
SKILL_AUTHOR = gautampachnanda101

BACKSTAGE_HOME_ENV = BACKSTAGE_HOME=$$(node "$(CURDIR)/scripts/backstage-home.cjs" resolve "$$BACKSTAGE_HOME" "$(CURDIR)"); \
	export BACKSTAGE_HOME

.PHONY: help install install-global update status _install backstage-setup backstage-config backstage backstage-backend backstage-clean backstage-github skill-smoke skill-techdocs skill-llm-verify skill-evals skill-agent-evals hooks-install hooks-check

help:
	@set -eu; \
	case "$$COLOR" in auto|always|never) ;; \
		*) echo 'COLOR must be auto, always, or never.' >&2; exit 1;; esac; \
	cyan=''; green=''; yellow=''; reset=''; \
	if [ -z "$${NO_COLOR:-}" ] && { [ "$$COLOR" = always ] || \
		{ [ "$$COLOR" = auto ] && [ -t 1 ] && [ "$${TERM:-dumb}" != dumb ]; }; }; then \
		cyan=$$(printf '\033[1;36m'); green=$$(printf '\033[32m'); \
		yellow=$$(printf '\033[33m'); reset=$$(printf '\033[0m'); \
	fi; \
	heading() { printf '\n%b%s%b\n' "$$cyan" "$$1" "$$reset"; }; \
	entry() { printf '  %b%-25s%b %s\n' "$$green" "$$1" "$$reset" "$$2"; }; \
	note() { printf '  %b%s%b\n' "$$yellow" "$$1" "$$reset"; }; \
	heading 'Agent skills - make help'; \
	printf 'Usage: make <target> [VARIABLE=value ...]\n'; \
	heading 'Install globally'; \
	entry 'install' 'Install all skills in every supported assistant global directory.'; \
	entry 'install-global' 'Alias for install; no project-local copies by default.'; \
	entry 'update' 'Replace installed copies everywhere (equivalent to install FORCE=1).'; \
	entry 'status' 'Compare installed skill versions against the checked-out source.'; \
	note 'Existing copies are protected. Use FORCE=1 to replace them.'; \
	heading 'Contributor checks'; \
	entry 'hooks-install' 'Enable repository pre-commit checks, preserving existing Git hooks.'; \
	entry 'hooks-check' 'Run pre-commit checks on all tracked files.'; \
	entry 'skill-smoke' 'Run the bundled descriptor and TechDocs checkers over fixtures and this repository.'; \
	entry 'skill-techdocs' 'Run the bundled TechDocs/MkDocs checker over fixtures and this repository.'; \
	entry 'skill-llm-verify' 'Run the skill evals with a local llama.cpp model and a without-skill baseline benchmark.'; \
	entry 'skill-evals' 'Grade every skill against its evals with the model in SKILL_EVAL_CMD.'; \
	entry 'skill-agent-evals' 'Run behaviour evals with an assistant: AGENT=claude-code|openai [MODEL=] [BASE_URL=].'; \
	heading 'Local Backstage'; \
	entry 'backstage' 'Set up if needed, then start the UI and backend. Ctrl+C stops them.'; \
	entry 'backstage-backend' 'Start only the backend and catalog API.'; \
	entry 'backstage-setup' 'Scaffold the app and install dependencies without starting it.'; \
	entry 'backstage-config' 'Regenerate local config with fixtures and repository file locations.'; \
	entry 'backstage-github' 'Install GitHub discovery for the public backstage/backstage test.'; \
	entry 'backstage-clean' 'Delete marked BACKSTAGE_HOME, including its app and local clones.'; \
	note 'Default locations include this repo and root descriptors in BACKSTAGE_HOME/repos/.'; \
	heading 'Options'; \
	entry 'FORCE=1' 'Replace installed skill copies (default: 0).'; \
	entry 'DEST=path' 'Optional single skills directory override.'; \
	entry 'GLOBAL_DESTS=a:b' 'Optional colon-separated global skills directory overrides.'; \
	entry 'BACKSTAGE_HOME=path' 'App/tools/clone directory (default: .backstage in this repo).'; \
	entry 'BACKSTAGE_APP_PORT=3000' 'UI port (default: 3000).'; \
	entry 'BACKSTAGE_BACKEND_PORT=7007' 'Backend port (default: 7007).'; \
	entry 'BACKSTAGE_NODE_VERSION=24' 'Node version to select through nvm/asdf when needed.'; \
	entry 'CATALOG_FILES=a.yaml:b.yaml' 'Override automatic repo locations; base fixtures remain loaded.'; \
	entry 'COLOR=auto|always|never' 'Help colours; auto uses a terminal, NO_COLOR disables them.'; \
	heading 'Credentials (environment only)'; \
	entry 'BACKSTAGE_TOKEN' 'Optional static Backstage API/MCP token; never pass its value to make.'; \
	entry 'GITHUB_DISCOVERY_TOKEN' 'Required to enable authenticated GitHub discovery.'; \
	heading 'Examples'; \
	printf '%s\n' \
		'  make install' \
		'  make update' \
		'  make status' \
		'  make backstage' \
		'  make backstage BACKSTAGE_APP_PORT=3001' \
		'  make backstage CATALOG_FILES="/path/to/repo/catalog-info.yaml"' \
		'  make help COLOR=never'; \
	heading 'Local URLs (default ports)'; \
	printf '%s\n' \
		'  UI:      http://localhost:3000/catalog' \
		'  Catalog: http://localhost:7007/api/catalog' \
		'  MCP:     http://localhost:7007/api/mcp-actions/v1' \
		'  More setup and authentication guidance: README.md'

backstage-setup:
	@set -eu; $(BACKSTAGE_ENV); \
	if ! command -v yarn >/dev/null; then \
		mkdir -p "$$BACKSTAGE_HOME/tools/bin"; \
		npx -y corepack@latest enable --install-directory "$$BACKSTAGE_HOME/tools/bin"; \
	fi; \
	if [ ! -f "$$BACKSTAGE_HOME/app/package.json" ]; then \
		mkdir -p "$$BACKSTAGE_HOME"; \
		BACKSTAGE_APP_NAME=backstage npx -y @backstage/create-app@latest --skip-install --path "$$BACKSTAGE_HOME/app"; \
	fi; \
	cd "$$BACKSTAGE_HOME/app"; \
	yarn install; \
	node -p process.versions.modules > .node-abi; \
	node "$(CURDIR)/scripts/backstage-home.cjs" mark "$$BACKSTAGE_HOME" "$(CURDIR)"

# Installs missing dependencies, or rebuilds native modules after a Node ABI change.
BACKSTAGE_DEPS = cd "$$BACKSTAGE_HOME/app"; \
	abi=$$(node -p process.versions.modules); \
	if [ ! -d node_modules ]; then \
		yarn install; echo "$$abi" > .node-abi; \
	elif [ "$$(cat .node-abi 2>/dev/null)" != "$$abi" ]; then \
		echo "Node ABI changed; rebuilding native modules..."; \
		yarn rebuild; echo "$$abi" > .node-abi; \
	fi

# Keep optional plugin configuration separate from regenerated local settings.
BACKSTAGE_CONFIG_ARGS = set --; \
	if [ -f app-config.github.yaml ]; then \
		if [ -n "$${GITHUB_DISCOVERY_TOKEN:-}" ]; then \
			set -- --config "$$BACKSTAGE_HOME/app/app-config.yaml" \
				--config "$$BACKSTAGE_HOME/app/app-config.local.yaml" \
				--config "$$BACKSTAGE_HOME/app/app-config.github.yaml"; \
		else \
			echo 'GitHub discovery disabled: set GITHUB_DISCOVERY_TOKEN to enable its authenticated GraphQL provider.' >&2; \
		fi; \
	fi

backstage-github:
	@set -eu; $(BACKSTAGE_HOME_ENV); \
	[ -f "$$BACKSTAGE_HOME/app/package.json" ] || $(MAKE) --no-print-directory backstage-setup; \
	$(BACKSTAGE_ENV); $(BACKSTAGE_DEPS); \
	yarn workspace backend add @backstage/plugin-catalog-backend-module-github@0.14.2; \
	node "$(CURDIR)/scripts/backstage-github.cjs" "$$BACKSTAGE_HOME/app"; \
	echo 'Restart make backstage with GITHUB_DISCOVERY_TOKEN in the environment to activate organization discovery.'

backstage-config:
	@set -eu; $(BACKSTAGE_HOME_ENV); \
	[ -f "$$BACKSTAGE_HOME/app/package.json" ] || $(MAKE) --no-print-directory backstage-setup; \
	cfg="$$BACKSTAGE_HOME/app/app-config.local.yaml"; \
	{ \
		echo '# Generated by `make backstage`; edits are overwritten.'; \
		echo 'app:'; \
		echo "  baseUrl: http://localhost:$$BACKSTAGE_APP_PORT"; \
		echo '  extensions:'; \
		echo '    # Demo widget that calls an external joke API; fails offline or behind proxies.'; \
		echo '    - home-page-widget:home/random-joke: false'; \
		echo 'backend:'; \
		echo "  baseUrl: http://localhost:$$BACKSTAGE_BACKEND_PORT"; \
		echo '  listen:'; \
		echo "    port: $$BACKSTAGE_BACKEND_PORT"; \
		echo '  cors:'; \
		echo "    origin: http://localhost:$$BACKSTAGE_APP_PORT"; \
		if [ -n "$${BACKSTAGE_TOKEN:-}" ]; then \
			echo '  auth:'; \
			echo '    externalAccess:'; \
			echo '      - type: static'; \
			echo '        options:'; \
			echo '          token: $${BACKSTAGE_TOKEN}'; \
			echo '          subject: local-catalog-token'; \
		fi; \
		echo 'catalog:'; \
		echo '  rules:'; \
		echo '    - allow: [Component, System, API, Resource, Location, Domain, Group, User, Template]'; \
		echo '  locations:'; \
		files="$(CURDIR)/skills/backstage-catalog-builder/tests/fixtures/backstage-instance/catalog-info.yaml"; \
		if [ "$(CATALOG_FILES_ORIGIN)" = undefined ]; then \
			for descriptor in "$(CURDIR)/catalog-info.yaml" "$$BACKSTAGE_HOME"/repos/*/catalog-info.yaml; do \
				[ -f "$$descriptor" ] || continue; \
				files="$$files:$$descriptor"; \
			done; \
		elif [ -n "$$CATALOG_FILES" ]; then \
			files="$$files:$$CATALOG_FILES"; \
		fi; \
		IFS=':'; for f in $$files; do \
			[ -n "$$f" ] || continue; \
			case "$$f" in /*) ;; *) f="$(CURDIR)/$$f";; esac; \
			[ -f "$$f" ] || { echo "Catalog file not found: $$f" >&2; exit 1; }; \
			echo '    - type: file'; \
			escaped=$$(printf '%s' "$$f" | sed "s/'/''/g"); \
			printf "      target: '%s'\n" "$$escaped"; \
		done; \
	} > "$$cfg.tmp"; \
	mv "$$cfg.tmp" "$$cfg"; \
	echo "Wrote $$cfg"

backstage: backstage-config
	@set -eu; $(BACKSTAGE_ENV); $(BACKSTAGE_DEPS); $(BACKSTAGE_CONFIG_ARGS); \
	echo "Backstage: http://localhost:$$BACKSTAGE_APP_PORT  API: http://localhost:$$BACKSTAGE_BACKEND_PORT/api/catalog" && \
	yarn start "$$@"

backstage-backend: backstage-config
	@set -eu; $(BACKSTAGE_ENV); $(BACKSTAGE_DEPS); $(BACKSTAGE_CONFIG_ARGS); \
	echo "Catalog API: http://localhost:$$BACKSTAGE_BACKEND_PORT/api/catalog" && \
	yarn workspace backend start "$$@"

backstage-clean:
	@node "$(CURDIR)/scripts/backstage-home.cjs" clean "$$BACKSTAGE_HOME" "$(CURDIR)"

hooks-install:
	@pre-commit validate-config
	@node scripts/install-hooks.cjs

hooks-check:
	@pre-commit run --all-files

skill-smoke: skill-techdocs
	@node skills/backstage-catalog-builder/scripts/check-descriptors.mjs \
		skills/backstage-catalog-builder/tests/fixtures/descriptors/catalog-valid.yaml \
		skills/backstage-catalog-builder/tests/fixtures/techdocs/single/catalog-info.yaml \
		skills/backstage-catalog-builder/tests/fixtures/techdocs/monorepo/packages/alpha/catalog-info.yaml \
		skills/backstage-catalog-builder/tests/fixtures/techdocs/monorepo/packages/bravo/catalog-info.yaml \
		skills/backstage-catalog-builder/tests/fixtures/techdocs/aggregate/catalog-info.yaml \
		skills/backstage-catalog-builder/tests/fixtures/backstage-instance/catalog-info.yaml \
		catalog-info.yaml && \
	echo 'Structural checks passed. To confirm ingestion in a local catalog, run:' && \
	echo '  make backstage CATALOG_FILES="$(CURDIR)/skills/backstage-catalog-builder/tests/fixtures/descriptors/catalog-valid.yaml"'

skill-techdocs:
	@node skills/backstage-catalog-builder/scripts/check-techdocs.mjs \
		catalog-info.yaml \
		skills/backstage-catalog-builder/tests/fixtures/techdocs/single/catalog-info.yaml \
		skills/backstage-catalog-builder/tests/fixtures/techdocs/monorepo/packages/alpha/catalog-info.yaml \
		skills/backstage-catalog-builder/tests/fixtures/techdocs/monorepo/packages/bravo/catalog-info.yaml \
		skills/backstage-catalog-builder/tests/fixtures/techdocs/aggregate/catalog-info.yaml

skill-llm-verify:
	@LLM_CACHE="$(CURDIR)/.llm-cache" sh "$(CURDIR)/skills/backstage-catalog-builder/scripts/skill-llm-verify.sh"

skill-evals:
	@node "$(CURDIR)/scripts/skill-evals.mjs" $(if $(SKILL),--skill $(SKILL)) $(if $(RUNS),--runs $(RUNS))

# Behaviour evals run an assistant with tools, so they call a model: run them
# locally, never in CI. AGENT=openai works with llama.cpp or Ollama for free.
skill-agent-evals:
	@node "$(CURDIR)/scripts/agent-evals.mjs" --agent "$(AGENT)" $(if $(MODEL),--model "$(MODEL)") $(if $(BASE_URL),--base-url "$(BASE_URL)") $(if $(SKILL),--skill $(SKILL)) $(if $(RUNS),--runs $(RUNS)) $(if $(RECORD),--record)

install:
	@set -eu; \
	if [ "$(INSTALL_DEST_ORIGIN)" != undefined ]; then \
		destinations="$$DEST"; \
	elif [ -n "$$GLOBAL_DESTS" ]; then \
		destinations="$$GLOBAL_DESTS"; \
	else \
		destinations=$$(sh "$(CURDIR)/scripts/skill-destinations.sh"); \
	fi; \
	$(MAKE) --no-print-directory _install DESTS="$$destinations"

install-global: install

update:
	@set -eu; \
	if [ -n "$$DEST" ]; then dests="$$DEST"; \
	elif [ -n "$$GLOBAL_DESTS" ]; then dests="$$GLOBAL_DESTS"; \
	else dests=$$(sh "$(CURDIR)/scripts/skill-destinations.sh"); fi; \
	FORCE=1 $(MAKE) --no-print-directory _install DESTS="$$dests"

# Compares each installed skill copy against the checked-out source by
# SKILL.md metadata.version so users can see drift before running make update.
status:
	@set -eu; \
	if [ -n "$$DEST" ]; then dests="$$DEST"; \
	elif [ -n "$$GLOBAL_DESTS" ]; then dests="$$GLOBAL_DESTS"; \
	else dests=$$(sh "$(CURDIR)/scripts/skill-destinations.sh"); fi; \
	for entry in skills/*/SKILL.md; do \
		[ -f "$$entry" ] || continue; \
		src="$${entry%/SKILL.md}"; \
		name="$${src#skills/}"; \
		src_version=$$(sed -n "s/^  version: \"\([^\]*\)\"$$/\1/p" "$$src/SKILL.md" | head -n 1); \
		printf "%s: source %s\n" "$$name" "$$src_version"; \
		IFS=":"; \
		for dest in $$dests; do \
			[ -n "$$dest" ] || continue; \
			dest_file="$$dest/$$name/SKILL.md"; \
			if [ ! -f "$$dest_file" ]; then \
				printf "  %-46s not installed\n" "$$dest/$$name"; \
			else \
				inst=$$(sed -n "s/^  version: \"\([^\]*\)\"$$/\1/p" "$$dest_file" | head -n 1); \
				if [ "$$inst" = "$$src_version" ]; then \
					printf "  %-46s up to date\n" "$$dest/$$name"; \
				else \
					printf "  %-46s installed %s\n" "$$dest/$$name" "$$inst"; \
				fi; \
			fi; \
		done; \
	done; \
	IFS=" "; \
	for pair in $(RENAMED_SKILLS); do \
		old="$${pair%%=*}"; new="$${pair#*=}"; \
		IFS=":"; \
		for dest in $$dests; do \
			[ -f "$$dest/$$old/SKILL.md" ] || continue; \
			printf "%s: renamed to %s\n  %-46s old copy; make update removes it\n" "$$old" "$$new" "$$dest/$$old"; \
		done; \
		IFS=" "; \
	done
_install:
	@set -eu; \
	if [ -z "$$DESTS" ]; then \
		echo "Destination must not be empty." >&2; exit 1; \
	fi; \
	found=0; \
	for entry in skills/*/SKILL.md; do \
		[ -f "$$entry" ] && found=1; \
	done; \
	if [ "$$found" -eq 0 ]; then \
		echo "No skills found." >&2; exit 1; \
	fi; \
	IFS=":"; \
	for dest in $$DESTS; do \
		if [ -z "$$dest" ]; then \
			echo "Destination must not be empty." >&2; exit 1; \
		fi; \
		[ "$$FORCE" = 1 ] && continue; \
		for entry in skills/*/SKILL.md; do \
			[ -f "$$entry" ] || continue; \
			skill="$${entry%/SKILL.md}"; \
			name="$${skill#skills/}"; \
			if [ -e "$$dest/$$name" ] || [ -L "$$dest/$$name" ]; then \
				echo "Skill already exists: $$dest/$$name; no skills installed. Use FORCE=1 to replace." >&2; exit 1; \
			fi; \
		done; \
	done; \
	for dest in $$DESTS; do \
		mkdir -p "$$dest"; \
		for entry in skills/*/SKILL.md; do \
			[ -f "$$entry" ] || continue; \
			skill="$${entry%/SKILL.md}"; \
			name="$${skill#skills/}"; \
			rm -rf "$$dest/$$name"; \
			cp -R "$$skill" "$$dest/$$name"; \
			printf 'Installed %s in %s\n' "$$name" "$$dest"; \
		done; \
	done; \
	IFS=" "; \
	for pair in $(RENAMED_SKILLS); do \
		old="$${pair%%=*}"; new="$${pair#*=}"; \
		[ -n "$$old" ] || continue; \
		IFS=":"; \
		for dest in $$DESTS; do \
			copy="$$dest/$$old"; \
			if [ -f "$$copy/SKILL.md" ] && [ ! -L "$$copy" ] && \
				grep -qx "name: $$old" "$$copy/SKILL.md" && \
				grep -qx "  author: $(SKILL_AUTHOR)" "$$copy/SKILL.md"; then \
				rm -rf "$$copy"; \
				printf 'Removed %s from %s: renamed to %s\n' "$$old" "$$dest" "$$new"; \
			fi; \
		done; \
		IFS=" "; \
	done
