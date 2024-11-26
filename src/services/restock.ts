// src/services/restock.ts
import {
    ProductVariantService,
    TransactionBaseService,
} from "@medusajs/medusa"
import { EntityManager } from "typeorm"
import { MedusaError } from "@medusajs/utils"
// import { RestockSubscription } from "../models/restock-subscription"
import { Logger } from "@medusajs/medusa/dist/types/global"
import { Client } from "@sendgrid/client"
import { MailService } from "@sendgrid/mail"

type InjectedDependencies = {
    manager: EntityManager
    productVariantService: ProductVariantService
    logger: Logger
}

type PaginatedResponse<T> = {
    items: T[]
    count: number
    limit: number
    offset: number
    hasMore: boolean
}

type SubscriptionDetails = {
    list_id: string
    list_name: string
    variant_id: string
    product_title?: string
    variant_title?: string
}

type ParsedListName = {
    variantId: string
    variantTitle: string
}

class RestockService extends TransactionBaseService {
    protected readonly productVariantService_: ProductVariantService
    protected readonly logger_: Logger
    private readonly sendgridClient_: Client
    private readonly sendgridMail_: MailService

    constructor(container: InjectedDependencies) {
        super(container)
        this.productVariantService_ = container.productVariantService
        this.logger_ = container.logger

        // Initialize SendGrid clients
        this.sendgridClient_ = new Client()
        this.sendgridClient_.setApiKey(process.env.SENDGRID_API_KEY)

        this.sendgridMail_ = new MailService()
        this.sendgridMail_.setApiKey(process.env.SENDGRID_API_KEY)
    }


