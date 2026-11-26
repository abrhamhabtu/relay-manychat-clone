import { describe, expect, it } from "vitest";
import { cleanHandle, cleanUrl, parseLinked } from "../src/accounts";

describe("linked accounts", () => {
  it("accepts a handle with or without @, or a profile link", () => {
    expect(cleanHandle("@My.Page_1")).toBe("my.page_1");
    expect(cleanHandle("https://www.instagram.com/some.page/?hl=en")).toBe("some.page");
    expect(cleanHandle("not a handle!")).toBeNull();
    expect(cleanHandle("")).toBeNull();
  });
  it("keeps only an https origin, never a script or a password", () => {
    expect(cleanUrl("relay-two.me.workers.dev/admin/inbox")).toBe("https://relay-two.me.workers.dev");
    expect(cleanUrl("javascript:alert(1)")).toBeNull();
    expect(cleanUrl("http://example.com")).toBeNull();
    expect(cleanUrl("http://localhost:8792")).toBe("http://localhost:8792");
    expect(cleanUrl("https://u:p@x.dev")).toBeNull();
  });
  it("drops broken entries when reading the stored list", () => {
    const raw = JSON.stringify([{ handle: "good", url: "https://a.dev" }, { handle: "bad", url: "javascript:x" }, 5, null]);
    expect(parseLinked(raw)).toEqual([{ handle: "good", url: "https://a.dev" }]);
    expect(parseLinked("not json")).toEqual([]);
  });
});
