// Game elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const levelSelect = document.getElementById('levelSelect');
const gameOver = document.getElementById('gameOver');
const levelUpNotification = document.getElementById('levelUpNotification');
const gameInfo = document.querySelector('.game-info');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const activePowerEl = document.getElementById('activePower');
const finalScoreEl = document.getElementById('finalScore');
const finalLevelEl = document.getElementById('finalLevel');
const startBtn = document.getElementById('startBtn');
const levelSelectBtn = document.getElementById('levelSelectBtn');
const musicToggleBtn = document.getElementById('musicToggleBtn');
const radioToggleBtn = document.getElementById('radioToggleBtn');
const darkModeBtn = document.getElementById('darkModeBtn');
const exitBtn = document.getElementById('exitBtn');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const levelButtonsContainer = document.getElementById('levelButtons');
const loading = document.getElementById('loading');

// Game settings
const gridSize = 18; // Adjusted for 9:16 aspect ratio
const width = canvas.width;
const height = canvas.height;
const cols = Math.floor(width / gridSize);
const rows = Math.floor(height / gridSize);

// Game state
let snake = [];
let food = {};
let powerUps = [];
let obstacles = [];
let movingObstacles = []; // Added for enemy snakes
let direction = 'right';
let nextDirection = 'right';
let gameScore = 0;
let baseGameSpeed = 130;
let gameSpeed = baseGameSpeed;
let gameInterval;
let enemySnakeInterval = null; // Added for enemy snakes
let gameRunning = false;
let musicPlaying = false;
let darkMode = false;
let level = 1;
let highestLevelUnlocked = 1;
let activePowerUp = null;
let powerUpTimer = null;
let foodWorth = 10;

// Generate random obstacles for dynamic levels
function generateRandomObstacles(count, levelNum) {
    let obstacles = [];
    const margin = 2; // Keep obstacles away from edges
    
    // For static obstacles
    for (let i = 0; i < count; i++) {
        let x, y, valid;
        let attempts = 0;
        
        do {
            valid = true;
            x = Math.floor(Math.random() * (cols - 2 * margin)) + margin;
            y = Math.floor(Math.random() * (rows - 2 * margin)) + margin;
            
            // Check if far enough from existing obstacles (to ensure paths)
            for (let obs of obstacles) {
                const distance = Math.abs(x - obs.x) + Math.abs(y - obs.y);
                if (distance < 3) { // Manhattan distance
                    valid = false;
                    break;
                }
            }
            
            attempts++;
            if (attempts > 50) {
                // If we've tried too many times, just accept what we have
                break;
            }
        } while (!valid);
        
        if (valid) {
            obstacles.push({x, y, width: 1, height: 1});
        }
    }
    
    return obstacles;
}

// Create enemy snake for higher levels
function createEnemySnake(levelNum) {
    const margin = 2;
    const length = Math.min(3, Math.floor((levelNum - 60) / 10) + 1); // Snake length increases with level
    
    // Create initial position
    const x = Math.floor(Math.random() * (cols - 2 * margin)) + margin;
    const y = Math.floor(Math.random() * (rows - 2 * margin)) + margin;
    
    // Create segments
    const segments = [];
    for (let i = 0; i < length; i++) {
        segments.push({x, y: y + i});
    }
    
    return {
        segments: segments,
        direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
        color: '#ff4757', // Red color for enemy snakes
        moveInterval: Math.max(80, 300 - (levelNum - 60) * 3) // Gets faster with higher levels (min 80ms)
    };
}

// Move enemy snakes
function moveEnemySnakes() {
    if (!gameRunning) return;
    
    for (let enemy of movingObstacles) {
        // Save previous head position
        const head = enemy.segments[0];
        const prevX = head.x;
        const prevY = head.y;
        
        // Occasionally change direction
        if (Math.random() < 0.1) {
            enemy.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
        }
        
        // Create new head position
        let newX = head.x;
        let newY = head.y;
        
        // Move based on direction
        switch (enemy.direction) {
            case 'up': newY--; break;
            case 'down': newY++; break;
            case 'left': newX--; break;
            case 'right': newX++; break;
        }
        
        // Wrap around screen edges
        if (newX < 0) newX = cols - 1;
        if (newX >= cols) newX = 0;
        if (newY < 0) newY = rows - 1;
        if (newY >= rows) newY = 0;
        
        // Check if hit static obstacle, if so change direction
        let hitObstacle = false;
        for (let obs of obstacles) {
            if (newX === obs.x && newY === obs.y) {
                hitObstacle = true;
                break;
            }
        }
        
        // Check if hit player snake (except head)
        for (let i = 1; i < snake.length; i++) {
            if (newX === snake[i].x && newY === snake[i].y) {
                hitObstacle = true;
                break;
            }
        }
        
        if (hitObstacle) {
            // Try a different direction
            enemy.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
        } else {
            // Add new head
            enemy.segments.unshift({x: newX, y: newY});
            // Remove tail
            enemy.segments.pop();
        }
    }
}

