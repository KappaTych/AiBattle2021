function Clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    let copy = new obj.constructor();
    for (let attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function CreateGuid() {
    function _p8(s) {
        let p = (Math.random().toString(16) + "000000000").substr(2, 8);
        return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}

class GameObject {
    constructor() {
        this.id = CreateGuid();
    }
}

class VisibleGameObject extends GameObject {
    constructor(texture) {
        super();
        this.texture = texture;
    }
}