import React from 'react';
import { Poll } from './api';
import crypto from 'crypto';

export type KnownPoll = {
    poll: Poll,
    isMine: boolean,
    knownBallots: string[]
}

type Identity = {
    key: string,
    knownPolls: KnownPoll[]
};

export interface IdentityService {
    getKey(): string,

    getKnownPolls(): KnownPoll[],
    getKnownBallots(pollId: string): string[] | null,

    addKnownPoll(poll: Poll, isMine: boolean): void,
    addKnownBallot(pollId: string, ballotId: string): void,

    removePoll(pollId: string): void
}

export class LocalStoreIdentityService implements IdentityService {
  _getIdentity(): Identity {
    const identityStr = localStorage.getItem('identity');
    if (!identityStr) {
      return this._generateIdentity();
    }

    try {
      const identity = JSON.parse(identityStr);
      return identity;
    } catch (e) {
      console.error(e);
      return this._generateIdentity();
    }
  }

  _generateIdentity(): Identity {
    localStorage.setItem('identity', JSON.stringify({
      key: crypto.randomBytes(64).toString('hex'),
      knownPolls: [],
    }));
    const identityStr = localStorage.getItem('identity');
    if (identityStr) {
      return JSON.parse(identityStr);
    }
    return this._generateIdentity();
  }

  _setIdentity(identity: Identity): void {
    localStorage.setItem('identity', JSON.stringify(identity));
  }

  getKey(): string {
    return this._getIdentity().key;
  }

  getKnownPolls(): KnownPoll[] {
    return this._getIdentity().knownPolls;
  }

  getKnownBallots(pollId: string): string[] | null {
    const polls = this._getIdentity().knownPolls.filter((p) => p.poll.id === pollId);
    if (polls.length > 0) {
      return polls[0].knownBallots;
    }
    return null;
  }

  addKnownPoll(poll: Poll, isMine: boolean): void {
    const identity = this._getIdentity();
    const desiredIndex = identity.knownPolls.findIndex((p) => p.poll.id >= poll.id);
    if (desiredIndex > -1 && identity.knownPolls[desiredIndex].poll.id === poll.id) {
      this.mutateKnownPoll(poll.id, (p) => Object.assign(p, poll));
    } else {
      const newPoll: KnownPoll = {
        poll, isMine, knownBallots: [],
      };
      if (desiredIndex < 0) {
        identity.knownPolls = identity.knownPolls.concat([newPoll]);
      } else {
        identity.knownPolls.splice(desiredIndex, 0, newPoll);
      }
      this._setIdentity(identity);
    }
  }

  addKnownBallot(pollId: string, ballotId: string): void {
    this.mutateKnownPoll(pollId, (p) => {
      p.knownBallots = p.knownBallots.concat([ballotId]);
    });
  }

  removePoll(pollId: string): void {
    const identity = this._getIdentity();
    const pollIndex = identity.knownPolls.findIndex((p) => p.poll.id === pollId);
    if (pollIndex >=0 ) {
      identity.knownPolls.splice(pollIndex, 1);
    }
    this._setIdentity(identity);
  }

  mutateKnownPoll(pollId: string, mutator: (kp: KnownPoll) => void): void {
    const identity = this._getIdentity();
    const pollIndex = identity.knownPolls.findIndex((p) => p.poll.id === pollId);
    const poll = identity.knownPolls[pollIndex];
    mutator(poll);
    this._setIdentity(identity);
  }
}

export const IdentityContext = React.createContext<IdentityService>(new LocalStoreIdentityService());

export default IdentityContext;
