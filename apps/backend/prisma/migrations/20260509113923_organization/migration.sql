/*
  Warnings:

  - Added the required column `distanceMeters` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitude` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "distanceMeters" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "allowedRadiusMeters" INTEGER,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
