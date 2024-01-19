import { Dexie, Table } from "dexie";
import { BackupModel } from "../pages/recipe/backupModel"
import { Recipe, RecipeImage } from "./recipe";
import { Setting } from "./setting";

class RecipeDatabase extends Dexie {
    public recipes!: Table<Recipe, number>;
    public recipeImages!: Table<RecipeImage, number>;
    public settings!: Table<Setting, string>;

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
    }
}

const db = new RecipeDatabase();

export async function getRecipe(id: number): Promise<Recipe | undefined> {
    const result = await db.recipes.get(id);

    return result;
}

export async function getRecipes(): Promise<Recipe[]> {
    const result = await db.recipes.toArray();

    return result;
}

export async function getRecipeImages(id: number): Promise<RecipeImage[]> {
    const result = await db.recipeImages.where("recipeId").equals(id).toArray();

    return result;
}

export async function getRecipeImage(id: number): Promise<RecipeImage | undefined> {
    const result = await db.recipeImages.where("recipeId").equals(id).first();

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

        await saveRecipe(recipe);
        await saveRecipeImage({ recipeId: id, image: null, url: "/bread.jpg" })
    }
}

export async function saveRecipeImage(recipeImage: RecipeImage) {
    const sequence = Math.random();

    await db.recipeImages.put(recipeImage);
}

export async function deleteRecipe(id: number) {
    const images = await db.recipeImages.where("recipeId").equals(id).toArray();

    for (const item of images) {
        db.recipeImages.delete(item.id || 0);
    }

    await db.recipes.delete(id);
}

export async function deleteRecipeImage(id: number) {
    const sequence = Math.random();

    await db.recipeImages.delete(id);
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
    const allImages = await db.recipeImages.toArray();

    const result = [];
    for (const recipe of allRecipes) {
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
        model.images = allImages.filter(item => item.recipeId == model.id).map(item => item.url);
        result.push(model);
    }

    return result;
}


export async function prepareRecipeBackup(id: number): Promise<Array<BackupModel>> {
    const recipe = await db.recipes.get(id);
    const allImages = await db.recipeImages.where("recipeId").equals(id).toArray();

    const result: Array<BackupModel> = [];

    if (!recipe) {
        return result;
    }

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
    model.images = allImages.map(item => item.url);
    result.push(model);

    return result;
}