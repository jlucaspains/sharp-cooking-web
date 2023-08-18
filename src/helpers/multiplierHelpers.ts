import Fraction from "fraction.js";
import { parseIngredient, parseInstruction } from '@jlucaspains/sharp-recipe-parser';

function localeParseFloat(s: string, locale: string) {
    // Get the thousands and decimal separator characters used in the locale.
    let [, thousandsSeparator, , , , decimalSeparator] = 1111.1.toLocaleString(locale);

    const cleanInput = s.replace(thousandsSeparator, "").replace(decimalSeparator, ".");

    // Now it can be parsed
    return parseFloat(cleanInput);
}

export function applyMultiplierToString(input: string, multiplier: number, regex: string, useFractionsOverDecimal: boolean, locale: string): string {
    multiplier = multiplier > 0 ? multiplier : 1;

    if (multiplier == 1) {
        return input;
    }

    const regexp = new RegExp(regex);
    const match = input.match(regexp);

    if (!match || match?.length <= 0 || !match.groups) {
        return input;
    }

    let quantity: string | number = match.groups["Quantity"];

    if (quantity.indexOf("/") < 0) {
        quantity = localeParseFloat(quantity, locale);
    }

    const maybeFraction = new Fraction(quantity).mul(multiplier);

    const newValue = useFractionsOverDecimal ? maybeFraction.toFraction(true) : maybeFraction.valueOf().toLocaleString(locale);

    return input.replace(regexp, newValue);
}

export interface AlternativeQuantity {
    quantity: number;
    unit: string;
    unitText: string;
    minQuantity: number;
    maxQuantity: number;
}

export type IngredientDisplay = {
    text: string, quantityValue: number, minQuantity: number, maxQuantity: number,
    quantityText: string, unit: string, unitText: string, ingredient: string,
    alternativeQuantities: AlternativeQuantity[];
}

export type InstructionDisplay = {
    text: string, startTime: Date, timeInSeconds: number, temperature: number, temperatureUnit: string;
}

export function prepareIngredientDisplay(input: string, multiplier: number, useFractionsOverDecimal: boolean, locale: string, highlight: boolean = false): IngredientDisplay {
    multiplier = multiplier > 0 ? multiplier : 1;

    const result = parseIngredient(input, locale, { includeExtra: true, includeAlternativeUnits: true });

    if (!result) {
        return {
            text: input, quantityValue: 0, minQuantity: 0, maxQuantity: 0, quantityText: "", unit: "", unitText: "",
            ingredient: "", alternativeQuantities: []
        };
    }

    let quantity: string | number = result.quantity;

    const maybeFraction = new Fraction(quantity).mul(multiplier);
    const newValue = maybeFraction.valueOf();
    const newMinQuantity = result.minQuantity * multiplier;
    const newMaxQuantity = result.maxQuantity * multiplier;
    const newAlternativeQuantities = result.alternativeQuantities
        .filter(item => item.quantity > 0.1)
        .map(item => {
            return {
                quantity: round(item.quantity * multiplier, 2), unit: item.unit, unitText: item.unitText,
                minQuantity: round(item.minQuantity * multiplier, 2), maxQuantity: round(item.maxQuantity * multiplier, 2)
            };
        });
    let newValueText = result.quantityText;
    if (multiplier != 1 && newValueText != "") {
        newValueText = useFractionsOverDecimal ? maybeFraction.toFraction(true) : maybeFraction.valueOf().toLocaleString(locale);
    }

    let displayText = input;
    const regex = new RegExp(`${result.quantityText}( ?)${result.unitText}`, "i");
    if (highlight) {
        displayText = input.replace(regex, `<span class="text-theme-primary">${newValueText}$1${result.unitText}</span>`);
    } else {
        displayText = input.replace(regex, `${newValueText}$1${result.unitText}`);
    }

    return {
        text: displayText, quantityValue: newValue,
        minQuantity: round(newMinQuantity, 2), maxQuantity: round(newMaxQuantity, 2),
        quantityText: newValueText, unit: result.unit, unitText: result.unitText,
        ingredient: result.ingredient, alternativeQuantities: newAlternativeQuantities
    };
}

export function prepareStepDisplay(input: string, currentTime: Date, locale: string, highlight: boolean = false): InstructionDisplay {
    const result = parseInstruction(input, locale);

    if (!result) {
        return { text: input, startTime: currentTime, timeInSeconds: 0, temperature: 0, temperatureUnit: "" };
    }

    let displayText = input;
    if (highlight && result.temperature > 0) {
        const regexTemp = new RegExp(`${result.temperature}([ |\\w|°]*?)${result.temperatureUnitText}`, "i");
        displayText = displayText.replace(regexTemp, `<span class="text-theme-primary">${result.temperatureText}$1${result.temperatureUnitText}</span>`);
    }

    if (highlight && result.totalTimeInSeconds > 0) {
        for (const timeItem of result.timeItems) {
            const regexTimeItem = new RegExp(`${timeItem.timeText}( ?)${timeItem.timeUnitText}`);
            displayText = displayText.replace(regexTimeItem, `<span class="text-theme-primary">${timeItem.timeText}$1${timeItem.timeUnitText}</span>`);
        }
    }

    return { text: displayText, startTime: new Date(currentTime), timeInSeconds: result.totalTimeInSeconds, temperature: result.temperature, temperatureUnit: result.temperatureUnit };
}

function round(value: number, decimalPlaces = 0) {
    const p = Math.pow(10, decimalPlaces);
    const n = (value * p) * (1 + Number.EPSILON);
    return Math.round(n) / p;
}