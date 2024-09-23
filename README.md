# Sharp Cooking Web
Sharp Cooking is a recipe book app originally created for iOS and Android using Xamarin platform. The original app repository is now public and available at [sharp-cooking](https://github.com/jlucaspains/sharp-cooking). However, the iOS and Android apps are no longer maintained and will be pulled from the app store in the near future.

This version of Sharp Cooking aims to provides the same features as the original app but as a installable web app (PWA) instead of native. In addition to the web app, a Python API is also provided for internal consumption only for recipe scraping.

## Contributions
Feel free to contribute with issues and pull requests. However, please keep it cordial and understand this is a work of love and not money.

## Helpful reads
* [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
* [Vue 3](https://vuejs.org/)
* [Vite](https://vitejs.dev/)
* [Typescript](https://www.typescriptlang.org/)
* [Python](https://www.python.org/)
* [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/)
* [Azure Static Web App API](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-overview)
* [Azure Functions with Python](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-python?tabs=get-started%2Casgi%2Capplication-level&pivots=python-mode-decorators)
* [Sharp Cooking blog posts](https://blog.lpains.net/categories/sharpcooking/)

## Running the web app
1. If you intend to contribute back to this repository, please fork it before following the next steps.
2. Ensure you have npm and yarn installed. If you already have npm, you can install yarn with npm:
```powershell
npm install --global yarn
```
2. CD into the project root directory
```powershell
cd c:\code\sharp-cooking-web
```
3. Install package dependencies
```powershell
yarn
```
4. Run
```powershell
yarn dev
```

## Running the API with VS Code
1. Install the recommended extensions from ``.vscode/extensions.json``
2. Ensure you have installed Python ``3.10`` or later. You should install the version from Python's web site and not from the windows store or other alternate sources.
3. See [Microsoft Quickstart](https://learn.microsoft.com/en-us/azure/azure-functions/create-first-function-vs-code-python?pivots=python-mode-configuration#run-the-function-locally) for how to run the function locally.

## Unit tests
Sharp Cooking leverages [Playwright](https://playwright.dev/) for end to end tests. All major functionality is currently tested and contributors are expected to include reasonable tests for any code changes.

Install playwright browsers:
```powershell
npx playwright install chromium firefox webkit
```

Run tests locally:
```powershell
yarn dev
npx playwright test
```
