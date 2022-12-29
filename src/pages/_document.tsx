import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  const siteTitle = `RatsDAO Staking Portal`
  
  return (
    <Html>
       <Head>
				<meta name="apple-mobile-web-app-title" content={siteTitle} />
				<meta name="application-name" content={siteTitle} />
				<meta
					name="description"
					content="RatsDAO Staking Portal - Use your membership for good."
				/>
				<meta
					property="og:image"
					content=""
				/>
				<meta name="og:title" content={siteTitle} />
				<meta name="twitter:card" content="summary_large_image" />

				<meta name="viewport" content="width=device-width, initial-scale=0.6, maximum-scale=1.0, user-scalable=0" />

		
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
			  <link rel="preconnect" href="https://fonts.googleapis.com" />
			  <link
			    href="https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap"
			    rel="stylesheet"
			  />
			</Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}