console.log("Initiating Todo5 Scheduler Extension Service Worker")

// Request an OAuth 2.0 token
chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
    }

    chrome.storage.sync.get(['TODOIST_API_KEY'], (result) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      fetchTodoistTasks(result.TODOIST_API_KEY)
        .then((tasks) => {
          if (tasks) {
            console.log('Todoist tasks:', tasks);
            getCalendarEvents(token).then((response) => {
                const events = response.items;
                console.log("Found events", events);
                const freePeriods = determineFreePeriods(events);
                console.log("Determined free periods", freePeriods);
                const alreadyScheduledTaskIds = events.filter((e) => e.description && e.description.match("id="))
                                                      .map((e) => e.description.match("id=(.+)")[0].split('=')[1]);
                const unscheduledTasks = tasks.filter((t) => !alreadyScheduledTaskIds.includes(t.id))
                console.log("Found these scheduledTasks", alreadyScheduledTaskIds);
                console.log("Found these unscheduledTasks", unscheduledTasks);
                freePeriods.filter(appropriateFreePeriods).forEach((period) => {
                    var nextTask = tasks.shift();
                    if (nextTask) {
                        console.log("Creating event at ", new Date(period.start), period, nextTask.content);
                        createCalendarEventForTask(new Date(period.start), nextTask, nextTask);
                    }
                });
            }).catch((error) => {
                console.error('Error fetching calendar events:', error);
            });
          }
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    });
});


function appropriateFreePeriods(period) {
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
function determineFreePeriods(events) {
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

// Function to create a 30-minute calendar event
function createCalendarEventForTask(startTime, task) {
  const TASK_EVENT_DURATION_MIN = 30;
  const endTime = new Date(startTime);
  endTime.setMinutes(startTime.getMinutes() + TASK_EVENT_DURATION_MIN);

  // Request OAuth token using chrome.identity
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    // Make sure the user is authenticated
    if (!token) {
      console.error('Authentication failed.');
      return;
    }

    // Define the event details
    const event = {
      summary: '✅ ' + task.content,
      description: task.description + "\n\n\nCreated by todo5-scheduler\nid=" + task.id,
      start: { dateTime: startTime.toISOString()},
      end: { dateTime: endTime.toISOString()},
      visibility: "private",
    };

    // Use the OAuth token to authorize the Google Calendar API request
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Event creation failed.');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Event created:', data);
      })
      .catch((error) => {
        console.error('Error creating event:', error);
      });
  });
}


function getCalendarEvents(token) {
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
    const params = new URLSearchParams({
      singleEvents: "True",
      orderBy: "startTime",
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 2*24*60*60*1000).toISOString()
    });
    // Make the API request to retrieve events
    return fetch(`${baseUrl}?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then((response) => response.json())
}


// chrome.storage.sync.set({ 'TODOIST_API_KEY': 'asdfasdfas' }, () => {
//   if (chrome.runtime.lastError) {
//     console.error(chrome.runtime.lastError);
//     return;
//   }
//   console.log('Setting saved');
// });





// Function to fetch Todoist tasks
async function fetchTodoistTasks(todoistApiKey) {
  try {
    // Make a GET request to Todoist API
    const response = await fetch('https://api.todoist.com/rest/v2/tasks?filter=today|overdue', {
      method: 'GET',
      mode: "cors",
      headers: {
        'Authorization': 'Bearer ' + todoistApiKey,
        'Content-Type': 'application/json'
      },
    });

    // Check if the response is successful (status code 200)
    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      console.error('Failed to fetch Todoist tasks. Status code:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching Todoist tasks:', error);
    return null;
  }
}

