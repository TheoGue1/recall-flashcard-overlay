/**
 * Session / window visibility helpers (shared with Vitest).
 * @param {{ mandatoryActive: boolean; mandatoryRemaining: number }} session
 */
function isMandatorySessionActive(session) {
  return Boolean(session.mandatoryActive && session.mandatoryRemaining > 0);
}

/**
 * @param {{ mandatoryActive: boolean; mandatoryRemaining: number }} session
 */
function decrementMandatorySession(session) {
  if (!session.mandatoryActive || session.mandatoryRemaining <= 0) {
    return { ...session };
  }
  const mandatoryRemaining = session.mandatoryRemaining - 1;
  return {
    ...session,
    mandatoryRemaining,
    mandatoryActive: mandatoryRemaining > 0,
  };
}

/**
 * Hide overlay when a timer-driven session just finished.
 */
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
  decrementMandatorySession,
  shouldHideWindowAfterSave,
  shouldBlockWindowClose,
  shouldShowWindowOnLaunch,
};
