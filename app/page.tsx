"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createCalendar, fetchPickups, OFFICIAL_URL, stockholmToday, validDate, type Pickup } from "@/lib/pickups";

export default function Home() {
  const [consent, setConsent] = useState(false);
  const [address, setAddress] = useState("");
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [bin, setBin] = useState("Restavfall och matavfall");
  const request = useRef<AbortController | null>(null);
  const locationVersion = useRef(0);
  const current = pickups.filter((pickup) => pickup.date >= stockholmToday());

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!consent || !address.trim()) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setPickups([]);
    setSource("");
    setStatus("Hämtar uppgifter från Stockholm Vatten och Avfall …");
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const results = await fetchPickups(address.trim(), controller.signal);
      if (request.current !== controller) return;
      setPickups(results);
      setSource("Stockholm Vatten och Avfall");
      setStatus(results.length
        ? `Hämtat för ${address.trim()}. Kontrollerat ${new Date().toLocaleString("sv-SE")}.`
        : "Inga hämtningsdagar hittades. Kontrollera fullständig adress med postort. För flerbostadshus: fråga fastighetsägaren.");
    } catch {
      if (request.current !== controller) return;
      setStatus("Vi kunde inte läsa hämtningsdata. Tjänsten kan vara otillgänglig eller blockera webbläsaråtkomst. Öppna den officiella söksidan nedan och lägg in datumet själv.");
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) setBusy(false);
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setLocation("Din webbläsare stöder inte platsåtkomst. Skriv din adress i stället.");
      return;
    }
    const version = ++locationVersion.current;
    setLocation("Väntar på ditt tillstånd till platsåtkomst …");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (version !== locationVersion.current) return;
      const inRegion = coords.latitude >= 59.1 && coords.latitude <= 59.5 &&
        coords.longitude >= 17.7 && coords.longitude <= 18.3;
      setLocation(inRegion
        ? "Du verkar vara i Stockholmsområdet. Skriv din gatuadress nedan för rätt hämtningsdag. Platsen används bara här och har inte skickats vidare."
        : "Din ungefärliga plats verkar vara utanför Stockholmsområdet. Du kan ändå söka på en adress i Stockholms stad.");
    }, () => {
      if (version === locationVersion.current) setLocation("Platsåtkomst nekades eller kunde inte bestämmas. Du kan fortfarande skriva en adress.");
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
  }

  function clear() {
    request.current?.abort();
    request.current = null;
    locationVersion.current++;
    setConsent(false);
    setAddress("");
    setPickups([]);
    setSource("");
    setLocation("");
    setStatus("Samtycket är återkallat och uppgifterna är rensade från sidan.");
    setDate("");
    setBusy(false);
  }

  function addManual(event: React.FormEvent) {
    event.preventDefault();
    if (!validDate(date) || date < stockholmToday()) return;
    request.current?.abort();
    request.current = null;
    setBusy(false);
    setPickups([{ date, group: bin, frequency: "" }]);
    setSource("Eget datum – inte verifierat av Sopham");
    setStatus("Ditt eget datum är inlagt. Kontrollera det mot den officiella hämtningsinformationen.");
  }

  function download() {
    const blob = new Blob([createCalendar(current, source)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sophamtning.ics";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <a className="skip" href="#main">Hoppa till innehållet</a>
      <header className="header">
        <Link className="brand" href="/" aria-label="Sopham startsida"><span aria-hidden="true">♻</span> sopham<span className="brand-dot">.</span></Link>
        <nav aria-label="Huvudmeny"><a href="#planera">Min hämtning</a><a href="#sortera">Sortera rätt</a><a href="#integritet">Integritet</a></nav>
      </header>
      <main id="main">
        <section className="hero">
          <div>
            <p className="eyebrow">FÖR ETT LITE GRÖNARE STOCKHOLM</p>
            <h1>Mindre sopstress.<br /><span>Mer vardagslugn.</span></h1>
            <p className="intro">När kommer sopbilen? Få koll på nästa hämtning, gör kärlen redo och lägg dagen i din kalender.</p>
            <a className="button" href="#planera">Hitta min hämtningsdag <span aria-hidden="true">↗</span></a>
            <p className="hero-note">Inget konto. Inga spårningskakor. Bara lite bättre koll.</p>
          </div>
          <div className="illustration" aria-hidden="true">
            <span className="sun">☀</span><span className="spark">✦</span>
            <div className="bin bin-green"><div className="lid" /><span>♻</span><div className="wheels" /></div>
            <div className="bin bin-brown"><div className="lid" /><span>♡</span><div className="wheels" /></div>
            <div className="illustration-label">Redo för en ny runda!</div>
          </div>
        </section>
        <div className="steps" aria-label="Så fungerar det"><span><b>01</b> Hitta din adress</span><span><b>02</b> Kolla nästa hämtning</span><span><b>03</b> Gör kärlen redo</span></div>

        <section id="planera" className="planner section">
          <div className="section-heading"><p className="eyebrow">DIN VARDAG, LITE ENKLARE</p><h2>När är det dags?</h2><p>För villor och radhus i hela Stockholms stad. Bor du i lägenhet? Din fastighetsägare har hämtningsschemat.</p></div>
          <div className="planner-grid">
            <div className="card">
              <h3>Hitta din hämtning</h3>
              <p>Uppgifterna hämtas från Stockholm Vatten och Avfalls publika adressökning. Åtkomsten är inte garanterad.</p>
              <button className="secondary" type="button" onClick={locate}>⌖ Använd min ungefärliga plats (frivilligt)</button>
              <p className="small">När du trycker godkänner du att webbläsaren använder din plats för en ungefärlig områdeskontroll, inte för att hitta din adress. Koordinater sparas inte eller skickas till oss.</p>
              <p role="status" className="small">{location}</p>
              <form onSubmit={search}>
                <label htmlFor="address">Gatuadress och postort</label>
                <input id="address" autoComplete="street-address" placeholder="Till exempel: din gata 12, Bromma" value={address} onChange={(event) => {
                  request.current?.abort();
                  request.current = null;
                  setBusy(false);
                  setAddress(event.target.value);
                  setPickups([]);
                  setSource("");
                  setStatus("");
                }} maxLength={200} required />
                <label className="check"><input type="checkbox" checked={consent} onChange={(event) => {
                  if (!event.target.checked) clear();
                  else setConsent(true);
                }} /><span>Jag samtycker till att adressen skickas till Stockholm Vatten och Avfall för denna sökning och accepterar <a href="#integritet">integritetsinformationen och användarvillkoren</a>.</span></label>
                <button type="submit" disabled={!consent || busy || !address.trim()}>{busy ? "Hämtar …" : "Visa hämtningsdagar"} <span aria-hidden="true">→</span></button>
              </form>
              <a className="source-link" href={OFFICIAL_URL} target="_blank" rel="noreferrer">Sök direkt hos Stockholm Vatten och Avfall ↗</a>
            </div>
            <div className="card results" aria-busy={busy}>
              <div className="card-top"><h3>Din nästa hämtning</h3><span className="tag">STOCKHOLM</span></div>
              <p role="status">{status || "Sök på din adress för att se nästa hämtningsdag. Vi visar aldrig påhittade datum."}</p>
              {current.length ? <>
                <p className="small">Källa: {source}</p>
                <ul className="pickup-list">{current.map((pickup, index) => <li key={`${pickup.date}-${index}`}>
                  <span className="pickup-icon" aria-hidden="true">♻</span><div><strong>{new Intl.DateTimeFormat("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Stockholm" }).format(new Date(`${pickup.date}T12:00:00Z`))}</strong><p>{pickup.group}</p>{pickup.frequency && <small>{pickup.frequency} · endast nästa datum visas</small>}</div>
                </li>)}</ul>
                <div className="tip"><strong>Kvällen före: klart för hämtning!</strong><p>Följ anvisningarna för din fastighet. Se till att kärlet är åtkomligt och att inget blockerar vägen.</p></div>
                <button type="button" onClick={download}>↓ Lägg i min kalender (.ics)</button>
                <p className="small">Enstaka heldagshändelser med påminnelse kvällen före, om din kalender stöder det. Importera filen i din kalender. Inga framtida datum beräknas och kalendern uppdateras inte automatiskt.</p>
              </> : <div className="empty"><span aria-hidden="true">☀</span><p>{pickups.length ? "Datakällans datum har redan passerat. Kontrollera ett nytt datum hos SVOA." : "Här landar din nästa hämtningsdag."}</p></div>}
              <details><summary>Lägg in ett eget, kontrollerat datum</summary><p>Om direktsökningen inte fungerar: kontrollera datumet hos SVOA först. Ett eget datum ersätter tidigare resultat och märks som ej verifierat.</p>
                <form onSubmit={addManual}><label htmlFor="bin">Kärl / avfall</label><select id="bin" value={bin} onChange={(event) => setBin(event.target.value)}><option>Restavfall och matavfall</option><option>Restavfall</option><option>Matavfall</option><option>Förpackningar</option></select><label htmlFor="date">Nästa hämtningsdatum</label><input id="date" type="date" value={date} min={stockholmToday()} max="9999-12-31" onChange={(event) => setDate(event.target.value)} required /><button className="secondary" type="submit">Använd mitt datum</button></form>
              </details>
            </div>
          </div>
        </section>

        <section id="sortera" className="section">
          <div className="section-heading"><p className="eyebrow">SMÅ VANOR, STOR SKILLNAD</p><h2>Var sak på sin plats.</h2><p>Några enkla tips inför nästa runda. Följ alltid aktuella lokala anvisningar.</p></div>
          <div className="sorting-grid">
            <article className="sort-card"><span aria-hidden="true">🍎</span><h3>Matavfall</h3><p>Matrester, skal och kaffesump. Använd den matavfallspåse som din avfallsleverantör anvisar, inte en plastpåse.</p></article>
            <article className="sort-card"><span aria-hidden="true">📦</span><h3>Förpackningar</h3><p>Sortera tomma förpackningar efter material. Lämna dem i rätt insamling för din fastighet eller på en återvinningsstation.</p></article>
            <article className="sort-card"><span aria-hidden="true">🔋</span><h3>Inte i soppåsen!</h3><p>Batterier, elavfall och farligt avfall ska lämnas till särskild insamling, aldrig i restavfall eller matavfall.</p></article>
          </div>
          <p className="sorting-link">Osäker? Besök <a href="https://www.stockholmvattenochavfall.se/" target="_blank" rel="noreferrer">SVOA:s sorteringsguide och information om återvinningsplatser ↗</a>.</p>
        </section>

        <section id="integritet" className="section legal">
          <p className="eyebrow">ÖPPET OCH ENKELT</p><h2>Din plats. Dina val.</h2>
          <details open><summary>Integritet och samtycke</summary><p>Sopham kräver inget konto och har ingen åldersgräns. Vi använder inga analysverktyg, spårningskakor eller lokal lagring. Adress, resultat och platsmeddelande finns bara i sidans minne och försvinner när du laddar om eller rensar.</p><p>Platsåtkomst är frivillig och kräver webbläsarens tillstånd. Webbläsaren eller operativsystemet kan använda sin platstjänst för att bestämma positionen. Sopham skickar inte koordinater till någon server. Adressökning är ett separat val: med ditt samtycke skickas adressen direkt till SVOA. De ser även din IP-adress och behandlar förfrågan enligt sin integritetsinformation. Webbhotellet kan behandla IP-adresser i åtkomstloggar när sidan laddas.</p><p>Du kan återkalla samtycket genom att rensa nedan, och ta bort platstillstånd i webbläsarens inställningar. Rensning tar inte tillbaka redan skickade förfrågningar eller kalenderfiler som du laddat ned. <a href="https://www.stockholmvattenochavfall.se/" target="_blank" rel="noreferrer">Läs SVOA:s information om personuppgifter på deras webbplats.</a></p></details>
          <details><summary>Användarvillkor och datakällor</summary><p>Sopham är en fristående hjälp, inte en tjänst från Stockholms stad. Hämtningsdata kommer, när åtkomsten fungerar, från Stockholm Vatten och Avfalls publika söktjänst för villor och radhus. Det är inte ett garanterat öppet API. Vi saknar verifierade hämtningsscheman för flerbostadshus och andra kommuner.</p><p>Uppgifter kan vara felaktiga, försenade eller ändras vid exempelvis helgdagar. Kontrollera alltid aktuellt datum och anvisningar hos SVOA. Egna datum är inte verifierade. Kalenderexport är en ögonblicksbild, inte ett abonnemang.</p><p>Tjänsten tillhandahålls utan garanti för fullständighet eller riktighet. I den utsträckning tillämplig lag medger ansvarar vi inte för missad hämtning eller skador till följd av felaktig information. Villkoren begränsar inte rättigheter eller ansvar som inte får begränsas enligt lag.</p></details>
          <button type="button" className="secondary" onClick={clear}>Återkalla samtycke och rensa mina uppgifter</button>
        </section>
      </main>
      <footer><Link className="brand" href="/">♻ sopham.</Link><p>Lite enklare vardag. Lite gladare planet.</p><span>Stockholm · Ingen inloggning behövs</span></footer>
    </>
  );
}
