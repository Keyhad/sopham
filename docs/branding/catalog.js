const styles = getComputedStyle(document.documentElement);
for (const swatch of document.querySelectorAll("[data-color]")) {
  const value = document.createElement("code");
  value.className = "color-value";
  value.textContent = styles.getPropertyValue(swatch.dataset.color).trim();
  swatch.querySelector("figcaption").append(value);
}
for (const token of document.querySelectorAll("[data-layout]")) {
  token.textContent = `${token.dataset.layout}: ${styles.getPropertyValue(token.dataset.layout).trim()}`;
}
