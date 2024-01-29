"use client";
import "./home.css";
import App from "./app";

export default function Home() {
  return (
    <html>
      <head>
        <title>Sudoku solve assist</title>
      </head>
      <body>
        <div className="h-screen flex justify-center items-center gap-x-5 xl:gap-x-20">
          <App />
        </div>
      </body>
    </html>
  );
}
