import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="tr">
      <Head>
        {/* PWA / Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="Aile Kartı" />
        <meta name="description" content="Aile içinde ortak kredi kartı harcama takibi" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Aile Kartı" />

        {/* Theme — run BEFORE paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('ak_theme') || 'system';
                  var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (dark) document.documentElement.setAttribute('data-theme', 'dark');
                  else document.documentElement.removeAttribute('data-theme');
                } catch(e) {}
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
