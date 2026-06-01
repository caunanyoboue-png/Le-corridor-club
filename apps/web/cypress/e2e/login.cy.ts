describe("Page de connexion — smoke test", () => {
  it("affiche le formulaire de connexion", () => {
    cy.visit("/login");
    cy.contains("Le Corridor Club").should("be.visible");
    cy.get('input[type="email"]').should("exist");
    cy.get('input[type="password"]').should("exist");
    cy.get('button[type="submit"]').contains("Se connecter").should("be.visible");
  });
});