// Check for enemy snake collisions
function checkEnemySnakeCollision(x, y) {
    for (let enemy of movingObstacles) {
        for (let segment of enemy.segments) {
            if (segment.x === x && segment.y === y) {
                return true;
            }
        }
    }
    return false;
}

// Generate 100 progressive levels
function generateLevels() {
    const newLevels = [];
    
    // Level 1-10: Basics and gradual introduction
    newLevels.push({
        name: "Classic",
        description: "The classic snake game",
        speed: 130,
        obstacles: [],
        powerUpFrequency: 0.2,
        foodWorth: 10,
        hasMovingObstacles: false
    });
    
    newLevels.push({
        name: "Speedy",
        description: "Everything moves faster!",
        speed: 110,
        obstacles: [],
        powerUpFrequency: 0.25,
        foodWorth: 15,
        hasMovingObstacles: false
    });
    
    // Keep the original level 3
    newLevels.push({
        name: "First Obstacle",
        description: "Your first obstacle",
        speed: 125,
        obstacles: [
            {x: 12, y: 12, width: 1, height: 1}
        ],
        powerUpFrequency: 0.25,
        foodWorth: 15,
        hasMovingObstacles: false
    });
    
    // Victory Lap (level 4)
    newLevels.push({
        name: "Victory Lap",
        description: "Celebration level",
        speed: 100,
        obstacles: [],
        powerUpFrequency: 1.0,
        foodWorth: 100,
        hasMovingObstacles: false
    });
    
    // Level 5-20: Increasing obstacles
    for (let i = 5; i <= 20; i++) {
        const obstacleCount = Math.floor((i - 2) / 2); // Gradually increasing obstacles
        newLevels.push({
            name: `Obstacle Stage ${i-4}`,
            description: `Navigate through ${obstacleCount} obstacles`,
            speed: Math.max(90, 130 - (i-3) * 2),
            obstacleCount: obstacleCount,
            powerUpFrequency: 0.25 + (i/100),
            foodWorth: 10 + i,
            hasMovingObstacles: false
        });
    }
    
    // Level 21-40: More challenging with more obstacles
    for (let i = 21; i <= 40; i++) {
        const obstacleCount = 8 + Math.floor((i - 20) / 2); // 8, 8, 9, 9...
        newLevels.push({
            name: `Challenge ${i-20}`,
            description: `Dodge ${obstacleCount} obstacles at high speed`,
            speed: Math.max(75, 95 - (i-20)),
            obstacleCount: obstacleCount,
            powerUpFrequency: 0.3 + (i/100),
            foodWorth: 20 + i,
            hasMovingObstacles: false
        });
    }
    
    // Level 41-60: Expert levels
    for (let i = 41; i <= 60; i++) {
        const obstacleCount = 15 + Math.floor((i - 40) / 2); // 15, 15, 16, 16...
        newLevels.push({
            name: `Expert Stage ${i-40}`,
            description: `For skilled players only! ${obstacleCount} obstacles!`,
            speed: Math.max(60, 80 - Math.floor((i-40)/2)),
            obstacleCount: obstacleCount,
            powerUpFrequency: 0.4 + (i/100),
            foodWorth: 30 + i,
            hasMovingObstacles: false
        });
    }
    
    // Level 61-80: Enemy snakes appear
    for (let i = 61; i <= 80; i++) {
        const obstacleCount = 12 + Math.floor((i - 60) / 3); // Fewer obstacles but with moving enemies
        const enemyCount = Math.min(3, Math.floor((i - 60) / 6) + 1); // 1-3 enemies
        
        newLevels.push({
            name: `Enemy Territory ${i-60}`,
            description: `Watch out for ${enemyCount} red snakes!`,
            speed: Math.max(60, 75 - Math.floor((i-60)/3)),
            obstacleCount: obstacleCount,
            powerUpFrequency: 0.5 + (i/100),
            foodWorth: 40 + i,
            hasMovingObstacles: true,
            enemyCount: enemyCount
        });
    }
    
    // Level 81-99: Master levels
    for (let i = 81; i <= 99; i++) {
        const obstacleCount = 8 + Math.floor((i - 80) / 2); // Fewer static obstacles
        const enemyCount = Math.min(5, Math.floor((i - 80) / 4) + 3); // 3-5 enemies
        
        newLevels.push({
            name: `Master Challenge ${i-80}`,
            description: `The ultimate test: ${obstacleCount} obstacles and ${enemyCount} enemies!`,
            speed: Math.max(50, 65 - Math.floor((i-80)/4)),
            obstacleCount: obstacleCount,
            powerUpFrequency: 0.6 + (i/100),
            foodWorth: 50 + i,
            hasMovingObstacles: true,
            enemyCount: enemyCount
        });
    }
    
    // Level 100: Final challenge
    newLevels.push({
        name: "Snake Master",
        description: "You've reached the final challenge!",
        speed: 40, // Very fast
        obstacleCount: 10, // Moderate obstacles
        powerUpFrequency: 1.0, // Many power-ups
        foodWorth: 200,
        hasMovingObstacles: true,
        enemyCount: 6 // Many enemies
    });
    
    return newLevels;
}

