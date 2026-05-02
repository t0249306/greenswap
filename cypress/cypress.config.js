const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // Указываем, где лежат наши тесты
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    // Отключаем поддержку файла конфигурации (supportFile), так как он нам пока не нужен
    supportFile: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
