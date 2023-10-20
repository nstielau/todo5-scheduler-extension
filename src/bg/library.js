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

// Determine Free Periods
export function determineFreePeriods(events) {
  // Sort events by start time
  const sortedEvents = events.sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));
  const freePeriods = [];

  // Initialize the previous end time as the start time of the specified range
  let previousEndTime = new Date().toISOString();

  for (const event of sortedEvents) {
    const eventStartTime = new Date(event.start.dateTime).toISOString();
    const eventEndTime = new Date(event.end.dateTime).toISOString();

    if (eventStartTime > previousEndTime) {
      // Gap between events is a free period
      freePeriods.push({
        start: previousEndTime,
        end: eventStartTime,
      });
    }

    previousEndTime = eventEndTime;
  }

  // Check for any remaining free time after the last event
  const endTime = new Date(Date.now() + 60*60*24*1000).toISOString();
  if (endTime > previousEndTime) {
    freePeriods.push({
      start: previousEndTime,
      end: endTime,
    });
  }

  return freePeriods;
}