import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtPayloadDto } from "../auth/dto/jwt-payload.dto";
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  createParent(@Body() createMenuDto: CreateMenuDto, @Request() req: { user: JwtPayloadDto }) {
    return this.menuService.create({...createMenuDto, postBy: req.user.userlogin });
  }

  @Get('parent')
  findAllParentMenu() {
    return this.menuService.findAllParent();
  }

  @Get('child/:id')
  findAllChildMenu(@Param('id') id: string) {
    return this.menuService.findAllChild(BigInt(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(+id, updateMenuDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.menuService.remove(+id);
  }
}
