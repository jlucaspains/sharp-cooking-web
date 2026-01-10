import { test, expect } from '@playwright/test';
import { enableAIChat, setup } from './helpers';

test.describe('Chat Page', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await enableAIChat(page);

    await page.goto('#/recipe/1');
    
    // Navigate to chat
    await page.getByTestId('topbar-options').click();
    await page.getByRole('menuitem', { name: 'Chat with Assistant' }).click();
  });

  test('should display chat interface', async ({ page }) => {
    await expect(page.locator('textarea[placeholder="Type a message..."]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    await expect(page.getByText('What can I help you with?')).toBeVisible();
  });

  test('should support multi-line input with textarea', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Type a message..."]');
    
    // Verify it's a textarea
    await expect(textarea).toHaveAttribute('rows', '1');
    
    // Type multi-line text using Shift+Enter
    await textarea.fill('Line 1');
    await textarea.press('Shift+Enter');
    await textarea.type('Line 2');
    await textarea.press('Shift+Enter');
    await textarea.type('Line 3');
    
    // Verify the content has newlines
    const textareaContent = await textarea.inputValue();
    expect(textareaContent).toContain('\n');
    expect(textareaContent).toBe('Line 1\nLine 2\nLine 3');
  });

  test('should auto-expand textarea height as content grows', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Type a message..."]');
    
    // Get initial height
    const initialHeight = await textarea.evaluate((el: HTMLTextAreaElement) => el.offsetHeight);
    
    // Type multiple lines
    await textarea.fill('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
    await textarea.press('Shift+Enter');
    
    // Get height after adding content
    const expandedHeight = await textarea.evaluate((el: HTMLTextAreaElement) => el.offsetHeight);
    
    // Verify height increased
    expect(expandedHeight).toBeGreaterThan(initialHeight);
  });

  test('should not exceed maximum height', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Type a message..."]');
    
    // Fill with many lines to exceed max height
    let longText = '';
    for (let i = 1; i <= 20; i++) {
      longText += `Line ${i}\n`;
    }
    await textarea.fill(longText);
    
    // Get computed max-height
    const maxHeight = await textarea.evaluate((el: HTMLTextAreaElement) => {
      return parseInt(window.getComputedStyle(el).maxHeight);
    });
    
    const actualHeight = await textarea.evaluate((el: HTMLTextAreaElement) => el.offsetHeight);
    
    // Verify height doesn't exceed max-height
    expect(actualHeight).toBeLessThanOrEqual(maxHeight);
  });

  test('should send message on Enter key', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Type a message..."]');
    
    await textarea.fill('Test message');
    await textarea.press('Enter');
    
    // Verify textarea is cleared
    await expect(textarea).toHaveValue('');
  });

  test('should reset textarea height after sending', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Type a message..."]');
    
    // Type multiple lines
    await textarea.fill('Line 1\nLine 2\nLine 3');
    
    const expandedHeight = await textarea.evaluate((el: HTMLTextAreaElement) => el.offsetHeight);
    
    // Send message
    await textarea.press('Enter');
    
    // Wait a moment for reset
    await page.waitForTimeout(100);
    
    // Get height after sending
    const resetHeight = await textarea.evaluate((el: HTMLTextAreaElement) => el.offsetHeight);
    
    // Verify height was reset (should be smaller than expanded)
    expect(resetHeight).toBeLessThan(expandedHeight);
  });

  test('should not send empty messages', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Type a message..."]');
    
    // Try to send empty message
    await textarea.fill('   '); // Just spaces
    await textarea.press('Enter');
    
    // Verify no new message was added (still just the initial assistant message)
    const messageCount = await page.locator('.flex.mb-4.cursor-pointer').count();
    expect(messageCount).toBe(1); // Only the initial "What can I help you with?"
  });

  test('should properly align Send button with multi-line textarea', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Type a message..."]');
    const sendButton = page.getByRole('button', { name: 'Send' });
    
    // Type multiple lines
    await textarea.fill('Line 1\nLine 2\nLine 3');
    
    // Verify both elements are visible and positioned correctly
    await expect(textarea).toBeVisible();
    await expect(sendButton).toBeVisible();
    
    // Check that container has items-end class (bottom alignment)
    const container = page.locator('footer .flex').first();
    await expect(container).toHaveClass(/items-end/);
  });

  test.afterEach(async ({ page }) => {
    // Clean up: delete the test recipe
    await page.goto('/');
    const recipeCard = page.locator('.card', { hasText: 'Test Recipe for Chat' });
    if (await recipeCard.count() > 0) {
      await recipeCard.getByRole('button', { name: 'Actions' }).click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.getByRole('button', { name: 'Confirm' }).click();
    }
  });
});
