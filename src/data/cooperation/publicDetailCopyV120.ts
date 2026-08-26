/**
 * v120 compatibility boundary.
 *
 * v120 did not alter the public-detail copy contract; it only promoted the
 * validated v119 definitions into the v120 release audit. Keep the aliases
 * explicit so missing-module failures are caught without duplicating the 152
 * element definitions or creating circular wrappers.
 */
export {
  PUBLIC_DETAIL_BANNED_VISIBLE_TERMS_V119 as PUBLIC_DETAIL_BANNED_VISIBLE_TERMS_V120,
  PUBLIC_DETAIL_COMMON_UI_COPY_V119 as PUBLIC_DETAIL_COMMON_UI_COPY_V120,
  PUBLIC_DETAIL_COPY_DEFINITIONS_V119 as PUBLIC_DETAIL_COPY_DEFINITIONS_V120,
  PUBLIC_DETAIL_COPY_SUMMARY_V119 as PUBLIC_DETAIL_COPY_SUMMARY_V120,
  PUBLIC_DETAIL_RUNTIME_POLICY_V119 as PUBLIC_DETAIL_RUNTIME_POLICY_V120,
} from "./publicDetailCopyV119";
