import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('posts');

  const sorted = posts.sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: '1xEngineer',
    description:
      'I build distributed systems and lead engineering teams. These days, I’m exploring what happens when human craftsmanship and AI agents work together.',
    site: context.site,
    items: sorted.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: `/posts/${entry.id}/`,
    })),
  });
}
