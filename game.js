/* ==========================================
   REFERENCIAS DOM
========================================== */

const player = document.getElementById("player");
const world = document.getElementById("world");
const game = document.getElementById("game");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const coinsEl = document.getElementById("coinsCount");
const successSound = document.getElementById("successSound");
const jumpSound = document.getElementById("jumpSound");
const gameOverSound = document.getElementById("gameOverSound");

const quizModal = document.getElementById("quizModal");
const quizTitle = document.getElementById("quizTitle");
const quizText = document.getElementById("quizText");
const quizAnswers = document.getElementById("quizAnswers");

const victoryScreen = document.getElementById("victoryScreen");
const gameOverScreen = document.getElementById("gameOver");

const startButton = document.getElementById("startButton");

const boss = document.getElementById("boss");
const bossObjective = document.getElementById("bossObjective");
const bossHealthEl = document.getElementById("bossHealth");
const bossMission = document.getElementById("bossMission");

let audioContext;
let backgroundMusicTimer;
let musicStep = 0;
let bossPhase = 0;
let lastEnemyHit = 0;
let bossHealth = 5;
let bossDefeated = false;
let lastBossAttack = 0;
const bossAttacks = [];

/* ==========================================
   ESTADO DEL JUEGO
========================================== */

let score = 0;
let lives = 3;
let recoveredValues = 0;

let gameStarted = false;
let gamePaused = false;

let playerX = 120;
let playerY = 0;
let previousPlayerBottom = 100;

let velocityY = 0;

const gravity = 0.8;
const jumpForce = -16;
const speed = 6;

let onGround = false;
let jumpsRemaining = 2;
let lastTouchTime = 0;
let activeTouchKey;

/* ==========================================
   CONTROLES
========================================== */

const keys = {};

function jump(){

    if(
        jumpsRemaining > 0 &&
        !gamePaused
    ){

        velocityY = jumpForce;
        onGround = false;
        jumpsRemaining--;
        playSound(jumpSound, 520, 0.1);

    }

}

document.addEventListener("keydown", (e) => {

    keys[e.code] = true;

    if (
        (e.code === "Space" || e.code === "ArrowUp")
        && !e.repeat
    ) {

        jump();

    }

});

document.addEventListener("keyup", (e) => {

    keys[e.code] = false;

});

game.addEventListener("pointerdown", (event)=>{

    if(event.pointerType !== "touch" || gamePaused){
        return;
    }

    event.preventDefault();

    const now = performance.now();
    const isDoubleTap = now - lastTouchTime < 320;
    lastTouchTime = now;

    if(isDoubleTap){
        keys["ArrowLeft"] = false;
        keys["ArrowRight"] = false;
        activeTouchKey = undefined;
        jump();
        return;
    }

    activeTouchKey =
        event.clientX < window.innerWidth / 2
            ? "ArrowLeft"
            : "ArrowRight";

    keys[activeTouchKey] = true;

});

game.addEventListener("pointerup", (event)=>{

    if(event.pointerType !== "touch"){
        return;
    }

    event.preventDefault();

    if(activeTouchKey){
        keys[activeTouchKey] = false;
        activeTouchKey = undefined;
    }

});

game.addEventListener("pointercancel", ()=>{

    keys["ArrowLeft"] = false;
    keys["ArrowRight"] = false;
    activeTouchKey = undefined;

});

/* ==========================================
   PREGUNTAS
========================================== */

const questions = [

{
value:"Honestidad",
question:"Encuentras un error que favorece a tu equipo.",
answers:[
"Ocultarlo",
"Corregirlo e informar",
"Esperar"
],
correct:1,
panel:"val1"
},

{
value:"Respeto",
question:"Un compañero opina diferente.",
answers:[
"Escucharlo atentamente",
"Interrumpirlo",
"Ignorarlo"
],
correct:0,
panel:"val2"
},

{
value:"Compromiso",
question:"Existe una tarea crítica.",
answers:[
"Apoyar al equipo",
"Evadirla",
"Delegarla"
],
correct:0,
panel:"val3"
},

{
value:"Diligencia",
question:"Un cliente requiere atención urgente.",
answers:[
"Responder rápidamente",
"Esperar varios días",
"Ignorar la solicitud"
],
correct:0,
panel:"val4"
},

{
value:"Justicia",
question:"Debes elegir entre varios candidatos.",
answers:[
"Elegir objetivamente",
"Elegir amigos",
"Elegir al azar"
],
correct:0,
panel:"val5"
},

{
value:"Resiliencia",
question:"Un proyecto fracasa.",
answers:[
"Aprender y mejorar",
"Rendirse",
"Culpar"
],
correct:0,
panel:"val6"
},

{
value:"Solidaridad",
question:"Un compañero necesita ayuda.",
answers:[
"Brindar apoyo",
"Ignorarlo",
"Criticarlo"
],
correct:0,
panel:"val7"
}

];

