let currentMood = '';
let existingRecipes = [];

// Toast notification system
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Add appropriate icon based on type
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = type === 'success' ? '✓' : '✕';
    
    // Add message
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(messageSpan);
    toastContainer.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in-out forwards';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 5000);
}

// Constants for contrast calculation
const RED = 0.2126;
const GREEN = 0.7152;
const BLUE = 0.0722;
const GAMMA = 2.4;

// Function to calculate luminance
function luminance(r, g, b) {
    var a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928
            ? v / 12.92
            : Math.pow((v + 0.055) / 1.055, GAMMA);
    });
    return a[0] * RED + a[1] * GREEN + a[2] * BLUE;
}

// Function to calculate contrast ratio
function contrast(rgb1, rgb2) {
    var lum1 = luminance(...rgb1);
    var lum2 = luminance(...rgb2);
    var brightest = Math.max(lum1, lum2);
    var darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

// Function to generate random color with good contrast
function getRandomColor() {
    let r, g, b;
    let contrastRatio;
    const white = [255, 255, 255];
    
    do {
        r = Math.floor(Math.random() * 256);
        g = Math.floor(Math.random() * 256);
        b = Math.floor(Math.random() * 256);
        contrastRatio = contrast([r, g, b], white);
    } while (contrastRatio < 4.5); // WCAG AA standard for normal text
    
    return `rgb(${r}, ${g}, ${b})`;
}

// Function to generate random emoji
// function getRandomEmoji() {
//     // Emoji range: 0x1F300 to 0x1F9FF
//     const emojiCode = Math.floor(Math.random() * (0x1F9FF - 0x1F300 + 1)) + 0x1F300;
//     return String.fromCodePoint(emojiCode);
// }
function getRandomEmoji() {
    const emojiRanges = [
    [0x1F600, 0x1F64F] // Smileys & Emotion
    // [0x1F300, 0x1F5FF], // Miscellaneous Symbols & Pictographs
    // [0x1F680, 0x1F6FF], // Transport & Map Symbols
    // [0x1F900, 0x1F9FF], // Supplemental Symbols & Pictographs
    ];

    // Pick a random range
    const range = emojiRanges[Math.floor(Math.random() * emojiRanges.length)];
    
    // Pick a random code point within the selected range
    const emojiCode = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    
    return String.fromCodePoint(emojiCode);
}

// Function to create a mood button
function createMoodButton(mood) {
    const button = document.createElement('button');
    button.onclick = () => getRecipe(mood);
    
    // Generate random color and emoji
    const bgColor = getRandomColor();
    const emoji = getRandomEmoji();
    
    // Apply styles with random background color
    button.className = 'mood-btn text-white p-6 rounded-lg shadow-lg';
    button.style.backgroundColor = bgColor;
    button.style.transition = 'transform 0.2s, background-color 0.2s';
    
    button.textContent = `${emoji} ${mood.charAt(0).toUpperCase() + mood.slice(1)}`;
    return button;
}

// Function to load and display moods
async function loadMoods() {
    try {
        const response = await fetch('/api/moods');
        const moods = await response.json();
        const moodGrid = document.getElementById('mood-grid');
        moodGrid.innerHTML = ''; // Clear existing buttons
        moods.forEach(mood => {
            moodGrid.appendChild(createMoodButton(mood));
        });
    } catch (error) {
        console.error('Error loading moods:', error);
    }
}

// Load moods when page loads
document.addEventListener('DOMContentLoaded', loadMoods);

async function getRecipe(mood) {
    currentMood = mood;
    try {
        const response = await fetch(`/api/recipe/${mood}`);
        const recipe = await response.json();
        
        if (recipe.error) {
            showToast('No recipe found for this mood. Try another mood!', 'error');
            return;
        }

        displayRecipe(recipe);
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to fetch recipe. Please try again.', 'error');
    }
}

function getNewRecipe() {
    getRecipe(currentMood);
}

function displayRecipe(recipe) {
    document.getElementById('recipe-container').classList.remove('hidden');
    document.getElementById('recipe-name').textContent = recipe.name;
    document.getElementById('recipe-description').textContent = recipe.description;
    document.getElementById('recipe-ingredients').textContent = recipe.ingredients;
    document.getElementById('recipe-instructions').textContent = recipe.instructions;
}

// Modal functions
function openAddMoodModal() {
    document.getElementById('addMoodModal').style.display = 'block';
    loadExistingRecipes();
    setupMoodCheck();
}

function closeAddMoodModal() {
    document.getElementById('addMoodModal').style.display = 'none';
    resetForm();
}

function resetForm() {
    document.getElementById('newMood').value = '';
    document.getElementById('moodExistsWarning').classList.add('hidden');
    document.getElementById('recipeName').value = '';
    document.getElementById('recipeDescription').value = '';
    document.getElementById('recipeIngredients').value = '';
    document.getElementById('recipeInstructions').value = '';
    document.getElementById('existingRecipe').value = '';
    document.querySelector('input[name="recipeType"][value="new"]').checked = true;
    document.querySelector('input[name="addType"][value="new"]').checked = true;
    toggleRecipeForm();
}

function toggleRecipeForm() {
    const isNewRecipe = document.querySelector('input[name="recipeType"][value="new"]').checked;
    document.getElementById('newRecipeForm').classList.toggle('hidden', !isNewRecipe);
    document.getElementById('existingRecipeForm').classList.toggle('hidden', isNewRecipe);
}

// This async function loads all existing recipes from the server and populates a dropdown menu
// 1. Makes a GET request to /api/recipes to fetch all recipes from the database
// 2. Stores the recipes in the existingRecipes variable for later use
// 3. Gets the select element with id 'existingRecipe'
// 4. Clears the select and adds a default "Select a recipe..." option
// 5. For each recipe in the response:
//    - Creates a new option element
//    - Sets its value to the recipe ID
//    - Sets its text to the recipe name
//    - Adds it to the select dropdown
// If there's an error fetching recipes, it logs to the console
async function loadExistingRecipes() {
    try {
        const response = await fetch('/api/recipes');
        existingRecipes = await response.json();
        const select = document.getElementById('existingRecipe');
        select.innerHTML = '<option value="">Select a recipe...</option>';
        existingRecipes.forEach(recipe => {
            const option = document.createElement('option');
            option.value = recipe.id;
            option.textContent = recipe.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading recipes:', error);
    }
}

function loadExistingRecipe() {
    const recipeId = document.getElementById('existingRecipe').value;
    if (!recipeId) return;

    const recipe = existingRecipes.find(r => r.id === parseInt(recipeId));
    if (recipe) {
        document.getElementById('recipeName').value = recipe.name;
        document.getElementById('recipeDescription').value = recipe.description;
        document.getElementById('recipeIngredients').value = recipe.ingredients;
        document.getElementById('recipeInstructions').value = recipe.instructions;
    }
}

function setupMoodCheck() {
    const moodInput = document.getElementById('newMood');
    let timeout = null;

    moodInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            const mood = moodInput.value.trim();
            if (mood) {
                try {
                    const response = await fetch(`/api/check-mood/${encodeURIComponent(mood)}`);
                    const data = await response.json();
                    const warning = document.getElementById('moodExistsWarning');
                    if (data.exists) {
                        warning.textContent = `Mood "${data.existingMood}" already exists`;
                        warning.classList.remove('hidden');
                    } else {
                        warning.classList.add('hidden');
                    }
                } catch (error) {
                    console.error('Error checking mood:', error);
                }
            }
        }, 500);
    });
}

