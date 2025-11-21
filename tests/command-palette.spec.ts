import { test, expect } from '@playwright/test'

test.describe('Command Palette', () => {
  test('should open command palette with Cmd+K', async ({ page }) => {
    await page.goto('/notes')

    // Press Cmd+K (or Ctrl+K on Windows/Linux)
    const isMac = process.platform === 'darwin'
    if (isMac) {
      await page.keyboard.press('Meta+K')
    } else {
      await page.keyboard.press('Control+K')
    }

    // Command palette dialog should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })

  test('should open command palette with search button', async ({ page }) => {
    await page.goto('/notes')

    // Click search button
    await page.click('button:has-text("Search")')

    // Command palette should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })

  test('should close command palette with Escape', async ({ page }) => {
    await page.goto('/notes')

    // Open command palette
    await page.keyboard.press('Meta+K')

    // Verify it's open
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Command palette should be closed
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).not.toBeVisible()
  })

  test('should search notes in command palette', async ({ page }) => {
    await page.goto('/notes')

    // Open command palette
    await page.keyboard.press('Meta+K')

    // Type search query
    const searchInput = page.locator('input[type="text"]').first()
    await searchInput.fill('test')

    // Results should be displayed or empty state shown
    const hasResults = await page.locator('text=노트').isVisible()
    const isEmpty = await page.locator('text=결과가 없습니다').isVisible()

    expect(hasResults || isEmpty).toBeTruthy()
  })
})
