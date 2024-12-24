import { ProductVariantService, TransactionBaseService } from "@medusajs/medusa";
import { EntityManager } from "typeorm";
import { RestockSubscription } from "../models/restock-subscription";
import { Logger } from "@medusajs/medusa/dist/types/global";
type InjectedDependencies = {
    manager: EntityManager;
    productVariantService: ProductVariantService;
    logger: Logger;
};
declare class RestockService extends TransactionBaseService {
    protected readonly productVariantService_: ProductVariantService;
    protected readonly logger_: Logger;
    constructor(container: InjectedDependencies);
    /**
     * Subscribes a customer to restock notifications for a specific variant
     */
    subscribe(variantId: string, email: string): Promise<RestockSubscription>;
    /**
     * Gets all subscribers for a variant that haven't been notified
     */
    getSubscribers(variantId: string): Promise<RestockSubscription[]>;
    /**
     * Marks subscribers as notified
     */
    markNotified(subscriptionIds: string[]): Promise<void>;
    /**
     * Gets user's subscriptions
     */
    listSubscriptions(email: string): Promise<RestockSubscription[]>;
    /**
 * Check if user is subscribed to a variant
 */
    isSubscribed(email: string, variantId: string): Promise<{
        is_subscribed: boolean;
        subscription?: RestockSubscription;
    }>;
    /**
     * Removes a subscription (customer endpoint)
     */
    removeSubscription(id: string, email: string): Promise<void>;
    private isValidEmail;
}
export default RestockService;
