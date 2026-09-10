-- DropForeignKey
ALTER TABLE `Reading` DROP FOREIGN KEY `Reading_propertyId_fkey`;

-- AlterTable
ALTER TABLE `Property` MODIFY `type` VARCHAR(191) NOT NULL DEFAULT 'comercial';

-- DropTable
DROP TABLE `Reading`;
