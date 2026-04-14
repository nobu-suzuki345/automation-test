# Playwright Browser Tests

Run these tests using Playwright MCP tools. Start a local server with `bun run server.ts` first (port 3333).

## Test 1: Index page title
- Navigate to http://localhost:3333/index.html
- Verify the page title is "Hello World"

## Test 2: Index page content
- Navigate to http://localhost:3333/index.html
- Verify the page contains "Welcome to automation-test"

## Test 3: About page link
- Navigate to http://localhost:3333/index.html
- Verify there is a link to "about.html" on the page

## Test 4: Contact page
- Navigate to http://localhost:3333/contact.html
- Verify the page has a form with name, email, and message fields
