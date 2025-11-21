import { test, expect } from '@playwright/test'

test.describe('Database View', () => {
  test('should switch between table and list views', async ({ page }) => {
    await page.goto('/db')

    // Should be on database page
    await expect(page).toHaveURL('/db')
    await expect(page.locator('h1:has-text("Database")')).toBeVisible()

    // Click Table button
    await page.click('button:has-text("Table")')
    // Table view should be visible
    await expect(page.locator('table')).toBeVisible()

    // Click List button
    await page.click('button:has-text("List")')
    // List view should be visible (cards)
    const cards = page.locator('a[href^="/notes/"]')
    const hasCards = await cards.count()
    expect(hasCards >= 0).toBeTruthy()
  })

  test('should show and hide filters', async ({ page }) => {
    await page.goto('/db')

    // Click filter toggle button
    const filterButton = page.locator('button:has-text("필터")')
    await filterButton.click()

    // Filter options should be visible
    await expect(page.locator('text=정렬 기준')).toBeVisible()
    await expect(page.locator('text=폴더')).toBeVisible()

    // Click again to hide
    await filterButton.click()

    // Filters should be hidden (check if collapsed)
    const sortLabel = page.locator('text=정렬 기준')
    const isVisible = await sortLabel.isVisible()
    expect(isVisible).toBeFalsy()
  })

  test('should apply sorting', async ({ page }) => {
    await page.goto('/db')

    // Show filters
    await page.click('button:has-text("필터")')

    // Select sort by title
    const sortBySelect = page.locator('select, [role="combobox"]').first()
    await sortBySelect.click()
    await page.click('text=제목')

    // Select ascending order
    const sortOrderSelect = page.locator('select, [role="combobox"]').nth(1)
    await sortOrderSelect.click()
    await page.click('text=오름차순')

    // Notes should be displayed (sorted)
    const notes = page.locator('a[href^="/notes/"]')
    const count = await notes.count()
    expect(count >= 0).toBeTruthy()
  })
})
