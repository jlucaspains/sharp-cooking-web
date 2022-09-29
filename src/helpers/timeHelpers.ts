export function getImpliedTimeFromString(input: string, timeIdentifierRegex: string | RegExp) {
    const match = input.match(timeIdentifierRegex)

    if (!match || match?.length <= 0 || !match.groups)
        return 0;

    const minutes = parseInt(match.groups["Minutes"] ?? "0");
    const hours = parseInt(match.groups["Hours"] ?? "0");
    const days = parseInt(match.groups["Days"] ?? "0");

    return (minutes * 60 * 1000)
        + (hours * 60 * 60 * 1000)
        + (days * 24 * 60 * 60 * 1000);
}