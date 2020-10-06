(function() {

    /**
     * @function getBindId
     * @param {Object} context
     * @description Create unique bind ID based on the campaign and experience IDs.
     */
    function getBindId(context) {
        return `${context.campaign}:${context.experience}`;
    }

    /**
     * @function setDismissal
     * @param {Object} context
     * @description Adds click listener to the overlay and "X" button that removes the template from the DOM.
     */
    function setDismissal(context) {
        const dismissSelectors = [
            "#evg-exit-intent-popup .evg-overlay",
            "#evg-exit-intent-popup .evg-btn-dismissal",
        ];

        Evergage.cashDom(dismissSelectors.join(", ")).on("click", () => {
            Evergage.cashDom(`[data-evg-campaign-id=${context.campaign}][data-evg-experience-id=${context.experience}]`)
                .remove();
        });
    }

    function apply(context, template) {
        
        /**
         * The pageExit method waits for the user's cursor to exit through the top edge of the page before rendering the
         * template after a set delay.
         * 
         * Visit the Template Display Utilities documentation to learn more:
         * https://developer.evergage.com/templates/display-utilities
         */
        Evergage.DisplayUtils.bind(getBindId(context)).pageExit(500).then(() => {
            context.overlayClass = context.lightbox ? "evg-overlay" : "";
            const html = template(context);
            Evergage.cashDom("body").append(html);
            setDismissal(context);
        });
    }

    function reset(context, template) {
        Evergage.DisplayUtils.unbind(getBindId(context));
        Evergage.cashDom(`[data-evg-campaign-id=${context.campaign}][data-evg-experience-id=${context.experience}]`)
            .remove();
    }

    function control() {
 
    }
  
    registerTemplate({
      apply: apply,
      reset: reset, 
      control: control
    });

})();