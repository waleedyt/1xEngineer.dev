import React from 'react';
import { MetaProps } from '../types/layout';
import Head from './Head';
import Navigation from './Navigation';

type LayoutProps = {
  children: React.ReactNode;
  customMeta?: MetaProps;
};

export const WEBSITE_HOST_URL = 'https://nextjs-typescript-mdx-blog.vercel.app';

export const Layout = ({ children, customMeta }: LayoutProps): JSX.Element => {
  return (
    <section className='flex flex-col h-screen'>
      <Head customMeta={customMeta} />
      <header>
        <div className="max-w-5xl mx-auto p-8">
          <Navigation />
        </div>
      </header>
      <main className='flex-grow'>
        <section className="max-w-5xl px-8 mx-auto">{children}</section>
      </main>
      <footer className="py-8 justify-end">
        <div className="max-w-5xl px-8 mx-auto">
          Built by{' '}
          <a
            className="text-gray-900 dark:text-white"
            href="https://twitter.com/waleedyt"
          >
            Waleed
          </a>
        </div>
      </footer>
    </section>
  );
};

