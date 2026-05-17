'use client';

import { SessionProvider } from 'next-auth/react';
import type { FC, ReactNode } from 'react';

type AdminSessionProviderProps = {
  children: ReactNode;
};

const AdminSessionProvider: FC<AdminSessionProviderProps> = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default AdminSessionProvider;