// Generate all 100 levels
const levels = generateLevels();

// Power-up types
const powerUpTypes = [
    {
        name: 'speed',
        color: '#20bf6b',
        effect: () => {
            // Speed boost - snake moves faster
            const oldSpeed = gameSpeed;
            gameSpeed = Math.max(50, gameSpeed - 40);
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
            
            // Display active power-up
            showActivePowerUp('Speed Boost!');
            
            // Return a cleanup function
            return () => {
                gameSpeed = oldSpeed;
                clearInterval(gameInterval);
                if (gameRunning) {
                    gameInterval = setInterval(gameLoop, gameSpeed);
                }
            };
        },
        duration: 5000 // 5 seconds
    },
    {
        name: 'grow',
        color: '#f7b731',
        effect: () => {
            // Add 3 segments to the snake
            const tail = snake[snake.length - 1];
            for (let i = 0; i < 3; i++) {
                snake.push({...tail});
            }
            gameScore += 15;
            updateScore();
            
            showActivePowerUp('Extra Growth!');
            
            // No cleanup needed
            return () => {};
        },
        duration: 1000 // Just for the notification
    },
    {
        name: 'invulnerability',
        color: '#3b82f6',
        effect: () => {
            // Make snake invulnerable to self-collision
            const originalCheckCollision = checkSelfCollision;
            checkSelfCollision = () => false;
            
            showActivePowerUp('Invulnerable!');
            
            // Return cleanup function
            return () => {
                checkSelfCollision = originalCheckCollision;
            };
        },
        duration: 7000 // 7 seconds
    }
];

// Audio
const music = new Audio('music2.mp3');
music.loop = true;

// Sound effects
const eatSound = new Audio('bounce2.mp3');  // Reusing existing sound for eating
const powerUpSound = new Audio('bounce.mp3');  // Reusing existing sound for power-ups

// Radio
let radioPlaying = false;
let radioAudio = null;
// Multiple radio options to try in case one fails
const radioStations = [
    "https://ice5.somafm.com/groovesalad-128-mp3", // SomaFM Groove Salad
    "https://stream.radioparadise.com/eclectic-192", // Radio Paradise
    "https://icecast.radiofrance.fr/fip-midfi.mp3" // FIP Radio
];
let currentStationIndex = 0;
const radioStationUrl = radioStations[currentStationIndex];

// Initialize game
function init() {
    try {
        console.log("Initializing game...");
        loadHighestLevel();
        createLevelButtons();
        
        // Initialize game
        resetGame();
        
        // Add event listeners for all buttons
        setupEventListeners();
        
        console.log("Game initialized successfully");
    } catch (error) {
        console.error("Error initializing game:", error);
        // Display an error message to the user
        alert("There was an error starting the game. Please reload the page.");
    }
}

// Set up event listeners
function setupEventListeners() {
    console.log("Setting up event listeners");
    
    startBtn.addEventListener('click', function() {
        console.log("Start button clicked");
        startGame(level);
    });
    
    levelSelectBtn.addEventListener('click', function() {
        console.log("Level select button clicked");
        showLevelSelect();
    });
    
    musicToggleBtn.addEventListener('click', toggleMusic);
    radioToggleBtn.addEventListener('click', toggleRadio);
    darkModeBtn.addEventListener('click', toggleDarkMode);
    
    exitBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to exit?')) {
            window.close();
            alert('You can close this tab to exit the game.');
        }
    });
    
    restartBtn.addEventListener('click', () => startGame(level));
    menuBtn.addEventListener('click', showMainMenu);
    backToMenuBtn.addEventListener('click', showMainMenu);
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    
    // Touch controls
    setupTouchControls();
    
    console.log("Event listeners set up completed");
}

// Create level buttons
function createLevelButtons() {
    levelButtonsContainer.innerHTML = '';
    
    // Show all 100 levels but in groups of 10
    const totalGroups = Math.ceil(levels.length / 10);
    
    for (let group = 0; group < totalGroups; group++) {
        // Create group header
        const groupHeader = document.createElement('div');
        groupHeader.className = 'level-group-header';
        groupHeader.textContent = `Levels ${group * 10 + 1}-${Math.min((group + 1) * 10, levels.length)}`;
        levelButtonsContainer.appendChild(groupHeader);
        
        // Create level buttons container for this group
        const groupButtons = document.createElement('div');
        groupButtons.className = 'level-group';
        
        // Add buttons for this group
        for (let i = 0; i < 10 && (group * 10 + i) < levels.length; i++) {
            const levelNum = group * 10 + i + 1;
            const button = document.createElement('div');
            button.className = `level-btn ${levelNum > highestLevelUnlocked ? 'locked' : ''}`;
            button.textContent = levelNum;
            
            if (levelNum <= highestLevelUnlocked) {
                button.addEventListener('click', () => {
                    startGame(levelNum);
                });
                
                // Add a tooltip with level name and description
                const levelData = levels[levelNum - 1];
                button.title = `${levelData.name}: ${levelData.description}`;
            }
            
            groupButtons.appendChild(button);
        }
        
        levelButtonsContainer.appendChild(groupButtons);
    }
    
    // Add CSS styles for level groups if not already added
    if (!document.getElementById('levelGroupStyles')) {
        const style = document.createElement('style');
        style.id = 'levelGroupStyles';
        style.textContent = `
            .level-group-header {
                width: 100%;
                text-align: center;
                margin-top: 15px;
                margin-bottom: 5px;
                font-weight: bold;
                color: var(--primary);
            }
            
            .level-group {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 8px;
                margin-bottom: 10px;
            }
            
            body.dark-mode .level-group-header {
                color: var(--primary-light);
            }
        `;
        document.head.appendChild(style);
    }
}

