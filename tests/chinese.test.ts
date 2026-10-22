import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { exerciseName } from "../src/lib/exercise-name";
import { formatDate } from "../src/lib/utils";
function keys(value: Record<string, unknown>, prefix = ""): string[] {
 return Object.entries(value).flatMap(([k,v]) => typeof v === "object" && v !== null ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`]).sort();
}
test("Chinese covers every translation key and preserves ICU placeholders", () => {
 const en = JSON.parse(readFileSync("src/i18n/messages/en.json", "utf8"));
 const zh = JSON.parse(readFileSync("src/i18n/messages/zh.json", "utf8"));
 assert.deepEqual(keys(zh), keys(en));
 for (const path of keys(en)) {
   const get = (o: Record<string, unknown>) => path.split('.').reduce((a,k) => (a as Record<string, unknown>)[k], o as unknown) as string;
   assert.deepEqual(get(zh).match(/\{\w+\}/g), get(en).match(/\{\w+\}/g), path);
 }
});
test("all catalog exercises have Chinese names and Chinese dates", () => {
 const slugs = [...readFileSync("src/db/seed-exercises.ts","utf8").matchAll(/slug: "([a-z-]+)"/g)].map(m => m[1]);
 assert.equal(slugs.length,37);
 for (const slug of slugs) assert.match(exerciseName({slug,nameEn:slug},"zh"), /[\u4e00-\u9fff]/, slug);
 assert.match(formatDate(new Date(2026,9,22),"zh"), /10月/);
});
