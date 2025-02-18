class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    multiply(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    clone() {
        return new Vector2D(this.x, this.y);
    }
}

class Particle {
    constructor(x, y, color) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
        );
        this.acceleration = new Vector2D(0, 0);
        this.color = color;
        this.alpha = 1;
        this.life = 1;
        this.decay = 0.01 + Math.random() * 0.02;
        this.size = 2 + Math.random() * 3;
    }

    update() {
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        this.life -= this.decay;
        this.alpha = this.life;
        this.velocity.multiply(0.98);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    update() {
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => p.update());
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.velocity = new Vector2D();
        this.acceleration = new Vector2D();
        this.friction = 0.98;
        this.speed = 0.5;
        this.targetX = x;
        this.targetY = y;
        this.state = 'chase'; // chase, intercept, position
        this.stateTimer = 0;
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    predictBallPosition(ball, steps = 10) {
        let futureX = ball.x + ball.velocity.x * steps;
        let futureY = ball.y + ball.velocity.y * steps;
        return { x: futureX, y: futureY };
    }

    update(ball, goalAngle, arenaRadius, centerX, centerY) {
        const prediction = this.predictBallPosition(ball);
        const goalX = centerX + Math.cos(goalAngle) * arenaRadius;
        const goalY = centerY + Math.sin(goalAngle) * arenaRadius;
        
        // Calculate distances
        const distToBall = Math.sqrt(Math.pow(ball.x - this.x, 2) + Math.pow(ball.y - this.y, 2));
        const ballSpeed = Math.sqrt(Math.pow(ball.velocity.x, 2) + Math.pow(ball.velocity.y, 2));
        
        // Update state
        this.stateTimer--;
        if (this.stateTimer <= 0) {
            if (ballSpeed < 0.5) {
                this.state = 'position';
                this.stateTimer = 60;
            } else if (distToBall > 100) {
                this.state = 'chase';
                this.stateTimer = 30;
            } else {
                this.state = 'intercept';
                this.stateTimer = 15;
            }
        }

        // Act based on state
        switch (this.state) {
            case 'position':
                const angleToGoal = Math.atan2(goalY - ball.y, goalX - ball.x);
                this.targetX = ball.x - Math.cos(angleToGoal) * 80;
                this.targetY = ball.y - Math.sin(angleToGoal) * 80;
                break;

            case 'chase':
                this.targetX = ball.x;
                this.targetY = ball.y;
                break;

            case 'intercept':
                this.targetX = prediction.x;
                this.targetY = prediction.y;
                break;
        }
        
        // Move towards target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.acceleration.x = (dx / distance) * this.speed;
            this.acceleration.y = (dy / distance) * this.speed;
        }

        // Apply acceleration to velocity
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;

        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }

    draw(ctx, theme) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = theme.primary;
        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.primary;
        ctx.fill();
        
        // Draw inner circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
    }
}

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.velocity = new Vector2D();
        this.minSpeed = 2;
        this.maxSpeed = 8;
    }

    randomizeVelocity() {
        const speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);
        const angle = Math.random() * Math.PI * 2;
        this.velocity.x = Math.cos(angle) * speed;
        this.velocity.y = Math.sin(angle) * speed;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Apply friction
        this.velocity.x *= 0.98;
        this.velocity.y *= 0.98;
    }

    draw(ctx, theme) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = theme.primary;
        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.primary;
        ctx.fill();
        
        // Draw inner circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
    }
}

