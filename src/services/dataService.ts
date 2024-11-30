import { Dexie, Table } from "dexie";
import { BackupModel } from "../pages/recipe/backupModel"
import { Recipe, RecipeImage, RecipeMedia, RecipeNutrition } from "./recipe";
import { Setting } from "./setting";
import { Category } from "./category";

class RecipeDatabase extends Dexie {
    public recipes!: Table<Recipe, number>;
    public recipeImages!: Table<RecipeImage, number>;
    public recipeMedia!: Table<RecipeMedia, number>;
    public settings!: Table<Setting, string>;
    public categories!: Table<Category, number>;

    public constructor() {
        super("RecipeDatabase");
        this.version(2).stores({
            recipes: "++id,title,score,changedOn",
            recipeImages: "++id,recipeId",
            settings: "name"
        });
        this.version(3).stores({
            recipes: "++id,title,score,changedOn",
            recipeImages: "++id,recipeId",
            settings: "name"
        }).upgrade((transaction) => {
            transaction.table("recipeImages").toCollection().modify((image: RecipeImage) => {
                if (image.image) {
                    image.url = image.image;
                }
                image.image = null;
            });
        });
        this.version(4).stores({
            recipes: "++id,title,score,changedOn",
            recipeImages: "++id,recipeId",
            recipeMedia: "++id,recipeId",
            settings: "name"
        }).upgrade(async (transaction) => {
            const imagesTable = transaction.table("recipeImages");
            const mediaTable = transaction.table("recipeMedia");

            // copy images from recipeImages to recipeMedia
            await imagesTable.each(async (image: RecipeImage) => {
                await mediaTable.add(new RecipeMedia(image.recipeId, "img", image.url));
            });

            // only delete recipeImages if the number of images is 
            // the same as the number of items in recipeMedia
            const imagesCount = await imagesTable.count();
            const mediaCount = await mediaTable.count();
            if (mediaCount == imagesCount) {
                await imagesTable.clear();
            }
        });
        this.version(5).stores({
            recipes: "++id,title,score,changedOn",
            recipeImages: "++id,recipeId",
            recipeMedia: "++id,recipeId",
            settings: "name"
        }).upgrade(async (transaction) => {
            transaction.table("recipes").toCollection().modify((recipe: Recipe) => {
                recipe.nutrition = new RecipeNutrition(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            });
        });
        this.version(6).stores({
            recipes: "++id,title,score,changedOn,categoryId",
            recipeImages: "++id,recipeId",
            recipeMedia: "++id,recipeId",
            settings: "name",
            categories: "++id,name"
        }).upgrade(async (transaction) => {
            transaction.table("recipes").toCollection().modify((recipe: Recipe) => {
                recipe.categoryId = 0;
            });
        });
    }
}

const db = new RecipeDatabase();

export async function getRecipe(id: number): Promise<Recipe | undefined> {
    const result = await db.recipes.get(id);

    if (result && !result.nutrition) {
        result.nutrition = new RecipeNutrition(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    return result;
}

export async function getRecipes(): Promise<Recipe[]> {
    return await db.recipes.toArray();
}

export async function getRecipesByCategory(categoryId: number): Promise<Recipe[]> {
    return await db.recipes.where("categoryId").equals(categoryId).toArray();
}

export async function getRecipeMediaList(id: number): Promise<RecipeMedia[]> {
    const result = await db.recipeMedia.where("recipeId").equals(id).toArray();

    return result;
}

export async function getRecipeMedia(id: number): Promise<RecipeMedia | undefined> {
    const result = await db.recipeMedia
        .where("recipeId").equals(id)
        .and(item => item.type == "img")
        .first();

    return result;
}

export async function saveRecipe(recipe: Recipe): Promise<number> {
    recipe.changedOn = new Date().toISOString();
    const result = await db.recipes.put(recipe);

    return result;
}

export async function initialize(recipes: Array<Recipe>) {
    const count = await db.recipes.count();

    if (count > 0) {
        return;
    }

    for (const recipe of recipes) {
        const id = await getNextRecipeId();
        recipe.id = id;
        recipe.changedOn = new Date().toISOString();
        recipe.multiplier = 1;
        recipe.nutrition = new RecipeNutrition(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

        await saveRecipe(recipe);
        await saveRecipeMedia({ recipeId: id, type: "img", url: "/bread.jpg" })
    }
}

export async function saveRecipeMedia(recipeMedia: RecipeMedia) {
    await db.recipeMedia.put(recipeMedia);
}

export async function deleteRecipe(id: number) {
    const images = await db.recipeMedia.where("recipeId").equals(id).toArray();

    for (const item of images) {
        db.recipeMedia.delete(item.id || 0);
    }

    await db.recipes.delete(id);
}

export async function deleteRecipeMedia(id: number) {
    await db.recipeMedia.delete(id);
}

export async function getNextRecipeId(): Promise<number> {
    const item = await db.recipes.orderBy("id").reverse().first();

    const result = item?.id ? item.id + 1 : 1;

    return result;
}

export async function saveSetting(name: string, value: string): Promise<void> {
    await db.settings.put({ name: name, value: value });
}

export async function getSetting(name: string, defaultValue: string): Promise<string> {
    const setting = await db.settings.get(name);
    const result = setting ? setting.value : defaultValue;

    return result;
}

export async function prepareBackup(): Promise<Array<BackupModel>> {
    const allRecipes = await db.recipes.toArray();
    const allMedia = await db.recipeMedia.toArray();

    const result = [];
    for (const recipe of allRecipes) {
        const model = getBackupModel(recipe, allMedia);

        result.push(model);
    }

    return result;
}


export async function prepareRecipeBackup(id: number): Promise<Array<BackupModel>> {
    const recipe = await db.recipes.get(id);
    const allMedia = await db.recipeMedia.where("recipeId").equals(id).toArray();

    const result: Array<BackupModel> = [];

    if (!recipe) {
        return result;
    }

    const model = getBackupModel(recipe, allMedia);
    result.push(model);

    return result;
}

function getBackupModel(recipe: Recipe, allMedia: RecipeMedia[]): BackupModel {
    const model = new BackupModel();
    model.id = recipe.id;
    model.title = recipe.title;
    model.ingredients = recipe.ingredients;
    model.multiplier = recipe.multiplier;
    model.notes = recipe.notes;
    model.score = recipe.score;
    model.changedOn = recipe.changedOn;
    model.source = recipe.source;
    model.steps = recipe.steps;
    model.nutrition = recipe.nutrition;
    model.media = allMedia
        .filter(item => item.recipeId == model.id)
        .map(item => {
            return {
                type: item.type, url: item.url
            };
        });
    model.categoryId = recipe.categoryId;
    // TODO: how to export folders?

    return model;
}

export async function createCategory(category: Category): Promise<number> {
    const result = await db.categories.put(category);
    return result;
}

export async function getCategories(): Promise<Array<Category>> {
    const categories = await db.categories.toArray();
    const result = [] as Array<Category>;
    for (const category of categories) {
        const resultItem = {
            id: category.id, name: category.name
        } as Category;

        const recipe = await db.recipes.where("categoryId").equals(category.id).first();
        if (category.image) {
            resultItem.image = category.image;
        } else {
            if (recipe) {
                const media = await getRecipeMedia(recipe.id || 0);
                resultItem.image = media?.url;
            }
        }

        if (recipe)
        {
            result.push(resultItem);
        }
    }
    result.push({ id: 0, name: "All", image: undefined });
    return result;
}

export async function getAllCategories(): Promise<Array<Category>> {
    return await db.categories.toArray();
}

export async function getCategoryById(id: number): Promise<Category> {
    var category = await db.categories.get(id);

    if (category == null) {
        throw new Error("Category not found");
    }

    return category;
}

export async function deleteCategory(id: number) {
    await db.categories.delete(id);
}
