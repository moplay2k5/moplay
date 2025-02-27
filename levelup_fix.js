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
    
    // Save the current score before resetting
    const currentScore = gameScore;
    
    // Update game parameters based on new level
    const levelData = levels[level - 1] || levels[0];
    baseGameSpeed = levelData.speed;
    gameSpeed = baseGameSpeed;
    foodWorth = levelData.foodWorth;
    
    // Reset the game with new level obstacles and enemies (without changing the score)
    resetGame(level);
    
    // Restore the score that was reset in resetGame()
    gameScore = currentScore;
    updateScore();
    
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
