/**
 * Copyright (c) 2024 Nick Stielau
 * Licensed under the MIT License
 */

document.addEventListener('DOMContentLoaded', function () {
    const apiKeyInput = document.getElementById('apiKey');
    const intervalInput = document.getElementById('interval');
    const saveButton = document.getElementById('save');

    // Load the saved interval
    chrome.storage.sync.get(['SCHEDULER_INTERVAL'], function (result) {
        if (result.SCHEDULER_INTERVAL) {
            intervalInput.value = result.SCHEDULER_INTERVAL;
        } else {
            intervalInput.value = "60";
        }
    });

    // Load the saved API key
    chrome.storage.sync.get(['TODOIST_API_KEY'], function (result) {
        if (result.TODOIST_API_KEY) {
            apiKeyInput.value = result.TODOIST_API_KEY;
        }
    });

    // Save the settings
    saveButton.addEventListener('click', function () {
        const apiKey = apiKeyInput.value;
        const interval = parseInt(intervalInput.value, 10);
        chrome.storage.sync.set({
            'TODOIST_API_KEY': apiKey,
            'SCHEDULER_INTERVAL': interval }, function () {
            alert('Settings saved!');
        });
    });
});
