import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { APP_DESCRIPTION, APP_TITLE } from "./constants/app.config";
import "./globals.css";

// Use consistent variable names without the "--" prefix for the variable property
// Next.js will automatically add the -- prefix when setting the CSS variable
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Controls how the font is displayed while loading
});

const playFair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Add font debugging script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            document.addEventListener('DOMContentLoaded', function() {
              // Log fonts that failed to load
              document.fonts.addEventListener('loadingerror', function(event) {
                console.error('Font loading error:', event.fontface.family);
              });
              // Log when all fonts are loaded
              document.fonts.ready.then(function() {
                console.log('All fonts loaded successfully');
              });
            });
          `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${playFair.variable} font-sans antialiased`}
        style={{ fontFamily: "var(--font-geist-sans)" }} // Force the font-family explicitly
      >
        {children}
      </body>
    </html>
  );
}
