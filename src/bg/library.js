/**
 * Determines if a given period is appropriate based on duration, day, and time.
 *
 * @param {Object} period - The period to evaluate.
 * @param {string} period.start - The start time of the period.
 * @param {string} period.end - The end time of the period.
 * @returns {boolean} - Returns true if the period is appropriate, otherwise false.
 */
export function appropriateFreePeriods(period) {
    // console.debug("Evaluating", period, new Date(period.start))
    if ((new Date(period.end) - new Date(period.start)) / 1000 / 60.0 < 30) {
        // console.debug("Skipping, due to duration", period);
        return false;
    }
    if (new Date(period.start).getDay() === 0 || new Date(period.start).getDay() === 6) {
        // console.debug("Skipping due to weekend", period);
        return false;
    }
    if (new Date(period.start).getHours() < 9 || new Date(period.start).getHours() > 14) {
        // console.debug("Skipping, due to off hours", period);
        return false;
    }
    return true;
}

// Determine Free Periods
/**
 * Determines free periods between scheduled events.
 *
 * @param {Array} events - List of events with start and end times.
 * @returns {Array} - Returns an array of free periods.
 */
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
/**
 * Creates a stub event for a task with a specified duration.
 *
 * @param {Date} startTime - The start time of the task.
 * @param {number} duration - The duration of the task in minutes.
 * @param {Object} task - The task object containing content and description.
 * @returns {Object} - Returns a stub event object.
 */
export function stubTaskEvent(startTime, duration, task) {
  const TASK_EVENT_DURATION_MIN = 30;
  const endTime = new Date(startTime);
  endTime.setMinutes(startTime.getMinutes() + duration);

  return {
    summary: SUMMARY_PREFIX + task.content,
    description: `${task.description}\n\n\nCreated by todo5-scheduler\n${ID_PREFIX}${task.id}`,
    start: { dateTime: startTime.toISOString()},
    end: { dateTime: endTime.toISOString()},
    visibility: "private",
  };
}

/**
 * Finds task IDs that have already been scheduled.
 *
 * @param {Array} events - List of events to search through.
 * @returns {Array} - Returns an array of scheduled task IDs.
 */
export function findAlreadyScheduledTaskIds(events) {
  return events.filter((e) => e.description && e.description.match(ID_PREFIX))
               .map((e) => e.description.match(`${ID_PREFIX}(.+)`)[0].split(ID_PREFIX)[1]);
}

/**
 * Acts on tasks that can be scheduled within free periods.
 *
 * @param {Array} events - List of current events.
 * @param {Array} tasks - List of tasks to schedule.
 * @param {Function} func - Function to execute for each schedulable task.
 */
export function actOnSchedulableTasks(events, tasks, func) {
    console.debug("Found events", events);
    const freePeriods = determineFreePeriods(events);
    console.debug("Determined free periods", freePeriods);
    const alreadyScheduledTaskIds = findAlreadyScheduledTaskIds(events);
    const unscheduledTasks = tasks.filter((t) => !alreadyScheduledTaskIds.includes(t.id))
    console.debug("Found these scheduledTasks IDs", alreadyScheduledTaskIds);
    console.debug("Found these unscheduledTasks", unscheduledTasks);
    const appropriatePeriods = freePeriods.filter(appropriateFreePeriods);
    console.debug("Found these appropriate free periods", appropriatePeriods);
    appropriatePeriods.forEach((period) => {
        let nextTask = unscheduledTasks.shift();
        if (nextTask) {
          func(period, nextTask);
        }
    });
    return undefined;
}
