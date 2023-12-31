console.log("Initiating Todo5 Scheduler Extension Service Worker");

import { stubTaskEvent, actOnSchedulableTasks } from './library.js';

// Request an OAuth 2.0 token
chrome.identity.getAuthToken({ interactive: true }, (gcalOauthToken) => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    return;
  }

  chrome.storage.sync.get(['TODOIST_API_KEY'], (result) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    fetchTodoistTasks(result.TODOIST_API_KEY).then((tasks) => {
      console.log('Todoist tasks:', tasks);
      getCalendarEvents(gcalOauthToken).then((response) => {
        actOnSchedulableTasks(response.items, tasks, function(period, task){
            console.log("Creating event at ", new Date(period.start), period, task.content);
            createCalendarEventForTask(new Date(period.start), task);
        });
      }).catch((error) => {
        console.error('Error fetching calendar events:', error);
      });
    }).catch((error) => {
      console.error('Error fetching todoist tasks:', error);
    });
  });
});

// Function to create a 30-minute calendar event
function createCalendarEventForTask(startTime, task) {

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

    // Use the OAuth token to authorize the Google Calendar API request
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stubTaskEvent(startTime, 30, task)),
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Error creating event", response);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Event created:', data);
      })
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
  return fetch(`${baseUrl}?${params.toString()}`, {
          headers: {'Authorization': `Bearer ${token}`}
      }).then((response) => response.json())
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