/* ==========================================
   ARRAYS DEL JUEGO
========================================== */

const enemies = [];
const coins = [];
const platforms = [];

/* ==========================================
   PLATAFORMAS
========================================== */

function createPlatform(x,y,width){

    const p = document.createElement("div");

    p.className = "platform";

    p.style.left = x + "px";
    p.style.bottom = y + "px";
    p.style.width = width + "px";

    world.appendChild(p);

    platforms.push({
        x,
        y,
        width,
        height:25
    });

}

createPlatform(500,160,240);
createPlatform(1400,300,240);
createPlatform(2400,160,240);
createPlatform(3300,300,240);
createPlatform(4200,180,240);
createPlatform(5100,300,240);

/* ==========================================
   ENEMIGOS
========================================== */

function createEnemy(x){

    const enemy = document.createElement("div");

    enemy.className = "enemy";

    enemy.innerHTML = "👹";

    enemy.style.left = x + "px";
    enemy.style.bottom = "100px";

    world.appendChild(enemy);

    enemies.push({

        element:enemy,

        x:x,

        start:x,

        direction:1

    });

}

[
    760, 1120, 1720, 2200, 2780, 3150,
    3650, 4050, 4550, 4900, 5350
].forEach(createEnemy);

/* ==========================================
   MONEDAS
========================================== */

function createCoin(x,y,index){

    const coin = document.createElement("div");

    coin.className = "coin";
    coin.innerHTML = "🪙";

    coin.style.left = x+"px";
    coin.style.bottom = y+"px";

    world.appendChild(coin);

    coins.push({

        element:coin,

        x:x,

        y:y,

        question:index,

        collected:false

    });

}

const coinLocations = [
    {x:575, y:215},
    {x:1475, y:355},
    {x:2475, y:215},
    {x:3375, y:355},
    {x:4275, y:235},
    {x:4800, y:100},
    {x:5175, y:355}
];

coinLocations.forEach((location,index)=>{

    createCoin(
        location.x,
        location.y,
        index
    );

});

/* ==========================================
   HUD
========================================== */

function updateHud(){

    scoreEl.textContent = score;
    livesEl.textContent = lives;
    coinsEl.textContent = recoveredValues;

}

function playSound(audioElement, frequency, duration){

    if(!audioContext){
        audioContext = new AudioContext();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.06, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);

    if(audioElement && audioElement.src){
        audioElement.currentTime = 0;
        audioElement.play().catch(()=>{});
    }

}

function startBackgroundMusic(){

    if(backgroundMusicTimer){
        return;
    }

    audioContext.resume();

    const notes = [196, 247, 294, 247, 220, 262, 330, 262];

    backgroundMusicTimer = setInterval(()=>{

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;

        oscillator.type = "triangle";
        oscillator.frequency.value =
            notes[musicStep % notes.length];
        gain.gain.setValueAtTime(0.018, now);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.75
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.8);

        musicStep++;

    }, 850);

}

/* ==========================================
   PREGUNTA
========================================== */

function openQuestion(data){

    gamePaused = true;

    quizModal.style.display = "flex";

    quizTitle.innerHTML =
        "🪙 " + data.value;

    quizText.innerHTML =
        data.question;

    quizAnswers.innerHTML = "";

    const shuffledAnswers =
        data.answers
        .map((answer,index)=>({
            answer,
            originalIndex:index
        }))
        .sort(()=>Math.random() - 0.5);
    const correctPosition =
        shuffledAnswers.findIndex(option=>{
            return option.originalIndex === data.correct;
        });

    if(correctPosition === 0 && shuffledAnswers.length > 1){

        [
            shuffledAnswers[0],
            shuffledAnswers[1]
        ] = [
            shuffledAnswers[1],
            shuffledAnswers[0]
        ];

    }

    shuffledAnswers.forEach(option=>{

        const button =
        document.createElement("button");

        button.className = "answerBtn";

        button.textContent =
        option.answer;

        button.onclick = ()=>{

            if(option.originalIndex === data.correct){

                score += 100;

                recoveredValues++;

                document
                .getElementById(data.panel)
                .classList.add(
                    "valueCompleted"
                );

            }else{

                lives--;

            }

            updateHud();

            quizModal.style.display =
            "none";

            gamePaused = false;

            if(lives<=0){

                gameOverScreen.style.display =
                "flex";

            }

        };

        quizAnswers.appendChild(button);

    });

}

