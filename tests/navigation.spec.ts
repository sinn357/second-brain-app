import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')

    // Should redirect to /notes
    await expect(page).toHaveURL('/notes')

    // Click on Graph navigation
    await page.click('text=Graph')
    await expect(page).toHaveURL('/graph')

    // Click on Folders navigation
    await page.click('text=Folders')
    await expect(page).toHaveURL('/folders')

    // Click on Database navigation
    await page.click('text=Database')
    await expect(page).toHaveURL('/db')

    // Click on Notes navigation
    await page.click('text=Notes')
    await expect(page).toHaveURL('/notes')
  })

  test('should show mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/notes')

    // Mobile menu button should be visible
    const menuButton = page.locator('button:has-text("Menu")')
    await expect(menuButton).toBeVisible()

    // Click menu button
    await menuButton.click()

    // Menu items should be visible
    await expect(page.locator('text=Notes')).toBeVisible()
    await expect(page.locator('text=Graph')).toBeVisible()
  })

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/notes')

    // Find and click dark mode toggle button
    const darkModeButton = page.locator('button[aria-label="Toggle theme"]')
    await darkModeButton.click()

    // Check if dark mode class is applied
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)

    // Toggle back
    await darkModeButton.click()
    await expect(html).not.toHaveClass(/dark/)
  })
})