// Save/load highest unlocked level
function saveHighestLevel() {
    localStorage.setItem('snakeHighestLevel', highestLevelUnlocked);
}

function loadHighestLevel() {
    const saved = localStorage.getItem('snakeHighestLevel');
    if (saved) {
        highestLevelUnlocked = parseInt(saved);
    }
}

// Reset game
function resetGame(levelNum = 1) {
    // Clear any existing interval
    clearInterval(gameInterval);
    clearInterval(enemySnakeInterval);
    clearTimeout(powerUpTimer);
    
    // Get level data
    const levelData = levels[levelNum - 1] || levels[0];
    
    // Reset game state
    gameRunning = false;
    gameScore = 0;
    direction = 'right';
    nextDirection = 'right';
    level = levelNum;
    baseGameSpeed = levelData.speed;
    gameSpeed = baseGameSpeed;
    foodWorth = levelData.foodWorth;
    activePowerUp = null;
    powerUps = [];
    movingObstacles = [];
    
    // Create obstacles based on level data
    obstacles = [];
    
    if (levelData && levelData.obstacleCount) {
        // Use the new dynamic obstacle generation
        const newObstacles = generateRandomObstacles(levelData.obstacleCount, levelNum);
        obstacles = newObstacles;
    } else if (levelData && levelData.obstacles) {
        // This is for backward compatibility with levels 1-3
        levelData.obstacles.forEach(obs => {
            for (let x = obs.x; x < obs.x + obs.width; x++) {
                for (let y = obs.y; y < obs.y + obs.height; y++) {
                    obstacles.push({x, y});
                }
            }
        });
    }
    
    // Create enemy snakes for higher levels
    if (levelData && levelData.hasMovingObstacles) {
        for (let i = 0; i < levelData.enemyCount; i++) {
            movingObstacles.push(createEnemySnake(levelNum));
        }
    }
    
    // Create snake - Adjusted for 9:16 aspect ratio
    const startX = Math.floor(cols / 4);
    const startY = Math.floor(rows / 3);
    
    snake = [
        {x: startX, y: startY},
        {x: startX - 1, y: startY},
        {x: startX - 2, y: startY}
    ];
    
    // Create food
    createFood();
    
    // Update UI
    updateScore();
    updateLevel();
    
    // Draw initial game state
    draw();
    
    console.log(`Game reset to level ${level}`);
}

// Handle key down events
function handleKeyDown(e) {
    if (!gameRunning) return;
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') nextDirection = 'right';
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
    }
}

// Setup touch controls
function setupTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    // Directional buttons
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    // Swipe controls
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!gameRunning) return;
        
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Determine swipe direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 50 && direction !== 'left') {
                nextDirection = 'right';
            } else if (deltaX < -50 && direction !== 'right') {
                nextDirection = 'left';
            }
        } else {
            // Vertical swipe
            if (deltaY > 50 && direction !== 'up') {
                nextDirection = 'down';
            } else if (deltaY < -50 && direction !== 'down') {
                nextDirection = 'up';
            }
        }
        
        touchStartX = touchEndX;
        touchStartY = touchEndY;
        e.preventDefault();
    }, { passive: false });
    
    // Direction button controls
    upBtn.addEventListener('click', () => {
        if (gameRunning && direction !== 'down') {
            nextDirection = 'up';
        }
    });
    
    downBtn.addEventListener('click', () => {
        if (gameRunning && direction !== 'up') {
            nextDirection = 'down';
        }
    });
    
    leftBtn.addEventListener('click', () => {
        if (gameRunning && direction !== 'right') {
            nextDirection = 'left';
        }
    });
    
    rightBtn.addEventListener('click', () => {
        if (gameRunning && direction !== 'left') {
            nextDirection = 'right';
        }
    });
    
    // Add touch events for better mobile experience
    upBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning && direction !== 'down') {
            nextDirection = 'up';
        }
    }, { passive: false });
    
    downBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning && direction !== 'up') {
            nextDirection = 'down';
        }
    }, { passive: false });
    
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning && direction !== 'right') {
            nextDirection = 'left';
        }
    }, { passive: false });
    
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning && direction !== 'left') {
            nextDirection = 'right';
        }
    }, { passive: false });
}

