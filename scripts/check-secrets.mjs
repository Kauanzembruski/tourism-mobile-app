import { readdir, readFile } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';

const skip = new Set(['node_modules', '.git', '.expo', 'dist', 'coverage']);
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.json', '.md', '.txt', '.html', '.yaml', '.yml']);
const patterns = [
  /AIza[0-9A-Za-z_-]{35}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:API_KEY|API_SECRET|AUTH_TOKEN)\s*=\s*["'][A-Za-z0-9_+/=-]{24,}["']/,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
];
const findings = [];
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { if (!skip.has(entry.name)) await scan(path); continue; }
    if (!extensions.has(extname(path)) && !entry.name.startsWith('.env')) continue;
    const content = await readFile(path, 'utf8');
    if (patterns.some(pattern => pattern.test(content))) findings.push(relative(process.cwd(), path));
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') {
      console.warn(`Configuração local ignorada pelo Git: ${relative(process.cwd(), path)}`);
    }
  }
}
await scan(process.cwd());
if (findings.length) {
  console.error('Possíveis segredos encontrados (valores omitidos):\n' + findings.join('\n'));
  process.exitCode = 1;
} else console.log('Nenhum padrão conhecido de segredo encontrado. Revise também o histórico Git.');
