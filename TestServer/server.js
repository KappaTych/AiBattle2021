'use strict';

const readline = require('readline');
const tmp = require('tmp');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const lib = require("../scripts/lib");
const fs = require('fs');
const data = fs.readFileSync('../maps/simple_map.json', { encoding: 'utf8', flag: 'r' });
let mapInfo = lib.MapInfo.LoadMapFromJson(data);

let botsControllers = [{ path: '../bots/randomBot.js', name: "bot", color: "white" }]
let bots = [];

for (let i = 0; i < botsControllers.length; ++i)
    bots.push(new lib.Bot(0, 0, 0,
        lib.LoadControllerFromString(
            fs.readFileSync(botsControllers[i].path, { encoding: 'utf8', flag: 'r' })
        ),
        botsControllers[i].name,
        botsControllers[i].color,
    ));

let isRandomSpawn = false;
let timeout = 100;

let scene = new lib.Scene(mapInfo, bots, isRandomSpawn, true, timeout,
    function () {
        console.log("init complite");
        Step();
    });

function Step() {
    if (scene.mapInfo.turns === 0) {
        console.log(scene.CalcScores());
        process.exit(0);
    }
    else {
        scene.NextStepWithTimer(100, Step);
    }
}

