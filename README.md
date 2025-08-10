# Multi - AI Model Comparison Tool

A Next.js application that allows you to query multiple AI models (OpenAI, Anthropic, Perplexity, and Gemini) simultaneously and compare their responses in real-time.

## Features

- 🤖 **Multi-Model Support**: Query ChatGPT, Claude, Perplexity, and Gemini simultaneously
- 🔄 **Real-time Streaming**: See responses as they're generated
- 📊 **Response Comparison**: Side-by-side diff viewer to compare outputs
- 💬 **Conversation History**: Sidebar with saved conversations
- 🔐 **Secure Authentication**: Email/password + Google OAuth via Better Auth
- 🌙 **Dark Mode**: Beautiful UI with dark/light theme support
- 📈 **Performance Metrics**: Token count, speed, and cost estimation
- ⚙️ **Customizable Settings**: Adjust model parameters per provider

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Better Auth
- **Database**: SQLite with Prisma
- **Styling**: Tailwind CSS + Radix UI
- **AI SDKs**: OpenAI, Anthropic, Google AI, Perplexity

## Setup

1. Clone and install dependencies:

```bash
npm install
```

2. Set up environment variables in `.env.local`:

```bash
# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Provider API Keys
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
PERPLEXITY_API_KEY="your-perplexity-key"
GEMINI_API_KEY="your-gemini-key"
```

3. Set up the database:

```bash
npx prisma migrate dev
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using the app.

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run TypeScript type checking
npm run type-check

# Format code with Prettier
npm run format

# Check formatting without changing files
npm run format:check

# Run all checks (type checking, linting, formatting)
npm run check-all

# Lint code
npm run lint
```

## Usage

1. **Sign up/Login**: Create an account or sign in with Google
2. **Enter Query**: Type your question or prompt in the main input
3. **Configure Models**: Adjust parameters for each AI provider (optional)
4. **Run Query**: Click "Send" to query all models simultaneously
5. **Compare Results**: View responses side-by-side with diff highlighting
6. **Save Conversations**: Access your query history in the sidebar

## Environment Variables

| Variable               | Description                 | Required |
| ---------------------- | --------------------------- | -------- |
| `BETTER_AUTH_SECRET`   | Secret key for Better Auth  | Yes      |
| `BETTER_AUTH_URL`      | Base URL for auth callbacks | Yes      |
| `OPENAI_API_KEY`       | OpenAI API key              | Yes      |
| `ANTHROPIC_API_KEY`    | Anthropic API key           | Yes      |
| `PERPLEXITY_API_KEY`   | Perplexity API key          | Yes      |
| `GEMINI_API_KEY`       | Google AI API key           | Yes      |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID      | No       |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret  | No       |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for any purpose.
