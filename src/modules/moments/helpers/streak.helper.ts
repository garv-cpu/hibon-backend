export const calculateStreak = (
    lastMomentDate: Date | null,
    currentStreak: number
) => {
    if (!lastMomentDate) {
        return 1;
    }

    const now = new Date();

    const diff =
        now.getTime() -
        lastMomentDate.getTime();

    const days =
        Math.floor(
            diff / (1000 * 60 * 60 * 24)
        );

    if (days === 1) {
        return currentStreak + 1;
    }

    if (days > 1) {
        return 1;
    }

    return currentStreak;
};