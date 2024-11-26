import { ProductVariantService, TransactionBaseService } from "@medusajs/medusa";
import { EntityManager } from "typeorm";
import { Logger } from "@medusajs/medusa/dist/types/global";
type InjectedDependencies = {
    manager: EntityManager;
    productVariantService: ProductVariantService;
    logger: Logger;
};
type PaginatedResponse<T> = {
    items: T[];
    count: number;
    limit: number;
    offset: number;
    hasMore: boolean;
};
type SubscriptionDetails = {
    list_id: string;
    list_name: string;
    variant_id: string;
    product_title?: string;
    variant_title?: string;
};
declare class RestockService extends TransactionBaseService {
    protected readonly productVariantService_: ProductVariantService;
    protected readonly logger_: Logger;
    private readonly sendgridClient_;
    private readonly sendgridMail_;
    constructor(container: InjectedDependencies);
    /**
 * Get or create SendGrid list for a variant
 */
    private getOrCreateList;
    /**
    * Subscribe to restock notifications
    */
    subscribe(variantId: string, email: string): Promise<{
        success: boolean;
    }>;
    /**
     * Send restock notification to subscribers
     */
    sendNotification(variant: any): Promise<void>;
    /**
 * Check subscription status
 */
    isSubscribed(email: string, variantId: string): Promise<{
        is_subscribed: boolean;
    }>;
    /**
 * Get contact ID from email
 */
    private getContactId;
    /**
    * Remove subscription
    */
    removeSubscription(variantId: string, email: string): Promise<void>;
    /**
 * Remove subscription by list ID
 */
    removeSubscriptionByListId(email: string, listId: string): Promise<void>;
    /**
     * Parse list name to extract variant details
     */
    private parseListName;
    /**
     * List subscriptions for an email with pagination
     */
    listSubscriptions(email: string, limit?: number, offset?: number): Promise<PaginatedResponse<SubscriptionDetails>>;
    /**
     * Subscribes a customer to restock notifications for a specific variant
     */
    /**
     * Gets all subscribers for a variant that haven't been notified
     */
    /**
     * Marks subscribers as notified
     */
    /**
     * Gets user's subscriptions
     */
    /**
 * Check if user is subscribed to a variant
 */
    /**
     * Removes a subscription (customer endpoint)
     */
    private isValidEmail;
}
export default RestockService;
