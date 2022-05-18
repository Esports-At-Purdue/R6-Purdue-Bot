export default class Registrant {
    private _uplay: string;
    private _discord: string;
    private _purdue: boolean;
    private _payment: string;
    private _solo: boolean;
    private _sub: boolean;
    private _captain: boolean;
    private _partner: string;

    constructor(uplay: string, discord: string, purdue: boolean, payment: string, solo: boolean, sub: boolean, captain: boolean, partner: string) {
        this._uplay = uplay;
        this._discord = discord;
        this._purdue = purdue;
        this._payment = payment;
        this._solo = solo;
        this._sub = sub;
        this._captain = captain;
        this._partner = partner;
    }

    static fromObject(o) {
        return new Registrant(o._uplay, o._discord, o._purdue, o._payment, o._solo, o._sub, o._captain, o._partner);
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

    get payment(): string {
        return this._payment;
    }

    set payment(value: string) {
        this._payment = value;
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

    get captain(): boolean {
        return this._captain;
    }

    set captain(value: boolean) {
        this._captain = value;
    }

    get partner(): string {
        return this._partner;
    }

    set partner(value: string) {
        this._partner = value;
    }
}