import { Injectable, ConflictException } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuRepository } from './menu.repository';

@Injectable()
export class MenuService {
  constructor(private readonly menuRepository: MenuRepository) {}

  async create(createMenuDto: CreateMenuDto) {
    if (await this.menuRepository.existsByName(createMenuDto.menuName)) {
      throw new ConflictException('Menu already exists');
    }

    return this.menuRepository.insert({
      menuName: createMenuDto.menuName,
      menuRoute: createMenuDto.menuRoute,
      menuSort: createMenuDto.menuSort,
      menuParentID: BigInt(createMenuDto.menuParentId ?? 0),
      postBy: createMenuDto.postBy,
    });
  }

  findAllParent() {
    return this.menuRepository.findParents();
  }

  findAllChild(parentid: bigint) {
    return this.menuRepository.findChildren(parentid);
  }

  async update(id: number, updateMenuDto: UpdateMenuDto) {
    // if menuName exist, then check, if not no need.
    if (updateMenuDto.menuName && (await this.menuRepository.existsByName(updateMenuDto.menuName, id))) {
      throw new ConflictException('Cannot change menu name to one that already exists');
    }

    const affected = await this.menuRepository.update(id, {
      menuName: updateMenuDto.menuName,
      menuRoute: updateMenuDto.menuRoute,
      menuSort: updateMenuDto.menuSort,
    });
    return { affected };
  }

  async remove(id: number) {
    return { affected: await this.menuRepository.deleteWithChildren(id) };
  }
}
