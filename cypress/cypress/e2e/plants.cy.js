describe('GreenSwap E2E Tests', () => {
  const baseUrl = 'http://127.0.0.1:5173';
  const uniqueUser = `user_${Date.now()}`;
  const password = 'password123';

  beforeEach(() => {
    cy.visit(baseUrl);
  });

  it('should register, login, and add a plant', () => {
    // 1. Registration
    cy.contains('Нет аккаунта? Зарегистрироваться').click();
    cy.get('h2').should('contain', 'Регистрация');
    
    cy.get('[data-testid="username-input"]').type(uniqueUser);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="submit-button"]').click();

    // After registration, App.jsx handles success by setting user and switching to catalog
    cy.contains(`Профиль (${uniqueUser})`).should('be.visible');
    cy.contains('Каталог растений').should('be.visible');

    // 2. Logout and Login back
    cy.contains('Выйти').click();
    cy.contains('Вы не авторизованы').should('be.visible');

    cy.get('[data-testid="username-input"]').type(uniqueUser);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="submit-button"]').click();
    cy.contains(`Профиль (${uniqueUser})`).should('be.visible');

    // 3. Add a plant
    cy.contains('Добавить растение').click();
    cy.get('h2').should('contain', 'Добавить новое растение');

    const plantName = `My Awesome Plant ${Date.now()}`;
    cy.get('input[placeholder*="Мой любимый фикус"]').type(plantName);
    cy.get('input[placeholder*="Фикус"]').type('Ficus');
    cy.get('textarea[placeholder*="Опишите ваше растение"]').type('Very green and healthy');
    
    cy.intercept('POST', '**/plants').as('addPlant');
    cy.get('button[type="submit"]').contains('Добавить растение').click();
    
    cy.wait('@addPlant').its('response.statusCode').should('eq', 201);
    
    // Check if redirected to catalog and plant is there
    cy.contains('Каталог растений').should('be.visible');
    cy.get('[data-testid="search-input"]').type(plantName);
    cy.contains(plantName).should('be.visible');
  });

  it('should search for plants', () => {
    // Wait for catalog to load (even as guest/logged in)
    // In our app, if not logged in, we see Auth. 
    // Let's login first to see catalog properly
    cy.get('[data-testid="username-input"]').type(uniqueUser);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="submit-button"]').click();

    cy.contains('Каталог растений').should('be.visible');
    
    // Search for something that doesn't exist
    cy.get('[data-testid="search-input"]').type('NonExistentPlant123456');
    cy.contains('Растения не найдены').should('be.visible');
    
    // Clear search
    cy.get('[data-testid="search-input"]').clear();
    cy.get('[data-testid="plant-item"]').should('have.length.at.least', 1);
  });

  it('should navigate between tabs', () => {
    cy.get('[data-testid="username-input"]').type(uniqueUser);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="submit-button"]').click();

    cy.contains('Добавить растение').click();
    cy.contains('Добавить новое растение').should('be.visible');

    cy.contains('Заявки').click();
    cy.contains('Заявки на обмен').should('be.visible');

    cy.contains('Каталог').click();
    cy.contains('Каталог растений').should('be.visible');
    
    cy.contains(`Профиль (${uniqueUser})`).click();
    cy.contains(`Профиль пользователя: ${uniqueUser}`).should('be.visible');
  });

  it('4) should show error on login with wrong credentials', () => {
    cy.get('[data-testid="username-input"]').type('nonexistent_user_999');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="submit-button"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('5) should logout correctly', () => {
    // Login first
    cy.get('[data-testid="username-input"]').type(uniqueUser);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="submit-button"]').click();
    cy.contains('Выйти').should('be.visible');

    // Logout
    cy.contains('Выйти').click();
    cy.contains('Вы не авторизованы').should('be.visible');
    cy.get('[data-testid="auth-form"]').should('be.visible');
  });

  it('6) should show validation error for empty plant form', () => {
    cy.get('[data-testid="username-input"]').type(uniqueUser);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="submit-button"]').click();

    cy.contains('Добавить растение').click();
    cy.get('button[type="submit"]').contains('Добавить растение').click();
    cy.contains('Название и вид обязательны для заполнения').should('be.visible');
  });

  it('7) should not show "Add Plant" button for guest users', () => {
    cy.contains('Вы не авторизованы').should('be.visible');
    cy.contains('Добавить растение').should('not.exist');
  });

  it('8) should show "Plants not found" message for empty search results', () => {
    cy.get('[data-testid="username-input"]').type(uniqueUser);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="submit-button"]').click();

    cy.get('[data-testid="search-input"]').type('ZxyzAbc123FakePlantName');
    cy.contains('Растения не найдены.').should('be.visible');
  });

  it('9) should switch to Requests tab', () => {
    cy.get('[data-testid="username-input"]').type(uniqueUser);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="submit-button"]').click();

    cy.contains('Заявки').click();
    cy.get('h2').should('contain', 'Заявки на обмен');
  });

  it('10) should be able to open and close profile view', () => {
    cy.get('[data-testid="username-input"]').type(uniqueUser);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="submit-button"]').click();

    cy.contains(`Профиль (${uniqueUser})`).click();
    cy.get('h2').should('contain', 'Профиль пользователя');
    
    cy.contains('Каталог').click();
    cy.get('h2').should('contain', 'Каталог растений');
  });
});
