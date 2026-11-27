// The team's dependency scanner: checks package.json against known advisories.
import fs from 'node:fs';
const advisories = { lodash: { '4.17.15': 'CVE-2020-8203: prototype pollution in zipObjectDeep; fixed in 4.17.20' } };
const deps = JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies ?? {};
let found = 0;
for (const [name, version] of Object.entries(deps)) {
  const note = advisories[name]?.[version];
  if (note) { console.log(`${name}@${version}: ${note}`); found++; }
}
console.log(`${found} advisory finding(s)`);
process.exit(found ? 1 : 0);
