import React, { Component, Context, ReactNode } from 'react';
import {
  Alert, Button, Col, Form, FormControl, InputGroup, Row,
} from 'react-bootstrap';
import { createPoll } from '../../api';
import ExampleCreator from './ExampleCreator'
import IdentityContext, { IdentityService } from '../../userIdentity';
import './CreatePoll.css';
import FadeToggle from '../../partials/FadeToggle';
import { Candidate } from '../../api'

type Props = {
  onCreatePoll: ({ id } : {id: string}) => void
};

type State = {
  name: string,
  description: string,
  candidates: {
    key: number,
    candidate: Candidate,
  }[],
  configuration: {
    writeIns: boolean
  },
  offerExample: boolean,
  validationErrors: null | string[]
};

function newCandidate() {
  return { name: '', description: null};
}

export default class CreatePoll extends Component<Props, State> {
  lastCandidate = 0;

  static contextType: Context<IdentityService> = IdentityContext;

  context!: IdentityService;

  constructor(props: Props) {
    super(props);

    this.state = {
      name: '',
      description: '',
      candidates: [
        { key: this.lastCandidate++, candidate: newCandidate() },
        { key: this.lastCandidate++, candidate: newCandidate() }
      ],
      configuration: {
        writeIns: false,
      },
      offerExample: true,
      validationErrors: null,
    };
  }

  validationErrors(): string[] {
    const candidateNames = this.state.candidates
      .map((c) => c.candidate.name)
      .filter((c) => c.trim().length > 0);
    return [
      {
        msg: 'Provide a poll name.',
        fail: this.state.name.trim().length === 0,
      },
      {
        msg: 'Provide at least two candidates, or enable write-ins.',
        fail: candidateNames.length < 2 && (!this.state.configuration.writeIns)
      },
      {
        msg: 'Remove candidates with duplicated names.',
        fail: new Set(candidateNames).size < candidateNames.length
      }
    ].filter(v => v.fail)
    .map(v => v.msg);
  }

  render(): ReactNode {
    const answers = this.state.candidates.map((candidate, index) => (
      <li key={candidate.key}>
        <InputGroup>
          <InputGroup.Prepend>
            <Button
              variant="secondary"
              type="button"
              onClick={() => this.handleDeleteCandidate(index)}
            >
              Remove
            </Button>
          </InputGroup.Prepend>
          <FormControl
            onChange={(e) => this.handleCandidateNameChange(index, e.currentTarget.value)}
            placeholder={`Choice #${index + 1}`}
          />
          <FormControl
            onChange={(e) => this.handleCandidateDescriptionChange(index, e.currentTarget.value)}
            placeholder={`(Optional) description`}
          />
        </InputGroup>
      </li>
    ));

    return (
      <div className="CreatePollForm">
        <form onSubmit={(e) => this.handleSubmit(e)}>
          <Col>
            <Form.Group as={Row} controlId="NameInput">
              <Form.Label column sm="auto">
                Poll Name
              </Form.Label>
                <FormControl
                  value={this.state.name}
                  onChange={(e) => this.handleNameChange(e.currentTarget.value)}
                />
            </Form.Group>
            <Form.Group as={Row} controlId="DescriptionInput">
              <Form.Label column sm="auto">
                Description (Optional)
              </Form.Label>
                <FormControl
                  placeholder="What is your preference among the following choices?"
                  as="textarea"
                  rows={2}
                  value={this.state.description}
                  onChange={(e) => this.handleDescriptionChange(e.currentTarget.value)}
                />
            </Form.Group>
          </Col>
          <Form.Group controlId="allowWriteInsCheckbox">
            <Form.Check
              type="checkbox"
              label="Allow write-in candidates" 
              onChange={(e) => this.handleWriteInChange(e.currentTarget.checked)}
              />
          </Form.Group>
          <Form.Group>
            <ul>{answers}</ul>
          </Form.Group>
          <div className="form-controls">
            <div>
              <Button
                variant="primary"
                type="submit"
              >
                Create
              </Button>
            </div>
          </div>
          {
            this.validationErrorsSection()
          }
        </form>
        <FadeToggle show={this.state.offerExample}>
          Just testing it out? An example poll can be generated for you.
          {' '}
          <ExampleCreator identity={this.context}>
            <Button
              variant="link"
              >Create example.
            </Button>
          </ExampleCreator>
        </FadeToggle>
      </div>
    );
  }

  private handleNameChange(newName: string): void {
    this.setState({
      name: newName
    });
  }

  private handleDescriptionChange(newDescription: string): void {
    this.setState({
      description: newDescription,
    });
  }

  private handleWriteInChange(newValue: boolean): void {
    const newConfiguration = Object.assign({}, this.state.configuration, {writeIns: newValue});
    this.setState({
      configuration: newConfiguration
    });
  }

  private async handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const errors = this.validationErrors();
    if (errors.length > 0) {
      this.setState({
        validationErrors: errors
      });
      return;
    }

    const poll = await createPoll(
      this.context.getKey(),
      this.state.name,
      this.state.description,
      this.state.candidates
        .map(c => c.candidate)
        .filter((c) => c.name.trim().length > 0),
      this.state.configuration
    );

    this.context.addKnownPoll(poll, true);

    this.props.onCreatePoll(poll);
  }

  private validationErrorsSection() {
    if (!this.state.validationErrors) {
      return null;
    } else {
      return <Alert variant="danger">
        <ul>
          {this.state.validationErrors.map(m =>
            <li>
              {m}
            </li>
          )}
        </ul>
      </Alert>;
    }
  }

  private handleCandidateNameChange(index: number, newName: string): void {
    this.changeCandidate(index, {
      name: newName,
    });
  }

  private handleCandidateDescriptionChange(index: number, newDescription: string): void {
    this.changeCandidate(index, {
      description: newDescription || null,
    });
  }

  private changeCandidate(index: number, newProps: Record<string, unknown>): void {
    const oldCandidate = this.state.candidates[index].candidate
    const changedCandidate = Object.assign({}, oldCandidate, newProps)
    const changedEntry = {
      key: this.state.candidates[index].key,
      candidate: changedCandidate,
    }
    let changedCandidates = this.state.candidates
      .slice(0, index)
      .concat(changedEntry)
      .concat(this.state.candidates.slice(index + 1));
    
    if (index === this.state.candidates.length - 1
      && !oldCandidate.name
      && !oldCandidate.description) {
        changedCandidates = changedCandidates.concat([{
          key: this.lastCandidate++,
          candidate: newCandidate(),
        }])
      }

    this.setState({
      candidates: changedCandidates,
      offerExample: false,
    });
  }

  private handleDeleteCandidate(index: number): void {
    const newCandidates = this.state.candidates
      .slice(0, index)
      .concat(this.state.candidates.slice(index + 1));
    this.setState({ candidates: newCandidates });
  }
}
