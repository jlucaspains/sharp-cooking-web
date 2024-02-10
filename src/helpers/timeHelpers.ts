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

export function secondsToString(totalSeconds: number, t: (input: string) => string) {
    const days = Math.floor((totalSeconds % 31536000) / 86400);
    const hours = Math.floor(((totalSeconds % 31536000) % 86400) / 3600);
    const minutes = Math.floor((((totalSeconds % 31536000) % 86400) % 3600) / 60);
    const seconds = (((totalSeconds % 31536000) % 86400) % 3600) % 60;
  
    let result = "";
    if (days > 0) {
      result += `${days} ${t("general.days")} `;
    }
    if (hours > 0) {
      result += `${hours} ${t("general.hours")} `;
    }
    if (minutes > 0) {
      result += `${minutes} ${t("general.minutes")} `;
    }
    if (seconds > 0) {
      result += `${seconds} ${t("general.seconds")}`;
    }
  
    return result || "0";
  }