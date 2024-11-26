import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/medusa";
export default function handleRestockNotification({ data, container, }: SubscriberArgs<{
    id: string;
}>): Promise<void>;
export declare const config: SubscriberConfig;
