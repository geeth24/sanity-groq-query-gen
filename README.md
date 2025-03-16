# Sanity GROQ Query Generator

A tool to automatically generate GROQ queries from Sanity.io schema definitions.

## Features

- Paste your Sanity schema and get ready-to-use GROQ queries
- Generates queries for:
  - Single document retrieval
  - Multiple documents retrieval
  - Slug-based document retrieval (when applicable)
- Supports various Sanity field types including:
  - Simple types (string, number, boolean)
  - References
  - Arrays
  - Objects with nested fields
  - Images
  - Portable Text (block content)
- Copy queries in JavaScript or TypeScript format
- Syntax highlighting for better readability

## Getting Started

### Prerequisites

- Node.js 18.0.0 or newer
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/geeth24/sanity-groq-query-gen.git
cd sanity-groq-query-gen
```

2. Install dependencies:
```bash
npm install
# or
yarn
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Copy your Sanity schema definition (the content of a schema file)
2. Paste it into the input area
3. Select your preferred output format (JavaScript or TypeScript)
4. Click "Generate Queries"
5. View and copy the generated queries

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI components

## License

MIT

## Acknowledgments

- [Sanity.io](https://www.sanity.io/) for their excellent CMS
- [GROQ](https://www.sanity.io/docs/groq) (Graph-Relational Object Queries) language
