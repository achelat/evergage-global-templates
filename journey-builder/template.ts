import { RecommendationsConfig, RecipeReferenceLookup, RecipeReference, recommend } from "recs";
import { UserAttributeLookup, UserAttributeReference, UserSegmentLookup, UserSegmentReference } from "common";

class Utils {
    static defaultCatalogObject = "Product";
    static defaultCatalogObjectAttributes = ["id", "name", "imageUrl", "url", "price"];
    static maxRecommendations = 8;

    // ================================== Catalog Localization =====================================
    // If you use catalog localization and would like to receive localized catalog data
    // in Marketing Cloud, change the value of 'isCatalogLocalized' to true
    // =============================================================================================
    static isCatalogLocalized = false;

    static getFlatItems(context: CampaignComponentContext, catalogObject: string, ids: string[]): any[] {
        const locale: string = context.locale || "";

        return context.services.catalog
            .findItems(catalogObject, ids)
            .map(item => item.toFlatJSON(Utils.defaultCatalogObjectAttributes, Utils.isCatalogLocalized ? locale : null));
    }

    static getUserAttributeValue(attributeId: string, user: User) {
        return (user?.attributes?.[attributeId] as Attribute|undefined)?.value?.toString() || "";
    }

    static getUserSegments(segments: UserSegmentReference[], user: User) {
        if (segments?.length && user?.segmentMembership?.length) {
            const selectedSegments: string[] = segments.map(s => s.id);
            return user.segmentMembership.filter(sm => selectedSegments.includes(sm.segmentId)).map(sm => sm.segmentName).join(",");
        }
        return "";
    }

    static getRecommendations(recipe: RecipeReference, context: CampaignComponentContext) {
        let result = [];

        if (recipe) {
            const recipeConfig = new RecommendationsConfig();
            recipeConfig.maxResults = Utils.maxRecommendations;
            recipeConfig.recipe = recipe;

            try {
                if (recipeConfig?.recipe?.id) {
                        const recs = recommend(context, recipeConfig).map(i => i.id);
                        result = Utils.getFlatItems(context, recipeConfig.itemType, recs);
                }

                return JSON.stringify(result);

            } catch(ex){}
        }

        return JSON.stringify(result);
    }

    static getTriggerContext(context: CampaignComponentContext): any {
        const result = {};

        if (context.trigger?.type) {
            result["Trigger_Type"] = context.trigger.type;
            let trigger;
            switch (context.trigger.type) {
                case "SegmentLeave":
                case "SegmentJoin":
                    trigger = context.trigger as SegmentTrigger;
                    result["Trigger_Segment"] = trigger.segmentName; 
                    break;
                case "EventAction":
                    trigger = context.trigger as ActionTrigger;
                    result["Trigger_Action"] = trigger.action;                     
                    break;
                default:
                    trigger = context.trigger as CatalogTrigger;
                    const items: any[] = [];

                    if(trigger.itemIdsByType){
                        Object.keys(trigger.itemIdsByType).forEach(catalogObject => {
                            items.push(...Utils.getFlatItems(context, catalogObject, trigger.itemIdsByType[catalogObject]));
                        });
                    }

                    try {
                        result["Trigger_Catalog_Items"] = JSON.stringify(items);
                    } catch (ex) {}
                    break;
            }
        }

        return result;
    }
}

class JourneyBuilderPayload {
    @title(" ")
    @header("User Attributes:")
    @headerSubtitle("After you make your selections, create a field for each user attribute in the event data extension in Marketing Cloud. Data extension field names must match user attribute names.")
    @lookupOptions(() => new UserAttributeLookup())
    attributes: UserAttributeReference[];

    @title(" ")
    @header("Recommendations:")
    @headerSubtitle("After you select a recipe, create a Recommendations field in the event data extension in Marketing Cloud. This action allows you to add a Recommendations block to an email in Marketing Cloud.")
    @lookupOptions(() => new RecipeReferenceLookup(Utils.defaultCatalogObject))
    recipe: RecipeReference;

    @title("Include Additional Recommendations")
    @subtitle("After you select a recipe, create an Additional_Recommendations field in the event data extension in Marketing Cloud. This action allows you to add an Additional Recommendations block to an email in Marketing Cloud.")
    includeAdditionalRecommendations: boolean = false;

    @title(" ")
    @shownIf(this, self => self.includeAdditionalRecommendations)
    @lookupOptions(() => new RecipeReferenceLookup(Utils.defaultCatalogObject))
    additionalRecipe: RecipeReference;

    @title("Include User Segments")
    @subtitle("After you select segments, create an Additional_Segment field in the event data extension in Marketing Cloud.")
    includeSegments: boolean = false;

    @title(" ")
    @shownIf(this, self => self.includeSegments)
    @lookupOptions(() => new UserSegmentLookup())
    segments: UserSegmentReference[];

    getPayload(context: CampaignComponentContext){
        const triggerContext = Utils.getTriggerContext(context);
        
        const result = {
            "Campaign": context.campaignId,
            "Experience": context.experienceId,
            ...triggerContext
        };

        this.attributes?.forEach(attr => {
            result[attr.id] = Utils.getUserAttributeValue(attr.id, context.user);
        });
        
        if (this.includeSegments) {
            result["Segments"] = Utils.getUserSegments(this.segments, context.user);
        }

        if (this.includeAdditionalRecommendations) {
            result["Additional_Recommendations"] = Utils.getRecommendations(this.additionalRecipe, context);
        }

        result["Recommendations"] = Utils.getRecommendations(this.recipe, context);

        return result;
    }
}

export class JourneyBuilderTemplate implements CampaignTemplateComponent {
    @title(" ")
    @header("Optional Settings")
    @headerSubtitle("By default, the trigger includes the ContactKey and Trigger_Type fields. Depending on the trigger type, it also can include Trigger_Segment, Trigger_Action, and Trigger_Catalog_Items fields. To store this data in Marketing Cloud, create these fields in your Marketing Cloud data extension. Select any of the following optional settings so your developer can use the data in the Journey for this campaign. For the data from the options you select to be available in Journey Builder, create the fields in the Marketing Cloud Data Extension.")
    templateConfig: JourneyBuilderPayload = new JourneyBuilderPayload();

    run(context: CampaignComponentContext) {
        return this.templateConfig.getPayload(context);
    }
}