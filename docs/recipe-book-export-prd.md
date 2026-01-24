# Product Requirements Document: Recipe Book PDF Export

**Feature Name:** Recipe Book PDF Export  
**GitHub Issue:** [#93](https://github.com/jlucaspains/sharp-cooking-web/issues/93)  
**Document Version:** 1.1  
**Date:** 2026-01-23  
**Author:** GitHub Copilot  
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Problem Statement
Sharp Cooking users currently can only view and manage recipes digitally within the app. Users who want to create physical cookbooks, share printed collections, or have offline access to multiple recipes at once lack the ability to export selected recipes as a cohesive document. This limits the app's utility for users who prefer printed materials or want to create personalized cookbook gifts.

### 1.2 Proposed Solution
Implement a Recipe Book PDF Export feature as a dedicated full-page interface that allows users to select multiple recipes (manually or by tags/categories) and export them as a single, well-formatted PDF document with a cover page and table of contents. This feature will be accessible from the ellipsis menu in the main navigation toolbar.

### 1.3 Success Metrics
- **Adoption Rate:** 15% of active users utilize the export feature within 3 months
- **User Satisfaction:** Positive feedback on PDF quality and usability in user surveys
- **Export Completion:** 80% of initiated exports successfully generate PDFs
- **Performance:** PDF generation completes in < 10 seconds for up to 25 recipes

---

## 2. Goals and Non-Goals

### 2.1 Goals
- ✅ Enable users to create printable cookbooks from their recipe collection
- ✅ Support manual recipe selection via checkboxes on a dedicated full page
- ✅ Support tag/category-based filtering for recipe selection
- ✅ Generate professional PDF with cover page, table of contents, and recipes
- ✅ Include recipe images in the PDF output
- ✅ Provide access via ellipsis menu in main navigation toolbar
- ✅ Work entirely client-side (no backend dependency)

### 2.2 Non-Goals (Out of Scope for MVP)
- ❌ User-configurable export options (which fields to include/exclude)
- ❌ Nutrition facts in PDF export (may be added in Phase 2)
- ❌ Recipe notes in export
- ❌ Cover page with custom title
- ❌ Advanced PDF customization (fonts, colors, themes)
- ❌ Custom cover page design or template selection
- ❌ Recipe book save/edit functionality (one-time export only)
- ❌ Print-specific optimization (page breaks, margins)
- ❌ Multi-language support in PDF (follows app language)
- ❌ Cloud storage or sharing of generated PDFs

---

## 3. User Stories

### 3.1 Primary User Stories

**US-1: Manual Recipe Selection**  
*As a user, I want to manually select specific recipes from my collection on a dedicated page so that I can create a custom cookbook with only my favorite recipes.*

**Acceptance Criteria:**
- User can access "Export Recipe Book" from ellipsis menu in navigation
- Dedicated page opens at route `/export-recipe-book`
- Checkbox appears next to each recipe in the selection list
- "Select All" and "Clear All" buttons are available
- Selected count is visible (e.g., "15 recipes selected")
- User can proceed to export once at least 1 recipe is selected
- Page has back/cancel navigation to return to recipe list

---

**US-2: Category-Based Selection**  
*As a user, I want to filter recipes by category/tag so that I can quickly export all recipes of a specific type (e.g., all desserts).*

**Acceptance Criteria:**
- Category/tag filter dropdown is available in selection interface
- Selecting a category automatically checks matching recipes
- User can combine category filter with manual selection
- Filter persists while user adjusts selection

---

**US-3: PDF Generation**  
*As a user, I want the exported PDF to include a table of contents and all selected recipes so that the cookbook is organized and printable.*

**Acceptance Criteria:**
- PDF includes:
  - Table of contents with recipe titles as first page
  - Each recipe on a separate page with:
    - Recipe title
    - Recipe image (if available)
    - Ingredients list
    - Instructions/steps
- PDF downloads automatically after generation
- File name format: `Sharp-Cooking-Recipe-Book-YYYY-MM-DD.pdf`

---

**US-4: Global Access**  
*As a user, I want to easily find the export feature so that I can create a recipe book whenever needed.*

**Acceptance Criteria:**
- "Export Recipe Book" menu item is in the ellipsis (⋮) dropdown menu
- Menu item is accessible from any page with the top navigation
- Clicking menu item navigates to `/export-recipe-book` page
- Icon clearly indicates export/download functionality

---

### 3.2 Edge Cases

**EC-1: No Recipes Selected**  
- Export button is disabled until at least 1 recipe is selected
- Helper text indicates "Select at least 1 recipe to export"

**EC-2: Large Recipe Count**  
- Show warning if > 50 recipes selected: "Large exports may take longer"
- Progress indicator during PDF generation

**EC-3: Missing Recipe Images**  
- Recipes without images display title and content only (no broken image)

**EC-4: Empty Recipe Collection**  
- If user has 0 recipes, show empty state: "Add recipes to create a recipe book"

---

## 4. Technical Specifications

### 4.1 Architecture Overview

```
┌─────────────────┐
│  Full Page UI   │
│  (Recipe Book   │
│   Export Page)  │
│  Route: /export │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Export Service │
│  - Selection    │
│  - Filtering    │
│  - Generation   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PDF Library    │
│  (jsPDF or      │
│   pdfmake)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Browser        │
│  Download       │
└─────────────────┘
```

### 4.2 Data Models

**RecipeBookExportRequest**
```typescript
interface RecipeBookExportRequest {
  recipes: Recipe[];           // Selected recipes
}

// ExportOptions are fixed for MVP:
// - Always include: title, image, ingredients, steps
// - Always include: table of contents
// - Never include: nutrition facts, recipe notes
```

### 4.3 Technology Stack

**PDF Generation Libraries (Evaluation Required):**
1. **jsPDF** (Recommended for MVP)
   - Pros: Lightweight, simple API, good for basic layouts
   - Cons: Limited advanced layout features
   - Use with: jsPDF-AutoTable for tables

2. **pdfmake** (Alternative)
   - Pros: Better layout control, document definition approach
   - Cons: Larger bundle size
   - Better for: Complex layouts

**Recommendation:** Start with **jsPDF** for MVP simplicity. Migrate to pdfmake if advanced layout needs emerge.

### 4.4 Component Structure

**New Components:**
- `src/pages/export-recipe-book.vue` - Full page for recipe selection and export
- `RecipeSelectionList.vue` - Recipe selection with checkboxes (reusable component)
- `ExportProgressDialog.vue` - Progress indicator during generation

**New Services:**
- `src/services/recipeBookExportService.ts` - Core export logic
- `src/helpers/pdfHelpers.ts` - PDF generation utilities

### 4.5 Dependencies

**New Dependencies:**
```json
{
  "jspdf": "^2.5.2",
  "jspdf-autotable": "^3.8.0"
}
```

**Bundle Size Impact:** ~150KB (gzipped)

### 4.6 User Flow

```
1. User clicks ellipsis menu (⋮) in top navigation
   ↓
2. User clicks "Export Recipe Book" menu item
   ↓
3. App navigates to /export-recipe-book page
   ↓
4. Page displays:
   - Recipe list with checkboxes
   - Category filter dropdown
   - Search/filter input
   - Export button (fixed at bottom or in header)
   ↓
5. User selects recipes (manual or by category)
   ↓
6. User clicks "Export PDF" button
   ↓
7. Progress dialog shows generation status
   ↓
8. PDF generates client-side with TOC + recipes (title, image, ingredients, steps)
   ↓
9. Browser downloads PDF automatically
   ↓
10. Success message shows
   ↓
11. User can export again or navigate back to recipes
```

### 4.7 PDF Layout Specification

**Cover Page:**
- Title: "My Recipe Book" (centered, large font)
- Subtitle: "Created with Sharp Cooking"
- Date: Export date (YYYY-MM-DD)
- Total recipes count

**Table of Contents:**
- "Table of Contents" heading
- Recipe titles with page numbers
- Simple, clean layout

**Recipe Page Template:**
```
┌─────────────────────────────┐
│  Recipe Title (H1)          │
├─────────────────────────────┤
│  [Recipe Image - if exists] │
├─────────────────────────────┤
│  Ingredients:               │
│  • Ingredient 1             │
│  • Ingredient 2             │
│  • ...                      │
├─────────────────────────────┤
│  Instructions:              │
│  1. Step 1                  │
│  2. Step 2                  │
│  3. ...                     │
└─────────────────────────────┘
```

**Not Included in MVP:**
- Nutrition facts
- Recipe notes
- Source information

### 4.8 Performance Considerations

**Optimization Strategies:**
- Lazy load PDF library (code splitting)
- Process recipes in batches of 10 to prevent UI blocking
- Use Web Workers for PDF generation (Phase 2 enhancement)
- Compress images before adding to PDF (max 800px width)
- Show progress indicator for > 10 recipes

**Performance Targets:**
- < 2s for 1-10 recipes
- < 5s for 11-25 recipes  
- < 10s for 26-50 recipes

---

## 5. User Interface Design

### 5.1 Navigation Entry Point

**Location:** Ellipsis menu (⋮) in top navigation bar  
**Visual:** Menu item with export/download icon  
**Label:** "Export Recipe Book"

### 5.2 Export Page Layout

**Route:** `/export-recipe-book`

**Desktop Layout:**
```
┌────────────────────────────────────────────────┐
│  ← Back    Export Recipe Book        [Export] │ ← Header
├────────────────────────────────────────────────┤
│                                                │
│  Category: [All ▼]     [Search recipes...]     │ ← Filters
│  [☑ Select All]  [Clear All]                   │
│                                                │
│  15 recipes selected                           │
│                                                │
│  ┌────────────────────────────────────────┐    │
│  │ ☑ Chocolate Chip Cookies               │    │
│  │ ☐ Banana Bread                         │    │
│  │ ☑ Spaghetti Carbonara                  │    │ ← Recipe List
│  │ ☐ Caesar Salad                         │    │   (scrollable)
│  │ ... (scrollable list)                  │    │
│  └────────────────────────────────────────┘    │
│                                                │
│  [Export PDF]                                  │ ← Fixed Button
└────────────────────────────────────────────────┘
```

**Mobile Layout:**
```
┌──────────────────────────┐
│ ← Export Recipe Book   ⋮ │ ← Header with menu
├──────────────────────────┤
│ Category: [All ▼]        │
│ [Search recipes...]      │
│ [☑ Select] [Clear]       │
├──────────────────────────┤
│ 15 recipes selected      │
├──────────────────────────┤
│ ☑ Chocolate Chip Cookies │
│ ☐ Banana Bread           │
│ ☑ Spaghetti Carbonara    │
│ ... (scrollable)         │
└──────────────────────────┘
│ [Export PDF] ← Sticky    │
└──────────────────────────┘
```

### 5.3 Progress Dialog

```
┌──────────────────────────────┐
│  Generating Recipe Book...   │
│                              │
│  ████████░░░░░░░░ 50%        │
│                              │
│  Processing: Chocolate Chip  │
│  Cookies (15 of 30)          │
└──────────────────────────────┘
```

### 5.4 Success Feedback

**Toast Notification:**  
"Recipe book exported successfully! Check your downloads."

---

## 6. Internationalization (i18n)

**Translation Keys Required:**

```json
{
  "export": {
    "title": "Export Recipe Book",
    "button": "Export PDF",
    "backButton": "Back to Recipes",
    "selectAll": "Select All",
    "clearAll": "Clear All",
    "searchPlaceholder": "Search recipes...",
    "categoryFilter": "Category",
    "allCategories": "All Categories",
    "recipesSelected": "{{count}} recipes selected",
    "noRecipes": "No recipes to export. Add recipes first.",
    "helperText": "Select at least 1 recipe to export",
    "warningLarge": "Large exports may take longer",
    "progress": {
      "generating": "Generating Recipe Book...",
      "processing": "Processing: {{recipeName}} ({{current}} of {{total}})"
    },
    "success": "Recipe book exported successfully!",
    "error": "Failed to export recipe book. Please try again."
  },
  "pdf": {
    "tocTitle": "Table of Contents",
    "ingredients": "Ingredients",
    "instructions": "Instructions",
    "page": "Page"
  }
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

**Test Cases:**
- `recipeBookExportService.ts`
  - ✓ Filter recipes by category
  - ✓ Validate export request (min 1 recipe)
  - ✓ Handle recipes without images
  - ✓ Handle recipes without nutrition data

- `pdfHelpers.ts`
  - ✓ Generate cover page
  - ✓ Generate table of contents
  - ✓ Generate recipe page with title, image, ingredients, steps
  - ✓ Handle image compression with minimal loss
  - ✓ Handle recipes without images

### 7.2 Integration Tests

**Test Cases:**
- ✓ Full export flow with 5 recipes
- ✓ Export with category filter applied
- ✓ Export with manual selection
- ✓ Export with mixed image/no-image recipes
- ✓ Verify Cover page appears as first page
- ✓ Verify TOC appears as second page
- ✓ Verify no nutrition, or notes in output
- ✓ Large export (25+ recipes) performance test

### 7.3 E2E Tests (Playwright)

**Test Scenarios:**
```typescript
// tests/recipe-book-export.spec.ts

test('should navigate to export page from ellipsis menu', async ({ page }) => {
  // 1. Navigate to app
  // 2. Click ellipsis menu in navigation
  // 3. Click "Export Recipe Book" menu item
  // 4. Verify URL is /export-recipe-book
  // 5. Verify page title shows "Export Recipe Book"
});

test('should export recipe book with manual selection', async ({ page }) => {
  // 1. Navigate to /export-recipe-book
  // 2. Select 3 recipes manually
  // 3. Click "Export PDF"
  // 4. Verify PDF download initiated
  // 5. Verify success message shown
  // 6. Verify PDF contains TOC + recipes with title, image, ingredients, steps
});

test('should filter recipes by category', async ({ page }) => {
  // 1. Navigate to export page
  // 2. Select "Desserts" category
  // 3. Verify only dessert recipes shown
  // 4. Export and verify
});

test('should disable export button when no recipes selected', async ({ page }) => {
  // 1. Navigate to export page
  // 2. Deselect all recipes
  // 3. Verify "Export PDF" button is disabled
  // 4. Verify helper text shows
});

test('should navigate back to recipes', async ({ page }) => {
  // 1. Navigate to export page
  // 2. Click back button
  // 3. Verify returned to recipe list
});

test('should verify PDF does not include nutrition page', async ({ page }) => {
  // 1. Navigate to export page
  // 2. Select recipes and export
  // 3. Verify PDF starts with TOC (not cover page)
  // 4. Verify recipes do not contain nutrition facts section
});
```

### 7.4 Manual Testing Checklist

- [ ] PDF renders correctly in Chrome PDF viewer
- [ ] PDF renders correctly in Safari PDF viewer
- [ ] Images display properly in PDF
- [ ] Recipes contain only: title, image, ingredients, steps (no nutrition)
- [ ] Recipe formatting is consistent across pages
- [ ] Large export (50 recipes) completes without errors
- [ ] Mobile UI is usable (touch-friendly checkboxes)

---

## 8. Security and Privacy

### 8.1 Security Considerations

✅ **No Backend Required:** All processing happens client-side  
✅ **No Data Transmission:** Recipes never leave user's browser  
✅ **No External Dependencies:** PDF generation uses local libraries  
⚠️ **PDF Library Security:** Use trusted, well-maintained libraries (jsPDF)

### 8.2 Privacy Compliance

- ✅ No user data is collected or transmitted
- ✅ Recipes remain local to IndexedDB
- ✅ No analytics on export feature (unless app-wide analytics exist)
- ✅ No cloud storage or sharing (out of scope for MVP)

---

## 9. Accessibility (a11y)

### 9.1 Requirements

**WCAG 2.1 Level AA Compliance:**

- ✅ Keyboard navigation: Tab through all controls
- ✅ Screen reader support: ARIA labels on all interactive elements
- ✅ Focus indicators: Visible focus states on checkboxes and buttons
- ✅ Color contrast: Meets 4.5:1 ratio for text
- ✅ Semantic HTML: Proper checkbox inputs, not div hacks

**Specific Implementations:**
```html
<button
  aria-label="Export Recipe Book"
  role="button"
  tabindex="0">
  Export Book
</button>

<div role="dialog" aria-labelledby="export-modal-title">
  <h2 id="export-modal-title">Export Recipe Book</h2>
  <!-- ... -->
</div>

<input
  type="checkbox"
  aria-label="Select Chocolate Chip Cookies recipe"
  role="checkbox"
  :aria-checked="isSelected" />
```

---

## 10. Implementation Plan

### 10.1 Phase 1: MVP (Priority)

**Estimated Effort:** 3-4.5 days

**Tasks:**
1. **Setup & Dependencies** (4 hours)
   - [ ] Install jsPDF and jsPDF-AutoTable
   - [ ] Create service and helper files
   - [ ] Setup TypeScript types
   - [ ] Create route for `/export-recipe-book`

2. **UI Components** (8 hours)
   - [ ] Create export-recipe-book.vue page component
   - [ ] Create RecipeSelectionList.vue component
   - [ ] Add menu item to ellipsis dropdown in navigation
   - [ ] Implement checkbox selection logic
   - [ ] Add back/cancel navigation

3. **Core Export Logic** (10 hours)
   - [ ] Implement recipeBookExportService.ts
   - [ ] Create pdfHelpers.ts
   - [ ] Implement table of contents generation
   - [ ] Implement recipe page layout (title, image, ingredients, steps only)
   - [ ] Handle image embedding
   - [ ] Handle recipes without images

4. **Testing** (8 hours)
   - [ ] Write unit tests
   - [ ] Write integration tests
   - [ ] Create E2E test (Playwright)
   - [ ] Manual testing across browsers

5. **i18n & Polish** (4 hours)
   - [ ] Add translation keys
   - [ ] Implement error handling
   - [ ] Add success notifications
   - [ ] Responsive design tweaks
   - [ ] Add loading states

6. **Documentation** (2 hours)
   - [ ] Update README with feature description
   - [ ] Add inline code documentation
   - [ ] Create user guide (if applicable)

**Total Estimated Hours:** 36 hours (~4.5 days)

### 10.2 Phase 2: Enhancements (Future)

**Potential Future Improvements:**
- User-configurable export options (toggle images, nutrition, custom cover page)
- Cover page with custom title and date
- Nutrition facts in recipe pages
- Recipe notes/source information in export
- Advanced customization (fonts, colors, themes)
- Print optimization (page breaks, margins)
- Recipe book templates
- Save/load export configurations
- Multi-language PDF support
- Web Worker for background PDF generation
- Share to cloud storage (Google Drive, OneDrive)

---

## 11. Risks and Mitigations

### 11.1 Technical Risks

**Risk 1: PDF Library Bundle Size**  
- **Impact:** High (affects load time)
- **Probability:** Medium
- **Mitigation:** 
  - Code split PDF library (load only when export is used)
  - Evaluate lightweight alternatives if jsPDF is too large
  - Consider dynamic import: `const jsPDF = await import('jspdf')`

**Risk 2: Large PDF Generation Performance**  
- **Impact:** Medium (user experience)
- **Probability:** High
- **Mitigation:**
  - Implement progress indicator
  - Batch processing of recipes
  - Warn users for exports > 50 recipes
  - Phase 2: Use Web Workers

**Risk 3: Image Handling Complexity**  
- **Impact:** Medium (feature quality)
- **Probability:** Medium
- **Mitigation:**
  - Test with various image formats (JPEG, PNG, WebP)
  - Compress images before embedding
  - Fallback: Skip images that fail to load

**Risk 4: Browser Compatibility**  
- **Impact:** High (feature availability)
- **Probability:** Low
- **Mitigation:**
  - Target modern browsers (Chrome, Firefox, Safari, Edge)
  - Test PDF download in all supported browsers
  - Document minimum browser versions

### 11.2 User Experience Risks

**Risk 1: User Confusion (Feature Discovery)**  
- **Impact:** Medium
- **Probability:** Medium
- **Mitigation:**
  - Prominent placement in navigation
  - Clear icon and label
  - In-app tutorial or help text
  - Announce feature in release notes

**Risk 2: Unrealistic Expectations**  
- **Impact:** Low (user satisfaction)
- **Probability:** Medium
- **Mitigation:**
  - Set clear expectations in UI ("Basic PDF export")
  - Link to feedback form for feature requests
  - Document limitations in help section

---

## 12. Success Criteria

### 12.1 Launch Criteria

**Must Have (Go/No-Go):**
- ✅ Users can select recipes manually
- ✅ Users can filter by category
- ✅ PDF includes cover page, TOC and recipes (title, image, ingredients, steps only)
- ✅ PDF does NOT include nutrition facts, or recipe notes
- ✅ PDF downloads successfully in Chrome, Firefox, Safari
- ✅ E2E tests pass with 100% success rate
- ✅ No critical bugs identified
- ✅ Accessibility audit passes (WCAG 2.1 AA)

**Nice to Have (Can Defer):**
- Progress indicator for large exports
- Recipe count warning (> 50 recipes)
- Image compression optimization

### 12.2 Post-Launch Metrics

**Key Performance Indicators (KPIs):**
- **Adoption Rate:** % of users who export at least once
- **Engagement:** Average exports per active user per month
- **Success Rate:** % of successful PDF generations (no errors)
- **User Feedback:** Qualitative feedback from surveys or GitHub issues

**Target Metrics (3 months post-launch):**
- Adoption rate: 15%+
- Average exports per user: 2+
- Success rate: 95%+
- User satisfaction: 80% positive feedback

---

## 13. Appendix

### 13.1 Related GitHub Issues

- Issue #93: Option to export a recipe book (this PRD)
- Related features:
  - Recipe sharing (#XX - if exists)
  - Recipe backup/restore (#XX - if exists)

### 13.2 Competitive Analysis

**Similar Features in Other Apps:**
- **Paprika Recipe Manager:** PDF export with customizable templates
- **Cookmate:** Batch export to PDF with category filtering
- **Yummly:** No native PDF export (exports individual recipes only)

**Differentiator for Sharp Cooking:**
- Fully offline/client-side processing
- No subscription required
- Integrated with existing category system

### 13.3 Open Questions

1. **Should table of contents be clickable (PDF hyperlinks)?**
   - Decision: Yes, if jsPDF supports it easily. Otherwise, defer to Phase 2.

2. **Should we support recipe notes in export?**
   - Decision: No for MVP (Recipe model shows notes field, but confirm usage). Add in Phase 2 if requested.

3. **Should we allow custom book title?**
   - Decision: No for MVP. Default to "My Recipe Book". Add customization in Phase 2.

4. **Maximum recipe limit per export?**
   - Decision: Soft limit warning at 50 recipes. Hard limit at 100 to prevent browser crashes.

---

## 14. Approval and Sign-off

**Document Status:** Ready for Review  
**Stakeholder Approval Required:**
- [ ] Product Owner: @jlucaspains
- [ ] Technical Lead: TBD
- [ ] UX/Design: TBD

**Change Log:**
- 2026-01-23: Initial draft (v1.0)
- 2026-01-23: Updated to use full page instead of modal, moved navigation to ellipsis menu (v1.1)
- 2026-01-24: Simplified MVP - removed export options, fixed output to TOC + title/image/ingredients/steps only (v1.2)

---

**End of PRD**
