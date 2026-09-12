import { Injectable } from '@nestjs/common';
import { Menu } from './entities/menu.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async create(createMenuDto: CreateMenuDto) {
    const isExist = await this.menuRepository.findOne({ where: { menuName: createMenuDto.menuName } });

    if (isExist) {
      throw new Error('Menu already exists');
    }

    const menu = this.menuRepository.create({
      menuName: createMenuDto.menuName,
      menuRoute: createMenuDto.menuRoute,
      menuSort: createMenuDto.menuSort,
      menuParentID: BigInt(createMenuDto.menuParentId ?? 0),
      postBy: createMenuDto.postBy,
      postDate: new Date(),
    });
    return this.menuRepository.save(menu);
  }

  findAllParent() {
    return this.menuRepository.find({ where: { menuParentID: 0n } });
  }

  findAllChild(parentid: bigint) {
    return this.menuRepository.find({ where: { menuParentID: parentid } });
  }

  async update(id: number, updateMenuDto: UpdateMenuDto) {
    const isExist = await this.menuRepository.exists({
      where: {
        menuName: updateMenuDto.menuName,
        menuID: Not(id),
      },
    });

    if (isExist) {
      throw new Error('Cannot change menu name to one that already exists');
    }

    return this.menuRepository.update(id, {
      menuName: updateMenuDto.menuName,
      menuRoute: updateMenuDto.menuRoute,
      menuSort: updateMenuDto.menuSort,
    });
  }

  remove(id: number) {
    return this.menuRepository
      .createQueryBuilder()
      .delete()
      .where('menuID = :id OR menuParentID = :id', { id })
      .execute();
  }
}
