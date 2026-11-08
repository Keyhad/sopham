# Designspecifikation

## Syfte och ton

Sopham hjälper boende i villor och radhus i Stockholms stad att kontrollera nästa sophämtning och exportera ett kalenderdatum. Tonen är svensk, lugn, vänlig och praktisk. Tjänsten är fristående från kommunen. Inga påhittade datum, garanterad liveåtkomst eller automatisk kalendersynkronisering får antydas.

## Gemensam branding

[Brandingkatalogen](branding/index.html) visar tillgångarna och verkliga komponentstilar:

| Källa | Ansvar |
| --- | --- |
| [brand.json](branding/brand.json) | Namn, sidmetadata, slogan, kalenderidentitet och tillgångarnas sökvägar |
| [logos/](branding/logos/) | SVG-ordlogotyp |
| [icons/](branding/icons/) | Webbplatsikon och SVG-sprite med återvinning, sol, stjärna, hjärta, pilar, nedladdning och sorteringssymboler |
| [colors/tokens.css](branding/colors/tokens.css) | Alla färgvärden, inklusive illustration och interaktionstillstånd |
| [layout/tokens.css](branding/layout/tokens.css) | Typografi, centrala mått, mellanrum och hörnradier |
| [layout/application.css](branding/layout/application.css) | Webbplatsens och katalogens gemensamma komponentlayout och responsiva regler |
| [layout/hero.svg](branding/layout/hero.svg) | Dekorativ illustration med två kärl |
| [layout/catalog.css](branding/layout/catalog.css) | Enbart katalogens presentation |

Appens CSS importerar dessa källor; React-koden innehåller inte logotypens eller illustrationens geometri. SVG-färger använder palettvariabler. Synkroniseringen ersätter dem med palettvärden i publicerade SVG-filer så att även direktöppnade bilder och favicon fungerar utan en omgivande stilmall. Redigera aldrig de genererade kopiorna i `public/branding/`.

Symboler och emoji behåller befintliga motiv. Emoji och SVG-text använder systemets teckensnitt och kan variera mellan plattformar. Ersätt med SVG-banor i samma filer om identiska former krävs. Heroillustrationen skalar nu som en sammanhållen SVG i stället för individuellt positionerade CSS-delar.

## Visuell hierarki

- Mörkgrön text (`--ink`), grön handling (`--green`), varm ljus bakgrund (`--paper`) och dämpad sekundärtext (`--muted`).
- Orange fokusmarkering (`--focus`) och logotypaccent (`--accent`).
- Separata variabler för hover, inaktiva kontroller, resultatkort, tips och sorteringsytor. Färg får inte vara den enda informationsbäraren.
- Arial/Helvetica/sans-serif, radavstånd 1,6. Huvudrubrik 40–62 px med tätare radavstånd; sektionsrubrik 36 px, 30 px på mobil; kortrubrik 21 px.
- Innehållsbredd högst 1160 px inklusive sidpadding. Sidpadding 32 px, 20 px på mobil.
- Kort: 30 px padding, 22 px på mellanbredder, 20 px hörnradie. Kontroller minst 48 px höga.

## Layout och responsivitet

1. Sidhuvud med logotyp, huvudnavigation och tangentbordsåtkomlig hopplänk.
2. Nästa hämtning först, med mycket stora IDAG/IMORGON/OM N DAGAR, exakt datum och textmärkta materialbilder. IDAG är större än IMORGON. Alla kärl på samma nästa datum grupperas. För nya användare följer en introduktion med illustration.
3. Tre steg som förklarar arbetsflödet.
4. Planering med adress/samtycke till vänster och resultat/manuellt datum till höger.
5. Tre sorteringskort.
6. Integritetsinformation, villkor och rensningsknapp.
7. Sidfot med logotyp och slogan.

Över 850 px används full tvåkolumnslayout. Vid högst 850 px minskas kortpadding och vissa mellanrum. Vid högst 640 px staplas hero, planering och sorteringskort; navigation och sidfot får radbrytas. Brytpunkterna redigeras i den gemensamma komponentstilmallen eftersom CSS-variabler inte kan användas direkt i mediafrågor.

## Tillgänglighet och funktionella gränser

