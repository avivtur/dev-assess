'use client';

import {
  Card,
  CardBody,
  CardTitle,
  Gallery,
  GalleryItem,
  PageSection,
  Title,
} from '@patternfly/react-core';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { type FC, useEffect, useState } from 'react';

type DashboardStats = {
  totalTests: number;
  totalInvitations: number;
  totalSubmissions: number;
};

const DashboardPage: FC = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    totalInvitations: 0,
    totalSubmissions: 0,
  });

  useEffect(() => {
    fetch('/api/tests')
      .then((r) => r.json())
      .then((data) => {
        setStats((prev) => ({
          ...prev,
          totalTests: Array.isArray(data) ? data.length : 0,
        }));
      })
      .catch(() => {});
  }, []);

  return (
    <PageSection>
      <Title headingLevel="h1" style={{ marginBottom: '1rem' }}>
        Welcome, {session?.user?.name ?? 'User'}
      </Title>
      <Gallery hasGutter>
        <GalleryItem>
          <Card isCompact>
            <CardTitle>Tests</CardTitle>
            <CardBody>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.totalTests}
              </div>
              <Link href="/tests">View all tests</Link>
            </CardBody>
          </Card>
        </GalleryItem>
        <GalleryItem>
          <Card isCompact>
            <CardTitle>Invitations</CardTitle>
            <CardBody>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.totalInvitations}
              </div>
            </CardBody>
          </Card>
        </GalleryItem>
        <GalleryItem>
          <Card isCompact>
            <CardTitle>Submissions</CardTitle>
            <CardBody>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.totalSubmissions}
              </div>
            </CardBody>
          </Card>
        </GalleryItem>
      </Gallery>
    </PageSection>
  );
};

export default DashboardPage;
