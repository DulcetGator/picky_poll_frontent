import React, { Component, Context, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IdentityContext, IdentityService, KnownPoll } from '../../userIdentity';
import PollSummary from './PollSummary';
import './ListPolls.css';

type Props = unknown
type State = {
  myPolls: KnownPoll[],
  seenPolls: KnownPoll[]
}

export default class ListPolls extends Component<Props, State> {
  static contextType: Context<IdentityService> = IdentityContext;

  context!: React.ContextType<typeof IdentityContext>

  constructor(props: Props) {
    super(props);
    this.state = {
      myPolls: [],
      seenPolls: [],
    };
  }

  componentDidMount(): void {
    const knownPolls = this.context.getKnownPolls();
    const sorted = knownPolls
      .sort((a, b) => a.poll.expires.localeCompare(b.poll.expires))
      .reverse();
    const myPolls = sorted.filter((kp) => kp.isMine);
    const seenPolls = sorted.filter((kp) => !kp.isMine);

    this.setState({
      myPolls,
      seenPolls,
    });
  }

  private handleRemove(kp: KnownPoll) {
    this.context.removePoll(kp.poll.id);
    const [myPolls, seenPolls] = [this.state.myPolls, this.state.seenPolls].map((pollList) => {
      const index = pollList.indexOf(kp);
      if (index >= 0) {
        return [...pollList.slice(0, index), ...pollList.slice(index + 1)].flat(1);
      }
      return pollList;
    });
    this.setState({ myPolls, seenPolls });
  }

  private pollsSublist(title: string, knownPollsSubset: KnownPoll[]): ReactNode {
    if (knownPollsSubset.length === 0) {
      return null;
    }
    return (
      <>
        <h2>{title}</h2>
        <ul>
          {knownPollsSubset.map((kp) => (
            <li key={kp.poll.id}>
              <PollSummary knownPoll={kp} onRemove={(kp) => this.handleRemove(kp)} />
            </li>
          ))}
        </ul>
      </>
    );
  }

  private nilExplanation(): ReactNode {
    if (this.state.myPolls.length + this.state.seenPolls.length > 0) {
      return null;
    }
    return (
      <div>
        Polls you've
        {' '}
        <Link to="/create">created</Link>
        {' '}
        or seen will be listed here.
      </div>
    );
  }

  render(): ReactNode {
    const owned = this.pollsSublist("Polls you've created", this.state.myPolls);
    const unowned = this.pollsSublist("Polls you've viewed", this.state.seenPolls);
    return (
      <div className="ListPolls">
        {owned}
        {unowned}
        {this.nilExplanation()}
      </div>
    );
  }
}
