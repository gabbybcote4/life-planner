import test from "node:test";
import assert from "node:assert/strict";
import { THEMES, DEFAULT_THEME, parseTheme, themeVariables } from "../src/lib/themes/themes.ts";

const luminance = (hex) => {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};
const contrast = (one, two) => {
  const a = luminance(one), b = luminance(two);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

test("theme values accept only the available names, never inherited object keys", () => {
  assert.equal(DEFAULT_THEME, "sage");
  for (const theme of Object.keys(THEMES)) assert.equal(parseTheme(theme), theme);
  for (const value of [null, "", "constructor", "__proto__", "toString", "MIDNIGHT", "sage; background:red", ["rose"]]) assert.equal(parseTheme(value), null);
});

for (const [name, theme] of Object.entries(THEMES)) {
  test(`${name}: readable main text, muted text, actions, errors, and focus controls`, () => {
    const c = theme.colors;
    for (const bg of [c.surface, c.input, c.panel, c.tint, c.selected, c["accent-pink"], c["accent-mint"], c["accent-blue"], c["accent-yellow"], c["accent-lilac"]]) {
      assert.ok(contrast(c.foreground, bg) >= 4.5, `${name} foreground contrast`);
      assert.ok(contrast(c.muted, bg) >= 4.5, `${name} muted contrast: ${contrast(c.muted, bg)}`);
    }
    assert.ok(contrast(c.primary, c["on-primary"]) >= 4.5, "primary action contrast");
    assert.ok(contrast(c["primary-hover"], c["on-primary"]) >= 4.5, "hover action contrast");
    assert.ok(contrast(c.error, c["error-surface"]) >= 4.5, "error contrast");
    assert.ok(contrast(c.success, c["success-surface"]) >= 4.5, "success contrast");
    assert.ok(contrast(c.focus, c.surface) >= 3, "focus contrast");
    assert.ok(contrast(c["input-border"], c.input) >= 3, "input boundary contrast");
    assert.equal(themeVariables(name).colorScheme, name === "midnight" ? "dark" : "light");
  });
}
