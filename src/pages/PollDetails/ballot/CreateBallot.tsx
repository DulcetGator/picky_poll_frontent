import React, { Component } from 'react';
import {
  Button, Card, FormControl, InputGroup,
} from 'react-bootstrap';
import Ranker from './Ranker';
import { Ballot, Candidate, Poll, postBallot } from '../../../api';
import crypto from 'crypto';
import shuffle from '../../../util/shuffle';

import './CreateBallot.css';
import BasicSpinner from '../../../partials/BasicSpinner';
import promiseTimeout from '../../../util/promiseTimeout';
import mapByField from '../../../util/mapByField';
import { shallowSetEquals } from '../../../util/set';


type Props = {
  poll: Poll,
  ballotKey: string,
  onSubmitBallot: (ballot: Ballot) => void,
};

type State = {
  ballot: Ballot,
  isBusy: boolean,
};

class CreateBallot extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      ballot: this.makeNewBallot(),
      isBusy: false,
    };
  }

  render() {
    const nameToCandidate = mapByField(this.props.poll.candidates, c => c.name);
    const rankedCandidates = this
      .state
      .ballot
      .rankings
      .map(n => nameToCandidate.get(n) as Candidate);

    return (
      <Card className="CreateBallot">
        <Card.Header>
          <InputGroup>
            <FormControl
              placeholder="Name or alias"
              onChange={(e) => this.onUpdateVoterName(e.target.value)}
            />
          </InputGroup>
        </Card.Header>
        <Ranker
          candidates={rankedCandidates}
          onUpdateCandidates={(e) => this.onUpdateCandidates(e)}
        />
        <p>
          Your ballot, including your name, will be visible to all viewers of this poll.
        </p>
        {this.state.isBusy
          ? <BasicSpinner>Submitting ballot</BasicSpinner>
          : <Button
              onClick={() => this.handleSubmit()}
              className="submit-button"
            >
              Vote
          </Button>
        }
      </Card>
    );
  }

  componentDidUpdate() {
    const oldCandidates = new Set(this.state.ballot.rankings);
    if (!shallowSetEquals(oldCandidates, new Set(this.props.poll.candidates.map(c => c.name)))) {
      const newCandidates = this.props.poll.candidates.map(c => c.name).filter(cn => !oldCandidates.has(cn));
      const newRankings = [...this.state.ballot.rankings, ...newCandidates];
      this.setState({
        ballot: { ...this.state.ballot, rankings: newRankings}
      })
    }
  }

  onUpdateCandidates(candidates: Candidate[]) {
    const rankedNames = candidates.map(c => c.name);
    this.setState({
      ballot: { ...this.state.ballot, rankings: rankedNames },
    });
  }

  onUpdateVoterName(name: string) {
    this.setState({
      ballot: { ...this.state.ballot, name },
    });
  }

  async handleSubmit() {
    this.setState({isBusy: true})
    const minWaitPromise = promiseTimeout(300)
    await postBallot(
      this.props.ballotKey,
      this.props.poll.id,
      this.state.ballot.id,
      this.state.ballot.name,
      this.state.ballot.rankings,
    );
    await minWaitPromise;

    this.props.onSubmitBallot(this.state.ballot);
  }

  makeNewBallot(): Ballot {
    const ballot: Ballot = {
      name: '',
      id: crypto.randomBytes(32).toString('hex'),
      rankings: shuffle(Array.from(this.props.poll.candidates.map(c => c.name))),
      timestamp: Date.now(),
    };
    return ballot;
  }
}

export default CreateBallot;
