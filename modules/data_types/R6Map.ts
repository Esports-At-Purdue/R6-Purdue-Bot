class R6Map {
    name: string

    maps = new Array<string>("Bank", "Border", "Chalet", "Clubhouse", "Coastline", "Kafe Dostoyevsky", "Oregon", "Villa")

    constructor() {
        this.name = this.getRandomMap();
    }

    getRandomMap() {
        let random = Math.floor(Math.random() * this.maps.length);
        return this.maps[random];
    }
}

export {
    R6Map
}