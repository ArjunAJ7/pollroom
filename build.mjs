// Build: bundle src/client.ts with esbuild, then inline page + bundle into worker.js
import fs from "fs";
import { execSync } from "child_process";
fs.writeFileSync("stub.js", "module.exports={}");
execSync("npx esbuild src/client.ts --bundle --minify --format=iife --target=es2020 --alias:path=./stub.js --alias:fs=./stub.js --alias:crypto=./stub.js --outfile=dist/client.js", { stdio: "inherit" });
let t = fs.readFileSync("worker.tpl.js", "utf8");
t = t.replace("__PAGE__", () => JSON.stringify(fs.readFileSync("src/page.html", "utf8")))
     .replace("__APPJS__", () => JSON.stringify(fs.readFileSync("dist/client.js", "utf8")));
fs.writeFileSync("worker.js", t);
