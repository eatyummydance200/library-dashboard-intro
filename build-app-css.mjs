// 실제 프론트 CSS를 소개 페이지용 app.css로 옮긴다: 모든 선택자를 .app 아래로 감싸고, 데스크톱(900px 이상) 규칙만 남긴다.
// 프론트 CSS가 바뀌면 다시 실행한다: node build-app-css.mjs
import { readFileSync, writeFileSync } from "node:fs";

const src = new URL("../workspace/library-dashboard-frontend/src/", import.meta.url);
const files = ["style.css", "tds.css", "shell.css", "home.css", "schedule.css", "manual.css", "screens.css", "people.css"];

const scope = (selectors) =>
  selectors.split(",").map((s) => {
    s = s.trim();
    if (s === ":root" || s === "body" || s === "html") return ".app";
    return `.app ${s}`;
  }).join(",");

// 중괄호 짝을 맞춰 규칙 단위로 나눈다 (주석은 먼저 지운다).
function rules(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    const head = css.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (depth) { if (css[j] === "{") depth++; else if (css[j] === "}") depth--; j++; }
    out.push([head, css.slice(open + 1, j - 1)]);
    i = j;
  }
  return out;
}

function convert(css) {
  return rules(css).map(([head, body]) => {
    if (head.startsWith("@font-face")) return "";
    if (head.startsWith("@keyframes")) return `${head}{${body}}`;
    if (head.startsWith("@media")) {
      const q = head.replace(/\s+/g, "");
      if (/min-width:900px/.test(q)) return convert(body); // 데스크톱 규칙은 그대로 적용
      if (/max-width:899px|pointer:coarse/.test(q)) return ""; // 모바일 규칙은 버린다
      return `${head}{${convert(body)}}`; // hover, reduced-motion
    }
    return `${scope(head)}{${body.trim()}}`;
  }).filter(Boolean).join("\n");
}

const css = files.map((f) => `/* ${f} */\n` + convert(readFileSync(new URL(f, src), "utf8").replace(/\/\*[\s\S]*?\*\//g, ""))).join("\n");
writeFileSync(new URL("app.css", import.meta.url), "/* build-app-css.mjs가 만든 파일. 직접 고치지 않는다. */\n" + css + "\n");
console.log("app.css", css.length, "bytes");