async function submitNewMood() {
    const newMood = document.getElementById('newMood').value.trim();
    const isNewRecipe = document.querySelector('input[name="recipeType"][value="new"]').checked;
    const addType = document.querySelector('input[name="addType"][value="new"]').checked ? 'new' : 'replace';

    if (!newMood) {
        showToast('Please enter a mood name', 'error');
        return;
    }

    const recipeData = {
        name: document.getElementById('recipeName').value.trim(),
        description: document.getElementById('recipeDescription').value.trim(),
        ingredients: document.getElementById('recipeIngredients').value.trim(),
        instructions: document.getElementById('recipeInstructions').value.trim()
    };

    if (!isNewRecipe) {
        const recipeId = document.getElementById('existingRecipe').value;
        if (!recipeId) {
            showToast('Please select an existing recipe', 'error');
            return;
        }
        recipeData.id = parseInt(recipeId);
    }

    try {
        const response = await fetch('/api/add-mood', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mood: newMood,
                isNewRecipe,
                addType,
                recipe: recipeData
            })
        });

        const result = await response.json();
        if (result.error) {
            showToast(result.error, 'error');
            return;
        }

        showToast('Mood and recipe added successfully!', 'success');
        closeAddMoodModal();
        loadMoods();
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to add mood and recipe. Please try again.', 'error');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addMoodModal');
    if (event.target === modal) {
        closeAddMoodModal();
    }
}