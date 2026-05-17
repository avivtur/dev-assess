'use client';

import {
  Button,
  Label,
  PageSection,
  Title,
} from '@patternfly/react-core';
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FC, useCallback, useEffect, useState } from 'react';

type TestItem = {
  id: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  isActive: boolean;
  createdAt: string;
};

const TestsListPage: FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [testsList, setTestsList] = useState<TestItem[]>([]);

  const canCreate =
    session?.user?.role === 'admin' || session?.user?.role === 'manager';

  const loadTests = useCallback((): void => {
    fetch('/api/tests')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTestsList(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const handleDuplicate = async (testId: string): Promise<void> => {
    const res = await fetch(`/api/tests/${testId}/duplicate`, {
      method: 'POST',
    });
    if (res.ok) {
      const newTest = await res.json();
      router.push(`/tests/${newTest.id}`);
    }
  };

  return (
    <PageSection>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <Title headingLevel="h1">Tests</Title>
        {canCreate && (
          <Button component={(props) => <Link {...props} href="/tests/new" />}>
            Create Test
          </Button>
        )}
      </div>

      <Table aria-label="Tests table">
        <Thead>
          <Tr>
            <Th>Title</Th>
            <Th>Time Limit</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {testsList.map((t) => (
            <Tr key={t.id}>
              <Td>
                <Link href={`/tests/${t.id}`}>{t.title}</Link>
              </Td>
              <Td>{t.timeLimitMinutes} min</Td>
              <Td>
                <Label color={t.isActive ? 'green' : 'grey'}>
                  {t.isActive ? 'Active' : 'Inactive'}
                </Label>
              </Td>
              <Td>{new Date(t.createdAt).toLocaleDateString()}</Td>
              <Td>
                <Link href={`/tests/${t.id}/results`}>
                  <Button variant="link" isInline>
                    Results
                  </Button>
                </Link>
                {' | '}
                <Link href={`/tests/${t.id}/invite`}>
                  <Button variant="link" isInline>
                    Invite
                  </Button>
                </Link>
                {canCreate && (
                  <>
                    {' | '}
                    <Button
                      variant="link"
                      isInline
                      onClick={() => handleDuplicate(t.id)}
                    >
                      Duplicate
                    </Button>
                  </>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </PageSection>
  );
};

export default TestsListPage;
