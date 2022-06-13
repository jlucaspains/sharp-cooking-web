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

    var result = await db.recipes.get(id);

    console.timeEnd(`getRecipe_${id}`);

    return result;
}

export async function getRecipes(): Promise<Recipe[]> {
    console.time("getRecipes");

    var result = await db.recipes.toArray();

    console.timeEnd("getRecipes");

    return result;
}

export async function getRecipeImages(id: number): Promise<RecipeImage[]> {
    console.time(`getRecipeImages_${id}`);

    var result = await db.recipeImages.where("recipeId").equals(id).toArray();

    console.timeEnd(`getRecipeImages_${id}`);

    return result;
}

export async function getRecipeImage(id: number): Promise<RecipeImage | undefined> {
    console.time(`getRecipeImage_${id}`);

    var result = await db.recipeImages.where("recipeId").equals(id).first();

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
        { id: 1, title: "Sourdough Bread", score: 5, ingredients: ["flour", "water", "salt"], steps: ["mix everything by hand", "Perform the folds"], notes: "", changedOn: new Date().toISOString() },
        { id: 2, title: "Banana bread", score: 5, ingredients: ["flour", "banana", "sugar"], steps: ["mix everything by hand", "Perform the folds"], notes: "", changedOn: new Date().toISOString() },
        { id: 3, title: "Carrot cake", score: 5, ingredients: ["flour", "carrots", "sugar"], steps: ["mix everything by hand", "Perform the folds"], notes: "", changedOn: new Date().toISOString() }
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