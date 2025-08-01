import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';

describe('TasksService', () => {
  let service: TasksService;
  let repository: Repository<Task>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTaskDto: CreateTaskDto = {
      name: 'Test Task',
      dueDate: '2025-08-15',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
    };

    const mockTask: Task = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Task',
      dueDate: new Date('2025-08-15'),
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      isActive: true,
      dateOfCreation: new Date('2025-08-01'),
      updatedAt: new Date('2025-08-01'),
    };

    it('should create a task successfully', async () => {
      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        dueDate: new Date('2025-08-15'),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockTask);
      expect(result).toEqual(mockTask);
    });

    it('should throw BadRequestException for invalid date', async () => {
      const invalidDto = { ...createTaskDto, dueDate: 'invalid-date' };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockTasks: Task[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Task 1',
        dueDate: new Date('2025-08-15'),
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        isActive: true,
        dateOfCreation: new Date('2025-08-01'),
        updatedAt: new Date('2025-08-01'),
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Task 2',
        dueDate: new Date('2025-08-20'),
        status: TaskStatus.DONE,
        priority: TaskPriority.NORMAL,
        isActive: true,
        dateOfCreation: new Date('2025-08-02'),
        updatedAt: new Date('2025-08-02'),
      },
    ];

    it('should return paginated tasks', async () => {
      const queryDto: QueryTaskDto = { page: 1, limit: 10 };
      mockRepository.findAndCount.mockResolvedValue([mockTasks, 2]);

      const result = await service.findAll(queryDto);

      expect(result.data).toEqual(mockTasks);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should filter by status', async () => {
      const queryDto: QueryTaskDto = { status: TaskStatus.PENDING };
      mockRepository.findAndCount.mockResolvedValue([[mockTasks[0]], 1]);

      await service.findAll(queryDto);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TaskStatus.PENDING }),
        }),
      );
    });

    it('should search by name', async () => {
      const queryDto: QueryTaskDto = { search: 'Task 1' };
      mockRepository.findAndCount.mockResolvedValue([[mockTasks[0]], 1]);

      await service.findAll(queryDto);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.objectContaining({ _type: 'like' }),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockTask: Task = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Task',
      dueDate: new Date('2025-08-15'),
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      isActive: true,
      dateOfCreation: new Date('2025-08-01'),
      updatedAt: new Date('2025-08-01'),
    };

    it('should return a task by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(result).toEqual(mockTask);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
    });

    it('should throw NotFoundException when task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('123e4567-e89b-12d3-a456-426614174999'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for empty id', async () => {
      await expect(service.findOne('')).rejects.toThrow('Task ID is required');
      await expect(service.findOne(null as any)).rejects.toThrow(
        'Task ID is required',
      );
    });

    it('should throw BadRequestException for invalid UUID format', async () => {
      await expect(service.findOne('invalid-uuid')).rejects.toThrow(
        'Invalid task ID format',
      );
      await expect(service.findOne('123')).rejects.toThrow(
        'Invalid task ID format',
      );
    });
  });

  describe('update', () => {
    const mockTask: Task = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Task',
      dueDate: new Date('2025-08-15'),
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      isActive: true,
      dateOfCreation: new Date('2025-08-01'),
      updatedAt: new Date('2025-08-01'),
    };

    const updateDto: UpdateTaskDto = {
      name: 'Updated Task',
      status: TaskStatus.IN_PROGRESS,
    };

    it('should update a task successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      const updatedTask = { ...mockTask, ...updateDto };
      mockRepository.save.mockResolvedValue(updatedTask);

      const result = await service.update(
        '123e4567-e89b-12d3-a456-426614174000',
        updateDto,
      );

      expect(result).toEqual(updatedTask);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('123e4567-e89b-12d3-a456-426614174999', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update due date correctly', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      const updateWithDate = { dueDate: '2025-08-25' };
      mockRepository.save.mockResolvedValue(mockTask);

      await service.update(
        '123e4567-e89b-12d3-a456-426614174000',
        updateWithDate,
      );

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid date', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      const updateWithInvalidDate = { dueDate: 'invalid-date' };

      await expect(
        service.update(
          '123e4567-e89b-12d3-a456-426614174000',
          updateWithInvalidDate,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const mockTask: Task = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Task',
      dueDate: new Date('2025-08-15'),
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      isActive: true,
      dateOfCreation: new Date('2025-08-01'),
      updatedAt: new Date('2025-08-01'),
    };

    it('should remove a task successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.remove.mockResolvedValue(mockTask);

      await service.remove('123e4567-e89b-12d3-a456-426614174000');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('123e4567-e89b-12d3-a456-426614174999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return task statistics', async () => {
      mockRepository.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(9);

      const result = await service.getStats();

      expect(result).toEqual({
        total: 10,
        pending: 5,
        inProgress: 2,
        done: 2,
        paused: 1,
        active: 9,
      });
    });
  });
});
