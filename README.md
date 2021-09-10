# What is this

This is a web scraper for the website www.perfectlyimperfect.fyi that scrapes the recommendation data and persists to a database.

Not much is done with this data yet besides a [simple landing page](https://perfectly-imperfect.onrender.com/api/recs), an [endpoint containing the recommendations](https://perfectly-imperfect.onrender.com/api/recs), and a discord bot that provides you with a random recommendation.

# Helpful scripts

## To set up

```bash
npm install && npm run init

```

## To fill the db

```bash
npm run start
```

## To reset db

```bash
npm run reset-db && npm run start
```

## To view data in sql view

```bash
npx prisma studio
```

## Run next.js web server

```bash
npm run dev
```

# More

## Next routes

```
/pages
```

## Scraper code

```
/scraper
```

## Prisma (DB) schema

```
/prisma
```
