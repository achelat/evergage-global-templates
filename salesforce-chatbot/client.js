(function () {

    const CHATBOT_SELECTORS = {
        ChatHeader: "embeddedservice-chat-header",
        CloseButton: "embeddedservice-chat-header .closeButton",
        StartButton: ".embeddedServiceSidebarFeature .startButton"
    };

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
    function openChatbot() {
        if (embedded_svc) {
            embedded_svc.inviteAPI.inviteButton.acceptInvite();
        }
    }

    function sendStatOfType({ context, statType }) {
        SalesforceInteractions.mcis.sendStat({
            campaignStats: [{
                control: context.userGroup === "Control",
                experienceId: context.experience,
                stat: statType
            }]
        });
    }

    function bindCloseButtonClick({ context }) {
        SalesforceInteractions.cashDom(CHATBOT_SELECTORS.CloseButton).on("click", () => {
            sendStatOfType({ context, statType: "Dismissal" });
        });
    }

    function bindStartButtonClick({ context }) {
        SalesforceInteractions.cashDom(CHATBOT_SELECTORS.StartButton).on("click", () => {
            const inputFirstName = SalesforceInteractions.cashDom("#FirstName");
            const inputLastName = SalesforceInteractions.cashDom("#LastName");

            if (inputFirstName.val().length && inputLastName.val().length > 0) {
                sendStatOfType({ context, statType: "Clickthrough" });
            }
        });
    }

    function sendChatbotStats({ context }) {
        return SalesforceInteractions.DisplayUtils
            .bind(buildBindId(context))
            .pageElementLoaded(CHATBOT_SELECTORS.ChatHeader)
            .then(() => {
                sendStatOfType({ context, statType: "Impression" });

                bindCloseButtonClick({ context });
                bindStartButtonClick({ context });
            });
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
                        if (userGroup !== "Control") {
                            openChatbot();
                        }
                        sendChatbotStats({ context });
                        resolve(true);
                    }, triggerOptionsNumber);
                });
            case "inactivity":
                return SalesforceInteractions.DisplayUtils
                    .bind(buildBindId(context))
                    .pageInactive(triggerOptionsNumber)
                    .then(() => {
                        if (userGroup !== "Control") {
                            openChatbot();
                        }
                        sendChatbotStats({ context });
                    });
        }
    }

    function handleChatBotWhenTrue(context) {
        const predicate = () => typeof (((window.embedded_svc || {}).inviteAPI || {}).inviteButton || {}).acceptInvite === "function";

        return SalesforceInteractions.util.resolveWhenTrue
            .bind(predicate, buildBindId(context), 5000, 100)
            .then(() => {
                console.log('context before handleTriggerEvent: ', context);
                return handleTriggerEvent({ context });
            })
            .catch((e) => {
                console.error('Error in `apply`: ', e);
            });
    }

    function apply(context) {
        if (SalesforceInteractions.cashDom(CHATBOT_SELECTORS.ChatHeader).length > 0) return;

        return handleChatBotWhenTrue(context);
    }

    function reset(context) {
        SalesforceInteractions.DisplayUtils.unbind(buildBindId(context));
        SalesforceInteractions.cashDom(`${CHATBOT_SELECTORS.ChatHeader}, ${CHATBOT_SELECTORS.CloseButton}, ${CHATBOT_SELECTORS.StartButton}`).remove();
    }

    function control(context) {
        return handleChatBotWhenTrue(context);
    }

    registerTemplate({
        apply: apply,
        reset: reset,
        control: control
    });

})();
