class ResourceLoader {
    static loadedPngs = new Map();

    static LoadPng(path) {
        if (!ResourceLoader.loadedPngs.has(path)) {
            let image = new Image();
            image.src = path;
            ResourceLoader.loadedPngs.set(path, image);
        }
        return ResourceLoader.loadedPngs.get(path);
    }

    // static ChangeColor(mask, color) {
    //     let canvas = document.createElement("canvas");
    //     canvas.width = mask.width;
    //     canvas.height = mask.height;
    //     let context = canvas.getContext("2d");
    //     context.drawImage(mask, 0, 0)
    //     context.globalCompositeOperation = 'multiply';
    //     context.fillStyle = color;
    //     context.fillRect(0, 0, canvas.width, canvas.height);
    //     let pic = new Image();
    //     pic.src = canvas.toDataURL();
    //     return pic;
    // }

    // static LoadPngAsMask(path, color) {
    //     let newPath = path + "@" + JSON.stringify(color);
    //     if (!ResourceLoader.loadedPngs.has(newPath)) {
    //         let maskImage = ResourceLoader.LoadPng(path);
    //         if (maskImage.complete && maskImage.naturalHeight !== 0) {
    //             let image = imageResourceLoader.ChangeColor(maskImage, color);
    //             image.crossOrigin = "anonymous";
    //             ResourceLoader.loadedPngs.set(newPath, image);
    //         } else {
    //             maskImage.onload = function setImage() {
    //                 let image = ResourceLoader.ChangeColor(maskImage, color);
    //                 image.crossOrigin = "anonymous";
    //                 ResourceLoader.loadedPngs.set(newPath, image);
    //             }
    //         }
    //     }
    //     return ResourceLoader.loadedPngs.get(newPath);
    // }
}

function HexToRgbA(hex, a) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + a + ')';
    }
    throw new Error('Bad Hex');
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
        if (MapInfo.IsJsonValid(map).valid)
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
        return [];
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