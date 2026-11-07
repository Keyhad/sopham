import { BrandIcon } from "./branding";
import { pickupDay, pickupMaterials } from "@/lib/pickup-display";
import type { Pickup } from "@/lib/pickups";

type Props = {
  pickups: Pickup[];
  today: string;
  source: string;
  status: string;
  busy: boolean;
  stale: boolean;
  checkedAt: string | null;
  address: string;
  demo: boolean;
  remember: boolean;
  canRefresh: boolean;
  onRefresh: () => void;
  onDownload: () => void;
  onForget: () => void;
};

export function PickupOverview(props: Props) {
  const current = props.pickups.filter(pickup => pickup.date >= props.today).sort((a, b) => a.date.localeCompare(b.date));
  const next = current[0];
  const sameDay = next ? current.filter(pickup => pickup.date === next.date) : [];
  const materials = [...new Map(sameDay.flatMap(pickup => pickupMaterials(pickup.group)).map(material => [material.label, material])).values()];
  const timing = next ? pickupDay(next.date, props.today) : null;
  const manual = props.source.startsWith("Eget datum");
  const formattedDate = next ? new Intl.DateTimeFormat("sv-SE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Stockholm",
  }).format(new Date(`${next.date}T12:00:00Z`)) : "";

  return <section id="next-pickup" className={`pickup-overview ${timing?.urgency || ""}`} aria-labelledby="next-pickup-heading" aria-busy={props.busy}>
    <div className="overview-heading">
      <p className="eyebrow">DIN NÄSTA HÄMTNING</p>
      <span className="tag">{props.demo ? "DEMO" : manual ? "EGET DATUM" : props.source ? "SVOA" : "STOCKHOLM"}</span>
    </div>
    {props.stale && <div className="refresh-warning"><strong>INTE UPPDATERAT</strong><p>Sparade uppgifter kan ha ändrats. Kontrollera datumet hos SVOA innan du ställer ut kärlen.</p></div>}
    {manual && <p className="refresh-warning">Eget datum – inte verifierat av SVOA.</p>}
    <h1 id="next-pickup-heading" className={`pickup-day ${timing?.urgency || ""}`}>{timing?.label || (props.busy ? "Hämtar din hämtning …" : "När är det dags?")}</h1>
    {next ? <>
      <p className="pickup-date"><time dateTime={next.date}>{formattedDate}</time>{props.stale && " · enligt sparade uppgifter"}</p>
      <div className="material-grid">{materials.map(material => <div className={`material-card material-${material.icon}`} key={material.label}>
        <BrandIcon name={material.icon} /><strong>{material.label}</strong>
      </div>)}</div>
      <p className="pickup-instruction">{timing?.urgency === "today" ? "Hämtning idag – se till att kärlen är åtkomliga." : timing?.urgency === "tomorrow" ? "Gör kärlen redo ikväll." : "Ställ fram rätt kärl kvällen före hämtning."}</p>
    </> : <p className="overview-empty">{props.pickups.length ? "De tidigare datumen har passerat. Inga nya datum har bekräftats." : "Hitta din adress nedan. Här visas sedan nästa hämtning med stora, tydliga symboler."}</p>}
    <p role="status" className="overview-status">{props.status || (props.busy ? "Uppdaterar uppgifterna …" : "Inga hämtningsdatum har hämtats ännu.")}</p>
    {props.address && <p className="overview-address">{props.address}{props.remember && " · sparad på den här enheten"}</p>}
    {props.checkedAt && <p className="overview-checked">Senast kontrollerat: <time dateTime={props.checkedAt}>{new Date(props.checkedAt).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })}</time></p>}
    <div className="overview-actions">
      {props.canRefresh && <button type="button" className="secondary" disabled={props.busy} onClick={props.onRefresh}>{props.busy ? "Uppdaterar …" : "Uppdatera nu"}</button>}
      <a className={next ? "button secondary" : "button"} href="#planera">{props.address ? "Ändra adress" : "Hitta min hämtning"}</a>
      {next && <button type="button" onClick={props.onDownload}><BrandIcon name="download" /> Lägg i kalender</button>}
      {props.remember && <button type="button" className="secondary" onClick={props.onForget}>Glöm adressen</button>}
    </div>
  </section>;
}
