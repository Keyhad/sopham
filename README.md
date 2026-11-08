# Sopham

Svensk, statisk Next.js-app för sophämtning för villor och radhus i Stockholms stad. Ingen inloggning eller analys. Adress och senaste resultat kan valfritt sparas på den egna enheten.

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

Avfallskategorier använder textmärkta, vita SVG-piktogram på färgade rutor: restavfall svart, matavfall grönt, pappersförpackningar ockra, plastförpackningar magenta, glas grönt och metall grått. Konturflaska skiljer färgat glas från ofärgat glas med fylld flaska. Namn, sorteringstips och matchningsord finns i [materials.json](docs/branding/icons/materials.json), färger i [paletten](docs/branding/colors/tokens.css). Samma symboler används i nästa hämtning, resultatlistan, sorteringsguiden och brandingkatalogen.

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

Adressökningen är avstängd som standard. SVOA:s CORS-header blockerar direktåtkomst från GitHub Pages. Den publika sidan laddar sina datum med JavaScript från samma sökendpoint; HTML-scraping ger inga datum utan denna förfrågan.

En valfri [Cloudflare Worker](worker/index.ts) kan efter godkännande vidarebefordra sökningen server-side. Efter uttryckligt samtycke skickas adressen som JSON i en POST till backendens `/pickups`, som frågar Stockholm Vatten och Avfalls publika söktjänst:
`https://www.stockholmvattenochavfall.se/villa-och-radhus/avfallstjanster/nar-kommer-sopbilen/Search?address=…`.

Detta är en odokumenterad tjänst, inte ett verifierat öppet API med garanterad tillgänglighet eller återanvändningslicens. Bekräfta tillstånd och datavillkor med SVOA innan backendåtkomst aktiveras. En av användaren godkänd adress har verifierats i ett separat lokalt server-side-test; automatiserade tester använder syntetiska data. Backend validerar datakällans format och returnerar fel vid ändrat format, nätverksfel eller oväntade data. Appen visar felmeddelande och länk till officiell sökning. Inga publika CORS-proxyer eller påhittade datum används.

Endast nästa datum per kärl visas. Kalenderfiler innehåller enstaka heldagshändelser och en påminnelse kvällen före, inte uppskattade återkommande scheman. Kalendern synkroniseras inte. Användaren kan lägga in ett eget kontrollerat datum, tydligt märkt som ej verifierat. Flerbostadshus hänvisas till fastighetsägaren; andra kommuner stöds inte ännu.

Frivillig geolokalisering gör endast en ungefärlig lokal områdeskontroll; den hittar inte gatuadressen och skickar inte koordinater vidare. Utan ”Kom ihåg” rensas uppgifter vid omladdning. Återkallat samtycke rensar både sidans minne och eventuell sparad adress och stoppar vidare sökning i fliken. Kalenderfiler och redan skickade förfrågningar kan inte återkallas.

**Hitta rätt adress** hämtar SVOA:s officiella adressförslag efter samtycke och en uttrycklig knapptryckning. Sökningen använder gata och husnummer före första kommatecknet, så en felskriven postort inte blockerar förslagen. Vid en gatuförkortning utan träff kan backend läsa officiella gatuförslag och söka på ett entydigt gatunamn med det angivna husnumret. Högst tre upstreamanrop görs inom samma timeout. Flera matchande gator kräver mer text, inte en gissning. Användaren måste välja den fullständiga adressen och sedan söka hämtningsdatum. Förslag sparas inte och hämtas inte medan användaren skriver eller i demo.

Platskontrollen kräver en säker origin (HTTPS eller localhost), även i LAN. Blockerad behörighet, saknad position och timeout får olika meddelanden. Browser- och OS-behörighet kan inte kringgås av appen; en inbyggd webbläsare kan behöva ersättas med Safari eller Chrome för platskontroll.

### Så söker du en adress

1. Skriv gatunamn och husnummer, minst tre tecken.
2. Bekräfta samtycket. Välj även **Kom ihåg på den här enheten** om adress och resultat ska finnas kvar vid återbesök.
3. Tryck **Hitta rätt adress** och välj ditt officiella adressförslag. Kontrollera husnummer, postort och postnummer.
4. Tryck **Visa hämtningsdagar**. Adressförslag i sig hämtar inga hämtningsdatum.