    /**
 * Get or create SendGrid list for a variant
 */
    private async getOrCreateList(variantId: string, variantTitle: string): Promise<string> {
        try {
            // Try to find existing list
            const requestGet: any = {
                url: `/v3/marketing/lists`,
                method: 'GET',
                qs: {
                    page_size: 100
                }
            }

            const [response]: any = await this.sendgridClient_.request(requestGet)
            const existingList = response.body.result?.find(
                list => list.name === `${variantTitle}-${variantId}`
            )

            if (existingList) {
                return existingList.id
            }

            // Create new list if not found
            const requestCreate: any = {
                url: `/v3/marketing/lists`,
                method: 'POST',
                body: {
                    name: `${variantTitle}-${variantId}`,
                }
            }

            const [createResponse]: any = await this.sendgridClient_.request(requestCreate)
            return createResponse.body.id

        } catch (error) {
            this.logger_.error("SendGrid List Error:", error)
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Failed to manage SendGrid list"
            )
        }
    }

    /**
    * Subscribe to restock notifications
    */
    async subscribe(
        variantId: string,
        email: string
    ): Promise<{ success: boolean }> {
        try {
            if (!this.isValidEmail(email)) {
                throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    "Invalid email format"
                )
            }

            const variant = await this.productVariantService_.retrieve(variantId, {
                relations: ["product"]
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

            // // Get or create list
            const listId = await this.getOrCreateList(variantId, variant.title)

            // Add contact to list
            await this.sendgridClient_.request({
                url: `/v3/marketing/contacts`,
                method: 'PUT',
                body: {
                    list_ids: [listId],
                    contacts: [{
                        email,
                        custom_fields: {
                            variant_id: variantId,
                            product_title: variant.product.title,
                            variant_title: variant.title
                        }
                    }]
                }
            })

            return { success: true }

        } catch (error) {
            this.logger_.error("Error in subscribe:", error)
            throw error
        }
    }


    /**
     * Send restock notification to subscribers
     */
    async sendNotification(variant: any): Promise<void> {
        try {
            const listId = await this.getOrCreateList(variant.id, variant.title)

            // Get subscribers from list
            const [response]: any = await this.sendgridClient_.request({
                url: `/v3/marketing/contacts/search`,
                method: 'POST',
                body: {
                    query: `CONTAINS(list_ids, '${listId}')`
                }
            })

            if (!response.body.contact_count) {
                return
            }

            const fromEmail = process.env.SENDGRID_FROM
            const bccEmails = response.body.result
                .map(contact => contact.email)
                .filter(email => email !== fromEmail)

            // Send email using SendGrid Mail Service
            await this.sendgridMail_.send({
                templateId: process.env.SENDGRID_RESTOCK_TEMPLATE_ID,
                from: {
                    email: fromEmail,
                },
                personalizations: [{
                    to: fromEmail,
                    bcc: bccEmails.map(email => ({
                        email
                    })),
                    dynamicTemplateData: {
                        product_title: variant.product.title,
                        variant_title: variant.title,
                        current_stock: variant.inventory_quantity
                    }
                }]
            })

            // Optionally, remove contacts from list after notification
            // await this.sendgridClient_.request({
            //     url: `/v3/marketing/lists/${listId}/contacts`,
            //     method: 'DELETE',
            //     body: {
            //         contacts: response.body.result.map(contact => contact.email)
            //     }
            // })

        } catch (error) {
            this.logger_.error("Error sending notifications:", error)
            throw error
        }
    }

    /**
 * Check subscription status
 */
    async isSubscribed(
        email: string,
        variantId: string
    ): Promise<{ is_subscribed: boolean }> {
        try {


            const variant = await this.productVariantService_.retrieve(variantId, {
                relations: ["product"]
            })


            const listId = await this.getOrCreateList(variantId, variant?.title)


            const [response]: any = await this.sendgridClient_.request({
                url: `/v3/marketing/contacts/search`,
                method: 'POST',
                body: {
                    query: `email LIKE '${email}' AND CONTAINS(list_ids, '${listId}')`
                }
            })

            return {
                is_subscribed: response.body.contact_count > 0
            }

        } catch (error) {
            this.logger_.error("Error checking subscription:", error)
            throw error
        }
    }

    /**
 * Get contact ID from email
 */
    private async getContactId(email: string): Promise<string | null> {
        try {
            const [response]: any = await this.sendgridClient_.request({
                url: `/v3/marketing/contacts/search`,
                method: 'POST',
                body: {
                    query: `email = '${email}'`
                }
            })

            if (response.body.contact_count > 0) {
                return response.body.result[0].id
            }

            return null
        } catch (error) {
            this.logger_.error("Error getting contact ID:", error)
            throw error
        }
    }

    /**
    * Remove subscription
    */
    async removeSubscription(
        variantId: string,
        email: string
    ): Promise<void> {
        try {
            // Get contact ID
            const contactId = await this.getContactId(email)

            if (!contactId) {
                throw new MedusaError(
                    MedusaError.Types.NOT_FOUND,
                    `No contact found for email ${email}`
                )
            }


            const variant = await this.productVariantService_.retrieve(variantId, {
                relations: ["product"]
            })


            const listId = await this.getOrCreateList(variantId, variant?.title)

            await this.sendgridClient_.request({
                url: `/v3/marketing/lists/${listId}/contacts`,
                method: 'DELETE',
                qs: {
                    contact_ids: contactId
                }
            })
        } catch (error) {
            this.logger_.error("Error removing subscription:", error)
            throw error
        }
    }


    /**
 * Remove subscription by list ID
 */
    async removeSubscriptionByListId(
        email: string,
        listId: string
    ): Promise<void> {
        try {
            // Get contact ID
            const contactId = await this.getContactId(email)

            if (!contactId) {
                throw new MedusaError(
                    MedusaError.Types.NOT_FOUND,
                    `No contact found for email ${email}`
                )
            }

            // Remove contact from list
            await this.sendgridClient_.request({
                url: `/v3/marketing/lists/${listId}/contacts`,
                method: 'DELETE',
                qs: {
                    contact_ids: contactId
                }
            })

        } catch (error) {
            this.logger_.error("Error removing subscription:", error)
            throw error
        }
    }


    /**
     * Parse list name to extract variant details
     */
    private parseListName(listName: string): ParsedListName | null {
        // Example list name: "Small / Blue-variant_123"
        const lastHyphenIndex = listName.lastIndexOf('-')
        if (lastHyphenIndex === -1) return null

        const variantId = listName.slice(lastHyphenIndex + 1)
        const variantTitle = listName.slice(0, lastHyphenIndex)

        return {
            variantId,
            variantTitle
        }
    }

    /**
     * List subscriptions for an email with pagination
     */
    async listSubscriptions(
        email: string,
        limit = 10,
        offset = 0
    ): Promise<PaginatedResponse<SubscriptionDetails>> {
        try {
            // Get contact details
            const contactId = await this.getContactId(email)
            if (!contactId) {
                return {
                    items: [],
                    count: 0,
                    limit,
                    offset,
                    hasMore: false
                }
            }

            // Get lists for the current page only
            const [listsResponse]: any = await this.sendgridClient_.request({
                url: `/v3/marketing/lists`,
                method: 'GET',
                qs: {
                    page_size: limit,
                    page: Math.floor(offset / limit) + 1
                }
            })



            // Get contact's subscribed lists
            const [contactResponse]: any = await this.sendgridClient_.request({
                url: `/v3/marketing/contacts/${contactId}`,
                method: 'GET'
            })

            const subscribedListIds = contactResponse.body.list_ids || []

            // Filter and parse subscribed lists
            const subscriptions = (listsResponse.body.result || [])
                .filter(list => subscribedListIds.includes(list.id))
                .map(list => {
                    const parsed = this.parseListName(list.name)
                    if (!parsed) return null

                    return {
                        list_id: list.id,
                        list_name: list.name,
                        variant_id: parsed.variantId,
                        variant_title: parsed.variantTitle
                    }
                })
                .filter(Boolean) // Remove null entries

            if (subscriptions.length === 0) {
                return {
                    items: [],
                    count: 0,
                    limit,
                    offset,
                    hasMore: false
                }
            }

            // Get product details
            const variantIds = subscriptions.map(sub => sub.variant_id)
            const variants = await Promise.all(
                variantIds.map(id =>
                    this.productVariantService_.retrieve(id, {
                        relations: ["product"]
                    }).catch(err => null)
                )
            )

            // Combine data
            const items = subscriptions.map((subscription, index) => {
                const variant = variants[index]
                return {
                    ...subscription,
                    product_title: variant?.product?.title || 'Product Not Found',
                    // We already have variant_title from the list name
                }
            })

            return {
                items,
                count: listsResponse?.body?.metadata?.count || items.length,
                limit,
                offset,
                hasMore: (offset + items.length) < listsResponse?.body?.metadata?.count
            }
        } catch (error) {
            this.logger_.error("Error listing subscriptions:", error)
            throw error
        }
    }


    /**
     * Subscribes a customer to restock notifications for a specific variant
     */
    // async subscribe(
    //     variantId: string,
    //     email: string
    // ): Promise<RestockSubscription> {
    //     return await this.atomicPhase_(async (manager) => {

    //         try {
    //             // Validate email format
    //             if (!this.isValidEmail(email)) {
    //                 throw new MedusaError(
    //                     MedusaError.Types.INVALID_DATA,
    //                     "Invalid email format"
    //                 )
    //             }

    //             // Get variant details
    //             const variant = await this.productVariantService_
    //                 .withTransaction(manager)
    //                 .retrieve(variantId, {
    //                     relations: ["product"],
    //                     select: ["id", "title", "inventory_quantity", "product_id"]
    //                 })

    //             if (!variant) {
    //                 throw new MedusaError(
    //                     MedusaError.Types.NOT_FOUND,
    //                     `Variant with id ${variantId} not found`
    //                 )
    //             }

    //             if (variant.inventory_quantity > 0) {
    //                 throw new MedusaError(
    //                     MedusaError.Types.INVALID_DATA,
    //                     `Product ${variant.product.title} - ${variant.title} is currently in stock`
    //                 )
    //             }
    //             const listId = await this.getOrCreateList(variantId, variant.title)

    //             const subscriptionRepo = manager.getRepository(RestockSubscription)

    //             // Check for existing subscription
    //             const existingSubscription = await subscriptionRepo.findOne({
    //                 where: {
    //                     email,
    //                     variant_id: variantId,
    //                     notified: false,
    //                 },
    //             })

    //             if (existingSubscription) {
    //                 throw new MedusaError(
    //                     MedusaError.Types.DUPLICATE_ERROR,
    //                     `Already subscribed to restock notifications for this product`
    //                 )
    //             }

    //             // Create subscription
    //             const subscription = subscriptionRepo.create({
    //                 email,
    //                 variant_id: variantId,
    //                 product_title: variant.product.title,
    //                 variant_title: variant.title,
    //                 notified: false,
    //             })

    //             return await subscriptionRepo.save(subscription)
    //         } catch (error) {
    //             this.logger_.error("Error in subscribe:", error)
    //             throw error
    //         }
    //     })
    // }

    /**
     * Gets all subscribers for a variant that haven't been notified
     */
    // async getSubscribers(variantId: string): Promise<RestockSubscription[]> {
    //     return await this.atomicPhase_(async (manager) => {
    //         const subscriptionRepo = manager.getRepository(RestockSubscription)
    //         return await subscriptionRepo.find({
    //             where: {
    //                 variant_id: variantId,
    //                 notified: false,
    //             },
    //             order: {
    //                 created_at: "ASC"
    //             }
    //         })
    //     })
    // }

    /**
     * Marks subscribers as notified
     */
    // async markNotified(subscriptionIds: string[]): Promise<void> {
    //     return await this.atomicPhase_(async (manager) => {
    //         const subscriptionRepo = manager.getRepository(RestockSubscription)
    //         await subscriptionRepo.update(
    //             subscriptionIds,
    //             { notified: true }
    //         )
    //     })
    // }

    /**
     * Gets user's subscriptions
     */
    // async listSubscriptions(
    //     email: string,
    // ): Promise<RestockSubscription[]> {
    //     return await this.atomicPhase_(async (manager) => {
    //         const subscriptionRepo = manager.getRepository(RestockSubscription)
    //         return await subscriptionRepo.find({
    //             where: { email },
    //             order: { created_at: "DESC" }
    //         })
    //     })
    // }

    /**
 * Check if user is subscribed to a variant
 */
    // async isSubscribed(
    //     email: string,
    //     variantId: string
    // ): Promise<{
    //     is_subscribed: boolean,
    //     subscription?: RestockSubscription
    // }> {
    //     return await this.atomicPhase_(async (manager) => {
    //         const subscriptionRepo = manager.getRepository(RestockSubscription)

    //         const subscription = await subscriptionRepo.findOne({
    //             where: {
    //                 email,
    //                 variant_id: variantId,
    //                 notified: false, // Only consider active subscriptions
    //             },
    //         })

    //         return {
    //             is_subscribed: !!subscription,
    //             subscription: subscription || undefined
    //         }
    //     })
    // }


    /**
     * Removes a subscription (customer endpoint)
     */
    // async removeSubscription(
    //     id: string,
    //     email: string
    // ): Promise<void> {
    //     return await this.atomicPhase_(async (manager) => {
    //         const subscriptionRepo = manager.getRepository(RestockSubscription)

    //         const subscription = await subscriptionRepo.findOne({
    //             where: { id, email }
    //         })

    //         if (!subscription) {
    //             throw new MedusaError(
    //                 MedusaError.Types.NOT_FOUND,
    //                 `Subscription with id ${id} not found for email ${email}`
    //             )
    //         }

    //         await subscriptionRepo.remove(subscription)
    //     })
    // }


    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }
}

export default RestockService