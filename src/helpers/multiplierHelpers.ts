import Fraction from "fraction.js";
import { useTranslation } from "i18next-vue";

export function breakIngredientIntoComponents(input: string) {
    const regex = /^(?<Value>\d{1,5}\s\d{1,5}\/\d{1,5}|\d{1,5}\/\d{1,5}|\d{1,5}\.?\d{0,5})/;
    const match = input.match(regex);

    if (!match || match?.length <= 0 || !match.groups) {
        return { quantity: 0, uom: "none" }
    }

    const quantity = match.groups["Quantity"];
    const actualValue = new Fraction(quantity).valueOf();

    return { quantity: match.groups["Quantity"] };
}

export function applyMultiplierToString(input: string, multiplier: number, regex: string, useFractionsOverDecimal: boolean): string {
    multiplier = multiplier > 0 ? multiplier : 1;

    if (multiplier == 1) {
        return input;
    }

    const regexp = new RegExp(regex);
    const match = input.match(regexp);

    if (!match || match?.length <= 0 || !match.groups) {
        return input;
    }

    const maybeFraction = new Fraction(match.groups["Quantity"]).mul(multiplier);

    console.log(`applyMultiplier useFractionsOverDecimal is ${useFractionsOverDecimal}`);
    const newValue = useFractionsOverDecimal ? maybeFraction.toFraction(true) : maybeFraction.valueOf().toLocaleString();

    return input.replace(regexp, newValue);
}