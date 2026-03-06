import "reflect-metadata";
import { DataSource } from "typeorm";
import bcrypt from "bcrypt";
import { User } from "../../modules/common/entities/user.entity";

/**
 * Seed script for `bigbrother_test` database.
 * 
 * This fills the database with inital data for testing and development purposes.
 * This data should never ever be used in production, and should never contain real information of any kind.
 * 
 * This script is meant to be run with `npm run seed` and will connect to the database specified in the environment variables (or defaults) and insert some initial users.
 * 
 * The users created are:
 * - admin: username "admin", password "AdminPass123!", role "admin"
 * - alice: username "alice", password "password1", role "user"
 * - bob: username "bob", password "password2", role "user"
 * 
 * The passwords are hashed using bcrypt with a salt round of 12 before being stored in the database.
 * 
 * Note: This script will synchronize the database schema, which means it will create tables and columns as needed. It will not drop existing tables, but it may alter them if the entities have changed.
 */

const DB_NAME = process.env.DB_NAME || "bigbrother_test";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = parseInt(process.env.DB_PORT || "5432");
const DB_USERNAME = process.env.DB_USERNAME || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD || "postgres";

const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  entities: [User],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);

  const saltRounds = 12;

  const users = [
    { username: "admin", password: "AdminPass123!", role: "admin" },
    { username: "alice", password: "NotAdminPass123!", role: "user" },
    { username: "bob", password: "NotAdminPass123!", role: "user" },
  ];

  for (const u of users) {
    try {
      const hashed = await bcrypt.hash(u.password, saltRounds);
      const user = repo.create({
        username: u.username,
        password: hashed,
        role: u.role,
      } as User);
      await repo.save(user);
      console.log(`Created user: ${u.username}`);
    } catch (err: unknown) {
      console.error(`Failed to create user ${u.username}:`, err);
    }
  }

  await AppDataSource.destroy();
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log("Seeding complete.");
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}

export default seed;
