'use client';

export const authClient = {
  useSession: () => ({
    data: null,
    isPending: false,
  }),
  signIn: {
    email: async (..._args: any[]) => {},
    social: async (..._args: any[]) => {},
  },
  signUp: {
    email: async (..._args: any[]) => {},
  },
  signOut: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  },
};
