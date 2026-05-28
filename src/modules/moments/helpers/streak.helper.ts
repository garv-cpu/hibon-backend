import { daysBetweenCalendarDates } from "./date.helper.js";

export const calculateStreak = (
    lastMomentDate: Date | null,
    currentStreak: number,
    timeZone = "UTC"
) => {
    if (!lastMomentDate) {
        return 1;
    }

    const days =
        daysBetweenCalendarDates(
            lastMomentDate,
            new Date(),
            timeZone
        );

    if (days === 1) {
        return currentStreak + 1;
    }

    if (days > 1) {
        return 1;
    }

    return currentStreak;
};
