import { expect, test } from '@playwright/test'

test('opens the home choices and supports direct routes and refresh', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/DSvisualizer/)
  const about = page.getByRole('region', { name: 'About DSvisualizer' })
  await expect(about.getByRole('heading', { name: 'DSvisualizer', exact: true })).toBeVisible()
  await expect(page.getByRole('banner').getByRole('link')).toHaveCount(1)
  const firstCard = page.locator('main').getByRole('link', { name: 'Graphs', exact: true })
  expect((await about.boundingBox())!.y + (await about.boundingBox())!.height).toBeLessThan((await firstCard.boundingBox())!.y)
  for (const [path, label] of [['graphs', 'Graphs'], ['trees', 'Trees'], ['hashing', 'Hashing'], ['arrays', 'Arrays']]) {
    await page.locator('main').getByRole('link', { name: label, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/${path}$`))
    expect((await page.reload())?.status()).toBe(200)
    await page.getByRole('link', { name: /DSvisualizer home/ }).click()
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

test('offers curated learning links in a collapsed homepage panel', async ({ page }) => {
  await page.goto('/')
  const panel = page.locator('.learning-resources')
  const links = panel.getByRole('link')
  await expect(links).toHaveCount(0)
  await page.getByText('Learn more', { exact: true }).click()
  await expect(links).toHaveCount(12)
  for (const host of ['en.wikipedia.org', 'www.youtube.com', 'github.com']) {
    await expect(panel.locator(`a[href^="https://${host}/"]`)).toHaveCount(4)
  }
})

test('stages the homepage intro and loops demos only while fully visible', async ({ page }) => {
  await page.setViewportSize({ width: 1152, height: 800 })
  await page.clock.install()
  await page.goto('/')
  const about = page.getByRole('region', { name: 'About DSvisualizer' })
  await expect(about.getByRole('heading')).toHaveCSS('animation-delay', '1s')
  await expect(about.locator('p')).toHaveCSS('animation-delay', '1.44s')

  const graphs = page.getByRole('region', { name: 'Graphs', exact: true })
  const preview = await graphs.locator('figure').boundingBox()
  const card = await graphs.getByRole('link', { name: 'Graphs', exact: true }).boundingBox()
  expect(preview!.x + preview!.width).toBeLessThan(card!.x)
  expect(preview!.height).toBeGreaterThan(300)

  const arrays = page.getByRole('region', { name: 'Arrays', exact: true })
  expect((await arrays.boundingBox())!.y).toBeGreaterThan(800)
  await expect(arrays.locator('figcaption')).toContainText('Compare neighbors')

  const caption = graphs.locator('figcaption')
  await expect(graphs.getByRole('button')).toHaveCount(0)
  await expect(caption).toContainText('Visit node A.')
  await page.clock.runFor(6160)
  await expect(caption).toContainText('Shortest path: A → B → D.')
  await expect(caption).toContainText('Start at A', { timeout: 3000 })

  await expect(caption).toContainText('Visit node A.')
  await page.evaluate(() => {
    const card = document.querySelector('[data-topic="graphs"] figure')!
    window.scrollBy(0, card.getBoundingClientRect().top - 20)
  })
  await expect(caption).toContainText('Start at A')
  await page.clock.runFor(2000)
  await expect(caption).toContainText('Start at A')
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(caption).toContainText('Visit node A.')
})

test('shows static demo results with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('animation-name', 'none')
  const demos = [
    ['Graphs', 'Shortest path: A → B → D.'],
    ['Trees', 'Found 6.'],
    ['Hashing', 'Insert “h” at bucket 0.'],
    ['Arrays', 'The array is sorted in ascending order.'],
  ]
  for (const [name, result] of demos) {
    const section = page.getByRole('region', { name, exact: true })
    await expect(section.getByRole('button')).toHaveCount(0)
    await expect(section.locator('figcaption')).toContainText(result)
  }
})
