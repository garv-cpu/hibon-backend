export const isSameDay = (
    date1: Date,
    date2: Date,
    timeZone = "UTC"
) => {
    return getDateKey(date1, timeZone) ===
        getDateKey(date2, timeZone);
};

export const getDateKey = (
    date: Date,
    timeZone = "UTC"
) => {
    try {
        return new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(date);
    } catch {
        return new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: "UTC",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(date);
    }
};

export const daysBetweenCalendarDates = (
    olderDate: Date,
    newerDate: Date,
    timeZone = "UTC"
) => {
    const olderParts =
        getDateParts(olderDate, timeZone);
    const newerParts =
        getDateParts(newerDate, timeZone);

    const olderUtc =
        Date.UTC(
            olderParts.year,
            olderParts.month - 1,
            olderParts.day
        );
    const newerUtc =
        Date.UTC(
            newerParts.year,
            newerParts.month - 1,
            newerParts.day
        );

    return Math.floor(
        (newerUtc - olderUtc) /
            (1000 * 60 * 60 * 24)
    );
};

const getDateParts = (
    date: Date,
    timeZone: string
) => {
    let parts: Intl.DateTimeFormatPart[];

    try {
        parts =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    timeZone,
                    year: "numeric",
                    month: "numeric",
                    day: "numeric"
                }
            ).formatToParts(date);
    } catch {
        parts =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    timeZone: "UTC",
                    year: "numeric",
                    month: "numeric",
                    day: "numeric"
                }
            ).formatToParts(date);
    }

    return {
        year: Number(
            parts.find(
                (part) => part.type === "year"
            )?.value
        ),
        month: Number(
            parts.find(
                (part) => part.type === "month"
            )?.value
        ),
        day: Number(
            parts.find(
                (part) => part.type === "day"
            )?.value
        )
    };
};
