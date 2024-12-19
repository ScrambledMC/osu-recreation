const BEAT_SIZE = 100;
const RING_THICKNESS = 12;
const ARC_SIZE = 250;
const BALL_SIZE = 100;

const CLICK_DIST_RANGE = 65;
const CLICK_TIME_RANGE = 250;


class Measure {
    constructor(beats, color) {
        this.beats = beats;
        this.color = color;
    }

    getEnd() {
        return this.beats[this.beats.length - 1].getEnd();
    }


    click_the_circle(beat) {
            beat.click({
            distance: dist(mouseX, mouseY, beat.getX(), beat.getY()),
            timeDist: abs(beat.time + (beat.getEnd() - beat.time) / 2 - millis())
        });
    }

    click_the_circles() {
        for (const i in this.beats) {
            const beat = this.beats[i];

            if (beat.isFinished)
                continue;
            
            if (
                dist(mouseX, mouseY, beat.getX(), beat.getY()) <= CLICK_DIST_RANGE
                && millis() >= beat.time - CLICK_TIME_RANGE && millis() <= beat.getEnd() + CLICK_TIME_RANGE
            ) {
                this.click_the_circle(beat);
                return i;
            }
        }
        return null;
    }

    update(clicking) {
        let combo = 0;

        for (const beat of this.beats)
            combo += beat.update() || 0;

        if (clicking === null)
            return combo;

        if (clicking !== null && !this.beats[clicking].isFinished)
            this.click_the_circle(this.beats[clicking]);

        return combo;
    }
}


class Game {
    constructor(measures) {
        this.measures = measures;

        this.currentMeasure = 0;
        this.clicking = null;
        this.combo = 0;
    }


    click_the_circles() {
        for (const i in this.measures) {
            /**
             * the code breaks without this line
             * javascript moment
             * update: it wasnt a javascript moment
             * the line was causing an error and not telling me
             * and it prevented a different error from running
             * i === currentMeasure;
            **/

            const clicking = this.measures[i].click_the_circles();
            if (clicking !== null) {
                this.currentMeasure = i;
                this.clicking = clicking;
                break;
            }
        }
    }

    update() {
        for (const i in this.measures)
            this.combo += this.measures[i].update(i == this.currentMeasure ? this.clicking : null) || 0;
    }

    release() {
        this.clicking = null;
    }
}


var game;


function keyPressed() {
    game.click_the_circles();
}

function mousePressed() {
    game.click_the_circles();
}

function mouseReleased() {
    game.release();
}


function setup() {
    createCanvas(2500, 1300);
    noCursor();

    game = new Game([
        new Measure([
            new Circle(700, 600, 2000),
            new Circle(1000, 700, 2500),
            new Hold(1400, 545, 1000, 3200, 5)
        ], color(30, 30, 192)),
        new Measure([
            new Hold(1650, 500, 500, 4500, 3),
            new Slide([1500, 800, 1100, 720], 750, 6000, 1, 5)
        ], color(255, 50, 50))
    ]);
}

function draw() {
    try{
        game.update();

        background(32, 32, 32);

        for (const measure of game.measures)
            for (const i in measure.beats) {
                const beat = measure.beats[i];
                if (beat.isFinished)
                    beat.renderScore(300);
                if (!beat.clicked || !beat.isFinished)
                    beat.render(parseInt(i) + 1, measure.color);
            }

        fill(255);
        noStroke();
        textSize(40);
        textAlign(LEFT);
        text(game.combo + "x", 10, height - 10);


        if (mouseIsPressed || keyIsPressed)
            stroke(255, 120, 120, 120);
        else
            stroke(255, 90, 90, 120);

        strokeWeight(20);
        point(mouseX, mouseY);
    }catch(e){alert(e)}
}
