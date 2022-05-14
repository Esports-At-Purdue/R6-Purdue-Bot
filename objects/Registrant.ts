export default class Registrant {
    private _uplay: string;
    private _discord: string;
    private _purdue: boolean;
    private _solo: boolean;
    private _sub: boolean;
    private _partner: Registrant;

    constructor(uplay: string, discord: string, purdue: boolean, solo: boolean, sub: boolean, partner: Registrant) {
        this._uplay = uplay;
        this._discord = discord;
        this._purdue = purdue;
        this._solo = solo;
        this._sub = sub;
        this._partner = partner;
    }

    get uplay(): string {
        return this._uplay;
    }

    set uplay(value: string) {
        this._uplay = value;
    }

    get discord(): string {
        return this._discord;
    }

    set discord(value: string) {
        this._discord = value;
    }

    get purdue(): boolean {
        return this._purdue;
    }

    set purdue(value: boolean) {
        this._purdue = value;
    }

    get solo(): boolean {
        return this._solo;
    }

    set solo(value: boolean) {
        this._solo = value;
    }

    get sub(): boolean {
        return this._sub;
    }

    set sub(value: boolean) {
        this._sub = value;
    }

    get partner(): Registrant {
        return this._partner;
    }

    set partner(value: Registrant) {
        this._partner = value;
    }
}