/* ==========================================
   COLISIONES
========================================== */

function overlap(a,b){

    return (

        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y

    );

}

function getHitbox(element, insetX, insetY){

    const rect = element.getBoundingClientRect();

    return {
        x:rect.left + insetX,
        y:rect.top + insetY,
        width:Math.max(0, rect.width - (insetX * 2)),
        height:Math.max(0, rect.height - (insetY * 2))
    };

}

/* ==========================================
   MONEDAS
========================================== */

function checkCoins(){

    const playerHitbox =
        getHitbox(player, 12, 12);

    const touchedCoin =
        coins.find(coin=>{

        if(coin.collected) return false;

        const coinHitbox =
            getHitbox(coin.element, 7, 7);

        return overlap(playerHitbox, coinHitbox);

    });

    if(touchedCoin){

        touchedCoin.collected = true;

        touchedCoin.element.remove();
        score += 25;
        playSound(successSound, 780, 0.18);

        openQuestion(
            questions[touchedCoin.question]
        );

    }

}

/* ==========================================
   ENEMIGOS
========================================== */

function updateEnemies(){

    enemies.forEach(enemy=>{

        enemy.x += enemy.direction * 2;

        if(enemy.x > enemy.start+100){

            enemy.direction = -1;

        }

        if(enemy.x < enemy.start-100){

            enemy.direction = 1;

        }

        enemy.element.style.left =
        enemy.x + "px";

        if(
            Math.abs(playerX - enemy.x) < 50 &&
            Math.abs(playerY) < 30 &&
            performance.now() - lastEnemyHit > 1000
        ){

            lives--;
            lastEnemyHit = performance.now();
            playSound(gameOverSound, 120, 0.22);
            player.classList.remove("playerHit");
            enemy.element.classList.remove("enemyHit");
            void player.offsetWidth;
            void enemy.element.offsetWidth;
            player.classList.add("playerHit");
            enemy.element.classList.add("enemyHit");
            game.classList.add("collisionShake");

            setTimeout(()=>{
                player.classList.remove("playerHit");
                enemy.element.classList.remove("enemyHit");
                game.classList.remove("collisionShake");
            }, 420);

            playerX = 120;
            playerY = 0;
            velocityY = 0;
            onGround = true;
            jumpsRemaining = 2;

            updateHud();

            if(lives<=0){

                gameOverScreen.style.display =
                "flex";

                gamePaused=true;
            }

        }

    });

}

function createBossAttack(){

    const attack = document.createElement("div");

    attack.className = "bossAttack";
    attack.innerHTML = "🔥";
    attack.style.left = "5580px";
    attack.style.bottom = "145px";
    world.appendChild(attack);

    bossAttacks.push({
        element:attack,
        x:5580
    });

}

function updateBossAttacks(){

    bossAttacks.forEach(attack=>{

        attack.x -= 8;
        attack.element.style.left = attack.x + "px";

        if(
            attack.x < playerX + 60 &&
            attack.x + 35 > playerX &&
            Math.abs(playerY) < 70
        ){

            attack.element.remove();
            attack.hit = true;
            lives--;
            playerX = 120;
            playerY = 0;
            velocityY = 0;
            jumpsRemaining = 2;
            updateHud();
            playSound(gameOverSound, 120, 0.22);

            if(lives <= 0){
                gameOverScreen.style.display = "flex";
                gamePaused = true;
            }

        }

    });

    for(let i = bossAttacks.length - 1; i >= 0; i--){

        if(
            bossAttacks[i].hit ||
            bossAttacks[i].x < playerX - 900
        ){

            bossAttacks[i].element.remove();
            bossAttacks.splice(i, 1);

        }

    }

}

function damageBoss(){

    bossHealth--;
    score += 200;
    velocityY = jumpForce;
    boss.classList.remove("bossDamaged");
    void boss.offsetWidth;
    boss.classList.add("bossDamaged");
    playSound(successSound, 300 + (bossHealth * 60), 0.2);
    bossHealthEl.textContent =
        "Vida: " + bossHealth + "/5";

    if(bossHealth <= 0){

        bossDefeated = true;
        bossPhase = 4;
        boss.className = "bossDefeated";
        boss.innerHTML = "🏆";
        bossObjective.textContent =
            "¡Jefe derrotado! Misión completada";
        playSound(successSound, 1040, 0.5);

    }

}

