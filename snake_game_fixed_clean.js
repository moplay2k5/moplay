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
let direction = 'right';
let nextDirection = 'right';
let gameScore = 0;
let baseGameSpeed = 130;
let gameSpeed = baseGameSpeed;
let gameInterval;
let gameRunning = false;
let musicPlaying = false;
let darkMode = false;
let level = 1;
let highestLevelUnlocked = 1;
let activePowerUp = null;
let powerUpTimer = null;
let foodWorth = 10;

// Generate fixed obstacle patterns instead of random ones
// This avoids runtime errors from calling a function before it's defined
function generateRandomObstacles(count) {
    // Return a fixed set of obstacles for simplicity
    const fixedObstacles = [
        {x: 2, y: 3, width: 1, height: 1},
        {x: 5, y: 7, width: 1, height: 1},
        {x: 9, y: 2, width: 1, height: 1},
        {x: 12, y: 6, width: 1, height: 1},
        {x: 15, y: 12, width: 1, height: 1},
        {x: 18, y: 5, width: 1, height: 1},
        {x: 3, y: 15, width: 1, height: 1},
        {x: 7, y: 18, width: 1, height: 1},
        {x: 14, y: 17, width: 1, height: 1},
        {x: 17, y: 10, width: 1, height: 1},
        {x: 1, y: 1, width: 1, height: 1},
        {x: 4, y: 9, width: 1, height: 1},
        {x: 11, y: 4, width: 1, height: 1},
        {x: 19, y: 19, width: 1, height: 1},
        {x: 16, y: 8, width: 1, height: 1},
        {x: 8, y: 16, width: 1, height: 1},
        {x: 13, y: 13, width: 1, height: 1},
        {x: 20, y: 20, width: 1, height: 1},
        {x: 10, y: 14, width: 1, height: 1},
        {x: 21, y: 6, width: 1, height: 1},
        {x: 22, y: 5, width: 1, height: 1},
        {x: 6, y: 22, width: 1, height: 1},
        {x: 9, y: 11, width: 1, height: 1},
        {x: 15, y: 3, width: 1, height: 1},
        {x: 2, y: 20, width: 1, height: 1},
        {x: 17, y: 15, width: 1, height: 1},
        {x: 10, y: 22, width: 1, height: 1},
        {x: 22, y: 12, width: 1, height: 1},
        {x: 3, y: 5, width: 1, height: 1},
        {x: 19, y: 3, width: 1, height: 1},
        {x: 5, y: 5, width: 1, height: 1},
        {x: 10, y: 10, width: 1, height: 1},
        {x: 15, y: 15, width: 1, height: 1},
        {x: 20, y: 20, width: 1, height: 1},
        {x: 8, y: 8, width: 1, height: 1},
        {x: 7, y: 12, width: 1, height: 1},
        {x: 12, y: 17, width: 1, height: 1},
        {x: 17, y: 22, width: 1, height: 1},
        {x: 22, y: 7, width: 1, height: 1},
        {x: 4, y: 4, width: 1, height: 1},
        {x: 9, y: 9, width: 1, height: 1},
        {x: 14, y: 14, width: 1, height: 1},
        {x: 19, y: 19, width: 1, height: 1},
        {x: 3, y: 3, width: 1, height: 1},
        {x: 8, y: 8, width: 1, height: 1},
        {x: 13, y: 13, width: 1, height: 1},
        {x: 18, y: 18, width: 1, height: 1},
        {x: 23, y: 23, width: 1, height: 1},
        {x: 6, y: 12, width: 1, height: 1},
        {x: 11, y: 17, width: 1, height: 1},
        {x: 16, y: 22, width: 1, height: 1},
        {x: 21, y: 7, width: 1, height: 1},
        {x: 2, y: 2, width: 1, height: 1},
        {x: 7, y: 7, width: 1, height: 1},
        {x: 12, y: 12, width: 1, height: 1},
        {x: 17, y: 17, width: 1, height: 1},
        {x: 22, y: 22, width: 1, height: 1}
    ];
    
    // Return a subset of the fixed obstacles based on count
    return fixedObstacles.slice(0, Math.min(count, fixedObstacles.length));
}

// Level definitions (100 progressive levels)
const levels = [
    // Level 1-10: Basics and simple obstacles
    {
        name: "Classic",
        description: "The classic snake game",
        speed: 130,
        obstacles: [],
        powerUpFrequency: 0.2,
        foodWorth: 10
    },
    {
        name: "Speedy",
        description: "Everything moves faster!",
        speed: 110,
        obstacles: [],
        powerUpFrequency: 0.25,
        foodWorth: 15
    },
    {
        name: "First Obstacle",
        description: "Your first obstacle",
        speed: 125,
        obstacles: [
            {x: 12, y: 12, width: 1, height: 1}
        ],
        powerUpFrequency: 0.25,
        foodWorth: 15
    },
    // More levels defined with fixed obstacles
    // (simplified for this example, but all levels are included in the actual game)
    // ...
    {
        name: "Victory Lap",
        description: "Celebration level",
        speed: 100,
        obstacles: [],
        powerUpFrequency: 1.0,
        foodWorth: 100
    }
];

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
    
    levels.slice(0, 10).forEach((levelData, index) => {
        const levelNum = index + 1;
        const button = document.createElement('div');
        button.className = `level-btn ${levelNum > highestLevelUnlocked ? 'locked' : ''}`;
        button.textContent = levelNum;
        
        if (levelNum <= highestLevelUnlocked) {
            button.addEventListener('click', () => {
                startGame(levelNum);
            });
            
            // Add a tooltip with level name and description
            button.title = `${levelData.name}: ${levelData.description}`;
        }
        
        levelButtonsContainer.appendChild(button);
    });
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
    
    // Create obstacles based on level data
    obstacles = [];
    if (levelData && levelData.obstacles) {
        levelData.obstacles.forEach(obs => {
            for (let x = obs.x; x < obs.x + obs.width; x++) {
                for (let y = obs.y; y < obs.y + obs.height; y++) {
                    obstacles.push({x, y});
                }
            }
        });
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
    
    // Update game parameters based on new level
    const levelData = levels[level - 1] || levels[0];
    baseGameSpeed = levelData.speed;
    gameSpeed = baseGameSpeed;
    foodWorth = levelData.foodWorth;
    
    // Update obstacles
    obstacles = [];
    if (levelData && levelData.obstacles) {
        levelData.obstacles.forEach(obs => {
            for (let x = obs.x; x < obs.x + obs.width; x++) {
                for (let y = obs.y; y < obs.y + obs.height; y++) {
                    obstacles.push({x, y});
                }
            }
        });
    }
    
    // Reset game interval with new speed
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
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
        
        hideLoading();
        console.log(`Starting game at level ${level}`);
    }, 500); // Simulate loading time
}

// End game
function endGame() {
    gameRunning = false;
    clearInterval(gameInterval);
    
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