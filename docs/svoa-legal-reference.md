# Rättsliga referenser: tillgång till och vidareutnyttjande av SVOA:s data

Sammanställd: 2026-11-07.

Detta är ett referensunderlag till [e-postbegäran](svoa-data-request.md), inte juridisk rådgivning eller ett slutligt besked om Sophams rättigheter. Beskrivningarna nedan är sammanfattningar, inte ordagranna lagcitat. Kontrollera aktuell lydelse och ikraftträdandedatum i källorna vid användning; konsoliderade lagtexter kan även visa framtida bestämmelser.

## Tre frågor som måste hållas isär

1. **Tillgång:** Har vi rätt att få ut de befintliga uppgifterna som allmänna handlingar?
2. **Vidareutnyttjande:** Får vi bearbeta och visa uppgifterna i appen, och vilka villkor får ställas?
3. **Teknisk åtkomst:** Vilken integrationsväg kan användas för löpande uppslag: API, export eller webbplatsens endpoint?

Att en uppgift visas offentligt avgör inte ensamt alla tre frågor. Omvänt behöver en lagstadgad rätt inte vara beroende av ett frivilligt medgivande från webbplatsägaren. En offentlighetsbegäran är därför inte samma sak som en ansökan om API-support.

## 1. Tryckfrihetsförordningen (1949:105), 2 kap.

[Officiell lagtext hos Riksdagen](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/tryckfrihetsforordning-1949105_sfs-1949-105/)

| Bestämmelse | Innebörd i korthet | Betydelse för begäran |
| --- | --- | --- |
| 2 kap. 1 § | Var och en har rätt att ta del av allmänna handlingar. | Utgångspunkt för att begära befintliga hämtningsuppgifter. |
| 2 kap. 2 § | Begränsningar kräver angivna skyddsintressen och stöd i lag enligt bestämmelsen. | Offentlig tillgång kan inte nekas enbart med hänvisning till en allmän önskan att hålla data inom den egna tjänsten. En faktisk sekretessprövning kan dock behövas. |
| 2 kap. 3–4 §§ | Anger vad en handling är och när den är allmän. Även elektroniska upptagningar kan omfattas. | Att uppgifter finns i ett datasystem utesluter inte offentlighetsprincipen. Alla uppgifter i ett system är däremot inte automatiskt allmänna handlingar. |
| 2 kap. 6 § | En sammanställning ur ett automatiserat system anses förvarad om den kan göras tillgänglig med rutinbetonade åtgärder, med förbehåll för 7 §. | Relevant om begäran kräver ett urval eller en sammanställning snarare än en redan färdig fil. |
| 2 kap. 15 § | Offentliga handlingar ska kunna tas del av på stället genast eller så snart som möjligt, utan avgift. Om delar inte får lämnas ut ska övriga delar göras tillgängliga enligt bestämmelsen. | Ger en väg till insyn, men inte i sig ett löfte om fjärråtkomst eller API. |
| 2 kap. 16 § | Rätt till avskrift eller kopia mot fastställd avgift; begäran ska behandlas skyndsamt. Elektroniska upptagningar behöver inte lämnas i annan form än utskrift i större utsträckning än vad som följer av lag. | Digital leverans måste bedömas tillsammans med andra regler, exempelvis öppna datalagen. |
| 2 kap. 17 § | Begäran görs hos den som förvarar handlingen och prövas enligt bestämmelsen. | Be SVOA identifiera rätt bolag eller mottagare om koncernnamnet inte är innehavaren. |
| 2 kap. 18 § | Identitet och syfte får inte efterforskas mer än vad som behövs för att pröva hinder mot utlämnande. | Syftet kan ändå beskrivas frivilligt för att tydliggöra begäran om vidareutnyttjande. |
| 2 kap. 19 § | Reglerar överklagande av avslag och vissa förbehåll, med närmare regler i lag. | Begär ett skriftligt beslut med lagstöd och information om hur det kan överklagas. |

**Inte fastställt:** Att just den efterfrågade datamängden är allmän, kan sammanställas med rutinbetonade åtgärder eller kan lämnas ut utan sekretess. Det behöver prövas av innehavaren.

## 2. Offentlighets- och sekretesslagen (2009:400)

[Officiell lagtext hos Riksdagen](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/offentlighets-och-sekretesslag-2009400_sfs-2009-400/)

### 2 kap. 3 § — kommunalt kontrollerade bolag