// Create food
function createFood() {
    // Find a position that's not on the snake or obstacles
    let foodOnSnakeOrObstacle;
    do {
        foodOnSnakeOrObstacle = false;
        food = {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows)
        };
        
        // Check if food is on snake
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                foodOnSnakeOrObstacle = true;
                break;
            }
        }
        
        // Check if food is on obstacle
        if (!foodOnSnakeOrObstacle) {
            for (let obstacle of obstacles) {
                if (obstacle.x === food.x && obstacle.y === food.y) {
                    foodOnSnakeOrObstacle = true;
                    break;
                }
            }
        }
        
        // Check if food is on moving obstacles (enemy snakes)
        if (!foodOnSnakeOrObstacle) {
            if (checkEnemySnakeCollision(food.x, food.y)) {
                foodOnSnakeOrObstacle = true;
            }
        }
        
        // Check if food is on power-up
        if (!foodOnSnakeOrObstacle) {
            for (let powerUp of powerUps) {
                if (powerUp.x === food.x && powerUp.y === food.y) {
                    foodOnSnakeOrObstacle = true;
                    break;
                }
            }
        }
    } while (foodOnSnakeOrObstacle);
    
    // Maybe spawn a power-up
    const levelData = levels[level - 1] || levels[0];
    if (levelData && Math.random() < levelData.powerUpFrequency) {
        createPowerUp();
    }
}

// Create power-up
function createPowerUp() {
    // Select a random power-up type
    const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    // Find a position that's not on the snake, food, or obstacles
    let powerUpOnOtherObjects;
    let newPowerUp;
    
    do {
        powerUpOnOtherObjects = false;
        newPowerUp = {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows),
            type: powerUpType
        };
        
        // Check if on snake
        for (let segment of snake) {
            if (segment.x === newPowerUp.x && segment.y === newPowerUp.y) {
                powerUpOnOtherObjects = true;
                break;
            }
        }
        
        // Check if on food
        if (!powerUpOnOtherObjects && food.x === newPowerUp.x && food.y === newPowerUp.y) {
            powerUpOnOtherObjects = true;
        }
        
        // Check if on obstacles
        if (!powerUpOnOtherObjects) {
            for (let obstacle of obstacles) {
                if (obstacle.x === newPowerUp.x && obstacle.y === newPowerUp.y) {
                    powerUpOnOtherObjects = true;
                    break;
                }
            }
        }
        
        // Check if on enemy snakes
        if (!powerUpOnOtherObjects) {
            if (checkEnemySnakeCollision(newPowerUp.x, newPowerUp.y)) {
                powerUpOnOtherObjects = true;
            }
        }
        
        // Check if on other power-ups
        if (!powerUpOnOtherObjects) {
            for (let powerUp of powerUps) {
                if (powerUp.x === newPowerUp.x && powerUp.y === newPowerUp.y) {
                    powerUpOnOtherObjects = true;
                    break;
                }
            }
        }
    } while (powerUpOnOtherObjects);
    
    powerUps.push(newPowerUp);
    
    // Power-ups disappear after 10 seconds
    setTimeout(() => {
        const index = powerUps.findIndex(p => p.x === newPowerUp.x && p.y === newPowerUp.y);
        if (index !== -1) {
            powerUps.splice(index, 1);
        }
    }, 10000);
}

// Activate power-up
function activatePowerUp(powerUp) {
    // Clear any existing power-up
    if (activePowerUp) {
        activePowerUp.cleanup();
        clearTimeout(powerUpTimer);
    }
    
    // Apply power-up effect
    const cleanup = powerUp.type.effect();
    
    // Set timer to clear power-up
    activePowerUp = {
        type: powerUp.type,
        cleanup: cleanup
    };
    
    powerUpTimer = setTimeout(() => {
        if (activePowerUp) {
            activePowerUp.cleanup();
            activePowerUp = null;
            hideActivePowerUp();
        }
    }, powerUp.type.duration);
}

// Show/hide active power-up indicator
function showActivePowerUp(text) {
    activePowerEl.textContent = text;
    activePowerEl.classList.add('visible');
}

function hideActivePowerUp() {
    activePowerEl.classList.remove('visible');
}

// Update score
function updateScore() {
    scoreEl.textContent = `Score: ${gameScore}`;
    finalScoreEl.textContent = gameScore;
}

// Update level display
function updateLevel() {
    levelEl.textContent = `Level: ${level}`;
    finalLevelEl.textContent = level;
}

// Show level up notification
function showLevelUpNotification() {
    levelUpNotification.textContent = `Level ${level}!`;
    levelUpNotification.style.animation = 'levelUp 1.5s forwards';
    
    setTimeout(() => {
        levelUpNotification.style.animation = 'none';
    }, 1500);
}

