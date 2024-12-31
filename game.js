// Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200; // Increased screen width
canvas.height = 800; // Increased screen height

// Assets
const ship1Img = new Image();
const ship2Img = new Image();
const ship3Img = new Image();
const bossImg = new Image();
const enemyImg = new Image();
const backgroundImg = new Image();
const pewPewSound = new Audio('assets/pew-pew.mp3');
const blastingSound = new Audio('assets/blasting.mp3');
const levelChangeSound = new Audio('assets/level-change.mp3');

ship1Img.src = 'assets/ships/ship1.png';
ship2Img.src = 'assets/ships/ship2.png';
ship3Img.src = 'assets/ships/ship3.png';
bossImg.src = 'assets/boss.png';
enemyImg.src = 'assets/enemy.png';
backgroundImg.src = 'assets/background.jpg';

const shipImgs = [ship1Img, ship2Img, ship3Img];

// Game State Variables
let score = 0;
let health = 3;
let level = 1;
let isPlaying = false;
let shipSelection = false;
let selectedShip = null;
let enemySpawnInterval = null;
let enemyShootInterval = null;

// Ship Object
let ship = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 100,
    width: 40,
    height: 40,
    speed: 5,
    img: shipImgs[0]
};

// Enemy and Bullet Objects
let enemies = [];
let bullets = [];
let boss = null;
let bossBullets = [];

// Key Movement Tracking
let leftArrowPressed = false;
let rightArrowPressed = false;
let upArrowPressed = false;
let downArrowPressed = false;
let spacePressed = false;

// Bullet Cooldown Timer (Shoot every 300 ms)
let lastShotTime = 0;

// Start Button Event
document.getElementById('start-button').addEventListener('click', showShipSelection);

// Show Ship Selection Screen
function showShipSelection() {
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('ship-selection').style.display = 'block';
    shipSelection = true;
}

// Start Game after selecting a ship
document.querySelectorAll('#ship-selection img').forEach((img, index) => {
    img.addEventListener('click', () => {
        selectedShip = index;
        startGame();
    });
});

// Start Game
function startGame() {
    document.getElementById('ship-selection').style.display = 'none';
    isPlaying = true;
    ship = { x: canvas.width / 2 - 20, y: canvas.height - 100, width: 40, height: 40, speed: 5, img: shipImgs[selectedShip] };
    score = 0;
    health = 3;
    level = 1;
    spawnEnemies(); // Start spawning enemies
    gameLoop();
}

// Spawn Enemies with Different Rates for Each Level
function spawnEnemies() {
    const spawnRate = level === 2 ? 2000 : 3000; // Level 2: 2 seconds spawn rate, Level 1: 3 seconds
    enemySpawnInterval = setInterval(() => {
        if (isPlaying && level < 3) {
            let enemyCount = level === 2 ? 3 : (level === 3 ? 4 : 1);
            for (let i = 0; i < enemyCount; i++) {
                let enemy = {
                    x: Math.random() * canvas.width,
                    y: -40, // Start just above the canvas
                    width: 40,
                    height: 40,
                    speed: 2 + level, // Increase speed with level
                    health: 1 + Math.floor(level / 2), // Increase health with level
                    moveTowardPlayer: function () {
                        const dx = ship.x - this.x;
                        const dy = ship.y - this.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        this.x += (dx / distance) * this.speed;
                        this.y += this.speed;
                    }
                };
                enemies.push(enemy); // Add the new enemy to the enemies array
            }
        }
    }, spawnRate); // Spawn based on level: 2-3 seconds for Level 1, 2 seconds for Level 2, 3 seconds for Level 3
}

// Boss Spawning (Level 3)
function spawnBoss() {
    boss = { x: canvas.width / 2 - 50, y: 50, width: 100, height: 100, health: 3, speed: 3 };
    ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);
    spawnBossShooting();
}

// Boss Shooting Mechanism
function spawnBossShooting() {
    enemyShootInterval = setInterval(() => {
        if (boss && isPlaying) {
            let bullet = {
                x: boss.x + boss.width / 2 - 2,
                y: boss.y + boss.height,
                width: 4,
                height: 10,
                speed: 4
            };
            bossBullets.push(bullet);
        }
    }, 1000); // Boss shoots every second
}

