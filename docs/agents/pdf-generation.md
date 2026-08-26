# PDF Generation

- **Libraries**: Uses jspdf (v4.0.0) and jspdf-autotable (v5.0.7)
- **Helper location**: `src/helpers/pdfHelpers.ts`
- **Image handling**: Always compress images to max 800px width using canvas (JPEG 80% quality)
- **Null safety**: Check for null/missing images before calling `doc.addImage()`
- **Page overflow**: Track `yPosition` and call `doc.addPage()` when content exceeds page height
- **Table of contents**: Use `jspdf-autotable` for structured lists
- **Text wrapping**: Use `doc.splitTextToSize()` for long text that needs to wrap
- **Progress indicators**:
  - For long operations (10+ recipes), show progress dialog with current item and percentage
  - Export service accepts optional progress callback: `(progress: RecipeBookExportProgress) => void`
  - Progress dialog should have proper ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
  - Progress bars need `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
  - For very fast operations, avoid showing progress to prevent UI flash
