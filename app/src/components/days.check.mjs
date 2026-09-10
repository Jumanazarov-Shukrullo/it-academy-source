// Run: node app/src/components/days.check.mjs
import assert from "node:assert";
import { activeDays } from "./days.js";

assert.deepStrictEqual(activeDays("Mon,Wed,Fri"), [true, false, true, false, true, false, false]);
assert.deepStrictEqual(activeDays("Вт, Сб"), [false, true, false, false, false, true, false]);
assert.deepStrictEqual(activeDays("Вторник Четверг"), [false, true, false, true, false, false, false]);
assert.deepStrictEqual(activeDays(""), [false, false, false, false, false, false, false]);
console.log("days.check OK");
