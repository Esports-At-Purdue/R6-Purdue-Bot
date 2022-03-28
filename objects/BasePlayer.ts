export default class BasePlayer{
    private _id: string;
    private _username: string;
    
    constructor(id: string, username: string) {
        this._id = id;
        this._username = username;
    }
    
    static fromObject(object: object) {
        return new BasePlayer(object["_id"], object["_username"]);
    }

    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }

    get username(): string {
        return this._username;
    }

    set username(value: string) {
        this._username = value;
    }
}