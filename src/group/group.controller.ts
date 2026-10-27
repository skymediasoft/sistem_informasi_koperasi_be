import { Controller, Get, Post, Body, Patch, Put, Param, Delete, UseGuards, Request, Req } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupAuthDto } from './dto/create-group-auth.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createGroupDto: CreateGroupDto, @Request() req: { user: JwtPayloadDto }) {
    return this.groupService.create({...createGroupDto, postBy: req.user.userlogin});
  }

  @Get()
  findAll() {
    return this.groupService.findAllGroups();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupService.update(+id, updateGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupService.remove(+id);
  }

  @Get(':groupId/permissions')
  findGroupAuth(@Param('groupId') id: string) {
    return this.groupService.findGroupAuth(+id);
  }

  @Post('permissions')
  createGroupAuths(@Body() createGroupAuthDto: CreateGroupAuthDto[]) {
    return this.groupService.createGroupAuth(createGroupAuthDto);
  }

  @Delete(':groupId/permissions')
  removeGroupAuth(@Param('groupId') id: string) {
    return this.groupService.removeGroupAuth(+id);
  }

  @Put(':groupId/permissions')
  updateGroupAuth(@Param('groupId') id: string, @Body() createGroupAuthDto: CreateGroupAuthDto[]) {
    return this.groupService.updateGroupAuth(+id, createGroupAuthDto);
  }
}

