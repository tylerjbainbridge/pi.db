## To set up

```bash
npm install
npx prisma migrate
npx prisma generate
```

## To reset db

```bash
npx prisma migrate reset && npx ts-node scrape.ts
```

## To view data

```bash
npx prisma studio
```
