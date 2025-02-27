// Reset game
function resetGameKeepScore(levelNum = 1, keepScore = false) {
    // Save score if needed
    const savedScore = keepScore ? gameScore : 0;
    
    // Clear any existing interval
    clearInterval(gameInterval);
    clearInterval(enemySnakeInterval);
    clearTimeout(powerUpTimer);
    
    // Get level data
    const levelData = levels[levelNum - 1] || levels[0];
    
    // Reset game state
    gameRunning = keepScore; // Only set to false on new game
    direction = 'right';
    nextDirection = 'right';
    level = levelNum;
    baseGameSpeed = levelData.speed;
    gameSpeed = baseGameSpeed;
    foodWorth = levelData.foodWorth;
    activePowerUp = null;
    powerUps = [];
    movingObstacles = [];
    
    // Restore score if needed
    gameScore = savedScore;
    
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
    
    console.log(`Game reset to level ${level} with score ${gameScore}`);
}

// Level up safely without resetting score
function levelUpSafe() {
    level++;
    if (level > highestLevelUnlocked) {
        highestLevelUnlocked = level;
        saveHighestLevel();
        createLevelButtons();
    }
    
    updateLevel();
    showLevelUpNotification();
    
    // Save the current score 
    const currentScore = gameScore;
    
    // Update game parameters based on new level
    const levelData = levels[level - 1] || levels[0];
    baseGameSpeed = levelData.speed;
    gameSpeed = baseGameSpeed;
    foodWorth = levelData.foodWorth;
    
    // Reset the game with new level obstacles and enemies (keeping the score)
    resetGameKeepScore(level, true);
    
    // Reset game interval with new speed
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
    
    // Start enemy movement for levels with moving obstacles
    if (levelData && levelData.hasMovingObstacles) {
        clearInterval(enemySnakeInterval);
        enemySnakeInterval = setInterval(moveEnemySnakes, 200);
    }
}
