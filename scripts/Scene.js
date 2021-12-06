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

    static LoadMapFromText(str) {
        let lines = str.split('\r\n');

        let buff = lines[0].split(" ");
        let width = parseInt(buff[0]);
        let height = parseInt(buff[1]);

        let map = [];
        for (let h = 0; h < height; ++h) {
            if (lines[h + 1].length < width)
                throw "there are not enough characters in the line describing the map line: " + (h + 1);
            map[h] = []
            for (let w = 0; w < width; ++w) {
                map[h][w] = this.MapCharToGameObject(lines[h + 1][w]);
            }
        }

        let spawns = [];
        let playersCount = parseInt(lines[height + 1]);
        buff = lines[height + 2].split(" ");
        if (buff.length < playersCount * 2)
            throw "there are not enough characters in the line describing the spawns"
        for (let i = 0; i < buff.length; i += 2) {
            spawns.push({ x: buff[i], y: buff[i + 1] });
        }

        let bases = [];
        buff = lines[height + 3].split(" ");
        if (buff.length < playersCount * 4)
            throw "there are not enough characters in the line describing the bases"
        for (let i = 0; i < buff.length; i += 4) {
            bases.push(new PlayerBase({ x: buff[i], y: buff[i + 1] }, { x: buff[i + 2], y: buff[i + 3] }));
        }

        let turns = parseInt(lines[height + 4]);

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

    NextStep() {
        if (this.mapInfo.turns === 0)
            return;
        --this.mapInfo.turns;
        for (let i = 0; i < this.bots.length; ++i) {
            let enemies = [];
            for (let j = 0; j < this.bots.length; ++j) {
                if (j != i) {
                    enemies.push({
                        x: this.bots[j].x,
                        y: this.bots[j].y,
                        name: this.bots[j].name,
                    })
                }
            }

            let snowballs = []

            for (let j = 0; j < this.snowballs.length; ++j) {
                snowballs.push({
                    x: this.snowballs[j].x,
                    y: this.snowballs[j].y,
                    name: this.snowballs[j].currentSnowCount,
                })
            }

            let infoForController = new SceneInfoForController({ x: this.bots[i].x, y: this.bots[i].y }, enemies, snowballs);
            let dir = this.bots[i].controller.GetDirection(infoForController);
            this.bots[i].SetDir(dir);

            let newX = this.bots[i].x + Scene.moves[dir].x;
            let newY = this.bots[i].y + Scene.moves[dir].y;
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
                    this.MoveDynamicObject(this.bots[i], newX, newY);
                } else {
                    if (this.dynamicLayer[newY][newX].constructor.name === "Snowball") {
                        if (map[afterY][afterX].constructor.name === "Field" && this.dynamicLayer[afterY][afterX] == null) {
                            if (map[newY][newX].GetSnowCount() > 0 && this.dynamicLayer[newY][newX].IncSnow() > 0) {
                                map[newY][newX].DecSnow();
                            }
                            this.MoveDynamicObject(this.dynamicLayer[newY][newX], afterX, afterY);
                            this.MoveDynamicObject(this.bots[i], newX, newY);
                        }
                    }
                }
            }
        }

        let map = this.mapInfo.map;
        for (let h = 0; h < map.length; ++h) {
            for (let w = 0; w < map[h].length; ++w) {
                if (map[h][w].constructor.name === "Field") {
                    map[h][w].IncSnow();
                }
            }
        }
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

        for (let i = 0; i < this.bots.length; ++i) {
            let bot = this.bots[i];
            context.drawImage(bot.texture, bot.x * tileW, bot.y * tileH, tileW, tileH);
        }

        for (let i = 0; i < this.snowballs.length; ++i) {
            let snowball = this.snowballs[i];
            context.drawImage(snowball.texture, snowball.x * tileW, snowball.y * tileH, tileW, tileH);
        }

        for (let i = 0; i < this.mapInfo.bases.length; ++i) {
            let topLeft = this.mapInfo.bases[i].topLeft;
            let bottomRight = this.mapInfo.bases[i].bottomRight;
            context.rect(topLeft.x * tileW, topLeft.y * tileH, (bottomRight.x - topLeft.x + 1) * tileW, (bottomRight.y - topLeft.y + 1) * tileH);
            context.fillStyle = "rgba(" + this.baseColors[i].r + "," + this.baseColors[i].g + "," + this.baseColors[i].b + "," + "0.4)";
            context.fill();
        }
    }
}