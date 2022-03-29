(function () {

    /**
     * @function buildBindId
     * @param {Object} context
     * @description Create unique bind ID based on the campaign and experience IDs.
     */
    function buildBindId(context) {
        return `${context.campaign}:${context.experience}`;
    }


    /**
     * @function openChatbot
     * @param {Object} context
     * @description calls a function 'embedded_svc.inviteAPI.inviteButton.acceptInvite();'
     * to activate the chatbot session
     */
    function openChatbot({ context }) {
        embedded_svc.inviteAPI.inviteButton.acceptInvite();
    }

    /**
     * @function handleTriggerEvent
     * @param {Object} context
     * @description Create trigger event based on context
     */
    function handleTriggerEvent({ context }) {
        if (!context.contentZone) return;

        const { userGroup, triggerOptions, triggerOptionsNumber } = context || {};


        switch (triggerOptions.name) {
            case "timeOnPage":
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (userGroup === "Control") return true;

                        openChatbot({ context });
                        resolve(true);
                    }, triggerOptionsNumber);
                });
            case "inactivity":
                return SalesforceInteractions.DisplayUtils
                    .bind(buildBindId(context))
                    .pageInactive(triggerOptionsNumber)
                    .then(() => {
                        if (userGroup === "Control") return true;

                        openChatbot({ context });
                    });
        }
    }

    function apply(context) {
        return new Promise((resolve, reject) => {
            SalesforceInteractions.mcis.sendStat({
                campaignStats: [{
                    control: false,
                    experienceId: context.experience,
                    stat: "Impression"
                }]
            });
            handleTriggerEvent({ context });
            Evergage.DisplayUtils
                .bind(buildBindId(context))
                .pageElementLoaded("embeddedservice-chat-header")
                .then(() => {
                    //Add click listener to the "X" button that removes the chatbot from the DOM.
                    SalesforceInteractions.cashDom("embeddedservice-chat-header")
                        .find(".closeButton")
                        .on("click", () => {
                            SalesforceInteractions.mcis.sendStat({
                                campaignStats: [{
                                    control: false,
                                    experienceId: context.experience,
                                    stat: "Dismissal"
                                }]
                            });
                        });
                }).then(() => {
                    const inputFirstName = SalesforceInteractions.cashDom("#FirstName");
                    const inputLastName = SalesforceInteractions.cashDom("#LastName");

                    SalesforceInteractions.cashDom(".startButton").on("click", () => {
                        if (inputFirstName.val().length && inputLastName.val().length > 0) {
                            SalesforceInteractions.mcis.sendStat({
                                campaignStats: [{
                                    control: false,
                                    experienceId: context.experience,
                                    stat: "Clickthrough"
                                }]
                            });
                        }
                    });
                });
        });
    }

    function reset(context) {
        SalesforceInteractions.DisplayUtils.unbind(buildBindId(context));
        SalesforceInteractions.cashDom("embeddedservice-chat-header").remove();
        SalesforceInteractions.cashDom(".closeButton").remove();
        SalesforceInteractions.cashDom(".startButton").remove();
    }

    function control(context) {
        return handleTriggerEvent({ context })
    }

    registerTemplate({
        apply: apply,
        reset: reset,
        control: control
    });

})();
