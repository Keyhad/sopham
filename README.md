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

## Data och begränsningar

Efter uttryckligt samtycke skickas adressen direkt från webbläsaren till Stockholm Vatten och Avfalls publika söktjänst:
`https://www.stockholmvattenochavfall.se/villa-och-radhus/avfallstjanster/nar-kommer-sopbilen/Search?address=…`.

Detta är en odokumenterad tjänst, inte ett verifierat öppet API med garanterad tillgänglighet eller återanvändningslicens. Liveåtkomst och CORS kunde inte verifieras i utvecklingsmiljön. Kontrollera dessa och datavillkoren med SVOA före publicering. Appen visar felmeddelande och länk till officiell sökning vid nätverksfel, blockerad CORS eller oväntade data. Den använder inte proxy, API-nycklar eller påhittade hämtningsdatum.

Endast nästa datum per kärl visas. Kalenderfiler innehåller enstaka heldagshändelser och en påminnelse kvällen före, inte uppskattade återkommande scheman. Kalendern synkroniseras inte. Användaren kan lägga in ett eget kontrollerat datum, tydligt märkt som ej verifierat. Flerbostadshus hänvisas till fastighetsägaren; andra kommuner stöds inte ännu.

Frivillig geolokalisering gör endast en ungefärlig lokal områdeskontroll; den hittar inte gatuadressen och skickar inte koordinater vidare. Alla uppgifter rensas vid omladdning eller återkallat samtycke. Kalenderfiler och redan skickade förfrågningar kan inte återkallas.

## Före publik drift

Låt ansvarig utgivare granska användarvillkor och integritetsinformation juridiskt. Komplettera med verklig personuppgiftsansvarig, kontaktväg, webbhotellets logghantering och eventuella lagringstider efter att driftleverantör har valts. Samtycke och ansvarsfriskrivning i gränssnittet är inte i sig en garanti för GDPR-efterlevnad eller befrielse från lagstadgat ansvar.
