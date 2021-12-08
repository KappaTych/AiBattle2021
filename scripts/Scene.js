class SceneInfoForController {
    constructor(playerPos, enemies, snowballs) {
        this.playerPos = playerPos;
        this.enemies = enemies;
        this.snowball = snowballs;
    }
}

class PlayerBase extends GameObject {
    constructor(topLeft, bottomRight) {
        super();
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
    }
}

class MapInfo {
    constructor(width, height, map, spawns, bases, turns) {
        this.width = width;
        this.height = height;
        this.map = map;
        this.spawns = spawns;
        this.bases = bases;
        this.turns = turns;
    }

    GetClone() {
        let map = []
        for (let h = 0; h < this.height; ++h) {
            map[h] = [];
            for (let w = 0; w < this.width; ++w) {
                map[h][w] = Clone(this.map[h][w]);
            }
        }

        let spawns = []

        for (let i = 0; i < this.spawns.length; ++i)
            spawns.push(Clone(this.spawns[i]));

        let bases = []

        for (let i = 0; i < this.bases.length; ++i) {
            let topLeft = this.bases[i].topLeft;
            let bottomRight = this.bases[i].bottomRight;
            bases.push(new PlayerBase({ x: topLeft.x, y: topLeft.y }, { x: bottomRight.x, y: bottomRight.y }));
        }

        return new MapInfo(this.width, this.height, map, spawns, bases, this.turns);
    }

    static MapCharToGameObject(char) {
        switch (char) {
            case '#':
                return new Wall();
            case '*':
                return new Tree();
            case '.':
                return new Field();
        }
    }

    static IsJsonValid(json) {
        let obj = JSON.parse(json);

        if (typeof obj.width !== "number") {
            alert("width not number");
            return false;
        }

        if (obj.width <= 0) {
            alert("width <= 0");
            return false;
        }

        if (typeof obj.height !== "number") {
            alert("height not number");
            return false;
        }

        if (obj.height <= 0) {
            alert("height <= 0");
            return false;
        }

        if (typeof obj.turns !== "number") {
            alert("turns not number");
            return false;
        }

        if (obj.turns <= 0) {
            alert("turns <= 0");
            return false;
        }

        let width = obj.width * 1;
        let height = obj.height * 1;

        if (obj.map.length !== height) {
            alert("Real map height !== height")
            return false;
        }

        for (let h = 0; h < height; ++h) {
            if (obj.map[h].length < width) {
                alert("there are not enough characters in the line describing the map line: " + h);
                return false;
            }

            if (obj.map[h].length > width) {
                alert("there are too many characters in the line describing the map line: " + h);
                return false;
            }

            for (let w = 0; w < width; ++w) {
                if (!(obj.map[h][w] === "*" || obj.map[h][w] === "#" || obj.map[h][w] === ".")) {
                    alert("Strange char at w: " + w + " h: " + h);
                    return false;
                }
            }
        }

        if (obj.spawns.length != obj.bases.length) {
            alert("spawns.length != bases.length")
            return false;
        }

        for (let i = 0; i < obj.spawns.length; ++i) {
            if (typeof obj.spawns[i].x !== "number" || typeof obj.spawns[i].y !== "number") {
                alert("wrong spawn #" + i + " format");
                return false;
            }
        }

        for (let i = 0; i < obj.bases.length; ++i) {
            let topLeft = obj.bases[i].topLeft;
            if (typeof topLeft.x !== "number" || typeof topLeft.y !== "number") {
                alert("wrong topLeft base #" + i + " format");
                return false;
            }
            let bottomRight = obj.bases[i].bottomRight;
            if (typeof bottomRight.x !== "number" || typeof bottomRight.y !== "number") {
                alert("wrong bottomRight base #" + i + " format");
                return false;
            }

            if (topLeft.x > bottomRight.x) {
                alert("base #" + i + "topLeft.x>bottomRight.x");
                return false;
            }
            if (topLeft.y > bottomRight.y) {
                alert("base #" + i + "topLeft.y>bottomRight.y");
                return false;
            }
        }

        return true;
    }

    static LoadMapFromJson(json) {
        let obj = JSON.parse(json);

        if (!MapInfo.IsJsonValid(json)) {
            alert("Json is invalide")
            return;
        }

        let width = obj.width * 1;
        let height = obj.height * 1;

        let map = [];
        for (let h = 0; h < height; ++h) {
            map[h] = []
            for (let w = 0; w < width; ++w) {
                map[h][w] = this.MapCharToGameObject(obj.map[h][w]);
            }
        }

        let spawns = [];
        for (let i = 0; i < obj.spawns.length; ++i) {
            spawns.push({ x: obj.spawns[i].x, y: obj.spawns[i].y });
        }

        let bases = []
        for (let i = 0; i < obj.bases.length; ++i) {
            let topLeft = obj.bases[i].topLeft;
            let bottomRight = obj.bases[i].bottomRight;
            bases.push(new PlayerBase({ x: topLeft.x, y: topLeft.y }, { x: bottomRight.x, y: bottomRight.y }))
        }

        let turns = obj.turns * 1;

        return new MapInfo(width, height, map, spawns, bases, turns);
    }
}

