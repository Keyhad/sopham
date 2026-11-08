# E-postutkast: hämtningsdata för vidareutnyttjande

Tillhörande lagrum och avgränsningar finns i [rättsligt referensunderlag](svoa-legal-reference.md). Den länken behöver inte följa med i e-postmeddelandet.

**Till:** registraturet@svoa.se  
**Ämne:** Begäran om tillgång till och vidareutnyttjande av sophämtningsdata – Sopham

---

Hej,

Jag utvecklar Sopham, en fristående app som hjälper boende i villor och radhus i Stockholms stad att kontrollera nästa sophämtningsdag och lägga in den i sin kalender.

Webbplats: https://keyhad.github.io/sopham/  
Öppen källkod: https://github.com/Keyhad/sopham

Jag begär att få ta del av befintliga uppgifter om nästa sophämtningsdatum per adress som ligger till grund för er publika tjänst ”När kommer sopbilen?”:

https://www.stockholmvattenochavfall.se/villa-och-radhus/avfallstjanster/nar-kommer-sopbilen/

Begäran avser adress, avfallsslag/kärlgrupp, nästa hämtningsdatum och eventuell hämtningsfrekvens. Den avser inte namn, kundnummer, kontaktuppgifter, betalningsuppgifter eller andra kunduppgifter. Jag önskar uppgifterna i befintligt maskinläsbart format, tillsammans med befintlig beskrivning av fälten.

Syftet är vidareutnyttjande i en tredjepartsapp. Jag ber er pröva begäran enligt tillämpliga bestämmelser i 2 kap. tryckfrihetsförordningen, 2 kap. 3 § offentlighets- och sekretesslagen samt lag (2022:818) om den offentliga sektorns tillgängliggörande av data. Jag ber er även ange hur öppna datalagen är tillämplig på dessa uppgifter och på den juridiska person som innehar dem.

För appens löpande funktion är ett adressbaserat uppslag att föredra framför en fullständig databasexport. Den avsedda lösningen frågar när en användare själv söker på en adress. Med ett separat, frivilligt val kan adress och senaste resultat sparas i användarens egen webbläsare och uppdateras automatiskt vid återbesök, återgång till fliken eller nytt dygn i en öppen sida. Appen visar källan tydligt och lagrar inte adresser eller resultat i en egen databas hos backend. Appen är inte tänkt att kartlägga samtliga hushåll. Om ni behöver en närmare avgränsning för att handlägga begäran får ni gärna ange detta.

Jag önskar särskilt besked om följande:

1. Finns ett dokumenterat API, en öppen datamängd eller någon annan stödd åtkomstväg för denna användning? Finns i så fall dokumentation, exempelvis OpenAPI/Swagger?
2. Om ingen separat tjänst finns: kan webbplatsens befintliga `AutoCompleteMe`- och `Search`-endpoints användas för begränsade adressförslag och uppslag via vår backend, inklusive de frivilliga automatiska uppdateringarna ovan? Adressförslag hämtas bara efter samtycke och en uttrycklig knapptryckning, och användaren väljer själv sin fullständiga adress. Om detta inte är en stödd åtkomstväg, vilket alternativ erbjuder ni?
3. Vilka villkor gäller för vidareutnyttjande och visning i appen, inklusive eventuell licens, källhänvisning, avgifter och anropsgränser? Ange gärna rättslig grund för eventuella begränsningar.
4. Finns relevanta begränsningar med hänsyn till sekretess, personuppgifter eller tredje mans rättigheter? Kan i så fall övriga uppgifter lämnas ut separat?
5. Om direktåtkomst från webbläsare erbjuds: kan ni stödja origin `https://keyhad.github.io` genom CORS? Ett serverbaserat alternativ är också möjligt.

Begäran om tillgång till befintliga uppgifter är separat från frågan om ni erbjuder löpande teknisk integration eller support. Om API-åtkomst inte erbjuds, ber jag därför att begäran om utlämnande och vidareutnyttjande ändå prövas.

Om begäran helt eller delvis avslås, eller om vidareutnyttjandet begränsas, ber jag om ett skriftligt beslut med motivering, tillämpliga lagrum och information om eventuell överklaganderätt.

Bekräfta gärna att ni har tagit emot begäran och ange eventuellt diarienummer. Om en annan juridisk person inom er koncern innehar uppgifterna, ber jag er hänvisa mig till rätt mottagare eller vidarebefordra begäran dit.

Tack för hjälpen!

Vänliga hälsningar,  
[Ditt namn]  
[Din e-postadress]

---

## Före utskick

- Ersätt signaturens platshållare i ditt e-postprogram. Lägg inte personliga kontaktuppgifter i det publika repot.
- Anpassa beskrivningen om appens avsedda behandling eller omfattning ändras.
- Detta är ett utkast till en begäran, inte ett påstående om att en viss åtkomsträtt eller API-skyldighet redan är fastställd.
- Behåll liveåtkomst avstängd tills villkoren eller annan tillämplig rättslig grund har klarlagts. Spara korrespondensen utanför det publika repot.
