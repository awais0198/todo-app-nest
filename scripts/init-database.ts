import { Client } from 'pg';
import { config } from 'dotenv';

config();

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

class DatabaseInitializer {
  private config: DatabaseConfig;

  constructor() {
    this.config = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'todo_db',
    };
  }

  private async createClient(database?: string): Promise<Client> {
    const client = new Client({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      database: database || 'postgres',
    });

    await client.connect();
    return client;
  }

  private async databaseExists(): Promise<boolean> {
    const client = await this.createClient();

    try {
      const result = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [this.config.database]
      );
      return result.rows.length > 0;
    } finally {
      await client.end();
    }
  }

  private async createDatabase(): Promise<void> {
    const client = await this.createClient();

    try {
      console.log(`📝 Creating database '${this.config.database}'...`);
      await client.query(`CREATE DATABASE "${this.config.database}"`);
      console.log(`✅ Database '${this.config.database}' created successfully!`);
    } finally {
      await client.end();
    }
  }

  private async createTables(): Promise<void> {
    const client = await this.createClient(this.config.database);

    try {
      console.log('📊 Creating tables...');

      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          "dueDate" DATE NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Done', 'In Progress', 'Paused')),
          priority VARCHAR(50) NOT NULL DEFAULT 'Blue' CHECK (priority IN ('Red', 'Yellow', 'Blue')),
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "dateOfCreation" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks("isActive");
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks("dueDate");
        CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks("dateOfCreation");
      `);

      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW."updatedAt" = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
        CREATE TRIGGER update_tasks_updated_at
          BEFORE UPDATE ON tasks
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log('✅ Tables created successfully!');
    } finally {
      await client.end();
    }
  }

  private async seedSampleData(): Promise<void> {
    const client = await this.createClient(this.config.database);

    try {
      const result = await client.query('SELECT COUNT(*) FROM tasks');
      const count = parseInt(result.rows[0].count);

      if (count > 0) {
        console.log(`ℹ️  Database already has ${count} tasks. Skipping seeding.`);
        return;
      }

      console.log('🌱 Seeding sample data...');

      const sampleTasks = [
        {
          name: 'Withdraw cash from bank',
          dueDate: '2024-12-25',
          status: 'Pending',
          priority: 'Red',
          isActive: true,
        },
        {
          name: 'Call estate agent for rent',
          dueDate: '2024-12-24',
          status: 'In Progress',
          priority: 'Blue',
          isActive: true,
        },
        {
          name: 'Review mailbox',
          dueDate: '2024-12-24',
          status: 'Pending',
          priority: 'Red',
          isActive: true,
        },
        {
          name: 'Call office for follow up',
          dueDate: '2024-12-24',
          status: 'Pending',
          priority: 'Yellow',
          isActive: true,
        },
        {
          name: 'Review home grocery',
          dueDate: '2024-12-24',
          status: 'Done',
          priority: 'Blue',
          isActive: true,
        },
        {
          name: 'Buy monthly internet package',
          dueDate: '2024-12-24',
          status: 'Pending',
          priority: 'Blue',
          isActive: true,
        },
        {
          name: 'Visit Zoo and Park with Kids',
          dueDate: '2024-12-22',
          status: 'Pending',
          priority: 'Blue',
          isActive: true,
        },
        {
          name: 'Call travel agent for tickets',
          dueDate: '2024-12-04',
          status: 'Pending',
          priority: 'Blue',
          isActive: true,
        },
        {
          name: 'Review email tickets',
          dueDate: '2024-12-04',
          status: 'Pending',
          priority: 'Red',
          isActive: true,
        },
        {
          name: 'Call kids school for follow up',
          dueDate: '2024-12-04',
          status: 'Pending',
          priority: 'Yellow',
          isActive: true,
        },
      ];

      for (const task of sampleTasks) {
        await client.query(
          `INSERT INTO tasks (name, "dueDate", status, priority, "isActive") 
           VALUES ($1, $2, $3, $4, $5)`,
          [task.name, task.dueDate, task.status, task.priority, task.isActive]
        );
      }

      console.log(`✅ Seeded ${sampleTasks.length} sample tasks!`);
    } finally {
      await client.end();
    }
  }

  public async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Todo API Database...');
      console.log(`📍 Host: ${this.config.host}:${this.config.port}`);
      console.log(`📁 Database: ${this.config.database}`);
      console.log(`👤 User: ${this.config.username}`);
      console.log('');

      const exists = await this.databaseExists();

      if (!exists) {
        await this.createDatabase();
      } else {
        console.log(`✅ Database '${this.config.database}' already exists!`);
      }

      await this.createTables();

      await this.seedSampleData();

      console.log('');
      console.log('🎉 Database initialization completed successfully!');
      console.log('📚 You can now start the application with: npm run start:dev');
      console.log('📖 Swagger documentation will be available at: http://localhost:3000/api');

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const initializer = new DatabaseInitializer();
  initializer.initialize();
}