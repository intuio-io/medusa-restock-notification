import { BaseEntity } from "@medusajs/medusa";
export declare class RestockSubscription extends BaseEntity {
    email: string;
    variant_id: string;
    product_title: string;
    variant_title: string;
    notified: boolean;
    private beforeInsert;
}
