import { expect, test } from '@playwright/test'

test('opens the home choices and supports direct routes and refresh', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Explore data structures' })).toBeVisible()
  for (const [path, label] of [['graphs', 'Graphs'], ['trees', 'Trees'], ['hashing', 'Hashing'], ['arrays', 'Arrays']]) {
    await page.locator('main').getByRole('link', { name: new RegExp(label) }).click()
    await expect(page).toHaveURL(new RegExp(`/${path}$`))
    expect((await page.reload())?.status()).toBe(200)
    await page.getByRole('link', { name: /GraphLab home/ }).click()
  }
})

test('cancels and commits tree edits, then restores the committed tree', async ({ page }) => {
  await page.goto('/trees')
  await page.getByRole('textbox', { name: 'Value' }).fill('12')
  await page.getByRole('button', { name: 'Insert' }).click()
  await page.getByRole('button', { name: 'Cancel run' }).click()
  await expect(page.getByRole('img', { name: 'Binary search tree with 9 nodes' })).toBeVisible()
  await page.getByRole('button', { name: 'Insert' }).click()
  await page.getByRole('slider', { name: 'Playback position' }).press('End')
  await expect(page.getByText('Inserted 12.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('img', { name: 'Binary search tree with 10 nodes' })).toBeVisible()
  await page.getByRole('button', { name: 'In-Order', exact: true }).click()
  await page.getByRole('slider', { name: 'Playback position' }).press('End')
  await expect(page.getByText('1, 3, 4, 6, 7, 8, 10, 12, 13, 14', { exact: true })).toBeVisible()
})

test('requires an explicit sort and finds a value with binary search', async ({ page }) => {
  await page.goto('/arrays')
  await page.getByRole('textbox', { name: 'Array values' }).fill('8, -2, 3')
  await page.getByRole('combobox', { name: 'Algorithm' }).selectOption('binary')
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Sort ascending' }).click()
  await expect(page.getByRole('textbox', { name: 'Array values' })).toHaveValue('-2, 3, 8')
  await page.getByRole('textbox', { name: 'Target' }).fill('3')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await page.getByRole('slider', { name: 'Playback position' }).press('End')
  await expect(page.getByText('Found 3 at index 1.')).toBeVisible()
})

test('visualizes a collision and preserves a displaced key after deletion', async ({ page }) => {
  await page.goto('/hashing')
  await page.getByRole('combobox', { name: 'Collision handling' }).selectOption('probe')
  await page.getByRole('textbox', { name: 'Key' }).fill('a')
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('slider', { name: 'Playback position' }).press('End')
  await expect(page.getByText('Deleted marker')).toBeVisible()
  await page.getByRole('textbox', { name: 'Key' }).fill('h')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await page.getByRole('slider', { name: 'Playback position' }).press('End')
  await expect(page.getByText('Found “h” with value “Honey”.')).toBeVisible()
  await expect(page.getByText('hash(h) % 7 = 104 % 7 = 6')).toBeVisible()
})

test('keeps lab navigation and content within a small phone width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const path of ['/', '/trees', '/hashing', '/arrays']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  }
})
