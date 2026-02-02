# PRD: AI-Powered Nutritional Facts Generation

**Feature Name:** AI-Powered Nutritional Facts Generation
**GitHub Issue:** [#479](https://github.com/jlucaspains/sharp-cooking-web/issues/479)  
**Document Version:** 1.0
**Date:** 2026-02-01  
**Status:** Draft

## Introduction

Enable users to automatically generate nutritional facts for their recipes using AI. This feature leverages the existing AI chat infrastructure to analyze recipe ingredients and calculate comprehensive nutrition information (calories, macros, vitamins, minerals, etc.) per serving or per 100g, eliminating manual data entry and improving recipe completeness.

## Goals

- Reduce time to add nutritional facts from manual entry to one click
- Increase the percentage of recipes with complete nutrition data
- Provide accurate, AI-calculated nutrition values based on ingredient lists
- Make nutrition generation accessible from both recipe edit form and AI chat
- Clearly indicate serving size basis (per serving or per 100g) in nutrition display

## User Stories

### US-001: Add "Generate with AI" button to recipe edit nutrition section
**Description:** As a user editing a recipe, I want a button in the nutrition section so I can generate all nutrition facts automatically from my ingredients.

**Acceptance Criteria:**
- [ ] Button labeled "Generate with AI" appears in nutrition section of recipe edit form
- [ ] Button is positioned near the nutrition input fields (before the field group)
- [ ] Button is disabled if recipe has no ingredients entered
- [ ] Button has appropriate icon (sparkles/magic wand/AI icon)
- [ ] Check AI chat settings on page mount using `getSetting("OpenAIAuthorizationHeader")` and `getSetting("OpenAIModelName")`
- [ ] Button is completely hidden if AI chat is not configured (missing API key or model name)
- [ ] Add translation key `pages.recipe.id.edit.generateNutritionAI` = "Generate with AI" (en)
- [ ] Add translation key `pages.recipe.id.edit.generateNutritionAI` = "Gerar com IA" (pt)
- [ ] Translation files validate as valid JSON
- [ ] Typecheck passes
- [ ] Playwright test: Button appears and is disabled when no ingredients exist
- [ ] Playwright test: Button is enabled when ingredients are present
- [ ] Playwright test: Button is hidden when AI chat is disabled in options
- [ ] Tests run on chromium, webkit, Mobile Chrome, Mobile Safari

### US-002: Implement warning dialog before overwriting existing nutrition data
**Description:** As a user, I want to be warned if I'm about to replace nutrition data I already entered, so I don't accidentally lose my work.

**Acceptance Criteria:**
- [ ] If any nutrition field has non-zero value, show confirmation dialog before proceeding
- [ ] Dialog title: "Replace Nutrition Data?"
- [ ] Dialog message: "This will replace existing nutrition data. Continue?"
- [ ] Dialog has "Cancel" and "Continue" buttons
- [ ] If all nutrition fields are empty/zero, skip dialog and proceed immediately
- [ ] Add translation key `pages.recipe.id.edit.nutritionOverwriteWarning` = "This will replace existing nutrition data. Continue?" (en)
- [ ] Add translation key `pages.recipe.id.edit.nutritionOverwriteWarning` = "Isso substituirá os dados nutricionais existentes. Continuar?" (pt)
- [ ] Add translation key `pages.recipe.id.edit.nutritionOverwriteWarningTitle` = "Replace Nutrition Data?" (en)
- [ ] Add translation key `pages.recipe.id.edit.nutritionOverwriteWarningTitle` = "Substituir Dados Nutricionais?" (pt)
- [ ] Translation files validate as valid JSON
- [ ] Typecheck passes
- [ ] Playwright test: Clicking button with empty nutrition fields triggers AI generation (no warning)
- [ ] Playwright test: Clicking button with existing nutrition data shows warning dialog
- [ ] Playwright test: Canceling warning dialog does not modify nutrition fields
- [ ] Playwright test: Confirming warning dialog triggers AI generation
- [ ] Tests run on chromium, webkit, Mobile Chrome, Mobile Safari

### US-003: Create shared AI service for nutrition analysis
**Description:** As a developer, I need a reusable AI service that can calculate nutrition facts from ingredients, usable from both the edit page and chat interface.

**Acceptance Criteria:**
- [ ] Create new file `src/services/aiService.ts`
- [ ] Export function `generateNutritionFacts(ingredients: string[], servingSize: number, settings: AISettings): Promise<RecipeNutrition>`
- [ ] Function accepts ingredients array, servingSize, and AI settings (apiKey, model)
- [ ] Function uses ChatOpenAI directly (no LangGraph/agents) for simplicity
- [ ] AI prompt: "Calculate complete nutritional facts for this recipe. Ingredients: [list]. Return JSON with fields: servingSize, calories, totalFat, saturatedFat, transFat, unsaturatedFat, cholesterol, sodium, carbohydrates, fiber, sugar, protein. If servingSize > 0, calculate per serving. Otherwise calculate per 100g."
- [ ] Function parses AI response into RecipeNutrition object
- [ ] Function validates all required nutrition fields are present in response
- [ ] Handle API errors gracefully and throw typed errors (e.g., AIServiceError)
- [ ] Add JSDoc comments explaining parameters and return type
- [ ] Typecheck passes
- [ ] Unit test: Mock AI response and verify parsing (optional but recommended)

### US-004: Integrate AI service into recipe edit form
**Description:** As a user editing a recipe, I want to click "Generate with AI" and have the nutrition fields automatically populate by calling the shared AI service.

**Acceptance Criteria:**
- [ ] In edit.vue, import `generateNutritionFacts` from aiService
- [ ] On button click, call `generateNutritionFacts(item.value.ingredients, item.value.nutrition.servingSize, settings)`
- [ ] Get AI settings using existing `getSetting("OpenAIAuthorizationHeader")` and `getSetting("OpenAIModelName")`
- [ ] All nutrition fields (servingSize, calories, totalFat, saturatedFat, transFat, unsaturatedFat, cholesterol, sodium, carbohydrates, fiber, sugar, protein) are populated with returned values
- [ ] Values are rounded to 1 decimal place for display
- [ ] Show success notification: "Nutrition facts generated successfully. Please verify values for accuracy."
- [ ] Button shows loading state during generation (disabled + spinner/loading text)
- [ ] Handle errors with user-friendly notification: "Unable to generate nutrition facts. Please try again."
- [ ] User can edit AI-generated values after they're applied
- [ ] Add translation key `pages.recipe.id.edit.nutritionGeneratedSuccess` = "Nutrition facts generated successfully. Please verify values for accuracy." (en)
- [ ] Add translation key `pages.recipe.id.edit.nutritionGeneratedSuccess` = "Dados nutricionais gerados com sucesso. Verifique os valores para precisão." (pt)
- [ ] Add translation key `pages.recipe.id.edit.nutritionGeneratedError` = "Unable to generate nutrition facts. Please try again." (en)
- [ ] Add translation key `pages.recipe.id.edit.nutritionGeneratedError` = "Não foi possível gerar dados nutricionais. Tente novamente." (pt)
- [ ] Translation files validate as valid JSON
- [ ] Typecheck passes
- [ ] Playwright test: Success notification appears after generation with verification reminder
- [ ] Playwright test: Generated values populate all nutrition fields correctly
- [ ] Playwright test: Generated values can be edited manually after generation
- [ ] Tests run on chromium, webkit, Mobile Chrome, Mobile Safari

### US-005: Wrap AI service as LangGraph tool for chat interface
**Description:** As a user in AI chat, I want to ask "generate nutrition facts" or similar and have the AI call the nutrition tool for the current recipe.

**Acceptance Criteria:**
- [ ] In chat.vue, import `generateNutritionFacts` from aiService
- [ ] Create LangGraph tool that wraps the AI service function
- [ ] Tool definition: name="generateNutritionFacts", description="Calculate nutritional facts for the current recipe", schema=z.object({})
- [ ] Tool implementation: Get current recipe, call aiService, save updated recipe, return success message
- [ ] Tool can be triggered by natural language: "generate nutrition", "calculate nutrition facts", "add nutrition info", etc.
- [ ] Tool uses current recipe from route params (id.value)
- [ ] Tool gets AI settings using existing `getSetting()` calls
- [ ] Tool saves updated recipe using `saveRecipe()` after generation
- [ ] Chat response confirms nutrition was generated: "I've calculated the nutrition facts for this recipe and saved them."
- [ ] Handle errors gracefully with message: "I couldn't generate nutrition facts. Please try again."
- [ ] Add tool to existing tools array in chat.vue
- [ ] Typecheck passes
- [ ] Playwright test: User can request "generate nutrition facts" in recipe chat
- [ ] Playwright test: AI responds confirming nutrition was generated
- [ ] Playwright test: Navigating to recipe edit shows populated nutrition fields
- [ ] Tests run on chromium, webkit, Mobile Chrome, Mobile Safari
- [ ] Playwright test: AI responds confirming nutrition was generated
- [ ] Playwright test: Navigating to recipe edit shows populated nutrition fields
- [ ] Playwright test: Requesting nutrition from non-recipe chat shows appropriate error
- [ ] Tests run on chromium, webkit, Mobile Chrome, Mobile Safari

### US-006: Update nutrition display to clearly show serving basis
**Description:** As a user viewing recipe nutrition, I want to see whether values are per serving or per 100g so I understand the basis of calculation.

**Acceptance Criteria:**
- [ ] NutritionFacts component displays serving basis clearly above nutrition label
- [ ] If `servingSize > 0` and recipe has servings defined: Show "Per Serving (X servings per recipe)"
- [ ] If `servingSize > 0` but recipe has no servings defined: Show "Per 100g"
- [ ] Text is visible, readable, and appropriately styled
- [ ] Add translation key `components.nutritionFacts.perServing` = "Per Serving ({{servings}} servings)" (en)
- [ ] Add translation key `components.nutritionFacts.perServing` = "Por Porção ({{servings}} porções)" (pt)
- [ ] Add translation key `components.nutritionFacts.per100g` = "Per 100g" (en)
- [ ] Add translation key `components.nutritionFacts.per100g` = "Por 100g" (pt)
- [ ] Translation files validate as valid JSON
- [ ] Typecheck passes
- [ ] Playwright test: Serving basis label displays correctly for per-serving nutrition
- [ ] Playwright test: Serving basis label displays correctly for per-100g nutrition
- [ ] Tests run on chromium, webkit, Mobile Chrome, Mobile Safari

## Functional Requirements

**FR-1:** Add "Generate with AI" button in nutrition section of recipe edit form (`src/pages/recipe/[id]/edit.vue`)

**FR-2:** Button must be hidden when AI chat is disabled (check `OpenAIAuthorizationHeader` and `OpenAIModelName` settings)

**FR-3:** Button must be disabled when recipe has no ingredients entered (empty or only blank strings)

**FR-4:** If any nutrition field contains non-zero value, show confirmation dialog before proceeding

**FR-5:** Create AI tool function `generateNutritionFacts` that accepts ingredients array and returns RecipeNutrition object

**FR-6:** AI prompt must request all nutrition fields: servingSize, calories, totalFat, saturatedFat, transFat, unsaturatedFat, cholesterol, sodium, carbohydrates, fiber, sugar, protein

**FR-7:** AI prompt must specify calculation basis: per serving if servings defined, otherwise per 100g

**FR-8:** Apply AI-generated values to all nutrition input fields in recipe edit form

**FR-9:** Show success notification after successful generation with reminder to verify accuracy

**FR-10:** Show error notification if AI request fails

**FR-11:** Add `generateNutritionFacts` tool to AI chat agent's available tools list

**FR-12:** Chat agent must be able to invoke nutrition generation from natural language requests

**FR-13:** Update NutritionFacts component to display serving basis label (per serving vs per 100g)

**FR-14:** Serving basis label must use recipe's servingSize and serving count to determine correct display

**FR-15:** Add translation keys for all new UI text in all supported locales (en, pt, en-US, pt-BR)

**FR-16:** Generate comprehensive Playwright tests covering both edit form and chat interface flows

## Non-Goals (Out of Scope)

- Manual selection of specific nutrition fields to generate (always generates all fields)
- User-uploaded custom nutrition databases or ingredient databases
- Nutrition calculation from recipe instructions (only ingredients are analyzed)
- Offline nutrition calculation (requires AI API connection)
- Nutrition facts for recipe variations or substitutions
- Automatic re-generation when ingredients change (user must click button again)
- Recipe-wide nutrition totals (only per-serving or per-100g)
- Import nutrition data from third-party APIs (USDA, etc.)
- Automated validation or fact-checking of AI-generated values (user is responsible for verification)
- Confidence scores or accuracy indicators for AI-generated nutrition
- Nutrition goal tracking or dietary restriction warnings
- Barcode scanning for packaged ingredient nutrition
- AI chat configuration within the nutrition generation flow (users must configure in options page first)

## Design Considerations

### UI/UX
- **Button placement:** Position "Generate with AI" button at the top of nutrition section, before input fields (Option 1 from mockup)
- **Button visibility:** Button must be hidden (not just disabled) when AI chat is not configured to avoid user confusion
- **Visual feedback:** Use spinner or loading text during AI request to indicate progress
- **Icon:** Use sparkles (✨) or magic wand icon to indicate AI functionality
- **Warning dialog:** Use standard modal component with clear "Cancel" / "Continue" buttons
- **Success notification:** Use existing notify() system with positive styling, include verification reminder: "Nutrition facts generated successfully. Please verify values for accuracy."
- **Serving basis label:** Display in NutritionFacts component header, styled as subtitle or caption text

### Reusable Components
- **Modal component:** Already exists at `src/components/Modal.vue` - use for confirmation dialog
- **BusyIndicator component:** Already exists - consider for button loading state
- **RoundButton component:** Consider using for "Generate with AI" button styling

### i18n
- All new text must be translated to English and Portuguese variants (en, en-US, pt, pt-BR)
- Translation key pattern: `pages.recipe.id.edit.{keyName}` for edit page elements
- Translation key pattern: `components.nutritionFacts.{keyName}` for nutrition display elements

## Technical Considerations

### AI Integration Architecture
- **Shared service approach**: Create `src/services/aiService.ts` with `generateNutritionFacts()` function
- **Direct API calls**: Use ChatOpenAI directly in aiService (no LangGraph/agents for simplicity)
- **LangGraph wrapper**: Chat.vue wraps aiService function as a LangGraph tool for natural language support
- **Dual access**: Edit page calls aiService directly, chat uses tool wrapper
- **Type safety**: Use Zod schema for tool definition in chat.vue
- **Structured output**: AI should return JSON matching `RecipeNutrition` interface exactly
- **Reusability**: Single source of truth for AI prompt and parsing logic

### State Management
- Recipe edit page already manages `item.nutrition` object reactively
- Simply update `item.nutrition` properties directly to trigger Vue reactivity
- Chat tool must call `saveRecipe()` after generation to persist changes
- No additional state management required

### Error Handling
- Handle OpenAI API errors (rate limits, network failures, invalid responses)
- Show user-friendly error messages: "Unable to generate nutrition facts. Please try again."
- Log detailed errors to console for debugging
- Do not partially update nutrition fields on error (all-or-nothing update)
- Throw typed errors from aiService (e.g., AIServiceError) for better error handling

### Data Validation
- Ensure AI response includes all required RecipeNutrition fields before applying
- Round values to 1 decimal place for cleaner display
- Validate that servingSize is a positive number if provided
- Handle missing or null values gracefully (default to 0)

### Serving Size Logic
- If recipe has explicit `servings` or `yields` field with value > 0: Calculate per serving
- Otherwise: Calculate per 100g and set servingSize to 100
- AI should receive this context in the prompt to return appropriate values

### Dependencies
- Uses existing `@langchain/openai` and `@langchain/core` packages
- No new npm dependencies required

## Success Metrics

- 80% reduction in time to add nutritional facts (from ~5 minutes manual entry to ~30 seconds with AI)
- 50% increase in recipes with complete nutrition data within 3 months of launch
- < 2 second average response time for AI nutrition generation
- < 5% error rate on AI nutrition requests
- 90% user satisfaction rating for feature (via optional feedback)

## Open Questions

- Should we add a "Regenerate" button after initial generation for users to re-calculate if they edit ingredients?
- Should we allow users to configure which AI model to use for nutrition generation (in AI options)?
- Should we cache/store AI-generated nutrition calculations to reduce API costs on repeated generations?
- Should recipe export/sharing include metadata indicating nutrition was AI-generated?
- Should we track which nutrition values were AI-generated vs manually entered in the database?
