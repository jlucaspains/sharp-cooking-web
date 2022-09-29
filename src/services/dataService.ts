import { Dexie, Table } from "dexie";
import { Recipe, RecipeImage } from "./recipe";

class RecipeDatabase extends Dexie {
    public recipes!: Table<Recipe, number>;
    public recipeImages!: Table<RecipeImage, number>;

    public constructor() {
        super("RecipeDatabase");
        this.version(1).stores({
            recipes: "++id,title,score,changedOn",
            recipeImages: "++id,recipeId"
        });
    }
}

const db = new RecipeDatabase();

export async function getRecipe(id: number): Promise<Recipe | undefined> {
    console.time(`getRecipe_${id}`);

    const result = await db.recipes.get(id);

    console.timeEnd(`getRecipe_${id}`);

    return result;
}

export async function getRecipes(): Promise<Recipe[]> {
    console.time("getRecipes");

    const result = await db.recipes.toArray();

    console.timeEnd("getRecipes");

    return result;
}

export async function getRecipeImages(id: number): Promise<RecipeImage[]> {
    console.time(`getRecipeImages_${id}`);

    const result = await db.recipeImages.where("recipeId").equals(id).toArray();

    console.timeEnd(`getRecipeImages_${id}`);

    return result;
}

export async function getRecipeImage(id: number): Promise<RecipeImage | undefined> {
    console.time(`getRecipeImage_${id}`);

    const result = await db.recipeImages.where("recipeId").equals(id).first();

    console.timeEnd(`getRecipeImage_${id}`);

    return result;
}

export async function saveRecipe(recipe: Recipe) {
    console.time("saveRecipe");

    await db.recipes.put(recipe);

    console.timeEnd("saveRecipe");
}

export async function initialize() {
    const recipes = [
        { id: 1, title: "Sourdough Bread", score: 5, ingredients: ["flour", "water", "salt"], steps: ["mix everything by hand", "Perform the folds"], notes: "", source: "", multiplier: 1, changedOn: new Date().toISOString() },
        { id: 2, title: "Banana bread", score: 4, ingredients: ["flour", "banana", "sugar"], steps: ["mix everything by hand", "Perform the folds"], notes: "", source: "", multiplier: 1, changedOn: new Date().toISOString() },
        { id: 3, title: "Carrot cake", score: 3, ingredients: ["flour", "carrots", "sugar"], steps: ["mix everything by hand", "Perform the folds"], notes: "", source: "", multiplier: 1, changedOn: new Date().toISOString() }
    ];

    for (const recipe of recipes) {
        await saveRecipe(recipe);
    }
}

export async function saveRecipeImage(recipeImage: RecipeImage) {
    console.time("saveRecipeImage");

    await db.recipeImages.put(recipeImage);

    console.timeEnd("saveRecipeImage");
}

export async function deleteRecipe(id: number) {
    console.time("deleteRecipe");
    
    const images = await db.recipeImages.where("recipeId").equals(id).toArray();

    for (const item of images) {
        db.recipeImages.delete(item.id || 0);
    }

    await db.recipes.delete(id);

    console.timeEnd("deleteRecipe");
}

export async function getNextRecipeId(): Promise<number> {
    console.time("getNextRecipeId");
    
    const item = await db.recipes.orderBy("id").reverse().first();

    const result = item?.id ? item.id + 1 : 1; 

    console.timeEnd("getNextRecipeId");

    return result;
}