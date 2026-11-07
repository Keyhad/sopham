export function brandingAsset(asset: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/branding/${asset}`;
}