// Check collision with obstacles
function checkObstacleCollision(x, y) {
    for (let obstacle of obstacles) {
        if (obstacle.x === x && obstacle.y === y) {
            return true;
        }
    }
    return false;
}

// Check collision with self
function checkSelfCollision(x, y) {
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === x && snake[i].y === y) {
            return true;
        }
    }
    return false;
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Update direction
    direction = nextDirection;
    
    // Create new head
    const head = {x: snake[0].x, y: snake[0].y};
    
    // Move head based on direction
    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Snake wraps around at edges instead of colliding
    if (head.x < 0) {
        head.x = cols - 1; // Wrap to right side
    } else if (head.x >= cols) {
        head.x = 0; // Wrap to left side
    }
    
    if (head.y < 0) {
        head.y = rows - 1; // Wrap to bottom
    } else if (head.y >= rows) {
        head.y = 0; // Wrap to top
    }
    
    // Check obstacle collisions
    if (checkObstacleCollision(head.x, head.y)) {
        endGame();
        return;
    }
    
    // Check enemy snake collisions
    if (checkEnemySnakeCollision(head.x, head.y)) {
        endGame();
        return;
    }
    
    // Check self collisions
    if (checkSelfCollision(head.x, head.y)) {
        endGame();
        return;
    }
    
    // Check if food eaten
    if (head.x === food.x && head.y === food.y) {
        // Add new head
        snake.unshift(head);
        
        // Create new food
        createFood();
        
        // Increase score and play eat sound
        gameScore += foodWorth;
        updateScore();
        
        // Play eating sound
        eatSound.currentTime = 0;
        eatSound.play().catch(err => console.log("Could not play eat sound:", err));
        
        // Check for level up
        const scoreThreshold = level * 100;
        if (gameScore >= scoreThreshold && level < levels.length) {
            levelUp();
        }
    } else {
        // Check if power-up eaten
        const powerUpIndex = powerUps.findIndex(p => p.x === head.x && p.y === head.y);
        if (powerUpIndex !== -1) {
            const powerUp = powerUps[powerUpIndex];
            powerUps.splice(powerUpIndex, 1);
            activatePowerUp(powerUp);
            
            // Add points for power-up
            gameScore += 5;
            updateScore();
            
            // Play power-up sound
            powerUpSound.currentTime = 0;
            powerUpSound.play().catch(err => console.log("Could not play power-up sound:", err));
        }
        
        // Remove tail and add new head
        snake.pop();
        snake.unshift(head);
    }
    
    // Redraw game
    draw();
}

