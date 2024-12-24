// src/migrations/1700000000000-create-restock-subscription.ts
import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class RestockNotification1732167791364 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "restock_subscription",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        isPrimary: true,
                    },
                    {
                        name: "email",
                        type: "varchar",
                    },
                    {
                        name: "variant_id",
                        type: "varchar",
                    },
                    {
                        name: "product_title",
                        type: "varchar",
                    },
                    {
                        name: "variant_title",
                        type: "varchar",
                    },
                    {
                        name: "notified",
                        type: "boolean",
                        default: false,
                    },
                    {
                        name: "created_at",
                        type: "timestamp with time zone",
                        default: "now()",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp with time zone",
                        default: "now()",
                    },
                ],
                foreignKeys: [
                    {
                        name: "fk_restock_variant",
                        columnNames: ["variant_id"],
                        referencedTableName: "product_variant",
                        referencedColumnNames: ["id"],
                        onDelete: "CASCADE"
                    }
                ]
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("restock_subscription")
    }
}