'use client';

import {
  ActionGroup,
  Alert,
  Button,
  Card,
  CardBody,
  ClipboardCopy,
  Form,
  FormGroup,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  NumberInput,
  PageSection,
  TextInput,
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
import { useParams } from 'next/navigation';
import { type FC, useCallback, useEffect, useState } from 'react';

type Invitation = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  token: string;
  status: string;
  createdAt: string;
  expiresAt: string;
};

const DEFAULT_EXPIRY_DAYS = 7;
const MIN_EXPIRY_DAYS = 1;
const MAX_EXPIRY_DAYS = 90;

const InvitePage: FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [invitationsList, setInvitationsList] = useState<Invitation[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [expiryDays, setExpiryDays] = useState(DEFAULT_EXPIRY_DAYS);
  const [lastCreatedLink, setLastCreatedLink] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Invitation | null>(null);

  const loadInvitations = useCallback((): void => {
    fetch(`/api/invitations?testId=${testId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInvitationsList(data);
      })
      .catch(() => {});
  }, [testId]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleCreate = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId,
        candidateName: name,
        candidateEmail: email,
        expiryDays,
      }),
    });

    if (res.ok) {
      const inv = await res.json();
      const link = `${window.location.origin}/test/${inv.token}`;
      setLastCreatedLink(link);
      setName('');
      setEmail('');
      loadInvitations();
    }
  };

  const statusColor = (status: string): 'blue' | 'green' | 'yellow' | 'grey' => {
    const colors: Record<string, 'blue' | 'green' | 'yellow' | 'grey'> = {
      in_progress: 'blue',
      pending: 'yellow',
      submitted: 'green',
    };
    return colors[status] ?? 'grey';
  };

  const handleDeleteInvitation = async (): Promise<void> => {
    if (!deleteTarget) return;
    await fetch(`/api/invitations/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    loadInvitations();
  };

  return (
    <PageSection>
      <Title headingLevel="h1" style={{ marginBottom: '1rem' }}>
        Invite Candidates
      </Title>

      <Card style={{ marginBottom: '1.5rem', maxWidth: '600px' }}>
        <CardBody>
          <Form onSubmit={handleCreate}>
            <FormGroup
              label="Candidate Name"
              isRequired
              fieldId="inv-name"
            >
              <TextInput
                id="inv-name"
                value={name}
                onChange={(_e, val) => setName(val)}
                isRequired
              />
            </FormGroup>
            <FormGroup
              label="Candidate Email"
              isRequired
              fieldId="inv-email"
            >
              <TextInput
                id="inv-email"
                type="email"
                value={email}
                onChange={(_e, val) => setEmail(val)}
                isRequired
              />
            </FormGroup>
            <FormGroup
              label="Link Expiry (days)"
              fieldId="inv-expiry"
            >
              <NumberInput
                id="inv-expiry"
                value={expiryDays}
                min={MIN_EXPIRY_DAYS}
                max={MAX_EXPIRY_DAYS}
                onMinus={() =>
                  setExpiryDays((v) =>
                    Math.max(MIN_EXPIRY_DAYS, v - 1),
                  )
                }
                onPlus={() =>
                  setExpiryDays((v) =>
                    Math.min(MAX_EXPIRY_DAYS, v + 1),
                  )
                }
                onChange={(e) =>
                  setExpiryDays(
                    Number((e.target as HTMLInputElement).value),
                  )
                }
              />
            </FormGroup>
            <ActionGroup>
              <Button type="submit">Generate Link</Button>
            </ActionGroup>
          </Form>
        </CardBody>
      </Card>

      {lastCreatedLink && (
        <Alert
          variant="success"
          title="Invitation link created"
          isInline
          style={{ marginBottom: '1rem' }}
        >
          <ClipboardCopy isReadOnly>{lastCreatedLink}</ClipboardCopy>
        </Alert>
      )}

      <Title headingLevel="h2" style={{ marginBottom: '0.5rem' }}>
        Existing Invitations
      </Title>
      <Table aria-label="Invitations table">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Status</Th>
            <Th>Expires</Th>
            <Th>Link</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {invitationsList.map((inv) => (
            <Tr key={inv.id}>
              <Td>{inv.candidateName}</Td>
              <Td>{inv.candidateEmail}</Td>
              <Td>
                <Label color={statusColor(inv.status)}>
                  {inv.status}
                </Label>
              </Td>
              <Td>{new Date(inv.expiresAt).toLocaleDateString()}</Td>
              <Td>
                <ClipboardCopy
                  isReadOnly
                  variant="inline-compact"
                >
                  {`${typeof window !== 'undefined' ? window.location.origin : ''}/test/${inv.token}`}
                </ClipboardCopy>
              </Td>
              <Td>
                <Button
                  variant="plain"
                  aria-label="Delete invitation"
                  onClick={() => setDeleteTarget(inv)}
                >
                  <TrashIcon />
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        aria-label="Delete invitation"
        variant="small"
      >
        <ModalHeader title="Delete Invitation?" />
        <ModalBody>
          This will permanently delete the invitation for &quot;
          {deleteTarget?.candidateName}&quot; and any associated submission
          data. This action cannot be undone.
        </ModalBody>
        <ModalFooter>
          <ActionGroup>
            <Button variant="danger" onClick={handleDeleteInvitation}>
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

export default InvitePage;