class Game {
    constructor() {
        // Initialize particle system
        this.particles = new ParticleSystem();
        this.trailParticles = new ParticleSystem();
        this.goalParticles = new ParticleSystem();
        
        // Animation properties
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;
        this.flashIntensity = 0;
        this.flashDecay = 0.95;
        this.goalFlashColor = 'rgba(255, 255, 255, 0)';
        
        // Trail settings
        this.lastTrailPosition = null;
        this.trailInterval = 2; // Emit trail every N frames
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.score = 0;
        this.lastScoreTime = 0;
        this.arenaRadius = 350;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.goalWidth = 80;
        this.goalHeight = 20;
        this.goalAngle = 0;
        this.goalRotationSpeed = 0.015;
        
        // Visual effects
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.maxGlow = 20;
        this.minGlow = 5;
        this.glowSpeed = 0.5;

        // Theme support
        this.currentTheme = {
            primary: '#4af7ff',
            glow: '0 0 10px #4af7ff'
        };

        // Auto-play settings
        this.difficultyLevel = 0.8; // 0 to 1, higher is more difficult
        this.reactionDelay = 5; // Frames to wait before reacting
        this.lastUpdateFrame = 0;
        
        this.init();
    }

    init() {
        this.player = new Player(this.centerX, this.centerY);
        this.ball = new Ball(this.centerX, this.centerY);

        // Initialize scores from localStorage
        const personalBestElement = document.getElementById('personalBest');
        personalBestElement.textContent = localStorage.getItem('personalBest') || '0';

        const dailyBestElement = document.getElementById('dailyBest');
        const dailyBestData = JSON.parse(localStorage.getItem('dailyBest') || '{}');
        const today = new Date().toDateString();
        if (dailyBestData.date !== today) {
            dailyBestData.date = today;
            dailyBestData.score = 0;
            localStorage.setItem('dailyBest', JSON.stringify(dailyBestData));
        }
        dailyBestElement.textContent = dailyBestData.score;

        // Mouse move event listener
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        // Initialize color picker
        this.initColorPicker();

        this.gameLoop();
    }

    initColorPicker() {
        const colorOptions = document.querySelectorAll('.color-option');
        const savedColor = localStorage.getItem('themeColor');

        if (savedColor) {
            this.setTheme(savedColor);
            colorOptions.forEach(option => {
                if (option.dataset.color === savedColor) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        }

        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = option.dataset.color;
                this.setTheme(color);
                localStorage.setItem('themeColor', color);

                // Update active state
                colorOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });
    }

    drawArena() {
        // Update glow effect
        this.glowIntensity += this.glowDirection * this.glowSpeed;
        if (this.glowIntensity >= this.maxGlow || this.glowIntensity <= this.minGlow) {
            this.glowDirection *= -1;
        }

        // Draw outer glow
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.arenaRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = this.glowIntensity;
        this.ctx.shadowColor = this.currentTheme.primary;
        this.ctx.stroke();

        // Draw inner line
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.arenaRadius - 5, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.currentTheme.primary;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawGoal() {
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.goalAngle);
        
        // Draw goal with glow effect
        this.ctx.fillStyle = '#4af7ff';
        this.ctx.shadowBlur = this.glowIntensity;
        this.ctx.shadowColor = '#4af7ff';
        
        // Draw goal posts
        const postWidth = 4;
        this.ctx.fillRect(this.arenaRadius - this.goalHeight, -this.goalWidth / 2 - postWidth, 
                         this.goalHeight, postWidth); // Top post
        this.ctx.fillRect(this.arenaRadius - this.goalHeight, this.goalWidth / 2, 
                         this.goalHeight, postWidth); // Bottom post
        
        this.ctx.restore();
    }

    addScreenShake(intensity) {
        this.shakeIntensity = intensity;
    }

    addScreenFlash(intensity, color) {
        this.flashIntensity = intensity;
        this.goalFlashColor = color;
    }

    updateEffects() {
        // Update particle systems
        this.particles.update();
        this.trailParticles.update();
        this.goalParticles.update();

        // Update screen shake
        this.shakeIntensity *= this.shakeDecay;

        // Update screen flash
        this.flashIntensity *= this.flashDecay;
    }

