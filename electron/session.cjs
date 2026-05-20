/**
 * Session / window visibility helpers (shared with Vitest).
 * @param {{ mandatoryActive: boolean; mandatoryRemaining: number; mandatoryCardIds?: string[]; mandatoryEasyDoneIds?: string[] }} session
 */
function isMandatorySessionActive(session) {
  return Boolean(session.mandatoryActive && session.mandatoryRemaining > 0);
}

/**
 * Only Easy on an assigned break card counts toward finishing.
 * @param {{ mandatoryActive: boolean; mandatoryRemaining: number; mandatoryCardIds: string[]; mandatoryEasyDoneIds: string[] }} session
 * @param {string} cardId
 * @param {'again' | 'hard' | 'good' | 'easy'} rating
 */
function applyStudyBreakRating(session, cardId, rating) {
  if (!session.mandatoryActive || session.mandatoryRemaining <= 0) {
    return { ...session };
  }
  const mandatoryCardIds = session.mandatoryCardIds ?? [];
  const mandatoryEasyDoneIds = session.mandatoryEasyDoneIds ?? [];
  if (!mandatoryCardIds.includes(cardId) || rating !== 'easy') {
    return { ...session };
  }
  if (mandatoryEasyDoneIds.includes(cardId)) {
    return { ...session };
  }

  const nextEasyDoneIds = [...mandatoryEasyDoneIds, cardId];
  const mandatoryRemaining = mandatoryCardIds.length - nextEasyDoneIds.length;

  return {
    ...session,
    mandatoryCardIds,
    mandatoryEasyDoneIds: nextEasyDoneIds,
    mandatoryRemaining,
    mandatoryActive: mandatoryRemaining > 0,
  };
}

function shouldHideWindowAfterSave(prevSession, nextSession) {
  return (
    isMandatorySessionActive(prevSession) &&
    !isMandatorySessionActive(nextSession)
  );
}

function shouldBlockWindowClose(session) {
  return isMandatorySessionActive(session);
}

function shouldShowWindowOnLaunch(session) {
  return isMandatorySessionActive(session);
}

module.exports = {
  isMandatorySessionActive,
  applyStudyBreakRating,
  shouldHideWindowAfterSave,
  shouldBlockWindowClose,
  shouldShowWindowOnLaunch,
};
