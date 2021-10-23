import {Collection, Guild} from "discord.js";
import {User} from "../db_types/User";

class UserManager {
    private cache: Collection<string, User>;
    private guild: Guild;

    constructor(guild: Guild) {
        this.guild = guild;
    }

    async create() {

    }

    async synchronize() {
        let cache = new Collection<string, User>();
        let games = await User.findAll();
        games.forEach(user => {
            cache.set(user.getId(), user);
        })
        this.cache = cache;
    }

    async sort(members: Array<User>) {
        members.sort(function(a,b) {
            let pointsOne = a.getPoints();
            let pointsTwo = b.getPoints();
            if (pointsOne < pointsTwo) {
                return -1;
            }
            if (pointsTwo < pointsOne) {
                return 1;
            }
            return 0;
        });
        return members;
    }
}

export {
    UserManager
}

/*
async function sortMembersByPoints(members: Array<User>) {
    members.sort(function(a,b) {
        let pointsOne = a.points;
        let pointsTwo = b.points;
        if (pointsOne < pointsTwo) {
            return -1;
        }
        if (pointsTwo < pointsOne) {
            return 1;
        }
        return 0;
    });
    return members;
}
 */