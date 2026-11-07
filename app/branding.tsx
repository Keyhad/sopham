import brand from "@/docs/branding/brand.json";
import { brandingAsset } from "@/lib/branding";

type IconName = "recycle" | "sun" | "spark" | "heart" | "arrow-up-right" | "arrow-right" | "download" | "food" | "package" | "battery" | "paper" | "plastic" | "glass" | "metal" | "waste";

export function BrandIcon({ name }: { name: IconName }) {
  return <svg className="icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href={brandingAsset(`icons/sprite.svg#${name}`)} /></svg>;
}

export function BrandLogo() {
  return <svg className="brand-logo" viewBox="0 0 180 44" aria-hidden="true" focusable="false"><use href={brandingAsset(`${brand.logo}#wordmark`)} /></svg>;
}

export function BrandIllustration() {
  return <svg className="illustration" viewBox="0 0 480 350" aria-hidden="true" focusable="false"><use href={brandingAsset(`${brand.illustration}#hero`)} /></svg>;
}
