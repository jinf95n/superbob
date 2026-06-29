// Constantes configurables centralizadas — nunca hardcodear estos valores en otros archivos.
// Fuente de verdad: docs/review-system-decisions-v2.md §13.

// Reviews
export const REVIEW_WEIGHT_WORK = 1.0
export const REVIEW_WEIGHT_CONTACT = 0.3
export const REVIEW_EDIT_WINDOW_MINUTES = 15
export const REVIEW_WITHDRAWAL_WINDOW_DAYS = 14
export const REVIEW_BLIND_DAYS = 14
export const REVIEW_CONTACT_MIN_HOURS = 2
export const REVIEW_CONTACT_MAX_DAYS = 30
export const REVIEW_WORK_MAX_DAYS = 60
export const REVIEW_REMINDER_DAYS = [3, 10] as const

// Work records
export const WORK_RECORD_PRO_WINDOW_DAYS = 60
export const WORK_RECORD_CLIENT_CLAIM_MIN_DAYS = 7
export const WORK_RECORD_CLIENT_CLAIM_MAX_DAYS = 30
export const WORK_RECORD_PRO_CONFIRM_DAYS = 7

// Contact events
export const CONTACT_RATE_LIMIT_PAIR_DAYS = 30
export const CONTACT_RATE_LIMIT_PER_DAY = 10
export const CONTACT_RATE_LIMIT_PER_WEEK = 30
export const CONTACT_IP_RETENTION_DAYS = 90

// Ranking
export const RANKING_WEIGHT_SCORE = 0.60
export const RANKING_WEIGHT_VOLUME = 0.25
export const RANKING_WEIGHT_PROFILE = 0.15
export const NEW_PROFESSIONAL_BOOST_FACTOR = 0.20
export const NEW_PROFESSIONAL_BOOST_DAYS = 60

// Triggers de revisión admin
export const DISPUTE_TRIGGER_RAPID_COUNT = 2
export const DISPUTE_TRIGGER_RAPID_DAYS = 60
export const DISPUTE_TRIGGER_RATIO = 0.15
export const DISPUTE_TRIGGER_RATIO_MIN_CONTACTS = 10
export const DISPUTE_TRIGGER_HISTORICAL = 5

// Score display
export const SCORE_MIN_REVIEWS_FOR_STARS = 3