    updateTrails() {
        // Add trail particles behind the ball
        if (!this.lastTrailPosition) {
            this.lastTrailPosition = new Vector2D(this.ball.x, this.ball.y);
        }

        const dist = Math.sqrt(
            Math.pow(this.ball.x - this.lastTrailPosition.x, 2) +
            Math.pow(this.ball.y - this.lastTrailPosition.y, 2)
        );

        if (dist > this.trailInterval) {
            this.trailParticles.emit(
                this.ball.x,
                this.ball.y,
                1,
                this.currentTheme.primary
            );
            this.lastTrailPosition.x = this.ball.x;
            this.lastTrailPosition.y = this.ball.y;
        }
    }

    checkGoalCollision() {
        // Convert ball position to relative coordinates
        const relX = this.ball.x - this.centerX;
        const relY = this.ball.y - this.centerY;
        
        // Calculate ball's angle relative to center
        const ballAngle = Math.atan2(relY, relX);
        
        // Calculate distance from center
        const distance = Math.sqrt(relX * relX + relY * relY);
        
        // Check if ball is near the arena edge
        if (Math.abs(distance - this.arenaRadius) < this.goalHeight) {
            // Calculate angle difference
            let angleDiff = (ballAngle - this.goalAngle) % (Math.PI * 2);
            if (angleDiff < 0) angleDiff += Math.PI * 2;
            
            // Convert goal width to angle
            const goalAngleWidth = Math.atan2(this.goalWidth / 2, this.arenaRadius);
            
            // Check if ball is within goal angle
            if (angleDiff < goalAngleWidth || angleDiff > Math.PI * 2 - goalAngleWidth) {
                const currentTime = performance.now();
                if (currentTime - this.lastScoreTime > 1000) { // Prevent multiple scores within 1 second
                    this.score++;
                    
                    // Add goal effects
                    this.addScreenShake(10);
                    this.addScreenFlash(1, this.currentTheme.primary);
                    
                    // Add particle burst
                    this.goalParticles.emit(
                        this.ball.x,
                        this.ball.y,
                        50,
                        this.currentTheme.primary
                    );
                    this.lastScoreTime = currentTime;
                    
                    // Reset ball position
                    this.ball.x = this.centerX;
                    this.ball.y = this.centerY;
                    this.ball.velocity = new Vector2D();
                }
            }
        }
    }

