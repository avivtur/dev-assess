'use client';

import {
  Button,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  Nav,
  NavItem,
  NavList,
  Page,
  PageSidebar,
  PageSidebarBody,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type FC, type ReactNode, useState } from 'react';

import ThemeToggle from '@/components/common/ThemeToggle';

import AdminSessionProvider from './AdminSessionProvider';

type AdminLayoutInnerProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Tests', href: '/tests' },
  { label: 'Users', href: '/users', adminOnly: true },
];

const AdminLayoutInner: FC<AdminLayoutInnerProps> = ({ children }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const role = session?.user?.role;

  const navigation = (
    <Nav>
      <NavList>
        {NAV_ITEMS.filter(
          (item) => !item.adminOnly || role === 'admin',
        ).map((item) => (
          <NavItem
            key={item.href}
            isActive={pathname.startsWith(item.href)}
          >
            <Link href={item.href}>{item.label}</Link>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );

  const headerToolbar = (
    <Toolbar>
      <ToolbarContent>
        <ToolbarGroup align={{ default: 'alignEnd' }}>
          <ToolbarItem>
            <ThemeToggle />
          </ToolbarItem>
          <ToolbarItem>
            <span>{session?.user?.name ?? session?.user?.email}</span>
          </ToolbarItem>
          <ToolbarItem>
            <Button variant="link" onClick={() => signOut()}>
              Sign out
            </Button>
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );

  const masthead = (
    <Masthead>
      <MastheadToggle>
        <Button
          variant="plain"
          onClick={() => setSidebarOpen((s) => !s)}
          aria-label="Toggle sidebar"
        >
          <BarsIcon />
        </Button>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            DevAssess
          </span>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>{headerToolbar}</MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar isSidebarOpen={sidebarOpen}>
      <PageSidebarBody>{navigation}</PageSidebarBody>
    </PageSidebar>
  );

  return (
    <Page masthead={masthead} sidebar={sidebar}>
      {children}
    </Page>
  );
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <AdminSessionProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminSessionProvider>
  );
}
