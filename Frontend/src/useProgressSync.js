// src/useProgressSync.js
// Handles loading progress from MongoDB on login and saving on every change.

import { useEffect, useRef } from "react";
import { getProgress, saveProgress } from "./api";

/**
 * useProgressSync
 *
 * 1. Loads progress from MongoDB when user logs in
 * 2. Saves progress to MongoDB whenever it changes (debounced 2s)
 * 3. Resets streakCheckedRef after load so streak integrity runs on fresh data
 *
 * @param {object} user             - current user (null if logged out)
 * @param {object} progress         - all progress fields
 * @param {object} setters          - all setter functions
 * @param {object} streakCheckedRef - ref to reset after MongoDB load
 */
export function useProgressSync(user, progress, setters, streakCheckedRef) {
  const {
    completed, stageStars, streak, streakDays,
    challengesDone, completedChallengeIds,
  } = progress;

  const {
    setCompleted, setStageStarsMap, setStreak,
    setStreakDays, setChallengesDone, setCompletedChallengeIds,
  } = setters;

  const saveTimer    = useRef(null);
  const initialized  = useRef(false);
  const prevUserId   = useRef(null);

  // ── Load from MongoDB when user changes ─────────────────────────────────────
  useEffect(() => {
    if (!user) {
      initialized.current = false;
      prevUserId.current  = null;
      return;
    }

    const uid = user.id || user.email;
    if (prevUserId.current === uid) return;
    prevUserId.current  = uid;
    initialized.current = false;

    getProgress()
      .then(({ progress: p }) => {
        if (!p) return;

        // Only overwrite local state if MongoDB has richer data
        if (Array.isArray(p.completed)             && p.completed.length > 0)
          setCompleted(p.completed);
        if (p.stageStars && Object.keys(p.stageStars).length > 0)
          setStageStarsMap(p.stageStars);
        if (typeof p.streak === "number" && p.streak > 0)
          setStreak(p.streak);
        if (Array.isArray(p.streakDays)            && p.streakDays.some(Boolean))
          setStreakDays(p.streakDays);
        if (typeof p.challengesDone === "number"   && p.challengesDone > 0)
          setChallengesDone(p.challengesDone);
        if (Array.isArray(p.completedChallengeIds) && p.completedChallengeIds.length > 0)
          setCompletedChallengeIds(p.completedChallengeIds);
      })
      .catch(() => {
        // Silently fall back to localStorage values already in state
      })
      .finally(() => {
        initialized.current = true;
        // Reset streak check so integrity logic re-runs on fresh MongoDB data
        if (streakCheckedRef) streakCheckedRef.current = false;
      });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced save to MongoDB on every progress change ──────────────────────
  useEffect(() => {
    if (!user || !initialized.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      saveProgress({
        completed,
        stageStars,
        streak,
        streakDays,
        challengesDone,
        completedChallengeIds,
        lastActiveDate: new Date().toISOString().slice(0, 10),
      }).catch(() => {
        // Silent fail — localStorage is the offline backup
      });
    }, 2000);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [user, completed, stageStars, streak, streakDays, challengesDone, completedChallengeIds]); // eslint-disable-line react-hooks/exhaustive-deps
}