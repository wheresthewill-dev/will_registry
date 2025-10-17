import React from "react";

type ErrorIllustrationType =
  | "notFound"
  | "serverError"
  | "expired"
  | "unauthorized";

interface ErrorIllustrationProps {
  type: ErrorIllustrationType;
  className?: string;
}

const illustrations = {
  notFound: (
    <svg
      className="w-full h-full"
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M169.8 94.2H81.9v39.6h87.9V94.2z" fill="#e6e6e6" />
      <path d="M335 250.5H120V92h215v158.5z" fill="#f2f2f2" />
      <path d="M319.3 235H135.7V107.5h183.6V235z" fill="#fff" />
      <path d="M219.3 235h-83.6V107.5h83.6V235z" fill="#e6e6e6" />
      <path
        d="M202 190a3 3 0 01-1.8-.6l-42-31.5a3 3 0 01 3.6-4.8l39.5 29.6 39.5-39.5a3 3 0 014.2 4.2l-41.3 41.4a3 3 0 01-1.8 1.2z"
        fill="#6c63ff"
      />
      <circle cx="227.5" cy="164.5" r="9" fill="#6c63ff" />
      <path fill="#e6e6e6" d="M30 250.5h370v2H30z" />
      <text
        x="200"
        y="186"
        fontSize="60"
        fontWeight="bold"
        textAnchor="middle"
        fill="#6c63ff"
      >
        404
      </text>
    </svg>
  ),
  serverError: (
    <svg
      className="w-full h-full"
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M200 72.5c-28.6 0-51.9 23.2-51.9 51.8 0 28.7 23.3 52 51.9 52 28.7 0 52-23.3 52-52 0-28.6-23.3-51.9-52-51.9zm0 86.3a34.5 34.5 0 110-69 34.5 34.5 0 010 69z"
        fill="#6c63ff"
      />
      <path
        d="M200 121.3a3 3 0 01-3-3v-8.7a3 3 0 016 0v8.7a3 3 0 01-3 3zm0 34.8a3 3 0 01-3-3v-17.4a3 3 0 016 0V153a3 3 0 01-3 3z"
        fill="#6c63ff"
      />
      <path
        d="M260 250H60v-65.7c0-34 27.6-61.6 61.6-61.6h76.8c34 0 61.6 27.6 61.6 61.6V250z"
        fill="#f2f2f2"
      />
      <path fill="#ccc" d="M41 250h318v2H41z" />
      <text
        x="200"
        y="220"
        fontSize="40"
        fontWeight="bold"
        textAnchor="middle"
        fill="#6c63ff"
      >
        500
      </text>
    </svg>
  ),
  expired: (
    <svg
      className="w-full h-full"
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="200" cy="150" r="90" fill="#f2f2f2" />
      <path
        d="M200 70a80 80 0 100 160 80 80 0 000-160zm0 144a64 64 0 110-128 64 64 0 010 128z"
        fill="#6c63ff"
      />
      <path
        d="M200 98a8 8 0 00-8 8v44a8 8 0 004 7l38 22a8 8 0 108-14l-34-20v-39a8 8 0 00-8-8z"
        fill="#6c63ff"
      />
      <text
        x="200"
        y="220"
        fontSize="20"
        fontWeight="bold"
        textAnchor="middle"
        fill="#6c63ff"
      >
        EXPIRED
      </text>
    </svg>
  ),
  unauthorized: (
    <svg
      className="w-full h-full"
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="125" y="110" width="150" height="100" rx="10" fill="#f2f2f2" />
      <path
        d="M200 130a20 20 0 100 40 20 20 0 000-40zm0 30a10 10 0 110-20 10 10 0 010 20z"
        fill="#6c63ff"
      />
      <path d="M185 170h30v20h-30v-20z" fill="#6c63ff" />
      <circle cx="200" cy="180" r="5" fill="#fff" />
      <text
        x="200"
        y="220"
        fontSize="20"
        fontWeight="bold"
        textAnchor="middle"
        fill="#6c63ff"
      >
        LOCKED
      </text>
    </svg>
  ),
};

export function ErrorIllustration({
  type,
  className = "",
}: ErrorIllustrationProps) {
  return (
    <div className={`w-64 h-64 mx-auto ${className}`}>
      {illustrations[type]}
    </div>
  );
}
