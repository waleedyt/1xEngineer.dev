import { format, parseISO } from 'date-fns';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import React from 'react';
import { Layout } from '../components/Layout';
import { getAllPosts } from '../lib/api';
import { PostType } from '../types/post';

type IndexProps = {
  posts: PostType[];
};

export const Index = ({ posts }: IndexProps): JSX.Element => {
  return (
    <Layout>
      {posts.map((post) => (
        <article key={post.slug} className='px-2 py-4'>
          <header className='flex justify-between items-center'>
            <Link as={`/posts/${post.slug}`} href={`/posts/[slug]`}>
              <a>
                <h2 className="text-green-solar dark:text-white dark:hover:text-blue-400">
                  {post.title}
                </h2>
              </a>

            </Link>
            <p className="text-sm m-0 dark:text-gray-400">
              {format(parseISO(post.date), 'MMMM dd, yyyy')}
            </p>
          </header>
          <p className="mb-2">{post.description}</p>
          <Link as={`/posts/${post.slug}`} href={`/posts/[slug]`}>
            <a>Read More</a>
          </Link>
        </article>
      ))}
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const posts = getAllPosts(['date', 'description', 'slug', 'title']);

  return {
    props: { posts },
  };
};

export default Index;
