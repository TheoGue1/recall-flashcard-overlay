import type { AppSession } from './types';

export function isMandatorySessionActive(session: AppSession): boolean {
  return Boolean(session.mandatoryActive && session.mandatoryRemaining > 0);
}

export function decrementMandatorySession(session: AppSession): AppSession {
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

export function shouldHideWindowAfterSave(
  prevSession: AppSession,
  nextSession: AppSession
): boolean {
  return (
    isMandatorySessionActive(prevSession) &&
    !isMandatorySessionActive(nextSession)
  );
}
