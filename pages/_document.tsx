import Document, { Head, Html, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  //asdasdasd
  render(): JSX.Element {
    return (
      <Html lang="en">
        <Head />
        <body className="bg-base3 dark:bg-base02 text-base01 dark:text-base1">
          <Main />
          <NextScript />
        </body>

      </Html>
    );
  }
}

export default MyDocument;
