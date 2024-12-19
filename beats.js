class Beat {
    BEAT_FADE_IN_TIME = 1000;
    BEAT_FADE_OUT_TIME = 100;

    SCORE_LAST_TIME = 500;
    SCORE_FADE_OUT_TIME = 50;

    BEAT_LAST_TIME;

    constructor(time) {
        this.time = time;


        this.clicks = [];
        this.isClicking = false;
        this.clicked = false;
        this.isFinished = false;
        this.lastClick = null;
    }

    getX() {}

    getY() {}

    getEnd() {}

    shouldShowRing() {
        return millis() < this.time && millis() >= this.time - this.BEAT_FADE_IN_TIME;
    }

    isActive() {
        return millis() >= this.time && millis() <= this.getEnd() + this.BEAT_LAST_TIME;
    }


    getAlpha() {
        if (this.shouldShowRing())
            return 255 - (this.time - millis()) / (this.BEAT_FADE_IN_TIME / 255);
        else if (this.isActive())
            return 255;
        else if (
            millis() > this.getEnd() + this.BEAT_LAST_TIME
            && millis() < this.getEnd() + this.BEAT_LAST_TIME + this.BEAT_FADE_OUT_TIME
        )
            return (this.getEnd() + this.BEAT_LAST_TIME + this.BEAT_FADE_OUT_TIME - millis()) * 255 / this.BEAT_FADE_OUT_TIME;
        else return 0;
    }


    renderScore(score) {
        if (
            this.lastClick === null
            || millis() > this.lastClick + this.SCORE_LAST_TIME + this.SCORE_FADE_OUT_TIME
        ) return;

        let alpha;
        if (millis() < this.lastClick + this.SCORE_LAST_TIME)
            alpha = 128;
        else
            alpha = (this.lastClick + this.SCORE_LAST_TIME + this.SCORE_FADE_OUT_TIME - millis()) * 128 / this.SCORE_FADE_OUT_TIME;

        if (score === 300)
            fill(200, 200, 50, alpha);
        else if (score === 100)
            fill(50, 200, 50, alpha);
        else if (score === 50 || score === 0)
            fill(200, 50, 50, alpha);

        noStroke();
        textSize(32);
        textAlign(CENTER);
        text(score || "x", this.getX(), this.getY() + 10);
    }


    render(num, col) {
        let alpha = this.getAlpha();

        stroke(red(col), blue(col), green(col), alpha);
        strokeWeight(BEAT_SIZE);
        point(this.x, this.y);

        this.drawNum(num, this.x, this.y);
    
        if (this.shouldShowRing()) {
            stroke(128, 128, 128, alpha);
            strokeWeight(RING_THICKNESS);
            noFill();
    
            let ringSize = 255 - alpha + BEAT_SIZE;
            ellipse(this.x, this.y, ringSize, ringSize);
        }
    }

    drawNum(num, x, y) {
        if (num !== null) {
            fill(0, 0, 0, this.getAlpha());
            noStroke();
            textSize(40);
            textAlign(CENTER);
            text(num, x, y + 12);
        }
    }

    click(click) {
        this.clicks.push(click);
        this.isClicking = true;
        this.clicked = true;
    }

    update() {
        if (millis() >= this.getEnd() + this.BEAT_LAST_TIME)
            this.finish();

        this.isClicking = false;
    }

    finish() {
        this.isFinished = true;
        this.lastClick = this.lastClick ?? millis();

        // calculate score and stuff
    }
}


class Circle extends Beat {
    BEAT_LAST_TIME = 250;

    constructor(x, y, time) {
        super(time);
        this.x = x;
        this.y = y;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    getEnd() {
        return this.time;
    }

    click(click) {
        super.click(click);

        this.finish();
    }

    update() {
        if (this.isFinished && this.isClicking) {
            this.isClicking = false;
            return 1;
        }

        super.update();
    }
}


class Hold extends Beat {
    BEAT_LAST_TIME = 0;

    constructor(x, y, holdTime, time, combos) {
        super(time);
        this.x = x;
        this.y = y;
        this.holdTime = holdTime;
        this.combos = combos;

        this.clicks = [];
        this.nextCombo = time;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    getPercentage() {
        return (millis() - this.time) / this.holdTime;
    }

    getEnd() {
        return this.time + this.holdTime;
    }

    render(num, col) {
        if (this.isActive() && this.isClicking) {
            fill(150, 30, 150, 64);
            noStroke();
            arc(this.x, this.y, ARC_SIZE, ARC_SIZE, radians(-90), radians(-90) + PI * 2 * this.getPercentage());
        }

        super.render(null, col);

        fill(0, 0, 0, this.getAlpha());
        noStroke();
        textSize(25);
        textAlign(CENTER);
        text("HOLD", this.x, this.y + 8);
    }

    update() {
        if (!this.isFinished && this.isClicking && millis() >= this.nextCombo) {
            this.nextCombo = this.nextCombo += this.holdTime / (this.combos - 1);
            this.isClicking = false;
            return 1;
        }

        super.update();
    }
}


class Slide extends Hold {
    BEAT_LAST_TIME = 0;

    constructor(points, holdTime, time, returns, combos) {
        super(null, null, holdTime, time, combos);
        this.points = points;
        this.returns = returns;
    }

    getX() {
        if (this.isActive())
            return lerp(this.points[0], this.points[2], this.getPercentage());
        if (millis() < this.time)
            return this.points[0];
        return this.returns % 2 === 1 ? this.points[0] : this.points[2];
    }

    getY() {
        if (this.isActive())
            return lerp(this.points[1], this.points[3], this.getPercentage());
        if (millis() < this.time)
            return this.points[1];
        return this.returns % 2 === 1 ? this.points[1] : this.points[3];
    }

    getEnd() {
        return this.time + this.holdTime * (this.returns + 1);
    }

    getPercentage() {
        let percent = super.getPercentage();
        if (Math.floor(percent) % 2 === 0)
            return percent % 1;
        else
            return 1 - percent % 1;
    }

    render(num, col) {
        let alpha = this.getAlpha();

        stroke(200, 200, 200, alpha);
        strokeWeight(BEAT_SIZE + RING_THICKNESS / 2);
        line(this.points[0], this.points[1], this.points[2], this.points[3]);

        stroke(red(col), blue(col), green(col), alpha);
        strokeWeight(BEAT_SIZE);
        line(this.points[0], this.points[1], this.points[2], this.points[3]);

        noFill();
        stroke(200, 200, 200, alpha);
        strokeWeight(RING_THICKNESS);
        ellipse(this.points[0], this.points[1], BEAT_SIZE - RING_THICKNESS / 2, BEAT_SIZE - RING_THICKNESS / 2);

        this.drawNum(num, this.points[0], this.points[1]);

        strokeWeight(BALL_SIZE);
        stroke(0);

        if (this.isActive())
            point(this.getX(), this.getY());
     
        if (this.shouldShowRing()) {
            stroke(128, 128, 128, alpha);
            strokeWeight(RING_THICKNESS);
            noFill();
    
            let ringSize = 255 - alpha + BEAT_SIZE;
            ellipse(this.points[0], this.points[1], ringSize, ringSize);
        }
    }
}
