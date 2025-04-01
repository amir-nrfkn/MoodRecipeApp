const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('recipes.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the recipes database.');
});

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        mood TEXT NOT NULL,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL
    )`);

    // Insert some sample data if the table is empty
    db.get("SELECT COUNT(*) as count FROM recipes", (err, row) => {
        if (err) {
            console.error(err);
            return;
        }
        
        if (row.count === 0) {
            const sampleRecipes = [
                {
                    name: "Comforting Mac and Cheese",
                    description: "A warm, creamy comfort food perfect for when you're feeling down",
                    mood: "sad",
                    ingredients: "Macaroni, Cheddar cheese, Milk, Butter, Flour, Salt, Pepper",
                    instructions: "1. Cook macaroni\n2. Make cheese sauce\n3. Combine and bake"
                },
                {
                    name: "Warm Chocolate Chip Cookies",
                    description: "Fresh-baked cookies that feel like a hug from the inside",
                    mood: "sad",
                    ingredients: "Flour, Butter, Brown sugar, White sugar, Eggs, Vanilla, Chocolate chips",
                    instructions: "1. Cream butter and sugars\n2. Add wet ingredients\n3. Mix in dry ingredients\n4. Bake until golden"
                },
                {
                    name: "Creamy Tomato Soup",
                    description: "A soothing bowl of warmth for gloomy days",
                    mood: "sad",
                    ingredients: "Tomatoes, Heavy cream, Onion, Garlic, Vegetable broth, Basil, Salt, Pepper",
                    instructions: "1. Sauté onions and garlic\n2. Add tomatoes and broth\n3. Blend and add cream\n4. Simmer until ready"
                },
                {
                    name: "Energizing Smoothie Bowl",
                    description: "A vibrant and nutritious bowl to boost your mood",
                    mood: "happy",
                    ingredients: "Frozen berries, Banana, Greek yogurt, Honey, Granola, Chia seeds",
                    instructions: "1. Blend fruits\n2. Top with granola and seeds"
                },
                {
                    name: "Rainbow Buddha Bowl",
                    description: "A colorful, healthy bowl that makes you smile",
                    mood: "happy",
                    ingredients: "Quinoa, Roasted chickpeas, Avocado, Cherry tomatoes, Kale, Sweet potato, Tahini dressing",
                    instructions: "1. Cook quinoa\n2. Roast chickpeas and sweet potato\n3. Assemble bowl\n4. Drizzle with dressing"
                },
                {
                    name: "Fruit-Topped Pancakes",
                    description: "Fluffy pancakes topped with fresh fruits to start the day right",
                    mood: "happy",
                    ingredients: "Flour, Milk, Eggs, Baking powder, Sugar, Fresh berries, Maple syrup",
                    instructions: "1. Mix batter\n2. Cook pancakes\n3. Top with fresh fruits\n4. Drizzle with syrup"
                },
                {
                    name: "Spicy Chicken Tacos",
                    description: "Exciting and flavorful tacos to spice up your day",
                    mood: "excited",
                    ingredients: "Chicken, Taco seasoning, Tortillas, Lettuce, Cheese, Hot sauce",
                    instructions: "1. Cook seasoned chicken\n2. Assemble tacos with toppings"
                },
                {
                    name: "Sizzling Fajita Platter",
                    description: "A dramatic, steaming platter that brings excitement to the table",
                    mood: "excited",
                    ingredients: "Steak, Bell peppers, Onions, Fajita seasoning, Lime, Tortillas, Guacamole",
                    instructions: "1. Marinate steak\n2. Sauté vegetables\n3. Cook steak\n4. Serve sizzling hot"
                },
                {
                    name: "Spicy Korean Bibimbap",
                    description: "A bowl of vibrant colors and exciting flavors",
                    mood: "excited",
                    ingredients: "Rice, Ground beef, Carrots, Spinach, Bean sprouts, Gochujang sauce, Fried egg",
                    instructions: "1. Cook rice\n2. Prepare vegetables\n3. Cook beef\n4. Assemble with sauce and egg"
                }
            ];

            const stmt = db.prepare("INSERT INTO recipes (name, description, mood, ingredients, instructions) VALUES (?, ?, ?, ?, ?)");
            sampleRecipes.forEach(recipe => {
                stmt.run(recipe.name, recipe.description, recipe.mood, recipe.ingredients, recipe.instructions);
            });
            stmt.finalize();
        }
    });
});

// Helper function to sanitize input
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[<>]/g, '');
}

// API Endpoints
app.get('/api/recipe/:mood', (req, res) => {
    const mood = sanitizeInput(req.params.mood);
    db.all("SELECT * FROM recipes WHERE LOWER(mood) = LOWER(?) ORDER BY RANDOM() LIMIT 1", [mood], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows[0] || { error: "No recipe found for this mood" });
    });
});

// Get all unique moods
app.get('/api/moods', (req, res) => {
    db.all("SELECT DISTINCT mood FROM recipes ORDER BY mood", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(row => row.mood));
    });
});

// Get all recipes
app.get('/api/recipes', (req, res) => {
    db.all("SELECT * FROM recipes", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Check if mood exists
app.get('/api/check-mood/:mood', (req, res) => {
    const mood = sanitizeInput(req.params.mood);
    db.get("SELECT mood FROM recipes WHERE LOWER(mood) = LOWER(?) LIMIT 1", [mood], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            exists: !!row,
            existingMood: row ? row.mood : null
        });
    });
});

// Add new mood and recipe
app.post('/api/add-mood', (req, res) => {
    const { mood, isNewRecipe, addType, recipe } = req.body;
    const sanitizedMood = sanitizeInput(mood);
    const sanitizedRecipe = {
        name: sanitizeInput(recipe.name),
        description: sanitizeInput(recipe.description),
        ingredients: sanitizeInput(recipe.ingredients),
        instructions: sanitizeInput(recipe.instructions)
    };

    if (!sanitizedMood || !sanitizedRecipe.name || !sanitizedRecipe.ingredients || !sanitizedRecipe.instructions) {
        return res.status(400).json({ error: "All required fields must be filled out" });
    }

    // Check if recipe with same name exists for this mood
    db.get("SELECT id FROM recipes WHERE LOWER(name) = LOWER(?) AND LOWER(mood) = LOWER(?)", 
        [sanitizedRecipe.name, sanitizedMood], 
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (row) {
                res.status(400).json({ error: "This recipe already exists for this mood" });
                return;
            }

            if (isNewRecipe) {
                // Insert new recipe
                db.run(
                    "INSERT INTO recipes (name, description, mood, ingredients, instructions) VALUES (?, ?, ?, ?, ?)",
                    [sanitizedRecipe.name, sanitizedRecipe.description, sanitizedMood, sanitizedRecipe.ingredients, sanitizedRecipe.instructions],
                    function(err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.json({ success: true, id: this.lastID });
                    }
                );
            } else {
                // Handle existing recipe
                if (addType === 'replace') {
                    // Update existing recipe's mood
                    db.run(
                        "UPDATE recipes SET mood = ? WHERE id = ?",
                        [sanitizedMood, recipe.id],
                        (err) => {
                            if (err) {
                                res.status(500).json({ error: err.message });
                                return;
                            }
                            res.json({ success: true });
                        }
                    );
                } else {
                    // Create new entry with existing recipe
                    db.get("SELECT * FROM recipes WHERE id = ?", [recipe.id], (err, existingRecipe) => {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        if (!existingRecipe) {
                            res.status(404).json({ error: "Recipe not found" });
                            return;
                        }
                        db.run(
                            "INSERT INTO recipes (name, description, mood, ingredients, instructions) VALUES (?, ?, ?, ?, ?)",
                            [existingRecipe.name, existingRecipe.description, sanitizedMood, existingRecipe.ingredients, existingRecipe.instructions],
                            function(err) {
                                if (err) {
                                    res.status(500).json({ error: err.message });
                                    return;
                                }
                                res.json({ success: true, id: this.lastID });
                            }
                        );
                    });
                }
            }
        }
    );
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 