import React, { Component, Context } from 'react';
import { Button } from 'react-bootstrap';
import { Ballot, Candidate, Poll } from '../../api';
import CreateBallot from './ballot/CreateBallot';
import BallotPreview from './ballot/BallotPreview';
import MyBallotPreview from './ballot/MyBallotPreview';
import ListCandidates from './candidates/ListCandidates'
import Collapsible from '../../partials/Collapsible';
import WriteInSubmitter from './WriteInSubmitter';
import { CopelandExplainer } from './explainers';
import { IdentityContext, IdentityService } from '../../userIdentity';
import './PollDetailsView.css';

type Props = {
  poll: Poll,
  ballots: Ballot[],
  onSubmitNewBallot: (b: Ballot) => void,
  onSubmitNewCandidate: (c: Candidate) => void,
  onUpdateBallot: (b: Ballot) => void,
};

type State = {
  expandRedundantBallot: boolean,
};

class PollDetailsView extends Component<Props, State> {
  static contextType: Context<IdentityService> = IdentityContext;

  context!: IdentityService


  constructor(props: Props) {
    super(props);

    this.state = {
      expandRedundantBallot: false,
    };
  }

  ownedBallots() {
    const knownBallotIds = this.context.getKnownBallots(this.props.poll.id) || [];
    return this.props.ballots.filter((b) => knownBallotIds.indexOf(b.id) > -1);
  }

  unownedBallots() {
    const knownBallotIds = this.context.getKnownBallots(this.props.poll.id) || [];
    return this.props.ballots.filter((b) => knownBallotIds.indexOf(b.id) <= -1);
  }

  ownedBallotSection() {
    const ballots = this.ownedBallots().map((b) => (
      <li className="my-ballot-item" key={b.id}>
        <MyBallotPreview
          poll={this.props.poll}
          ballotKey={this.context.getKey()}
          ballot={b}
          onUpdateBallot={this.props.onUpdateBallot}
        />
      </li>
    ));
    const ownedBallot = ballots.length > 0
      ? <ul className="my-ballots-list">
          {ballots}
        </ul>
      : <CreateBallot
          poll={this.props.poll}
          ballotKey={this.context.getKey()}
          onSubmitBallot={(b) => this.handleSubmitNewBallot(b)}
        />
    const writeInTip = <p>
      Voting can begin after there is at least 1 candidate.
    </p>
    return (
      <div>
        <h2>Your ballot</h2>
        {this.props.poll.candidates.length > 0 ? ownedBallot : writeInTip}
      </div>
    );
  }

  unownedBallotsSection() {
    if (this.props.poll.candidates.length == 0) {
      return null;
    }

    const ballots = this.unownedBallots().map((b: Ballot) => (
      <li className="their-ballot-item" key={b.id}>
        <BallotPreview ballot={b} />
      </li>
    ));

    const theirBallotsList = ballots.length > 0
      ? <ul className="their-ballots-list">{ballots}</ul>
      : <p>Nobody else has submitted a ballot yet.</p>;

    return (
      <>
        <h2>Other ballots</h2>
        {theirBallotsList}
      </>
    );
  }

  redundantBallotSection() {
    if (this.ownedBallots().length === 0) {
      return null;
    }

    if (!this.state.expandRedundantBallot) {
      return <>
          <h2>New ballot</h2>
          <p className="describe-redundant-ballot">
            You already submitted a ballot, but Picky Poll does not prevent you from submitting
            another. Others can see each ballot that is submitted.
          </p>
          <p>
            <Button variant="secondary" onClick={() => this.handleEnableRedundantBallot()}>
              New ballot
            </Button>
          </p>
        </>;
    }

    return (
      <CreateBallot
        poll={this.props.poll}
        ballotKey={this.context.getKey()}
        onSubmitBallot={(b) => this.handleSubmitNewBallot(b)}
      />
    );
  }

  writeInSubmitter() {
    if (!this.props.poll.configuration.writeIns) {
      return null;
    }
    return <>
      <h2>Write-in candidate</h2>
      <WriteInSubmitter
        poll = {this.props.poll}
        onNewCandidate = {(c: Candidate) => this.handleSubmitNewCandidate(c)}
      />
    </>
  }

  handleEnableRedundantBallot() {
    this.setState({ ...this.state, expandRedundantBallot: true });
  }

  render() {
    return (
      <div>
        <h1>{this.props.poll.name}</h1>
        {
          this.props.poll.description
          ? <p>{this.props.poll.description}</p>
          : null
        }
        {
          this.props.ballots.length > 0
            ? (
              <CopelandExplainer
                isClosed={!!this.props.poll.close}
                candidates={this.props.poll.candidates.map(c => c.name)}
                ballots={this.props.ballots}
              />
            )
            : null
        }
        {
          this.shouldShowCandidateDetails()
          ? <Collapsible title="Candidate Descriptions" defaultCollapsed={true}>
              <ListCandidates candidates={this.props.poll.candidates} />
            </Collapsible>
          : null
        }

        {this.ownedBallotSection()}
        {this.unownedBallotsSection()}
        {this.writeInSubmitter()}
        {this.redundantBallotSection()}
        {this.expiresSection()}
      </div>
    );
  }

  handleSubmitNewBallot(ballot: Ballot) {
    this.context.addKnownBallot(
      this.props.poll.id,
      ballot.id,
    );
    this.props.onSubmitNewBallot(ballot);
    this.setState({ ...this.state, expandRedundantBallot: false });
  }

  handleSubmitNewCandidate(candidate: Candidate) {
    this.props.onSubmitNewCandidate(candidate);
  }

  shouldShowCandidateDetails() {
    return this.props.poll.candidates.findIndex(c => c.description) >= 0;
  }

  expiresSection() {
    const expiresDate = new Date(this.props.poll.expires);
    const dateFormat: Intl.DateTimeFormatOptions = {month: "long", day: "numeric"};
    const expiresString = expiresDate.toLocaleDateString('en-US', dateFormat);
    return <div>
      This poll will be deleted after {expiresString}.
    </div>
  }
}

export default PollDetailsView;
