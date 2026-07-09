import "./globals.css";


export const metadata = {
  title: "Smart Gate",
  description: "Developed by Jaafar Abdullah and Majd Ali",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