class Scene {

    static moves = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];

    constructor(mapInfo, bots) {
        this.baseColors = [
            { r: 255, g: 0, b: 0 },
            { r: 255, g: 127, b: 0 },
            { r: 255, g: 255, b: 0 },
            { r: 0, g: 255, b: 0 },
            { r: 0, g: 0, b: 255 },
            { r: 75, g: 0, b: 130 },
            { r: 148, g: 0, b: 211 },
        ]
        this.mapInfo = mapInfo;
        this.bots = bots;
        this.snowballs = [];
        this.turnsCount = this.mapInfo.turns;

        if (bots.length > mapInfo.spawns.length) {
            throw "Spawns not enough";
        }

        let spawns = mapInfo.spawns.slice();
        this.dynamicLayer = [];
        let map = this.mapInfo.map;
        for (let h = 0; h < map.length; ++h) {
            this.dynamicLayer[h] = []
            for (let w = 0; w < map[h].length; ++w) {
                this.dynamicLayer[h][w] = null;
            }
        }

        spawns.sort(() => Math.random() - 0.5);
        for (let i = 0; i < bots.length; ++i) {
            bots[i].x = spawns[i].x * 1;
            bots[i].y = spawns[i].y * 1;
            bots[i].controller.Init(this.mapInfo.GetClone());
            this.dynamicLayer[bots[i].y][bots[i].x] = bots[i];
        }
    }

    MoveDynamicObject(dynObj, x, y) {
        this.dynamicLayer[dynObj.y][dynObj.x] = null;
        dynObj.x = x;
        dynObj.y = y;
        this.dynamicLayer[dynObj.y][dynObj.x] = dynObj;
    }

    PrepareDataForController(botIndex) {
        let enemies = [];
        for (let i = 0; i < this.bots.length; ++i) {
            if (i != botIndex) {
                enemies.push({
                    x: this.bots[i].x,
                    y: this.bots[i].y,
                    name: this.bots[i].name,
                })
            }
        }

        let snowballs = []
        for (let i = 0; i < this.snowballs.length; ++i) {
            snowballs.push({
                x: this.snowballs[i].x,
                y: this.snowballs[i].y,
                name: this.snowballs[i].currentSnowCount,
            })
        }

        return new SceneInfoForController({ x: this.bots[botIndex].x, y: this.bots[botIndex].y }, enemies, snowballs);
    }

    UpdateDynamicLayerAfterBotChooseDirection(botIndex, dir) {
        this.bots[botIndex].SetDir(dir);

        let newX = this.bots[botIndex].x + Scene.moves[dir].x;
        let newY = this.bots[botIndex].y + Scene.moves[dir].y;
        let afterY = newY + Scene.moves[dir].y;
        let afterX = newX + Scene.moves[dir].x;

        let map = this.mapInfo.map;
        if (map[newY][newX].constructor.name === "Field") {
            if (this.dynamicLayer[newY][newX] == null) {
                if (map[afterY][afterX].constructor.name === "Field" && this.dynamicLayer[afterY][afterX] == null) {
                    if (map[newY][newX].DecSnow() > 0) {
                        let snowball = new Snowball(afterX, afterY, dir);
                        this.snowballs.push(snowball);
                        this.dynamicLayer[afterY][afterX] = snowball;
                    }
                }
                this.MoveDynamicObject(this.bots[botIndex], newX, newY);
            } else {
                if (this.dynamicLayer[newY][newX].constructor.name === "Snowball") {
                    if (map[afterY][afterX].constructor.name === "Field" && this.dynamicLayer[afterY][afterX] == null) {
                        if (map[newY][newX].GetSnowCount() > 0 && this.dynamicLayer[newY][newX].IncSnow() > 0) {
                            map[newY][newX].DecSnow();
                        }
                        this.MoveDynamicObject(this.dynamicLayer[newY][newX], afterX, afterY);
                        this.MoveDynamicObject(this.bots[botIndex], newX, newY);
                    }
                }
            }
        }
    }

    UpdateSnowOnFileds() {
        let map = this.mapInfo.map;
        for (let h = 0; h < map.length; ++h) {
            for (let w = 0; w < map[h].length; ++w) {
                if (map[h][w].constructor.name === "Field") {
                    map[h][w].IncSnow();
                }
            }
        }
    }

    CalcScores() {
        let scores = [];
        for (let i = 0; i < this.bots.length; ++i) {
            scores[i] = { value: 0, botName: this.bots[i].name };
            for (let h = this.mapInfo.bases[i].topLeft.y; h <= this.mapInfo.bases[i].bottomRight.y; ++h) {
                for (let w = this.mapInfo.bases[i].topLeft.x; w <= this.mapInfo.bases[i].bottomRight.x; ++w) {
                    if (this.dynamicLayer[h][w] !== null &&
                        this.dynamicLayer[h][w] !== undefined &&
                        this.dynamicLayer[h][w].constructor.name === "Snowball") {
                        scores[i].value += this.dynamicLayer[h][w].GetSnowCount() + 1;
                    }
                }
            }
        }

        return scores;
    }

    Render(canvas, tileW = 20, tileH = 20) {
        let map = this.mapInfo.map;
        canvas.width = map[0].length * tileW;
        canvas.height = map.length * tileH;
        let context = canvas.getContext('2d');
        for (let h = 0; h < map.length; ++h) {
            for (let w = 0; w < map[h].length; ++w) {
                context.drawImage(map[h][w].texture, w * tileW, h * tileH, tileW, tileH);
            }
        }

        for (let i = 0; i < this.mapInfo.bases.length; ++i) {
            let topLeft = this.mapInfo.bases[i].topLeft;
            let bottomRight = this.mapInfo.bases[i].bottomRight;
            context.rect(topLeft.x * tileW, topLeft.y * tileH, (bottomRight.x - topLeft.x + 1) * tileW, (bottomRight.y - topLeft.y + 1) * tileH);
            context.fillStyle = "rgba(" + this.baseColors[i].r + "," + this.baseColors[i].g + "," + this.baseColors[i].b + "," + "0.4)";
            context.fill();

            context.font = "normal 36px Verdana";
            context.fillStyle = "#0000FF";
            context.fillText("Base:" + i, topLeft.x * tileW, topLeft.y * tileH, tileW);
        }

        for (let i = 0; i < this.bots.length; ++i) {
            let bot = this.bots[i];
            context.drawImage(bot.texture, bot.x * tileW, bot.y * tileH, tileW, tileH);
            context.font = "normal 36px Verdana";
            context.fillStyle = "#0000FF";
            context.fillText(bot.name, bot.x * tileW, bot.y * tileH, tileW);
        }

        for (let i = 0; i < this.snowballs.length; ++i) {
            let snowball = this.snowballs[i];
            context.drawImage(snowball.texture, snowball.x * tileW, snowball.y * tileH, tileW, tileH);
        }
    }

    DecTurns() {
        if (this.turnsCount.turns === 0) {
            alert("Run out of turns");
            return false;
        }
        --this.turnsCount;
        return true;
    }

    NextStep() {
        if (!this.DecTurns())
            return this.CalcScores();

        for (let i = 0; i < this.bots.length; ++i) {
            let dir = this.bots[i].controller.GetDirection(this.PrepareDataForController(i));
            if (!(dir === 0 || dir === 1 || dir === 2 || dir === 3)) {
                alert("bad direction format " + this.bots[i].name);
                continue;
            }
            this.UpdateDynamicLayerAfterBotChooseDirection(i, dir);
        }

        this.UpdateSnowOnFileds();
        return this.CalcScores();
    }

    NextStepWithTimer(timeout, onComplete) {
        if (this.DecTurns())
            this.IterateAsyncStep(timeout, 0, onComplete);
    }

    IterateAsyncStep(timeout, botIndex = 0, onComplete = null) {
        let scene = this;
        this.currentWorker = MakeWorkerForGetDirection(
            this.bots[botIndex].controller,
            this.PrepareDataForController(botIndex),
            timeout,
            function next(worker, result) {
                worker.terminate();
                if ((result.dir === 0 || result.dir === 1 || result.dir === 2 || result.dir === 3)) {
                    CopyDataToObject(result.controller, scene.bots[botIndex].controller);
                    scene.UpdateDynamicLayerAfterBotChooseDirection(botIndex, result.dir);
                } else {
                    console.log("bot #" + botIndex + "wrong dir format");
                }

                if (botIndex + 1 === scene.bots.length) {
                    scene.UpdateSnowOnFileds();
                    if (onComplete !== null && onComplete !== undefined)
                        onComplete(scene.CalcScores());
                } else {
                    scene.IterateAsyncStep(timeout, botIndex + 1, onComplete)
                }
            });
    }
}