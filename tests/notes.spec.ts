import { test, expect } from '@playwright/test'

test.describe('Notes', () => {
  test('should create a new note with Quick Add', async ({ page }) => {
    await page.goto('/notes')

    // Click Quick Add button
    await page.click('button:has-text("Quick Add")')

    // Should navigate to the new note page
    await expect(page).toHaveURL(/\/notes\/[a-z0-9]+/)

    // Enter note title
    const titleInput = page.locator('input[placeholder="노트 제목"]')
    await titleInput.fill('Test Note Title')

    // Enter note content
    const editor = page.locator('.tiptap')
    await editor.click()
    await editor.fill('This is test content')

    // Save the note
    await page.click('button:has-text("Save")')

    // Should show success toast
    await expect(page.locator('text=저장되었습니다')).toBeVisible()
  })

  test('should display note list', async ({ page }) => {
    await page.goto('/notes')

    // Should show notes list or empty state
    const emptyState = page.locator('text=노트가 없습니다')
    const notesList = page.locator('a[href^="/notes/"]')

    const hasNotes = await notesList.count() > 0
    const isEmpty = await emptyState.isVisible()

    expect(hasNotes || isEmpty).toBeTruthy()
  })

  test('should filter notes by folder', async ({ page }) => {
    await page.goto('/notes')

    // Click folder toggle button (mobile/desktop)
    const folderButton = page.locator('button:has-text("폴더")')
    if (await folderButton.isVisible()) {
      await folderButton.click()
    }

    // Check if folder tree is visible
    const folderTree = page.locator('text=Inbox')
    if (await folderTree.isVisible()) {
      await folderTree.click()
      // URL should contain folderId parameter
      await expect(page).toHaveURL(/folderId=/)
    }
  })

  test('should navigate back from note detail', async ({ page }) => {
    await page.goto('/notes')

    // Find first note and click it
    const firstNote = page.locator('a[href^="/notes/"]').first()
    if (await firstNote.isVisible()) {
      await firstNote.click()

      // Should be on note detail page
      await expect(page).toHaveURL(/\/notes\/[a-z0-9]+/)

      // Click back button
      await page.click('button:has-text("Back")')

      // Should be back on notes list
      await expect(page).toHaveURL('/notes')
    }
  })
})
