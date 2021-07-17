import React from 'react'
import { CopelandPairwiseResult, CopelandRanking } from '../../../../util/copeland'

import './CopelandExplainer.css'
import { Table } from 'react-bootstrap'

type Props = {
  result: CopelandRanking[]
}

/**
 * Candidates that had at least one defeat, sorted by rank.
 */
function getDefeatedCandidates(result: CopelandRanking[]) {
  const defeatSet = new Set(
    result.flatMap(r => r.candidates)
      .flatMap(victor => victor.wins)
      .flatMap(victory => victory.competitor)
  )
  const retVal = Array.from(new Set<string>(result.flatMap(r => r.candidates).map(c => c.candidate)))
    .filter(c => defeatSet.has(c))
  retVal.reverse();
  return retVal;
}

export default function PairwiseTable(props: Props) {

  const defeatedCandidates = getDefeatedCandidates(props.result)

  function pairwiseCells(victories: CopelandPairwiseResult[]) {
    return defeatedCandidates.map((competitor, i) => {
      const victoryIdx = victories.findIndex(c => c.competitor === competitor)
      const content = victoryIdx >= 0
        ? `${victories[victoryIdx].votes}:${victories[victoryIdx].competitorVotes}`
        : null
      return <td key={i}>
        {content}
      </td>
    })
  }

  function candidateRow(name: string, victories: CopelandPairwiseResult[]) {
    return <React.Fragment key={name}>
      <td>
        {name}
      </td>
      {pairwiseCells(victories)}
    </React.Fragment>
  }

  const groups = props.result.flatMap(stage => {
    const firstRow = <>
      <td rowSpan={stage.candidates.length}>
        {stage.ranking}
      </td>
      <td rowSpan={stage.candidates.length}>
        {stage.score}
      </td>
      {candidateRow(stage.candidates[0].candidate, stage.candidates[0].wins)}
    </>
    const remainderRows = stage.candidates.slice(1).map((candidate) =>
      candidateRow(candidate.candidate, candidate.wins)
    )
    return [firstRow, ...remainderRows]
  })
  return (
    <Table size="sm" responsive={true}>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Score</th>
          <th></th>
          {defeatedCandidates.map((c, i) => <td key={i}>{c}</td>)}
        </tr>
      </thead>
      <tbody>
        {groups.map((r, i) =>
          <tr key={i}>{r}</tr>
        )}
      </tbody>    
    </Table>
  )
}