// Ah, let's wait for the page to load before doing anything
document.addEventListener('DOMContentLoaded', function () {
    // Getting DOM elements using classes and data-attributes
    const jsonFileInput = document.querySelector('.json-file-input');
    const formContainer = document.querySelector('.form-container');
    const jsonOutput = document.querySelector('.json-output');
    const addItemButton = document.querySelector('.add-item');
    const saveJsonButtons = document.querySelectorAll('.save-json');
    const actionButtons = document.querySelector('.action-buttons');
    const placeholderImage = document.querySelector('.placeholder-image');

    // Item counter. Because counting is important, right?
    let itemCounter = 0;

    // When the JSON file is uploaded, execute the handleFileUpload function
    jsonFileInput.addEventListener('change', handleFileUpload);
    // When the add item button is clicked, clone the last item. Wouldn't it be better to create a new empty item with fillable fields?
    addItemButton.addEventListener('click', cloneLastItem);
    // Save the JSON when clicking the button. How about an 'autosave' button?
    saveJsonButtons.forEach(button => button.addEventListener('click', saveJsonToFile));

    // This function reads the file uploaded by the user
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
                alert('Invalid JSON file. Try again, maybe?');
            }
        };

        reader.readAsText(file);
    }

    // Fills the form with JSON data. Nice, but what if the JSON is too big?
    function populateForm(jsonData) {
        formContainer.innerHTML = '';
        itemCounter = 0;

        jsonData.forEach(item => {
            addField(item);
        });

        updateJsonOutput();
    }

    // Clones the last item. Seems a bit hacky, how about a button to add a new item?
    function cloneLastItem() {
        const lastItem = formContainer.querySelector('.form-section:last-of-type');
        if (lastItem) {
            const clonedItem = {};
            lastItem.querySelectorAll('input[type="text"], input[type="date"]').forEach(input => {
                const key = input.className.split(' ')[0];
                clonedItem[key] = input.value;
            });
            addField(clonedItem);
        } else {
            addField();
        }
    }

    // Adds a new field to the form. Simplify the interface?
    function addField(item = {}) {
        itemCounter++;
        const formSection = document.createElement('div');
        formSection.className = 'form-section p-4 border border-gray-300 rounded relative flex';
        formSection.innerHTML = `
            <div class="media-preview w-1/4 mr-4">
                ${generateMediaPreview(item)}
            </div>
            <div class="w-3/4">
                <h3 class="form-section-title bg-white px-2 text-sm font-semibold">Item ${itemCounter}</h3>
                <button type="button" class="remove-field bg-red-500 text-white p-1 rounded text-xs mt-1">Remove</button>
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

        updateJsonOutput();
    }

    // Generates media preview. Good idea, but be careful with file sizes
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
        return '<div class="text-xs text-gray-500">File missing. Sad, right?</div>';
    }

    // Generates input fields based on data type. Be careful with validations and security
    function generateInputField(key, value, isFirstItem) {
        let inputField = '';

        if (/\.(png|jpg|jpeg|gif|mp3|wav|ogg|mp4|webm)$/i.test(value)) {
            inputField = `
                <input type="text" class="${key} w-full p-1 border border-gray-300 rounded text-xs" value="${value}" />
                <input type="file" class="file-input w-full p-1 border border-gray-300 rounded text-xs mt-1" data-key="${key}" />
            `;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            inputField = `<input type="date" class="${key} w-full p-1 border border-gray-300 rounded text-xs" value="${value}" />`;
        } else {
            inputField = `<input type="text" class="${key} w-full p-1 border border-gray-300 rounded text-xs" value="${value}" />`;
        }

        if (isFirstItem) {
            inputField += `<button type="button" class="remove-field-type bg-red-500 text-white p-1 rounded text-xs ml-2 absolute right-0 top-0" data-key="${key}">X</button>`;
        }

        return inputField;
    }

    // Handles file input change. Pay attention to performance for large files
    function handleFileInputChange(event) {
        const input = event.target;
        const key = input.dataset.key;
        const file = input.files[0];

        if (file) {
            const fileReader = new FileReader();

            fileReader.onload = function (e) {
                const mediaPreview = input.closest('.form-section').querySelector('.media-preview');
                if (file.type.startsWith('image/')) {
                    mediaPreview.innerHTML = `<img src="${e.target.result}" alt="Image Preview" class="w-full h-auto"/>`;
                } else if (file.type.startsWith('audio/')) {
                    mediaPreview.innerHTML = `<audio controls class="w-full"><source src="${e.target.result}" type="${file.type}">Your browser does not support the audio element.</audio>`;
                } else if (file.type.startsWith('video/')) {
                    mediaPreview.innerHTML = `<video controls class="w-full"><source src="${e.target.result}" type="${file.type}">Your browser does not support the video element.</video>`;
                }
                input.previousElementSibling.value = file.name;
                updateJsonOutput();
            };

            fileReader.readAsDataURL(file);
        }
    }

    // Removes a field type from all items. Make sure this is really necessary
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

    // Updates JSON output. Because if it's not in the JSON, it doesn't exist
    function updateJsonOutput() {
        const jsonArray = [];

        formContainer.querySelectorAll('.form-section').forEach(section => {
            const sectionData = {};
            section.querySelectorAll('input').forEach(input => {
                if (input.type !== 'file') {
                    const key = input.className.split(' ')[0];
                    sectionData[key] = input.value;
                }
            });
            jsonArray.push(sectionData);
        });

        jsonOutput.textContent = JSON.stringify(jsonArray, null, 2);
    }

    // Saves the JSON to a file. Because everyone deserves a backup
    function saveJsonToFile() {
        const jsonBlob = new Blob([jsonOutput.textContent], { type: 'application/json' });
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'output.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Debounce function. Because functions don't need to be called all the time
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Event delegation: listen for events on formContainer and delegate to children
    formContainer.addEventListener('click', function (event) {
        if (event.target.classList.contains('remove-field')) {
            event.target.closest('.form-section').remove();
            updateJsonOutput();
        } else if (event.target.classList.contains('remove-field-type')) {
            removeFieldType(event);
        }
    });

    formContainer.addEventListener('input', function (event) {
        if (event.target.matches('input[type="text"], input[type="date"]')) {
            debounce(updateJsonOutput, 300)();
        } else if (event.target.matches('input[type="file"]')) {
            handleFileInputChange(event);
        }
    });

});

/**
 * For more information and to contribute to the improvement of this code,
 * please visit our GitHub repository: https://github.com/rniedson/jsoncrud
 * Feel free to fork the repository, create issues, and submit pull requests.
 */
