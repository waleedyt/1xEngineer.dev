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
      <p>I am Ahmed Waleed.</p>
      <p>
        I am a Software Engineer working on web in JavaScript and React ecosystem. I have almost 5 years of experience and currently
        working at Emumba as a Lead Frontend Software Engineer.
      </p>
      <h3>What do I love to do in my free time?</h3>
      <p>
        I live in Islamabad, Pakistan - a peaceful city along the foothills of Margallah mountains.
        On weekends, you will find me hiking in the Margallah trails ⛰. I am fond of watching thriller shows and movies on Netflix 📺.
        I have been a techie for as long as I can remember so often I use spare time to learn more about tech and improve my skills.
      </p>
      <p>
        How do I manage all of this with Family, work and house chores? I haven&apos;t figured it out so I am a work in progress.
        I am often prioritizing things to be more organized yet everything feels messy.
      </p>
      <h3>Purpose of the blog</h3>
      <p>
        In one word, <b>self-therapy</b>.
      </p>
      <p>
        I believe today we have a lot of people generating
        tech content on various platforms especially in the JavaScript space. This makes it very difficult
        to differentiate between the original and the marketing tailored content.
        Also, I feel much of content is created to glorify success or in pursuit of success and glory instead of highlighting the everyday hustle.
      </p>
      <p>
        Unmoderated consumption of such content can boost fear of missing out, fatigue and imposter syndrome in engineers and
        I have suffered from this, a lot 😱.
      </p>
      <p>
        This blog is my self-therapy to cut off the content consumption, focus more on being original, spend more quality time thinking,
        and creating content that is real. This doesn&apos;t mean I am going to shut the drapes on the world, instead I will focus on
        original media such as books and a few original blogs so that it is easier to curate, consume better quality content, and
        most importantly, sleep better.
      </p>
      <em>How would this blog be any different?</em>&nbsp;😐
      <p>
        I am not writing to share expert opinions 😼. Just like you, I face new challenges everyday even after years of experience,
        Stackoverflow is still a life savior for me and I still find myself learning from people I work with everyday.
        So, I want to write about the problems I face and the thought process that goes behind solving them 🧠 and be real about the imperfections
        we are okay to live with because we made it work.
      </p>
      <p>
        If you are an Engineer starting out, I hope it helps you see the struggle many of us go through to make it work and
        it helps you focus on your problems. 🚀
      </p>
    </Layout>
  );
};

export default About;
