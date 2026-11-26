import { describe, expect, it } from "vitest";
import { CATEGORIES, CHANNEL, TEMPLATES } from "../src/admin_flows";
import { personalize } from "../src/flows";
import { validate } from "../src/graph";

describe("scenario templates", () => {
  it("every scenario is a graph that can be published as is", () => {
    for (const [k, t] of Object.entries(TEMPLATES)) {
      if (k === "blank") continue;
      expect([k, validate(t.graph())]).toEqual([k, []]);
    }
  });
  it("every scenario sits in a known category and names real channels", () => {
    const cats = new Set(CATEGORIES.map(([k]) => k));
    for (const [k, t] of Object.entries(TEMPLATES)) {
      for (const c of t.cats ?? []) expect([k, cats.has(c)]).toEqual([k, true]);
      for (const c of t.ch ?? []) expect([k, c in CHANNEL]).toEqual([k, true]);
    }
    // TikTok and YouTube scenarios say plainly that they run on Instagram
    for (const t of Object.values(TEMPLATES).filter((t) => t.ch?.some((c) => c === "tt" || c === "yt"))) expect(t.how).toMatch(/doesn't send on/);
  });
});

describe("{{first_name}}", () => {
  it("fills their first name, or tidies the sentence when there isn't one", () => {
    expect(personalize("yo {{first_name}}! 👋", "Maya Park")).toBe("yo Maya! 👋");
    expect(personalize("yo, what's up {{first_name}}!", null)).toBe("yo, what's up!");
    expect(personalize("hey {{ first_name }} 👋 here it is", "")).toBe("hey 👋 here it is");
  });
});
