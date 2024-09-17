document.addEventListener('DOMContentLoaded', function () {
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('save');

    // Load the saved API key
    chrome.storage.sync.get(['TODOIST_API_KEY'], function (result) {
        if (result.TODOIST_API_KEY) {
            apiKeyInput.value = result.TODOIST_API_KEY;
        }
    });

    // Save the API key
    saveButton.addEventListener('click', function () {
        const apiKey = apiKeyInput.value;
        chrome.storage.sync.set({ 'TODOIST_API_KEY': apiKey }, function () {
            alert('API Key saved!');
        });
    });
});
