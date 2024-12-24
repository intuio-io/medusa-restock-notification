// src/services/restock.ts
import {
    ProductVariantService,
    TransactionBaseService,
} from "@medusajs/medusa"
import { EntityManager } from "typeorm"
import { MedusaError } from "@medusajs/utils"
import { RestockSubscription } from "../models/restock-subscription"
import { Logger } from "@medusajs/medusa/dist/types/global"

type InjectedDependencies = {
    manager: EntityManager
    productVariantService: ProductVariantService
    logger: Logger
}

class RestockService extends TransactionBaseService {
    protected readonly productVariantService_: ProductVariantService
    protected readonly logger_: Logger

    constructor(container: InjectedDependencies) {
        super(container)
        this.productVariantService_ = container.productVariantService
        this.logger_ = container.logger
    }

    /**
     * Subscribes a customer to restock notifications for a specific variant
     */
    async subscribe(
        variantId: string,
        email: string
    ): Promise<RestockSubscription> {
        return await this.atomicPhase_(async (manager) => {
            try {
                // Validate email format
                if (!this.isValidEmail(email)) {
                    throw new MedusaError(
                        MedusaError.Types.INVALID_DATA,
                        "Invalid email format"
                    )
                }

                // Get variant details
                const variant = await this.productVariantService_
                    .withTransaction(manager)
                    .retrieve(variantId, {
                        relations: ["product"],
                        select: ["id", "title", "inventory_quantity", "product_id"]
                    })

                if (!variant) {
                    throw new MedusaError(
                        MedusaError.Types.NOT_FOUND,
                        `Variant with id ${variantId} not found`
                    )
                }

                if (variant.inventory_quantity > 0) {
                    throw new MedusaError(
                        MedusaError.Types.INVALID_DATA,
                        `Product ${variant.product.title} - ${variant.title} is currently in stock`
                    )
                }

                const subscriptionRepo = manager.getRepository(RestockSubscription)

                // Check for existing subscription
                const existingSubscription = await subscriptionRepo.findOne({
                    where: {
                        email,
                        variant_id: variantId,
                        notified: false,
                    },
                })

                if (existingSubscription) {
                    throw new MedusaError(
                        MedusaError.Types.DUPLICATE_ERROR,
                        `Already subscribed to restock notifications for this product`
                    )
                }

                // Create subscription
                const subscription = subscriptionRepo.create({
                    email,
                    variant_id: variantId,
                    product_title: variant.product.title,
                    variant_title: variant.title,
                    notified: false,
                })

                return await subscriptionRepo.save(subscription)
            } catch (error) {
                this.logger_.error("Error in subscribe:", error)
                throw error
            }
        })
    }

    /**
     * Gets all subscribers for a variant that haven't been notified
     */
    async getSubscribers(variantId: string): Promise<RestockSubscription[]> {
        return await this.atomicPhase_(async (manager) => {
            const subscriptionRepo = manager.getRepository(RestockSubscription)
            return await subscriptionRepo.find({
                where: {
                    variant_id: variantId,
                    notified: false,
                },
                order: {
                    created_at: "ASC"
                }
            })
        })
    }

    /**
     * Marks subscribers as notified
     */
    async markNotified(subscriptionIds: string[]): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const subscriptionRepo = manager.getRepository(RestockSubscription)
            await subscriptionRepo.update(
                subscriptionIds,
                { notified: true }
            )
        })
    }

    /**
     * Gets user's subscriptions
     */
    async listSubscriptions(
        email: string,
    ): Promise<RestockSubscription[]> {
        return await this.atomicPhase_(async (manager) => {
            const subscriptionRepo = manager.getRepository(RestockSubscription)
            return await subscriptionRepo.find({
                where: { email },
                order: { created_at: "DESC" }
            })
        })
    }

    /**
 * Check if user is subscribed to a variant
 */
    async isSubscribed(
        email: string,
        variantId: string
    ): Promise<{
        is_subscribed: boolean,
        subscription?: RestockSubscription
    }> {
        return await this.atomicPhase_(async (manager) => {
            const subscriptionRepo = manager.getRepository(RestockSubscription)

            const subscription = await subscriptionRepo.findOne({
                where: {
                    email,
                    variant_id: variantId,
                    notified: false, // Only consider active subscriptions
                },
            })

            return {
                is_subscribed: !!subscription,
                subscription: subscription || undefined
            }
        })
    }


    /**
     * Removes a subscription (customer endpoint)
     */
    async removeSubscription(
        id: string,
        email: string
    ): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const subscriptionRepo = manager.getRepository(RestockSubscription)

            const subscription = await subscriptionRepo.findOne({
                where: { id, email }
            })

            if (!subscription) {
                throw new MedusaError(
                    MedusaError.Types.NOT_FOUND,
                    `Subscription with id ${id} not found for email ${email}`
                )
            }

            await subscriptionRepo.remove(subscription)
        })
    }


    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }
}

export default RestockService