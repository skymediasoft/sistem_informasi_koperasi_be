import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import {Group} from './entities/group.entity';
import { GroupAuthorization } from './entities/group-authorization.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from '../menu/entities/menu.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [GroupController],
  imports: [
    TypeOrmModule.forFeature([Group, GroupAuthorization, Menu]),
    AuthModule,
  ],
  providers: [GroupService],
})
export class GroupModule {}
