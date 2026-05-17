'use client';

import {
  ActionGroup,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Title,
} from '@patternfly/react-core';
import { TrashIcon } from '@patternfly/react-icons';
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { type FC, useCallback, useEffect, useState } from 'react';

type SubmissionRow = {
  submissionId: string;
  candidateName: string;
  candidateEmail: string;
  status: string;
  autoScore: number;
  manualScore: number;
  autoSubmitted: boolean;
  startedAt: string;
  submittedAt: string | null;
  pasteCount: number;
  focusLossCount: number;
};

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

const ResultsPage: FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SubmissionRow | null>(null);

  const loadResults = useCallback((): void => {
    fetch(`/api/tests/${testId}/results`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRows(data);
      })
      .catch(() => {});
  }, [testId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const formatDuration = (
    start: string,
    end: string | null,
  ): string => {
    if (!end) return '-';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(ms / MS_PER_SECOND / SECONDS_PER_MINUTE);
    const secs = Math.floor((ms / MS_PER_SECOND) % SECONDS_PER_MINUTE);
    return `${mins}m ${secs}s`;
  };

  const handleDeleteSubmission = async (): Promise<void> => {
    if (!deleteTarget) return;
    await fetch(`/api/submissions/${deleteTarget.submissionId}`, {
      method: 'DELETE',
    });
    setDeleteTarget(null);
    loadResults();
  };

  return (
    <PageSection>
      <Title headingLevel="h1" style={{ marginBottom: '1rem' }}>
        Test Results
      </Title>

      <Table aria-label="Results table">
        <Thead>
          <Tr>
            <Th>Candidate</Th>
            <Th>Email</Th>
            <Th>Status</Th>
            <Th>Total Score</Th>
            <Th>Time Taken</Th>
            <Th>Auto-submitted</Th>
            <Th>Integrity</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((r) => (
            <Tr key={r.submissionId}>
              <Td>{r.candidateName}</Td>
              <Td>{r.candidateEmail}</Td>
              <Td>
                <Label
                  color={r.status === 'submitted' ? 'green' : 'blue'}
                >
                  {r.status}
                </Label>
              </Td>
              <Td>
                {r.autoScore + r.manualScore} (auto: {r.autoScore},
                manual: {r.manualScore})
              </Td>
              <Td>{formatDuration(r.startedAt, r.submittedAt)}</Td>
              <Td>
                {r.autoSubmitted && (
                  <Label color="yellow">Auto</Label>
                )}
              </Td>
              <Td>
                {r.pasteCount > 0 && (
                  <Label color="red" style={{ marginRight: '0.25rem' }}>
                    {r.pasteCount} paste{r.pasteCount > 1 ? 's' : ''}
                  </Label>
                )}
                {r.focusLossCount > 0 && (
                  <Label color="orange">
                    {r.focusLossCount} tab switch
                    {r.focusLossCount > 1 ? 'es' : ''}
                  </Label>
                )}
              </Td>
              <Td>
                <Link href={`/results/${r.submissionId}`}>
                  Review
                </Link>
                <Button
                  variant="plain"
                  aria-label="Delete submission"
                  onClick={() => setDeleteTarget(r)}
                  style={{ marginLeft: '0.5rem' }}
                >
                  <TrashIcon />
                </Button>
              </Td>
            </Tr>
          ))}
          {rows.length === 0 && (
            <Tr>
              <Td colSpan={8}>
                No submissions yet
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        aria-label="Delete submission"
        variant="small"
      >
        <ModalHeader title="Delete Submission?" />
        <ModalBody>
          This will permanently delete the submission from &quot;
          {deleteTarget?.candidateName}&quot; and all associated answers. The
          invitation will be reset to pending. This action cannot be undone.
        </ModalBody>
        <ModalFooter>
          <ActionGroup>
            <Button variant="danger" onClick={handleDeleteSubmission}>
              Delete
            </Button>
            <Button variant="link" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
          </ActionGroup>
        </ModalFooter>
      </Modal>
    </PageSection>
  );
};

export default ResultsPage;
