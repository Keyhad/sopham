"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import brand from "@/docs/branding/brand.json";
import { BrandIcon, BrandIllustration, BrandLogo } from "./branding";
import { BackendError, createCalendar, fetchPickups, lookupAvailable, OFFICIAL_URL, stockholmToday, validDate, type Pickup } from "@/lib/pickups";
import { fetchAddresses, type AddressSuggestion } from "@/lib/addresses";
import { locationErrorMessage } from "@/lib/location";
import { DEMO_FILENAME, DEMO_SOURCE, demoPickups } from "@/lib/demo";
import { forgetRemembered, readRemembered, saveRemembered, REMEMBERED_KEY } from "@/lib/remembered";
import { pickupMaterials } from "@/lib/pickup-display";
import { PickupOverview } from "./pickup-overview";

const backendProvider = process.env.NEXT_PUBLIC_PICKUP_BACKEND_PROVIDER || "Cloudflare";

function subscribeToUrl(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function demoSettingsVisible() {
  return new URLSearchParams(window.location.search).get("demo") === "settings";
}

function serverDemoSettingsVisible() {
  return false;
}

export default function Home() {
  const showDemoSettings = useSyncExternalStore(subscribeToUrl, demoSettingsVisible, serverDemoSettingsVisible);
  const [demo, setDemo] = useState(false);
  const [consent, setConsent] = useState(false);
  const [address, setAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressStatus, setAddressStatus] = useState("");
  const [findingAddress, setFindingAddress] = useState(false);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [bin, setBin] = useState("Restavfall och matavfall");
  const [remember, setRemember] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [resultAddress, setResultAddress] = useState("");
  const [storedAddress, setStoredAddress] = useState("");
  const [today, setToday] = useState(stockholmToday);
  const request = useRef<AbortController | null>(null);
  const addressRequest = useRef<AbortController | null>(null);
  const locationVersion = useRef(0);
  const rememberCurrent = useRef(false);
  const savedAddress = useRef("");
  const lastAttempt = useRef(0);
  const current = pickups.filter((pickup) => pickup.date >= today);
  const canSearch = demo || lookupAvailable();
  const invalidateLocation = useCallback(() => { locationVersion.current++; }, []);
  const invalidateAddressSearch = useCallback(() => {
    addressRequest.current?.abort();
    addressRequest.current = null;
  }, []);
  const clearAddressSearch = useCallback(() => {
    invalidateAddressSearch();
    setFindingAddress(false);
    setAddressSuggestions([]);
    setAddressStatus("");
  }, [invalidateAddressSearch]);

  const loadPickups = useCallback(async (lookupAddress: string, isDemo: boolean, preserve: boolean) => {
    clearAddressSearch();
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    lastAttempt.current = Date.now();
    setBusy(true);
    setResultAddress(lookupAddress);
    setStale(preserve);
    if (!preserve) {
      setPickups([]);
      setSource("");
      setCheckedAt(null);
    }
    setStatus(isDemo ? "DEMO – visar en simulerad sökning …" : "Uppdaterar hämtningsuppgifterna från Stockholm Vatten och Avfall …");
    if (!isDemo && rememberCurrent.current && !preserve) {
      try {
        saveRemembered(window.localStorage, { version: 1, address: lookupAddress, endpoint: process.env.NEXT_PUBLIC_PICKUP_WORKER_URL || "", provider: backendProvider, checkedAt: null, pickups: [] });
        savedAddress.current = lookupAddress;
        setStoredAddress(lookupAddress);
      } catch {
        setStorageError("Adressen kunde inte sparas på enheten. Sökningen kan fortsätta, men kontrollera webbläsarens lagringsinställningar.");
      }
    }
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const results = isDemo
        ? await demoPickups(controller.signal)
        : await fetchPickups(lookupAddress, controller.signal);
      if (request.current !== controller) return;
      const checked = isDemo ? null : new Date().toISOString();
      setPickups(results);
      setSource(isDemo ? DEMO_SOURCE : "Stockholm Vatten och Avfall");
      setCheckedAt(checked);
      setStale(false);
      setToday(stockholmToday());
      setStatus(isDemo
        ? "DEMO – exempelresultat. Adressen har inte skickats någonstans och datumen gäller inte din fastighet."
        : results.length
        ? "Hämtningsuppgifterna är uppdaterade."
        : "Inga hämtningsdagar hittades. Kontrollera fullständig adress med postort. För flerbostadshus: fråga fastighetsägaren.");
      if (!isDemo && rememberCurrent.current) {
        try {
          saveRemembered(window.localStorage, { version: 1, address: lookupAddress, endpoint: process.env.NEXT_PUBLIC_PICKUP_WORKER_URL || "", provider: backendProvider, checkedAt: checked, pickups: results });
          savedAddress.current = lookupAddress;
          setStoredAddress(lookupAddress);
          setStorageError("");
        } catch {
          setStorageError("Resultaten är uppdaterade, men kunde inte sparas på enheten. De kanske inte finns kvar nästa gång du öppnar sidan.");
        }
      }
      return true;
    } catch (error) {
      if (request.current !== controller) return;
      setStale(preserve);
      setStatus(isDemo
        ? "DEMO – den simulerade sökningen avbröts eller kunde inte visas. Försök igen."
        : preserve
        ? "Kunde inte uppdatera. Senast sparade uppgifter visas – kontrollera dem hos SVOA."
        : error instanceof BackendError ? error.message
        : "Vi kunde inte läsa hämtningsdata. Använd Hitta rätt adress och välj ett förslag, eller lägg in datumet själv.");
      return false;
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }, [clearAddressSearch]);

  useEffect(() => {
    async function restore() {
      try {
        const saved = readRemembered(window.localStorage);
        if (!saved) return;
        if (saved.endpoint !== (process.env.NEXT_PUBLIC_PICKUP_WORKER_URL || "") || saved.provider !== backendProvider) {
          setStorageError("Backendinställningarna har ändrats. Bekräfta samtycket igen innan adressen skickas till en ny driftmiljö.");
          return;
        }
        rememberCurrent.current = true;
        savedAddress.current = saved.address;
        setStoredAddress(saved.address);
        setRemember(true);
        setConsent(true);
        setAddress(saved.address);
        setResultAddress(saved.address);
        setPickups(saved.pickups);
        setSource(saved.checkedAt ? "Stockholm Vatten och Avfall" : "");
        setCheckedAt(saved.checkedAt);
        setStale(true);
        if (lookupAvailable()) await loadPickups(saved.address, false, true);
        else setStatus("Adressökningen är avstängd. Sparade uppgifter visas utan uppdatering.");
      } catch {
        setStorageError("Sparade inställningar kunde inte läsas. Ingen automatisk sökning gjordes. Rensa sparade uppgifter eller kontrollera webbläsarens lagringsinställningar.");
      }
    }
    void restore();
    const refreshOnReturn = () => {
      setToday(stockholmToday());
      if (document.visibilityState === "visible" && rememberCurrent.current && savedAddress.current &&
          lookupAvailable() && !request.current && !addressRequest.current && Date.now() - lastAttempt.current > 30000) {
        void loadPickups(savedAddress.current, false, true);
      }
    };
    let day = stockholmToday();
    const timer = setInterval(() => {
      const nextDay = stockholmToday();
      if (nextDay !== day) {
        day = nextDay;
        refreshOnReturn();
      }
    }, 60000);
    const changedElsewhere = (event: StorageEvent) => {
      if (event.key !== REMEMBERED_KEY && event.key !== null) return;
      clearAddressSearch();
      request.current?.abort();
      request.current = null;
      rememberCurrent.current = false;
      savedAddress.current = "";
      setStoredAddress("");
      locationVersion.current++;
      setRemember(false);
      setConsent(false);
      setAddress("");
      setResultAddress("");
      setPickups([]);
      setSource("");
      setCheckedAt(null);
      setStale(false);
      setBusy(false);
      setLocation("");
      setStatus("Sparade inställningar ändrades i en annan flik. Bekräfta adress och samtycke igen.");
    };
    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);
    window.addEventListener("storage", changedElsewhere);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
      window.removeEventListener("storage", changedElsewhere);
      request.current?.abort();
      request.current = null;
      invalidateLocation();
      invalidateAddressSearch();
    };
  }, [loadPickups, invalidateLocation, invalidateAddressSearch, clearAddressSearch]);

  async function findAddress() {
    if (!consent || !lookupAvailable() || demo || address.trim().length < 3) {
      setAddressStatus("Skriv minst tre tecken och bekräfta samtycket för att hitta adressförslag.");
      return;
    }
    clearAddressSearch();
    const controller = new AbortController();
    addressRequest.current = controller;
    setFindingAddress(true);
    setAddressStatus("Hämtar adressförslag från SVOA …");
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const suggestions = await fetchAddresses(address.trim(), controller.signal);
      if (addressRequest.current !== controller) return;
      setAddressSuggestions(suggestions);
      setAddressStatus(suggestions.length
        ? "Välj din fullständiga adress nedan och tryck sedan Visa hämtningsdagar. Kontrollera husnummer och postort."
        : "Inga adresser hittades. Skriv mer av gatunamnet och husnumret, eller sök direkt hos SVOA.");
    } catch (error) {
      if (addressRequest.current !== controller) return;
      setAddressStatus(error instanceof BackendError ? error.message : "Adressförslagen kunde inte läsas. Försök igen eller sök direkt hos SVOA.");
    } finally {
      clearTimeout(timeout);
      if (addressRequest.current === controller) {
        addressRequest.current = null;
        setFindingAddress(false);
      }
    }
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!canSearch) {
      setStatus("Adressökningen är avstängd. Sök hos SVOA och lägg in ett kontrollerat datum själv.");
      return;
    }
    if (!consent || !address.trim()) return;
    const finished = await loadPickups(address.trim(), demo, resultAddress === address.trim() && Boolean(checkedAt) && !demo);
    if (finished !== undefined) document.getElementById("next-pickup")?.scrollIntoView({ block: "start" });
  }

  function forget() {
    rememberCurrent.current = false;
    savedAddress.current = "";
    setStoredAddress("");
    setRemember(false);
    try {
      forgetRemembered(window.localStorage);
      setStorageError("");
    } catch {
      setStorageError("Sparade uppgifter kunde inte tas bort från webbläsaren. Automatisk sökning är stoppad i denna flik. Ta bort webbplatsens lagring i webbläsarinställningarna innan du öppnar sidan igen.");
    }
  }

  function editAddress(value: string) {
    clearAddressSearch();
    request.current?.abort();
    request.current = null;
    setBusy(false);
    setAddress(value);
    setPickups([]);
    setSource("");
    setStatus("");
    setResultAddress("");
    setCheckedAt(null);
    setStale(false);
    if (savedAddress.current) {
      const optedIn = rememberCurrent.current;
      forget();
      rememberCurrent.current = optedIn;
      setRemember(optedIn);
    }
  }

  async function locate() {
    if (demo) {
      setLocation("DEMO – simulerad områdeskontroll för Stockholm. Ingen platsåtkomst har begärts.");
      return;
    }
    if (!window.isSecureContext) {
      setLocation("Platsåtkomst kräver HTTPS, även på ett lokalt nätverk. Öppna den säkra webbplatsadressen eller skriv gatuadressen.");
      return;
    }
    if (!navigator.geolocation) {
      setLocation("Din webbläsare stöder inte platsåtkomst. Skriv din adress i stället.");
      return;
    }
    const version = ++locationVersion.current;
    setLocation("Väntar på ditt tillstånd till platsåtkomst …");
    if (navigator.permissions) {
      let permissionTimeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const permission = await Promise.race([
          navigator.permissions.query({ name: "geolocation" }),
          new Promise<never>((_, reject) => {
            permissionTimeout = setTimeout(() => reject(new Error("Permission check timed out")), 2000);
          }),
        ]);
        if (version !== locationVersion.current) return;
        if (permission.state === "denied") {
          setLocation(locationErrorMessage(1));
          return;
        }
      } catch {
        if (version !== locationVersion.current) return;
        setLocation("Webbläsaren kunde inte läsa platsbehörigheten. Försöker platskontroll ändå …");
      } finally {
        clearTimeout(permissionTimeout);
      }
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (version !== locationVersion.current) return;
      const inRegion = coords.latitude >= 59.1 && coords.latitude <= 59.5 &&
        coords.longitude >= 17.7 && coords.longitude <= 18.3;
      setLocation(inRegion
        ? "Du verkar vara i Stockholmsområdet. Skriv din gatuadress nedan för rätt hämtningsdag. Platsen används bara här och har inte skickats vidare."
        : "Din ungefärliga plats verkar vara utanför Stockholmsområdet. Du kan ändå söka på en adress i Stockholms stad.");
    }, (error) => {
      if (version === locationVersion.current) setLocation(locationErrorMessage(error.code));
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
  }

  function clear() {
    clearAddressSearch();
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
    setResultAddress("");
    setCheckedAt(null);
    setStale(false);
    forget();
  }

  function addManual(event: React.FormEvent) {
    event.preventDefault();
    if (!validDate(date) || date < stockholmToday()) return;
    clearAddressSearch();
    request.current?.abort();
    request.current = null;
    setBusy(false);
    setCheckedAt(null);
    setStale(false);
    setResultAddress("");
    savedAddress.current = "";
    setPickups([{ date, group: demo ? `DEMO – ${bin}` : bin, frequency: "" }]);
    setSource(demo ? DEMO_SOURCE : `Eget datum – inte verifierat av ${brand.name}`);
    setStatus(demo
      ? "DEMO – eget exempeldatum är inlagt, inte verifierat av SVOA."
      : "Ditt eget datum är inlagt. Kontrollera det mot den officiella hämtningsinformationen.");
    document.getElementById("next-pickup")?.scrollIntoView({ block: "start" });
  }

  function download() {
    const calendarSource = stale ? `${source} – INTE UPPDATERAT, senast kontrollerat ${checkedAt || "okänt"}` : source;
    const blob = new Blob([createCalendar(current, calendarSource)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = demo ? DEMO_FILENAME : brand.calendarFilename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <a className="skip" href="#main">Hoppa till innehållet</a>
      <header className="header">
        <Link className="brand" href="/" aria-label={`${brand.name} startsida`}><BrandLogo /></Link>
        <nav aria-label="Huvudmeny"><a href="#planera">Min hämtning</a><a href="#sortera">Sortera rätt</a><a href="#integritet">Integritet</a></nav>
      </header>
      <main id="main">
        {storageError && <p className="refresh-warning" role="alert">{storageError}</p>}
        {showDemoSettings && <section className="card demo-settings" aria-labelledby="demo-settings-heading">
          <h2 id="demo-settings-heading">Demoinställningar</h2>
          <p>Endast för presentation. Inställningen aktiverar aldrig liveåtkomst eller backendens tillståndsspärr. Läget sparas inte och är avstängt efter omladdning.</p>
          <label className="check"><input type="checkbox" checked={demo} onChange={(event) => {
            clear();
            setDemo(event.target.checked);
            setStatus(event.target.checked
              ? "DEMO – aktiverat. Skriv en exempeladress och bekräfta demoläget för att visa exempelresultat."
              : "Demoläget är avstängt och alla uppgifter är rensade.");
          }} /><span>Aktivera demo med syntetiska exempeldata</span></label>
        </section>}
        {demo && <aside className="tip demo-banner" aria-label="Demoläge"><strong>DEMO – inga verkliga hämtningsdatum</strong><p>Sökning och platskontroll är simulerade. Ingen adress eller plats skickas till backend eller SVOA. Kalenderfiler är märkta DEMO.</p></aside>}
        <PickupOverview pickups={pickups} today={today} source={source} status={status} busy={busy} stale={stale} checkedAt={checkedAt}
          address={resultAddress} demo={demo} remember={storedAddress === resultAddress && Boolean(storedAddress) && !demo} canRefresh={canSearch && consent && Boolean(address.trim())}
          onRefresh={() => { void loadPickups(address.trim(), demo, resultAddress === address.trim() && Boolean(checkedAt) && !demo); }}
          onDownload={download} onForget={clear} />
        {!resultAddress && !pickups.length && !busy && <section className="hero">
          <div>
            <p className="eyebrow">FÖR ETT LITE GRÖNARE STOCKHOLM</p>
            <h2>Mindre sopstress.<br /><span>Mer vardagslugn.</span></h2>
            <p className="intro">När kommer sopbilen? Få koll på nästa hämtning, gör kärlen redo och lägg dagen i din kalender.</p>
            <a className="button" href="#planera">Hitta min hämtningsdag <BrandIcon name="arrow-up-right" /></a>
            <p className="hero-note">Inget konto. Inga spårningskakor. Bara lite bättre koll.</p>
          </div>
          <BrandIllustration />
        </section>}
        <div className="steps" aria-label="Så fungerar det"><span><b>01</b> Hitta din adress</span><span><b>02</b> Kolla nästa hämtning</span><span><b>03</b> Gör kärlen redo</span></div>

        <section id="planera" className="planner section">
          <div className="section-heading"><p className="eyebrow">DIN VARDAG, LITE ENKLARE</p><h2>När är det dags?</h2><p>För villor och radhus i hela Stockholms stad. Bor du i lägenhet? Din fastighetsägare har hämtningsschemat.</p></div>
          <div className="planner-grid">
            <div className="card">
              <h3>Hitta din hämtning</h3>
              <p>{demo ? "DEMO – använd en påhittad exempeladress. Samma syntetiska resultat visas för alla adresser, utan nätverksanrop." : canSearch
                ? `Adressökningen går via Sophams backend (${backendProvider}) till Stockholm Vatten och Avfall. Åtkomsten är inte garanterad. Skriv gata och husnummer, bekräfta samtycket och välj Hitta rätt adress för SVOA:s fullständiga adressformat.`
                : "Adressökningen är avstängd i väntan på tillstånd från SVOA. Sök via länken nedan och lägg in ett eget, kontrollerat datum i resultatkortet."}</p>
              <button className="secondary" type="button" onClick={() => { void locate(); }}>Kontrollera Stockholmsområdet med min plats (frivilligt)</button>
              <p className="small">{demo
                ? "DEMO – knappen visar bara ett simulerat platsmeddelande. Webbläsarens platsåtkomst används inte."
                : "När du trycker godkänner du att webbläsaren använder din plats för en ungefärlig områdeskontroll, inte för att hitta din adress. Koordinater sparas inte eller skickas till oss."}</p>
              <p role="status" className="small">{location}</p>
              <form onSubmit={search}>
                <label htmlFor="address">Gatuadress och postort</label>
                <input id="address" disabled={!canSearch} autoComplete={demo ? "off" : "street-address"} placeholder={demo ? "Till exempel: Exempelgatan 12, Stockholm" : "Till exempel: din gata 12, Bromma"} value={address} onChange={(event) => editAddress(event.target.value)} maxLength={200} required />
                <label className="check"><input type="checkbox" disabled={!canSearch} checked={consent} onChange={(event) => {
                  if (!event.target.checked) clear();
                  else setConsent(true);
                }} /><span>{demo
                  ? "Jag förstår att detta är en demo med syntetiska datum och att adressen inte skickas vidare."
                  : <>Jag samtycker till att adressen behandlas av Sophams backend ({backendProvider}) och skickas vidare till Stockholm Vatten och Avfall för denna sökning och accepterar <a href="#integritet">integritetsinformationen och användarvillkoren</a>.</>}</span></label>
                {!demo && <label className="check"><input type="checkbox" disabled={!canSearch} checked={remember} onChange={(event) => {
                  if (!event.target.checked) forget();
                  else {
                    rememberCurrent.current = true;
                    setRemember(true);
                  }
                }} /><span>Kom ihåg på den här enheten. Vid nästa sökning sparas adress, samtycke och senaste resultat i webbläsaren. Adressen skickas automatiskt igen vid återbesök och när ett nytt dygn börjar. Använd inte på en delad enhet.</span></label>}
                {!demo && <>
                  <button type="button" className="secondary" disabled={!canSearch || !consent || address.trim().length < 3 || findingAddress || busy} onClick={() => { void findAddress(); }}>{findingAddress ? "Hittar adress …" : "Hitta rätt adress"}</button>
                  <p role="status" className="small">{addressStatus}</p>
                  {addressSuggestions.length > 0 && <ul className="address-suggestions" aria-label="Adressförslag från SVOA">{addressSuggestions.map(suggestion => <li key={suggestion.value}><button type="button" className="secondary" onClick={() => editAddress(suggestion.value)}>{suggestion.value}</button></li>)}</ul>}
                </>}
                <button type="submit" disabled={!canSearch || !consent || busy || findingAddress || !address.trim()}>{busy ? "Hämtar …" : "Visa hämtningsdagar"} <BrandIcon name="arrow-right" /></button>
              </form>
              <a className="source-link" href={OFFICIAL_URL} target="_blank" rel="noreferrer">Sök direkt hos Stockholm Vatten och Avfall <BrandIcon name="arrow-up-right" /></a>
            </div>
            <div className="card results" aria-busy={busy}>
              <div className="card-top"><h3>{demo ? "Exempel på nästa hämtning" : "Din nästa hämtning"}</h3><span className="tag">{demo ? "DEMO" : "STOCKHOLM"}</span></div>
              <p>{status || (demo ? "DEMO – sök på en exempeladress för att visa syntetiska datum." : canSearch ? "Sök på din adress för att se nästa hämtningsdag. Vi visar aldrig påhittade datum." : "Kontrollera din hämtningsdag hos SVOA och lägg in datumet nedan. Vi visar aldrig påhittade datum.")}</p>
              {stale && <p className="refresh-warning"><strong>INTE UPPDATERAT</strong> – uppgifterna nedan är senast sparade, inte nybekräftade.</p>}
              {current.length ? <>
                <p className="small">Källa: {source}</p>
                <ul className="pickup-list">{current.map((pickup, index) => <li key={`${pickup.date}-${index}`}>
                  <span className="pickup-icon" aria-hidden="true">{pickupMaterials(pickup.group).map(material => <BrandIcon key={material.label} name={material.icon} />)}</span><div><strong>{new Intl.DateTimeFormat("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Stockholm" }).format(new Date(`${pickup.date}T12:00:00Z`))}</strong><p>{pickup.group}</p>{pickup.frequency && <small>{pickup.frequency} · endast nästa datum visas</small>}</div>
                </li>)}</ul>
                <div className="tip"><strong>Kvällen före: klart för hämtning!</strong><p>Följ anvisningarna för din fastighet. Se till att kärlet är åtkomligt och att inget blockerar vägen.</p></div>
                <button type="button" onClick={download}><BrandIcon name="download" /> Lägg i min kalender (.ics)</button>
                <p className="small">Enstaka heldagshändelser med påminnelse kvällen före, om din kalender stöder det. Importera filen i din kalender. Inga framtida datum beräknas och kalendern uppdateras inte automatiskt.</p>
              </> : <div className="empty"><BrandIcon name="sun" /><p>{pickups.length ? "Datakällans datum har redan passerat. Kontrollera ett nytt datum hos SVOA." : "Här landar din nästa hämtningsdag."}</p></div>}
              <details><summary>Lägg in ett eget, kontrollerat datum</summary><p>Om direktsökningen inte fungerar: kontrollera datumet hos SVOA först. Ett eget datum ersätter tidigare resultat och märks som ej verifierat.</p>
                <form onSubmit={addManual}><label htmlFor="bin">Kärl / avfall</label><select id="bin" value={bin} onChange={(event) => setBin(event.target.value)}><option>Restavfall och matavfall</option><option>Restavfall</option><option>Matavfall</option><option>Förpackningar</option></select><label htmlFor="date">Nästa hämtningsdatum</label><input id="date" type="date" value={date} min={stockholmToday()} max="9999-12-31" onChange={(event) => setDate(event.target.value)} required /><button className="secondary" type="submit">Använd mitt datum</button></form>
              </details>
            </div>
          </div>
        </section>

        <section id="sortera" className="section">
          <div className="section-heading"><p className="eyebrow">SMÅ VANOR, STOR SKILLNAD</p><h2>Var sak på sin plats.</h2><p>Några enkla tips inför nästa runda. Följ alltid aktuella lokala anvisningar.</p></div>
          <div className="sorting-grid">
            <article className="sort-card"><BrandIcon name="food" /><h3>Matavfall</h3><p>Matrester, skal och kaffesump. Använd den matavfallspåse som din avfallsleverantör anvisar, inte en plastpåse.</p></article>
            <article className="sort-card"><BrandIcon name="package" /><h3>Förpackningar</h3><p>Sortera tomma förpackningar efter material. Lämna dem i rätt insamling för din fastighet eller på en återvinningsstation.</p></article>
            <article className="sort-card"><BrandIcon name="battery" /><h3>Inte i soppåsen!</h3><p>Batterier, elavfall och farligt avfall ska lämnas till särskild insamling, aldrig i restavfall eller matavfall.</p></article>
          </div>
          <p className="sorting-link">Osäker? Besök <a href="https://www.stockholmvattenochavfall.se/" target="_blank" rel="noreferrer">SVOA:s sorteringsguide och information om återvinningsplatser <BrandIcon name="arrow-up-right" /></a>.</p>
        </section>

        <section id="integritet" className="section legal">
          <p className="eyebrow">ÖPPET OCH ENKELT</p><h2>Din plats. Dina val.</h2>
          <details open><summary>Integritet och samtycke</summary><p>{brand.name} kräver inget konto och har ingen åldersgräns. Vi använder inga analysverktyg eller spårningskakor. Utan ditt val att komma ihåg enheten finns uppgifter bara i sidans minne. Med ”Kom ihåg på den här enheten” sparas adress, samtycke, senaste hämtningsresultat och kontrolltid i webbläsarens localStorage tills du väljer ”Glöm adressen”, avmarkerar valet eller återkallar samtycket. Uppgifterna kan ses av andra som använder samma webbläsarprofil. Adressen skickas automatiskt till samma backend vid återbesök och när ett nytt dygn börjar; om driftmiljön ändras krävs nytt samtycke. Ingen position sparas. Demodata och egna datum sparas inte. Om uppdatering misslyckas visas sparade resultat tydligt som inte uppdaterade.</p><p>Platsåtkomst är frivillig och kräver webbläsarens tillstånd. Webbläsaren eller operativsystemet kan använda sin platstjänst för att bestämma positionen. {brand.name} skickar inte koordinater till någon server. Adressökning är ett separat val. När den är aktiverad skickas adressen med ditt samtycke till Sophams backend ({backendProvider}), som skickar adressen vidare till SVOA. Backendens driftmiljö hanterar även din IP-adress för trafikhantering och begränsning av förfrågningar. SVOA ser adressen och backendens nätverksanslutning och behandlar förfrågan enligt sin integritetsinformation. Backendkoden lagrar inte adresser eller resultat och loggar inte adresser eller IP-adresser. Driftleverantörer kan behandla nätverksuppgifter enligt sina villkor. Webbhotellet kan behandla IP-adresser i åtkomstloggar när sidan laddas.</p><p>Du kan återkalla samtycket genom att rensa nedan, och ta bort platstillstånd i webbläsarens inställningar. Rensning tar inte tillbaka redan skickade förfrågningar, garanterar inte att backendens redan startade förfrågan avbryts och tar inte bort kalenderfiler som du laddat ned. <a href="https://www.stockholmvattenochavfall.se/" target="_blank" rel="noreferrer">Läs SVOA:s information om personuppgifter på deras webbplats.</a></p></details>
          <details><summary>Användarvillkor och datakällor</summary><p>{brand.name} är en fristående hjälp, inte en tjänst från Stockholms stad. Hämtningsdata kommer, när åtkomsten fungerar, från Stockholm Vatten och Avfalls publika söktjänst för villor och radhus. Det är inte ett garanterat öppet API. Vi saknar verifierade hämtningsscheman för flerbostadshus och andra kommuner.</p><p>Uppgifter kan vara felaktiga, försenade eller ändras vid exempelvis helgdagar. Kontrollera alltid aktuellt datum och anvisningar hos SVOA. Egna datum är inte verifierade. Kalenderexport är en ögonblicksbild, inte ett abonnemang.</p><p>Tjänsten tillhandahålls utan garanti för fullständighet eller riktighet. I den utsträckning tillämplig lag medger ansvarar vi inte för missad hämtning eller skador till följd av felaktig information. Villkoren begränsar inte rättigheter eller ansvar som inte får begränsas enligt lag.</p></details>
          <button type="button" className="secondary" onClick={clear}>Återkalla samtycke och rensa mina uppgifter</button>
        </section>
      </main>
      <footer><Link className="brand" href="/" aria-label={`${brand.name} startsida`}><BrandLogo /></Link><p>{brand.tagline}</p><span>Stockholm · Ingen inloggning behövs</span></footer>
    </>
  );
}
