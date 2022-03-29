export class ChatbotTriggerOptions {
    name: string;
    label: string;
}


export class SalesforceChatbot implements CampaignTemplateComponent {

    @options([
        {
            name: "timeOnPage",
            label: "Time on Page (Delay)"
        },
        {
            name: "inactivity",
            label: "Inactivity"
        }
    ])
    triggerOptions: ChatbotTriggerOptions = { name: "", label: "Select..." };

    @shownIf(this, self => self.triggerOptions.name === "timeOnPage")
    @title(" ")
    @subtitle("Second(s) on page")
    secondsOnPage: number = 0;

    @shownIf(this, self => self.triggerOptions.name === "inactivity")
    @title(" ")
    @subtitle("Second(s) of inactivity on page")
    secondsInactive: number = 0;

 
    run(context: CampaignComponentContext) {
        switch (this.triggerOptions.name) {
            case "timeOnPage":
                return {
                    triggerOptionsNumber: this.secondsOnPage * 1000
                };
            case "inactivity":
                return {
                    triggerOptionsNumber: this.secondsInactive * 1000
                };
            default:
                return {};
        }
    }

}

