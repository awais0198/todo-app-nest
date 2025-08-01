import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { Task } from './entities/task.entity';
import { PaginatedTaskResponse } from './dto/paginated-response.dto';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({
    status: 201,
    description: 'Task has been successfully created.',
    type: Task,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data.',
  })
  async create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Tasks retrieved successfully.',
    type: PaginatedTaskResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query parameters.',
  })
  async findAll(
    @Query() queryDto: QueryTaskDto,
  ): Promise<PaginatedTaskResponse> {
    return this.tasksService.findAll(queryDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  @ApiResponse({
    status: 200,
    description: 'Task statistics retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total number of tasks' },
        pending: { type: 'number', description: 'Number of pending tasks' },
        inProgress: {
          type: 'number',
          description: 'Number of in-progress tasks',
        },
        done: { type: 'number', description: 'Number of completed tasks' },
        paused: { type: 'number', description: 'Number of paused tasks' },
        active: { type: 'number', description: 'Number of active tasks' },
      },
    },
  })
  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    done: number;
    paused: number;
    active: number;
  }> {
    return this.tasksService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Task ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Task retrieved successfully.',
    type: Task,
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid task ID.',
  })
  async findOne(@Param('id') id: string): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Task ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Task has been successfully updated.',
    type: Task,
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data or task ID.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Task ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Task has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid task ID.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.tasksService.remove(id);
  }
}
