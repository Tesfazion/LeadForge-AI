/**
 * Shared frontend utility functions
 *
 * Import from here instead of duplicating logic across pages:
 *   import { getStatusBadgeClass, formatDate, formatStatus } from "../lib/utils";
 */

// ---------------------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------------------

/**
 * Maps a LeadStatus enum value to a CSS badge class.
 * @param {string} status - LeadStatus enum value
 * @returns {string} CSS class name for the badge
 */
export function getStatusBadgeClass(status) {
  const map = {
    NEW:                       "badge-gray",
    OUTREACH_DRAFTED:          "badge-warning",
    OUTREACH_PENDING_APPROVAL: "badge-warning",
    OUTREACH_SENT:             "badge-primary",
    REPLIED:                   "badge-success",
    QUALIFIED:                 "badge-success",
    DISQUALIFIED:              "badge-error",
  };
  return map[status] ?? "badge-gray";
}

/**
 * Maps a ProjectStatus enum value to a CSS badge class.
 * @param {string} status - ProjectStatus enum value
 * @returns {string} CSS class name for the badge
 */
export function getProjectStatusBadgeClass(status) {
  const map = {
    GATHERING_REQUIREMENTS:    "badge-gray",
    READY_TO_BUILD:            "badge-warning",
    BUILDING:                  "badge-primary",
    BUILD_FAILED:              "badge-error",
    DEPLOY_FAILED:             "badge-error",
    PREVIEW_READY:             "badge-warning",
    DEPLOYING:                 "badge-primary",
    DEPLOYED:                  "badge-success",
  };
  return map[status] ?? "badge-gray";
}

// ---------------------------------------------------------------------------
// Date / string formatters
// ---------------------------------------------------------------------------

/**
 * Converts a DB enum string like "OUTREACH_SENT" to "Outreach Sent".
 * @param {string} value - Enum string with underscores
 * @returns {string} Human-readable label
 */
export function formatStatus(value) {
  if (!value) return "";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Returns a short locale date string, e.g. "Oct 22, 2026".
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year:  "numeric",
    month: "short",
    day:   "numeric",
  });
}

/**
 * Returns a locale date + time string, e.g. "Oct 22, 2026, 3:04 PM".
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  return new Date(date).toLocaleString(undefined, {
    year:   "numeric",
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

/**
 * Returns the first letter of a name or email, uppercased — used for
 * avatar initials throughout the UI.
 * @param {string|null|undefined} nameOrEmail
 * @returns {string} Single uppercase character, or "?"
 */
export function getInitial(nameOrEmail) {
  return (nameOrEmail?.[0] ?? "?").toUpperCase();
}
