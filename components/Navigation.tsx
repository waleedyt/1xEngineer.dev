import Link from 'next/link';
import React from 'react';

const Navigation = (): JSX.Element => {
  return (
    <>
      <nav className='flex items-center justify-between'>
        <h1 className='inline-block m-0'>1xEngineer</h1>
        <div>
          <Link href="/">
            <a className="pr-6 py-4">Home</a>
          </Link>
          <Link href="/about">
            <a className="py-4">About</a>
          </Link>
        </div>
      </nav>
      <sub>&nbsp; &nbsp;Hi 👋🏽, I am a software engineer working in JavaScript ecosystem. I write about all sort of problems I face!</sub>
    </>
  );
};

export default Navigation;
