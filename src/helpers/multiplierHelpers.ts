import Fraction from "fraction.js";

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