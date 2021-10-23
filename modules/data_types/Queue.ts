import {User} from "../db_types/User";
import {MessageEmbed} from "discord.js";
import {app} from "../../index";
import {queue_size} from "../../config.json";

class Queue {
    members: Array<User>;

    /**
     * Constructs a Queue
     */
    constructor() {
        this.members = new Array<User>()
    }

    /**
     * Inserts a User into the Queue
     * @param user
     */
    async insert(user: User) {
        if (this.members.length === (queue_size - 1)) {
            app.queue = new Queue();
            this.members.push(user);
            await app.gameManager.create(this.members);
            return app.queue.members;
        }
        this.members.push(user);
        return this.members;
    }

    /**
     * Determines whether the Queue contains a User
     * @param user
     */
    async containsUser(user: User) {
        return this.members.some(function(member) {
            return user.getId() === member.getId();
        })
    }

    /**
     * Removes a User from the Queue
     * @param user
     */
    async remove(user: User) {
        this.members.forEach((member, index) => {
            if (user.getId() === member.getId()) {
                this.members.splice(index, 1);
            }
        })
        return this.members;
    }

    /**
     * Builds a MessageEmbed interface
     */
    async buildEmbed(members: Array<User>) {
        let embed = new MessageEmbed().setTitle("10-Mans Queue").setColor("YELLOW").setTimestamp(new Date())
        let description = '';

        for (let i = 0; i < members.length; i++) {
            let member = await members[i];
            description = description.concat(`**${i + 1}.** ${member.getUsername()}\n`);
        }

        description.length > 0 ? embed.setDescription(description) : embed.setDescription("The queue is currently empty!");

        return embed;
    }

    /**
     * Purges all Users from the Queue
     */
    purge() {
        this.members.splice(0);
    }
}

export {
    Queue
}