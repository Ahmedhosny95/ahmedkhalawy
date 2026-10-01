// Extracts counts from a Playwright JSON report and cross-checks them against the console log and `playwright test --list`.
// Usage: node scripts/verify-report.mjs <report.json> <console.txt>
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const [report, consolePath] = process.argv.slice(2);
const j = JSON.parse(readFileSync(report, 'utf8')), tests = [];
const walk = (s, f) => {for (const sp of s.specs || []) for (const t of sp.tests) tests.push({file: sp.file || f, title: sp.title, project: t.projectName, status: t.status}); for (const c of s.suites || []) walk(c, c.file || f);};
for (const s of j.suites) walk(s, s.file);
const byFile = {}; for (const t of tests) {const b = (byFile[t.file] ||= {}); b[t.status] = (b[t.status] || 0) + 1;}
const listed = execFileSync('npx', ['playwright', 'test', '--list'], {encoding: 'utf8'}).split('\n').filter(l => /^\s+\[/.test(l)).length;
const con = readFileSync(consolePath, 'utf8'), passedLine = con.match(/(\d+) passed/), failedLine = con.match(/(\d+) failed/);
const out = {stats: j.stats, reportTests: tests.length, byFile, listedByCommand: listed, consolePassed: passedLine ? +passedLine[1] : 0, consoleFailed: failedLine ? +failedLine[1] : 0};
out.agree = j.stats.expected === tests.length && tests.length === listed && out.consolePassed === j.stats.expected && j.stats.unexpected === 0 && j.stats.skipped === 0 && out.consoleFailed === 0;
console.log(JSON.stringify(out, null, 2)); process.exit(out.agree ? 0 : 1);
