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
     * @function handleChatbot
     * @param {Object} context
     * @description calls a function 'embedded_svc.inviteAPI.inviteButton.acceptInvite();'
     * to activate the chatbot session
     */
    function handleChatbot({ context, template }) {
        embedded_svc.inviteAPI.inviteButton.acceptInvite();
    }

    /**
     * @function handleTriggerEvent
     * @param {Object} context
     * @description Create trigger event based on context
     */
    function handleTriggerEvent({ context, template }) {
        if (!context.contentZone) return;

        const { userGroup, triggerOptions, triggerOptionsNumber } = context || {};


        switch (triggerOptions.name) {
            case "timeOnPage":
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (userGroup === "Control") return true;

                        handleChatbot({ context, template });
                        resolve(true);
                    }, triggerOptionsNumber);
                });
            case "scrollDepth":
                return SalesforceInteractions.DisplayUtils
                    .bind(buildBindId(context))
                    .pageScroll(triggerOptionsNumber)
                    .then((event) => {
                        if (userGroup === "Control") return true;

                        handleChatbot({ context, template });
                    });
            case "inactivity":
                return SalesforceInteractions.DisplayUtils
                    .bind(buildBindId(context))
                    .pageInactive(triggerOptionsNumber)
                    .then((event) => {
                        if (userGroup === "Control") return true;

                        handleChatbot({ context, template });
                    });
        }
    }

    function apply(context, template) {

        return new Promise((resolve, reject) => {

            SalesforceInteractions.mcis.sendStat({
                campaignStats: [
                    {
                        control: false,
                        experienceId: context.experience,
                        stat: "Impression"
                    }
                ]
            });
            handleTriggerEvent({ context, template })
                .then(() => {
                    Evergage.DisplayUtils
                        .bind(buildBindId(context))
                        .pageElementLoaded("embeddedservice-chat-header")
                        .then(() => {
                            //Add click listener to the "X" button that removes the chatbot from the DOM.
                            SalesforceInteractions.cashDom("embeddedservice-chat-header")
                                .find(".closeButton")
                                .on("click", () => {
                                    SalesforceInteractions.mcis.sendStat({
                                        campaignStats: [
                                            {
                                                control: false,
                                                experienceId: context.experience,
                                                stat: "Dismissal"
                                            }
                                        ]
                                    });
                                });
                        });
                });
        });
    }

    function reset(context, template) {
        SalesforceInteractions.DisplayUtils.unbind(buildBindId(context));
        SalesforceInteractions.cashDom("embeddedservice-chat-header").remove();
    }

    function control(context) {
        return handleTriggerEvent({ context });
    }

    registerTemplate({
        apply: apply,
        reset: reset,
        control: control
    });

})();
