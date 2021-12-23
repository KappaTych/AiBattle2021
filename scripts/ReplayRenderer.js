function Lerp(start, end, part) {
    switch (part) {
        case 0:
            return start;
        case 1:
            return end;
        default:
            return start + (end - start) * part;
    }
}

function AboveHalfAnim(start, end, part) {
    return part >= 0.5 ? end : start;
}

class FakeController {
    constructor(dirs) {
        this.dirs = dirs;
        this.index = 0;
    }
    Init() {}
    GetDirection() {
        this.index += 1;
        return this.dirs[this.index]
    }
}

class ReplayRenderer {
    constructor(replay, animFrameCount, updateRender) {
        this.replay = replay.isShort ? this.RestoreReplay(replay) : replay;

        this.animFrameCount = animFrameCount;
        this.turn = 0;

        this.staticLevel = [];
        for (let h = 0; h < replay.mapStartState.height; ++h) {
            this.staticLevel[h] = [];
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

        setTimeout(() => this.SetTurn(0, updateRender, 1), 0);
    }

    RestoreReplay(replay) {
        const dirs = [];
        for (let i = 0; i < replay.startBotsInfo.length; ++i)
            dirs[i] = [];

        for (let i = 0; i < replay.turns.length; ++i) {
            const botsInfo = replay.turns[i].botsInfo;
            for (let j = 0; j < botsInfo.length; ++j)
                dirs[j].push(botsInfo[j].dir);
        }

        const bots = [];
        for (let i = 0; i < replay.startBotsInfo.length; ++i) {
            const botInfo = replay.startBotsInfo[i];
            const controller = { controllerObj: new FakeController(dirs[i]), text: FakeController.toString() };
            bots[botInfo.index] = new Bot(botInfo.x, botInfo.y, botInfo.dir, controller, botInfo.name, botInfo.color);
        }

        const scene = new Scene(SafeMapInfo.ToMapInfo(replay.mapStartState), bots, false, 5, null, false, false);
        scene.AddTurnToLogs();

        for (let i = 0; i < replay.turns.length - 1; ++i)
            scene.NextStep();
        return JSON.parse(scene.GetLogs());
    }

    SetSnowLevel(animFrameIndex) {
        const map = this.staticLevel;
        const prevTurnInfo = this.replay.turns[Math.max(this.turn - 1, 0)];
        const curTurnInfo = this.replay.turns[this.turn];
        for (let h = 0; h < map.length; ++h) {
            for (let w = 0; w < map[h].length; ++w) {
                if (map[h][w].constructor.name === "Field") {
                    if (animFrameIndex * 1.0 / this.animFrameCount >= 0.8) {
                        map[h][w].SetSnowCount(curTurnInfo.snowLevelMap[h][w]);
                    } else {
                        if (animFrameIndex * 1.0 / this.animFrameCount >= 0.6) {
                            map[h][w].SetSnowCount(curTurnInfo.snowLevelMapBeforeIncrease[h][w]);
                        } else {
                            map[h][w].SetSnowCount(prevTurnInfo.snowLevelMap[h][w])
                        };
                    }
                }
            }
        }
    }

    UpdateBotsPositions(animFrameIndex) {
        const prevTurnInfo = this.replay.turns[Math.max(this.turn - 1, 0)];
        const curTurnInfo = this.replay.turns[this.turn];

        for (let i = 0; i < curTurnInfo.botsInfo.length; ++i) {
            const prevBotInfo = prevTurnInfo.botsInfo[i];
            const curBotInfo = curTurnInfo.botsInfo[i];
            this.bots[curBotInfo.index].x = Lerp(prevBotInfo.x, curBotInfo.x, animFrameIndex * 1.0 / this.animFrameCount);
            this.bots[curBotInfo.index].y = Lerp(prevBotInfo.y, curBotInfo.y, animFrameIndex * 1.0 / this.animFrameCount);
            const animIndex = animFrameIndex === 0 || animFrameIndex === this.animFrameCount ||
                (prevBotInfo.x === curBotInfo.x && prevBotInfo.y === curBotInfo.y) ?
                0 :
                (animFrameIndex % 4 > 1) ? 2 : 1;
            this.bots[curBotInfo.index].SetDirAndAnim(curBotInfo.dir, animIndex);
        }
    }

    UpdateSnowballs(animFrameIndex) {
        const prevTurnInfo = this.replay.turns[Math.max(this.turn - 1, 0)];
        const curTurnInfo = this.replay.turns[this.turn];

        const keysForDelete = Object.keys(this.snowballs);
        for (let i = 0; i < prevTurnInfo.snowballs.length; ++i) {
            const id = prevTurnInfo.snowballs[i].id;
            keysForDelete.splice(keysForDelete.indexOf(id), 1);
        }

        for (let i = 0; i < keysForDelete.length; ++i)
            this.snowballs[keysForDelete[i]] = null;

        for (let i = 0; i < curTurnInfo.snowballs.length; ++i) {
            let prevSnowballInfo = prevTurnInfo.snowballs[i];
            let curSnowballInfo = curTurnInfo.snowballs[i];

            if (prevSnowballInfo === undefined || prevSnowballInfo === undefined)
                prevSnowballInfo = curSnowballInfo;

            if (this.snowballs[curSnowballInfo.id] === null || this.snowballs[curSnowballInfo.id] === undefined) {
                if (animFrameIndex * 1.0 / this.animFrameCount > 0.8 || prevSnowballInfo.id === curSnowballInfo.id) {
                    this.snowballs[curSnowballInfo.id] = new Snowball(curSnowballInfo.x, curSnowballInfo.y, curSnowballInfo.dir, curSnowballInfo.value);
                }
            } else {
                const snowball = this.snowballs[curSnowballInfo.id];
                snowball.x = Lerp(prevSnowballInfo.x, curSnowballInfo.x, animFrameIndex * 1.0 / this.animFrameCount);
                snowball.y = Lerp(prevSnowballInfo.y, curSnowballInfo.y, animFrameIndex * 1.0 / this.animFrameCount);
                snowball.dir = curSnowballInfo.dir;
                snowball.SetSnowCount(AboveHalfAnim(prevSnowballInfo.value, curSnowballInfo.value, animFrameIndex * 1.0 / this.animFrameCount));
            }
        }
    }

    Render(canvas, tileSize) {
        const map = this.staticLevel;
        canvas.width = map[0].length * tileSize;
        canvas.height = map.length * tileSize;
        const context = canvas.getContext('2d');

        this.DrawMap(context, tileSize);
        this.DrawBases(context, tileSize);
        this.DrawSnowballs(context, tileSize);
        this.DrawBots(context, tileSize);
    }

    DrawBots(context, tileSize) {
        for (let i = 0; i < this.bots.length; ++i) {
            const bot = this.bots[i];
            context.drawImage(bot.texture, bot.x * tileSize, bot.y * tileSize, tileSize, tileSize);
            DrawText(context, bot.name, bot.x, bot.y, tileSize);
        }
    }

    DrawSnowballs(context, tileSize) {
        const keys = Object.keys(this.snowballs);
        for (let i = 0; i < keys.length; ++i) {
            const snowball = this.snowballs[keys[i]];
            if (snowball === null)
                continue;
            context.drawImage(snowball.texture, snowball.x * tileSize, snowball.y * tileSize, tileSize, tileSize);
        };
    }

    DrawMap(context, tileSize) {
        const map = this.staticLevel;
        for (let h = 0; h < map.length; ++h) {
            for (let w = 0; w < map[h].length; ++w) {
                context.drawImage(map[h][w].texture, w * tileSize, h * tileSize, tileSize, tileSize);
            }
        }
    }

    DrawBases(context, tileSize) {
        for (let i = 0; i < this.bots.length; ++i) {
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

    NextTurn(updateRender, animFrameTime) {
        this.SetTurn(this.turn + 1, updateRender, animFrameTime);
    }

    PrevTurn(updateRender, animFrameTime) {
        this.SetTurn(this.turn - 1, updateRender, animFrameTime);
    }

    SetTurn(index, updateRender, animFrameTime) {
        if (index < 0) {
            alert("Turn index < 0");
            return;
        }

        if (index >= this.replay.turns.length) {
            alert("Turn index > turns.length");
            return;
        }

        this.turn = index;
        this.AnimIter(0, updateRender, animFrameTime, this.turn);
    }

    AnimIter(animIndex = 0, updateRender, animFrameTime, turn) {
        if (this.turn !== turn)
            return;

        this.SetSnowLevel(animIndex);
        this.UpdateBotsPositions(animIndex);
        this.UpdateSnowballs(animIndex);

        if (updateRender !== null && updateRender !== undefined)
            updateRender();

        if (animIndex + 1 <= this.animFrameCount)
            setTimeout(() => { this.AnimIter(animIndex + 1, updateRender, animFrameTime, turn) }, animFrameTime);
    }

    CalcScores() {
        const snowballs = this.replay.turns[this.turn].snowballs;
        const scores = [];
        for (let i = 0; i < this.bots.length; ++i) {
            const base = this.replay.mapStartState.bases[i];
            scores[i] = { value: 0, botName: this.bots[i].name, botColor: this.bots[i].color };
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