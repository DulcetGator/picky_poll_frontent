import React from 'react';
import { Card } from 'react-bootstrap';
import './About.css';

export default function About() {
  return (
    <div className="About">
      <h1>Convenient ranked-choice voting</h1>
      <div className="intro-cards">
        <div className="card-wrapper">
          <Card>
            <Card.Title>
              Quick, simple workflow
            </Card.Title>
            <ul>
              <li>
                Create polls and vote on them with
                {' '}
                <em>no registration required</em>
                .
              </li>
              <li>
                Invite your acquaintances to vote by sharing the poll's secret URL.
              </li>
              <li>
                Voters only have to provide a name for their ballot, and their preference rankings.
              </li>
            </ul>
          </Card>
        </div>
        <div className="card-wrapper">
          <Card>
            <Card.Title>
              Transparent
            </Card.Title>
            <ul>
              <li>
                Picky Poll always shows the winner based on the current ballots.
              </li>
              <li>
                Picky Poll uses
                {' '}
                <a href={encodeURI("https://en.wikipedia.org/wiki/Copeland's method")}>
                  Copeland's method
                </a>
                {' '}
                (one specific
                {' '}
                <a href={"https://en.wikipedia.org/wiki/Condorcet_method"}>
                  Condorcet method
                </a>
                ) to determine the winner and relative rankings.
              </li>
              <li>
                Each person with the poll's secret URL sees all ballots that were cast, and can
                audit the poll.
              </li>
            </ul>
          </Card>
          </div>
        <div className="card-wrapper">
          <Card>
            <Card.Title>
              Secure
            </Card.Title>
            <ul>
              <li>
                Only users with the secret URL can see the poll or vote in it.
              </li>
              <li>
                Neither poll creators nor voters can cheat.
              </li>
            </ul>
          </Card>
        </div>
      </div>
      <h2>Caveat</h2>
      <div>
        <p>
          Because Picky Poll does not have registration, it's very convenient to create or vote in a poll.
          However, if someone with the poll's secret URL is malicious, they could be a nuisance by submitting multiple
          ballots. Everyone can detect this when reviewing the ballots, but if this happens, you may need to use a
          website which supports authentication.
        </p>
      </div>
      <div className="suitable-for-text">
        <h3>Suitable for:</h3>
        <ul>
          <li>
            Game groups picking which board game to play next Saturday.
          </li>
          <li>
            Work teams picking which restaurant to go to.
          </li>
        </ul>

        <h3>Unsuitable for:</h3>
        <ul>
          <li>
            Uses requiring secret ballots
          </li>
          <li>
            Voting methods other than Copeland's method.
          </li>
          <li>
            Polls with large numbers of voters, which might include someone malicious.
            They can't cheat the poll undetected, but they could force you to abandon it.
          </li>
        </ul>
      </div>
    </div>
  );
}
