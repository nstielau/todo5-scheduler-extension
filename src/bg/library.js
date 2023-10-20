export function appropriateFreePeriods(period) {
    // console.log("Evaluating", period, new Date(period.start))
    if ((new Date(period.end) - new Date(period.start)) / 1000 / 60.0 < 30) {
        // console.log("Skipping, due to duration", period);
        return false;
    }
    if (new Date(period.start).getDay() == 0 || new Date(period.start).getDay() == 6) {
        // console.log("Skipping due to weekend", period);
        return false;
    }
    if (new Date(period.start).getHours() < 9 || new Date(period.start).getHours() > 14) {
        // console.log("Skipping, due to off hours", period);
        return false;
    }
    return true;
}