class ReplayRenderer {
    constructor(replay) {
        this.turn = 0;
        this.replay = replay;
        this.staticLevel = [];
        for (let h = 0; h < replay.mapStartState.height; ++h) {
            this.staticLevel[h] = []
            for (let w = 0; w < replay.mapStartState.width; ++w) {
                this.staticLevel[h][w] = MapInfo.MapCharToGameObject(replay.mapStartState.map[h][w]);
                if (this.staticLevel[h][w].constructor.name === "Field") {
                    this.staticLevel[h][w].SetSnowCount(typeof replay.mapStartState.startSnowMap === "number" ?
                        replay.mapStartState.startSnowMap :
                        replay.mapStartState.startSnowMap[h][w]);
                }
            }
        }

        this.bots = [];
        for (let i = 0; i < replay.startBotsInfo.length; ++i) {
            const botInfo = replay.startBotsInfo[i];
            this.bots[botInfo.index] = new Bot(botInfo.x, botInfo.y, botInfo.dir, botInfo.controller, botInfo.name, botInfo.color);
        }

        this.snowballs = {};

        this.SetTurn(0);
    }

    SetSnowLevel() {
        const map = this.staticLevel;
        const turn = this.replay.turns[this.turn];
        for (let h = 0; h < map.length; ++h) {
            for (let w = 0; w < map[h].length; ++w) {
                if (map[h][w].constructor.name === "Field") {
                    map[h][w].SetSnowCount(turn.snowLevelMap[h][w]);
                }
            }
        }
    }

    UpdateBotsPositions() {
        const turn = this.replay.turns[this.turn];

        for (let i = 0; i < turn.botsInfo.length; ++i) {
            const botInfo = turn.botsInfo[i];
            this.bots[botInfo.index].x = botInfo.x;
            this.bots[botInfo.index].y = botInfo.y;
            this.bots[botInfo.index].SetDir(botInfo.dir);
        }
    }

    UpdateSnowballs() {
        const turn = this.replay.turns[this.turn];

        for (let i = 0; i < turn.snowballs.length; ++i) {
            const snowballInfo = turn.snowballs[i];
            if (this.snowballs[snowballInfo.id] === null || this.snowballs[snowballInfo.id] === undefined) {
                this.snowballs[snowballInfo.id] = new Snowball(snowballInfo.x, snowballInfo.y, snowballInfo.dir, snowballInfo.value);
            } else {
                const snowball = this.snowballs[snowballInfo.id];
                snowball.x = snowballInfo.x;
                snowball.y = snowballInfo.y;
                snowball.dir = snowballInfo.dir;
                snowball.SetSnowCount(snowballInfo.value);
            }
        }
    }

    Render(canvas, tileSize) {
        const turn = this.replay.turns[this.turn];

        this.SetSnowLevel();

        const map = this.staticLevel;
        canvas.width = map[0].length * tileSize;
        canvas.height = map.length * tileSize;
        const context = canvas.getContext('2d');

        for (let h = 0; h < map.length; ++h) {
            for (let w = 0; w < map[h].length; ++w) {
                context.drawImage(map[h][w].texture, w * tileSize, h * tileSize, tileSize, tileSize);
            }
        }

        this.DrawBases(context, tileSize);

        for (let i = 0; i < turn.snowballs.length; ++i) {
            const snowballInfo = turn.snowballs[i];
            const snowball = this.snowballs[snowballInfo.id];
            context.drawImage(snowball.texture, snowball.x * tileSize, snowball.y * tileSize, tileSize, tileSize);
        }

        for (let i = 0; i < this.bots.length; ++i) {
            const bot = this.bots[i];
            context.drawImage(bot.texture, bot.x * tileSize, bot.y * tileSize, tileSize, tileSize);
            DrawText(context, bot.name, bot.x, bot.y, tileSize);
        }
    }

    DrawBases(context, tileSize) {
        for (let i = 0; i < this.replay.mapStartState.bases.length; ++i) {
            const base = this.replay.mapStartState.bases[i];
            const topLeft = base.topLeft;
            const bottomRight = base.bottomRight;
            context.beginPath();
            context.rect(topLeft.x * tileSize, topLeft.y * tileSize, (bottomRight.x - topLeft.x + 1) * tileSize, (bottomRight.y - topLeft.y + 1) * tileSize);
            context.fillStyle = this.bots[i].color;
            context.fillStyle = HexToRgbA(context.fillStyle, 0.3);
            context.fill();
        }
    }

    NextTurn() {
        this.SetTurn(this.turn + 1);
    }

    PrevTurn() {
        this.SetTurn(this.turn - 1);
    }

    SetTurn(index) {
        if (index < 0) {
            alert("Turn index < 0");
            return;
        }

        if (index >= this.replay.turns.length) {
            alert("Turn index > turns.length");
            return;
        }

        this.turn = index;
        this.SetSnowLevel();
        this.UpdateBotsPositions();
        this.UpdateSnowballs();
    }

    CalcScores() {
        const snowballs = this.replay.turns[this.turn].snowballs;
        const scores = [];
        for (let i = 0; i < this.bots.length; ++i) {
            const base = this.replay.mapStartState.bases[i];
            scores[i] = { value: 0, botName: this.bots[i].name };
            for (let j = 0; j < snowballs.length; ++j) {
                const snowball = snowballs[j];
                if (base.topLeft.x <= snowball.x && snowball.x <= base.bottomRight.x &&
                    base.topLeft.y <= snowball.y && snowball.y <= base.bottomRight.y)
                    scores[i].value += snowball.value;
            }
        }

        return scores;
    }
}