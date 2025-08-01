import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum TaskStatus {
  PENDING = 'Pending',
  DONE = 'Done',
  IN_PROGRESS = 'In Progress',
  PAUSED = 'Paused',
}

export enum TaskPriority {
  HIGH = 'Red',
  MEDIUM = 'Yellow',
  NORMAL = 'Blue',
}

@Entity('tasks')
export class Task {
  @ApiProperty({ description: 'Unique identifier for the task' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the task' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Due date for the task' })
  @Column({ type: 'date' })
  dueDate: Date;

  @ApiProperty({ enum: TaskStatus, description: 'Current status of the task' })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @ApiProperty({
    enum: TaskPriority,
    description: 'Priority level of the task',
  })
  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.NORMAL,
  })
  priority: TaskPriority;

  @ApiProperty({ description: 'Whether the task is active' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Date when the task was created' })
  @CreateDateColumn()
  dateOfCreation: Date;

  @ApiProperty({ description: 'Date when the task was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
