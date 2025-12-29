# Pokemon Card Collection

A modern web application for tracking your Pokemon card collection and calculating the total value of your deck.

## Features

- ✅ Add Pokemon cards with details (name, set, number, rarity, condition, value, quantity)
- ✅ View your entire collection in a beautiful, organized list
- ✅ Calculate total collection value automatically
- ✅ Edit card details (value, quantity, condition)
- ✅ Remove cards from collection
- ✅ Search/filter cards by name, set, or rarity
- ✅ Persistent storage using localStorage
- ✅ Responsive design with dark mode support
- ✅ Beautiful UI with gradient backgrounds and card layouts

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - State management

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

The app will be available at [http://localhost:3007](http://localhost:3007)

### Build for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

This project is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will automatically detect Next.js and configure the build settings
4. Deploy!

Or use the Vercel CLI:

```bash
npm install -g vercel
vercel
```

## Project Structure

```
PokemonCollection/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles
├── components/
│   ├── AddCardForm.tsx     # Form to add new cards
│   ├── CardList.tsx        # List of cards with search
│   ├── CardItem.tsx        # Individual card display
│   └── CollectionStatsDisplay.tsx  # Stats overview
├── types/
│   └── pokemon.ts          # TypeScript type definitions
└── package.json
```

## Usage

1. **Add a Card**: Fill out the form on the left side with card details
   - Required: Name, Set, Value
   - Optional: Number, Rarity, Condition, Image URL, Quantity

2. **View Collection**: See all your cards in the right panel
   - Search cards by name, set, or rarity
   - View individual card details and total value

3. **Edit Cards**: Click "Edit" on any card to update its value, quantity, or condition

4. **Remove Cards**: Click "Remove" to delete a card from your collection

5. **Track Value**: The collection overview at the top shows:
   - Total number of cards (including duplicates)
   - Number of unique cards
   - Total collection value

## Data Storage

Card data is stored in your browser's localStorage, so your collection persists between sessions on the same device.

## License

ISC

