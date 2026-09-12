import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Req } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupAuthDto } from './dto/create-group-auth.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';

@Controller('group')
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

  @Get('auth/:id')
  findGroupAuth(@Param('id') id: string) {
    return this.groupService.findGroupAuth(+id);
  }

  @Post('auth')
  createGroupAuths(@Body() createGroupAuthDto: CreateGroupAuthDto[]) {
    return this.groupService.createGroupAuth(createGroupAuthDto);
  }

  @Delete('auth/:id')
  removeGroupAuth(@Param('id') id: string) {
    return this.groupService.removeGroupAuth(+id);
  }

  @Patch('auth/:id')
  updateGroupAuth(@Param('id') id: string, @Body() createGroupAuthDto: CreateGroupAuthDto[]) {
    return this.groupService.updateGroupAuth(+id, createGroupAuthDto);
  }
}

