// src/models/restock-subscription.ts
import { BeforeInsert, Column, Entity } from "typeorm"
import { BaseEntity, generateEntityId } from "@medusajs/medusa"

@Entity()
export class RestockSubscription extends BaseEntity {
    @Column({ type: "varchar" })
    email: string

    @Column({ type: "varchar" })
    variant_id: string

    @Column({ type: "varchar" })
    product_title: string

    @Column({ type: "varchar" })
    variant_title: string

    @Column({ type: "boolean", default: false })
    notified: boolean

    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "rst")
    }
}