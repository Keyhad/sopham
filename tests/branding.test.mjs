import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { brandingAsset } from "../lib/branding.ts";

const root = new URL("../", import.meta.url);
const read = (filename) => readFile(new URL(filename, root), "utf8");

test("catalog covers every palette token and registered icon", async () => {
  const [catalog, palette, sprite, brand] = await Promise.all([
    read("docs/branding/index.html"), read("docs/branding/colors/tokens.css"),
    read("docs/branding/icons/sprite.svg"), read("docs/branding/brand.json"),
  ]);
  const tokens = [...palette.matchAll(/(--[\w-]+):/g)].map((match) => match[1]);
  assert.deepEqual([...catalog.matchAll(/data-color="([^"]+)"/g)].map((match) => match[1]), tokens);
  const icons = JSON.parse(brand).icons;
  assert.deepEqual([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1]), icons);
  for (const icon of icons) assert.ok(catalog.includes(`icons/sprite.svg#${icon}`));
});

test("synced SVG assets resolve colors from the single palette source", async () => {
  const palette = await read("docs/branding/colors/tokens.css");
  const colors = new Map([...palette.matchAll(/(--[\w-]+):\s*(#[\da-f]+);/gi)].map((match) => [match[1], match[2]]));
  for (const directory of ["logos", "icons", "layout"]) {
    for (const filename of await readdir(new URL(`docs/branding/${directory}/`, root))) {
      if (!filename.endsWith(".svg")) continue;
      const source = await read(`docs/branding/${directory}/${filename}`);
      const published = await read(`public/branding/${directory}/${filename}`);
      const expected = source.replace(/var\((--[\w-]+)\)/g, (_, token) => {
        assert.ok(colors.has(token), `Unknown color ${token}`);
        return colors.get(token);
      });

      assert.equal(published, expected);
      assert.ok(!published.includes("var("));
    }
  }
  assert.equal(await read("public/branding/index.html"), await read("docs/branding/index.html"));
  assert.equal(await read("public/design-spec.md"), await read("docs/design-spec.md"));
});

test("waste pictograms use their shared category colors with at least 3:1 symbol contrast", async () => {
  const [palette, sprite, definitions] = await Promise.all([
    read("docs/branding/colors/tokens.css"), read("docs/branding/icons/sprite.svg"), read("docs/branding/icons/materials.json"),
  ]);
  const colors = new Map([...palette.matchAll(/(--[\w-]+):\s*(#[\da-f]{6});/gi)].map(match => [match[1], match[2]]));
  const luminance = hex => {
    const linear = hex.slice(1).match(/../g).map(channel => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  for (const [icon, material] of Object.entries(JSON.parse(definitions))) {
    const symbol = sprite.match(new RegExp(`<symbol id="${icon}"[^>]*>([\\s\\S]*?)</symbol>`))?.[1];
    assert.ok(symbol, icon);
    assert.ok(symbol.includes(`fill="var(${material.color})"`), icon);
    assert.ok(symbol.includes("var(--waste-symbol)"), icon);
    assert.ok(!symbol.includes("<text"), `${icon} must not depend on emoji rendering`);
    const foreground = luminance(colors.get("--waste-symbol"));
    const background = luminance(colors.get(material.color));
    assert.ok((Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05) >= 3, `${icon} contrast`);
  }
});

test("catalog relative asset and documentation links resolve in the published tree", async () => {
  const catalog = await read("public/branding/index.html");
  for (const [, reference] of catalog.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
    await readFile(new URL(reference, new URL("public/branding/index.html", root)));
  }
});

test("branding asset paths support local and GitHub Pages hosting", () => {
  const original = process.env.NEXT_PUBLIC_BASE_PATH;
  try {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    assert.equal(brandingAsset("logos/wordmark.svg#wordmark"), "/branding/logos/wordmark.svg#wordmark");
    process.env.NEXT_PUBLIC_BASE_PATH = "/sopham";
    assert.equal(brandingAsset("icons/favicon.svg"), "/sopham/branding/icons/favicon.svg");
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_BASE_PATH;
    else process.env.NEXT_PUBLIC_BASE_PATH = original;
  }
});
