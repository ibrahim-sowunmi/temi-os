# Prisma Commands

## `npm exec prisma generate`
- Generates the Prisma Client based on your schema
- Use this after any changes to your `schema.prisma` file
- Creates type-safe database queries for your application
- Must be run before your application can interact with the database

## `npm exec prisma migrate dev`
- Creates and applies a new migration based on your schema changes
- Updates your database schema
- Also generates Prisma Client
- Use during development when you want to:
  - Track schema changes in version control
  - Have proper migration history
  - Need rollback capability

## `npm exec prisma db push`
- Directly pushes schema changes to the database
- Doesn't create migration files
- Use during development when you:
  - Don't need to track schema changes
  - Want to quickly prototype and iterate
  - Don't need migration history

