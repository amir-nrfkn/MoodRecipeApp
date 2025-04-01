# Mood Recipe Finder

A web application that recommends recipes based on your current mood. The app features a dynamic interface where users can select their mood from a grid of mood buttons, each with a unique emoji and color. The app then suggests a recipe that matches the selected mood.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **Database**: SQLite
- **Styling**: Tailwind CSS

## Features

- Dynamic mood buttons with random emojis and colors
- Real-time mood checking to prevent duplicates
- Custom toast notifications for success and error messages
- Responsive design for various screen sizes

## How It Was Created

1. **Setup**: The project was initialized with Node.js and Express. Dependencies were installed using npm.
2. **Database**: A SQLite database was set up to store recipes and moods.
3. **Frontend**: The UI was built using HTML and styled with Tailwind CSS. JavaScript was used to handle user interactions and API calls.
4. **Backend**: Express routes were created to handle API requests for adding moods, checking existing moods, and retrieving recipes.
5. **Testing**: The app was tested for functionality and user experience before deployment.

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`.
3. Start the server: `npm start`.
4. Open the app in your browser at `http://localhost:3000`. 