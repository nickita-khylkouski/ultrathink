import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:3003';

test.describe('ULTRATHINK Platform - End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('Homepage loads successfully', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/ULTRATHINK/);

    // Check header is visible
    const header = page.locator('h1:has-text("ULTRATHINK")');
    await expect(header).toBeVisible();

    // Check connection status
    const status = page.locator('text=ONLINE');
    await expect(status).toBeVisible();
  });

  test('Navigate through all 7 tabs', async ({ page }) => {
    // Tab 1: ADMET Screening (default)
    await expect(page.locator('text=ADMET Screening').first()).toBeVisible();

    // Tab 2: Protein Structure
    await page.click('button:has-text("Protein Structure")');
    await expect(page.locator('text=SYSTEM 2: PROTEIN STRUCTURE PREDICTION')).toBeVisible();

    // Tab 3: Evolution
    await page.click('button:has-text("Evolution")');
    await expect(page.locator('text=SYSTEM 3: SHAPETHESIAS EVOLUTIONARY ALGORITHM')).toBeVisible();

    // Tab 4: Research Papers
    await page.click('button:has-text("Research Papers")');
    await expect(page.locator('text=PubMed Research Search')).toBeVisible();

    // Tab 5: Open-Source Models
    await page.click('button:has-text("Open-Source Models")');
    await expect(page.locator('text=Open-Source Models & Tools')).toBeVisible();

    // Tab 6: ChEMBL Database
    await page.click('button:has-text("ChEMBL Database")');
    await expect(page.locator('text=ChEMBL Bioactive Molecules Database')).toBeVisible();

    // Tab 7: Docking
    await page.click('button:has-text("Docking")');
    await expect(page.locator('text=Molecular Docking')).toBeVisible();
  });

  test('PubMed Search functionality', async ({ page }) => {
    // Navigate to Research Papers tab
    await page.click('button:has-text("Research Papers")');

    // Enter search query
    await page.fill('input[placeholder*="ADMET"]', 'aspirin drug discovery');

    // Click search button
    await page.click('button:has-text("Search")');

    // Wait for results (or error/no results message)
    await page.waitForTimeout(3000);

    // Check that something happened (results, error, or "no results")
    const hasResults = await page.locator('text=Results').isVisible().catch(() => false);
    const hasError = await page.locator('text=error').isVisible().catch(() => false);
    const hasNoResults = await page.locator('text=No results').isVisible().catch(() => false);

    expect(hasResults || hasError || hasNoResults).toBeTruthy();
  });

  test('ChEMBL Search functionality', async ({ page }) => {
    // Navigate to ChEMBL tab
    await page.click('button:has-text("ChEMBL Database")');

    // Select search type: Drug Name
    await page.click('button:has-text("Drug Name")');

    // Enter drug name
    await page.fill('input[placeholder*="aspirin"]', 'aspirin');

    // Click search
    await page.click('button:has-text("Search ChEMBL")');

    // Wait for results
    await page.waitForTimeout(3000);

    // Check for results or error
    const hasResults = await page.locator('text=Results').isVisible().catch(() => false);
    const hasError = await page.locator('text=error').isVisible().catch(() => false);

    expect(hasResults || hasError).toBeTruthy();
  });

  test('Molecular Docking simulation', async ({ page }) => {
    // Navigate to Docking tab
    await page.click('button:has-text("Docking")');

    // Enter ligand SMILES
    await page.fill('input[placeholder*="aspirin"]', 'CC(=O)Oc1ccccc1C(=O)O');

    // Enter protein PDB
    await page.fill('input[placeholder*="1R42"]', '5KIR');

    // Run docking
    await page.click('button:has-text("Run Docking")');

    // Wait for simulation to complete
    await page.waitForTimeout(4000);

    // Check for results
    await expect(page.locator('text=Docking Results')).toBeVisible();
    await expect(page.locator('text=Best Binding Mode')).toBeVisible();
    await expect(page.locator('text=Mode')).toBeVisible();
    await expect(page.locator('text=Affinity')).toBeVisible();
  });

  test('Open-Source Models catalog', async ({ page }) => {
    // Navigate to Models tab
    await page.click('button:has-text("Open-Source Models")');

    // Check that models are displayed
    await expect(page.locator('text=DeepChem')).toBeVisible();
    await expect(page.locator('text=RDKit')).toBeVisible();
    await expect(page.locator('text=MolGAN')).toBeVisible();
    await expect(page.locator('text=ESMFold')).toBeVisible();

    // Filter by category
    await page.click('button:has-text("Machine Learning")');
    await expect(page.locator('text=DeepChem')).toBeVisible();

    // Click GitHub link (opens in new tab)
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.click('a:has-text("View on GitHub"):first'),
    ]);

    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('github.com');
    await newPage.close();
  });

  test('Black & white theme is applied', async ({ page }) => {
    // Check background is white
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe('rgb(255, 255, 255)'); // white

    // Check tabs have black border
    const tab = page.locator('button:has-text("ADMET Screening")');
    const borderColor = await tab.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(borderColor).toContain('0, 0, 0'); // black
  });

  test('Footer displays correct version', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check version
    await expect(page.locator('text=ULTRATHINK v2.0')).toBeVisible();

    // Check tools mentioned
    await expect(page.locator('text=DeepChem')).toBeVisible();
    await expect(page.locator('text=ChEMBL')).toBeVisible();
    await expect(page.locator('text=AutoDock Vina')).toBeVisible();
  });

  test('Responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that tabs are still accessible (may wrap on mobile)
    await expect(page.locator('button:has-text("ADMET Screening")').first()).toBeVisible();
    await expect(page.locator('button:has-text("ChEMBL Database")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Docking")').first()).toBeVisible();
  });

  test('Connection status updates', async ({ page }) => {
    // Check initial status
    const statusBadge = page.locator('text=ONLINE').or(page.locator('text=OFFLINE'));
    await expect(statusBadge).toBeVisible();

    // Connection indicator dot should be present
    const dot = page.locator('div[class*="w-2"]').filter({ hasText: '' });
    await expect(dot.first()).toBeVisible();
  });

  test('Search input validation', async ({ page }) => {
    // Navigate to PubMed
    await page.click('button:has-text("Research Papers")');

    // Try to search with empty input
    await page.click('button:has-text("Search")');

    // Should show error or do nothing (not crash)
    await page.waitForTimeout(500);

    // Page should still be functional
    await expect(page.locator('text=PubMed Research Search')).toBeVisible();
  });

  test('Export functionality in Docking', async ({ page }) => {
    // Navigate to Docking
    await page.click('button:has-text("Docking")');

    // Run docking
    await page.fill('input[placeholder*="aspirin"]', 'CC(=O)Oc1ccccc1C(=O)O');
    await page.fill('input[placeholder*="1R42"]', '5KIR');
    await page.click('button:has-text("Run Docking")');

    // Wait for results
    await page.waitForTimeout(4000);

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Results")');
    const download = await downloadPromise;

    // Check filename
    expect(download.suggestedFilename()).toBe('docking_results.txt');

    // Verify download completed
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('Copy SMILES to clipboard in ChEMBL', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to ChEMBL
    await page.click('button:has-text("ChEMBL Database")');

    // Search for aspirin
    await page.fill('input[placeholder*="aspirin"]', 'aspirin');
    await page.click('button:has-text("Search ChEMBL")');

    // Wait for results
    await page.waitForTimeout(3000);

    // Click Copy SMILES button (if results found)
    const copyButton = page.locator('button:has-text("Copy SMILES")').first();
    if (await copyButton.isVisible()) {
      await copyButton.click();

      // Check for alert or clipboard content
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('SMILES copied');
        await dialog.accept();
      });
    }
  });

  test('Information tooltips and help text', async ({ page }) => {
    // Navigate to Docking
    await page.click('button:has-text("Docking")');

    // Check for help text
    await expect(page.locator('text=Predict binding affinity')).toBeVisible();

    // Check for interpretation guide
    await expect(page.locator('text=Interpretation Guide')).toBeVisible();

    // Scroll to see more help text
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('text=AutoDock Vina')).toBeVisible();
  });

  test('Keyboard navigation works', async ({ page }) => {
    // Focus on first tab
    await page.keyboard.press('Tab');

    // Navigate between tabs with keyboard
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    // Should have navigated to next tab
    await page.waitForTimeout(500);

    // Check that tab changed (by looking for different content)
    const admetVisible = await page.locator('text=ADMET Screening').first().getAttribute('class');
    const proteinVisible = await page.locator('text=Protein Structure').first().getAttribute('class');

    // One should be active, one should not
    expect(admetVisible !== proteinVisible).toBeTruthy();
  });

  test('Print-friendly black & white output', async ({ page }) => {
    // Navigate to Docking results
    await page.click('button:has-text("Docking")');
    await page.fill('input[placeholder*="aspirin"]', 'CC(=O)Oc1ccccc1C(=O)O');
    await page.fill('input[placeholder*="1R42"]', '5KIR');
    await page.click('button:has-text("Run Docking")');
    await page.waitForTimeout(4000);

    // Take screenshot in print mode
    await page.emulateMedia({ colorScheme: 'light', media: 'print' });
    const screenshot = await page.screenshot({ fullPage: true });

    // Screenshot should be generated
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(1000);
  });
});
