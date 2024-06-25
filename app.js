document.addEventListener('DOMContentLoaded', function () {
    const jsonFileInput = document.getElementById('jsonFileInput');
    const formContainer = document.getElementById('formContainer');
    const jsonOutput = document.getElementById('jsonOutput');
    const addItemButton = document.getElementById('addItem');
    const saveJsonButton = document.getElementById('saveJson');
    const saveJsonOutputButton = document.getElementById('saveJsonOutput');
    const actionButtons = document.getElementById('actionButtons');
    const placeholderImage = document.getElementById('placeholderImage');

    let itemCounter = 0;

    // Event listener for file upload
    jsonFileInput.addEventListener('change', handleFileUpload);

    // Event listener for adding a new item
    addItemButton.addEventListener('click', () => addField(createEmptyItem()));

    // Event listener for saving JSON to file
    saveJsonButton.addEventListener('click', saveJsonToFile);
    saveJsonOutputButton.addEventListener('click', saveJsonToFile);

    // Handle file upload and parse JSON
    function handleFileUpload(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                populateForm(jsonData);
                actionButtons.classList.remove('hidden');
                placeholderImage.style.display = 'none';
            } catch (error) {
                alert('Invalid JSON file');
            }
        };

        reader.readAsText(file);
    }

    // Populate form with JSON data
    function populateForm(jsonData) {
        formContainer.innerHTML = '';
        itemCounter = 0;

        jsonData.forEach(item => {
            addField(item);
        });

        updateJsonOutput();
    }

    // Create an empty item based on the structure of the last item
    function createEmptyItem() {
        const lastItem = formContainer.querySelector('.formSection:last-of-type');
        const emptyItem = {};
        if (lastItem) {
            lastItem.querySelectorAll('input').forEach(input => {
                const key = input.className.split(' ')[0];
                emptyItem[key] = '';
            });
        }
        return emptyItem;
    }

    // Add a new field section to the form
    function addField(item = {}) {
        itemCounter++;
        const formSection = document.createElement('div');
        formSection.className = 'formSection p-4 border border-gray-300 rounded relative flex';
        formSection.innerHTML = `
            <div class="mediaPreview w-1/4 mr-4">
                ${generateMediaPreview(item)}
            </div>
            <div class="w-3/4">
                <h3 class="formSectionTitle bg-white px-2 text-sm font-semibold">Item ${itemCounter}</h3>
                <button type="button" class="removeField bg-red-500 text-white p-1 rounded text-xs mt-1">Remove</button>
                <div class="grid grid-cols-2 gap-4 mt-2">
                    ${Object.keys(item).map(key => `
                        <div class="relative">
                            <label class="block text-xs text-gray-700">${key}</label>
                            ${generateInputField(key, item[key], itemCounter === 1)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        formContainer.appendChild(formSection);

        // Event listener for removing the field section
        formSection.querySelector('.removeField').addEventListener('click', () => {
            formSection.remove();
            updateJsonOutput();
        });

        // Event listener for updating JSON output when input changes
        formSection.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', debounce(updateJsonOutput, 300));
        });

        updateJsonOutput();
    }

    // Generate media preview for images, audio, and video
    function generateMediaPreview(item) {
        const mediaKeys = Object.keys(item).filter(key => /\.(png|jpg|jpeg|gif|mp3|wav|ogg|mp4|webm)$/i.test(item[key]));
        if (mediaKeys.length > 0) {
            const mediaSrc = item[mediaKeys[0]];
            const extension = mediaSrc.split('.').pop().toLowerCase();
            if (['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
                return `<img src="${mediaSrc}" alt="Image Preview" class="w-full h-auto"/>`;
            } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
                return `<audio controls class="w-full"><source src="${mediaSrc}" type="audio/${extension}">Your browser does not support the audio element.</audio>`;
            } else if (['mp4', 'webm'].includes(extension)) {
                return `<video controls class="w-full"><source src="${mediaSrc}" type="video/${extension}">Your browser does not support the video element.</video>`;
            }
        }
        return '<div class="text-xs text-gray-500">Arquivo ausente</div>';
    }

    // Generate input field based on the type of data
    function generateInputField(key, value, isFirstItem) {
        let inputField = '';

        if (/\.(png|jpg|jpeg|gif|mp3|wav|ogg|mp4|webm)$/i.test(value)) {
            inputField = `<input type="file" class="${key} w-full p-1 border border-gray-300 rounded text-xs" data-type="file" />`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            inputField = `<input type="date" class="${key} w-full p-1 border border-gray-300 rounded text-xs" value="${value}" />`;
        } else {
            inputField = `<input type="text" class="${key} w-full p-1 border border-gray-300 rounded text-xs" value="${value}" />`;
        }

        if (isFirstItem) {
            inputField += `<button type="button" class="removeFieldType bg-red-500 text-white p-1 rounded text-xs ml-2 absolute right-0 top-0" data-key="${key}">X</button>`;
        }

        return inputField;
    }

    // Event listener to remove a field type from all items
    function removeFieldType(event) {
        const keyToRemove = event.target.dataset.key;
        document.querySelectorAll(`.${keyToRemove}`).forEach(input => {
            const parentDiv = input.parentElement.parentElement;
            input.parentElement.remove();
            if (parentDiv.childElementCount === 0) {
                parentDiv.parentElement.remove();
            }
        });
        updateJsonOutput();
    }

    // Update JSON output
    function updateJsonOutput() {
        const jsonArray = [];

        formContainer.querySelectorAll('.formSection').forEach(section => {
            const sectionData = {};
            section.querySelectorAll('input').forEach(input => {
                const key = input.className.split(' ')[0];
                if (input.dataset.type === 'file') {
                    sectionData[key] = input.files[0] ? input.files[0].name : '';
                } else {
                    sectionData[key] = input.value;
                }
            });
            jsonArray.push(sectionData);
        });

        jsonOutput.textContent = JSON.stringify(jsonArray, null, 2);
    }

    // Save JSON to file
    function saveJsonToFile() {
        const jsonBlob = new Blob([jsonOutput.textContent], { type: 'application/json' });
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'output.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Debounce function to limit the rate of function calls
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Attach event listener for removing field type buttons
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('removeFieldType')) {
            removeFieldType(event);
        }
    });
});

/**
 * For more information and to contribute to the improvement of this code,
 * please visit our GitHub repository: [GitHub Repository URL]
 * Feel free to fork the repository, create issues, and submit pull requests.
 */


/**
 * For more information and to contribute to the improvement of this code,
 * please visit our GitHub repository: https://github.com/rniedson/jsoncrud
 * Feel free to fork the repository, create issues, and submit pull requests.
 */
