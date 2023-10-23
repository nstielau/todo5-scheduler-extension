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

export const ID_PREFIX = "todoist.id=";
export const SUMMARY_PREFIX = '✅ ';
export function stubTaskEvent(startTime, duration, task) {
  const TASK_EVENT_DURATION_MIN = 30;
  const endTime = new Date(startTime);
  endTime.setMinutes(startTime.getMinutes() + duration);

  return {
    summary: SUMMARY_PREFIX + task.content,
    description: task.description + `\n\n\nCreated by todo5-scheduler\n${ID_PREFIX}${task.id}`,
    start: { dateTime: startTime.toISOString()},
    end: { dateTime: endTime.toISOString()},
    visibility: "private",
  };
}

export function findAlreadyScheduledTaskIds(events) {
  return events.filter((e) => e.description && e.description.match(ID_PREFIX))
               .map((e) => e.description.match(`${ID_PREFIX}(.+)`)[0].split(ID_PREFIX)[1]);
}

export function actOnSchedulableTasks(events, tasks, func) {
    console.log("Found events", events);
    const freePeriods = determineFreePeriods(events);
    console.log("Determined free periods", freePeriods);
    const alreadyScheduledTaskIds = findAlreadyScheduledTaskIds(events);
    const unscheduledTasks = tasks.filter((t) => !alreadyScheduledTaskIds.includes(t.id))
    console.log("Found these scheduledTasks IDs", alreadyScheduledTaskIds);
    console.log("Found these unscheduledTasks", unscheduledTasks);
    console.log("Found these appropraite free periods", freePeriods.filter(appropriateFreePeriods))
    freePeriods.filter(appropriateFreePeriods).forEach((period) => {
        var nextTask = unscheduledTasks.shift();
        if (nextTask) {
          func(period, nextTask);
        }
    });
    return undefined;
}