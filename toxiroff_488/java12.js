const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.querySelector('.score');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [
    { x: 10, y: 10 },
];
let food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount),
};
let obstacles = []; // To'siqlar massivi
let dx = 0;
let dy = 0;
let score = 0;
let gameSpeed = 100; // Boshlang'ich tezlik
let isFastMode = false; // Tez rejim holati
let isSlowMode = false; // Sekin rejim holati
let isWrapAround = false; // Wraparound rejim holati (boshlang'ichda o'chirilgan)

document.addEventListener('keydown', changeDirection);

// To'siqlarni tasodifiy yaratish funksiyasi (5 ta to'siq bilan boshlaymiz)
function generateObstacles() {
    obstacles = [];
    for (let i = 0; i < 5; i++) { // 5 ta to'siq
        let obstacle;
        do {
            obstacle = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount),
            };
        } while (snake.some(segment => segment.x === obstacle.x && segment.y === obstacle.y) || // Ilonga to'g'ri kelmasligi
        obstacle.x === food.x && obstacle.y === food.y || // Ovqatga to'g'ri kelmasligi
        obstacles.some(obs => obs.x === obstacle.x && obs.y === obstacle.y)); // Boshqa to'siqlarga to'g'ri kelmasligi
        obstacles.push(obstacle);
    }
}

// Tugmalar bilan boshqarish funksiyalari
function toggleFastMode() {
    isFastMode = !isFastMode;
    isSlowMode = false; // Tez rejim ochilsa, sekin rejim o'chiriladi
    updateGameSpeed();
}

function toggleSlowMode() {
    isSlowMode = !isSlowMode;
    isFastMode = false; // Sekin rejim ochilsa, tez rejim o'chiriladi
    updateGameSpeed();
}

// Wraparound rejimini yoqish/ochirish funksiyalari
function toggleWrapAround() {
    isWrapAround = true; // Wraparound yoqiladi
    console.log("Wraparound rejimi yoqildi!");
}

function disableWrapAround() {
    isWrapAround = false; // Wraparound o'chiriladi
    console.log("Wraparound rejimi o'chirildi!");
}

// Tezlikni yangilash funksiyasi
function updateGameSpeed() {
    if (isFastMode) {
        gameSpeed = 50; // Tez rejim (50 ms)
    } else if (isSlowMode) {
        gameSpeed = 200; // Sekin rejim (200 ms)
    } else {
        gameSpeed = 100; // Boshlang'ich tezlik
    }
    clearInterval(gameInterval); // Eski intervalni to'xtatish
    gameInterval = setInterval(drawGame, gameSpeed); // Yangi tezlik bilan boshlash
}

// Wraparound effekti uchun funksiya
function wrapAround(head) {
    head.x = (head.x + tileCount) % tileCount; // X o'qi uchun
    head.y = (head.y + tileCount) % tileCount; // Y o'qi uchun
    return head;
}

function changeDirection(event) {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -1;
        dy = 0;
    }
    if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -1;
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = 1;
        dy = 0;
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = 1;
    }
    // Tez, sekin va wraparound rejimlar uchun tugmalar
    if (keyPressed === 84) { // 'T' tugmasi - Tez rejim
        toggleFastMode();
    }
    if (keyPressed === 83) { // 'S' tugmasi - Sekin rejim
        toggleSlowMode();
    }
    if (keyPressed === 87) { // 'W' tugmasi - Wraparound yoq
        toggleWrapAround();
    }
    if (keyPressed === 81) { // 'Q' tugmasi - Wraparound o'chir
        disableWrapAround();
    }
}

function drawGame() {
    // Harakatlanish
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Devorga urilishni tekshirish va wraparound yoki o'yin tugashi
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        if (isWrapAround) {
            head = wrapAround(head); // Wraparound yoqilgan bo'lsa, boshqa tomonidan chiqadi
        } else {
            gameOver(); // Wraparound o'chirilgan bo'lsa, o'yin tugaydi
            return;
        }
    }

    // To'siqlarga urilishni tekshirish
    if (obstacles.some(obstacle => head.x === obstacle.x && head.y === obstacle.y)) {
        gameOver(); // To'siqqa urilgan taqdirda o'yin tugaydi
        return;
    }

    snake.unshift(head);

    // Ovqatni yegan tekshiruvi
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = `Ball: ${score}`;
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount),
        };
        // Yangi ovqat to'siqlarga yoki ilonga to'g'ri kelmasligi kerak
        while (snake.some(segment => segment.x === food.x && segment.y === food.y) ||
        obstacles.some(obstacle => obstacle.x === food.x && obstacle.y === food.y)) {
            food = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount),
            };
        }
        gameSpeed *= 0.95; // O‘yin tezroq bo‘ladi
        updateGameSpeed(); // Tezlikni yangilash
    } else {
        snake.pop();
    }

    // To‘qnashuv tekshiruvi (o'ziga urilish uchun)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    // Chizish
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'green';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });

    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

    // To'siqlarni chizish
    ctx.fillStyle = 'gray'; // To'siqlar kulrang bo'ladi
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function gameOver() {
    alert(`O‘yin tugadi! Sizning ballingiz: ${score}`);
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.textContent = `Ball: ${score}`;
    gameSpeed = 100;
    isFastMode = false;
    isSlowMode = false;
    isWrapAround = false; // Wraparound o'chiriladi
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
    };
    generateObstacles(); // O'yin qayta boshlanganda yangi to'siqlar yaratiladi
    updateGameSpeed();
}

let gameInterval = setInterval(drawGame, gameSpeed);

// O'yin boshlanganda to'siqlar yaratiladi
generateObstacles();
