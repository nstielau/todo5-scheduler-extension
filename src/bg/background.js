/**
 * Copyright (c) 2024 Nick Stielau
 * Licensed under the MIT License
 */

console.log("Initiating Todo5 Scheduler Extension Service Worker");

import { stubTaskEvent, actOnSchedulableTasks } from './library.js';

/**
 * Keeps the service worker alive by periodically calling a Chrome API
 * See https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension
 */
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();


function runScheduler() {
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
}

// Function to create a 30-minute calendar event
/**
 * Creates a 30-minute calendar event for a given task.
 *
 * @param {Date} startTime - The start time for the event.
 * @param {Object} task - The task object containing content and description.
 */
const createCalendarEventForTask = (startTime, task) => {

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


/**
 * Retrieves calendar events using the Google Calendar API.
 *
 * @param {string} token - OAuth token for authentication.
 * @returns {Promise<Object>} - Returns a promise that resolves to the calendar events.
 */
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


// Function to fetch Todoist tasks
/**
 * Fetches tasks from the Todoist API.
 *
 * @param {string} todoistApiKey - API key for Todoist authentication.
 * @returns {Promise<Array|null>} - Returns a promise that resolves to an array of tasks or null if an error occurs.
 */
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


// Run the scheduler immediately and then every hour
runScheduler();
setInterval(runScheduler, 60 * 60 * 1000);