function GetController() {
    return {
        x: 1,
        y: 1,
        Init: function(d) {
            return 1;
        },
        GetDirection: function(d) {
            return this.GetRandomInt(0, 4);
        },
        GetRandomInt: function(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        }
    };
}

GetController();