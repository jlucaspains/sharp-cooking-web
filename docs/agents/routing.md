# Routing

- Routes use hash-based navigation: `/#/route-name`
- In Playwright tests, navigate to routes using the hash prefix: `page.goto('/#/export-recipe-book')`
- File-based routing: create `.vue` files in `src/pages/` to automatically register routes
- Example: `src/pages/export-recipe-book.vue` → route `/#/export-recipe-book`
