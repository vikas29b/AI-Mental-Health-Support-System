/**
 * In-Memory Session & Context Store (Redis Memory Buffer Emulation)
 * Keeps conversational context (last 5-10 turns), TTL expiration, and session state.
 */

import { SessionContext, SessionTurn } from '../types.js';

class SessionMemoryStore {
  private sessions = new Map<string, SessionContext>();
  private readonly MAX_TURNS = 10;
  private readonly TTL_MS = 60 * 60 * 1000; // 1 hour session TTL

  public getOrCreateSession(sessionId: string, userId: string): SessionContext {
    let session = this.sessions.get(sessionId);

    if (!session) {
      // Hash / Anonymize user_id
      const userIdHash = 'usr_anon_' + Math.abs(this.simpleHash(userId)).toString(16).substring(0, 8);
      session = {
        session_id: sessionId,
        user_id_hash: userIdHash,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        turns: [],
        total_messages: 0,
        max_risk_level: 0,
        initial_sentiment: 0.0,
        current_sentiment: 0.0,
        primary_distress_category: 'General Reflection',
        status: 'active',
      };
      this.sessions.set(sessionId, session);
    } else {
      session.last_activity = new Date().toISOString();
    }

    return session;
  }

  public getSession(sessionId: string): SessionContext | undefined {
    return this.sessions.get(sessionId);
  }

  public addTurn(
    sessionId: string,
    turn: SessionTurn,
    distressCategory?: string
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.turns.length === 0) {
      session.initial_sentiment = turn.sentiment;
    }

    session.turns.push(turn);
    session.total_messages += 1;
    session.last_activity = new Date().toISOString();
    session.current_sentiment = turn.sentiment;

    if (turn.risk_level > session.max_risk_level) {
      session.max_risk_level = turn.risk_level;
    }

    if (turn.risk_level === 3) {
      session.status = 'escalated_to_crisis';
    }

    if (distressCategory) {
      session.primary_distress_category = distressCategory;
    }

    // Sliding window buffer (keeps last MAX_TURNS)
    if (session.turns.length > this.MAX_TURNS) {
      session.turns = session.turns.slice(-this.MAX_TURNS);
    }
  }

  public getRecentContext(sessionId: string): SessionTurn[] {
    const session = this.sessions.get(sessionId);
    return session ? session.turns : [];
  }

  public clearSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  public getAllActiveSessions(): SessionContext[] {
    return Array.from(this.sessions.values());
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

export const sessionStore = new SessionMemoryStore();
