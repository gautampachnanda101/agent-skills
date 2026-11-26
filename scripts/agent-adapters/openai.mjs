/**
 * A minimal agent for scripts/agent-evals.mjs that works with any
 * OpenAI-compatible chat completions server: llama.cpp's llama-server,
 * Ollama, or a hosted endpoint (set OPENAI_API_KEY for one that needs it).
 *
 * It gives the model five tools (list_files, read_file, search, run_command,
 * write_file) and enforces the case's permissions itself:
 *   - every path stays inside the repository
 *   - run_command runs only commands that start with an allowed prefix and
 *     contain no shell control characters, with a two-minute limit
 *   - write_file writes only files the case allows
 * Installed skills are advertised by name and description, as Agent Skills
 * hosts do; the model loads one by reading its SKILL.md.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';

const MAX_TURNS = 40;
const MAX_OUTPUT = 20_000;
const SKIP = new Set(['.git', 'node_modules']);

export const TOOLS = [
  { name: 'list_files', description: 'List files under a folder of the repository, recursively.', parameters: { type: 'object', properties: { path: { type: 'string', description: 'Folder relative to the repository root; default "."' } } } },
  { name: 'read_file', description: 'Read a file in the repository.', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
  { name: 'search', description: 'Search file contents with a regular expression; returns matching lines with file:line.', parameters: { type: 'object', properties: { pattern: { type: 'string' }, path: { type: 'string', description: 'File or folder; default "."' } }, required: ['pattern'] } },
  { name: 'run_command', description: 'Run a shell command in the repository root. Only some commands are permitted.', parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } },
  { name: 'write_file', description: 'Create or replace a file in the repository. Only some files are permitted.', parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } },
].map(fn => ({ type: 'function', function: fn }));

function frontmatter(text) {
  const block = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '';
  const field = name => new RegExp(`^${name}:\\s*(.*)$`, 'm').exec(block)?.[1]?.trim();
  return { name: field('name'), description: field('description') };
}

export function systemPrompt(dir, skillsDir) {
  const skillsRoot = path.join(dir, skillsDir);
  const skills = fs.existsSync(skillsRoot)
    ? fs.readdirSync(skillsRoot).filter(name => fs.existsSync(path.join(skillsRoot, name, 'SKILL.md')))
      .map(name => ({ file: `${skillsDir}/${name}/SKILL.md`, ...frontmatter(fs.readFileSync(path.join(skillsRoot, name, 'SKILL.md'), 'utf8')) }))
    : [];
  return [
    'You are a coding assistant working in a repository; the current directory is its root.',
    'Use the tools to inspect files and run permitted commands. A denied tool call is final: do not retry it, and say in your reply what you could not do.',
    'When you have finished, reply to the user without calling a tool.',
    '',
    'Agent Skills are installed in this repository. When the task matches a skill\'s description, read its SKILL.md with read_file before acting, follow it, and read any guide it links when that guide applies.',
    ...skills.map(skill => `- ${skill.name} (${skill.file}): ${skill.description}`),
  ].join('\n');
}

/** Resolves a model-supplied path inside dir, or returns null. */
export function inside(dir, file) {
  const resolved = path.resolve(dir, String(file ?? '.'));
  return resolved === dir || resolved.startsWith(dir + path.sep) ? resolved : null;
}

function walk(dir, from, limit = 500) {
  const found = [];
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (found.length >= limit || SKIP.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) found.push(path.relative(dir, full));
    }
  };
  if (fs.statSync(from).isDirectory()) visit(from);
  else found.push(path.relative(dir, from));
  return found;
}

