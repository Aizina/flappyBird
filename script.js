// Constants
const boardWidth = 360;
const boardHeight = 640;
const birdWidth = 34; // width/height ratio = 408/228 = 17/12
const birdHeight = 24;
const pipeWidth = 64; // width/height ratio = 384/3072 = 1/8
const pipeHeight = 512;
const gravity = 0.4;

// Variables
let board, context, birdImg, topPipeImg, bottomPipeImg;
let bird, birdSource, pipeArray, velocityX, velocityY, gameOver, score, highestScore;
let animationFrameId, pipeIntervalId;
let gameStarted = false;
let index = 0;
const SIZE = [51, 36];

window.onload = () => {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    loadImages();
    initVariables();
    drawStartButton(); // Draw start button initially

    board.addEventListener('click', handleCanvasClick);
    document.addEventListener("keydown", moveBird);
};

function initVariables() {
    bird = { x: boardWidth / 8, y: boardHeight / 2, width: birdWidth, height: birdHeight };
    birdSource = { x: 432, y: Math.floor((index % 9) / 3) * SIZE[1], width: SIZE[0], height: SIZE[1]};
    pipeArray = [];
    velocityX = -2; // pipes moving left speed
    velocityY = 0; // bird jump speed
    gameOver = false;
    score = 0;
    highestScore = parseInt(localStorage.getItem('highestScore')) || 0;
}

function loadImages() {
    birdImg = new Image();
    birdImg.src = "https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png";
    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";
    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";
}

function handleCanvasClick(event) {
    const rect = board.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Start button
    if (!gameStarted && x >= boardWidth / 2 - 50 && x <= boardWidth / 2 + 50 && y >= boardHeight / 2 - 30 && y <= boardHeight / 2 + 20) {
        startGame();
    }

    // Restart button
    if (gameOver && x >= boardWidth / 2 - 50 && x <= boardWidth / 2 + 50 && y >= boardHeight / 2 + 20 && y <= boardHeight / 2 + 70) {
        restartGame();
    }
}

function drawStartButton() {
    context.fillStyle = '#0000FF'; // Blue color
    context.fillRect(boardWidth / 2 - 50, boardHeight / 2 - 30, 100, 50); // Draw rectangle for button
    context.fillStyle = '#FFFFFF'; // White text
    context.font = '20px Arial';
    context.fillText('Start', boardWidth / 2 - 30, boardHeight / 2);
}

function drawRestartButton() {
    context.fillStyle = '#FF0000'; // Red color
    context.fillRect(boardWidth / 2 - 50, boardHeight / 2 + 20, 100, 50); // Draw rectangle for button
    context.fillStyle = '#FFFFFF'; // White text
    context.font = '20px Arial';
    context.fillText('Restart', boardWidth / 2 - 40, boardHeight / 2 + 50);
}

function startGame() {
    gameStarted = true;
    gameOver = false;
    initVariables();
    animationFrameId = requestAnimationFrame(update);
    pipeIntervalId = setInterval(placePipes, 1500);
    context.clearRect(0, 0, board.width, board.height); // Clear the start button
}

function restartGame() {
    cancelAnimationFrame(animationFrameId);
    clearInterval(pipeIntervalId);
    context.clearRect(0, 0, board.width, board.height);
    initVariables();
    startGame();
}

function finishGame() {
    cancelAnimationFrame(animationFrameId);
    clearInterval(pipeIntervalId);
    gameOver = true;
    showGameOver();
}

function update() {
    animationFrameId = requestAnimationFrame(update);
    if (gameOver) {
        cancelAnimationFrame(animationFrameId);
        clearInterval(pipeIntervalId);
        showGameOver();
        return;
    }

    renderGame();
}

function renderGame() {
    context.clearRect(0, 0, board.width, board.height);

    // Bird physics
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
    index += 0.3;
    context.drawImage(birdImg,         
        birdSource.x, birdSource.y, birdSource.width, birdSource.height, 
        bird.x, bird.y, bird.width, bird.height);

    if(bird.y >= boardHeight) {
        gameOver = true;
    }

    // Move pipes and check collisions
    pipeArray.forEach(pipe => {
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;
            pipe.passed = true;
        }
        if (detectCollision(bird, pipe)) {
            gameOver = true;
        }
    });

    // Remove off-screen pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    // Display scores
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(`Score: ${Math.floor(score)}`, 5, 45);
    context.fillText(`Best: ${highestScore}`, 5, 90);
}

function showGameOver() {
    context.fillStyle = "white";
    context.font = "45px Arial";
    context.fillText("GAME OVER", boardWidth / 2 - 130, boardHeight / 2 - 10);
  
    drawRestartButton(); // Draw restart button on canvas
    if (score > highestScore) {
        highestScore = Math.floor(score);
        localStorage.setItem('highestScore', highestScore);
    }
}

function placePipes() {
    let randomPipeY = -pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    const openingSpace = board.height / 4;

    let topPipe = {
        img: topPipeImg,
        x: boardWidth,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };
    let bottomPipe = {
        img: bottomPipeImg,
        x: boardWidth,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };
    pipeArray.push(topPipe);
    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    if (e.code === "Space" && !gameOver) {
        velocityY = -6;
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
