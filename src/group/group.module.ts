import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { GroupRepository } from './group.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [GroupController],
  imports: [AuthModule],
  providers: [GroupService, GroupRepository],
})
export class GroupModule {}