export function commandAllowed(command, prefixes) {
  const text = String(command ?? '').trim();
  if (/[;&|<>`$\n\\]/.test(text)) return false;
  return prefixes.some(prefix => text === prefix || text.startsWith(`${prefix} `));
}

/** Runs one tool call; returns [event, output]. */
export function execute(dir, allow, name, input) {
  const denied = (event, why) => [{ ...event, denied: true, error: true }, `Permission denied: ${why}`];
  const base = { tool: name, denied: false, error: false };
  try {
    if (name === 'list_files' || name === 'read_file' || name === 'search') {
      const target = inside(dir, input.path ?? '.');
      const kind = name === 'read_file' ? 'read' : 'search';
      const event = { ...base, kind, path: input.path ?? '.', pattern: input.pattern };
      if (!target) return denied(event, 'the path is outside the repository');
      if (!fs.existsSync(target)) return [{ ...event, error: true }, `No such file or folder: ${input.path}`];
      if (name === 'list_files') return [event, walk(dir, target).join('\n')];
      if (name === 'read_file') return [event, fs.readFileSync(target, 'utf8').slice(0, MAX_OUTPUT)];
      const re = new RegExp(input.pattern);
      const lines = [];
      for (const file of walk(dir, target)) {
        fs.readFileSync(path.join(dir, file), 'utf8').split('\n').forEach((line, i) => {
          if (lines.length < 200 && re.test(line)) lines.push(`${file}:${i + 1}: ${line}`);
        });
      }
      return [event, lines.join('\n') || 'No matches.'];
    }
    if (name === 'run_command') {
      const event = { ...base, kind: 'run', command: input.command };
      if (!commandAllowed(input.command, allow.run)) return denied(event, 'this command is not permitted');
      const result = spawnSync('sh', ['-c', input.command], { cwd: dir, encoding: 'utf8', timeout: 120_000, maxBuffer: 1 << 24 });
      const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(0, MAX_OUTPUT);
      return [{ ...event, error: result.status !== 0 }, `exit ${result.status ?? result.signal}\n${output}`];
    }
    if (name === 'write_file') {
      const target = inside(dir, input.path);
      const event = { ...base, kind: 'write', path: input.path };
      const relative = target && path.relative(dir, target).split(path.sep).join('/');
      if (!target || !allow.write.includes(relative)) return denied(event, 'writing this file is not permitted');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, String(input.content ?? ''));
      return [event, `Wrote ${relative}`];
    }
    return [{ ...base, kind: 'other', error: true }, `Unknown tool: ${name}`];
  } catch (error) {
    return [{ ...base, kind: 'other', error: true }, `Error: ${error.message}`];
  }
}

/**
 * Some models write a tool call as JSON in the message text instead of
 * using tool_calls. Accept {"name": ..., "arguments": {...}} on its own,
 * in a code fence, or inside <tool_call> tags.
 */
export function textToolCalls(content) {
  const text = String(content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const candidates = [...text.matchAll(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g)].map(m => m[1]);
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(text);
  if (!candidates.length) candidates.push(fenced ? fenced[1] : text);
  const calls = [];
  for (const candidate of candidates) {
    try {
      const value = JSON.parse(candidate);
      const name = value.name ?? value.function?.name;
      if (!TOOLS.some(tool => tool.function.name === name)) return [];
      const args = value.arguments ?? value.parameters ?? value.function?.arguments ?? {};
      calls.push({ id: `text-${calls.length}`, function: { name, arguments: typeof args === 'string' ? args : JSON.stringify(args) } });
    } catch {
      return [];
    }
  }
  return calls;
}

// node:http rather than fetch: fetch gives up when a server takes more than
// five minutes to send headers, and a local model can take that long.
export function chat(baseUrl, body, timeoutMs = 20 * 60_000) {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/chat/completions`);
  const payload = JSON.stringify(body);
  const headers = { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) };
  if (process.env.OPENAI_API_KEY) headers.authorization = `Bearer ${process.env.OPENAI_API_KEY}`;
  const client = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const request = client.request(url, { method: 'POST', headers }, response => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', chunk => (text += chunk));
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) return reject(new Error(`HTTP ${response.statusCode}: ${text.slice(0, 200)}`));
        try {
          resolve(JSON.parse(text));
        } catch {
          reject(new Error(`invalid JSON from the server: ${text.slice(0, 200)}`));
        }
      });
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error(`no reply within ${timeoutMs / 60_000} minutes`)));
    request.on('error', reject);
    request.end(payload);
  });
}

export default {
  name: 'openai',
  skillsDir: '.agents/skills',
  ownFiles: ['.agents'],
  defaultModel: undefined,
  defaultBaseUrl: undefined,
  async run({ dir, prompt, allow, model, baseUrl }) {
    if (!baseUrl) return { events: [], reply: '', raw: '', failure: 'the openai adapter needs --base-url, for example http://127.0.0.1:8080/v1 for llama-server' };
    const messages = [{ role: 'system', content: systemPrompt(dir, '.agents/skills') }, { role: 'user', content: prompt }];
    const events = [];
    const log = [];
    let reply = '';
    let failure = null;
    try {
      for (let turn = 0; turn < MAX_TURNS; turn++) {
        const response = await chat(baseUrl, { model, messages, tools: TOOLS, temperature: 0 });
        const message = response.choices?.[0]?.message ?? {};
        log.push(JSON.stringify(message));
        let calls = message.tool_calls ?? [];
        if (!calls.length) calls = textToolCalls(message.content);
        if (!calls.length) {
          reply = String(message.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
          break;
        }
        messages.push({ role: 'assistant', content: message.tool_calls ? (message.content ?? '') : '', tool_calls: calls.map(call => ({ id: call.id, type: 'function', function: call.function })) });
        for (const call of calls) {
          let input = {};
          try {
            input = JSON.parse(call.function.arguments || '{}');
          } catch {}
          const [event, output] = execute(dir, allow, call.function.name, input);
          events.push(event);
          log.push(JSON.stringify({ tool: call.function.name, input, denied: event.denied, output: output.slice(0, 500) }));
          messages.push({ role: 'tool', tool_call_id: call.id, content: output });
        }
        if (turn === MAX_TURNS - 1) failure = `no reply after ${MAX_TURNS} turns`;
      }
    } catch (error) {
      failure = `model request failed: ${error.message}`;
    }
    return { events, reply, raw: log.join('\n'), failure };
  },
};
