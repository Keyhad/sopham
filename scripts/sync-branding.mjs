import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const source = fileURLToPath(new URL("../docs/branding/", import.meta.url));
const target = fileURLToPath(new URL("../public/branding/", import.meta.url));
const palette = await readFile(path.join(source, "colors/tokens.css"), "utf8");
const colors = new Map([...palette.matchAll(/(--[\w-]+):\s*(#[\da-f]+);/gi)].map((match) => [match[1], match[2]]));

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
await cp(new URL("../docs/design-spec.md", import.meta.url), new URL("../public/design-spec.md", import.meta.url));
await cp(new URL("../docs/backend.md", import.meta.url), new URL("../public/backend.md", import.meta.url));

async function resolveSvgColors(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await resolveSvgColors(filename);
    else if (entry.name.endsWith(".svg")) {
      const svg = await readFile(filename, "utf8");
      await writeFile(filename, svg.replace(/var\((--[\w-]+)\)/g, (_, token) => {
        const color = colors.get(token);
        if (!color) throw new Error(`Unknown branding color ${token} in ${filename}`);
        return color;
      }));
    }
  }
}

await resolveSvgColors(target);
console.log("Branding catalog and assets synced to public/branding.");
