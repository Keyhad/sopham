# Cloudflare-backend för adressökning

## Status och förutsättningar

Cloudflare-backend är förberedd men inte publicerad. Ett separat lokalt test med en av användaren godkänd adress har verifierat server-side-sökning och datakällans aktuella JSON-format. Det fastställer inte återanvändningsrätt eller generell tillgänglighet. SVOA-tillstånd är inte bekräftat. Behåll `SVOA_ACCESS_APPROVED=false` tills SVOA bekräftar server-side-åtkomst och återanvändning av hämtningsdata. HTML-sidan innehåller inga hämtningsdatum; dess JavaScript frågar samma `Search`-endpoint som backend använder. Detta är inte en oberoende datakälla eller en browser-scraper.

Frontend ligger kvar på GitHub Pages. Du behöver ett Cloudflare-konto med Workers och rate-limit-bindningar samt Node.js 22.13+ lokalt. Tillgänglighet hos SVOA och exakt liveformat måste verifieras efter tillstånd. Vid andra format ska parser och tester uppdateras från verifierade, anonymiserade exempel; inga datum gissas.

## Konfiguration och publicering

1. Kör `npm ci`, `npm run worker:check` och `npm test`.
2. Kör `npx wrangler login` lokalt. Lägg aldrig token eller kontoinloggning i repot eller chatten.
3. Granska [worker/wrangler.jsonc](../worker/wrangler.jsonc). `ALLOWED_ORIGIN` ska vara exakt `https://keyhad.github.io`, utan sökväg eller avslutande snedstreck. Byt till den faktiska frontend-origin om egen domän används.
4. Kör `npm run worker:deploy`. Anteckna den Worker-URL som kommandot visar. Publicering med spärren kvar gör inte SVOA-förfrågningar.
5. Efter skriftligt tillstånd, juridisk granskning och kontroll av Cloudflares behandling av personuppgifter: sätt `SVOA_ACCESS_APPROVED` till strängen `"true"` och deploya igen. Dokumentera tillståndet privat, inte med kontaktuppgifter i det publika repot.
6. Testa en egen, godkänd adress via `/pickups`, med `Origin`-headern ovan och JSON-POST `{ "address": "..." }`. Bekräfta nästa datum mot officiella sidan. Ändra inte spärren enbart för att få tester att gå igenom.
7. Lägg till GitHub Actions repository-variable `NEXT_PUBLIC_PICKUP_WORKER_URL` med den fullständiga HTTPS-URL:n inklusive `/pickups`, exempelvis `https://sopham-pickups.<ditt-subdomännamn>.workers.dev/pickups`.
8. Kör Pages-workflow igen. Variabeln läses vid bygge, inte vid sidladdning. Adressökning ska nu använda POST till Worker, inte direkt GET från webbläsaren till SVOA.

Det finns ingen automatisk Worker-deploy i Pages-workflow. CI validerar Worker med dry-run men publicerar bara den statiska frontend.

## Lokal utveckling

`npm run worker:dev` startar en lokal Worker med samma spärr. För ett lokalt backendtest måste en uttrycklig lokal origin, exempelvis `http://localhost:3000`, konfigureras. Produktionskonfigurationen tillåter inte denna origin. Mockade enhetstester kräver varken Cloudflare-inloggning, nätverksåtkomst eller att spärren ändras.

Frontend kan anslutas med:

```sh
NEXT_PUBLIC_PICKUP_WORKER_URL=http://localhost:8787/pickups npm run dev
```

Produktionskonfigurationen ska förbli avstängd tills tillämplig rättslig grund är klarlagd. Ett uttryckligen beställt, avgränsat lokalt test är inte ett produktionsmedgivande.

För en frontend med egen same-origin-backend kan `NEXT_PUBLIC_PICKUP_WORKER_URL=/pickups` användas. Ange backendens verkliga driftmiljö med `NEXT_PUBLIC_PICKUP_BACKEND_PROVIDER` så att samtyckestexten inte felaktigt anger Cloudflare; standardvärdet är Cloudflare. Lokal HTTP fungerar för sökning och kalenderexport, men verklig platsåtkomst kräver normalt HTTPS. Använd hela adressvärdet från SVOA:s autocomplete, inklusive postort och postnummer: förkortade gatunamn kan ge felsvar även med HTTP 200.

## Kontrakt och skydd

- Endast `POST /pickups` med JSON-adress och tillåten origin. Preflight tillåter enbart POST och Content-Type. Cookies används inte.
- Adressen är högst 200 tecken, utan kontrolltecken. Request-body begränsas till 2048 byte även utan Content-Length.
- Upstream-URL är fast; klienten kan inte välja målserver. Redirects följs inte.
- Cloudflare rate limiting: 10 anrop per 60 sekunder per anslutande IP. Bindningen krävs; saknad bindning stoppar sökningen. Begränsningen är lokal till Cloudflares infrastruktur och är inte en global exakt kvot.
- Origin/CORS är inte autentisering: andra klienter kan sätta en Origin-header. Följ trafik och kostnader i Cloudflares administratörsgränssnitt utan adressloggning och konfigurera ytterligare driftbegränsningar efter behov.
- Upstream har 8 sekunders timeout, högst 65536 byte svar och måste returnera JSON med validerbara datum. Felsvar blir 4xx/5xx, aldrig tomma lyckade listor.
- Backend returnerar bara `group`, `executionDate` och `fetchFrequency`. `Cache-Control: no-store`; inga resultat lagras i KV, databas eller cache.
- Kodens loggar innehåller endast felkod och HTTP-status. Observability är avstängt i konfigurationen. Aktivera inte request-/body-loggning eller URL-loggning i drift utan separat integritetsbedömning.
- Frontend kan avbryta sin förfrågan och ignorera sena resultat. Ett redan startat upstreamanrop kan inte garanterat återkallas.

## Integritet och avstängning

Cloudflare hanterar adress och anslutande IP; SVOA tar emot adress och backendens anslutning. Infrastruktur kan behandla nätverksuppgifter även om applikationen inte lagrar dem. Granska personuppgiftsbiträdesavtal, överföringar, retention och rättslig grund; komplettera ansvarig utgivare och kontaktväg före aktivering. Den uppdaterade samtyckestexten i appen beskriver backendflödet, men ersätter inte juridisk granskning.

När frontendens frivilliga ”Kom ihåg” används sparas adress och senaste officiella resultat lokalt i användarens webbläsare, inte hos backend. Samtycket omfattar automatisk sökning vid återbesök och nytt dygn till samma konfigurerade backend och driftmiljö. Ändrad endpoint eller driftmiljö kräver nytt samtycke. Det ändrar inte backendens lagring eller tillståndsspärr.

Vid återkallat SVOA-tillstånd: sätt `SVOA_ACCESS_APPROVED=false` och deploya omedelbart. Ta även bort `NEXT_PUBLIC_PICKUP_WORKER_URL` och bygg om frontend för att visa den manuella primärvägen igen.