// Level up
function levelUp() {
    level++;
    if (level > highestLevelUnlocked) {
        highestLevelUnlocked = level;
        saveHighestLevel();
        createLevelButtons();
    }
    
    updateLevel();
    showLevelUpNotification();
    
    // Save the current score and snake length before resetting
    const currentScore = gameScore;
    const currentSnake = [...snake]; // Save a copy of the current snake
    
    // Update game parameters based on new level
    const levelData = levels[level - 1] || levels[0];
    baseGameSpeed = levelData.speed;
    gameSpeed = baseGameSpeed;
    foodWorth = levelData.foodWorth;
    
    // Reset the game with new level obstacles and enemies but we'll restore the snake
    resetGame(level);
    
    // Restore the score that was reset in resetGame()
    gameScore = currentScore;
    updateScore();
    
    // Restore the snake's length (replace the default snake with our saved one)
    // Keep the starting position from resetGame but use the length from before
    const startX = snake[0].x;
    const startY = snake[0].y;
    
    // Create a new snake with the same length as the previous one but at the new start position
    snake = [];
    snake.push({x: startX, y: startY}); // Add head at start position
    
    // Add remaining segments in a line behind the head
    for (let i = 1; i < currentSnake.length; i++) {
        // Place segments in a line behind the head based on the direction
        let segX = startX;
        let segY = startY;
        
        switch (direction) {
            case 'right':
                segX = startX - i;
                break;
            case 'left':
                segX = startX + i;
                break;
            case 'up':
                segY = startY + i;
                break;
            case 'down':
                segY = startY - i;
                break;
        }
        
        // Make sure the coordinates are within the grid
        if (segX < 0) segX = 0;
        if (segX >= cols) segX = cols - 1;
        if (segY < 0) segY = 0;
        if (segY >= rows) segY = rows - 1;
        
        snake.push({x: segX, y: segY});
    }
    
    // Set game to running since resetGame sets it to false
    gameRunning = true;
    
    // Reset game interval with new speed
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
    
    // Start enemy movement for levels with moving obstacles
    if (levelData && levelData.hasMovingObstacles) {
        enemySnakeInterval = setInterval(moveEnemySnakes, 200);
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = darkMode ? '#1e1e30' : '#f8f9ff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid (subtle lines)
    ctx.strokeStyle = darkMode ? '#2a2a40' : '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }
    
    for (let i = 0; i <= height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }
    
    // Draw obstacles
    ctx.fillStyle = darkMode ? '#444455' : '#555555';
    for (let obstacle of obstacles) {
        ctx.fillRect(
            obstacle.x * gridSize,
            obstacle.y * gridSize,
            gridSize,
            gridSize
        );
    }
    
    // Draw enemy snakes (moving obstacles)
    for (let enemy of movingObstacles) {
        // Draw enemy snake with red color
        for (let i = 0; i < enemy.segments.length; i++) {
            const segment = enemy.segments[i];
            const isHead = i === 0;
            
            ctx.fillStyle = isHead ? '#ff3040' : '#ff6b7a';
            
            const x = segment.x * gridSize;
            const y = segment.y * gridSize;
            
            // Draw rounded snake segments
            const radius = isHead ? 6 : 4;
            ctx.beginPath();
            ctx.roundRect(
                x + 1,
                y + 1,
                gridSize - 2,
                gridSize - 2,
                radius
            );
            ctx.fill();
            
            // Draw eyes on enemy head
            if (isHead) {
                ctx.fillStyle = darkMode ? '#000000' : '#ffffff';
                
                // Position eyes based on direction
                let eye1X, eye1Y, eye2X, eye2Y;
                
                switch (enemy.direction) {
                    case 'up':
                        eye1X = x + gridSize / 3;
                        eye1Y = y + gridSize / 3;
                        eye2X = x + gridSize * 2/3;
                        eye2Y = y + gridSize / 3;
                        break;
                    case 'down':
                        eye1X = x + gridSize / 3;
                        eye1Y = y + gridSize * 2/3;
                        eye2X = x + gridSize * 2/3;
                        eye2Y = y + gridSize * 2/3;
                        break;
                    case 'left':
                        eye1X = x + gridSize / 3;
                        eye1Y = y + gridSize / 3;
                        eye2X = x + gridSize / 3;
                        eye2Y = y + gridSize * 2/3;
                        break;
                    case 'right':
                        eye1X = x + gridSize * 2/3;
                        eye1Y = y + gridSize / 3;
                        eye2X = x + gridSize * 2/3;
                        eye2Y = y + gridSize * 2/3;
                        break;
                }
                
                ctx.beginPath();
                ctx.arc(eye1X, eye1Y, 3, 0, Math.PI * 2);
                ctx.arc(eye2X, eye2Y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Draw power-ups
    for (let powerUp of powerUps) {
        ctx.fillStyle = powerUp.type.color;
        ctx.beginPath();
        ctx.arc(
            powerUp.x * gridSize + gridSize / 2,
            powerUp.y * gridSize + gridSize / 2,
            gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw a star or symbol in the center
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(
            powerUp.x * gridSize + gridSize / 2,
            powerUp.y * gridSize + gridSize / 2,
            gridSize / 4,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // Draw food (with animation effect)
    ctx.fillStyle = '#ff4757';
    const pulse = Math.sin(Date.now() / 200) * 2;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        (gridSize / 2 - 2) + pulse,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Draw snake segments with gradient effect
    for (let i = 0; i < snake.length; i++) {
        // Calculate color based on position in snake
        const ratio = i / snake.length;
        
        if (activePowerUp) {
            // Special coloring for power-ups
            if (activePowerUp.type.name === 'speed') {
                ctx.fillStyle = i === 0 ? '#20bf6b' : `hsl(153, 71%, ${50 + ratio * 20}%)`;
            } else if (activePowerUp.type.name === 'invulnerability') {
                ctx.fillStyle = i === 0 ? '#3b82f6' : `hsl(217, 91%, ${60 + ratio * 20}%)`;
            } else {
                ctx.fillStyle = i === 0 ? '#7841c9' : `hsl(262, 61%, ${50 + ratio * 20}%)`;
            }
        } else {
            // Normal snake coloring
            ctx.fillStyle = i === 0 ? '#7841c9' : `hsl(262, 61%, ${50 + ratio * 20}%)`;
        }
        
        const x = snake[i].x * gridSize;
        const y = snake[i].y * gridSize;
        
        // Draw rounded snake segments
        const radius = i === 0 ? 6 : 4;
        ctx.beginPath();
        ctx.roundRect(
            x + 1,
            y + 1,
            gridSize - 2,
            gridSize - 2,
            radius
        );
        ctx.fill();
        
        // Draw eyes on head
        if (i === 0) {
            ctx.fillStyle = 'white';
            
            // Position eyes based on direction
            let eye1X, eye1Y, eye2X, eye2Y;
            
            switch (direction) {
                case 'up':
                    eye1X = x + gridSize / 3;
                    eye1Y = y + gridSize / 3;
                    eye2X = x + gridSize * 2/3;
                    eye2Y = y + gridSize / 3;
                    break;
                case 'down':
                    eye1X = x + gridSize / 3;
                    eye1Y = y + gridSize * 2/3;
                    eye2X = x + gridSize * 2/3;
                    eye2Y = y + gridSize * 2/3;
                    break;
                case 'left':
                    eye1X = x + gridSize / 3;
                    eye1Y = y + gridSize / 3;
                    eye2X = x + gridSize / 3;
                    eye2Y = y + gridSize * 2/3;
                    break;
                case 'right':
                    eye1X = x + gridSize * 2/3;
                    eye1Y = y + gridSize / 3;
                    eye2X = x + gridSize * 2/3;
                    eye2Y = y + gridSize * 2/3;
                    break;
            }
            
            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, 3, 0, Math.PI * 2);
            ctx.arc(eye2X, eye2Y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Start game
function startGame(levelNum = 1) {
    showLoading();
    
    setTimeout(() => {
        resetGame(levelNum);
        menu.classList.add('hidden');
        levelSelect.classList.add('hidden');
        gameInfo.style.display = 'flex';
        gameOver.classList.remove('show');
        gameRunning = true;
        
        // Start game loop
        gameInterval = setInterval(gameLoop, gameSpeed);
        
        // Start enemy snake movement for levels that have them
        const levelData = levels[levelNum - 1];
        if (levelData && levelData.hasMovingObstacles) {
            enemySnakeInterval = setInterval(moveEnemySnakes, 200);
        }
        
        hideLoading();
        console.log(`Starting game at level ${level}`);
    }, 500); // Simulate loading time
}

// End game
function endGame() {
    gameRunning = false;
    clearInterval(gameInterval);
    clearInterval(enemySnakeInterval);
    
    // Clear any active power-up
    if (activePowerUp) {
        activePowerUp.cleanup();
        activePowerUp = null;
        clearTimeout(powerUpTimer);
    }
    
    gameOver.classList.add('show');
    
    console.log("Game over");
}

// Toggle music
function toggleMusic() {
    if (musicPlaying) {
        music.pause();
        musicPlaying = false;
        musicToggleBtn.textContent = 'Music: Off';
    } else {
        // If radio is playing, turn it off first
        if (radioPlaying) {
            toggleRadio();
        }
        
        music.play().catch(err => {
            console.log("Music autoplay prevented:", err);
        });
        musicPlaying = true;
        musicToggleBtn.textContent = 'Music: On';
    }
}

// Toggle radio
function toggleRadio() {
    if (radioPlaying) {
        if (radioAudio) {
            radioAudio.pause();
            radioAudio = null;
        }
        radioPlaying = false;
        radioToggleBtn.textContent = 'Radio: Off';
    } else {
        // If music is playing, turn it off first
        if (musicPlaying) {
            toggleMusic();
        }
        
        try {
            // Create audio element with appropriate settings
            radioAudio = new Audio();
            radioAudio.crossOrigin = "anonymous";
            radioAudio.preload = "auto";
            
            // Load stream through a media element source
            radioAudio.src = radioStationUrl;
            
            // Handle errors
            radioAudio.onerror = function(e) {
                console.error("Error loading radio stream:", e);
                // Try next station
                currentStationIndex = (currentStationIndex + 1) % radioStations.length;
                console.log("Trying next radio station:", radioStations[currentStationIndex]);
                radioAudio.src = radioStations[currentStationIndex];
                
                // Only show error if all stations have been tried
                if (currentStationIndex === 0) {
                    alert("Couldn't connect to any radio stream. Please try again later.");
                    radioPlaying = false;
                    radioToggleBtn.textContent = 'Radio: Off';
                } else {
                    radioAudio.play().catch(err => {
                        console.log("Second try radio error:", err);
                    });
                }
            };
            
            // Start playing
            let playPromise = radioAudio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    // Playing successfully
                    radioPlaying = true;
                    radioToggleBtn.textContent = 'Radio: On';
                })
                .catch(err => {
                    console.log("Radio autoplay prevented:", err);
                    alert("Click the radio button again to start radio (browser autoplay policy).");
                    radioPlaying = false;
                    radioToggleBtn.textContent = 'Radio: Off';
                });
            }
        } catch (err) {
            console.error("Radio initialization error:", err);
            alert("Could not initialize radio stream.");
        }
    }
}

// Toggle dark mode
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode', darkMode);
    darkModeBtn.textContent = `Dark Mode: ${darkMode ? 'On' : 'Off'}`;
    
    // Redraw game if running
    if (gameRunning) {
        draw();
    }
}

// Toggle pause
function togglePause() {
    if (gameRunning) {
        gameRunning = false;
        clearInterval(gameInterval);
    } else {
        gameRunning = true;
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
}

// Show loading indicator
function showLoading() {
    loading.style.display = 'flex';
}

function hideLoading() {
    loading.style.display = 'none';
}

// Show main menu
function showMainMenu() {
    gameOver.classList.remove('show');
    levelSelect.classList.add('hidden');
    menu.classList.remove('hidden');
    gameInfo.style.display = 'none';
}

// Show level select
function showLevelSelect() {
    menu.classList.add('hidden');
    levelSelect.classList.remove('hidden');
}

// Initialize the game when everything is loaded
window.addEventListener('load', init);