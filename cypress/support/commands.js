// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
import 'cypress-file-upload';
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

/**
 * Load home page and wait until LForms is loaded.
 */
Cypress.Commands.add('loadHomePage',() => {
  cy.goToHomePage();
  cy.loincAccepted().then((flag) => {
    if (flag !== 'true') {
      cy.acceptLoinc();
    }
  });
});


/**
 * Visit home page and assert LForms, but do not deal with LOINC notice.
 */
Cypress.Commands.add('goToHomePage', () => {
  cy.visit('/');
  cy.window().should('have.property', 'LForms');
});


/**
 * Accept LOINC notice dialog.
 */
Cypress.Commands.add('acceptLoinc', () => {
  cy.contains('lfb-loinc-notice button', 'Accept').click();
});


/**
 * Clear session storage. Used to test LOINC notice.
 */
Cypress.Commands.add('clearSession',() => {
  cy.window()
    .its('sessionStorage')
    .invoke('clear');
});


/**
 * Check if loinc notice is accepted. Used to avoid invoking
 * element locator when restarting stopped tests in cy-open.
 */
Cypress.Commands.add('loincAccepted',() => {
  return cy.window()
    .its('sessionStorage')
    .invoke('getItem', 'acceptTermsOfUse');
});


/**
 * Command to upload a file.
 * @param fileName - Name of the file to upload
 */
Cypress.Commands.add('uploadFile',(fileName) => {
  cy.get('input[type="file"]').attachFile(fileName, {force: true});
});

/**
 * Command to get json from 'Preview'
 */
Cypress.Commands.add('questionnaireJSON', () => {
  cy.contains('nav.navbar button', 'Preview').scrollIntoView().click();
  cy.contains('.mat-tab-label-content', 'View Questionnaire JSON').scrollIntoView().click();
  return cy.get('mat-tab-body div.mat-tab-body-content pre').invoke('text').then((text) => {
    cy.get('mat-dialog-actions > button').scrollIntoView().click();
    return cy.wrap(JSON.parse(text));
  });
});

/**
 * Command to select data type in item editor.
 */
Cypress.Commands.add('selectDataType', (type) => {
  cy.get('#type').select(type);
});

/**
 * Load LOINC form using a search term. Picks first item from the result list.
 * @param searchTerm - Search term to search LOINC database.
 */
Cypress.Commands.add('loadLOINCForm', (searchTerm) => {
  cy.contains('nav.navbar button', 'Import').scrollIntoView().click();
  cy.get('div.dropdown-menu.show form input[placeholder="Search LOINC"]').as('searchBox');
  cy.get('@searchBox').type(searchTerm);
  cy.get('ngb-typeahead-window').should('be.visible');
  cy.get('@searchBox').type('{enter}');
  cy.get('ngb-typeahead-window').should('not.exist');
  cy.get('@searchBox').type('{esc}');
});

/**
 * Get json from FHIR server response after create/update interaction.
 * @param menuText - Menu text to pick the menu item.
 */
Cypress.Commands.add('FHIRServerResponse', (menuText) => {
  cy.contains('button.dropdown-toggle.btn', 'Export').click();
  cy.contains('div.dropdown-menu.show button.dropdown-item', menuText).as('menu');
  cy.get('@menu').should('be.visible');
  cy.contains('button.dropdown-item', menuText).as('createMenu');
  cy.get('@createMenu').should('be.visible').click();
  if(menuText.startsWith('Create')) {
    cy.contains('lfb-fhir-servers-dlg div button', 'Continue').click();
  }
  return cy.get('lfb-fhir-export-dlg div pre.fhir-response').invoke('text').then((text) => {
    cy.contains('lfb-fhir-export-dlg div button', 'Close').click();
    return cy.wrap(JSON.parse(text));
  });
});

/**
 * Create a sample answer option list.
 */
Cypress.Commands.add('addAnswerOptions', () => {
  cy.selectDataType('choice');
  // No widget for choice. User selects default radio in answer option table.
  cy.get('[id^="initial"]').should('not.be.visible');
  cy.get('[id="answerOption.0.valueCoding.display"]').type('d1');
  cy.get('[id="answerOption.0.valueCoding.code"]').type('c1');
  cy.get('[id="answerOption.0.valueCoding.system"]').type('s1');
  cy.get('[id="answerOption.0.valueCoding.__$score"]').type('2');

  cy.questionnaireJSON().should((qJson) => {
    expect(qJson.item[0].type).equal('choice');
    expect(qJson.item[0].answerOption[0].valueCoding).to.deep.equal({display: 'd1', code: 'c1', system: 's1'});
    expect(qJson.item[0].answerOption[0].extension).to.deep.equal([{
      url: 'http://hl7.org/fhir/StructureDefinition/ordinalValue',
      valueDecimal: 2
    }]);
    expect(qJson.item[0].initial).to.be.undefined; // No default selected
  });

  // Add a second answerOption.
  cy.contains('button', 'Add another answer').click();

  cy.get('[id="answerOption.1.valueCoding.display"]').type('d2');
  cy.get('[id="answerOption.1.valueCoding.code"]').type('c2');
  cy.get('[id="answerOption.1.valueCoding.system"]').type('s2');
  cy.get('[id="answerOption.1.valueCoding.__$score"]').type('3');
  // Select a default a.k.a initial
  cy.get('input[type="radio"][ng-reflect-value="0"]').click();

  cy.questionnaireJSON().should((qJson) => {
    expect(qJson.item[0].type).equal('choice');
    expect(qJson.item[0].answerOption[1].valueCoding).to.deep.equal({display: 'd2', code: 'c2', system: 's2'});
    expect(qJson.item[0].answerOption[1].extension).to.deep.equal([{
      url: 'http://hl7.org/fhir/StructureDefinition/ordinalValue',
      valueDecimal: 3
    }]);
    // Default/initial value coding.
    expect(qJson.item[0].initial[0].valueCoding).to.deep.equal({display: 'd1', code: 'c1', system: 's1'});
  });

});

//For Cypress drag and drop custom command
/**
 * TODO - Not working, revisit.
 * @param dragNodeText - Identifying text of the source node.
 * @param dropNodeText - Identifying text of destination node
 */
Cypress.Commands.add('dragAndDropNode', (dragNodeText, dropNodeText) => {

  const dropSelector = '.node-content-wrapper span:contains("' + dropNodeText + '")';
  const dragSelector = '.node-content-wrapper span:contains("' + dragNodeText + '")';
  let droppable, coords;
  cy.get(dropSelector).should(($eList) => {
    droppable = $eList[0];
    coords = droppable.getBoundingClientRect();
  });

  cy.get(dragSelector).should(($eList) => {
    const draggable = $eList[0];
    // The sequence of mouse events
    draggable.dispatchEvent(new MouseEvent('mousedown'));
    draggable.dispatchEvent(new MouseEvent('mousemove', { clientX: 5, clientY: 0 }));
    draggable.dispatchEvent(new MouseEvent('mousemove', {
      clientX: coords.left + 5,
      clientY: coords.top + 5  // A few extra pixels to get the ordering right
    }));
    draggable.dispatchEvent(new MouseEvent('mouseup'));
  });

  return cy.get(dropSelector).should(($eList) => {
    const classList = Array.from($eList[0].classList);
    return classList.includes('node-content-wrapper-focused');
  });
});
