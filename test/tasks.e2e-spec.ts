import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let createdTaskId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.getHttpAdapter().get('/', (req, res) => {
      res.json({
        message: 'Todo API is running',
        version: '1.0.0',
        endpoints: {
          swagger: '/api',
          tasks: '/tasks',
          health: '/tasks/stats',
        },
        timestamp: new Date().toISOString(),
      });
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/tasks (POST)', () => {
    it('should create a new task', () => {
      const createTaskDto = {
        name: 'Complete project documentation',
        dueDate: '2025-08-15',
        status: 'Pending',
        priority: 'Red',
      };

      return request(app.getHttpServer())
        .post('/tasks')
        .send(createTaskDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(createTaskDto.name);
          expect(res.body.status).toBe(createTaskDto.status);
          expect(res.body.priority).toBe(createTaskDto.priority);
          expect(res.body.isActive).toBe(true);
          createdTaskId = res.body.id;
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({
          name: '',
          dueDate: 'invalid-date',
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({
          name: 'Test task',
        })
        .expect(400);
    });
  });

  describe('/tasks (GET)', () => {
    beforeEach(async () => {
      const createTaskDto = {
        name: 'Test task for listing',
        dueDate: '2025-08-20',
        status: 'Pending',
        priority: 'Blue',
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send(createTaskDto)
        .expect(201);

      createdTaskId = response.body.id;
    });

    it('should get all tasks with pagination', () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('limit');
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('totalPages');
        });
    });

    it('should filter tasks by status', () => {
      return request(app.getHttpServer())
        .get('/tasks?status=Pending')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.every((task) => task.status === 'Pending')).toBe(
            true,
          );
        });
    });

    it('should filter tasks by priority', () => {
      return request(app.getHttpServer())
        .get('/tasks?priority=Blue')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.every((task) => task.priority === 'Blue')).toBe(
            true,
          );
        });
    });

    it('should search tasks by name', () => {
      return request(app.getHttpServer())
        .get('/tasks?search=listing')
        .expect(200)
        .expect((res) => {
          expect(
            res.body.data.every((task) =>
              task.name.toLowerCase().includes('listing'),
            ),
          ).toBe(true);
        });
    });

    it('should paginate results', () => {
      return request(app.getHttpServer())
        .get('/tasks?page=1&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });

    it('should sort by different fields', () => {
      return request(app.getHttpServer())
        .get('/tasks?sortBy=name&sortOrder=ASC')
        .expect(200)
        .expect((res) => {
          const names = res.body.data.map((task) => task.name);
          const sortedNames = [...names].sort();
          expect(names).toEqual(sortedNames);
        });
    });
  });

  describe('/tasks/:id (GET)', () => {
    beforeEach(async () => {
      const createTaskDto = {
        name: 'Test task for get by id',
        dueDate: '2025-08-25',
        status: 'In Progress',
        priority: 'Yellow',
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send(createTaskDto)
        .expect(201);

      createdTaskId = response.body.id;
    });

    it('should get a task by id', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdTaskId);
          expect(res.body.name).toBe('Test task for get by id');
          expect(res.body.status).toBe('In Progress');
          expect(res.body.priority).toBe('Yellow');
        });
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .get('/tasks/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);
    });

    it('should return 400 for invalid UUID', () => {
      return request(app.getHttpServer())
        .get('/tasks/invalid-id')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid task ID format');
        });
    });
  });

  describe('/tasks/:id (PATCH)', () => {
    beforeEach(async () => {
      const createTaskDto = {
        name: 'Test task for update',
        dueDate: '2025-08-30',
        status: 'Pending',
        priority: 'Red',
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send(createTaskDto)
        .expect(201);

      createdTaskId = response.body.id;
    });

    it('should update a task', () => {
      const updateDto = {
        name: 'Updated task name',
        status: 'Done',
        priority: 'Blue',
      };

      return request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updateDto.name);
          expect(res.body.status).toBe(updateDto.status);
          expect(res.body.priority).toBe(updateDto.priority);
        });
    });

    it('should update only provided fields', () => {
      const updateDto = {
        status: 'In Progress',
      };

      return request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(updateDto.status);
          expect(res.body.name).toBe('Test task for update');
        });
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .patch('/tasks/123e4567-e89b-12d3-a456-426614174999')
        .send({ name: 'Updated name' })
        .expect(404);
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .send({ status: 'InvalidStatus' })
        .expect(400);
    });
  });

  describe('/tasks/:id (DELETE)', () => {
    beforeEach(async () => {
      const createTaskDto = {
        name: 'Test task for deletion',
        dueDate: '2025-08-31',
        status: 'Paused',
        priority: 'Yellow',
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send(createTaskDto)
        .expect(201);

      createdTaskId = response.body.id;
    });

    it('should delete a task', () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${createdTaskId}`)
        .expect(204);
    });

    it('should return 404 when trying to get deleted task', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${createdTaskId}`)
        .expect(204);

      return request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .expect(404);
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .delete('/tasks/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);
    });
  });

  describe('/tasks/stats (GET)', () => {
    beforeEach(async () => {
      const tasks = [
        {
          name: 'Task 1',
          dueDate: '2025-08-10',
          status: 'Pending',
          priority: 'Red',
        },
        {
          name: 'Task 2',
          dueDate: '2025-08-11',
          status: 'Done',
          priority: 'Blue',
        },
        {
          name: 'Task 3',
          dueDate: '2025-08-12',
          status: 'In Progress',
          priority: 'Yellow',
        },
        {
          name: 'Task 4',
          dueDate: '2025-08-13',
          status: 'Paused',
          priority: 'Red',
        },
      ];

      for (const task of tasks) {
        await request(app.getHttpServer())
          .post('/tasks')
          .send(task)
          .expect(201);
      }
    });

    it('should get task statistics', () => {
      return request(app.getHttpServer())
        .get('/tasks/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('pending');
          expect(res.body).toHaveProperty('inProgress');
          expect(res.body).toHaveProperty('done');
          expect(res.body).toHaveProperty('paused');
          expect(res.body).toHaveProperty('active');
          expect(typeof res.body.total).toBe('number');
          expect(typeof res.body.pending).toBe('number');
          expect(typeof res.body.inProgress).toBe('number');
          expect(typeof res.body.done).toBe('number');
          expect(typeof res.body.paused).toBe('number');
          expect(typeof res.body.active).toBe('number');
        });
    });
  });

  describe('/ (GET)', () => {
    it('should return API information', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('version');
          expect(res.body).toHaveProperty('endpoints');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body.endpoints).toHaveProperty('swagger');
          expect(res.body.endpoints).toHaveProperty('tasks');
          expect(res.body.endpoints).toHaveProperty('health');
        });
    });
  });
});
