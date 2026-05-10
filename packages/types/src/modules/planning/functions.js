"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCreateShiftForUserDto = isCreateShiftForUserDto;
exports.isCreateShiftForUsersDto = isCreateShiftForUsersDto;
exports.isCreateShiftForCategoryDto = isCreateShiftForCategoryDto;
exports.resolvePublished = resolvePublished;
exports.isValidShiftRange = isValidShiftRange;
exports.hasCategoryId = hasCategoryId;
exports.isNullCategoryId = isNullCategoryId;
exports.uniqueUserIds = uniqueUserIds;
exports.buildCreateShiftResponse = buildCreateShiftResponse;
/* =========================
   TYPE GUARDS
========================= */
function isCreateShiftForUserDto(dto) {
    return "userId" in dto;
}
function isCreateShiftForUsersDto(dto) {
    return "userIds" in dto;
}
function isCreateShiftForCategoryDto(dto) {
    return "categoryId" in dto
        && !("userId" in dto)
        && !("userIds" in dto);
}
/* =========================
   HELPERS
========================= */
function resolvePublished(published) {
    return published ?? false;
}
function isValidShiftRange(startsAt, endsAt) {
    return startsAt < endsAt;
}
function hasCategoryId(categoryId) {
    return typeof categoryId === "number";
}
function isNullCategoryId(categoryId) {
    return categoryId === null;
}
function uniqueUserIds(userIds) {
    return [...new Set(userIds)];
}
/* =========================
   RESPONSE
========================= */
function buildCreateShiftResponse(shifts) {
    return {
        shifts,
        total: shifts.length,
    };
}
