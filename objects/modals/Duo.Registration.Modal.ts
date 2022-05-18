import {MessageActionRow, Modal, TextInputComponent} from "discord.js";

const uplayPrompt = "What is your Uplay Username?";
const purduePrompt = "Are you a Purdue student/grad? (yes/no)";
const paymentPrompt = "What is your PayPal/Venmo? (Include Phone #)";
const captainPrompt = "Do you want to be a captain? (yes/no)";
const duoUplayPrompt = "What is your partner's Uplay Username?";

export default class DuoRegistrationModal extends Modal {
    constructor() {
        super();
        const uplayInput = new TextInputComponent().setCustomId("uplay").setLabel(uplayPrompt).setStyle("SHORT");
        const purdueInput = new TextInputComponent().setCustomId("purdue").setLabel(purduePrompt).setStyle("SHORT");
        const paymentInput = new TextInputComponent().setCustomId("payment").setLabel(paymentPrompt).setStyle("SHORT");
        const captainInput = new TextInputComponent().setCustomId("captain").setLabel(captainPrompt).setStyle("SHORT");
        const duoUplayInput = new TextInputComponent().setCustomId("partner-uplay").setLabel(duoUplayPrompt).setStyle("SHORT");
        const row = new MessageActionRow().addComponents(uplayInput);
        const row2 = new MessageActionRow().addComponents(purdueInput);
        const row3 = new MessageActionRow().addComponents(paymentInput);
        const row4 = new MessageActionRow().addComponents(captainInput);
        const row5 = new MessageActionRow().addComponents(duoUplayInput);
        // @ts-ignore
        this.addComponents(row, row2, row3, row4, row5).setCustomId("duo").setTitle("Summer League Solo Registration");
    }
}