En redan fullständig officiell adress kan sökas direkt. Om adressförslag saknas, skriv mer av gatunamnet eller använd SVOA:s egen sökning. Vid 429: vänta en minut innan nästa försök.

### Om platskontrollen inte fungerar

Att en LAN-sida går att öppna över HTTP betyder inte att den får använda platsåtkomst. Använd HTTPS med ett betrott certifikat och tillåt plats både i webbläsarens webbplatsinställningar och i enhetens platstjänster. På macOS finns den senare inställningen under Systeminställningar → Integritet och säkerhet → Platstjänster.

HTTPS tillhandahåller inte en position. En nekad behörighet eller en enhet som inte kan bestämma sin position kan fortfarande stoppa platskontrollen. Vid timeout i en inbyggd webbläsare: prova samma HTTPS-adress i Safari eller Chrome. Platsknappen kontrollerar bara Stockholmsområdet; adressökningen fungerar separat utan platsåtkomst.

## Nästa hämtning först och valfri sparad adress

Första vyn visar nästa bekräftade datum med stora **IDAG**, **IMORGON** eller **OM N DAGAR** och tydliga, textmärkta materialbilder. Alla kärl med samma nästa datum visas tillsammans; andra datum finns i den fullständiga listan. Datum beräknas utifrån Stockholms kalenderdygn, inte användarens lokala tidszon eller uppskattad återkommande frekvens.

Med **Kom ihåg på den här enheten** sparas adress, samtycke, senaste officiella resultat och kontrolltid i `localStorage` efter sökning. Vid återbesök, återgång till fliken och nytt dygn i en öppen sida uppdateras uppgifterna automatiskt. Adressen skickas bara till den backend och driftmiljö som användaren samtyckt till; ändrad konfiguration kräver nytt samtycke.

Sparade uppgifter visas som **INTE UPPDATERAT** tills en ny sökning lyckas. Vid fel kvarstår varningen och senaste kontrolltid, även i kalenderexportens beskrivning. Passerade datum visas inte som kommande; inga datum gissas. **Glöm adressen**, avmarkering av minnesvalet eller återkallat samtycke tar bort sparade uppgifter. Demodata, position och egna datum sparas inte. Lagringsfel visas uttryckligen. Använd inte minnesfunktionen på en delad webbläsarprofil.

## Valfri backend på Cloudflare

Se [backendens driftsinstruktioner](docs/backend.md). GitHub Pages fortsätter att publicera frontend; Worker deployas separat och är spärrad med `SVOA_ACCESS_APPROVED=false`. Utan `NEXT_PUBLIC_PICKUP_WORKER_URL` visas officiell sökning och manuella datum utan misslyckade direktförfrågningar.

## Demo utan liveåtkomst

Öppna `https://keyhad.github.io/sopham/?demo=settings` (lokalt `http://localhost:3000/?demo=settings`) och välj **Aktivera demo med syntetiska exempeldata**. Skriv en påhittad adress och bekräfta demoläget för att visa simulerad laddning, två exempelresultat och kalenderexport. Ingen adress skickas vidare; platsknappen simulerar också resultat utan platsåtkomst.

Inställningspanelen syns bara med URL-parametern, men är inte ett säkerhetsskydd. Demoläget är tydligt märkt i sidan, resultat och kalenderfilen `sopham-demo.ics`. Alla adresser får samma relativa exempeldatum; inga verkliga scheman antyds. Läget sparas inte och startar avstängt efter omladdning. Byte av läge rensar uppgifter och avbryter pågående sökning. Det aktiverar inte Worker eller kringgår tillståndsspärren.

## Före publik drift

Låt ansvarig utgivare granska användarvillkor och integritetsinformation juridiskt. Komplettera med verklig personuppgiftsansvarig, kontaktväg, webbhotellets logghantering och eventuella lagringstider efter att driftleverantör har valts. Samtycke och ansvarsfriskrivning i gränssnittet är inte i sig en garanti för GDPR-efterlevnad eller befrielse från lagstadgat ansvar.
