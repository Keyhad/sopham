# Sopham

Svensk, statisk Next.js-app för sophämtning för villor och radhus i Stockholms stad. Ingen inloggning, analys eller lokal lagring.

## Utveckling

Node.js 22.13+ och npm:

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
```

Publicera innehållet i `out/` på ett statiskt webbhotell över HTTPS (krävs för platsåtkomst). Ingen Next.js-server behövs; `npm start` används inte för den statiska exporten.

## Branding och design

[Designspecifikationen](docs/design-spec.md) beskriver layout, tillgänglighet och anpassning. [Brandingkatalogen](docs/branding/index.html) samlar logotyper, ikoner, färger och komponentexempel i [docs/branding/](docs/branding/).

Appen använder dessa källor direkt för CSS och metadata. `npm run dev`, `npm test` och `npm run build` synkroniserar katalog och SVG-tillgångar till genererade, git-ignorerade filer i `public/`. Öppna `http://localhost:3000/branding/index.html` under utveckling. Efter ändringar i SVG eller katalog under en redan startad server: kör `npm run branding:sync` och ladda om. Ändra alltid källorna i `docs/branding/`, inte kopiorna i `public/`.

## Automatisk publicering med GitHub Pages

[Pages-workflow](.github/workflows/pages.yml) kör lint, tester och statiskt bygge för pull requests och push till `main`. Push till `main` och manuell körning på `main` publicerar `out/` via GitHub Pages. Pull requests publiceras inte.

1. Välj **Settings → Pages → Build and deployment → Source: GitHub Actions** i GitHub-repot.
2. Pusha ändringarna till `main`, eller kör **Publish GitHub Pages** manuellt på `main` under **Actions**.
3. Webbplatsen blir tillgänglig på `https://keyhad.github.io/sopham/` och katalogen på `https://keyhad.github.io/sopham/branding/index.html`.

CI bygger med `NEXT_PUBLIC_BASE_PATH=/sopham` så att Next.js och branding-tillgångarna använder projektets URL-prefix. För ett annat reponamn ändras workflow-värdet; för egen domän på rotadressen tas prefixet bort. Lokalt standardbygge använder inget prefix. Testa Pages-bygget med:

```sh
NEXT_PUBLIC_BASE_PATH=/sopham npm run build
```

GitHub Pages publicerar även brandingkatalogen och designspecifikationen. Automatisk publicering ersätter inte granskningen under **Före publik drift** nedan.

## Data och begränsningar

Efter uttryckligt samtycke skickas adressen direkt från webbläsaren till Stockholm Vatten och Avfalls publika söktjänst:
`https://www.stockholmvattenochavfall.se/villa-och-radhus/avfallstjanster/nar-kommer-sopbilen/Search?address=…`.

Detta är en odokumenterad tjänst, inte ett verifierat öppet API med garanterad tillgänglighet eller återanvändningslicens. Liveåtkomst och CORS kunde inte verifieras i utvecklingsmiljön. Kontrollera dessa och datavillkoren med SVOA före publicering. Appen visar felmeddelande och länk till officiell sökning vid nätverksfel, blockerad CORS eller oväntade data. Den använder inte proxy, API-nycklar eller påhittade hämtningsdatum.

Endast nästa datum per kärl visas. Kalenderfiler innehåller enstaka heldagshändelser och en påminnelse kvällen före, inte uppskattade återkommande scheman. Kalendern synkroniseras inte. Användaren kan lägga in ett eget kontrollerat datum, tydligt märkt som ej verifierat. Flerbostadshus hänvisas till fastighetsägaren; andra kommuner stöds inte ännu.

Frivillig geolokalisering gör endast en ungefärlig lokal områdeskontroll; den hittar inte gatuadressen och skickar inte koordinater vidare. Alla uppgifter rensas vid omladdning eller återkallat samtycke. Kalenderfiler och redan skickade förfrågningar kan inte återkallas.

## Före publik drift

Låt ansvarig utgivare granska användarvillkor och integritetsinformation juridiskt. Komplettera med verklig personuppgiftsansvarig, kontaktväg, webbhotellets logghantering och eventuella lagringstider efter att driftleverantör har valts. Samtycke och ansvarsfriskrivning i gränssnittet är inte i sig en garanti för GDPR-efterlevnad eller befrielse från lagstadgat ansvar.