Rätten att ta del av allmänna handlingar gäller i tillämpliga delar också hos bolag, föreningar och stiftelser där kommuner eller regioner har rättsligt bestämmande inflytande. Bestämmelsen anger bland annat kontroll genom röstmajoritet eller möjlighet att utse styrelsemajoritet och omfattar även indirekt kontroll.

SVOA beskriver verksamheten som en del av Stockholms stad och anger Stockholm och Huddinge som ägarkommuner:

- [SVOA: Om oss](https://www.stockholmvattenochavfall.se/om-oss/)
- [SVOA: Om bolaget](https://www.stockholmvattenochavfall.se/om-oss/om-bolaget/)

Det gör bestämmelsen relevant. Vilken juridisk person som faktiskt innehar hämtningsuppgifterna och hur kontrollrekvisiten är uppfyllda behöver vid behov klargöras. Kommunalt ägande undanröjer inte sekretessbestämmelser.

### 4 kap. 1–2 §§ — ordning och sökmöjligheter

Bestämmelserna behandlar bland annat skyndsamt utlämnande, åtskillnad mellan offentliga och andra handlingar samt beskrivning av register, sökmedel, tekniska hjälpmedel och kontaktpersoner.

De kan vara relevanta när vi efterfrågar befintlig dokumentation och rätt kontaktväg. De innebär inte i sig att SVOA måste erbjuda en publik, obegränsad webb-API.

## 3. Lag (2022:818) om den offentliga sektorns tillgängliggörande av data

Kallas ofta **öppna datalagen**.

[Officiell lagtext hos Riksdagen](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-2022818-om-den-offentliga-sektorns_sfs-2022-818/)

### Tillämpning och avgränsning

| Bestämmelse | Innebörd i korthet |
| --- | --- |
| 1 kap. 1 § | Syftet är att främja vidareutnyttjande, särskilt öppna data, samtidigt som informationssäkerhet, personuppgiftsskydd och Sveriges säkerhet upprätthålls. |
| 1 kap. 2 § | Lagen ändrar inte andra regler om rätt till tillgång eller begränsning av tillgång. Personuppgiftsskyddet påverkas inte heller. Den skapar alltså inte ensam en generell rätt att få ut alla data. |
| 1 kap. 4 § | Definierar bland annat dynamiska data, offentligt företag, offentligt styrt organ, gränssnitt och vidareutnyttjande. |
| 1 kap. 5 § | Anger vilka aktörer som ska tillämpa lagen och under vilka förutsättningar offentliga företag och offentligt styrda organ omfattas. Kommunalt ägande ensamt avgör inte varje tillämpningsfråga. |
| 1 kap. 8 § | Anger när lagen tillämpas, bland annat vid en begäran om vidareutnyttjande från någon som har rätt till tillgång enligt annan lag eller förordning. |
| 1 kap. 9–10 §§ | Innehåller undantag, bland annat för särskild tillgång på grund av identitet/ställning och vissa tredje mans immateriella rättigheter. Datorprogram och logotyper undantas också enligt 10 §. |

### Format och villkor

| Bestämmelse | Innebörd i korthet | Betydelse för Sopham |
| --- | --- | --- |
| 2 kap. 1 § | Tillgängliggörande sker under förutsättning att säkerhet och personuppgiftsskydd kan upprätthållas. | Bedömningen kvarstår även när data ska återanvändas. |
| 2 kap. 2 § | Befintligt format ska användas, eller på begäran ett öppet, maskinläsbart och i förekommande fall tillgängligt och sökbart format, om det är lämpligt samt praktiskt och tekniskt möjligt, med tillhörande metadata. | Stöd för att efterfråga befintlig JSON, CSV eller motsvarande i stället för att bara få en utskrift. |
| 2 kap. 3 § | Värdefulla datamängder ska tillgängliggöras maskinläsbart genom lämpligt gränssnitt eller bulknedladdning. | Det är **inte verifierat** att sophämtningsscheman är en sådan datamängd. Hänvisa inte till detta som en fastställd API-skyldighet för SVOA. |
| 2 kap. 4 § | Dynamiska data ska tillgängliggöras omedelbart efter insamling eller framställning genom lämpligt gränssnitt eller bulknedladdning. Oproportionerlig arbetsinsats kan motivera skälig fördröjning eller nödvändiga tillfälliga tekniska begränsningar. | Kan vara relevant om dessa scheman omfattas och kvalificerar som dynamiska data. Det är inte automatiskt rätt till just webbplatsens befintliga endpoint. |
| 2 kap. 5 § | Villkor måste vara motiverade av allmänintresse, objektiva, proportionerliga och icke-diskriminerande för jämförbara former av vidareutnyttjande. De får inte begränsa konkurrensen eller i onödan inskränka vidareutnyttjandet. | Stöd för att begära motivering av licens- och användningsbegränsningar, inte bara ett generellt ja eller nej. |

**Inte fastställt:** Den exakta klassificeringen av innehavaren, att alla efterfrågade uppgifter omfattas eller att schemana är dynamiska data i lagens mening.

## 4. Upphovsrätt och databasskydd

[Lag (1960:729) om upphovsrätt till litterära och konstnärliga verk](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-1960729-om-upphovsratt-till-litterara-och_sfs-1960-729/)

### 49 § — kataloger, tabeller och liknande sammanställningar

Bestämmelsen ger under angivna förutsättningar skydd för sammanställningar med ett stort antal uppgifter eller som är resultatet av en väsentlig investering. Den innehåller även en regel om ogiltighet för avtalsvillkor som utvidgar framställarens rätt enligt första stycket till ett offentliggjort arbete.

Ett enskilt faktiskt datum är normalt inte i sig ett upphovsrättsligt verk. Det innebär däremot inte att en fullständig databas, återkommande uttag eller webbplatsens texter, bilder, logotyper och kod får återanvändas utan separat bedömning. Omfattningen av uttag och eventuella rättigheter hos en systemleverantör kan spela roll.

Öppna datalagens undantag för tredje mans upphovsrätt finns i 1 kap. 10 §. Att en handling är offentlig betyder inte i sig att alla immateriella rättigheter försvinner.

## 5. Personuppgifter

[EU:s dataskyddsförordning, förordning (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)

Relevanta utgångspunkter är artikel 4.1 om personuppgifter, artikel 5 om bland annat ändamålsbegränsning, uppgiftsminimering och lagringsminimering samt artikel 6 om rättslig grund. Om en backendleverantör är personuppgiftsbiträde blir även artikel 28 relevant; eventuella överföringar utanför EU/EES måste bedömas enligt kapitel V.

En adress eller ett schema kan vara personuppgifter om informationen avser en identifierad eller identifierbar fysisk person. Att uppgifter redan finns på en offentlig webbplats innebär inte ett generellt GDPR-undantag för appens egen behandling.

Sophams behandling behöver bedömas separat från SVOA:s utlämnande. Ett samtyckesfält och avsaknad av databas är inte ensamma bevis på att samtliga dataskyddskrav är uppfyllda.

## 6. CORS och serverbaserad åtkomst

CORS är en teknisk webbläsarmekanism, inte i sig ett juridiskt avgörande om vidareutnyttjande.

- Ett CORS-fel bevisar inte att återanvändning är förbjuden.
- En server kan tekniskt göra förfrågningar som en webbläsare inte får läsa. Det bevisar inte att varje serverbaserad användning är tillåten.
- Offentlighetsprincipen ger inte automatiskt rätt att kringgå inloggning, åtkomstkontroller eller andra skydd.
- Rätten att få ut data är inte automatiskt rätt till obegränsad trafik, viss servicenivå, CORS-konfiguration eller en särskild endpoint.

Den aktuella sidan är [När kommer sopbilen?](https://www.stockholmvattenochavfall.se/villa-och-radhus/avfallstjanster/nar-kommer-sopbilen/). Vid den tekniska undersökningen laddade dess JavaScript resultaten via `Search`; själva HTML-sidan innehöll inga adresspecifika hämtningsdatum. Detta är en teknisk observation, inte ett åtkomstmedgivande eller en garanti för ett stabilt API.

## Praktisk slutsats

Det finns en möjlig lagstadgad väg till tillgång och vidareutnyttjande. Påståendet att ett uttryckligt frivilligt tillstånd från SVOA **alltid** måste finnas är för kategoriskt. Påståendet att en offentlig webbplats gör all automatiserad återanvändning tillåten är också för kategoriskt.

Använd [e-postbegäran](svoa-data-request.md) för att få tillgång, tillämpliga villkor och teknisk åtkomst klarlagda. Be om lagstöd och information om eventuell överklaganderätt vid avslag eller begränsningar.

Liveåtkomst är fortfarande avstängd i [backendkonfigurationen](../worker/wrangler.jsonc). Den nuvarande tillståndsspärren är en försiktighetsåtgärd i implementationen, inte ett slutligt rättsligt ställningstagande om att frivilligt medgivande är den enda möjliga grunden. Ändra inte spärren enbart med stöd av detta referensunderlag.
