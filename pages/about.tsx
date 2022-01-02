import React from 'react';
import { Layout } from '../components/Layout';

export const About = (): JSX.Element => {
  return (
    <Layout
      customMeta={{
        title: 'About - Ahmed Waleed',
      }}
    >
      <h2>About Me</h2>
      <p>I am Ahmed Waleed!</p>
      <p>
        I am a Software Engineer working on web in JavaScript and React ecosystem! I have almost 5 years of experience.
        I am currently working at Emumba as a Lead Frontend Software Engineer.
      </p>
      <h3>What do I love to do in my free time?</h3>
      <p>
        I live in Islambad, Pakistan which is a peaceful city along the foothills of Margallah mountains.
        Naturally, on weekends, you will find me hiking in Margallah trails ⛰.
        I frequently watch thriller shows and movies on Netflix 📺.
        I am also very curious about the tech and sometimes I use spare time to learn and improve my skills.
        How do I manage all of this with Family, work and house chores? Well I haven&apos;t figured it out so I am a work in progress.
        I am often prioritizing things yet everything feels messy. I am trying to be more organized with everything.
      </p>
      <h3>Purpose of the blog</h3>
      <p>
        In one word, <b>self-therapy</b>. Longer version is way more complex than that!
      </p>
      <p>
        This blog is my self-therapy to cut off the content consumption. I want to focus more on being original and spend more quality time thinking.
        I have been struggling with it lately and it&apos;s becoming increasingly difficult due to immense tech content generation on social media platforms.
        Moreover, I want to come out and be real about the work I have to put in as an Engineer.
      </p>
      <p>
        I believe today we have a lot of people generating
        tech content on various platforms especially in the JavaScript space.
        Huge volumes of content can boost fear of missing out, fatigue and imposter syndrome in people and
        I have sufferred from this as well. 😱
      </p>

      <em>How would this blog be any different?</em>&nbsp;😐
      <p>
        I am not an expert 😼 and I face challenges almost everyday even after years of experience. Stackoverflow is still a life savior for me.
        I still find myself learning from engineers who are starting out. I want to write about the problems I face and the thought process
        that goes behind solving them. 🧠
      </p>
      <p>
        I hope it helps you see the struggle many of us do to make it work and it helps you focus on your problems. 🚀
        I also hope my ramblings here somehow motivate more people to be real and forthcoming about their hustle!
      </p>
    </Layout>
  );
};

export default About;
