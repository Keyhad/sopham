export function locationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Platsåtkomst är blockerad. Tillåt Plats i webbläsarens webbplatsinställningar och kontrollera datorns eller telefonens platsbehörighet. Om den inbyggda webbläsaren blockerar plats, öppna samma HTTPS-adress i Safari eller Chrome. Du kan också skriva gatuadressen.";
    case 2:
      return "Enheten kunde inte bestämma din plats. Kontrollera att platstjänster är påslagna, eller skriv gatuadressen.";
    case 3:
      return "Platskontrollen tog för lång tid. Kontrollera enhetens platstjänster och webbläsarens platsbehörighet. Prova samma HTTPS-adress i Safari eller Chrome om den inbyggda webbläsaren inte hittar din plats. Du kan också skriva gatuadressen.";
    default:
      return "Platsen kunde inte bestämmas. Du kan fortfarande skriva gatuadressen.";
  }
}