// Move Boss Randomly
function moveBoss() {
    if (boss) {
        const randomDirection = Math.random();
        if (randomDirection < 0.25) {
            boss.x += boss.speed; // Move right
        } else if (randomDirection < 0.5) {
            boss.x -= boss.speed; // Move left
        } else if (randomDirection < 0.75) {
            boss.y += boss.speed; // Move down
        } else {
            boss.y -= boss.speed; // Move up
        }

        // Keep the boss within the screen bounds
        boss.x = Math.max(0, Math.min(canvas.width - boss.width, boss.x));
        boss.y = Math.max(0, Math.min(canvas.height - boss.height, boss.y));
    }
}

// Game Loop
function gameLoop() {
    if (!isPlaying) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    // Draw and move the player ship
    updatePlayer();
    drawPlayer();

    // Move and draw enemies
    enemies.forEach(enemy => {
        enemy.moveTowardPlayer();
        ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // Draw bullets
    bullets.forEach(bullet => {
        bullet.y -= bullet.speed;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw Boss and Boss Bullets
    if (boss) {
        moveBoss();
        ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);
        bossBullets.forEach(bullet => {
            bullet.y += bullet.speed; // Boss bullets move down
            ctx.fillStyle = 'red';
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }

    // Handle collisions
    handleCollisions();

    // Draw score and health bar
    drawUI();

    // Request next frame
    shootBullet();
    requestAnimationFrame(gameLoop);
}

// Update Player Movement
function updatePlayer() {
    if (leftArrowPressed && ship.x > 0) ship.x -= ship.speed;
    if (rightArrowPressed && ship.x < canvas.width - ship.width) ship.x += ship.speed;
    if (upArrowPressed && ship.y > 0) ship.y -= ship.speed;
    if (downArrowPressed && ship.y < canvas.height - ship.height) ship.y += ship.speed;
}

// Draw Player Ship
function drawPlayer() {
    ctx.drawImage(ship.img, ship.x, ship.y, ship.width, ship.height);
}

// Handle Bullet Shooting with Cooldown (Shoot every 300ms)
function shootBullet() {
    const now = Date.now();
    if (spacePressed && now - lastShotTime >= 300) { // Shoot every 300 ms
        bullets.push({ x: ship.x + ship.width / 2 - 2, y: ship.y, width: 4, height: 10, speed: 5 });
        pewPewSound.play();
        lastShotTime = now; // Update the last shot time
    }
}

// Handle Collisions
function handleCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width && bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height && bullet.y + bullet.height > enemy.y) {
                // Bullet hits enemy
                enemies.splice(enemyIndex, 1);
                bullets.splice(bulletIndex, 1);
                score += 1; // 1 point per kill
                if (score % 10 === 0) {
                    levelUp(); // Transition to next level after 10 kills
                }
            }
        });
    });

    bossBullets.forEach((bullet, bulletIndex) => {
        if (bullet.x < ship.x + ship.width && bullet.x + bullet.width > ship.x &&
            bullet.y < ship.y + ship.height && bullet.y + bullet.height > ship.y) {
            health -= 1;
            bossBullets.splice(bulletIndex, 1);
            if (health <= 0) {
                endGame();
            }
        }
    });

    enemies.forEach(enemy => {
        if (enemy.x < ship.x + ship.width && enemy.x + enemy.width > ship.x &&
            enemy.y < ship.y + ship.height && enemy.y + enemy.height > ship.y) {
            // Enemy hits player
            health -= 1;
            enemies.splice(enemies.indexOf(enemy), 1);
            if (health <= 0) endGame();
        }
    });
}

// Draw Score, Health Bar, and Level
function drawUI() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Health: ${health}`, 20, 60);
    ctx.fillText(`Level: ${level}`, canvas.width - 120, 30);
}

// Level Transition Function
function levelUp() {
    if (level === 1) {
        level = 2;
        levelChangeSound.play();
        spawnEnemies(); // Increase difficulty for level 2
    } else if (level === 2) {
        level = 3;
        levelChangeSound.play();
        spawnEnemies(); // Boss spawn for level 3
        spawnBoss(); // Spawn boss at level 3
    }
}

// End Game Function
function endGame() {
    isPlaying = false;
    alert('Game Over!');
    location.reload(); // Reload the game
}

// Key Listeners for Movement and Shooting
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') leftArrowPressed = true;
    if (e.key === 'ArrowRight') rightArrowPressed = true;
    if (e.key === 'ArrowUp') upArrowPressed = true;
    if (e.key === 'ArrowDown') downArrowPressed = true;
    if (e.key === ' ') spacePressed = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') leftArrowPressed = false;
    if (e.key === 'ArrowRight') rightArrowPressed = false;
    if (e.key === 'ArrowUp') upArrowPressed = false;
    if (e.key === 'ArrowDown') downArrowPressed = false;
    if (e.key === ' ') spacePressed = false;
});