- Svenska som dokumentspråk, semantiska rubriker, synliga etiketter, tydlig fokusmarkering och statusmeddelanden.
- Logotyplänkar har ett tillgängligt namn. Ikoner med förklarande text och heroillustrationen är dekorativa.
- Behåll tangentbordsnavigation, inaktiva knappar och `prefers-reduced-motion`.
- Verifiera WCAG AA-kontrast efter palettändringar: minst 4,5:1 för normal text och 3:1 för stor text och relevanta kontur-/fokuselement.
- Adressökning kräver uttryckligt samtycke. Återkallande avbryter sökning och ogiltigförklarar platsåterkoppling.
- Adressförslag hämtas endast med knappen Hitta rätt adress efter samtycke, inte automatiskt vid tangenttryckningar. Förslag visas som textmärkta knappar som också fungerar med tangentbord. Användaren väljer alltid fullständig adress före hämtning; tvetydiga gatunamn gissas inte. Redigering, återkallande och lägesbyte avbryter väntande förslag.
- Platskontrollen hittar inte gatuadressen. Osäker HTTP-origin, nekad behörighet, saknad position och timeout förklaras tydligt utan att platsbehörighet kringgås.
- Adressökning är avstängd utan konfigurerad backend. När den aktiveras beskriver samtycket behandling hos Cloudflare och vidarebefordran till SVOA. Backend kräver separat SVOA-tillstånd; se [driftsinstruktioner](backend.md).
- Platskontroll är frivillig och lokal. Inget konto eller spårning införs. Brandingkatalogen använder ingen lokal lagring.
- Appens minnesval är separat och frivilligt. Det sparar adress, samtycke, senaste officiella resultat och kontrolltid på enheten; återbesök och nytt dygn uppdaterar automatiskt till samma backend. Glöm/återkalla rensar lagringen. Sparade resultat märks INTE UPPDATERAT tills en ny sökning lyckas; äldre datum ersätts aldrig med gissningar.
- Materialnamn, fullständiga rubriker, sorteringstips, färgkopplingar och matchningsord finns i [icons/materials.json](branding/icons/materials.json); SVG-formerna finns i spriten. Färg är aldrig den enda ledtråden: varje stor ikon har en tydlig textetikett. Okända kärlgrupper behåller datakällans namn.
- Avfallspiktogrammen följer sorteringsreferensens kategorier: vit soppåse på svart för restavfall, äppelskrutt på grönt för matavfall, kartong på ockra för papper, plastpåse/flaska på magenta för plast, flaskor på grönt för glas och konservburk på grått för metall. Färgat glas har konturflaska och ofärgat glas fylld flaska. Formerna är egna SVG-piktogram; fotografiets illustrationer och text kopieras inte. Färgvärdena är visuella approximationer, inte officiella eller kalibrerade tryckvärden.
- Paletten använder `--waste-*` i [colors/tokens.css](branding/colors/tokens.css), även för fristående SVG. Sorteringsguiden och egna datum omfattar alla sju kategorier. Om en datakälla bara anger ”glas” behålls den generiska glasetiketten med en kombinerad symbol; färgat/ofärgat antas inte.
- Egna datum är tydligt ej verifierade; kalenderexporten är en ögonblicksbild.
- Dolda demoinställningar öppnas med `?demo=settings`, men demoläget är synligt märkt och använder endast syntetiska datum. Ingen adress skickas vidare eller platsåtkomst begärs i demo. Resultat och kalenderexport märks DEMO; lägesbyte rensar uppgifter och läget återställs efter omladdning.

## Anpassning och kontroll

1. Ändra metadata i [brand.json](branding/brand.json), paletten i [colors/tokens.css](branding/colors/tokens.css), tillgångarna i sina mappar och layouten i [layout/](branding/layout/).
2. Behåll SVG-id:n `wordmark`, `favicon` och `hero`, eller uppdatera både appens referenser och katalogen. Vid nya ikoner: uppdatera sprite, ikonlistan i JSON, komponentens ikonunion och katalogen.
3. Kör `npm run branding:sync` efter tillgångsändringar under en redan startad utvecklingsserver; start och bygge synkroniserar automatiskt. CSS-ändringar läses direkt av appens byggsystem.
4. Visa `/branding/index.html` med `npm run dev`. Katalogens relativa länkar fungerar även om `docs/` serveras med en vanlig lokal HTTP-server. Använd HTTP, inte `file://`, för externa SVG-referenser.
5. Kör `npm run lint`, `npm test` och `npm run build`. Kontrollera app och katalog på smal och bred skärm, fokus, knapparnas tillstånd, länkar och manuellt kalenderdatum.

Publicering och GitHub Pages-inställningar beskrivs i [README](../README.md).
