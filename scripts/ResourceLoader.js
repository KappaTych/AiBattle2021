class ResourceLoader {
    static loadedPngs = new Map();

    static LoadPng(path) {
        if (!ResourceLoader.loadedPngs.has(path)) {
            let pic = new Image();
            pic.src = path;
            ResourceLoader.loadedPngs.set(path, pic);
        }
        return ResourceLoader.loadedPngs.get(path);
    }

    // static async LoadPng(path) {
    //     let img;
    //     const imageLoadPromise = new Promise(resolve => {
    //         img = new Image();
    //         img.onload = resolve;
    //         img.src = path;
    //         ResourceLoader.loadedPngs.set(path, img);
    //     });

    //     await imageLoadPromise;
    //     console.log("image loaded");
    //     return ResourceLoader.loadedPngs.get(path);
    // }
}

const mapsPoolName = 'AiBattleMaps';
const controllersPoolName = 'AiBattleControllers';

function AddToPool(str, name, poolName) {
    let names = localStorage.getItem(poolName);
    if (names === null)
        names = "";
    if (names.split("\\").indexOf(name) < 1) {
        if (localStorage.getItem(name) !== null) {
            alert("There is an object of another type with the same name.");
            return;
        }
        names += "\\" + name;
    }

    localStorage.setItem(name, str);
    localStorage.setItem(poolName, names);
}

function AddControllerToPool(controller, name) {
    try {
        LoadControllerFromString(controller);
        AddToPool(controller, name, controllersPoolName);
    } catch (error) {
        alert(error);
    }
}

function AddMapToPool(map, name) {
    try {
        if (MapInfo.IsJsonValid(map))
            AddToPool(map, name, mapsPoolName);
    } catch (error) {
        alert(error);
    }
}

function ClearPool(poolName) {
    let names = localStorage.getItem(poolName);
    if (names === null)
        return;
    let namesArr = names.split("\\");
    for (let i = 0; i < namesArr.length; ++i)
        localStorage.removeItem(namesArr[i]);
    names = "";
    localStorage.setItem(poolName, names);
}

function ClearMapsPool() {
    ClearPool(mapsPoolName);
}

function ClearControllersPool() {
    ClearPool(controllersPoolName);
}

function GetPoolObjectNames(poolName) {
    let names = localStorage.getItem(poolName);
    if (names === null)
        return;
    let ans = names.split("\\");
    ans.shift();
    return ans;
}

function GetMapsNames() {
    return GetPoolObjectNames(mapsPoolName);
}

function GetControllersNames() {
    return GetPoolObjectNames(controllersPoolName);
}

function GetObjectFromStorageByName(name) {
    return localStorage.getItem(name);
}

function RemoveObjectFromPool(name, poolName) {
    let names = localStorage.getItem(poolName);
    names = names.replace("\\" + name, "");
    localStorage.setItem(poolName, names);
    localStorage.removeItem(name);
}

function RemoveMapFromPool(name) {
    RemoveObjectFromPool(name, mapsPoolName)
}

function RemoveControllerFromPool(name) {
    RemoveObjectFromPool(name, controllersPoolName);
}

function ExistInPool(name, poolName) {
    let names = GetPoolObjectNames(poolName);
    for (let i = 0; i < names.length; ++i) {
        if (name === names[i])
            return true;
    }
    return false;
}

function MapExistInPool(name) {
    return ExistInPool(name, mapsPoolName);
}

function ControllerExistInPool(name) {
    return ExistInPool(name, controllersPoolName);
}