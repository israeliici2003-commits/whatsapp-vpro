# Firestore Security Specification (`statuses`)

## 1. Data Invariants
1. Every status document at `/statuses/{statusId}` must have an alphanumeric/underscore/hyphen `statusId` (`<= 128` chars) matching the stored `id` field.
2. `userId` must strictly equal `request.auth.uid` on `create`, and must remain immutable on `update`.
3. Only authenticated users with verified emails (`request.auth.token.email_verified == true`) may create, update, or delete status documents.
4. `createdAt` must equal `request.time` on `create` and remain immutable on `update`; `updatedAt` must equal `request.time` on both `create` and `update`.
5. Non-owners may only perform the `react` action, which is strictly restricted to updating `['reactions', 'updatedAt']` on statuses with `visibility == 'everyone'`.
6. `reactions` and `viewers` lists are strictly bounded (`size() <= 100`) and element-checked to prevent unbounded array bloat or value poisoning.
7. List queries must evaluate `resource.data.userId == request.auth.uid || resource.data.visibility == 'everyone'` directly on `resource.data` without `get()` or `exists()` lookups.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Create**: Attempt to `create` `/statuses/s_unauth` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: Attempt to `create` `/statuses/s_unverified` with `email_verified: false` -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Create**: Signed-in user `uid_attacker` attempts to `create` `/statuses/s_spoof` with `userId: "uid_victim"` -> `PERMISSION_DENIED`.
4. **Shadow / Ghost Field Injection**: Attempt to `create` or `update` `/statuses/s_ghost` with extra field `isAdminVerified: true` -> `PERMISSION_DENIED`.
5. **ID Poisoning Attack**: Attempt to `create` `/statuses/bad$id!with*spaces` or a >128-character `statusId` -> `PERMISSION_DENIED`.
6. **Client-Forged Timestamp**: Attempt to `create` `/statuses/s_time` with `createdAt: Timestamp.fromMillis(0)` instead of `request.time` -> `PERMISSION_DENIED`.
7. **Owner Mutation on Update**: Non-owner attempts to `update` `userId` on `/statuses/s1` -> `PERMISSION_DENIED`.
8. **Content Hijack via Reaction**: Non-owner attempts to `update` `['reactions', 'content', 'updatedAt']` on `/statuses/s1` -> `PERMISSION_DENIED`.
9. **Private Status Read/React**: Non-owner attempts to `get` or `react` to a status with `visibility == 'private'` -> `PERMISSION_DENIED`.
10. **Value Poisoning in Reactions**: Attacker attempts to `update` `reactions` with `[12345]` (non-map) or an oversized emoji string (`> 16` chars) -> `PERMISSION_DENIED`.
11. **Array Exhaustion Attack**: Attacker attempts to `update` `reactions` with 101 elements (`> 100`) -> `PERMISSION_DENIED`.
12. **Unauthorized Delete**: Non-owner attempts to `delete` `/statuses/s1` -> `PERMISSION_DENIED`.