function checkBossStomp(){

    if(
        recoveredValues !== 7 ||
        bossDefeated ||
        velocityY < 0
    ){
        return;
    }

    const playerRect =
        player.getBoundingClientRect();
    const bossRect =
        boss.getBoundingClientRect();
    const playerBottom =
        playerRect.bottom;
    const overlapsBoss =
        playerRect.left < bossRect.right &&
        playerRect.right > bossRect.left;
    const crossedBossTop =
        previousPlayerBottom >= bossRect.top &&
        playerBottom <= bossRect.top + 32;
    const playerIsAboveBoss =
        playerRect.top < bossRect.top;

    if(
        overlapsBoss &&
        crossedBossTop &&
        playerIsAboveBoss
    ){

        damageBoss();

    }

}

/* ==========================================
   VICTORIA
========================================== */

function checkVictory(){

    if(

        bossDefeated

    ){

        victoryScreen.style.display =
        "flex";

        gamePaused=true;
        playSound(successSound, 980, 0.35);

    }

}

/* ==========================================
   MOVIMIENTO
========================================== */

function updatePlayer(){

    if(keys["ArrowRight"]){
        playerX += speed;
    }

    if(keys["ArrowLeft"]){
        playerX -= speed;
    }

    playerX = Math.max(
        0,
        Math.min(5900, playerX)
    );

    previousPlayerBottom =
        player.getBoundingClientRect().bottom;

    velocityY += gravity;

    playerY += velocityY;

    onGround = false;

    /* suelo */
    if(playerY > 0){

        playerY = 0;
        velocityY = 0;
        onGround = true;
        jumpsRemaining = 2;

    }

    /* plataformas: solo se puede aterrizar al caer desde arriba */
    if(velocityY >= 0){

        const playerBottom =
            100 - playerY;

        platforms.some(platform=>{

            const platformTop =
                platform.y + platform.height;

            const overlapsHorizontally =
                playerX < platform.x + platform.width &&
                playerX + 70 > platform.x;

            const crossesPlatformTop =
                previousPlayerBottom >= platformTop &&
                playerBottom <= platformTop;

            if(
                overlapsHorizontally &&
                crossesPlatformTop
            ){

                playerY =
                    100 - platformTop;

                velocityY = 0;
                onGround = true;
                jumpsRemaining = 2;

                return true;

            }

            return false;

        });

    }

    player.style.left = playerX + "px";

    player.style.bottom =
        (100 - playerY) + "px";

}

/* ==========================================
   CAMARA
========================================== */

function updateCamera(){

    game.scrollLeft =
    Math.max(
        0,
        playerX - 400
    );

}

/* ==========================================
   JEFE FINAL
========================================== */

function checkBoss(){

    if(recoveredValues !== 7){
        return;
    }

    if(bossPhase === 0){
        bossPhase = 1;
        bossMission.style.display = "flex";
        bossObjective.textContent =
            "¡Derrota al jefe saltando sobre él 5 veces!";
        boss.className = "bossPhase1";
        bossHealthEl.textContent = "Vida: 5/5";
    }

    if(bossDefeated){
        return;
    }

    let nextPhase = 1;

    if(bossHealth <= 2){
        nextPhase = 3;
    }else if(bossHealth <= 4){
        nextPhase = 2;
    }

    if(nextPhase !== bossPhase){

        bossPhase = nextPhase;
        boss.className = "bossPhase" + bossPhase;
        boss.innerHTML = ["😈", "👿", "💀"][bossPhase - 1];
        playSound(successSound, 260 + (bossPhase * 100), 0.2);

    }

    if(performance.now() - lastBossAttack > 1100){
        createBossAttack();
        lastBossAttack = performance.now();
    }

}

/* ==========================================
   LOOP
========================================== */

function loop(){

    if(
        gameStarted &&
        !gamePaused
    ){

        updatePlayer();

        updateEnemies();

        updateCamera();

        checkCoins();

        checkBossStomp();
        checkBoss();
        updateBossAttacks();

        checkVictory();

    }

    requestAnimationFrame(loop);

}

/* ==========================================
   START
========================================== */

startButton.onclick = ()=>{

    document
    .getElementById(
        "welcomeScreen"
    )
    .style.display = "none";

    gameStarted = true;
    if(!audioContext){
        audioContext = new AudioContext();
    }
    startBackgroundMusic();

    loop();

};

/* ==========================================
   HUD INICIAL
========================================== */

updateHud();