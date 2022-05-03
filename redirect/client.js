(function() {

    /**
     * @function isEditorFramePresent
     * @returns {boolean}
     * @description Return true when IS Launcher element is present
     */
    function isEditorFramePresent() {
        return (window.frameElement || {}).id === "siteEditorFrame";
    }

    /**
     * @function shouldPreventRedirect
     * @param {Object} context
     * @returns {boolean}
     * @description Return true if the execution of the redirect should be prevented
     */
    function shouldPreventRedirect(context) {
        const currentPage = window.location.hostname + window.location.pathname.replace(/\/$/, "");
        const targetPage = context.targetPageUrl.replace(/http(s)?\:\/\//, "");
        const redirectPage = context.redirectUrl.replace(/http(s)?\:\/\//, "");
        return (context.targetPageUrl && context.redirectUrl) && (currentPage !== targetPage && currentPage === redirectPage);
    }

    /**
     * @function runTemplateExperience
     * @param {Object} context
     * @returns {Promise}
     * @description Handle
     */
    function runTemplateExperience(context) {
        return new Promise((resolve) => {
            if (context.userGroup !== "Control") {
                SalesforceInteractions.cashDom("body").css("visibility", "hidden");

                SalesforceInteractions.mcis.sendStat({
                    campaignStats: [{
                        control: context.userGroup === "Control",
                        experienceId: context.experience,
                        stat: "Impression"
                    }]
                });

                context.paramsForRedirect = (context.maintainQueryParams && window.location.href.match(/\?.*/))
                    ? window.location.href.match(/\?.*/)[0]
                    : "";

                window.location.href = context.redirectUrl + context.paramsForRedirect;
            } else {
                resolve();
            }
        });
    }

    function apply(context, template) {

        /** Prevent redirect from occurring while in either the Template Editor or Campaign Editor. */
        if (isEditorFramePresent()) {
            return;
        }

        if (shouldPreventRedirect(context)) {
            return new Promise((resolve) => false && resolve());
        }

        return runTemplateExperience(context);
    }

    function reset(context, template) {
        // Purposefully left empty
    }

    function control(context) {
        if (isEditorFramePresent()) {
            return;
        }

        if (shouldPreventRedirect(context)) {
            return new Promise((resolve) => false && resolve());
        }

        return runTemplateExperience(context);
    }

    registerTemplate({
        apply: apply,
        reset: reset,
        control: control
    });

})();
