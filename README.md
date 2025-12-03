# Next.js Project

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
````

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a modern font family from Vercel.


## Running the Project with Docker

This project can also be built and run using **Docker Compose**.

### Build and start the container
Clone the repo and in the root of the project use this command when you have made code changes or when running for the first time:

```bash
docker compose up --build
```

### Start the container (without rebuilding)

Use this command for subsequent runs when no code changes were made:

```bash
docker compose up -d
```

This runs the container in detached mode.

### Stop the container

To stop the running service:

```bash
docker compose down
```

---

## Learn More

To learn more about Next.js, take a look at the following resources:

* [Next.js Documentation](https://nextjs.org/docs) – learn about Next.js features and API.
* [Learn Next.js](https://nextjs.org/learn) – an interactive Next.js tutorial.

You can check out the [Next.js GitHub repository](https://github.com/vercel/next.js) — feedback and contributions are welcome!

---

## Deploy on Vercel

The easiest way to deploy your Next.js app is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme), created by the team behind Next.js.

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

