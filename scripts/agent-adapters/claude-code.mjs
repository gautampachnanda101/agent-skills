/**
 * Claude Code adapter for scripts/agent-evals.mjs.
 *
 * Runs `claude -p` with only project settings, so none of the caller's user
 * settings, hooks, skills, or MCP servers load, and with every tool call
 * denied unless a case allows it. CLAUDE_BIN overrides the command.
 */
import { spawnSync } from 'node:child_process';

const OFFERED = ['Read', 'Grep', 'Glob', 'Skill', 'Bash', 'Write', 'Edit'];
const READ_ONLY = ['Read', 'Grep', 'Glob', 'Skill'];
const WRITES = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);

export function permissionRules(allow) {
  return [
    ...READ_ONLY,
    ...allow.run.map(prefix => `Bash(${prefix}:*)`),
    ...allow.write.flatMap(file => [`Write(${file})`, `Edit(${file})`]),
  ];
}

export function args(allow, model) {
  return ['-p', '--output-format', 'stream-json', '--verbose', '--model', model,
    '--setting-sources', 'project', '--strict-mcp-config', '--no-session-persistence',
    '--permission-mode', 'dontAsk', '--tools', OFFERED.join(','), '--allowedTools', ...permissionRules(allow)];
}

function toEvent(call) {
  const base = { tool: call.name, denied: false, error: false };
  const input = call.input ?? {};
  if (call.name === 'Read') return { ...base, kind: 'read', path: input.file_path };
  if (call.name === 'Grep') return { ...base, kind: 'search', path: input.path ?? '', pattern: input.pattern };
  if (call.name === 'Glob') return { ...base, kind: 'search', path: input.path ?? input.pattern, pattern: input.pattern };
  if (call.name === 'Bash') return { ...base, kind: 'run', command: input.command };
  if (WRITES.has(call.name)) return { ...base, kind: 'write', path: input.file_path ?? input.notebook_path };
  if (call.name === 'Skill') return { ...base, kind: 'skill', skill: String(input.skill ?? input.command ?? input.name ?? '') };
  return { ...base, kind: 'other' };
}

/** Reads Claude Code stream-json into neutral events and the final reply. */
export function parse(text) {
  const events = [];
  const byId = new Map();
  let reply = '';
  let cost = null;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    for (const block of event.message?.content ?? []) {
      if (event.type === 'assistant' && block.type === 'tool_use') {
        const parsed = toEvent(block);
        events.push(parsed);
        byId.set(block.id, parsed);
      }
      if (event.type === 'user' && block.type === 'tool_result' && byId.has(block.tool_use_id)) {
        const parsed = byId.get(block.tool_use_id);
        const output = Array.isArray(block.content) ? block.content.map(part => part.text ?? '').join('\n') : String(block.content ?? '');
        parsed.error = Boolean(block.is_error);
        parsed.denied = parsed.error && /permission|not allowed|denied|haven't granted|requires approval/i.test(output);
      }
    }
    if (event.type === 'result') {
      reply = event.result ?? '';
      cost = event.total_cost_usd ?? null;
    }
  }
  return { events, reply, cost };
}

export default {
  name: 'claude-code',
  skillsDir: '.claude/skills',
  ownFiles: ['.claude'],
  defaultModel: 'claude-opus-5-5',
  async run({ dir, prompt, allow, model }) {
    const result = spawnSync(process.env.CLAUDE_BIN ?? 'claude', args(allow, model), {
      cwd: dir, input: prompt, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 15 * 60_000,
    });
    const transcript = parse(result.stdout ?? '');
    const failure = result.status === 0 ? null : `claude exited ${result.status ?? result.signal}: ${String(result.stderr ?? '').trim().split('\n')[0]}`;
    return { ...transcript, raw: result.stdout ?? '', failure };
  },
};