    checkPlayerBallCollision() {
        const dx = this.ball.x - this.player.x;
        const dy = this.ball.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (this.player.size / 2 + this.ball.radius)) {
            // Add collision effects
            this.addScreenShake(5);
            this.particles.emit(
                this.ball.x,
                this.ball.y,
                20,
                this.currentTheme.primary
            );
            // Calculate collision angle
            const angle = Math.atan2(dy, dx);
            
            // Transfer player velocity to ball
            const power = Math.sqrt(
                this.player.velocity.x * this.player.velocity.x + 
                this.player.velocity.y * this.player.velocity.y
            );
            
            this.ball.velocity.x = Math.cos(angle) * power * 2;
            this.ball.velocity.y = Math.sin(angle) * power * 2;
            
            // Separate ball and player
            const separation = (this.player.size / 2 + this.ball.radius) - distance;
            this.ball.x += Math.cos(angle) * separation;
            this.ball.y += Math.sin(angle) * separation;
        }
    }

    checkBounds() {
        // Check ball bounds
        const ballDistanceFromCenter = Math.sqrt(
            Math.pow(this.ball.x - this.centerX, 2) + 
            Math.pow(this.ball.y - this.centerY, 2)
        );
        
        if (ballDistanceFromCenter > this.arenaRadius - this.ball.radius) {
            const angle = Math.atan2(
                this.ball.y - this.centerY,
                this.ball.x - this.centerX
            );
            
            // Place ball at boundary
            this.ball.x = this.centerX + Math.cos(angle) * (this.arenaRadius - this.ball.radius);
            this.ball.y = this.centerY + Math.sin(angle) * (this.arenaRadius - this.ball.radius);
            
            // Bounce
            const normalX = Math.cos(angle);
            const normalY = Math.sin(angle);
            const dot = this.ball.velocity.x * normalX + this.ball.velocity.y * normalY;
            
            this.ball.velocity.x -= 2 * dot * normalX;
            this.ball.velocity.y -= 2 * dot * normalY;
            
            // Add some energy loss
            this.ball.velocity.x *= 0.8;
            this.ball.velocity.y *= 0.8;
        }
        
        // Check player bounds
        const playerDistanceFromCenter = Math.sqrt(
            Math.pow(this.player.x - this.centerX, 2) + 
            Math.pow(this.player.y - this.centerY, 2)
        );
        
        if (playerDistanceFromCenter > this.arenaRadius - this.player.size / 2) {
            const angle = Math.atan2(
                this.player.y - this.centerY,
                this.player.x - this.centerX
            );
            
            this.player.x = this.centerX + Math.cos(angle) * (this.arenaRadius - this.player.size / 2);
            this.player.y = this.centerY + Math.sin(angle) * (this.arenaRadius - this.player.size / 2);
            
            this.player.velocity.x *= 0.5;
            this.player.velocity.y *= 0.5;
        }
    }

    updateScores() {
        // Update current score
        this.scoreElement.textContent = this.score;

        // Update personal best
        const personalBestElement = document.getElementById('personalBest');
        const currentPersonalBest = parseInt(localStorage.getItem('personalBest') || '0');
        if (this.score > currentPersonalBest) {
            localStorage.setItem('personalBest', this.score.toString());
            personalBestElement.textContent = this.score;
        } else {
            personalBestElement.textContent = currentPersonalBest;
        }

        // Update daily best
        const dailyBestElement = document.getElementById('dailyBest');
        const today = new Date().toDateString();
        const dailyBestData = JSON.parse(localStorage.getItem('dailyBest') || '{}');
        
        if (dailyBestData.date !== today) {
            dailyBestData.date = today;
            dailyBestData.score = this.score;
        } else if (this.score > dailyBestData.score) {
            dailyBestData.score = this.score;
        }
        
        localStorage.setItem('dailyBest', JSON.stringify(dailyBestData));
        dailyBestElement.textContent = dailyBestData.score;
    }

    update() {
        // Update effects first
        this.updateEffects();
        this.updateTrails();

        this.goalAngle += this.goalRotationSpeed;
        this.player.update(this.ball, this.goalAngle, this.arenaRadius, this.centerX, this.centerY);
        this.ball.update();
        
        this.checkPlayerBallCollision();
        this.checkGoalCollision();
        this.checkBounds();
        this.updateScores();

        // Reset ball if it's too slow
        const ballSpeed = Math.sqrt(this.ball.velocity.x * this.ball.velocity.x + this.ball.velocity.y * this.ball.velocity.y);
        if (ballSpeed < this.ball.minSpeed) {
            this.ball.randomizeVelocity();
        }
    }

    setTheme(color) {
        this.currentTheme = {
            primary: color,
            glow: `0 0 10px ${color}`
        };
        document.documentElement.style.setProperty('--primary-color', color);
        document.documentElement.style.setProperty('--primary-glow', `0 0 10px ${color}`);
    }

    render() {
        // Apply screen shake
        this.ctx.save();
        if (this.shakeIntensity > 0.01) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(dx, dy);
        }

        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw screen flash
        if (this.flashIntensity > 0.01) {
            this.ctx.fillStyle = this.goalFlashColor;
            this.ctx.globalAlpha = this.flashIntensity * 0.3;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1;
        }
        
        // Draw game elements
        this.drawArena();
        this.drawGoal();
        
        // Draw particles
        this.trailParticles.draw(this.ctx);
        this.particles.draw(this.ctx);
        
        // Draw player and ball
        this.player.draw(this.ctx, this.currentTheme);
        this.ball.draw(this.ctx, this.currentTheme);
        
        // Draw goal particles on top
        this.goalParticles.draw(this.ctx);

        this.ctx.restore();
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
