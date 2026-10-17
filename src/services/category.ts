export class Category {
    id!: number;
    uuid?: string;
    name!: string;
    image!: string | undefined;
    recipeCount!: number;
    changedOn?: string;
    deletedOn?: string;
}