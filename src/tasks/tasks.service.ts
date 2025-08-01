import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import {
  PaginatedTaskResponse,
  PaginationMeta,
} from './dto/paginated-response.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const dueDate = new Date(createTaskDto.dueDate);

    if (isNaN(dueDate.getTime())) {
      throw new BadRequestException('Invalid due date format');
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      dueDate,
    });

    return await this.taskRepository.save(task);
  }

  async findAll(queryDto: QueryTaskDto): Promise<PaginatedTaskResponse> {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      isActive,
      search,
      sortBy = 'dateOfCreation',
      sortOrder = 'DESC',
    } = queryDto;

    const where: FindOptionsWhere<Task> = {};

    if (status !== undefined) {
      where.status = status;
    }

    if (priority !== undefined) {
      where.priority = priority;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.name = Like(`%${search}%`);
    }

    const validSortFields = [
      'name',
      'dueDate',
      'status',
      'priority',
      'dateOfCreation',
    ];
    const sortField = validSortFields.includes(sortBy)
      ? sortBy
      : 'dateOfCreation';

    const [data, total] = await this.taskRepository.findAndCount({
      where,
      order: { [sortField]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, meta };
  }

  async findOne(id: string): Promise<Task> {
    if (!id?.trim()) {
      throw new BadRequestException('Task ID is required');
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('Invalid task ID format');
    }

    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    try {
      const updateData: Partial<Task> = {};

      if (updateTaskDto.name !== undefined) {
        updateData.name = updateTaskDto.name;
      }
      if (updateTaskDto.status !== undefined) {
        updateData.status = updateTaskDto.status;
      }
      if (updateTaskDto.priority !== undefined) {
        updateData.priority = updateTaskDto.priority;
      }
      if (updateTaskDto.isActive !== undefined) {
        updateData.isActive = updateTaskDto.isActive;
      }
      if (updateTaskDto.dueDate) {
        const dueDate = new Date(updateTaskDto.dueDate);
        if (isNaN(dueDate.getTime())) {
          throw new BadRequestException('Invalid due date format');
        }
        updateData.dueDate = dueDate;
      }

      Object.assign(task, updateData);
      return await this.taskRepository.save(task);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update task');
    }
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);

    try {
      await this.taskRepository.remove(task);
    } catch (error) {
      throw new BadRequestException('Failed to delete task');
    }
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    done: number;
    paused: number;
    active: number;
  }> {
    try {
      const [total, pending, inProgress, done, paused, active] =
        await Promise.all([
          this.taskRepository.count(),
          this.taskRepository.count({ where: { status: TaskStatus.PENDING } }),
          this.taskRepository.count({
            where: { status: TaskStatus.IN_PROGRESS },
          }),
          this.taskRepository.count({ where: { status: TaskStatus.DONE } }),
          this.taskRepository.count({ where: { status: TaskStatus.PAUSED } }),
          this.taskRepository.count({ where: { isActive: true } }),
        ]);

      return { total, pending, inProgress, done, paused, active };
    } catch (error) {
      throw new BadRequestException('Failed to fetch task statistics');
    }
  }
}
